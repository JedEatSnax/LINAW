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

CA_CLIENT_DIR="${INSTALL_ROOT}/fabric-ca-client"
CA_CLIENT_TLS_DIR="${CA_CLIENT_DIR}/tls-root-cert"

ORG_NAME=""
ORG_PASSWORD=""

##################################
# Export environment variables
##################################
export FABRIC_CA_CLIENT_HOME="/usr/local/fabric/fabric-ca-client"
export PATH="${BIN_DIR}":$PATH

function enroll_bootstrap_admin {
    fabric-ca-client enroll -u https://${ADMIN_USER}:${ADMIN_PASS}@${CSR_HOSTS}:${CA_PORT} \
    --tls.certfiles tls-root-cert/tls-ca-cert.pem \
    --enrollment.profile tls \
    --mspdir /${CA_CLIENT_DIR}/tls-ca/tlsadmin/msp
}

enroll_bootstrap_admin

function register_organization {
    local organization_name="$1"
    local organization_password="$2"

    fabric-ca-client register -u https://${organization_name}:${organization_password}@${CSR_HOSTS}:${CA_PORT} \
    --tls.certfiles /${CA_CLIENT_TLS_DIR}/tls-ca-cert.pem \
    --enrollment.profile tls \
    --csr.hosts 'host1,*.example.com' \
    --mspdir tls-ca/${organization_name}/msp
}

function enroll_organization {
    local organization_name="$1"
    local organization_password="$2"

    fabric-ca-client enroll -u https://${organization_name}:${organization_password}@${CSR_HOSTS}:${CA_PORT} \
    --tls.certfiles /${CA_CLIENT_TLS_DIR}/tls-ca-cert.pem \
    --enrollment.profile tls \
    --csr.hosts 'host1,*.example.com' \
    --mspdir tls-ca/${organization_name}/msp
}

read -r -p "Enter the organization name: " ORG_NAME
read -rsp "Enter the organization password: " ORG_PASSWORD
printf '\n'

if [[ -z "${ORG_NAME}" || -z "${ORG_PASSWORD}" ]]; then
    echo "Organization name and password are required."
    exit 1
fi

register_organization "${ORG_NAME}" "${ORG_PASSWORD}"
enroll_organization "${ORG_NAME}" "${ORG_PASSWORD}"