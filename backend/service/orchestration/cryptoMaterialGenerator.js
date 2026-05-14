const fs = require("fs-extra");
const path = require("path");
const logger = require("../../utils/logger");
const { execAsync } = require("../../utils/execAsync");

function getFabricCaImage() {
  const fabricCAVersion = process.env.FABRIC_CA_VERSION || "1.5";
  return `hyperledger/fabric-ca:${fabricCAVersion}`;
}

function getProjectNetwork(userId) {
  return `fabric-${userId}`;
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function safeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "-");
}

function secretFor(id) {
  const cleaned = safeId(id);
  return `${cleaned}pw`;
}

async function assertFileExists(filePath, hint) {
  const exists = await fs.pathExists(filePath);
  if (!exists) {
    throw new Error(`${hint || "Required file missing"}: ${filePath}`);
  }
}

async function normalizeTlsDir(tlsDir) {
  // Copilot note: Fabric runtime expects stable filenames (key.pem, cert.pem, tls-cert.pem).
  const keystoreDir = path.join(tlsDir, "keystore");
  const signcertsDir = path.join(tlsDir, "signcerts");
  const tlscacertsDir = path.join(tlsDir, "tlscacerts");

  const keyFiles = (await fs.pathExists(keystoreDir))
    ? await fs.readdir(keystoreDir)
    : [];
  const certFiles = (await fs.pathExists(signcertsDir))
    ? await fs.readdir(signcertsDir)
    : [];
  const caFiles = (await fs.pathExists(tlscacertsDir))
    ? await fs.readdir(tlscacertsDir)
    : [];

  if (keyFiles.length) {
    const src = path.join(keystoreDir, keyFiles[0]);
    await fs.copy(src, path.join(keystoreDir, "key.pem"));
  }
  if (certFiles.length) {
    const src = path.join(signcertsDir, certFiles[0]);
    await fs.copy(src, path.join(signcertsDir, "cert.pem"));
  }
  if (caFiles.length) {
    const src = path.join(tlscacertsDir, caFiles[0]);
    await fs.copy(src, path.join(tlscacertsDir, "tls-cert.pem"));
  }
}

async function normalizeMspDir(mspDir) {
  // Copilot note: provide deterministic CA cert filenames and NodeOUs config to reduce downstream tooling assumptions.
  const cacertsDir = path.join(mspDir, "cacerts");
  const tlscacertsDir = path.join(mspDir, "tlscacerts");

  const caFiles = (await fs.pathExists(cacertsDir))
    ? await fs.readdir(cacertsDir)
    : [];
  const tlsCaFiles = (await fs.pathExists(tlscacertsDir))
    ? await fs.readdir(tlscacertsDir)
    : [];

  if (caFiles.length) {
    await fs.copy(
      path.join(cacertsDir, caFiles[0]),
      path.join(cacertsDir, "ca-cert.pem"),
    );
  }
  if (tlsCaFiles.length) {
    await fs.copy(
      path.join(tlscacertsDir, tlsCaFiles[0]),
      path.join(tlscacertsDir, "tls-ca-cert.pem"),
    );
  }

  const configYamlPath = path.join(mspDir, "config.yaml");
  const hasConfigYaml = await fs.pathExists(configYamlPath);
  if (!hasConfigYaml && caFiles.length) {
    const nodeOus = [
      "NodeOUs:",
      "  Enable: true",
      "  ClientOUIdentifier:",
      "    Certificate: cacerts/ca-cert.pem",
      "    OrganizationalUnitIdentifier: client",
      "  PeerOUIdentifier:",
      "    Certificate: cacerts/ca-cert.pem",
      "    OrganizationalUnitIdentifier: peer",
      "  AdminOUIdentifier:",
      "    Certificate: cacerts/ca-cert.pem",
      "    OrganizationalUnitIdentifier: admin",
      "  OrdererOUIdentifier:",
      "    Certificate: cacerts/ca-cert.pem",
      "    OrganizationalUnitIdentifier: orderer",
      "",
    ].join("\n");
    await fs.writeFile(configYamlPath, nodeOus);
  }
}

async function runFabricCaClient(
  workspace,
  userId,
  clientHomeRel,
  args,
  env = {},
) {
  const img = getFabricCaImage();
  const network = getProjectNetwork(userId);
  const clientHome = `/workspace/${clientHomeRel}`.replace(/\/+/g, "/");
  const envArgs = Object.entries(env)
    .map(([k, v]) => `-e ${k}=${shellQuote(v)}`)
    .join(" ");

  const cmd = [
    "docker run --rm",
    `--network ${network}`,
    `-v "${workspace}:/workspace"`,
    envArgs,
    `-e FABRIC_CA_CLIENT_HOME=${shellQuote(clientHome)}`,
    "--workdir /workspace",
    img,
    "bash -lc",
    shellQuote(`set -euo pipefail\n${args}`),
  ]
    .filter(Boolean)
    .join(" ");

  return execAsync(cmd);
}

