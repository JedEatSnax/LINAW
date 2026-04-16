const yaml = require('js-yaml');

/*
TODO:
 - change hardcoded username and pass
 - add option for different orderer type (Raft / BFT)
 - maybe admins can configure policies? (still not sure)
 - implement vault (sercret management)
*/

/* 
NOTE:
  generateConfigtx:
  - it acts like a template that will be used for configtxgen later for genesis block and channel creation 
  - it bassicaly lists all orgs, define the policies and permission (reader, writer, admin, endorser),
    create a raft orderer consortium, create a main channel that joins all orgs.
  
  generateDockerCompose:
  - it creates a docker to spin up the network.
  - it creates a single TLS-CA, 1 Orderer CA, (1 Orderer and 1 or more peers for each org and 1 statedatabase),
    1 or more Orderer Node for Raft, and connect all on a single docker network 
*/

// Default config
function applyDefaults(config) {
  return {
    consensus: 'etcdraft',
    channelPolicy: 'MAJORITY',
    stateDb: 'couchdb',
    ordererCount: 1,
    resources: {
      peer: { cpus: '0.5', memory: '512M' },
      orderer: { cpus: '0.25', memory: '256M' },
      ca: { cpus: '0.1', memory: '128M' },
    },
    ...config,
    resources: {
      peer: { cpus: '0.5', memory: '512M' },
      orderer: { cpus: '0.25', memory: '256M' },
      ca: { cpus: '0.1', memory: '128M' },
      ...(config.resources || {}),
    },
  };
}

// configtx.yaml 
function generateConfigtx(rawConfig) {
  const config = applyDefaults(rawConfig);

  const orgDefs = config.orgs.map(org => ({
    Name: org.name,
    ID: org.mspId,
    MSPDir: `crypto-config/${org.name}/msp`,
    Policies: {
      Readers: { Type: 'Signature', Rule: `OR('${org.mspId}.admin', '${org.mspId}.peer', '${org.mspId}.client')` },
      Writers: { Type: 'Signature', Rule: `OR('${org.mspId}.admin', '${org.mspId}.client')` },
      Admins: { Type: 'Signature', Rule: `OR('${org.mspId}.admin')` },
      Endorsement: { Type: 'Signature', Rule: `OR('${org.mspId}.peer')` },
    },
    AnchorPeers: [{ Host: `peer0.${org.name}`, Port: org.peerPort }],
  }));

  const ordererOrg = {
    Name: 'OrdererOrg',
    ID: 'OrdererMSP',
    MSPDir: 'crypto-config/ordererOrg/msp',
    Policies: {
      Readers: { Type: 'Signature', Rule: `OR('OrdererMSP.member')` },
      Writers: { Type: 'Signature', Rule: `OR('OrdererMSP.member')` },
      Admins: { Type: 'Signature', Rule: `OR('OrdererMSP.admin')` },
    },
  };
  const ordererCount = config.ordererCount || 1;
  const consenters = Array.from({ length: ordererCount }, (_, i) => ({
    Host: i === 0 ? 'orderer' : `orderer${i + 1}`,
    Port: 7050,
    ClientTLSCert: `crypto-config/ordererOrg/orderers/${i === 0 ? 'orderer' : `orderer${i + 1}`}/tls/signcerts/cert.pem`,
    ServerTLSCert: `crypto-config/ordererOrg/orderers/${i === 0 ? 'orderer' : `orderer${i + 1}`}/tls/signcerts/cert.pem`,
  }));

  const ordererAddresses = Array.from({ length: ordererCount }, (_, i) =>
    i === 0 ? 'orderer:7050' : `orderer${i + 1}:7050`
  );
  const endorsementRule =
    config.channelPolicy === 'ALL' ? { Type: 'ImplicitMeta', Rule: 'ALL Writer' } :
      config.channelPolicy === 'ANY' ? { Type: 'ImplicitMeta', Rule: 'ANY Writer' } :
        { Type: 'ImplicitMeta', Rule: 'MAJORITY Writer' };
  const ordererSection = {
    OrdererType: config.consensus,
    Addresses: ordererAddresses,
    BatchTimeout: '2s',
    BatchSize: {
      MaxMessageCount: 10,
      AbsoluteMaxBytes: '99 MB',
      PreferredMaxBytes: '512 KB',
    },
    EtcdRaft: { Consenters: consenters },
    Organizations: [ordererOrg],
    Policies: {
      Readers: { Type: 'ImplicitMeta', Rule: 'ANY Readers' },
      Writers: { Type: 'ImplicitMeta', Rule: 'ANY Writers' },
      Admins: { Type: 'ImplicitMeta', Rule: 'MAJORITY Admins' },
      BlockValidation: { Type: 'ImplicitMeta', Rule: 'ANY Writers' },
    },
    Capabilities: { V2_0: true },
  };

  const applicationSection = {
    Organizations: orgDefs,
    Capabilities: { V2_0: true },
    Policies: {
      Readers: { Type: 'ImplicitMeta', Rule: 'ANY Readers' },
      Writers: { Type: 'ImplicitMeta', Rule: 'ANY Writers' },
      Admins: { Type: 'ImplicitMeta', Rule: 'MAJORITY Admins' },
      LifecycleEndorsement: { Type: 'ImplicitMeta', Rule: 'MAJORITY Endorsement' },
      Endorsement: endorsementRule,
    },
  };

  logger.debug(`[DEBUG] configtxgen: ${ordererCount} orderer(s), consensus=${config.consensus}, policy=${config.channelPolicy}`);

  return yaml.dump({
    Organizations: [ordererOrg, ...orgDefs],

    Capabilities: {
      Channel: { V2_0: true },
      Orderer: { V2_0: true },
      Application: { V2_0: true },
    },

    Application: applicationSection,
    Orderer: ordererSection,

    Channel: {
      Policies: {
        Readers: { Type: 'ImplicitMeta', Rule: 'ANY Readers' },
        Writers: { Type: 'ImplicitMeta', Rule: 'ANY Writers' },
        Admins: { Type: 'ImplicitMeta', Rule: 'MAJORITY Admins' },
      },
      Capabilities: { V2_0: true },
    },

    Profiles: {
      OrdererGenesis: {
        Orderer: ordererSection,
        Consortiums: { MainConsortium: { Organizations: orgDefs } },
      },
      MainChannel: {
        Consortium: 'MainConsortium',
        Application: applicationSection,
      },
    },
  });
}

