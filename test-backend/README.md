## test-backend

Bare-bones Express server for the Fabric test-network UI.

### Reality check

A multi-tenant blockchain SaaS is useful only when multiple parties need a shared source of truth and no single party should fully control the data model or audit trail.

It is a weak fit when:

- one organization already owns the data and can trust its own database;
- you need very high write volume, low latency, or frequent schema changes;
- the problem is really workflow automation, not shared trust;
- the value comes from analytics, not from tamper-evident coordination.

For an MVP, the product should not try to be a generic blockchain Excel replacement. It should solve one narrow multi-party workflow very well, then reuse that pattern across tenants.

### Flexible JSON in Fabric

In Hyperledger Fabric, the usual way to support a flexible payload is to keep a small, stable envelope in chaincode and store the business data as JSON in world state or offchain.

The envelope usually contains:

- `tenantId`
- `recordId`
- `recordType`
- `version`
- `status`
- `createdAt`
- `createdBy`
- `payloadHash`

The business payload can then be a JSON object such as a shipment event, consent form, certificate metadata record, or audit note. Chaincode validates the envelope, authorization, and lifecycle rules, then writes the JSON document to the ledger state.

How this is typically implemented in Fabric:

1. Use chaincode to accept a JSON payload as an input string.
2. Parse the JSON in chaincode and validate the required fields.
3. Store the object in world state with `PutState(recordId, bytes)`.
4. Use CouchDB as the state database if you need rich JSON queries over selected fields.
5. Store a hash of the full payload on-chain if the full record also lives offchain.
6. Use composite keys for tenant-scoped lookup patterns like `tenantId~recordType~recordId`.

That gives you flexibility without giving up traceability. You can add optional fields for one tenant or one workflow without rewriting the whole chaincode model, as long as you still validate the fields your application depends on.

The tradeoff is blunt:

- Flexible JSON is good for MVP speed and evolving schemas.
- Rigid on-chain schemas are better when the workflow is fixed and heavily regulated.
- Offchain storage is better when the payload is large, private, or frequently updated.

For your SaaS, the practical pattern is: stable envelope on-chain, flexible JSON payload in world state or offchain, and hashes on-chain for proof.

### Concrete Fabric example (provenance)

Below is a practical example for a multi-tenant provenance workflow.

On-chain envelope (world state):

```json
{
  "docType": "provenanceRecord",
  "tenantId": "tenant-a",
  "recordId": "rec-0001",
  "recordType": "shipmentEvent",
  "version": 1,
  "status": "ACTIVE",
  "createdAt": "2026-04-18T09:22:00Z",
  "createdBy": "x509::/OU=client/CN=alice",
  "payloadHash": "sha256:3f7f...",
  "payloadRef": "s3://tenant-a/provenance/rec-0001.json"
}
```

Offchain payload (object storage or database):

```json
{
  "assetId": "batch-4821",
  "eventType": "DISPATCHED",
  "fromOrg": "org1",
  "toOrg": "org2",
  "eventTime": "2026-04-18T09:20:00Z",
  "temperatureC": 4.1,
  "notes": "Loaded in cold-chain truck #17"
}
```

Minimal chaincode pattern (TypeScript/JavaScript style):

```ts
async createRecord(ctx, recordId, tenantId, payloadJson, payloadHash, payloadRef) {
	const callerTenant = ctx.clientIdentity.getAttributeValue("tenantId");
	if (callerTenant !== tenantId) {
		throw new Error("tenant mismatch");
	}

	const payload = JSON.parse(payloadJson);
	if (!payload.assetId || !payload.eventType || !payload.eventTime) {
		throw new Error("missing required payload fields");
	}

	const state = {
		docType: "provenanceRecord",
		tenantId,
		recordId,
		recordType: "shipmentEvent",
		version: 1,
		status: "ACTIVE",
		createdAt: new Date().toISOString(),
		createdBy: ctx.clientIdentity.getID(),
		payloadHash,
		payloadRef
	};

	await ctx.stub.putState(recordId, Buffer.from(JSON.stringify(state)));

	const idx = ctx.stub.createCompositeKey("tenant~type~id", [tenantId, "shipmentEvent", recordId]);
	await ctx.stub.putState(idx, Buffer.from([0]));

	await ctx.stub.setEvent("RecordCreated", Buffer.from(JSON.stringify({ tenantId, recordId })));
}
```

