# LINAW Reminder — Audit Trail / Blockchain Retrieval

## Current Situation

The Audit Trail smart contract currently records only:

- `audit_id`
- `hash_value`
- `event_type`
- `anchored_at`

## Problem

The frontend/Audit Trail module will eventually need to retrieve multiple audit records belonging to a specific tenant/company.

The current blockchain record does not directly contain `tenant_id`, so determine how tenant-scoped blockchain audit retrieval should work.

## Things to Revisit

- [ ] Review the current Audit Trail smart contract.
- [ ] Determine whether the smart contract should be updated to store `tenant_id`.
- [ ] If `tenant_id` is added, consider a queryable/indexed structure for retrieving multiple audit records for a tenant.
- [ ] If `tenant_id` should remain off-chain, determine how blockchain `audit_id` values should be mapped back to tenant-owned audit records in PostgreSQL.
- [ ] Create a service/repository query for retrieving all audit records belonging to the authenticated tenant.
- [ ] Determine whether blockchain verification should happen for every returned record or only when explicitly requested.
- [ ] Keep blockchain querying inside the Audit Trail module / Blockchain Adapter rather than Organization Administration.
- [ ] Do not make the Event Bus responsible for querying blockchain data.

## Intended Architecture

Module action
→ Event Bus
→ Audit Trail Module
→ PostgreSQL audit record
→ Blockchain anchoring

For retrieval:

Frontend
→ Audit Trail API
→ Audit Trail Service
→ PostgreSQL + Blockchain Adapter
→ tenant-scoped audit records

## Important

Do not over-engineer this for the current MVP.

The immediate goal is to finish the existing modules. Revisit blockchain audit retrieval after the core CRUD/service implementation is complete.