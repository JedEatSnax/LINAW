const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger')
const { execAsync } = require('../utils/execAsync')

function getFabricCaImage() {
    const fabricCAVersion = process.env.FABRIC_CA_VERSION || '1.5';
    return `hyperledger/fabric-ca:${fabricCAVersion}`;
}

function getProjectNetwork(userId) {
    return `fabric-${userId}`;
}

function shellQuote(value) {
    return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function safeId(value) {
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '-');
}

function secretFor(id) {
    const cleaned = safeId(id);
    return `${cleaned}pw`;
}

async function assertFileExists(filePath, hint) {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
        throw new Error(`${hint || 'Required file missing'}: ${filePath}`);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForAnyRelativeFile(workspace, relPaths, hint, opts = {}) {
    const timeoutMs = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 60_000;
    const intervalMs = typeof opts.intervalMs === 'number' ? opts.intervalMs : 750;
    const deadline = Date.now() + timeoutMs;

    const absPaths = relPaths.map(rel => path.join(workspace, rel));

    while (Date.now() < deadline) {
        for (let i = 0; i < absPaths.length; i++) {
            if (await fs.pathExists(absPaths[i])) return relPaths[i];
        }
        await sleep(intervalMs);
    }

    // Best-effort debug: list parent dir contents to help diagnose wrong filenames.
    const parentDirs = Array.from(new Set(absPaths.map(p => path.dirname(p))));
    const listings = [];
    for (const dir of parentDirs) {
        try {
            if (await fs.pathExists(dir)) {
                const files = await fs.readdir(dir);
                listings.push(`${dir}: ${files.join(', ') || '(empty)'}`);
            } else {
                listings.push(`${dir}: (missing)`);
            }
        } catch (err) {
            listings.push(`${dir}: (unreadable: ${err.message})`);
        }
    }

    const tried = absPaths.join(', ');
    const extra = listings.length ? `\nTried: ${tried}\nDirectory listings:\n- ${listings.join('\n- ')}` : `\nTried: ${tried}`;
    throw new Error(`${hint || 'Required file missing'}${extra}`);
}

async function normalizeTlsDir(tlsDir) {
    // Copilot note: Fabric runtime expects stable filenames (key.pem, cert.pem, tls-cert.pem).
    const keystoreDir = path.join(tlsDir, 'keystore');
    const signcertsDir = path.join(tlsDir, 'signcerts');
    const tlscacertsDir = path.join(tlsDir, 'tlscacerts');
    const cacertsDir = path.join(tlsDir, 'cacerts');

    const keyFiles = (await fs.pathExists(keystoreDir)) ? await fs.readdir(keystoreDir) : [];
    const certFiles = (await fs.pathExists(signcertsDir)) ? await fs.readdir(signcertsDir) : [];
    const caFiles = (await fs.pathExists(tlscacertsDir)) ? await fs.readdir(tlscacertsDir) : [];
    const caFallbackFiles = (await fs.pathExists(cacertsDir)) ? await fs.readdir(cacertsDir) : [];

    if (keyFiles.length) {
        const src = path.join(keystoreDir, keyFiles[0]);
        await fs.copy(src, path.join(keystoreDir, 'key.pem'));
    }
    if (certFiles.length) {
        const src = path.join(signcertsDir, certFiles[0]);
        await fs.copy(src, path.join(signcertsDir, 'cert.pem'));
    }
    if (caFiles.length) {
        const src = path.join(tlscacertsDir, caFiles[0]);
        await fs.copy(src, path.join(tlscacertsDir, 'tls-cert.pem'));
    } else if (caFallbackFiles.length) {
        // Some enroll flows place the CA cert in `cacerts`; mirror it to `tlscacerts/tls-cert.pem`.
        await fs.ensureDir(tlscacertsDir);
        const src = path.join(cacertsDir, caFallbackFiles[0]);
        await fs.copy(src, path.join(tlscacertsDir, 'tls-cert.pem'));
    }
}

async function normalizeMspDir(mspDir) {
    // Copilot note: provide deterministic CA cert filenames and NodeOUs config to reduce downstream tooling assumptions.
    const cacertsDir = path.join(mspDir, 'cacerts');
    const tlscacertsDir = path.join(mspDir, 'tlscacerts');

    const caFiles = (await fs.pathExists(cacertsDir)) ? await fs.readdir(cacertsDir) : [];
    const tlsCaFiles = (await fs.pathExists(tlscacertsDir)) ? await fs.readdir(tlscacertsDir) : [];

    if (caFiles.length) {
        await fs.copy(path.join(cacertsDir, caFiles[0]), path.join(cacertsDir, 'ca-cert.pem'));
    }
    if (tlsCaFiles.length) {
        await fs.copy(path.join(tlscacertsDir, tlsCaFiles[0]), path.join(tlscacertsDir, 'tls-ca-cert.pem'));
    }

    const configYamlPath = path.join(mspDir, 'config.yaml');
    const hasConfigYaml = await fs.pathExists(configYamlPath);
    if (!hasConfigYaml && caFiles.length) {
        const nodeOus = [
            'NodeOUs:',
            '  Enable: true',
            '  ClientOUIdentifier:',
            '    Certificate: cacerts/ca-cert.pem',
            '    OrganizationalUnitIdentifier: client',
            '  PeerOUIdentifier:',
            '    Certificate: cacerts/ca-cert.pem',
            '    OrganizationalUnitIdentifier: peer',
            '  AdminOUIdentifier:',
            '    Certificate: cacerts/ca-cert.pem',
            '    OrganizationalUnitIdentifier: admin',
            '  OrdererOUIdentifier:',
            '    Certificate: cacerts/ca-cert.pem',
            '    OrganizationalUnitIdentifier: orderer',
            '',
        ].join('\n');
        await fs.writeFile(configYamlPath, nodeOus);
    }
}

async function assertOrdererTlsGenerated(workspace, relTlsDir, ordererLabel) {
    const absTlsDir = path.join(workspace, relTlsDir);
    const required = [
        path.join(absTlsDir, 'keystore', 'key.pem'),
        path.join(absTlsDir, 'signcerts', 'cert.pem'),
        path.join(absTlsDir, 'tlscacerts', 'tls-cert.pem'),
    ];

    const missing = [];
    const diagnostics = [];
    try {
        if (!(await fs.pathExists(absTlsDir))) {
            throw new Error(`TLS dir missing: ${absTlsDir}`);
        }
        const parentListing = await fs.readdir(path.dirname(absTlsDir)).catch(() => []);
        diagnostics.push(`parent:${path.dirname(absTlsDir)} -> ${parentListing.join(', ') || '(empty)'}`);
    } catch (err) {
        diagnostics.push(`dir-check-error: ${err.message}`);
    }

    for (const f of required) {
        try {
            if (!(await fs.pathExists(f))) {
                missing.push(f);
            } else {
                const st = await fs.stat(f);
                diagnostics.push(`${f}: mode=${(st.mode & 0o777).toString(8)} uid=${st.uid} gid=${st.gid}`);
            }
        } catch (err) {
            diagnostics.push(`${f}: stat-error=${err.message}`);
        }
    }

    if (missing.length) {
        const msg = `Orderer TLS generation incomplete for ${ordererLabel}. Missing files: ${missing.join(', ')}. Diagnostics:\n- ${diagnostics.join('\n- ')}`;
        throw new Error(msg);
    }
}

async function runFabricCaClient(workspace, userId, clientHomeRel, args, env = {}) {
    const img = getFabricCaImage();

    // Compose project name and default network name must match dockerCompose.js
    // figure out project/network and CA container name
    const project = getProjectNetwork(userId);              // "fabric-dev-user"
    const network = `${project}_${project}`;                // "fabric-dev-user_fabric-dev-user"
    const tlsCaHost = `tls-ca-${userId}`;                   // service/container name of TLS-CA
    
    const clientHome = `/workspace/${clientHomeRel}`.replace(/\/+/g, '/');
    const envArgs = Object.entries(env)
        .map(([k, v]) => `-e ${k}=${shellQuote(v)}`)
        .join(' ');
        
    
    // Inspect hostnames found in the `args` (e.g. enroll/register URLs) and
    // attempt to resolve container IPs for them so we can add `--add-host
    // <name>:<ip>` mappings. This ensures the TLS hostname used in the URL
    // matches the certificate SAN seen by the CA server container.
    const hostnames = new Set();
    try {
        const urlRe = /https?:\/\/(?:[^@\s]+@)?([^:\/\s'"\)]+)/g;
        let m;
        while ((m = urlRe.exec(args)) !== null) {
            if (m[1]) hostnames.add(m[1]);
        }
        // Always include the tlsCaHost as we commonly map `localhost` to it
        hostnames.add(tlsCaHost);
        // localhost is not a docker object; skip inspect noise and keep it synthetic.
        hostnames.delete('localhost');
    } catch (err) {
        logger.debug('[DEBUG] failed to parse hostnames from args', { err: err.message });
    }

    const addHostArgs = [];
    const hnToIp = new Map();
    for (const hn of hostnames) {
        try {
            const inspectCmd = `docker inspect --format "{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}" ${hn}`;
            const { stdout: ipRaw } = await execAsync(inspectCmd);
            const ip = (ipRaw || '').trim();
            if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) {
                addHostArgs.push(`--add-host ${hn}:${ip}`);
                hnToIp.set(hn, ip);
            } else {
                logger.debug('[DEBUG] inspect returned non-ip, skipping add-host', { hn, ip });
            }
        } catch (err) {
            logger.debug('[DEBUG] docker inspect failed for hostname, skipping', { hn, err: err.message });
        }
    }

    // If any CA container IP was discovered, prefer using `localhost` in the
    // fabric-ca-client URL so that TLS certs that include SAN=localhost will
    // validate correctly. Map `localhost` to the first discovered CA IP.
    let modifiedArgs = args;
    const caNamePattern = /^(tls-ca-|ca-orderer-|ca-)/;
    for (const [hn, ip] of hnToIp.entries()) {
        if (caNamePattern.test(hn)) {
            // ensure localhost is mapped to the CA container IP (preferred)
            const localhostMap = `--add-host localhost:${ip}`;
            if (!addHostArgs.includes(localhostMap)) addHostArgs.push(localhostMap);
            // also keep original hostname mapping (useful for debugging)
            const hostMap = `--add-host ${hn}:${ip}`;
            if (!addHostArgs.includes(hostMap)) addHostArgs.push(hostMap);
            // replace hostname occurrences in args with 'localhost'
            const safeHn = hn.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
            modifiedArgs = modifiedArgs.replace(new RegExp(safeHn, 'g'), 'localhost');
        }
    }

    // Run container as the same UID/GID as the current process so files created
    // inside the mounted workspace are owned by the host user instead of root.
    const hostUid = (typeof process.getuid === 'function') ? process.getuid() : 0;
    const hostGid = (typeof process.getgid === 'function') ? process.getgid() : 0;

    const cmd = [
        'docker run --rm',
        `-u ${hostUid}:${hostGid}`,
        `--network ${network}`,
        addHostArgs.join(' '),
        `-v "${workspace}:/workspace"`,
        envArgs,
        `-e FABRIC_CA_CLIENT_HOME=${shellQuote(clientHome)}`,
        '--workdir /workspace',
        img,
        'bash -lc',
        shellQuote(`set -euo pipefail\n${modifiedArgs}`),
    ].filter(Boolean).join(' ');

    return execAsync(cmd);
}
async function enroll(workspace, userId, clientHomeRel, enrollUrl, tlsCertFileRel, mspOutRel, extraArgs = '') {
    const tlsCertFile = `/workspace/${tlsCertFileRel}`;
    const mspOut = `/workspace/${mspOutRel}`;
    await runFabricCaClient(
        workspace,
        userId,
        clientHomeRel,
        `fabric-ca-client enroll -u ${shellQuote(enrollUrl)} --tls.certfiles ${shellQuote(tlsCertFile)} -M ${shellQuote(mspOut)} ${extraArgs}`
    );
}

async function registerIdentity(workspace, userId, clientHomeRel, caUrl, tlsCertFileRel, idName, idSecret, idType) {
    const tlsCertFile = `/workspace/${tlsCertFileRel}`;
    await runFabricCaClient(
        workspace,
        userId,
        clientHomeRel,
        `fabric-ca-client register --id.name ${shellQuote(idName)} --id.secret ${shellQuote(idSecret)} --id.type ${shellQuote(idType)} -u ${shellQuote(caUrl)} --tls.certfiles ${shellQuote(tlsCertFile)}`
    );
}

async function generateCryptoMaterial(workspace, userId, config, opts = {}) {
    const progress = opts.progress;
    const channelId = (config && config.channelId) ? config.channelId : 'mainchannel';

    if (!workspace || !userId) {
        throw new Error('generateCryptoMaterial requires (workspace, userId, config)');
    }

    // Ensure base dirs exist
    await fs.ensureDir(path.join(workspace, 'crypto-config'));
    await fs.ensureDir(path.join(workspace, 'channel-artifacts'));

    // Pre-create directories where CA servers will write cert material.
    // This ensures they exist and are owned by the host user before CA containers
    // (which run as root) try to write into them.
    const dirsToCreate = [
        'crypto-config/tls-ca',
        'crypto-config/ordererOrg',
        'crypto-config/ordererOrg/ca',
    ];
    for (const org of (config.orgs || [])) {
        dirsToCreate.push(`crypto-config/${org.name}`);
        dirsToCreate.push(`crypto-config/${org.name}/ca`);
        dirsToCreate.push(`crypto-config/${org.name}/peers`);
        dirsToCreate.push(`crypto-config/${org.name}/users`);
        dirsToCreate.push(`crypto-config/${org.name}/msp`);
    }
    dirsToCreate.push('crypto-config/ordererOrg/orderers');
    dirsToCreate.push('crypto-config/ordererOrg/msp');
    dirsToCreate.push('crypto-config/ordererOrg/users');
    for (let i = 0; i < (config.ordererCount || 1); i++) {
        const ordererLabel = i === 0 ? 'orderer' : `orderer${i + 1}`;
        dirsToCreate.push(`crypto-config/ordererOrg/orderers/${ordererLabel}`);
    }
    
    for (const dir of dirsToCreate) {
        await fs.ensureDir(path.join(workspace, dir));
    }

    // Preflight: detect crypto-config ownership problems caused by prior container runs
    try {
        const cryptoDir = path.join(workspace, 'crypto-config');
        if (await fs.pathExists(cryptoDir)) {
            const st = await fs.stat(cryptoDir).catch(() => null);
            const currentUid = (typeof process.getuid === 'function') ? process.getuid() : 0;
            const currentGid = (typeof process.getgid === 'function') ? process.getgid() : 0;
            if (st && (st.uid !== currentUid || st.gid !== currentGid)) {
                throw new Error(`Detected crypto-config owned by ${st.uid}:${st.gid}. This prevents the CA client from writing TLS files as the host user. Remediation: either remove or change ownership of the directory. Example commands:\n  sudo rm -rf ${cryptoDir} || sudo chown -R ${currentUid}:${currentGid} ${cryptoDir}`);
            }
        }
    } catch (err) {
        throw err;
    }

    // --- Locate TLS/CA cert files on disk ---

    // TLS-CA: try tls-cert.pem first, fall back to ca-cert.pem
    const tlsCaCertRel = await waitForAnyRelativeFile(
        workspace,
        ['crypto-config/tls-ca/tls-cert.pem', 'crypto-config/tls-ca/ca-cert.pem'],
        'TLS-CA server TLS cert not found (is composeUpCA running / healthy?)'
    );

    // Orderer CA
    const ordererCaCertRel = await waitForAnyRelativeFile(
        workspace,
        ['crypto-config/ordererOrg/ca/tls-cert.pem', 'crypto-config/ordererOrg/ca/ca-cert.pem'],
        'Orderer CA server TLS cert not found (is composeUpCA running / healthy?)'
    );

    // Org CAs
    const orgCaCertRelByOrg = {};
    for (const org of (config.orgs || [])) {
        orgCaCertRelByOrg[org.name] = await waitForAnyRelativeFile(
            workspace,
            [`crypto-config/${org.name}/ca/tls-cert.pem`, `crypto-config/${org.name}/ca/ca-cert.pem`],
            `Org CA server TLS cert not found for ${org.name} (is composeUpCA running / healthy?)`
        );
    }

    // --- CA URLs (TLS CA uses localhost to match cert SAN) ---

    const tlsCaUrl = `https://tls-admin:tls-adminpw@localhost:${config.tlsCaPort}`;
    const ordererCaUrl = `https://ca-orderer-${userId}:${config.ordererCaPort}`;
    // Use a workspace-root client home to avoid writing into possibly root-owned
    // `crypto-config` directories. This avoids permission errors when `crypto-config`
    // was created by a previous container run as root.
    const clientRoot = '.ca-client';

    // Ensure the clientRoot exists and is writable by the current process.
    await fs.ensureDir(path.join(workspace, clientRoot));

    // === TLS CA admin enroll ===
    if (typeof progress === 'function') progress({ step: 'crypto.enroll.tlsCaAdmin', channelId });
    logger.debug('[DEBUG] crypto: enrolling TLS CA admin');

    await enroll(
        workspace,
        userId,
        `${clientRoot}/tls-ca-admin`,
        `https://tls-admin:tls-adminpw@localhost:${config.tlsCaPort}`,
        tlsCaCertRel,
        `${clientRoot}/tls-ca-admin/msp`
    );
    // === TLS certs for peers ===
    for (const org of (config.orgs || [])) {
        for (let i = 0; i < org.peerCount; i++) {
            const idName = `${org.name}-peer${i}`;
            const idSecret = secretFor(idName);

            try {
                await registerIdentity(
                    workspace,
                    userId,
                    `${clientRoot}/tls-ca-admin`,
                    tlsCaUrl,
                    tlsCaCertRel,
                    idName,
                    idSecret,
                    'peer'
                );
            } catch (err) {
                if (!/already registered|exists/i.test(err.message)) throw err;
            }

            const tlsOutRel = `crypto-config/${org.name}/peers/peer${i}/tls`;
            const hosts = [
                `--csr.hosts peer${i}.${org.name}`,
                `--csr.hosts peer${i}-${org.name}-${userId}`,
                `--csr.hosts localhost`,
                `--csr.hosts 127.0.0.1`,
            ].join(' ');

            if (typeof progress === 'function') progress({ step: 'crypto.enroll.peerTls', org: org.name, peer: i });
            await enroll(
                workspace,
                userId,
                `${clientRoot}/tls-ca-admin`,
                `https://${idName}:${idSecret}@localhost:${config.tlsCaPort}`,
                tlsCaCertRel,
                tlsOutRel,
                `--enrollment.profile tls ${hosts}`
            );
            await normalizeTlsDir(path.join(workspace, tlsOutRel));
        }
    }

    // === TLS certs for orderers ===
    const ordererCount = config.ordererCount || 1;
    for (let i = 0; i < ordererCount; i++) {
        const ordererLabel = i === 0 ? 'orderer' : `orderer${i + 1}`;
        const idName = ordererLabel;
        const idSecret = secretFor(idName);

        try {
            await registerIdentity(
                workspace,
                userId,
                `${clientRoot}/tls-ca-admin`,
                tlsCaUrl,
                tlsCaCertRel,
                idName,
                idSecret,
                'orderer'
            );
        } catch (err) {
            if (!/already registered|exists/i.test(err.message)) throw err;
        }

        const tlsOutRel = `crypto-config/ordererOrg/orderers/${ordererLabel}/tls`;
        const hosts = [
            `--csr.hosts ${ordererLabel}`,
            `--csr.hosts ${ordererLabel}-${userId}`,
            `--csr.hosts localhost`,
            `--csr.hosts 127.0.0.1`,
        ].join(' ');

        if (typeof progress === 'function') progress({ step: 'crypto.enroll.ordererTls', orderer: ordererLabel });
        await enroll(
            workspace,
            userId,
            `${clientRoot}/tls-ca-admin`,
            `https://${idName}:${idSecret}@localhost:${config.tlsCaPort}`,
            tlsCaCertRel,
            tlsOutRel,
            `--enrollment.profile tls ${hosts}`
        );
        await normalizeTlsDir(path.join(workspace, tlsOutRel));
        // Verify TLS files exist and provide diagnostics on failure to help debugging
        await assertOrdererTlsGenerated(workspace, tlsOutRel, ordererLabel);
    }

    // === Orderer CA admin, org admin, MSPs, peers MSPs ===
    // (this whole block is identical to what you already have; keeping it unchanged)

    if (typeof progress === 'function') progress({ step: 'crypto.enroll.ordererCaAdmin' });
    logger.debug('[DEBUG] crypto: enrolling Orderer CA admin');
    await enroll(
        workspace,
        userId,
        `${clientRoot}/orderer-ca-admin`,
        `https://ordereradmin:ordereradminpw@ca-orderer-${userId}:${config.ordererCaPort}`,
        ordererCaCertRel,
        `${clientRoot}/orderer-ca-admin/msp`
    );

    const ordererOrgAdminId = 'ordererOrg-admin';
    const ordererOrgAdminSecret = secretFor(ordererOrgAdminId);
    try {
        await registerIdentity(
            workspace,
            userId,
            `${clientRoot}/orderer-ca-admin`,
            ordererCaUrl,
            ordererCaCertRel,
            ordererOrgAdminId,
            ordererOrgAdminSecret,
            'admin'
        );
    } catch (err) {
        if (!/already registered|exists/i.test(err.message)) throw err;
    }
    if (typeof progress === 'function') progress({ step: 'crypto.enroll.ordererOrgAdmin' });
    await enroll(
        workspace,
        userId,
        `${clientRoot}/orderer-org-admin`,
        `https://${ordererOrgAdminId}:${ordererOrgAdminSecret}@ca-orderer-${userId}:${config.ordererCaPort}`,
        ordererCaCertRel,
        `crypto-config/ordererOrg/users/Admin@ordererOrg/msp`
    );
    await normalizeMspDir(path.join(workspace, 'crypto-config/ordererOrg/users/Admin@ordererOrg/msp'));

    if (typeof progress === 'function') progress({ step: 'crypto.enroll.ordererOrgMsp' });
    await enroll(
        workspace,
        userId,
        `${clientRoot}/orderer-org-admin`,
        `https://${ordererOrgAdminId}:${ordererOrgAdminSecret}@ca-orderer-${userId}:${config.ordererCaPort}`,
        ordererCaCertRel,
        `crypto-config/ordererOrg/msp`
    );
    await normalizeMspDir(path.join(workspace, 'crypto-config/ordererOrg/msp'));

    for (let i = 0; i < ordererCount; i++) {
        const ordererLabel = i === 0 ? 'orderer' : `orderer${i + 1}`;
        const idName = `${ordererLabel}-msp`;
        const idSecret = secretFor(idName);
        try {
            await registerIdentity(
                workspace,
                userId,
                `${clientRoot}/orderer-ca-admin`,
                ordererCaUrl,
                ordererCaCertRel,
                idName,
                idSecret,
                'orderer'
            );
        } catch (err) {
            if (!/already registered|exists/i.test(err.message)) throw err;
        }
        if (typeof progress === 'function') progress({ step: 'crypto.enroll.ordererMsp', orderer: ordererLabel });
        await enroll(
            workspace,
            userId,
            `${clientRoot}/orderer-${ordererLabel}-msp`,
            `https://${idName}:${idSecret}@ca-orderer-${userId}:${config.ordererCaPort}`,
            ordererCaCertRel,
            `crypto-config/ordererOrg/orderers/${ordererLabel}/msp`
        );
        await normalizeMspDir(path.join(workspace, `crypto-config/ordererOrg/orderers/${ordererLabel}/msp`));
    }

    for (const org of (config.orgs || [])) {
        const orgCaUrl = `https://ca-${org.name}-${userId}:${org.caPort}`;
        const orgCaCertRel = orgCaCertRelByOrg[org.name];
        const orgAdminEnrollUser = `${org.name}admin`;
        const orgAdminEnrollPass = `${org.name}adminpw`;

        if (typeof progress === 'function') progress({ step: 'crypto.enroll.orgCaAdmin', org: org.name });
        await enroll(
            workspace,
            userId,
            `${clientRoot}/org-ca-admin-${org.name}`,
            `https://${orgAdminEnrollUser}:${orgAdminEnrollPass}@ca-${org.name}-${userId}:${org.caPort}`,
            orgCaCertRel,
            `${clientRoot}/org-ca-admin-${org.name}/msp`
        );

        const orgAdminId = `${org.name}-admin`;
        const orgAdminSecret = secretFor(orgAdminId);
        try {
            await registerIdentity(
                workspace,
                userId,
                `${clientRoot}/org-ca-admin-${org.name}`,
                orgCaUrl,
                orgCaCertRel,
                orgAdminId,
                orgAdminSecret,
                'admin'
            );
        } catch (err) {
            if (!/already registered|exists/i.test(err.message)) throw err;
        }

        if (typeof progress === 'function') progress({ step: 'crypto.enroll.orgAdmin', org: org.name });
        await enroll(
            workspace,
            userId,
            `${clientRoot}/org-admin-${org.name}`,
            `https://${orgAdminId}:${orgAdminSecret}@ca-${org.name}-${userId}:${org.caPort}`,
            orgCaCertRel,
            `crypto-config/${org.name}/users/Admin@${org.name}/msp`
        );
        await normalizeMspDir(path.join(workspace, `crypto-config/${org.name}/users/Admin@${org.name}/msp`));

        if (typeof progress === 'function') progress({ step: 'crypto.enroll.orgMsp', org: org.name });
        await enroll(
            workspace,
            userId,
            `${clientRoot}/org-admin-${org.name}`,
            `https://${orgAdminId}:${orgAdminSecret}@ca-${org.name}-${userId}:${org.caPort}`,
            orgCaCertRel,
            `crypto-config/${org.name}/msp`
        );
        await normalizeMspDir(path.join(workspace, `crypto-config/${org.name}/msp`));

        for (let i = 0; i < org.peerCount; i++) {
            const peerId = `${org.name}-peer${i}-msp`;
            const peerSecret = secretFor(peerId);
            try {
                await registerIdentity(
                    workspace,
                    userId,
                    `${clientRoot}/org-ca-admin-${org.name}`,
                    orgCaUrl,
                    orgCaCertRel,
                    peerId,
                    peerSecret,
                    'peer'
                );
            } catch (err) {
                if (!/already registered|exists/i.test(err.message)) throw err;
            }
            if (typeof progress === 'function') progress({ step: 'crypto.enroll.peerMsp', org: org.name, peer: i });
            await enroll(
                workspace,
                userId,
                `${clientRoot}/org-peer-${org.name}-peer${i}`,
                `https://${peerId}:${peerSecret}@ca-${org.name}-${userId}:${org.caPort}`,
                orgCaCertRel,
                `crypto-config/${org.name}/peers/peer${i}/msp`
            );
            await normalizeMspDir(path.join(workspace, `crypto-config/${org.name}/peers/peer${i}/msp`));
        }
    }

    logger.info(`[INFO] Crypto material generated for ${getProjectNetwork(userId)} (${channelId})`);
    if (typeof progress === 'function') progress({ step: 'crypto.done', channelId });
}

module.exports = { generateCryptoMaterial }