Optional flexible JSON on-ledger pattern:

```ts
const state = {
  docType: "provenanceRecord",
  tenantId,
  recordId,
  recordType: "shipmentEvent",
  version: 1,
  status: "ACTIVE",
  createdAt: new Date().toISOString(),
  createdBy: ctx.clientIdentity.getID(),
  payload: payload, // flexible JSON payload in world state
  payloadHash,
};
```

When to pick each option:

- Use `payloadRef` + `payloadHash` for large or sensitive data.
- Use `payload` in world state for small to medium records you want to query directly.
- Use CouchDB when you need JSON selectors over fields like `tenantId`, `recordType`, `status`, or `payload.assetId`.

### Where blockchain actually helps

The best SaaS use cases are the ones researchers and thesis projects keep returning to because they have clear participants, audit needs, and cross-organization trust gaps:

- Supply chain provenance: track origin, movement, handoffs, recalls, and certifications across suppliers, shippers, and buyers.
- Business compliance and audit trails: record approvals, exceptions, signature events, and policy evidence that must be shared across companies.
- Credential verification: issue and verify degrees, professional certificates, licenses, and training records across institutions.
- Healthcare data exchange: store consent, access logs, referral events, and clinical trial provenance, not full raw patient records.
- Document notarization: anchor contracts, permits, lab results, or research outputs so the timeline is defensible.
- Asset registries: maintain ownership, custody, and transfer history for equipment, warranty claims, or regulated goods.
- Consortium reporting: coordinate carbon reporting, ESG attestations, or regulated disclosures across multiple companies.

### Best-fit thesis themes

If you are framing this for academia or a business thesis, the strongest topics are the ones that can be measured and scoped:

- Secure inter-organizational identity and access management.
- Shared auditability for regulated workflows.
- Provenance tracking for products, documents, or certifications.
- Permissioned data sharing with tenant isolation.
- Revocation, renewal, and lifecycle governance for certificates and identities.

### What a real MVP should look like

1. A tenant signs up.
2. The platform creates a tenant-scoped CA and identity namespace.
3. The tenant admin registers users, apps, or partner orgs.
4. The tenant uses one chaincode template for one workflow, such as provenance, certification, or audit logging.
5. The admin can enroll, re-enroll, and revoke identities.
6. The tenant can query a simple audit trail and export evidence for compliance or research.

That is realistic. A general-purpose multi-tenant blockchain platform is not.

### MVP SaaS findings

For a proof of concept or MVP, keep the product story small and practical:

- Tenant onboarding: create a customer workspace, issue one tenant admin identity, and connect that tenant to its own Fabric CA namespace.
- Identity lifecycle: register, enroll, re-enroll, and revoke identities without manual intervention from the platform team.
- Access scoping: use affiliations and identity types to separate tenant admin, operator, app, and peer roles.
- Audit visibility: show who was issued a certificate, when it expires, and whether it was revoked.

What to avoid in the MVP:

- LDAP integration and complex enterprise directory sync.
- Intermediate CA hierarchies and custom trust chains.
- Idemix and other advanced privacy modes.
- General-purpose CA administration features that do not help tenant onboarding or lifecycle control.

The simplest SaaS story is:

1. A tenant signs up.
2. The platform creates a tenant-scoped CA identity space.
3. The tenant admin registers users or apps.
4. Those identities enroll and receive certificates.
5. The tenant admin can rotate, renew, or revoke access later.

That gives you a clear MVP: self-service identity provisioning for blockchain participants, not a full PKI platform.

### Run

```bash
npm install
npm start
```

The server listens on port `3000` by default and exposes:

- `GET /api/v1` for a basic health check
- `POST /api/v1/fabric/peer/start` to launch `peer node start` for `org1` or `org2`

The endpoint expects the Fabric sample network artifacts generated by `./network.sh up`.
