#!/usr/bin/env bash
set -euo pipefail

cleanup() {
    rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

function download_node {
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
    \. "$HOME/.nvm/nvm.sh"
    nvm install 24
}

function download_hashicorp_vault {
    wget -qO- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor --yes -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
https://apt.releases.hashicorp.com \
$(grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release || lsb_release -cs) main" \
    | sudo tee /etc/apt/sources.list.d/hashicorp.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y vault
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

    sudo apt-get update
    sudo apt install -y \
        docker-ce \
        docker-ce-cli \
        containerd.io \
        docker-buildx-plugin \
        docker-compose-plugin
    
    sudo usermod -aG docker "$USER"
    sudo systemctl enable --now docker
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
    jq \
    curl \
    ca-certificates \
    git \
    openssl \
    tar \
    wget \
    gnupg \
    unzip


# --------------------------------
# 2. Call functions
# --------------------------------
download_docker
download_hashicorp_vault
download_fabric
download_node

if [ -f "${WORKSPACE_DIR}/backend/package.json" ]; then
    npm --prefix "${WORKSPACE_DIR}/backend" install
fi

echo "Installed tool versions:"
peer version | head -n 1 || true
orderer version | head -n 1 || true
fabric-ca-client version | head -n 1 || true


# --------------------------------
# 3. Install software packages
# --------------------------------
sudo apt-get install -y --no-install-recommends \
    unattended-upgrades \
    cryptsetup \
    fail2ban \
    ufw \
    lynis

# --------------------------------
# 4. Cleaning up
# --------------------------------
sudo timedatectl set-ntp true
sudo dpkg-reconfigure --priority=low unattended-upgrades -y
sudo apt-get update --fix-missing
sudo apt-get full-upgrade -y
sudo rm -rf /var/lib/apt/lists/*
sudo apt-get autoclean -y
sudo apt-get autoremove -y

sudo systemctl enable ufw vault docker
sudo systemctl start ufw vault docker
sudo systemctl status ufw vault docker


# ================================
# 5. Set ufw Firewall Rules
# ================================
function ufw_rules {
    sudo ufw default deny incoming
    sudo ufw default deny incoming

}


# ================================
# CONSIDERATIONS
# Good to have but not priority
# ================================
# 1. Intrusion prevention system
# 2. Intrusion detection system
# 3. Only specific user has access to Docker for safety
# 4. Limit root user access for safety