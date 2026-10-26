# Purchase Requisition Module — Design Decisions

## Overview

The Purchase Requisition module manages the creation, submission, review,
rejection, cancellation, and resubmission of Purchase Requisitions.

The module should preserve historical records and avoid overwriting previously
submitted requisition data.

---

## 1. Purchase Requisition Identity

Each Purchase Requisition record will have its own UUID as its database
identifier.

```text
id
↓
Unique database identifier for the specific requisition record
```

The `pr_number` will serve as the human/business-facing identifier.

The UUID should remain the technical database identifier and should not be
replaced by the formatted `pr_number`.

---

## 2. Purchase Requisition Revisions

Revisions will be stored as separate records in the existing
`PurchaseRequisition` table rather than using a dedicated revision table.

Each revision will therefore have:

- Its own UUID.
- Its own `pr_number`.
- Its own revision number.
- Its own status.
- Its own requisition contents.
- A reference to the original/root requisition.

A self-referencing column will be used to associate revisions.

Example:

```text
PurchaseRequisition
│
├── Revision 1
│   id: UUID-A
│   pr_number: PR-20260815-001-01
│   parent_requisition_id: NULL
│   revision_number: 1
│   status: REJECTED
│
├── Revision 2
│   id: UUID-B
│   pr_number: PR-20260815-001-02
│   parent_requisition_id: UUID-A
│   revision_number: 2
│   status: SUBMITTED
│
└── Revision 3
    id: UUID-C
    pr_number: PR-20260815-001-03
    parent_requisition_id: UUID-A
    revision_number: 3
    status: APPROVED
```

The `parent_requisition_id` should point to the original/root requisition
rather than forming a chain between revisions.

This allows all revisions belonging to the same procurement request to be
identified easily.

---

## 3. Identifier Responsibilities

The requisition uses multiple identifiers with different purposes.

```text
id
↓
Technical database identifier for the specific record.

pr_number
↓
Human/business-facing identifier for the specific revision.

parent_requisition_id
↓
Identifies the original/root requisition that owns the revision history.

revision_number
↓
Identifies the chronological version of the requisition.
```

Example:

```text
PR-20260815-001-01 → Revision 1
PR-20260815-001-02 → Revision 2
PR-20260815-001-03 → Revision 3
```

---

## 4. Purchase Requisition Number Format

The proposed format is:

```text
PR-{YYYYMMDD}-{SEQUENCE}-{REVISION}
```

Example:

```text
PR-20260815-001-01
```

Where:

- `PR` identifies the record as a Purchase Requisition.
- `YYYYMMDD` represents the creation date of the original requisition.
- `SEQUENCE` identifies the procurement request created on that date.
- `REVISION` identifies the specific revision of the requisition.

Example revision history:

```text
PR-20260815-001-01 → Revision 1 → REJECTED
PR-20260815-001-02 → Revision 2 → REJECTED
PR-20260815-001-03 → Revision 3 → SUBMITTED
```

The `pr_number` should remain a business identifier and should not replace the
UUID primary key.

---

## 5. Rejection and Resubmission

When a Purchase Requisition is rejected, the rejected record must remain
unchanged.

The employee may later revise and resubmit the requisition.

The resubmission process creates a new Purchase Requisition record that:

- Uses a new UUID.
- Uses a new `pr_number`.
- Has an incremented `revision_number`.
- References the original requisition through `parent_requisition_id`.
- Initially copies the relevant contents from the previous revision.
- Allows the employee to modify the copied contents before submission.

Example:

```text
Revision 1
    ↓
REJECTED
    ↓
Employee edits requisition
    ↓
Revision 2 created
    ↓
DRAFT
    ↓
Employee submits
    ↓
SUBMITTED
```

Previous revisions must not be overwritten.

---

## 6. Resubmission Service Flow

The resubmission operation should receive the original/root requisition UUID.

The service is responsible for coordinating the resubmission process.

Conceptually:

