import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditTrailService } from "../../../modules/audit_trail/auditTrailService.js";

const repository = {
  findAuditByEvent: vi.fn(),
  findAuditForVerification: vi.fn(),
  findById: vi.fn(),
  getPurchaseOrderSnapshot: vi.fn(),
  createAuditTrail: vi.fn(),
  createAuditHash: vi.fn(),
  createAuditTrailBlockchainRefs: vi.fn(),
  updateAuditTrail: vi.fn(),
};

const blockchainAdapter = {
  anchorAudit: vi.fn(),
  getAudit: vi.fn(),
};

const intermediateEvent = {
  tenantId: "tenant-id",
  companyId: "company-id",
  actorId: "user-id",
  entityType: "RFQ" as const,
  entityId: "rfq-id",
  action: "RFQ_CREATED" as const,
  metadata: { rfqId: "rfq-id", purchaseRequisitionId: "pr-id" },
};

const completedEvent = {
  tenantId: "tenant-id",
  companyId: "company-id",
  actorId: "user-id",
  entityType: "PURCHASE_ORDER" as const,
  entityId: "po-id",
  action: "COMPLETED" as const,
  metadata: {
    purchaseOrderId: "po-id",
    previousStatus: "ORDERED",
    status: "COMPLETED",
  },
};

