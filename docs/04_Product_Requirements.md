# Product Requirements Document


## Product Vision

To provide Philippine MSMEs with a secure, transparent, and efficient procurement platform that 1
simplifies purchasing, reduces fraud, and improves financial accountability.

- The Core Product: A dedicated, blockchain-enabled procurement SaaS that turns every expense
record into a tamper-proof, immutable audit trail.

- The Operational Value: Empowering Procurement Officers with automated workflows, Approving 
Managers with mobile-first sign-offs, and CPOs with reliable, fraud-proof oversight.

- The Strategic Impact: Transitioning MSMEs away from chaotic paperwork into clean, auditable 
systems—ultimately bridging the technology gap between small enterprises and corporate giants.

---

## Users

Who uses this?

1. Procurement Officers (PO):
- Who are they: The front line operation staff, administrative assistants or purchasing clerks who
handle the day to day legwork of buying item. 

- Main Goal: To quickly source items, find the best prices from suppliers, create purchase orders,
and track deliveries.

- Pain Points: Wasting hours manually copy-pasting numbers from Viber or PDF quotes into Excel 
"canvas sheets," physically chasing managers around the office for signatures, and dealing with 
messy paper folders.

- Core System Needs: A simple dashboard to create requests, a tool that automatically generates a 
comparative matrix (canvas sheet) of prices, and an automated button to send the request up the 
chain for approval.

2. Approving Managers:
- Who are they: Department heads, branch managers, or operations supervisors who have the authority 
to greenlight corporate expenses.

- Main Goal: To quickly review purchase requests against their current budget and approve or reject 
them without slowing down operations.

- Pain Points: Getting flooded with disjointed "Boss, check this" Viber messages, or having stacks 
of physical paperwork dropped on their desk while they are busy or off-site. They lack quick 
visibility into why a specific supplier was chosen.

- Core System Needs: A mobile-friendly approval portal with push notifications, showing a clear, 
side-by-side comparison of supplier quotes so they can securely approve transactions with a single 
tap.

3. Chief Procurement Officer (CPO) / Business Owner:
- Who are they: The company executive, financial director, or the MSME owner who is legally and 
financially responsible for the organization's total spending.

- Main Goal: To maintain complete financial oversight, control company cash flow, reduce the risk 
of fraud through tamper-evident audit records and transparent workflows, and ensure strict 
compliance for government tax (BIR) audits.

- Pain Points: The constant risk of employee fraud (e.g., staff altering quotes retroactively to 
favor a friend), losing the physical paper trail, and facing massive anxiety during tax season or 
financial audits due to incomplete historical records.

- Core System Needs: A high-level analytics dashboard displaying total company spend, paired with a 
cryptographic "Verify Ledger" tool powered by the blockchain to instantly prove that historical 
expense logs have not been tampered with or retroactively changed.

---

## User Stories

Format:

As a <user>

I want <action>

So that <benefit>



---

## Functional Requirements

FR-001:The system shall allow Procurement Officers to create purchase requisitions.

FR-002: The system shall route purchase requisitions to the appropriate Approving Manager.

FR-003: The system shall notify approvers when a purchase request is awaiting review.

FR-004: The system shall generate a supplier comparison matrix from uploaded quotations.

FR-005: The system shall store procurement transactions in an immutable audit trail.

---

## Non Functional Requirements


Performance:
- The system should support at least 200 simultaneous users. 
- Search results should appear within 2 seconds.
- Dashboard should load within 3 seconds.

Security:
- Users shall only access features and data based on their assigned roles.
- Sensitive documents shall be encrypted while stored.
- Authentication tokens shall expire after a configurable period.

Availability:
- The system should be available 99% of the time except during scheduled maintenance.

Scalability:
- The system shall support increasing numbers of users, suppliers, procurement requests, and documents without significant performance degradation.

---

## Features

### Immutable Audit Trail

Uses blockchain technology to create tamper-evident procurement records that can be independently verified.

### Authentication

Provides secure user authentication and role-based authorization for all system users.

### Purchase Request Management 

Allows employees to create, edit, submit, and monitor purchase requests.

### Approval Workflow

Allows department heads and procurements officers to review, approve, reject or return purchase
request for revision.

### Vendor Management

Allows procurement officers to maintain a list of vendors, including company details and contact
information.

### Document Management

Allows users to upload, download, and organize procurement-related documents such as quotations, invoices, purchase orders, and delivery receipts. The system ensures that only authorized users can access these documents.
