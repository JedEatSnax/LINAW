FROM cgr.dev/chainguard/go:latest-dev AS builder

ARG TARGETARCH
ARG TARGETOS

WORKDIR /src/fabric-ca
COPY fabric-ca /src/fabric-ca/

RUN make fabric-ca-server fabric-ca-client
RUN mkdir -p /tmp/fabric-ca-server

FROM cgr.dev/chainguard/glibc-dynamic:latest

COPY --from=builder /etc/nsswitch.conf /etc/nsswitch.conf
COPY --from=builder /etc/ssl/certs /etc/ssl/certs
COPY --from=builder /src/fabric-ca/bin/fabric-ca-server /usr/local/bin/fabric-ca-server
COPY --from=builder /src/fabric-ca/bin/fabric-ca-client /usr/local/bin/fabric-ca-client
COPY --chown=nonroot:nonroot --from=builder /tmp/fabric-ca-server/. /tmp/fabric-ca-server/

ENV FABRIC_CA_HOME=/tmp/fabric-ca-server
ENV FABRIC_CA_SERVER_PORT=7054

EXPOSE 7054/tcp

USER nonroot:nonroot

ENTRYPOINT ["fabric-ca-server"]
CMD ["start", "-b", "admin:adminpw"]