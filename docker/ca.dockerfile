# Builder stage is unused here; you can keep or drop it.
FROM cgr.dev/chainguard/go:latest-dev AS builder

ARG TARGETARCH
ARG TARGETOS

# Use a Wolfi base that has /bin/sh and apk
FROM cgr.dev/chainguard/wolfi-base:latest AS runner

# Install curl for healthcheck
RUN apk update && apk add --no-cache curl

# Copy Fabric CA binaries from your repo (docker/bin/...)
COPY docker/bin/fabric-ca-client /usr/local/bin/fabric-ca-client
COPY docker/bin/fabric-ca-server /usr/local/bin/fabric-ca-server

# Copy trusted certs and nsswitch if you really need them from builder
COPY --from=builder /etc/nsswitch.conf /etc/nsswitch.conf
COPY --from=builder /etc/ssl/certs /etc/ssl/certs

ENV FABRIC_CA_HOME=/tmp/fabric-ca-server
ENV FABRIC_CA_SERVER_PORT=7054

EXPOSE 7054/tcp

# USER nonroot:nonroot
