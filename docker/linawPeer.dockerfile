FROM hyperledger/fabric-peer:3.1.4 AS fabric_peer_upstream

FROM cgr.dev/chainguard/glibc-dynamic:latest

ENV FABRIC_CFG_PATH=/etc/hyperledger/fabric
ENV FABRIC_VER=v3.1.4
ENV PATH=/usr/local/bin:/usr/bin:/bin

WORKDIR /etc/hyperledger/fabric

COPY --from=alpine:3.19 /etc/ssl/certs /etc/ssl/certs
COPY --from=fabric_peer_upstream /usr/local/bin/peer /usr/bin/peer
COPY config/core.yaml /etc/hyperledger/fabric/core.yaml  

VOLUME ["/etc/hyperledger/fabric" ,"/var/hyperledger/"]

EXPOSE 7051/tcp

USER nonroot:nonroot

CMD ["/usr/bin/peer", "version"]