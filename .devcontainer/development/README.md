## Hyperledger Fabric Binaries and Configurations

```
/usr/local/fabric
├── bin
│   ├── configtxgen
│   ├── configtxlator
│   ├── cryptogen
│   ├── discover
│   ├── fabric-ca-client
│   ├── fabric-ca-server
│   ├── ledgerutil
│   ├── orderer
│   ├── osnadmin
│   └── peer
└── config
    ├── configtx.yaml
    ├── core.yaml
    └── orderer.yaml

2 directories, 13 files
```

## Certificate Authority Client
**DISCLAIMER:** This directory should be a sub directory of `/usr/local/fabric`. However, due to permission issues and ease-of-use, this directory is moved to the current workspace. Check out the [production version of the Certificate Authority setup](production/prodFabricCA.sh)
```
/workspaces/LINAW/fabric-ca-client
├── fabric-ca-client
├── fabric-ca-client-config.yaml
├── intermediate-ca
├── org1-ca
├── tls-ca
│   └── tlsadmin
│       └── msp
│           ├── cacerts
│           ├── IssuerPublicKey
│           ├── IssuerRevocationPublicKey
│           ├── keystore
│           │   ├── REDACTED_sk
│           │   ├── REDACTED_sk
│           │   └── REDACTED_sk
│           ├── signcerts
│           │   └── cert.pem
│           ├── tlscacerts
│           │   └── tls-localhost-7054.pem
│           └── user
└── tls-root-cert
    └── tls-ca-cert.pem

11 directories, 10 files
```

## Certificate Authority Server TLS
**DISCLAIMER:** This directory should be a sub directory of `/usr/local/fabric`. However, due to permission issues and ease-of-use, this directory is moved to the current workspace. Check out the [production version of the Certificate Authority setup](production/prodFabricCA.sh)
```
/workspaces/LINAW/fabric-ca-server-tls
├── ca-cert.pem
├── ca-server-tls.log
├── ca-server-tls.pid
├── fabric-ca-server
├── fabric-ca-server-config.yaml
├── fabric-ca-server-config.yaml.bak
├── fabric-ca-server.db
├── IssuerPublicKey
├── IssuerRevocationPublicKey
├── msp
│   ├── cacerts
│   ├── keystore
│   │   ├── 10a0825ba165aa6317adbf80468f751b4d8c23e66e6fc265edee9cc5ac7c7412_sk
│   │   ├── af50acdf5250b82d9ca863cc399a149714161d05893c7725f6feba4a3ff19082_sk
│   │   ├── IssuerRevocationPrivateKey
│   │   └── IssuerSecretKey
│   ├── signcerts
│   └── user
└── tls-cert.pem

5 directories, 14 files
```