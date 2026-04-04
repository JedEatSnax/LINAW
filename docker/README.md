## Used Updated Fabric Binary Versions:
1. `fabric-ca-client`: **v1.5.18** from commit [ae6a50d](https://github.com/hyperledger/fabric-ca/commit/ae6a50d41861c109acad2a004d5a48eab734e61c) in repository [hyperledger/fabric-ca](https://github.com/hyperledger/fabric-ca)
2. `fabric-ca-server`: **v1.5.18** from commit [ae6a50d](https://github.com/hyperledger/fabric-ca/commit/ae6a50d41861c109acad2a004d5a48eab734e61c) in repository [hyperledger/fabric-ca](https://github.com/hyperledger/fabric-ca) 
3. `peer`: Uses upstream binary from image [hyperledger/fabric-peer:3.1.4](https://hub.docker.com/r/hyperledger/fabric-peer) (copied from `/usr/local/bin/peer` in `linawPeer.dockerfile`); local `docker/bin/peer` is not used
4. `orderer`: *Not used and updated yet* from commit [blank]() in repository [hyperledger/fabric](https://github.com/hyperledger/fabric)


## Customized Fabric Configurations
1. `configtx.yaml`: *Not customized yet*
2. `core.yaml`: Customized to disable CCAAS external builder (`externalBuilders` is empty)
3. `orderer.yaml`: *Not customized yet*


## Dockerfile Notes
- Base runtime image: `cgr.dev/chainguard/glibc-dynamic:latest`
- Peer binary source: copied from `hyperledger/fabric-peer:3.1.4` (upstream stage), not from local build artifacts
- CCAAS builder binaries (`/opt/hyperledger/ccaas_builder/bin`) are [intentionally excluded](config/core.yaml#L603)