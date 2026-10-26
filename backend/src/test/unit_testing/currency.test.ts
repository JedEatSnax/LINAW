import { describe, expect, it } from "vitest";
import {
  currencyCodeSchema,
  currencyDecimalPlaces,
  DEFAULT_CURRENCY_CODE,
  hasCurrencyPrecision,
} from "../../shared/currency.js";
import { purchaseRequisitionInputSchema } from "../../modules/purchase_requisition/purchaseRequisitionValidation.js";

const item = {
  item_type: "GOODS" as const,
  description: "Office supplies",
  specification: "Standard supplies",
  quantity: 1,
  unit_of_measure: "Each",
  estimated_unit_cost: 10,
};

describe("currency contracts", () => {
  it("uses PHP when a requisition currency is omitted", () => {
    const result = purchaseRequisitionInputSchema.parse({
      workflow_code: "PURCHASE_REQUISITION",
      justification: "A sufficiently detailed business justification.",
      items: [item],
    });

    expect(result.currency_code).toBe(DEFAULT_CURRENCY_CODE);
  });

  it("accepts active currencies and rejects special-purpose codes", () => {
    expect(currencyCodeSchema.parse("usd")).toBe("USD");
    expect(currencyCodeSchema.parse("PHP")).toBe("PHP");
    expect(() => currencyCodeSchema.parse("XXX")).toThrow();
    expect(() => currencyCodeSchema.parse("ZZZ")).toThrow();
  });

  it("uses ISO minor-unit precision", () => {
    expect(currencyDecimalPlaces("JPY")).toBe(0);
    expect(currencyDecimalPlaces("KWD")).toBe(3);
    expect(hasCurrencyPrecision(100, "JPY")).toBe(true);
    expect(hasCurrencyPrecision(100.001, "KWD")).toBe(true);
    expect(hasCurrencyPrecision(100.001, "USD")).toBe(false);
  });
});
