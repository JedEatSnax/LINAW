# LINAW Chaincodes

This folder is the home for **custom Hyperledger Fabric chaincodes** used by LINAW.

The repository includes multiple chaincode “types”:

- **asset_registry**: public world-state asset CRUD + transfer (the Fabric “asset-transfer basic” pattern)
- **approval_workflow**: private-data workflow chaincode with tighter guardrails
- **accounting_transaction_logs**: private-data logging chaincode with tighter guardrails

> Note: Some directories may start as documentation-only until the chaincode source is implemented.

## Fabric concepts (quick refresher)

- **Ledger**: immutable transaction history + current state.
- **World state**: key/value database (LevelDB/CouchDB) storing the *latest* value for each key.
- **Private data collections (PDC)**: data shared only among authorized orgs on a channel; non-members can see a hash on the ledger (depending on configuration).
- **Transaction function**: a chaincode function invoked by a client application; it reads/writes world state and/or private data.

## Chaincodes in this repo

### 1) Asset Registry (world state)

Purpose: demonstrate a minimal asset lifecycle on Fabric using **world state**.

Core capabilities:

- Create an asset
- Read an asset by key
- Update an asset
- Transfer an asset (change owner)
- Delete an asset

Suggested asset model:

```json
{
	"assetId": "asset-001",
	"owner": "userA",
	"type": "device",
	"status": "ACTIVE",
	"metadata": {
		"description": "example asset"
	}
}
```

Recommended conventions:

- Use a stable unique key (e.g., `assetId`) as the world state key.
- Keep updates deterministic (critical for endorsement consistency).
- Prefer a dedicated transfer transaction for ownership changes (avoid allowing `owner` to be changed through a generic update).

### 2) Approval Workflow (private data)

Purpose: model approval flows where request/decision data can be sensitive.

Design intent:

- Store sensitive approval payloads in **private data collections**.
- Apply **tighter guardrails** in chaincode (role checks, owner checks, org checks) because approval decisions are high-impact.

Typical operations (conceptual):

- Create approval request
- Approve / reject request
- Query approval status

### 3) Accounting Transaction Logs (private data)

Purpose: keep accounting/audit log entries that should not be visible to all channel members.

Design intent:

- Write log records to **private data collections**.
- Restrict write/read access with **tighter guardrails**.
- Optionally maintain a public reference (e.g., an ID or hash) in world state when you need public traceability without disclosing sensitive content.

## Guardrails (recommended approach)

Even if your backend enforces RBAC, critical rules should eventually be enforced at the chaincode layer for consistency and safety.

Practical guardrails commonly used together:

- **Backend RBAC**: fast fail, consistent API behavior, fewer useless endorsements.
- **Chaincode checks (RuBAC/ABAC)**: enforce “must-always-hold” rules (owner-only transfer, admin-only delete, org constraints).
- **PDC membership rules**: control which orgs can read/write private data.
- **Endorsement policy / state-based endorsement** (optional): require approvals from specific orgs.

## Deploying and invoking (high level)

Deploy chaincodes using the Fabric v2+ lifecycle:

1. Package
2. Install on peers
3. Approve for organization(s)
4. Commit definition to the channel
5. Invoke transactions from your client application

Commands vary by network configuration (channel name, orgs, chaincode language/runtime). If you’re using `fabric-samples`, keep deployment scripts near your network setup and reuse the lifecycle patterns from the samples.