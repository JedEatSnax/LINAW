import { beforeEach, describe, expect, it, vi } from "vitest";
import { Decimal } from "decimal.js";
import { PurchaseOrderManagementService } from "../../../modules/purchase_order_management/purchaseOrderManagementService.js";

const repository = {
  getCompletedPurchaseOrdersForReport: vi.fn(),
};

const service = new PurchaseOrderManagementService(
  repository as never,
  { publish: vi.fn() } as never,
);

describe("PurchaseOrderManagementService monthly completed report", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses UTC calendar boundaries and keeps currencies separate", async () => {
    repository.getCompletedPurchaseOrdersForReport.mockResolvedValue({
      missingCompletionEvents: 0,
      purchaseOrders: [
        {
          id: "po-1",
          po_number: "PO-1",
          status: "COMPLETED",
          currency_code: "USD",
          total_amount: new Decimal("10.10"),
          completion_date: new Date("2026-10-10T01:00:00.000Z"),
          supplier: { company: { display_name: "Supplier", legal_name: "Supplier" } },
          purchase_requisition: {
            requested_by_user: { id: "user-1", first_name: "Ada", last_name: "Lovelace" },
          },
          items: [{ id: "item-1", total_price: new Decimal("10.10"), source_item_type: "RFQ_ITEM", source_item_id: "rfq-item-1", item_type: "GOODS" }],
        },
        {
          id: "po-2",
          po_number: "PO-2",
          status: "COMPLETED",
          currency_code: "PHP",
          total_amount: new Decimal("20.20"),
          completion_date: new Date("2026-10-11T01:00:00.000Z"),
          supplier: { company: { display_name: "Supplier", legal_name: "Supplier" } },
          purchase_requisition: { requested_by_user: null },
          items: [{ id: "item-2", total_price: new Decimal("20.20"), source_item_type: null, source_item_id: null, item_type: null }],
        },
      ],
    });

    const report = await service.getMonthlyCompletedProcurementReport({
      tenant_id: "tenant-1",
      company_id: "company-1",
      query: { month: "2026-10" },
    });

    expect(repository.getCompletedPurchaseOrdersForReport).toHaveBeenCalledWith({
      tenant_id: "tenant-1",
      company_id: "company-1",
      start: new Date("2026-10-01T00:00:00.000Z"),
      end: new Date("2026-11-01T00:00:00.000Z"),
    });
    expect(report.summary.values_by_currency).toEqual([
      { currency_code: "USD", value: "10.10" },
      { currency_code: "PHP", value: "20.20" },
    ]);
    expect(report.categories).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: "GOODS", currency_code: "USD", value: "10.10" }),
      expect.objectContaining({ category: "UNCLASSIFIED", currency_code: "PHP", value: "20.20" }),
    ]));
    expect(report.requesters).toEqual(expect.arrayContaining([
      expect.objectContaining({ requester_name: "Ada Lovelace", currency_code: "USD" }),
      expect.objectContaining({ requester_name: "Unattributed", currency_code: "PHP" }),
    ]));
  });

  it("returns an empty report without fabricating totals", async () => {
    repository.getCompletedPurchaseOrdersForReport.mockResolvedValue({
      missingCompletionEvents: 0,
      purchaseOrders: [],
    });

    const report = await service.getMonthlyCompletedProcurementReport({
      tenant_id: "tenant-1",
      company_id: "company-1",
      query: { month: "2026-10" },
    });

    expect(report.summary).toEqual({
      completed_purchase_order_count: 0,
      values_by_currency: [],
    });
    expect(report.records).toEqual([]);
  });
});