FROM cgr.dev/chainguard/glibc-dynamic:latest

ENV FABRIC_CFG_PATH=/etc/hyperledger/fabric
ENV FABRIC_VER=v2.5.15

COPY /bin/orderer /usr/local/bin/

COPY --from=alpine:3.19 /etc/ssl/certs /etc/ssl/certs

ENV FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
ENV FABRIC_CA_SERVER_PORT=7054

EXPOSE 7054/tcp

USER 65532:65532

ENTRYPOINT ["fabric-ca-server"]
CMD ["start", "-b", "admin:adminpw"]