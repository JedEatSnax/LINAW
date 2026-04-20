import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(backendDir, "..");
const fabricSamplesDir = process.env.FABRIC_SAMPLES_DIR ?? path.resolve(repoRoot, "fabric-samples");
const testNetworkDir = process.env.FABRIC_TEST_NETWORK_DIR ?? path.resolve(fabricSamplesDir, "test-network");
const fabricBinDir = process.env.FABRIC_BIN_DIR ?? path.resolve(fabricSamplesDir, "bin");

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

function buildPeerConfig(organization = "org1") {
  const normalizedOrganization = organization === "org2" ? "org2" : "org1";
  const peerName = normalizedOrganization === "org2" ? "peer0.org2.example.com" : "peer0.org1.example.com";
  const organizationDomain = `${normalizedOrganization}.example.com`;
  const organizationFolder = path.join(testNetworkDir, "organizations", "peerOrganizations", organizationDomain);
  const peerFolder = path.join(organizationFolder, "peers", peerName);
  const mspDir = path.join(peerFolder, "msp");
  const tlsDir = path.join(peerFolder, "tls");
  const listenPort = normalizedOrganization === "org2" ? "9051" : "7051";
  const chaincodePort = normalizedOrganization === "org2" ? "9052" : "7052";
  const operationsPort = normalizedOrganization === "org2" ? "9445" : "9444";
  const mspId = normalizedOrganization === "org2" ? "Org2MSP" : "Org1MSP";
  const binaryPath = process.env.FABRIC_PEER_BIN ?? path.join(fabricBinDir, "peer");

  return {
    organization: normalizedOrganization,
    peerName,
    binaryPath,
    env: {
      ...process.env,
      PATH: `${fabricBinDir}:${process.env.PATH ?? ""}`,
      FABRIC_CFG_PATH: process.env.FABRIC_CFG_PATH ?? path.resolve(repoRoot, "fabric-samples", "config"),
      CORE_PEER_TLS_ENABLED: "true",
      CORE_PEER_PROFILE_ENABLED: "false",
      CORE_PEER_TLS_CERT_FILE: path.join(tlsDir, "server.crt"),
      CORE_PEER_TLS_KEY_FILE: path.join(tlsDir, "server.key"),
      CORE_PEER_TLS_ROOTCERT_FILE: path.join(tlsDir, "ca.crt"),
      CORE_PEER_ID: peerName,
      CORE_PEER_ADDRESS: `${peerName}:${listenPort}`,
      CORE_PEER_LISTENADDRESS: `0.0.0.0:${listenPort}`,
      CORE_PEER_CHAINCODEADDRESS: `${peerName}:${chaincodePort}`,
      CORE_PEER_CHAINCODELISTENADDRESS: `0.0.0.0:${chaincodePort}`,
      CORE_PEER_GOSSIP_BOOTSTRAP: `${peerName}:${listenPort}`,
      CORE_PEER_GOSSIP_EXTERNALENDPOINT: `${peerName}:${listenPort}`,
      CORE_PEER_LOCALMSPID: mspId,
      CORE_PEER_MSPCONFIGPATH: mspDir,
      CORE_OPERATIONS_LISTENADDRESS: `${peerName}:${operationsPort}`,
      CORE_METRICS_PROVIDER: "prometheus"
    },
    requiredPaths: [mspDir, path.join(tlsDir, "server.crt"), path.join(tlsDir, "server.key"), path.join(tlsDir, "ca.crt")]
  };
}

function startPeerNode(organization) {
  const config = buildPeerConfig(organization);

  for (const requiredPath of config.requiredPaths) {
    if (!existsSync(requiredPath)) {
      const error = new Error(`Missing Fabric artifacts at ${requiredPath}. Run ./network.sh up first.`);
      error.statusCode = 400;
      throw error;
    }
  }

  if (!existsSync(config.binaryPath)) {
    const error = new Error(`Fabric peer binary not found at ${config.binaryPath}`);
    error.statusCode = 500;
    throw error;
  }

  const child = spawn(config.binaryPath, ["node", "start"], {
    cwd: testNetworkDir,
    env: config.env,
    detached: true,
    stdio: "ignore"
  });

  child.unref();

  return {
    pid: child.pid,
    organization: config.organization,
    peerName: config.peerName,
    command: `${config.binaryPath} node start`
  };
}

app.get("/api/v1", (_request, response) => {
  response.json({ ok: true, service: "test-backend" });
});

app.post("/api/v1/fabric/peer/start", (request, response) => {
  try {
    const { organization } = request.body ?? {};
    const startedPeer = startPeerNode(organization);

    response.status(202).json({
      ok: true,
      message: "peer node start launched",
      ...startedPeer
    });
  } catch (error) {
    response.status(error.statusCode ?? 500).json({
      ok: false,
      error: error.message ?? "Unable to start peer node"
    });
  }
});

app.listen(port, () => {
  console.log(`test-backend listening on http://localhost:${port}`);
});