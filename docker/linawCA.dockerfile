FROM cgr.dev/chainguard/glibc-dynamic:latest

WORKDIR /etc/hyperledger/fabric-ca-server

COPY bin/fabric-ca-server /usr/local/bin/
COPY bin/fabric-ca-client /usr/local/bin/

COPY --from=alpine:3.19 /etc/ssl/certs /etc/ssl/certs

ENV FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
ENV FABRIC_CA_SERVER_PORT=7054

EXPOSE 7054/tcp

USER nonroot:nonroot

ENTRYPOINT ["fabric-ca-server"]
CMD ["version"]