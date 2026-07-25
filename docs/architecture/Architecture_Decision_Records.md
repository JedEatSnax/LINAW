# Architecture Decision Records (ADR)

This document records the significant architectural decisions made during the design of the Procurement Approval System. Each Architecture Decision Record (ADR) documents the context, decision, rationale, and consequences of major architectural choices made throughout the system design.

---

# ADR-001: Adopt Modular Monolithic Architecture

## Status

Accepted

## Context

The Procurement Approval System is designed primarily for Micro, Small, and Medium Enterprises (MSMEs), where the expected number of concurrent users is relatively low. The project also has limited development resources and is intended to be maintainable throughout its lifecycle.

Several architectural approaches were considered, including a traditional monolith, a modular monolith, and a microservices architecture.

## Decision

The system will adopt a **Modular Monolithic Architecture**, where all modules are deployed as a single application while maintaining clear separation of responsibilities between business domains such as Authentication, Procurement, Approval Workflow, Vendor Management, and Reporting.

## Rationale

A modular monolith provides a balance between simplicity and maintainability.

Compared to microservices, it:

- Reduces infrastructure and deployment complexity.
- Avoids distributed system challenges such as service discovery, inter-service communication, and orchestration.
- Simplifies debugging and development.
- Matches the expected workload of MSMEs.
- Allows future migration to microservices if business growth requires independent scaling.

## Consequences

### Positive

- Simpler deployment and maintenance.
- Lower infrastructure cost.
- Easier debugging and development.
- Clear separation of business modules.
- Future migration path toward microservices.

### Negative

- Entire application is deployed as one unit.
- Large deployments may require scaling the whole application instead of individual modules.

---

# ADR-002: Use Blockchain as a Verification Layer

## Status

Accepted

## Context

Procurement documents and approval records require protection against unauthorized modification while remaining easily accessible within the application.

Using blockchain as the primary data store was considered but was determined to be unsuitable due to storage cost, performance limitations, and privacy concerns.

## Decision

Blockchain will be used solely as an immutable verification layer that stores cryptographic proofs of finalized procurement records.

The blockchain will not replace the relational database.

## Rationale

Using blockchain only for verification provides:

- Immutable audit trails.
- Tamper-evident procurement records.
- Lower blockchain transaction costs.
- Better application performance.
- Preservation of confidential procurement information.

This approach allows the system to benefit from blockchain technology without introducing unnecessary complexity.

## Consequences

### Positive

- Immutable audit records.
- Improved data integrity.
- Reduced blockchain storage costs.
- Better application performance.
- Sensitive business data remains private.

### Negative

- Blockchain cannot recover lost application data.
- Verification requires both blockchain and database records.

---

# ADR-003: Store Business Data in PostgreSQL

## Status

Accepted

## Context

The Procurement Approval System manages highly structured business information including procurement requests, users, approvals, suppliers, purchase orders, invoices, and audit metadata.

These entities have complex relationships that require transactional consistency.

## Decision

PostgreSQL will be used as the primary relational database for all operational business data.

## Rationale

PostgreSQL was selected because it provides:

- ACID-compliant transactions.
- Strong relational modeling.
- Mature SQL capabilities.
- High reliability.
- Excellent support for reporting and querying procurement records.

The relational model closely matches the business processes of procurement management.

## Consequences

### Positive

- Reliable transaction processing.
- Strong relational integrity.
- Mature ecosystem and tooling.
- Excellent reporting capabilities.

### Negative

- Schema changes require database migrations.
- Less suitable for highly unstructured data.

---

# ADR-004: Use JWT-Based Authentication and Role-Based Access Control

## Status

Accepted

## Context

The system supports multiple user roles including Procurement Officers, Approving Managers, Chief Procurement Officers, Vendors, Auditors, and Administrators.

Each role requires different levels of system access.

## Decision

The system will implement JWT-based authentication together with Role-Based Access Control (RBAC).

JWT will be used to authenticate users, while RBAC will determine access to protected resources.

## Rationale

This approach provides:

- Stateless authentication.
- Secure API communication.
- Flexible authorization management.
- Separation of permissions based on organizational roles.
- Compatibility with modern web applications.

## Consequences

### Positive

- Secure authentication.
- Simplified authorization management.
- Easy integration with frontend applications.
- Scalable permission management.

### Negative

- Requires secure handling of authentication tokens.
- Incorrect role configuration may result in unauthorized access.

---

# ADR-005: Exclude Payment Processing from System Scope

## Status

Accepted

## Context

The objective of the system is to improve procurement transparency, approval workflows, and auditability.

Implementing payment processing would significantly increase project complexity by introducing banking integrations, financial regulations, and payment security requirements that fall outside the intended project scope.

## Decision

The Procurement Approval System will not execute vendor payments.

The system will record vendor invoices, perform procurement verification, and prepare records for external payment processing handled by existing accounting or financial systems.

## Rationale

This decision keeps the system focused on procurement governance while avoiding unnecessary financial system complexity.

It also aligns with the needs of MSMEs that may already use existing accounting software for payment execution.

## Consequences

### Positive

- Smaller project scope.
- Reduced implementation complexity.
- Avoids financial compliance requirements.
- Focuses development on procurement management and auditability.

### Negative

- Payment tracking depends on external systems.
- End-to-end financial processing is outside the application.

---

# ADR-006: Store Only Cryptographic Hashes on the Blockchain

## Status

Accepted

## Context

Procurement records contain confidential business information that should not be publicly exposed or permanently stored on a blockchain network.

At the same time, auditors require a mechanism to verify that important procurement records have not been modified.

## Decision

Only cryptographic hashes and blockchain transaction metadata will be stored on-chain.

Complete procurement records will remain in PostgreSQL and document storage.

## Rationale

This approach provides data integrity without exposing sensitive procurement information.

It also reduces blockchain storage costs and improves application performance while maintaining verifiable audit records.

## Consequences

### Positive

- Protects confidential business information.
- Lower blockchain storage requirements.
- Faster blockchain operations.
- Maintains verifiable record integrity.

### Negative

- Verification requires access to both blockchain records and application data.
- Blockchain cannot reconstruct original documents.

---

# ADR-007: Use Docker for Application Deployment

## Status

Accepted

## Context

The application will be deployed across development, testing, and production environments.

Maintaining consistent environments is essential to reduce deployment issues and simplify system maintenance.

## Decision

The system will be containerized using Docker.

Application services and supporting infrastructure will run inside containers to ensure consistent execution across environments.

## Rationale

Docker provides:

- Consistent development and deployment environments.
- Simplified application packaging.
- Easier infrastructure management.
- Improved portability across different hosting platforms.
- Better support for future scaling and deployment automation.

## Consequences

### Positive

- Consistent deployments.
- Improved portability.
- Simplified environment management.
- Easier onboarding for developers.

### Negative

- Additional learning curve for container management.
- Slight increase in deployment complexity compared to running applications directly.