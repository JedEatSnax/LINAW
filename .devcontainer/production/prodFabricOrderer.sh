#!/usr/bin/env bash
set -euo pipefail

##################################
# Global Configuration
##################################
FABRIC_VERSION="${FABRIC_VERSION:-2.5.15}"
FABRIC_CA_VERSION="${FABRIC_CA_VERSION:-1.5.17}"

INSTALL_ROOT="/usr/local/fabric"
BIN_DIR="${INSTALL_ROOT}/bin"
CONFIG_DIR="${INSTALL_ROOT}/config"
TMP_DIR="$(mktemp -d)"

CA_NAME="test-tls-ca"
CA_PORT="${CA_PORT:-7054}"

ADMIN_USER="test-tls-admin"
ADMIN_PASS="test-tls-admin-pass"

CSR_HOSTS="${CSR_HOSTS:-localhost}"

CA_SERVER_TLS_DIR="${INSTALL_ROOT}/fabric-ca-server-tls"
CA_SERVER_TLS_CONFIG="${CA_SERVER_TLS_DIR}/fabric-ca-server-config.yaml"
CA_SERVER_TLS_LOG="${CA_SERVER_TLS_DIR}/ca-server-tls.log"
CA_SERVER_TLS_PID="${CA_SERVER_TLS_DIR}/ca-server-tls.pid"

CA_CLIENT_DIR="${INSTALL_ROOT}/fabric-ca-client"
CA_CLIENT_TLS_DIR="${CA_CLIENT_DIR}/tls-root-cert"



#########################################
# Cleaning
#########################################

function cleanup {
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT



#########################################
# Logging
#########################################
function log {
    echo "[$(date +'%H:%M:%S')] $*"
}


function fail {
    log "ERROR: $*"
    exit 1
}


function require_cmd {
    local cmd="$1"
    command -v "$cmd" >/dev/null 2>&1 || fail "Required command not found: ${cmd}"
}


function preflight_checks {
    log "[0] Running preflight checks..."

    require_cmd dpkg
    require_cmd docker
    require_cmd curl
    require_cmd tar
    require_cmd sudo
    require_cmd nc

    if ! docker version >/dev/null 2>&1; then
        fail "Docker is not reachable. Ensure Docker daemon is running."
    fi

    log "[0] Preflight checks passed."
}

function verify_installed_binaries {
    log "[1.1] Verifying installed Fabric CA binaries..."

    require_cmd fabric-ca-server
    require_cmd fabric-ca-client

    log "[1.1] Fabric CA binaries are available in PATH."
}



##################################
# Export environment variables
##################################
export FABRIC_CA_CLIENT_HOME="${CA_CLIENT_DIR}"
# export FABRIC_CA_CLIENT_TLS_CERTFILES can be set if a custom TLS root cert path is required
# export FABRIC_CA_CLIENT_MSPDIR can be set to override the default MSP directory
export PATH="${BIN_DIR}":$PATH