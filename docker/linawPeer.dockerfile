FROM cgr.dev/chainguard/glibc-dynamic:latest

ARG FABRIC_VER=v2.5.15
ENV FABRIC_CFG_PATH=/etc/hyperledger/fabric
ENV FABRIC_VER=${FABRIC_VER}

COPY --from=alpine:3.19 /etc/ssl/certs /etc/ssl/certs

VOLUME ["/etc/hyperledger/fabric", "/var/hyperledger"]
EXPOSE 7050/tcp

USER 65532:65532

CMD ["peer", "node", "start"]       