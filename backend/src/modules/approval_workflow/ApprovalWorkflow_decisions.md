# Approval Workflow Module Decisions

## Workflow Identification

### Workflow definition

The workflow definition defines the type of business request that requires approval.

It identifies what kind of request is entering the approval workflow, such as:

- `purchase_requisition`
- `contract`
- `expense`
- other supported business request types

Workflow definitions provide predefined and consistent request-type definitions. The system should not allow arbitrary values to be introduced as request types because the Approval Workflow module relies on these definitions to correctly map incoming requests to the appropriate approval configuration.

The originating business module establishes the request type when publishing the request event. The Approval Workflow module uses the workflow code to determine which approval configuration applies to the request.

### Workflow Level

A workflow level represents a **clearance level with the authority to make an approval decision** for a request.

Each level is associated with a role that has the authority to act on requests assigned to that level.

For example:

```text
Level 1 → Department Manager
Level 2 → Finance Manager
Level 3 → Executive
```

If a request is assigned to Level 1, the Department Manager has the required clearance to make the decision on that request.

The level therefore determines **which authority is permitted to approve or reject the request**, rather than simply representing a sequential step number.

### Types of workflow definition

System defined and there's tenant defined

The system defined only gives them a example to build upon on or they could just use whatever the system defined. This type of definition is global and every tenant can use this workflow definition.

for the other type, the tenant defined one is uniquely the tenant owns even if they have something simillar with other tenants.
