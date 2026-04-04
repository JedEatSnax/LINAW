FROM hyperledger/fabric-orderer:3.1.4 AS fabric_orderer_upstream

FROM cgr.dev/chainguard/glibc-dynamic:latest

ENV FABRIC_CFG_PATH=/etc/hyperledger/fabric
ENV FABRIC_VER=v3.1.4
ENV PATH=/usr/local/bin:/usr/bin:/bin

WORKDIR /etc/hyperledger/fabric

COPY --from=alpine:3.19 /etc/ssl/certs /etc/ssl/certs
COPY --from=fabric_orderer_upstream /usr/local/bin/orderer /usr/bin/orderer
COPY config/core.yaml /etc/hyperledger/fabric/orderer.yaml
COPY config/configtx.yaml /etc/hyperledger/fabric/orderer.yaml

VOLUME ["/etc/hyperledger/fabric" ,"/var/hyperledger/"]

EXPOSE 7050/tcp

USER nonroot:nonroot

CMD ["/usr/bin/orderer", "version"]