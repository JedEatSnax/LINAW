#!/bin/bash

set -e

echo "====================================="
echo "LINAW Hyperledger Fabric Bootstrapper"
echo "====================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root${NC}"
   exit 1
fi

# Detect Operating System
case "$(uname -s)" in
  Linux)
    OS="linux"
    ;;
  Darwin)
    OS="mac"
    ;;
  WindowsNT)
    OS="windows"
  *)
    echo "Unknown Operating System"
    ;;
esac

echo -e "${GREEN}Detected OS: $OS${NC}"

# Check prerequisites
echo ""
echo "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found. Installing Docker...${NC}"
    if [ "$OS" = "linux" ]; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        echo -e "${YELLOW}Docker installed. You need to log out and log back in for group changes to take effect.${NC}"
        echo -e "${YELLOW}After logging back in, run this script again.${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose not found. Installing...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi
echo -e "${GREEN}✓ Docker Compose found: $(docker-compose --version)${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing Node.js 20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm not found. Please install Node.js with npm.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"

# Check if Fabric binaries exist
FABRIC_BIN_PATH="$HOME/fabric-samples/bin"
if [ ! -d "$FABRIC_BIN_PATH" ]; then
    echo -e "${YELLOW}Fabric binaries not found at $FABRIC_BIN_PATH${NC}"
    echo "Please ensure you've run the Fabric install script."
    read -p "Do you want to install Fabric binaries now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd $HOME
        mkdir -p fabric-samples
        cd fabric-samples
        curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary
        FABRIC_BIN_PATH="$HOME/fabric-samples/bin"
    else
        exit 1
    fi
fi
echo -e "${GREEN}✓ Fabric binaries found at $FABRIC_BIN_PATH${NC}"

# Add Fabric binaries to PATH if not already there
if [[ ":$PATH:" != *":$FABRIC_BIN_PATH:"* ]]; then
    echo "export PATH=\$PATH:$FABRIC_BIN_PATH" >> ~/.bashrc
    export PATH=$PATH:$FABRIC_BIN_PATH
    echo -e "${GREEN}Added Fabric binaries to PATH${NC}"
fi

# Create necessary directories
echo ""
echo "Setting up project structure..."
INSTALL_DIR="$HOME/fabric-bootstrapper"
mkdir -p $INSTALL_DIR/{backend/src/{config,managers,routes,templates,db},frontend/src/{components,api},chaincode/basic,scripts,fabric-config,data/{orderer,organizations}}

cd $INSTALL_DIR

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
if [ ! -f "backend/package.json" ]; then
    cd backend
    npm init -y
    npm install express cors body-parser dockerode fabric-ca-client fabric-network handlebars
    npm install --save-dev typescript @types/node @types/express @types/dockerode ts-node nodemon
    cd ..
fi

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
if [ ! -f "frontend/package.json" ]; then
    cd frontend
    npx create-react-app . --template typescript
    npm install axios react-router-dom
    npm install --save-dev @types/react-router-dom
    cd ..
fi

echo ""
echo -e "${GREEN}========================================"
echo "Installation Complete!"
echo "========================================${NC}"
echo ""
echo "Next steps:"
echo "1. cd $INSTALL_DIR"
echo "2. Start backend: cd backend && npm run dev"
echo "3. Start frontend: cd frontend && npm start"
echo "4. Open http://localhost:3000"
echo ""
echo -e "${YELLOW}Note: The backend and frontend need to be started in separate terminals${NC}"
