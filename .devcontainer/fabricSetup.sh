#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_DIR="${WORKSPACE_FOLDER:-/workspaces/LINAW}"
FABRIC_VERSION="${FABRIC_VERSION:-2.5.15}"
FABRIC_CA_VERSION="${FABRIC_CA_VERSION:-1.5.17}"

INSTALL_ROOT="/usr/local/fabric"
BIN_DIR="${INSTALL_ROOT}/bin"
TMP_DIR="$(mktemp -d)"

CA_CLIENT_DIR="${INSTALL_ROOT}/fabric-ca-client"
CA_SERVER_TLS_DIR="${INSTALL_ROOT}/fabric-ca-server-tls"

//FABRIC_CA_CLIENT_HOME=
//FABRIC_CA_CLIENT_TLS_CERTFILES=
//FABRIC_CA_CLIENT_MSPDIR= 



function download_fabric {
    local arch
    arch="$(dpkg --print-architecture)"

    case "${arch}" in
        amd64|arm64)
            ;;
        *)
            echo "Unsupported architecture for Fabric binaries: ${arch}"
            exit 1
            ;;
    esac

    if ! docker version >/dev/null 2>&1; then
        echo "Docker is not reachable. Ensure the docker service is running and rerun this script."
        exit 1
    fi

    echo "Installing Hyperledger Fabric ${FABRIC_VERSION} binaries (arch: ${arch})..."
    local fabric_tgz="${TMP_DIR}/fabric.tgz"
    local fabric_url="https://github.com/hyperledger/fabric/releases/download/v${FABRIC_VERSION}/hyperledger-fabric-linux-${arch}-${FABRIC_VERSION}.tar.gz"
    curl -fL "${fabric_url}" -o "${fabric_tgz}"
    mkdir -p "${TMP_DIR}/fabric"
    tar -xzf "${fabric_tgz}" -C "${TMP_DIR}/fabric"

    echo "Installing Hyperledger Fabric CA ${FABRIC_CA_VERSION} binaries..."
    local fabric_ca_tgz="${TMP_DIR}/fabric-ca.tgz"
    local fabric_ca_url="https://github.com/hyperledger/fabric-ca/releases/download/v${FABRIC_CA_VERSION}/hyperledger-fabric-ca-linux-${arch}-${FABRIC_CA_VERSION}.tar.gz"
    curl -fL "${fabric_ca_url}" -o "${fabric_ca_tgz}"
    mkdir -p "${TMP_DIR}/fabric-ca"
    tar -xzf "${fabric_ca_tgz}" -C "${TMP_DIR}/fabric-ca"

    sudo mkdir -p "${BIN_DIR}"
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
}

function setup_certificate_authority {
    mkdir -p "${CA_CLIENT_DIR}"
    mkdir fabric-ca-client fabric-ca-server-tls
    cd fabric-ca-client
    mkdir tls-ca org1-ca intermediate-ca tls-root-cert
    cp ../${BIN_DIR}/fabric-ca-client ${INSTALL_ROOT}/fabric-ca-client
}

