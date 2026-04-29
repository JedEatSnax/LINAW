FROM cgr.dev/chainguard/go:latest-dev AS builder

ARG TARGETARCH
ARG TARGETOS

FROM cgr.dev/chainguard/glibc-dynamic:latest AS runner

COPY /bin/fabric-ca-client /usr/local/bin/fabric-ca-client
COPY /bin/fabric-ca-server /usr/local/bin/fabric-ca-server
COPY --from=builder /etc/nsswitch.conf /etc/nsswitch.conf
COPY --from=builder /etc/ssl/certs /etc/ssl/certs

ENV FABRIC_CA_HOME=/tmp/fabric-ca-server
ENV FABRIC_CA_SERVER_PORT=7054

EXPOSE 7054/tcp

USER nonroot:nonroot

ENTRYPOINT ["fabric-ca-server"]
CMD ["start", "-b", "admin:adminpw"]