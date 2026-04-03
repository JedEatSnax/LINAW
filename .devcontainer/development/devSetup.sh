#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

WORKSPACE_DIR="${WORKSPACE_FOLDER:-/workspaces/LINAW}"
FABRIC_VERSION="${FABRIC_VERSION:-2.5.15}"
FABRIC_CA_VERSION="${FABRIC_CA_VERSION:-1.5.17}"
INSTALL_ROOT="/usr/local/fabric"
BIN_DIR="${INSTALL_ROOT}/bin"
CONFIG_DIR="${INSTALL_ROOT}/config"
TMP_DIR="$(mktemp -d)"

function has_systemd {
    [ -d /run/systemd/system ] && command -v systemctl >/dev/null 2>&1
}

cleanup() {
    rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

function download_node {
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash

    # Devcontainer images may place nvm under /usr/local/share/nvm.
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        export NVM_DIR="$HOME/.nvm"
    elif [ -s "/usr/local/share/nvm/nvm.sh" ]; then
        export NVM_DIR="/usr/local/share/nvm"
    else
        echo "nvm.sh not found in expected locations; skipping Node install via nvm."
        return
    fi

    . "$NVM_DIR/nvm.sh"
    nvm install 24
}

download_node

##################################
# UBUNTU SYSTEM SETUP
##################################
sudo apt-get update --fix-missing
sudo apt-get full-upgrade -y


##################################
# 1. Install base tools
##################################
sudo apt-get install -y --no-install-recommends \
    apt-transport-https \
    software-properties-common \
    build-essential \
    jq \
    netcat-openbsd \
    curl \
    ca-certificates \
    git \
    openssl \
    tar \
    wget \
    gnupg \
    unzip

if [ -f "${WORKSPACE_DIR}/backend/package.json" ]; then
    npm --prefix "${WORKSPACE_DIR}/backend" install
fi

echo "Installed tool versions:"
peer version | head -n 1 || true
orderer version | head -n 1 || true
fabric-ca-client version | head -n 1 || true


##################################
# Update, upgrade, and clean
##################################
if has_systemd && command -v timedatectl >/dev/null 2>&1; then
    sudo timedatectl set-ntp true || true
else
    echo "systemd/timedatectl unavailable. Skipping NTP configuration."
fi

# Keep unattended-upgrades noninteractive in container builds.
sudo dpkg-reconfigure --frontend=noninteractive unattended-upgrades || true

sudo apt-get update --fix-missing
sudo apt-get full-upgrade -y
sudo rm -rf /var/lib/apt/lists/*
sudo apt-get autoclean -y
sudo apt-get autoremove -y