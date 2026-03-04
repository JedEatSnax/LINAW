Understanding the problem

Hyperledger fabric Blockchain web dashboard. 
the user needs to be able to create their own configuration for the blockchain network, whether how many nodes (Peers or endorser), what type of whether it's level db the default or an optional db couch db a nosql document oriented db, enables users to setup their own custom smart contracts, assignment of peers and endorsers, ability to create channels and assignment of channel.
In the dashboard the user/orgs can monitor their blockchain network thru network monitoring and limit access to authorized personnel only

User input:
- Network topology
   - how many peers (ledger replicas) per org
   - which peers are designated as endorsers for a given chaincode
   - Number of committers
   
- Database Selection
   - LevelDB
   - CouchDb 
- Smart Contract management
   - Update or write chaincode
   - Assign which peers endorse which chaincode
   - Write a chaincode from a form type of smart contract
- Channel setup
   - Ability to create channels
   - Assign organization or core internal departments to channel

- Assignment & role management
   - Allow assigning peers to roles:
       - endorsers
       - commiters



Identify the scope of the system:

The system scope is to provision, configure and monitor the blockchain network and it's components. It will not store or manage financial journal entry contents in it's own database.

The monitoring scope will comprise 
- Node/service health: peer/orderer/CA availability and container/service status; optionally host resource metrics if available.
- Network state: Channel membership, deployed chaincode versions, ledger synchronization.
- Operational logs/audit logs: admin actions in the dashboard (who made changes in the configs, who ran provisioning) because logging supports monitoring typically implies auditability and traceability. 

all of the backend of the blockchains web dashboard scopes and out of scopes:

in scope:

- Create/update network configs; run provisioning jobs; show health/status dashboards.
- Store operational metadata (network definitions, job status, component endpoints).


out of scope:

- Storing journal entry payloads (amounts, accounts, line items, attachments).
- Accounting workflows/features (posting, approvals, reports) and acting as a system of record.

Research and analyze existing systems: kinda done

Creation of a high level design: done

![System Design](/Picture-progress/System-Design.png)

Api Design:

(Focus munna ako sa users since auth at users)
(I think sa security okay na yung Auth.js)
(if may curious kayo drop ko nalang dito https://www.npmjs.com/package/next-auth)


Auth + users: 

   - POST /api/auth/signup (create user)
   - POST /api/auth/login (create session/token)
   - POST /api/auth/logout (optional; for cookie sessions)
   - GET /api/me (get current user profile)

   - GET /api/users (admin)
   - POST /api/users (admin create user)
   - PATCH /api/users/{userId} (update profile)
   - POST /api/tenants / 
   - GET /api/tenants (if multi-tenant)

Network (blockchain creation + config)

   - POST /api/networks (create network + start provision job)
   - GET /api/networks
   - GET /api/networks/{networkId}
   - PATCH /api/networks/{networkId} (update desired spec → start reconcile job)
   - DELETE /api/networks/{networkId} (teardown job; optional)

- Nodes (inventory/status):

   - GET /api/networks/{networkId}/nodes
   - GET /api/nodes/{nodeId}

- Channels:

   - POST /api/networks/{networkId}/channels (create channel → returns jobId)
   - GET /api/networks/{networkId}/channels
   - GET /api/channels/{channelId}
   - POST /api/channels/{channelId}/join (join peers → job)
   - POST /api/channels/{channelId}/members (add orgs → job)

- Job (Async operation):

   - GET /api/jobs/{jobId}
   - GET /api/networks/{networkId}/jobs

Monitoring (read-only views):


- Network-level:
   - GET /api/networks/{networkId}/health
   - GET /api/networks/{networkId}/alerts (optional)
   - GET /api/networks/{networkId}/metrics (optional, if maga add na ng prometheus)

- Node-level:
   - GET /api/nodes/{nodeId}/health
   - GET /api/nodes/{nodeId}/logs (optional)
   - GET /api/nodes/{nodeId}/metrics (optional)

- Audit / immutable logs (from ImmuDB):
   - GET /api/audit?networkId=...&from=...&to=...
   - GET /api/audit/events?from=...&to=...&actorUserId=...&action=...&resourceType=...&resourceId=...
   - GET /api/users/{id}/activity

(gawan ko lng ng database schema for user profiles pag naimplement na namin yung firebase auth)

Database schema 

user (
  id UUID PK,
  firebase_uid UNIQUE NOT NULL,
  username UNIQUE,
  status,
  created_at,
  updated_at,
  deleted_at
)  

organization (
  id UUID PK,
  name NOT NULL,
  slug UNIQUE NOT NULL,
  created_by FK users(id),
  created_at,
  updated_at,
  deleted_at
)

organization_members (
  user_id FK users(id) ON DELETE CASCADE,
  org_id FK organization(id) ON DELETE CASCADE,
  role ENUM ('owner', 'admin', 'member') NOT NULL,
  created_at,
  updated_at,
  PRIMARY KEY (user_id, org_id)
)

network (
  id UUID PK,
  name NOT NULL,
  owner_org_id FK organization(id) NOT NULL,
  created_by FK user(id) ON DELETE SET NULL,
  created_at,
  updated_at,
  deleted_at
)

network_organizations (
  network_id FK network(id) ON DELETE CASCADE,
  org_id FK organization(id) ON DELETE CASCADE, 
  PRIMARY KEY (network_id, org_id)
)









