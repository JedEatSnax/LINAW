#!/usr/bin/env bash
set -euo pipefail

# Minimal Ubuntu provisioning for production-like Fabric development.
sudo apt-get update
sudo apt-get install -y --no-install-recommends jq curl ca-certificates git openssl tar

WORKSPACE_DIR="${WORKSPACE_FOLDER:-/workspaces/LINAW}"
FABRIC_VERSION="${FABRIC_VERSION:-2.5.12}"
FABRIC_CA_VERSION="${FABRIC_CA_VERSION:-1.5.15}"
INSTALL_ROOT="/usr/local/fabric"
BIN_DIR="${INSTALL_ROOT}/bin"
CONFIG_DIR="${INSTALL_ROOT}/config"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

ARCH="$(dpkg --print-architecture)"
case "${ARCH}" in
  amd64|arm64)
    ;;
  *)
    echo "Unsupported architecture for Fabric binaries: ${ARCH}"
    exit 1
    ;;
esac

# Ensure Docker from host is reachable from the container.
if ! docker version >/dev/null 2>&1; then
  echo "Docker is not reachable from inside the dev container."
  echo "Make sure Docker is running on the host and reopen the container."
  exit 1
fi

echo "Installing Hyperledger Fabric ${FABRIC_VERSION} binaries (arch: ${ARCH})..."
FABRIC_TGZ="${TMP_DIR}/fabric.tgz"
FABRIC_URL="https://github.com/hyperledger/fabric/releases/download/v${FABRIC_VERSION}/hyperledger-fabric-linux-${ARCH}-${FABRIC_VERSION}.tar.gz"
curl -fL "${FABRIC_URL}" -o "${FABRIC_TGZ}"
mkdir -p "${TMP_DIR}/fabric"
tar -xzf "${FABRIC_TGZ}" -C "${TMP_DIR}/fabric"

echo "Installing Hyperledger Fabric CA ${FABRIC_CA_VERSION} binaries..."
FABRIC_CA_TGZ="${TMP_DIR}/fabric-ca.tgz"
FABRIC_CA_URL="https://github.com/hyperledger/fabric-ca/releases/download/v${FABRIC_CA_VERSION}/hyperledger-fabric-ca-linux-${ARCH}-${FABRIC_CA_VERSION}.tar.gz"
curl -fL "${FABRIC_CA_URL}" -o "${FABRIC_CA_TGZ}"
mkdir -p "${TMP_DIR}/fabric-ca"
tar -xzf "${FABRIC_CA_TGZ}" -C "${TMP_DIR}/fabric-ca"

sudo mkdir -p "${BIN_DIR}" "${CONFIG_DIR}"
sudo cp -f "${TMP_DIR}/fabric/bin/"* "${BIN_DIR}/"
if [ -d "${TMP_DIR}/fabric/config" ]; then
  sudo cp -rf "${TMP_DIR}/fabric/config/." "${CONFIG_DIR}/"
fi

if [ -d "${TMP_DIR}/fabric-ca/bin" ]; then
  sudo cp -f "${TMP_DIR}/fabric-ca/bin/"* "${BIN_DIR}/"
fi

for bin in "${BIN_DIR}"/*; do
  sudo ln -sf "${bin}" "/usr/local/bin/$(basename "${bin}")"
done

if [ -f "${WORKSPACE_DIR}/backend/package.json" ]; then
  npm --prefix "${WORKSPACE_DIR}/backend" install
fi

echo "Installed tool versions:"
peer version | head -n 1 || true
orderer version | head -n 1 || true
fabric-ca-client version | head -n 1 || true

echo "Production-like Fabric JavaScript environment is ready."
