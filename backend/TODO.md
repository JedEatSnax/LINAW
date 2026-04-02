# Backend TODO 

Last updated: 2026-03-31

## Need To Do

- [x] Bring down the network and organization table in the DB
  - [x] Identify all related tables, foreign keys, and dependencies
  - [x] Back up current data before making destructive changes
  - [x] Create and run migration(s) to drop or reset network/org schema safely
  - [x] Verify DB state after migration and document what changed

- [ ] Finish permissions and apply authorization at the router level
  - [ ] Complete permission definitions in backend/config/authorization/
  - [x] Map roles to permissions clearly and remove duplicates/inconsistencies
  - [ ] Enforce middleware checks in every protected route
  - [ ] Add test cases for authorized vs unauthorized access

- [ ] Finish Hyperledger Fabric client-facing endpoints
  - [x] Audit existing endpoints in backend/routes/ and controllers/services
  - [x] finish client fabric facing endpoint
  - [x] finish service and validation layer
  - [ ] Implement missing CRUD/query/invoke endpoints needed by frontend
  - [x] Standardize request/response format and error handling
  - [x] Validate endpoints against frontend API usage

- [ ] Write the Fabric gateway connection
  - [ ] Finalize gateway config structure (identity, wallet, MSP, peers)
  - [x] Implement stable connection lifecycle and retry/disconnect handling
  - [ ] Move secrets/config to environment variables where applicable
  - [ ] Add a smoke test for gateway connect + simple query

## Want To Do

  - [x] Review latest Hyperledger Fabric implementation progress and speed up delivery
  - [ ] Review current implementation status in backend/Status.md and progress.md
  - [ ] Identify blockers (missing SDK wiring, endpoint gaps, auth coupling, etc.)
  - [ ] Split remaining Fabric work into 1-2 day milestones
  - [ ] Prioritize high-impact tasks first (gateway reliability, endpoint completion, auth)
  - [ ] Document shortcuts/automation opportunities (scripts, templates, reusable middleware)

## Suggested Execution Order

1. Bring down/reset network and organization tables safely
2. Finish permissions and enforce router-level authorization
3. Write/finalize Fabric gateway connection
4. Complete client-facing Fabric endpoints
5. Run progress review and optimization pass


# Fabric Client-Backend Integration TODO

## Goal
Build a client -> backend -> Hyperledger Fabric flow without depending on unfinished network-orchestration code.

## 1. Backend Fabric Connector Module
- [x] Create one connector module that manages Fabric Gateway connect/disconnect.
- [x] Make the connector return reusable network/contract handles.
- [x] Read all connector settings from environment variables:
  - [x] Connection profile path
  - [x] MSP ID
  - [x] User cert path
  - [x] User private key path
  - [x] Peer endpoint
  - [x] TLS cert path

## 2. Thin Fabric Service Layer
- [ ] Add a generic query method using `evaluateTransaction`.
- [ ] Add a generic invoke method using `submitTransaction`.
- [ ] Keep request shape generic:
  - [ ] channel
  - [ ] chaincode
  - [ ] functionName
  - [ ] args (array)

## 3. API Endpoints For Client
- [x] Create `POST /api/fabric/query`.
- [x] Create `POST /api/fabric/invoke`.
- [x] Create `GET /api/fabric/health`.
- [x] Standardize response format so frontend can reliably parse success/error states.

## 4. Client Integration
- [x] Ensure frontend talks only to backend APIs (never directly to Fabric).
- [ ] Implement one end-to-end test flow:
  - [ ] Query all assets
  - [ ] Create asset
  - [ ] Query asset by ID

## 5. Safe Fallback Mode
- [ ] Return clear structured errors when Fabric is unavailable.
- [ ] Make frontend behavior graceful when backend returns Fabric-unavailable errors.
- [ ] Optional: add a mock mode flag for frontend development when Fabric is down.
