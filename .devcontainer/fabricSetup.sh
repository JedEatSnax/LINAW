#!/usr/bin/env bash
set -euo pipefail

function download_node {
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
    \. "$HOME/.nvm/nvm.sh"
    nvm install 24
}

function download_hashicorp_vault {
    wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
    https://apt.releases.hashicorp.com \
    $(grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release || lsb_release -cs) main" \
    | sudo tee /etc/apt/sources.list.d/hashicorp.list
}

function download_docker {
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc

    sudo tee /etc/apt/sources.list.d/docker.sources <<-EOF
		Types: deb
		URIs: https://download.docker.com/linux/ubuntu
		Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
		Components: stable
		Architectures: $(dpkg --print-architecture)
		Signed-By: /etc/apt/keyrings/docker.asc
	EOF
}

# ================================
# UBUNTU SYSTEM SETUP
# ===============================
sudo apt-get update --fix-missing
sudo apt-get full-upgrade -y


# --------------------------------
# 1. Install base tools
# --------------------------------
sudo apt-get install -y --no-install-recommends \
    apt-transport-https \
    software-properties-common \
    build-essential \
    curl \
    ca-certificates \
    git \
    openssl \
    tar \
    wget \
    gnupg \
    unzip


# --------------------------------
# 2. Install software packages
# --------------------------------
sudo apt-get install -y --no-install-recommends \
    unattended-upgrades \
    cryptsetup \
    fail2ban \
    ufw \
    vault

sudo dpkg-reconfigure --priority=low unattended-upgrades -y
sudo apt-get update --fix-missing
sudo apt-get full-upgrade -y
sudo rm -rf /var/lib/apt/lists/*
sudo apt-get autoclean -y
sudo apt-get autoremove -y

sudo systemctl enable ufw vault docker
sudo systemctl start ufw vault docker

#
# ADD INTRUSION DETECTION AND PREVENTION SYSTEMS SOON !!!
#



#
# INSTALL 
#