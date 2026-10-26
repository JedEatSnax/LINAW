import { beforeEach, describe, expect, it, vi } from "vitest";

const { subscribeMock } = vi.hoisted(() => ({
  subscribeMock: vi.fn(),
}));

vi.mock("../../../shared/events/eventBus.js", () => ({
  eventBus: { subscribe: subscribeMock },
}));

import { registerAuditTrailEvents } from "../../../modules/audit_trail/auditTrailEventHandler.js";

describe("registerAuditTrailEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes the normalized POM audit event to the Audit Trail service", async () => {
    const createPOMAuditTrail = vi.fn().mockResolvedValue(undefined);
    registerAuditTrailEvents({ createPOMAuditTrail } as never);

    const subscription = subscribeMock.mock.calls.find(
      ([eventName]) => eventName === "purchase-order.audit",
    );

    expect(subscription).toBeDefined();

    await subscription?.[1]({
      tenantId: "tenant-id",
      companyId: "company-id",
      actorId: "user-id",
      entityType: "PURCHASE_ORDER",
      entityId: "po-id",
      action: "COMPLETED",
      metadata: {},
    });

    expect(createPOMAuditTrail).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-id",
        companyId: "company-id",
        entityId: "po-id",
        action: "COMPLETED",
      }),
    );
  });
});