# Hyperledger Fabric – Schema-Agnostic SaaS Chaincode Setup Guide

> **Target stack:** Fabric v3.x · fabric-samples test-network · Node.js chaincode · CouchDB world state

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Install fabric-samples, Binaries & Docker Images](#2-install-fabric-samples-binaries--docker-images)
3. [Scaffold Your Chaincode Package](#3-scaffold-your-chaincode-package)
4. [Full Chaincode Source Files](#4-full-chaincode-source-files)
5. [CouchDB Index Definitions](#5-couchdb-index-definitions)
6. [Bring Up the Test Network with CouchDB](#6-bring-up-the-test-network-with-couchdb)
7. [Deploy the Chaincode](#7-deploy-the-chaincode)
8. [Smoke-Test the Chaincode via Peer CLI](#8-smoke-test-the-chaincode-via-peer-cli)
9. [Directory Structure Reference](#9-directory-structure-reference)
10. [Switching Between LevelDB and CouchDB](#10-switching-between-leveldb-and-couchdb)
11. [Common Errors & Fixes](#11-common-errors--fixes)

---

## 1. Prerequisites

Install all of these **before** touching Fabric.

| Tool                | Minimum Version | Install hint                                                             |
| ------------------- | --------------- | ------------------------------------------------------------------------ |
| **Git**             | any recent      | `sudo apt install git`                                                   |
| **cURL**            | any recent      | `sudo apt install curl`                                                  |
| **Docker**          | 20.10+          | https://docs.docker.com/engine/install/                                  |
| **Docker Compose**  | v2 (plugin)     | bundled with Docker Desktop; or `sudo apt install docker-compose-plugin` |
| **Node.js**         | 18 LTS          | https://nodejs.org — use `nvm` to manage versions                        |
| **npm**             | 8+              | ships with Node.js                                                       |
| **Go** _(optional)_ | 1.21+           | only needed if you later add Go chaincode                                |

Verify Docker is running and your user is in the `docker` group:

```bash
docker version
docker compose version
# If permission denied: sudo usermod -aG docker $USER && newgrp docker
```

---

## 2. Install fabric-samples, Binaries & Docker Images

This single script does everything: clones fabric-samples, downloads platform binaries
(`peer`, `orderer`, `configtxgen`, etc.), and pulls all Docker images.

```bash
# Pick a workspace directory
mkdir -p /workspaces//hyperledger && cd $HOME/hyperledger

# Download the installer script
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh
chmod +x install-fabric.sh

# Install samples + binaries + docker images (latest stable)
./install-fabric.sh docker binary samples

# OR pin a specific version, e.g. Fabric 3.1.0 / CA 1.5.13
# ./install-fabric.sh --fabric-version 3.1.0 --ca-version 1.5.13 docker binary samples
```

After this completes you will have:

```
$HOME/hyperledger/
└── fabric-samples/
    ├── bin/                  ← peer, orderer, configtxgen, fabric-ca-client …
    ├── config/               ← core.yaml, orderer.yaml, configtx.yaml
    └── test-network/         ← the Docker Compose test network
```

Add the binaries to your PATH permanently:

```bash
echo 'export PATH=$HOME/hyperledger/fabric-samples/bin:$PATH' >> ~/.bashrc
echo 'export FABRIC_CFG_PATH=$HOME/hyperledger/fabric-samples/config' >> ~/.bashrc
source ~/.bashrc

# Verify
peer version
```

---

## 3. Scaffold Your Chaincode Package

Place your chaincode **inside** `fabric-samples` so the test-network scripts can resolve relative paths easily.

```bash
cd $HOME/hyperledger/fabric-samples

# Create the chaincode folder (mirrors the asset-transfer-basic pattern)
mkdir -p saas-ledger/chaincode-javascript
cd saas-ledger/chaincode-javascript

# Initialise npm package
npm init -y

# Install Fabric contract API
npm install fabric-contract-api fabric-shim

# Create the CouchDB index directory
mkdir -p META-INF/statedb/couchdb/indexes
```

---

## 4. Full Chaincode Source Files

### `package.json`

```json
{
  "name": "saas-ledger",
  "version": "1.0.0",
  "description": "Schema-agnostic multi-tenant ledger for Hyperledger Fabric",
  "main": "index.js",
  "scripts": {
    "start": "fabric-chaincode-node start",
    "start:server": "fabric-chaincode-node server --chaincode-address=$CHAINCODE_SERVER_ADDRESS --chaincode-id=$CHAINCODE_ID"
  },
  "engines": { "node": ">=18" },
  "dependencies": {
    "fabric-contract-api": "^2.5.0",
    "fabric-shim": "^2.5.0"
  }
}
```

### `index.js`

```javascript
"use strict";

const { SchemaAgnosticLedger } = require("./lib/saasLedger");

module.exports.SchemaAgnosticLedger = SchemaAgnosticLedger;
module.exports.contracts = [SchemaAgnosticLedger];
```

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm install --production

# Copy chaincode source
COPY index.js ./
COPY lib/ ./lib/
COPY META-INF/ ./META-INF/

# CCaaS mode: peer connects to us, we don't connect to the peer
ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:9999

CMD ["node_modules/.bin/fabric-chaincode-node", "server", \
     "--chaincode-address=0.0.0.0:9999", \
     "--chaincode-id=$CHAINCODE_ID"]
```

### `lib/saasLedger.js`

```javascript
"use strict";

const { Contract } = require("fabric-contract-api");

// ── Constants ────────────────────────────────────────────────────────────────
const ASSET_DOC_TYPE = "asset";
const KEY_PREFIX = "asset"; // composite key object type

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildKey(ctx, tenantId, assetType, assetId) {
  return ctx.stub.createCompositeKey(KEY_PREFIX, [
    tenantId,
    assetType,
    assetId,
  ]);
}

/**
 * In production: read tenantId from a custom x.509 attribute on the cert.
 * For dev/testing: fall back to MSPID so Org1 = tenant-org1, Org2 = tenant-org2.
 */
function resolveTenant(ctx) {
  const cid = ctx.clientIdentity;
  const tenantAttr = cid.getAttributeValue("tenantId");
  return tenantAttr || cid.getMSPID();
}

function utcNow() {
  return new Date().toISOString();
}

function requireArgs(map) {
  for (const [name, val] of Object.entries(map)) {
    if (!val || val.toString().trim() === "") {
      throw new Error(`Required argument missing or empty: ${name}`);
    }
  }
}

async function collectIterator(iterator) {
  const results = [];
  while (true) {
    const res = await iterator.next();
    if (res.done) break;
    results.push(JSON.parse(res.value.value.toString()));
  }
  await iterator.close();
  return JSON.stringify(results);
}

// ── Chaincode ─────────────────────────────────────────────────────────────────

class SchemaAgnosticLedger extends Contract {
  async initLedger(ctx) {
    console.log("SchemaAgnosticLedger initialised");
  }

  // ── putAsset ─────────────────────────────────────────────────────────────
  // Upsert an asset with an arbitrary JSON payload.
  async putAsset(ctx, assetType, assetId, payloadJson) {
    requireArgs({ assetType, assetId, payloadJson });

    const tenantId = resolveTenant(ctx);
    const key = buildKey(ctx, tenantId, assetType, assetId);
    const now = utcNow();

    let payload;
    try {
      payload = JSON.parse(payloadJson);
    } catch (e) {
      throw new Error(`payloadJson is not valid JSON: ${e.message}`);
    }

    const existing = await ctx.stub.getState(key);
    let version = 1;
    let createdAt = now;
    let createdBy = ctx.clientIdentity.getID();

    if (existing && existing.length > 0) {
      const prev = JSON.parse(existing.toString());
      version = (prev.version || 0) + 1;
      createdAt = prev.createdAt;
      createdBy = prev.createdBy;
    }

    const envelope = {
      docType: ASSET_DOC_TYPE, // required for CouchDB Mango queries
      tenantId,
      assetType,
      assetId,
      version,
      createdAt,
      updatedAt: now,
      createdBy,
      updatedBy: ctx.clientIdentity.getID(),
      payload,
    };

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(envelope)));

    ctx.stub.setEvent(
      "AssetUpserted",
      Buffer.from(
        JSON.stringify({
          tenantId,
          assetType,
          assetId,
          version,
        }),
      ),
    );

    return JSON.stringify(envelope);
  }

  // ── getAsset ─────────────────────────────────────────────────────────────
  async getAsset(ctx, assetType, assetId) {
    requireArgs({ assetType, assetId });

    const tenantId = resolveTenant(ctx);
    const key = buildKey(ctx, tenantId, assetType, assetId);
    const raw = await ctx.stub.getState(key);

    if (!raw || raw.length === 0) {
      throw new Error(`Asset not found: ${tenantId}/${assetType}/${assetId}`);
    }
    return raw.toString();
  }

  // ── getAssetHistory ───────────────────────────────────────────────────────
  async getAssetHistory(ctx, assetType, assetId) {
    requireArgs({ assetType, assetId });

    const tenantId = resolveTenant(ctx);
    const key = buildKey(ctx, tenantId, assetType, assetId);
    const iterator = await ctx.stub.getHistoryForKey(key);
    const history = [];

    while (true) {
      const res = await iterator.next();
      if (res.done) break;
      const record = res.value;
      history.push({
        txId: record.txId,
        timestamp: record.timestamp,
        isDelete: record.isDelete,
        value: record.isDelete ? null : JSON.parse(record.value.toString()),
      });
    }

    await iterator.close();
    return JSON.stringify(history);
  }

  // ── listAssetsByType ──────────────────────────────────────────────────────
  // Works on both LevelDB and CouchDB via composite key range scan.
  async listAssetsByType(ctx, assetType) {
    requireArgs({ assetType });

    const tenantId = resolveTenant(ctx);
    const iterator = await ctx.stub.getStateByPartialCompositeKey(KEY_PREFIX, [
      tenantId,
      assetType,
    ]);
    return collectIterator(iterator);
  }

  // ── listAllTenantAssets ───────────────────────────────────────────────────
  async listAllTenantAssets(ctx) {
    const tenantId = resolveTenant(ctx);
    const iterator = await ctx.stub.getStateByPartialCompositeKey(KEY_PREFIX, [
      tenantId,
    ]);
    return collectIterator(iterator);
  }

  // ── queryAssets ───────────────────────────────────────────────────────────
  // CouchDB only. Accepts a Mango selector; always injects tenantId server-side.
  async queryAssets(ctx, selectorJson, bookmark = "", pageSize = "25") {
    const tenantId = resolveTenant(ctx);

    let userSelector;
    try {
      userSelector = JSON.parse(selectorJson);
    } catch (e) {
      throw new Error(`selectorJson is not valid JSON: ${e.message}`);
    }

    const selector = {
      ...userSelector,
      docType: ASSET_DOC_TYPE,
      tenantId, // ← always injected; callers cannot override
    };

    const { iterator, metadata } = await ctx.stub.getQueryResultWithPagination(
      JSON.stringify({ selector }),
      parseInt(pageSize, 10),
      bookmark,
    );

    const results = JSON.parse(await collectIterator(iterator));

    return JSON.stringify({
      results,
      metadata: {
        recordsCount: metadata.fetchedRecordsCount,
        bookmark: metadata.bookmark,
      },
    });
  }

  // ── deleteAsset (soft) ────────────────────────────────────────────────────
  async deleteAsset(ctx, assetType, assetId) {
    requireArgs({ assetType, assetId });

    const tenantId = resolveTenant(ctx);
    const key = buildKey(ctx, tenantId, assetType, assetId);
    const raw = await ctx.stub.getState(key);

    if (!raw || raw.length === 0) {
      throw new Error(`Asset not found: ${tenantId}/${assetType}/${assetId}`);
    }

    const envelope = JSON.parse(raw.toString());
    envelope.deleted = true;
    envelope.deletedAt = utcNow();
    envelope.deletedBy = ctx.clientIdentity.getID();
    envelope.version += 1;

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(envelope)));

    ctx.stub.setEvent(
      "AssetDeleted",
      Buffer.from(
        JSON.stringify({
          tenantId,
          assetType,
          assetId,
        }),
      ),
    );
  }
}

module.exports = { SchemaAgnosticLedger };
```

---

## 5. CouchDB Index Definitions

These files are **automatically deployed** when the chaincode is installed on a CouchDB-backed peer.

### `META-INF/statedb/couchdb/indexes/indexTenantType.json`

```json
{
  "index": {
    "fields": ["docType", "tenantId", "assetType", "updatedAt"]
  },
  "ddoc": "indexTenantTypeDoc",
  "name": "indexTenantType",
  "type": "json"
}
```

### `META-INF/statedb/couchdb/indexes/indexTenantTypeId.json`

```json
{
  "index": {
    "fields": ["docType", "tenantId", "assetType", "assetId"]
  },
  "ddoc": "indexTenantTypeIdDoc",
  "name": "indexTenantTypeId",
  "type": "json"
}
```

---

## 6. Bring Up the Test Network with CouchDB

```bash
cd $HOME/hyperledger/fabric-samples/test-network

# Tear down any previous network
./network.sh down

# Start with CouchDB as the world state database
./network.sh up createChannel -ca -s couchdb

# -ca        → use Fabric CA (realistic crypto material)
# -s couchdb → peer world state backed by CouchDB
# createChannel → creates the default "mychannel"
```

Verify all containers are running:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

You should see containers for `peer0.org1`, `peer0.org2`, `orderer`, `ca_org1`, `ca_org2`, `ca_orderer`, `couchdb0`, `couchdb1`.

---

## 7. Deploy the Chaincode

The `deployCC` subcommand of `network.sh` runs the full v2 lifecycle:
package → install on both peers → approve for Org1 → approve for Org2 → commit.

```bash
cd $HOME/hyperledger/fabric-samples/test-network

./network.sh deployCC \
  -ccn saas-ledger \
  -ccp ../saas-ledger/chaincode-javascript \
  -ccl javascript \
  -ccv 1.0 \
  -ccs 1 \
  -ccep "AND('Org1MSP.peer','Org2MSP.peer')"
```

Flag reference:

| Flag    | Meaning                                      |
| ------- | -------------------------------------------- |
| `-ccn`  | Chaincode name (used in invoke/query calls)  |
| `-ccp`  | Path to your chaincode folder                |
| `-ccl`  | Language: `javascript`                       |
| `-ccv`  | Version label                                |
| `-ccs`  | Sequence number (increment on every upgrade) |
| `-ccep` | Endorsement policy                           |

If deployment succeeds you will see:

```
Chaincode definition committed on channel 'mychannel'
```

**To upgrade** (after editing the chaincode):

```bash
./network.sh deployCC \
  -ccn saas-ledger \
  -ccp ../saas-ledger/chaincode-javascript \
  -ccl javascript \
  -ccv 2.0 \
  -ccs 2 \
  -ccep "AND('Org1MSP.peer','Org2MSP.peer')"
```

---

## 8. Smoke-Test the Chaincode via Peer CLI

Set environment variables to talk to `peer0.org1`:

```bash
cd $HOME/hyperledger/fabric-samples/test-network

export PATH=$HOME/hyperledger/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=$HOME/hyperledger/fabric-samples/config
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
```

### 8a. Write an asset (putAsset)

The `tenantId` will be resolved from the MSP on the peer, so `Org1MSP` becomes the tenant.

```bash
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls \
  --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" \
  -C mychannel \
  -n saas-ledger \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" \
  -c '{"function":"putAsset","Args":["invoice","inv-001","{\"amount\":1500,\"currency\":\"PHP\",\"dueDate\":\"2025-02-01\"}"]}'
```

### 8b. Read the asset back (getAsset)

```bash
peer chaincode query \
  -C mychannel \
  -n saas-ledger \
  -c '{"function":"getAsset","Args":["invoice","inv-001"]}'
```

Expected output (formatted):

```json
{
  "docType": "asset",
  "tenantId": "Org1MSP",
  "assetType": "invoice",
  "assetId": "inv-001",
  "version": 1,
  "createdAt": "2025-...",
  "updatedAt": "2025-...",
  "payload": {
    "amount": 1500,
    "currency": "PHP",
    "dueDate": "2025-02-01"
  }
}
```

### 8c. List all invoices for this tenant

```bash
peer chaincode query \
  -C mychannel \
  -n saas-ledger \
  -c '{"function":"listAssetsByType","Args":["invoice"]}'
```

### 8d. Rich CouchDB query (queryAssets)

```bash
peer chaincode query \
  -C mychannel \
  -n saas-ledger \
  -c '{"function":"queryAssets","Args":["{\"assetType\":\"invoice\"}","",25]}'
```

### 8e. Get full audit history (getAssetHistory)

```bash
peer chaincode query \
  -C mychannel \
  -n saas-ledger \
  -c '{"function":"getAssetHistory","Args":["invoice","inv-001"]}'
```

### 8f. Soft-delete an asset

```bash
peer chaincode invoke \
  ... (same TLS flags as 8a) ... \
  -c '{"function":"deleteAsset","Args":["invoice","inv-001"]}'
```

---

## 9. Directory Structure Reference

```
fabric-samples/
├── bin/                          ← Fabric binaries (peer, orderer, …)
├── config/                       ← core.yaml, configtx.yaml
├── test-network/                 ← Docker Compose network scripts
│   ├── network.sh                ← main control script
│   ├── organizations/            ← generated crypto material
│   └── compose/                  ← Docker Compose files
└── saas-ledger/                  ← YOUR CHAINCODE (placed here)
    └── chaincode-javascript/
        ├── package.json
        ├── index.js
        ├── lib/
        │   └── saasLedger.js
        └── META-INF/
            └── statedb/
                └── couchdb/
                    └── indexes/
                        ├── indexTenantType.json
                        └── indexTenantTypeId.json
```

---

## 10. Switching Between LevelDB and CouchDB

| Bring up with…    | Command flag  | queryAssets available?                 |
| ----------------- | ------------- | -------------------------------------- |
| CouchDB           | `-s couchdb`  | ✅ Yes                                 |
| LevelDB (default) | _(omit `-s`)_ | ❌ No — use `listAssetsByType` instead |

> **Tip for your thesis:** Start dev with CouchDB, because `listAssetsByType` (composite key scan) works on _both_ DBs, making your chaincode portable. Only `queryAssets` is CouchDB-exclusive.

---

## 11. Common Errors & Fixes

| Error                                                                          | Cause                         | Fix                                                                      |
| ------------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------ |
| `Error: failed to connect to orderer`                                          | Network not up                | Run `./network.sh up createChannel -ca -s couchdb` first                 |
| `Error: could not assemble transaction: ProposalResponsePayloads do not match` | Endorsement from only one org | Always pass `--peerAddresses` for **both** peers in invoke commands      |
| `chaincode definition not agreed to by this org`                               | `deployCC` partially failed   | Run `./network.sh down` then re-deploy                                   |
| `Error: endorsement policy failure`                                            | Wrong MSP in `-ccep`          | Verify with `peer lifecycle chaincode querycommitted -C mychannel`       |
| `payloadJson is not valid JSON`                                                | Shell quoting issue           | Escape inner quotes: `'{\"key\":\"val\"}'` or use a file with `--isInit` |
| CouchDB index not used (slow queries)                                          | Index not deployed            | Check `META-INF` path exactly; redeploy with incremented `-ccs`          |
| `docker: permission denied`                                                    | User not in docker group      | `sudo usermod -aG docker $USER && newgrp docker`                         |
| Node.js version mismatch                                                       | Peer expects Node 18          | Use `nvm install 18 && nvm use 18`                                       |
