## Used Updated Fabric Binary Versions:
1. `fabric-ca-client`: **v1.5.18** from commit [ae6a50d](https://github.com/hyperledger/fabric-ca/commit/ae6a50d41861c109acad2a004d5a48eab734e61c) in repository [hyperledger/fabric-ca](https://github.com/hyperledger/fabric-ca)
2. `fabric-ca-server`: **v1.5.18** from commit [ae6a50d](https://github.com/hyperledger/fabric-ca/commit/ae6a50d41861c109acad2a004d5a48eab734e61c) in repository [hyperledger/fabric-ca](https://github.com/hyperledger/fabric-ca) 
3. `peer`: Uses upstream binary from image [hyperledger/fabric-peer:3.1.4](https://hub.docker.com/r/hyperledger/fabric-peer)
4. `orderer`: Uses upstream binary from image [hyperledger/fabric-orderer:3.1.4](https://hub.docker.com/r/hyperledger/fabric-orderer)

## Customized Fabric Configurations
1. `configtx.yaml`: *No customization yet*
2. `core.yaml`: Customized to disable CCAAS external builder (`externalBuilders` is empty)
3. `orderer.yaml`: *No customization yet*


## Dockerfile Notes
- Base runtime image: `cgr.dev/chainguard/glibc-dynamic:latest`
- Both **peer** and **orderer** binary source are copied from `hyperledger/fabric-peer:3.1.4` and `hyperledger/fabric-peer:3.1.4` respectively, not from local build artifacts like [linawCA.dockerfile](linawCA.dockerfile)
- CCAAS builder binaries (`/opt/hyperledger/ccaas_builder/bin`) are [intentionally excluded](config/core.yaml#L603)