describe("AuditTrailService.createPOMAuditTrail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repository.findAuditByEvent.mockResolvedValue(null);
    repository.createAuditTrail.mockResolvedValue({ id: "audit-id" });
    repository.createAuditHash.mockResolvedValue(undefined);
    repository.createAuditTrailBlockchainRefs.mockResolvedValue(undefined);
    repository.updateAuditTrail.mockResolvedValue(undefined);
    repository.getPurchaseOrderSnapshot.mockResolvedValue({
      purchase_order_id: "po-id",
      po_number: "po-number",
      company: { id: "company-id", name: "Company" },
      supplier: { id: "supplier-id", name: "Supplier" },
      currency_code: "USD",
      final_amount: 100,
      order_date: new Date(),
      items: [],
      approvals: [],
      receipt: null,
    });
    blockchainAdapter.anchorAudit.mockResolvedValue({
      transactionHash: "0xtransaction",
      blockNumber: 42,
      anchoredAt: 1_700_000_000,
    });
    blockchainAdapter.getAudit.mockResolvedValue({ anchoredAt: 0 });
  });

  it("records an intermediate POM audit event without anchoring", async () => {
    const service = new AuditTrailService(
      repository as never,
      blockchainAdapter as never,
    );

    await service.createPOMAuditTrail(intermediateEvent);

    expect(repository.createAuditHash).toHaveBeenCalledOnce();
    expect(blockchainAdapter.anchorAudit).not.toHaveBeenCalled();
  });

  it("anchors only a completed purchase-order transition", async () => {
    const service = new AuditTrailService(
      repository as never,
      blockchainAdapter as never,
    );

    await service.createPOMAuditTrail(completedEvent);

    expect(blockchainAdapter.anchorAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        auditId: "audit-id",
        eventType: "COMPLETED",
        hashValue: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
    );
    expect(repository.updateAuditTrail).toHaveBeenCalledWith(
      "audit-id",
      "SUCCESS",
    );
  });

  it("persists the audit row before invoking the adapter", async () => {
    const callOrder: string[] = [];
    repository.createAuditTrail.mockImplementation(async () => {
      callOrder.push("audit");
      return { id: "audit-id" };
    });
    blockchainAdapter.anchorAudit.mockImplementation(async () => {
      callOrder.push("adapter");
      return {
        transactionHash: "0xtransaction",
        blockNumber: 42,
        anchoredAt: 1_700_000_000,
      };
    });
    const service = new AuditTrailService(
      repository as never,
      blockchainAdapter as never,
    );

    await service.createPOMAuditTrail(completedEvent);

    expect(callOrder).toEqual(["audit", "adapter"]);
  });

  it("persists a failed result and rethrows adapter failures", async () => {
    const error = new Error("rpc unavailable");
    blockchainAdapter.anchorAudit.mockRejectedValue(error);
    const service = new AuditTrailService(
      repository as never,
      blockchainAdapter as never,
    );

    await expect(service.createPOMAuditTrail(completedEvent)).rejects.toBe(error);

    expect(repository.updateAuditTrail).toHaveBeenCalledWith(
      "audit-id",
      "FAILED",
    );
  });

  it("does not invoke the adapter when audit-row persistence fails", async () => {
    const error = new Error("audit database unavailable");
    repository.createAuditTrail.mockRejectedValue(error);
    const service = new AuditTrailService(
      repository as never,
      blockchainAdapter as never,
    );

    await expect(service.createPOMAuditTrail(intermediateEvent)).rejects.toBe(error);

    expect(blockchainAdapter.anchorAudit).not.toHaveBeenCalled();
    expect(repository.updateAuditTrail).not.toHaveBeenCalled();
  });

  it("does not invoke persistence or the adapter for a duplicate event", async () => {
    repository.findAuditByEvent.mockResolvedValue({
      id: "existing-audit-id",
      result: "SUCCESS",
      snapshot_json: intermediateEvent.metadata,
      hash: {
        id: "hash-id",
        tenant_id: "tenant-id",
        audit_trail_id: "existing-audit-id",
        hash_algorithm: "SHA-256",
        hash_value: "hash-value",
        created_at: new Date(),
      },
      blockchain_ref: null,
    });
    const service = new AuditTrailService(
      repository as never,
      blockchainAdapter as never,
    );

    await expect(
      service.createPOMAuditTrail(intermediateEvent),
    ).resolves.toEqual(expect.objectContaining({ id: "existing-audit-id" }));

    expect(repository.createAuditTrail).not.toHaveBeenCalled();
    expect(blockchainAdapter.anchorAudit).not.toHaveBeenCalled();
  });

  it("does not resubmit an already-confirmed completion anchor", async () => {
    repository.findAuditByEvent.mockResolvedValue({
      id: "existing-audit-id",
      result: "FAILED",
      snapshot_json: completedEvent.metadata,
      hash: {
        id: "hash-id",
        tenant_id: "tenant-id",
        audit_trail_id: "existing-audit-id",
        hash_algorithm: "SHA-256",
        hash_value: "hash-value",
        created_at: new Date(),
      },
      blockchain_ref: null,
    });
    blockchainAdapter.getAudit.mockResolvedValue({ anchoredAt: 1_700_000_000 });
    const service = new AuditTrailService(
      repository as never,
      blockchainAdapter as never,
    );

    await expect(service.createPOMAuditTrail(completedEvent)).rejects.toThrow(
      "already anchored",
    );

    expect(blockchainAdapter.anchorAudit).not.toHaveBeenCalled();
  });

  it("recovers when concurrent event creation loses the unique race", async () => {
    const existingAudit = {
      id: "existing-audit-id",
      result: null,
      snapshot_json: intermediateEvent.metadata,
      hash: {
        id: "hash-id",
        tenant_id: "tenant-id",
        audit_trail_id: "existing-audit-id",
        hash_algorithm: "SHA-256",
        hash_value: "hash-value",
        created_at: new Date(),
      },
      blockchain_ref: null,
    };
    repository.findAuditByEvent
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingAudit);
    repository.createAuditTrail.mockRejectedValue({ code: "P2002" });
    const service = new AuditTrailService(
      repository as never,
      blockchainAdapter as never,
    );

    await expect(
      service.createPOMAuditTrail(intermediateEvent),
    ).resolves.toEqual(existingAudit);

    expect(repository.findAuditByEvent).toHaveBeenCalledTimes(2);
    expect(blockchainAdapter.anchorAudit).not.toHaveBeenCalled();
  });

  it("allows identical content hashes for distinct audit events", async () => {
    const firstEvent = {
      ...intermediateEvent,
      entityId: "quotation-id",
      action: "QUOTATION_SUBMITTED" as const,
    };
    const secondEvent = {
      ...firstEvent,
      action: "QUOTATION_SELECTED" as const,
    };
    repository.createAuditTrail
      .mockResolvedValueOnce({ id: "audit-one" })
      .mockResolvedValueOnce({ id: "audit-two" });

    const service = new AuditTrailService(
      repository as never,
      blockchainAdapter as never,
    );

    await service.createPOMAuditTrail(firstEvent);
    await service.createPOMAuditTrail(secondEvent);

    const hashes = repository.createAuditHash.mock.calls.map(
      ([input]) => input.hash_value,
    );
    expect(hashes).toHaveLength(2);
    expect(hashes[0]).toBe(hashes[1]);
  });

  it("reports a recorded intermediate event as unanchored", async () => {
    const snapshot = {};
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify(snapshot)),
    );
    const storedHash = Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    repository.findById.mockResolvedValue({ tenant_id: "tenant-id" });
    repository.findAuditForVerification.mockResolvedValue({
      id: "audit-id",
      entity_id: "po-id",
      result: null,
      snapshot_json: {},
      hash: { hash_value: storedHash },
      blockchain_ref: null,
    });
    repository.getPurchaseOrderSnapshot.mockResolvedValue(snapshot);
    const service = new AuditTrailService(
      repository as never,
      blockchainAdapter as never,
    );

    await expect(
      service.auditIntegrity({
        audit_id: "audit-id",
        user_id: "user-id",
        tenant_id: "tenant-id",
        company_id: "company-id",
      }),
    ).resolves.toEqual({
      status: "UNANCHORED",
      databaseHash: storedHash,
      currentHash: storedHash,
    });
  });
});