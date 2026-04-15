FROM cgr.dev/chainguard/go:latest-dev AS builder

ARG TARGETARCH
ARG TARGETOS
ARG FABRIC_VER=v3.1.4
ARG GO_TAGS

WORKDIR /src/fabric
COPY fabric /src/fabric/

RUN make peer GO_TAGS=${GO_TAGS} FABRIC_VER=${FABRIC_VER}
RUN mkdir -p /tmp/var-hyperledger

FROM cgr.dev/chainguard/glibc-dynamic:latest

ARG FABRIC_VER=v3.1.4
ENV FABRIC_CFG_PATH=/etc/hyperledger/fabric
ENV FABRIC_VER=${FABRIC_VER}

COPY --from=builder /etc/nsswitch.conf /etc/nsswitch.conf
COPY --from=builder /etc/ssl/certs /etc/ssl/certs
COPY --from=builder /src/fabric/build/bin/peer /usr/local/bin/peer
COPY --from=builder /src/fabric/sampleconfig/core.yaml ${FABRIC_CFG_PATH}/core.yaml
COPY --chown=nonroot:nonroot --from=builder /src/fabric/sampleconfig/msp ${FABRIC_CFG_PATH}/msp
COPY --chown=nonroot:nonroot --from=builder /tmp/var-hyperledger/. /var/hyperledger/

RUN  --mount=type=secret,id=peer-core,target=--from=builder /src/fabric/sampleconfig/core.yaml

VOLUME ["/etc/hyperledger/fabric"]
VOLUME ["/var/hyperledger/"]

EXPOSE 7051/tcp

USER nonroot:nonroot

ENTRYPOINT ["peer"]
CMD ["node", "start"]