```text
Controller
    ↓
Original requisition UUID
    ↓
Service
    ├── Authenticate user
    ├── Find latest revision
    ├── Verify the user can resubmit
    ├── Verify the requisition is REJECTED
    ├── Determine the next revision number
    ├── Generate the new pr_number
    ├── Copy/update requisition data
    └── Bundle data for repository
            ↓
        Repository
            ↓
        Create new record
```

The repository should be responsible for persistence rather than determining
business rules.

---

## 7. PR Number Generation

The generation of `pr_number` is a business concern and should be handled
outside the repository.

A dedicated function or utility may be used:

```ts
generatePurchaseRequisitionNumber(...)
```

The service determines the required revision information and passes the
generated `pr_number` to the repository.

The repository should simply persist the provided value.

---

## 8. Cancellation

Cancellation should not delete the Purchase Requisition.

A cancelled requisition should remain in the database with:

```text
status = CANCELLED
```

Cancellation should preserve the requisition's historical record for:

- Auditability.
- Reporting.
- Traceability.
- Historical review.

A cancelled requisition should not be changed back into `DRAFT`.

---

## 9. Draft Requisitions

Draft requisitions are allowed to remain in the database.

A future enhancement may introduce a retention period for abandoned drafts,
such as:

```text
30–60 days
```

After the retention period, the system may automatically expire or clean up
the draft through a background/scheduled process.

This does not require a user-facing delete endpoint.

This functionality is considered a future enhancement and should not block
the initial implementation of the Purchase Requisition module.

---

## 10. Authentication and User Identity

Authenticated Purchase Requisition endpoints should use `AuthRequest`.

The authenticated user's ID must come from the authentication middleware:

```ts
req.user;
```

It should not be accepted from:

- `req.body`
- `req.params`
- `req.query`

For endpoints requiring both the requisition ID and authenticated user ID:

```text
requisitionId
    ↓
req.params.id
    ↓
Zod validation

userId
    ↓
req.user
    ↓
Authentication middleware
```

The values may then be bundled before being passed to the service:

```ts
const input = {
  requisitionId,
  userId,
};
```

---

## 11. Validation

Purchase Requisition route parameters should be validated using Zod.

Example:

```ts
const purchaseRequisitionIdParamsSchema = z.object({
  id: z.string().uuid(),
});
```

The authenticated user ID should not be treated as a client-provided route
parameter. It is obtained from the authenticated request context.

---

## 12. Historical Data Principle

Purchase Requisitions should generally not be physically deleted simply
because they are no longer active.

Instead, the system should preserve historical records through statuses and
revision records.

The general principle is:

```text
No longer active
        ↓
Change state / create revision
        ↓
Preserve historical record
```

This is particularly important because Purchase Requisitions may be
referenced by:

- Approval Workflow
- Audit Trail
- RFQs
- Purchase Orders
- Notifications
- Reporting
- Events

---

## 13. Architectural Principle

The Purchase Requisition module should remain loosely coupled with other
modules.

Business logic should remain inside the service layer while persistence logic
belongs to the repository layer.

The general flow should remain:

```text
Controller
    ↓
Validation / Request Context
    ↓
Service
    ↓
Repository
    ↓
Database
```

Inter-module communication should use the application's event mechanism when
appropriate rather than directly coupling modules together.

---

## 14. Current Scope

The current implementation scope includes:

- Create Purchase Requisition.
- Retrieve Purchase Requisition.
- Update Purchase Requisition.
- Submit Purchase Requisition.
- Cancel Purchase Requisition.
- Reject Purchase Requisition.
- Resubmit rejected Purchase Requisition.
- Preserve revision history.
- Generate revision-specific `pr_number`.
- Authenticate requests using `AuthRequest`.
- Validate requisition IDs using Zod.

---

## 15. Future Enhancements

The following features may be implemented later:

- Automatic expiration of abandoned drafts.
- Configurable draft retention periods.
- Scheduled cleanup/expiration process.
- More advanced revision comparison.
- Revision-specific approval tracking.
- Revision-specific RFQ and Purchase Order relationships.
- Additional authorization rules.
