#!/usr/bin/env bash
set -euo pipefail

##################################
# Global Configuration
##################################
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


##################################
# Install and setup binaries + ca
##################################
function download_fabric {
    log "[1] Downloading Fabric + Fabric CA binaries..."

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

    sudo mkdir -p "${BIN_DIR}" "${CONFIG_DIR}"
    sudo cp -f "${TMP_DIR}/fabric/bin/"* "${BIN_DIR}/"
    if [ -d "${TMP_DIR}/fabric/config" ]; then
        sudo cp -rf "${TMP_DIR}/fabric/config/." "${CONFIG_DIR}/"
    fi

    if [ -d "${TMP_DIR}/fabric-ca/bin" ]; then
        sudo cp -f "${TMP_DIR}/fabric-ca/bin/"* "${BIN_DIR}/"
    fi

    # Copy the installed CA binaries into the runtime-managed folders.
    mkdir -p "${CA_CLIENT_DIR}" "${CA_SERVER_TLS_DIR}"
    cp -f "${BIN_DIR}/fabric-ca-client" "${CA_CLIENT_DIR}/"
    cp -f "${BIN_DIR}/fabric-ca-server" "${CA_SERVER_TLS_DIR}/"

    for bin in "${BIN_DIR}"/*; do
        sudo ln -sf "${bin}" "/usr/local/bin/$(basename "${bin}")"
    done

    log "[1] Binaries installed."
}


function initialize_ca_server_tls {
    log "[2] Initializing TLS CA..."

    mkdir -p "${CA_SERVER_TLS_DIR}"
    cd "${CA_SERVER_TLS_DIR}"

    if [ ! -f "$CA_SERVER_TLS_CONFIG" ]; then
        fabric-ca-server init -b "$ADMIN_USER:$ADMIN_PASS"
    else
        log "Config already exists. Skipping init."
    fi
}


function modify_ca_server_tls {
    log "[3] Modifying TLS CA..."

    # Install yq only when missing. /usr/local/bin requires elevated privileges.
    if ! command -v yq >/dev/null 2>&1; then
        local yq_url="https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64"
        sudo wget -qO /usr/local/bin/yq "${yq_url}"
        sudo chmod +x /usr/local/bin/yq
    fi

    [ -f "$CA_SERVER_TLS_CONFIG" ] || fail "CA config not found at ${CA_SERVER_TLS_CONFIG}."

    # backup original configuration
    cp "$CA_SERVER_TLS_CONFIG" "${CA_SERVER_TLS_CONFIG}.bak"

    # use yq if available (preferred)
    if command -v yq &> /dev/null; then
        yq -i "
            .ca.name = \"$CA_NAME\" |
            .tls.enabled = true |
            .csr.hosts = [\"$CSR_HOSTS\"] |
            .signing.profiles = {\"tls\": {\"usages\": [\"signing\",\"key encipherment\",\"server auth\",\"client auth\"], \"expiry\": \"8760h\"}}
                " "$CA_SERVER_TLS_CONFIG"
    else
        log "yq not found. Applying fallback config patch..."
                sed -i "/^ca:/,/^[^[:space:]]/ s|^\([[:space:]]*name:\).*|\1 ${CA_NAME}|" "$CA_SERVER_TLS_CONFIG"
                sed -i '/^tls:/,/^[^[:space:]]/ s|^\([[:space:]]*enabled:[[:space:]]*\).*|\1true|' "$CA_SERVER_TLS_CONFIG"
                # Keep default csr.hosts and signing profile when yq is unavailable.
                # This avoids non-idempotent text patches on repeated script runs.
    fi
}


function start_ca_server_tls {
    log "[4] Starting TLS CA..."

    if [ -f "$CA_SERVER_TLS_PID" ]; then
        local existing_pid
        existing_pid="$(cat "$CA_SERVER_TLS_PID" 2>/dev/null || true)"

        if [ -n "$existing_pid" ] && kill -0 "$existing_pid" 2>/dev/null; then
            log "CA already running (pid: ${existing_pid})."
            return
        fi

        log "Removing stale CA PID file at ${CA_SERVER_TLS_PID}."
        rm -f "$CA_SERVER_TLS_PID"
    fi

    fabric-ca-server start -p "$CA_PORT" >"$CA_SERVER_TLS_LOG" 2>&1 &
    echo $! > "$CA_SERVER_TLS_PID"

    # health check loop
    for i in {1..10}; do
        if nc -z localhost "$CA_PORT"; then
            log "TLS CA is up on port $CA_PORT"
            return
        fi
        sleep 1
    done

    # Retry once when stale TLS cert references a missing key in msp/keystore.
    if grep -q "Could not load TLS certificate with BCCSP" "$CA_SERVER_TLS_LOG" 2>/dev/null; then
        log "Detected stale TLS certificate/key state. Resetting TLS cert artifacts and retrying..."
        rm -f "${CA_SERVER_TLS_DIR}/tls-cert.pem" "${CA_SERVER_TLS_DIR}/tls-key.pem"
        rm -f "$CA_SERVER_TLS_PID"

        fabric-ca-server start -p "$CA_PORT" >"$CA_SERVER_TLS_LOG" 2>&1 &
        echo $! > "$CA_SERVER_TLS_PID"

        for i in {1..10}; do
            if nc -z localhost "$CA_PORT"; then
                log "TLS CA is up on port $CA_PORT"
                return
            fi
            sleep 1
        done
    fi

    log "ERROR: TLS CA failed to start"
    exit 1
}


function initialize_ca_client {
    log "[5] Initializing TLS CA client..."

    mkdir -p "${CA_CLIENT_DIR}"
    cd "${CA_CLIENT_DIR}"
    mkdir -p "${CA_CLIENT_DIR}/tls-ca" "${CA_CLIENT_DIR}/org1-ca" "${CA_CLIENT_DIR}/intermediate-ca" "${CA_CLIENT_TLS_DIR}"

    # Use the CA cert generated by the server as the trusted root for enroll.
    for _ in {1..10}; do
        [ -f "${CA_SERVER_TLS_DIR}/ca-cert.pem" ] && break
        sleep 1
    done
    [ -f "${CA_SERVER_TLS_DIR}/ca-cert.pem" ] || fail "CA certificate not found at ${CA_SERVER_TLS_DIR}/ca-cert.pem"

    cp -f "${CA_SERVER_TLS_DIR}/ca-cert.pem" "${CA_CLIENT_TLS_DIR}/tls-ca-cert.pem"


    fabric-ca-client enroll \
    -u "https://${ADMIN_USER}:${ADMIN_PASS}@localhost:${CA_PORT}" \
    --tls.certfiles "${CA_CLIENT_TLS_DIR}/tls-ca-cert.pem" \
    --enrollment.profile tls \
    --csr.hosts "${CSR_HOSTS}" \
    --mspdir "${CA_CLIENT_DIR}/tls-ca/tlsadmin/msp"
}

function print_deployment_summary {
    log "[6] Deployment summary"

    local msp_dir="${CA_CLIENT_DIR}/tls-ca/tlsadmin/msp"
    local tls_cert="${CA_CLIENT_TLS_DIR}/tls-ca-cert.pem"
    local server_cert="${CA_SERVER_TLS_DIR}/ca-cert.pem"
    local ca_status="stopped"

    if [ -f "$CA_SERVER_TLS_PID" ] && kill -0 "$(cat "$CA_SERVER_TLS_PID")" 2>/dev/null; then
        ca_status="running"
    fi

    log "  CA name: ${CA_NAME}"
    log "  CA port: ${CA_PORT}"
    log "  CA status: ${ca_status}"
    log "  CA PID file: ${CA_SERVER_TLS_PID}"
    log "  CA log file: ${CA_SERVER_TLS_LOG}"
    log "  CA config: ${CA_SERVER_TLS_CONFIG}"
    log "  Server cert: ${server_cert}"
    log "  Client TLS cert: ${tls_cert}"
    log "  Client MSP dir: ${msp_dir}"
}



##################################
# Call functions step-by-step
##################################
function main {
    preflight_checks
    download_fabric
    verify_installed_binaries
    initialize_ca_server_tls
    modify_ca_server_tls
    start_ca_server_tls
    initialize_ca_client
    print_deployment_summary

    log "TLS CA deployment COMPLETE."
}

main