async function enroll(
  workspace,
  userId,
  clientHomeRel,
  enrollUrl,
  tlsCertFileRel,
  mspOutRel,
  extraArgs = "",
) {
  const tlsCertFile = `/workspace/${tlsCertFileRel}`;
  const mspOut = `/workspace/${mspOutRel}`;
  await runFabricCaClient(
    workspace,
    userId,
    clientHomeRel,
    `fabric-ca-client enroll -u ${shellQuote(enrollUrl)} --tls.certfiles ${shellQuote(tlsCertFile)} -M ${shellQuote(mspOut)} ${extraArgs}`,
  );
}

async function registerIdentity(
  workspace,
  userId,
  clientHomeRel,
  caUrl,
  tlsCertFileRel,
  idName,
  idSecret,
  idType,
) {
  const tlsCertFile = `/workspace/${tlsCertFileRel}`;
  await runFabricCaClient(
    workspace,
    userId,
    clientHomeRel,
    `fabric-ca-client register --id.name ${shellQuote(idName)} --id.secret ${shellQuote(idSecret)} --id.type ${shellQuote(idType)} -u ${shellQuote(caUrl)} --tls.certfiles ${shellQuote(tlsCertFile)}`,
  );
}

async function generateCryptoMaterial(workspace, userId, config, opts = {}) {
  /* 
    TODO:
    - bootstrap TLS CA
    - bootstrap Orderer CA
    - enroll Orderer CA Admin
    - build Orderer Org's Identity
    - store private keys to vault
    */

  const progress = opts.progress;
  const channelId =
    config && config.channelId ? config.channelId : "mainchannel";

  if (!workspace || !userId) {
    throw new Error(
      "generateCryptoMaterial requires (workspace, userId, config)",
    );
  }

  // Copilot note: ensure base directories exist so later steps can write deterministically.
  await fs.ensureDir(path.join(workspace, "crypto-config"));
  await fs.ensureDir(path.join(workspace, "channel-artifacts"));

  const tlsCaCertRel = "crypto-config/tls-ca/ca-cert.pem";
  const ordererCaCertRel = "crypto-config/ordererOrg/ca/ca-cert.pem";

  await assertFileExists(
    path.join(workspace, tlsCaCertRel),
    "TLS-CA server cert not found (is composeUpCA running?)",
  );
  await assertFileExists(
    path.join(workspace, ordererCaCertRel),
    "Orderer CA server cert not found (is composeUpCA running?)",
  );

  for (const org of config.orgs || []) {
    await assertFileExists(
      path.join(workspace, `crypto-config/${org.name}/ca/ca-cert.pem`),
      `Org CA server cert not found for ${org.name}`,
    );
  }

  const tlsCaUrl = `https://tls-ca-${userId}:${config.tlsCaPort}`;
  const ordererCaUrl = `https://ca-orderer-${userId}:${config.ordererCaPort}`;

  const clientRoot = "crypto-config/.ca-client";

  if (typeof progress === "function")
    progress({ step: "crypto.enroll.tlsCaAdmin", channelId });
  logger.debug("[DEBUG] crypto: enrolling TLS CA admin");

  await enroll(
    workspace,
    userId,
    `${clientRoot}/tls-ca-admin`,
    `https://tls-admin:tls-adminpw@tls-ca-${userId}:${config.tlsCaPort}`,
    tlsCaCertRel,
    `${clientRoot}/tls-ca-admin/msp`,
  );

  // Register + enroll TLS certs for peers
  for (const org of config.orgs || []) {
    for (let i = 0; i < org.peerCount; i++) {
      const idName = `${org.name}-peer${i}`;
      const idSecret = secretFor(idName);
      try {
        await registerIdentity(
          workspace,
          userId,
          `${clientRoot}/tls-ca-admin`,
          tlsCaUrl,
          tlsCaCertRel,
          idName,
          idSecret,
          "peer",
        );
      } catch (err) {
        // Copilot note: registration is idempotent-ish; treat 'already registered' as non-fatal.
        if (!/already registered|exists/i.test(err.message)) throw err;
      }

      const tlsOutRel = `crypto-config/${org.name}/peers/peer${i}/tls`;
      const hosts = [
        `--csr.hosts peer${i}.${org.name}`,
        `--csr.hosts peer${i}-${org.name}-${userId}`,
        `--csr.hosts localhost`,
        `--csr.hosts 127.0.0.1`,
      ].join(" ");

      if (typeof progress === "function")
        progress({ step: "crypto.enroll.peerTls", org: org.name, peer: i });
      await enroll(
        workspace,
        userId,
        `${clientRoot}/tls-peer-${org.name}-peer${i}`,
        `https://${idName}:${idSecret}@tls-ca-${userId}:${config.tlsCaPort}`,
        tlsCaCertRel,
        tlsOutRel,
        `--enrollment.profile tls ${hosts}`,
      );
      await normalizeTlsDir(path.join(workspace, tlsOutRel));
    }
  }

  // Register + enroll TLS certs for orderers
  const ordererCount = config.ordererCount || 1;
  for (let i = 0; i < ordererCount; i++) {
    const ordererLabel = i === 0 ? "orderer" : `orderer${i + 1}`;
    const idName = ordererLabel;
    const idSecret = secretFor(idName);

    try {
      await registerIdentity(
        workspace,
        userId,
        `${clientRoot}/tls-ca-admin`,
        tlsCaUrl,
        tlsCaCertRel,
        idName,
        idSecret,
        "orderer",
      );
    } catch (err) {
      if (!/already registered|exists/i.test(err.message)) throw err;
    }

    const tlsOutRel = `crypto-config/ordererOrg/orderers/${ordererLabel}/tls`;
    const hosts = [
      `--csr.hosts ${ordererLabel}`,
      `--csr.hosts ${ordererLabel}-${userId}`,
      `--csr.hosts localhost`,
      `--csr.hosts 127.0.0.1`,
    ].join(" ");

    if (typeof progress === "function")
      progress({ step: "crypto.enroll.ordererTls", orderer: ordererLabel });
    await enroll(
      workspace,
      userId,
      `${clientRoot}/tls-orderer-${ordererLabel}`,
      `https://${idName}:${idSecret}@tls-ca-${userId}:${config.tlsCaPort}`,
      tlsCaCertRel,
      tlsOutRel,
      `--enrollment.profile tls ${hosts}`,
    );
    await normalizeTlsDir(path.join(workspace, tlsOutRel));
  }

  // Enroll Orderer CA admin
  if (typeof progress === "function")
    progress({ step: "crypto.enroll.ordererCaAdmin" });
  logger.debug("[DEBUG] crypto: enrolling Orderer CA admin");
  await enroll(
    workspace,
    userId,
    `${clientRoot}/orderer-ca-admin`,
    `https://ordereradmin:ordereradminpw@ca-orderer-${userId}:${config.ordererCaPort}`,
    ordererCaCertRel,
    `${clientRoot}/orderer-ca-admin/msp`,
  );

  // Register + enroll orderer org admin
  const ordererOrgAdminId = "ordererOrg-admin";
  const ordererOrgAdminSecret = secretFor(ordererOrgAdminId);
  try {
    await registerIdentity(
      workspace,
      userId,
      `${clientRoot}/orderer-ca-admin`,
      ordererCaUrl,
      ordererCaCertRel,
      ordererOrgAdminId,
      ordererOrgAdminSecret,
      "admin",
    );
  } catch (err) {
    if (!/already registered|exists/i.test(err.message)) throw err;
  }
  if (typeof progress === "function")
    progress({ step: "crypto.enroll.ordererOrgAdmin" });
  await enroll(
    workspace,
    userId,
    `${clientRoot}/orderer-org-admin`,
    `https://${ordererOrgAdminId}:${ordererOrgAdminSecret}@ca-orderer-${userId}:${config.ordererCaPort}`,
    ordererCaCertRel,
    `crypto-config/ordererOrg/users/Admin@ordererOrg/msp`,
  );
  await normalizeMspDir(
    path.join(workspace, "crypto-config/ordererOrg/users/Admin@ordererOrg/msp"),
  );

  // Build OrdererOrg MSPDir referenced by configtx.yaml
  if (typeof progress === "function")
    progress({ step: "crypto.enroll.ordererOrgMsp" });
  await enroll(
    workspace,
    userId,
    `${clientRoot}/orderer-org-admin`,
    `https://${ordererOrgAdminId}:${ordererOrgAdminSecret}@ca-orderer-${userId}:${config.ordererCaPort}`,
    ordererCaCertRel,
    `crypto-config/ordererOrg/msp`,
  );
  await normalizeMspDir(path.join(workspace, "crypto-config/ordererOrg/msp"));

  // Register + enroll orderers MSP
  for (let i = 0; i < ordererCount; i++) {
    const ordererLabel = i === 0 ? "orderer" : `orderer${i + 1}`;
    const idName = `${ordererLabel}-msp`;
    const idSecret = secretFor(idName);
    try {
      await registerIdentity(
        workspace,
        userId,
        `${clientRoot}/orderer-ca-admin`,
        ordererCaUrl,
        ordererCaCertRel,
        idName,
        idSecret,
        "orderer",
      );
    } catch (err) {
      if (!/already registered|exists/i.test(err.message)) throw err;
    }
    if (typeof progress === "function")
      progress({ step: "crypto.enroll.ordererMsp", orderer: ordererLabel });
    await enroll(
      workspace,
      userId,
      `${clientRoot}/orderer-${ordererLabel}-msp`,
      `https://${idName}:${idSecret}@ca-orderer-${userId}:${config.ordererCaPort}`,
      ordererCaCertRel,
      `crypto-config/ordererOrg/orderers/${ordererLabel}/msp`,
    );
    await normalizeMspDir(
      path.join(
        workspace,
        `crypto-config/ordererOrg/orderers/${ordererLabel}/msp`,
      ),
    );
  }

  // Orgs: enroll CA admins, register/enroll peers + org admins
  for (const org of config.orgs || []) {
    const orgCaUrl = `https://ca-${org.name}-${userId}:${org.caPort}`;
    const orgCaCertRel = `crypto-config/${org.name}/ca/ca-cert.pem`;
    const orgAdminEnrollUser = `${org.name}admin`;
    const orgAdminEnrollPass = `${org.name}adminpw`;

    if (typeof progress === "function")
      progress({ step: "crypto.enroll.orgCaAdmin", org: org.name });
    await enroll(
      workspace,
      userId,
      `${clientRoot}/org-ca-admin-${org.name}`,
      `https://${orgAdminEnrollUser}:${orgAdminEnrollPass}@ca-${org.name}-${userId}:${org.caPort}`,
      orgCaCertRel,
      `${clientRoot}/org-ca-admin-${org.name}/msp`,
    );

    const orgAdminId = `${org.name}-admin`;
    const orgAdminSecret = secretFor(orgAdminId);
    try {
      await registerIdentity(
        workspace,
        userId,
        `${clientRoot}/org-ca-admin-${org.name}`,
        orgCaUrl,
        orgCaCertRel,
        orgAdminId,
        orgAdminSecret,
        "admin",
      );
    } catch (err) {
      if (!/already registered|exists/i.test(err.message)) throw err;
    }

    if (typeof progress === "function")
      progress({ step: "crypto.enroll.orgAdmin", org: org.name });
    await enroll(
      workspace,
      userId,
      `${clientRoot}/org-admin-${org.name}`,
      `https://${orgAdminId}:${orgAdminSecret}@ca-${org.name}-${userId}:${org.caPort}`,
      orgCaCertRel,
      `crypto-config/${org.name}/users/Admin@${org.name}/msp`,
    );
    await normalizeMspDir(
      path.join(
        workspace,
        `crypto-config/${org.name}/users/Admin@${org.name}/msp`,
      ),
    );

    // Org MSPDir referenced by configtx.yaml
    if (typeof progress === "function")
      progress({ step: "crypto.enroll.orgMsp", org: org.name });
    await enroll(
      workspace,
      userId,
      `${clientRoot}/org-admin-${org.name}`,
      `https://${orgAdminId}:${orgAdminSecret}@ca-${org.name}-${userId}:${org.caPort}`,
      orgCaCertRel,
      `crypto-config/${org.name}/msp`,
    );
    await normalizeMspDir(
      path.join(workspace, `crypto-config/${org.name}/msp`),
    );

    for (let i = 0; i < org.peerCount; i++) {
      const peerId = `${org.name}-peer${i}-msp`;
      const peerSecret = secretFor(peerId);
      try {
        await registerIdentity(
          workspace,
          userId,
          `${clientRoot}/org-ca-admin-${org.name}`,
          orgCaUrl,
          orgCaCertRel,
          peerId,
          peerSecret,
          "peer",
        );
      } catch (err) {
        if (!/already registered|exists/i.test(err.message)) throw err;
      }
      if (typeof progress === "function")
        progress({ step: "crypto.enroll.peerMsp", org: org.name, peer: i });
      await enroll(
        workspace,
        userId,
        `${clientRoot}/org-peer-${org.name}-peer${i}`,
        `https://${peerId}:${peerSecret}@ca-${org.name}-${userId}:${org.caPort}`,
        orgCaCertRel,
        `crypto-config/${org.name}/peers/peer${i}/msp`,
      );
      await normalizeMspDir(
        path.join(workspace, `crypto-config/${org.name}/peers/peer${i}/msp`),
      );
    }
  }

  logger.info(
    `[INFO] Crypto material generated for ${getProjectNetwork(userId)} (${channelId})`,
  );
  if (typeof progress === "function")
    progress({ step: "crypto.done", channelId });
}

module.exports = { generateCryptoMaterial };
