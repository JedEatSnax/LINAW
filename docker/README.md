## Used Fabric Binary Versions:

1. `fabric-ca-client`: **v1.5.19** from package https://github.com/hyperledger/fabric-ca/releases/tag/v1.5.19
2. `fabric-ca-server`: **v1.5.19** from package https://github.com/hyperledger/fabric-ca/releases/tag/v1.5.19
3. `peer`: **v3.1.4** from commit [6472f7c](https://github.com/hyperledger/fabric/commit/6472f7c60121ab7f639f32f837223822e9522ef5) in repository [hyperledger/fabric](https://github.com/hyperledger/fabric)
4. `orderer`: **v3.1.4** from commit [6472f7c](https://github.com/hyperledger/fabric/commit/6472f7c60121ab7f639f32f837223822e9522ef5) in repository [hyperledger/fabric](https://github.com/hyperledger/fabric)

## Customized Fabric Configurations

1. `configtx.yaml`: _No customization yet_
2. `core.yaml`: _No customization yet_
3. `orderer.yaml`: _No customization yet_

## How to Test and Run

#### Prerequisites

- Docker Desktop/Docker Engine running
- git
- go binaries

### Fabric CA Docker Image

1. Build the Dockerfile

```bash
docker build -f ca.dockerfile -t linaw-fabric-ca:latest .
```

2. Sanity check

```bash
docker run --entrypoint fabric-ca-server linaw-fabric-ca:latest version

# Expected Output:
# fabric-ca-server:
#  Version: v1.5.19
#  Go version: go1.26.1
#  OS/Arch: linux/amd64
```

### Fabric Orderer Docker Image

#### Skip steps 1 and 2 if you tested Fabric Peer Docker Image

1. Build the Dockerfile

```bash
docker build -f peer.dockerfile -t linaw-fabric-peer:latest .
```

. Sanity check

```bash
docker run --entrypoint peer linaw-fabric-peer:latest version

# Expected Output
# Go version: go1.26.1
#  OS/Arch: linux/amd64
#  Chaincode:
#  Base Docker Label: org.hyperledger.fabric
#  Docker Namespace: hyperledger
```

1. Clone the Fabric Certificate

```bash
cd docker
git clone https://github.com/hyperledger/fabric
```

2. Edit the [Makefile](fabric/Makefile#L49) base version to 3.1.4

```make
FABRIC_VER ?= 3.1.4
```

3. Build the Dockerfile

```bash
docker build -f orderer.dockerfile -t linaw-fabric-orderer:latest .
```

4. Sanity check

```bash
docker run --entrypoint orderer linaw-fabric-orderer:latest version

# Expected Output
# orderer:
#  Version: v3.1.4
#  Commit SHA: 6472f7c60
#  Go version: go1.26.1
#  OS/Arch: linux/amd64
```

## NodeJS Backend Setup

1. Build the Dockerfile

```bash
docker build -f backend.dockerfile -t linaw-backend:latest .
```

2. Run a container using the image

```bash
docker run --rm -p 3000:3000 \
  --env-file backend/.env \
  -e FIREBASE_SERVICE_ACCOUNT_PATH=/run/secrets/firebase_service_account.json \
  -v "$PWD/backend/config/serviceAccount.json:/run/secrets/firebase_service_account.json:ro" \
  linaw-backend:latest
```

### Aquasec Trivy Docker Image Scanning

1. Run the official script from https://trivy.dev/docs/latest/getting-started/installation/

```
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sudo sh -s -- -b /usr/local/bin v0.69.3
```

2. Execute the `trivy` command to see known vulnerabilities and discovered secrets

```
trivy image linaw-fabric-ca:latest
```

### Custom Blockchain Setup

1. Copy and paste the contents of the custom [Certificate Authority](compose/certificate-authority.yml) file to the fabric-samples boilerplate [compose](../fabric-samples/test-network/compose/compose-ca.yaml) file.

2. Spin up test network and wait for the containers to initialize

```bash
./network.sh up -ca
```

3. Register and enroll organizations within the container instead of doing it locally. Though, you will still have a copy directory unless you change the [`network.sh`](../fabric-samples/test-network/network.sh#L227) script

```bash
docker exec -it ca_org1 bash -lc "cd /opt/organizations/fabric-ca && chmod +x ./registerEnroll.sh && ./registerEnroll.sh"
```

4. Verify if the `registerEnroll.sh` script executed successfully

```bash
docker exec -it ca_org1 ls opt/organizations
```
