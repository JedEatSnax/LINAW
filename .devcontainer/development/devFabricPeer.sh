#!/usr/bin/env bash
set -euo pipefail

FABRIC_VERSION="${FABRIC_VERSION:-2.5.15}"
FABRIC_CA_VERSION="${FABRIC_CA_VERSION:-1.5.17}"
WORKSPACE_DIR="${WORKSPACE_FOLDER:-/workspaces/LINAW}"
RUNTIME_ROOT="${FABRIC_RUNTIME_ROOT:-${WORKSPACE_DIR}}"

INSTALL_ROOT="/usr/local/fabric"
BIN_DIR="${INSTALL_ROOT}/bin"
CONFIG_DIR="${INSTALL_ROOT}/config"
TMP_DIR="$(mktemp -d)"

CA_NAME="test-tls-ca"
CA_PORT="${CA_PORT:-7054}"

ADMIN_USER="test-tls-admin"
ADMIN_PASS="test-tls-admin-pass"

CSR_HOSTS="${CSR_HOSTS:-localhost}"

CA_SERVER_TLS_DIR="${CA_SERVER_TLS_DIR:-${RUNTIME_ROOT}/fabric-ca-server-tls}"
CA_SERVER_TLS_CONFIG="${CA_SERVER_TLS_DIR}/fabric-ca-server-config.yaml"
CA_SERVER_TLS_LOG="${CA_SERVER_TLS_DIR}/ca-server-tls.log"
CA_SERVER_TLS_PID="${CA_SERVER_TLS_DIR}/ca-server-tls.pid"

CA_CLIENT_DIR="${CA_CLIENT_DIR:-${RUNTIME_ROOT}/fabric-ca-client}"
CA_CLIENT_TLS_DIR="${CA_CLIENT_DIR}/tls-root-cert"

##################################
# Export environment variables
##################################
export FABRIC_CA_CLIENT_HOME="${CA_CLIENT_DIR}"
# export FABRIC_CA_CLIENT_TLS_CERTFILES can be set if a custom TLS root cert path is required
# export FABRIC_CA_CLIENT_MSPDIR can be set to override the default MSP directory
export PATH="${BIN_DIR}":$PATH