// docker-compose.yml
function generateDockerCompose(userId, rawConfig) {
  const config = applyDefaults(rawConfig);

  const net = `fabric-${userId}`;
  const services = {};
  const volumes = {};

  const fabricVersion = process.env.FABRIC_VERSION || '2.5';
  const fabricCAVersion = process.env.FABRIC_CA_VERSION || '1.5';
  const useCouchDB = (config.stateDb || 'couchdb' === 'couchdb');
  const res = config.resources;

  function resourceLimits(type) {
    const r = res[type];
    if (!r) return undefined;
    return { limits: { cpus: r.cpus, memory: r.memory } };
  }
  const logConfig = {
    driver: 'json-file',
    options: { 'max-size': '10m', 'max-file': '3' },
  };

  // TLS CA
  services[`tls-ca-${userId}`] = {
    image: `hyperledger/fabric-ca:${fabricCAVersion}`,
    container_name: `tls-ca-${userId}`,
    environment: [
      'FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server',
      'FABRIC_CA_SERVER_CA_NAME=tls-ca',
      'FABRIC_CA_SERVER_TLS_ENABLED=true',
      `FABRIC_CA_SERVER_PORT=${config.tlsCaPort}`,
      `FABRIC_CA_SERVER_OPERATIONS_LISTENADDRESS=0.0.0.0:1${config.tlsCaPort}`,
      // Bootstrap credentials from environment — override in production
      'FABRIC_CA_SERVER_BOOTSTRAP_USER=tls-admin',
      'FABRIC_CA_SERVER_BOOTSTRAP_PASS=tls-adminpw',
    ],
    command: `fabric-ca-server start -b tls-admin:tls-adminpw --port ${config.tlsCaPort}`,
    ports: [`${config.tlsCaPort}:${config.tlsCaPort}`],
    volumes: [`./crypto-config/tls-ca:/etc/hyperledger/fabric-ca-server`],
    networks: [net],
    logging: logConfig,
    deploy: { resources: resourceLimits('ca') },
    restart: 'unless-stopped',
    healthcheck: {
      test: [`CMD-SHELL`, `curl -sk https://localhost:${config.tlsCaPort}/cainfo || exit 1`],
      interval: '10s',
      timeout: '5s',
      retries: 5,
      start_period: '10s',
    },
  };

  // Orderer CA 
  services[`ca-orderer-${userId}`] = {
    image: `hyperledger/fabric-ca:${fabricCAVersion}`,
    container_name: `ca-orderer-${userId}`,
    environment: [
      'FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server',
      'FABRIC_CA_SERVER_CA_NAME=ca-orderer',
      'FABRIC_CA_SERVER_TLS_ENABLED=true',
      `FABRIC_CA_SERVER_PORT=${config.ordererCaPort}`,
    ],
    command: `fabric-ca-server start -b ordereradmin:ordereradminpw --port ${config.ordererCaPort}`,
    ports: [`${config.ordererCaPort}:${config.ordererCaPort}`],
    volumes: [`./crypto-config/ordererOrg/ca:/etc/hyperledger/fabric-ca-server`],
    networks: [net],
    logging: logConfig,
    deploy: { resources: resourceLimits('ca') },
    restart: 'unless-stopped',
    healthcheck: {
      test: [`CMD-SHELL`, `curl -sk https://localhost:${config.ordererCaPort}/cainfo || exit 1`],
      interval: '10s',
      timeout: '5s',
      retries: 5,
      start_period: '10s',
    },
  };

  // Org CAs + Peers
  config.orgs.forEach(org => {
    services[`ca-${org.name}-${userId}`] = {
      image: `hyperledger/fabric-ca:${fabricCAVersion}`,
      container_name: `ca-${org.name}-${userId}`,
      environment: [
        'FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server',
        `FABRIC_CA_SERVER_CA_NAME=ca-${org.name}`,
        'FABRIC_CA_SERVER_TLS_ENABLED=true',
        `FABRIC_CA_SERVER_PORT=${org.caPort}`,
      ],
      command: `fabric-ca-server start -b ${org.name}admin:${org.name}adminpw --port ${org.caPort}`,
      ports: [`${org.caPort}:${org.caPort}`],
      volumes: [`./crypto-config/${org.name}/ca:/etc/hyperledger/fabric-ca-server`],
      networks: [net],
      logging: logConfig,
      deploy: { resources: resourceLimits('ca') },
      restart: 'unless-stopped',
      healthcheck: {
        test: [`CMD-SHELL`, `curl -sk https://localhost:${org.caPort}/cainfo || exit 1`],
        interval: '10s',
        timeout: '5s',
        retries: 5,
        start_period: '10s',
      },
    };

    // Peers
    for (let i = 0; i < org.peerCount; i++) {
      const peerName = `peer${i}-${org.name}-${userId}`;
      const peerPort = org.peerPort + i * 10;
      const peerEnv = [
        `CORE_PEER_ID=peer${i}.${org.name}`,
        `CORE_PEER_ADDRESS=peer${i}.${org.name}:${peerPort}`,
        `CORE_PEER_LISTENADDRESS=0.0.0.0:${peerPort}`,
        `CORE_PEER_CHAINCODEADDRESS=peer${i}.${org.name}:${peerPort + 1}`,
        `CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:${peerPort + 1}`,
        `CORE_PEER_GOSSIP_BOOTSTRAP=peer0.${org.name}:${org.peerPort}`,
        `CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer${i}.${org.name}:${peerPort}`,
        `CORE_PEER_LOCALMSPID=${org.mspId}`,
        'CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/fabric/msp',
        'CORE_PEER_TLS_ENABLED=true',
        'CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/signcerts/cert.pem',
        'CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/keystore/key.pem',
        'CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/tlscacerts/tls-cert.pem',
        'CORE_OPERATIONS_LISTENADDRESS=0.0.0.0:9443',
        'CORE_METRICS_PROVIDER=prometheus',
        `FABRIC_LOGGING_SPEC=${process.env.NODE_ENV === 'production' ? 'INFO' : 'INFO:cauthdsl,configtx,msp,policies,lifecycle,endorser=WARNING'}`,
      ];

      // CouchDB or LevelDB 
      const peerDependsOn = [`ca-${org.name}-${userId}`];
      if (useCouchDB) {
        const couchName = `couchdb-${peerName}`;
        volumes[peerName] = {};

        services[couchName] = {
          image: 'couchdb:3.3',
          container_name: couchName,
          environment: [
            'COUCHDB_USER=admin',
            'COUCHDB_PASSWORD=password',
          ],
          volumes: [`${couchName}:/opt/couchdb/data`],
          networks: [net],
          logging: logConfig,
          restart: 'unless-stopped',
          healthcheck: {
            test: [`CMD-SHELL`, `curl -sf http://admin:password@localhost:5984/ || exit 1`],
            interval: '10s',
            timeout: '5s',
            retries: 5,
            start_period: '10s',
          },
        };

        volumes[couchName] = {};
        peerDependsOn.push(couchName);

        peerEnv.push(
          'CORE_LEDGER_STATE_STATEDATABASE=CouchDB',
          `CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb-${peerName}:5984`,
          'CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=admin',
          'CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=password',
        );
      } else {
        // LevelDB 
        peerEnv.push('CORE_LEDGER_STATE_STATEDATABASE=goleveldb');
        volumes[peerName] = {};
      }

      services[peerName] = {
        image: `hyperledger/fabric-peer:${fabricVersion}`,
        container_name: peerName,
        environment: peerEnv,
        depends_on: peerDependsOn,
        ports: [`${peerPort}:${peerPort}`, `${19443 + i}:9443`],
        volumes: [
          `./crypto-config/${org.name}/peers/peer${i}/msp:/etc/hyperledger/fabric/msp`,
          `./crypto-config/${org.name}/peers/peer${i}/tls:/etc/hyperledger/fabric/tls`,
          `${peerName}:/var/hyperledger/production`,
        ],
        networks: [net],
        logging: logConfig,
        deploy: { resources: resourceLimits('peer') },
        restart: 'unless-stopped',
        healthcheck: {
          test: [`CMD-SHELL`, `curl -sf http://localhost:9443/healthz || exit 1`],
          interval: '15s',
          timeout: '5s',
          retries: 5,
          start_period: '30s',
        },
      };
    }
  });

  // Multi-orderer Raft
  const ordererCount = config.ordererCount || 1;
  const caOrdererDeps = [`ca-orderer-${userId}`];

  for (let i = 0; i < ordererCount; i++) {
    const ordererLabel = i === 0 ? 'orderer' : `orderer${i + 1}`;
    const ordererName = `${ordererLabel}-${userId}`;
    const ordererPort = config.ordererPort + i * 10;

    volumes[ordererName] = {};

    services[ordererName] = {
      image: `hyperledger/fabric-orderer:${fabricVersion}`,
      container_name: ordererName,
      environment: [
        'ORDERER_GENERAL_LISTENADDRESS=0.0.0.0',
        'ORDERER_GENERAL_LISTENPORT=7050',
        'ORDERER_GENERAL_TLS_ENABLED=true',
        'ORDERER_GENERAL_TLS_PRIVATEKEY=/etc/hyperledger/fabric/tls/keystore/key.pem',
        'ORDERER_GENERAL_TLS_CERTIFICATE=/etc/hyperledger/fabric/tls/signcerts/cert.pem',
        'ORDERER_GENERAL_TLS_ROOTCAS=[/etc/hyperledger/fabric/tls/tlscacerts/tls-cert.pem]',
        'ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE=/etc/hyperledger/fabric/tls/signcerts/cert.pem',
        'ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY=/etc/hyperledger/fabric/tls/keystore/key.pem',
        'ORDERER_GENERAL_CLUSTER_ROOTCAS=[/etc/hyperledger/fabric/tls/tlscacerts/tls-cert.pem]',
        'ORDERER_GENERAL_BOOTSTRAPMETHOD=file',
        'ORDERER_GENERAL_BOOTSTRAPFILE=/etc/hyperledger/configtx/genesis.block',
        'ORDERER_GENERAL_LOCALMSPID=OrdererMSP',
        'ORDERER_GENERAL_LOCALMSPDIR=/etc/hyperledger/fabric/msp',
        'ORDERER_OPERATIONS_LISTENADDRESS=0.0.0.0:9444',
        'ORDERER_METRICS_PROVIDER=prometheus',
        `FABRIC_LOGGING_SPEC=${process.env.NODE_ENV === 'production' ? 'INFO' : 'INFO'}`,
      ],
      depends_on: caOrdererDeps,
      ports: [`${ordererPort}:7050`, `${19444 + i}:9444`],
      volumes: [
        `./channel-artifacts:/etc/hyperledger/configtx`,
        `./crypto-config/ordererOrg/orderers/${ordererLabel}/msp:/etc/hyperledger/fabric/msp`,
        `./crypto-config/ordererOrg/orderers/${ordererLabel}/tls:/etc/hyperledger/fabric/tls`,
        `${ordererName}:/var/hyperledger/production`,
      ],
      networks: [net],
      logging: logConfig,
      deploy: { resources: resourceLimits('orderer') },
      restart: 'unless-stopped',
      healthcheck: {
        test: [`CMD-SHELL`, `curl -sf http://localhost:9444/healthz || exit 1`],
        interval: '15s',
        timeout: '5s',
        retries: 5,
        start_period: '30s',
      },
    };
  }

  logger.debug(`[DEBUG] docker-compose: ${ordererCount} orderer(s), stateDb=${config.stateDb || 'couchdb'}, orgs=${config.orgs.length}`);

  return yaml.dump({
    version: '3.7',
    networks: {
      [net]: {
        driver: 'bridge',
        ipam: {
          driver: 'default',
        },
      },
    },
    services,
    volumes,
  });
}

module.exports = { generateConfigtx, generateDockerCompose };


/*
Config schema:
{
  name:          string
  channelId:     string
  consensus:     'etcdraft'|'solo'
  channelPolicy: 'MAJORITY'|'ALL'|'ANY'
  stateDb:       'couchdb'|'leveldb'
  ordererCount:  number (1|3|5)
  tlsCaPort:     number
  ordererCaPort: number
  ordererPort:   number
  resources: {
    peer:    { cpus: string, memory: string }
    orderer: { cpus: string, memory: string }
    ca:      { cpus: string, memory: string }
  }
orgs: [{
  name:      string
  mspId:     string
  peerCount: number (1-5)
  caPort:    number
  peerPort:  number
  }]
}
*/

