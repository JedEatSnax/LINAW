FROM cgr.dev/chainguard/go:latest-dev AS builder

ARG TARGETARCH
ARG TARGETOS
ARG FABRIC_VER=v3.1.4
ARG GO_TAGS

WORKDIR /src/fabric
COPY fabric /src/fabric/

RUN make orderer GO_TAGS=${GO_TAGS} FABRIC_VER=${FABRIC_VER}
RUN mkdir -p /tmp/var-hyperledger

FROM cgr.dev/chainguard/glibc-dynamic:latest

ARG FABRIC_VER=v3.1.4
ENV FABRIC_CFG_PATH=/etc/hyperledger/fabric
ENV FABRIC_VER=${FABRIC_VER}

# glibc-dynamic has no shell; copy nsswitch.conf from builder stage.
COPY --from=builder /etc/nsswitch.conf /etc/nsswitch.conf
COPY --from=builder /etc/ssl/certs /etc/ssl/certs
COPY --from=builder /src/fabric/build/bin/orderer /usr/local/bin/orderer
COPY --from=builder /src/fabric/sampleconfig/orderer.yaml ${FABRIC_CFG_PATH}/orderer.yaml
COPY --from=builder /src/fabric/sampleconfig/configtx.yaml ${FABRIC_CFG_PATH}/configtx.yaml
COPY --chown=nonroot:nonroot --from=builder /src/fabric/sampleconfig/msp ${FABRIC_CFG_PATH}/msp
COPY --chown=nonroot:nonroot --from=builder /tmp/var-hyperledger/. /var/hyperledger/

VOLUME ["/etc/hyperledger/fabric"]
VOLUME ["/var/hyperledger"]

EXPOSE 7050

USER nonroot:nonroot

CMD ["orderer", "start"]