#!/usr/bin/env bash
set -euo pipefail

export FABRIC_CA_CLIENT_HOME=/workspaces/LINAW/fabric-ca-client 

function enroll_bootstrap_admin {
    fabric-ca-client enroll -u https://test-tls-admin:test-tls-admin-pass@localhost:7054 \
    --tls.certfiles tls-root-cert/tls-ca-cert.pem \
    --enrollment.profile tls \
    --mspdir /workspaces/LINAW/fabric-ca-client/tls-ca/tlsadmin/msp
}

function register_organization {
    ./fabric-ca-client enroll -u https://rcaadmin:rcaadminpw@my-machine.example.com:7054 \
    --tls.certfiles tls-root-cert/tls-ca-cert.pem \
    --enrollment.profile tls --csr.hosts 'host1,*.example.com' \
    --mspdir tls-ca/rcaadmin/msp

}