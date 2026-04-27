import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(configDir, "..");
const backendDir = path.resolve(srcDir, "..");
const repoRoot = path.resolve(backendDir, "..");

const fabricSamplesDir =
  process.env.FABRIC_SAMPLES_DIR ?? path.resolve(repoRoot, "fabric-samples");

export const peerConfig = {
  testNetworkDir:
    process.env.FABRIC_TEST_NETWORK_DIR ??
    path.resolve(fabricSamplesDir, "test-network"),
  fabricDockerPeer: process.env.FABRIC_DOCKER_PEER ?? "docker exec",
  allowedContainerNames: new Set([
    "ca_org1",
    "ca_org2",
    "ca_orderer",
    "peer0.org1.example.com",
    "peer0.org2.example.com",
    "orderer.example.com",
  ]),
};
