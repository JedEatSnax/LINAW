# Purchase Order Management Workflow

The live POM workflow is:

`Approved PR -> Draft RFQ -> Published RFQ -> Posted Supplier Quotation -> Selected Quotation -> Draft PO -> Issued PO -> Ordered PO -> Completed PO`

## Relationships

- An RFQ belongs to the purchasing company and may reference the originating Purchase Requisition.
- A supplier quotation belongs to one RFQ, supplier, tenant, and purchasing company.
- Selecting a posted quotation creates one Purchase Order in the same transaction, with references to the PR, RFQ, quotation, and supplier.
- PO line items are created from the selected quotation items, using quoted quantities and prices.

## State Rules

- Quotations must be `POSTED` and the RFQ must be `PUBLISHED` before selection.
- Selection changes the quotation to `SELECTED` and creates a `DRAFT` PO atomically.
- Ordering advances `DRAFT` to `ISSUED`, then `ISSUED` to `ORDERED`; each transition is guarded by the current persisted status.
- Completing an order advances `ORDERED` to `COMPLETED` through the dedicated completion endpoint.
- Repeated or invalid transitions are rejected by the backend. Failed selection transactions must not leave a selected quotation without its PO.

## Detail and Verification

The PO detail endpoint remains tenant/company scoped and returns the PO, source PR, source RFQ, selected quotation items, supplier company, and PO items. The frontend keeps original PR estimates separate from supplier quotation and PO pricing.

Focused regression coverage should verify quotation selection, transaction rollback/duplicate prevention, source relation retrieval, and each valid or invalid PO transition.

## Audit and Blockchain Flow

After each successful POM write, the service publishes `purchase-order.audit`
through the shared event bus. The Audit Trail module subscribes to that event,
creates one tenant-scoped audit record, hashes its snapshot, and invokes the
existing Blockchain Adapter with the audit ID, hash, and action. The adapter's
transaction hash, block number, and timestamp are persisted on success; an
adapter failure marks the audit record `FAILED` and is rethrown.

The audited actions are `RFQ_CREATED`, `QUOTATION_SUBMITTED`,
`QUOTATION_SELECTED`, `PURCHASE_ORDER_CREATED`, `ISSUED`, `ORDERED`, and
`COMPLETED`. RFQ and quotation records use event metadata as their immutable
snapshot. Purchase-order records use the existing purchase-order snapshot.
Quotation selection and draft PO creation are separate audit actions because
they are separate business effects in one database transaction.

Events are published after the POM repository operation commits. The current
architecture has no transactional outbox, so a committed POM change and a
subsequent event or blockchain failure are not atomically coordinated. The
failure is observable through the audit result and the request error, but a
future retry/reconciliation mechanism would be needed for guaranteed recovery.
