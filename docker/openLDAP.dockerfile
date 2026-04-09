FROM dhi.io/debian-base:trixie-debian13-dev

RUN DEBIAN_FRONTEND=noninteractive apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        slapd \
        ldap-utils \
        ca-certificates && \
    mkdir -p /var/lib/ldap /etc/ldap/slapd.d && \
    chown -R openldap:openldap /var/lib/ldap /etc/ldap && \
    rm -rf /var/lib/apt/lists/*

# Copy custom config (optional)
# COPY slapd.ldif /etc/ldap/slapd.d/

USER openldap

EXPOSE 389

# Run slapd
CMD ["slapd", "-h", "ldap://0.0.0.0:389", "-u", "openldap", "-g", "openldap", "-d", "0"]