import { NotFoundError } from "../../../shared/errors/appError.js";
import type { EventBus } from "../../../shared/events/eventBus";
import type { SubmitSupplierQuotation } from "./supplierManagementPortalValidator";
import { SupplierManagementPortalRepository } from "./supplierManagementPortalRepository";
import { SUPPLIER_QUOTATION_SUBMITTED_EVENT } from "./supplierManagementPortalEventHandler";
import Decimal from "decimal.js";
import { currencyDecimalPlaces } from "../../../shared/currency.js";

interface SupplierPortalContext {
  user_id: string;
  tenant_id: string;
  company_id: string;
}

interface SupplierPortalRFQContext extends SupplierPortalContext {
  rfq_id: string;
}

interface SupplierPortalQuotationContext extends SupplierPortalContext {
  quotation_id: string;
}

interface SubmitQuotationContext extends SupplierPortalRFQContext {
  body: SubmitSupplierQuotation;
}

export class SupplierManagementPortalService {
  constructor(
    private repository: SupplierManagementPortalRepository,
    private eventBus: EventBus,
  ) {}

  /**
   * Resolve the Supplier record associated with the authenticated company.
   *
   * The supplier's tenant and company IDs identify the supplier itself.
   * They must not be confused with the purchasing company's context.
   */
  private async resolveSupplier(input: SupplierPortalContext) {
    const supplier = await this.repository.findSupplierByCompany({
      supplier_company_id: input.company_id,
      supplier_tenant_id: input.tenant_id,
    });

    if (!supplier) {
      throw new NotFoundError(
        "The authenticated company is not an active supplier.",
      );
    }

    return supplier;
  }

  /**
   * Generate a unique quotation number using the same date-based
   * convention as the Purchase Order Management service.
   */
  private generateQuotationNumber(
    creationDate: Date,
    uniqueIdentifier: string,
    revision: number,
  ): string {
    const date = creationDate.toISOString().slice(0, 10).replaceAll("-", "");

    return `${uniqueIdentifier}-${date}-${revision}`;
  }

  private formatAmount(amount: Decimal, currencyCode: string): string {
    const digits = currencyDecimalPlaces(currencyCode);
    return amount.toDecimalPlaces(digits).toFixed(digits);
  }

  /**
   * Calculate the line total without directly summing floating-point
   * monetary values.
   */
  private calculateLineTotal(
    quantity: number,
    unitPrice: number,
    currencyCode: string,
  ): Decimal {
    return new Decimal(quantity)
      .mul(unitPrice)
      .toDecimalPlaces(currencyDecimalPlaces(currencyCode));
  }

  /**
   * Retrieve published RFQs available to this supplier.
   */
  async getAvailableRFQs(input: SupplierPortalContext) {
    const supplier = await this.resolveSupplier(input);

    return this.repository.getAvailableRFQs({
      supplier_id: supplier.id,
    });
  }

  /**
   * Retrieve one published RFQ accessible to this supplier.
   */
  async getRFQ(input: SupplierPortalRFQContext) {
    const supplier = await this.resolveSupplier(input);

    const rfq = await this.repository.getRFQ({
      rfq_id: input.rfq_id,
      supplier_id: supplier.id,
    });

    if (!rfq) {
      throw new NotFoundError(
        "RFQ does not exist or is not available to this supplier.",
      );
    }

    return rfq;
  }

  /**
   * Retrieve quotations submitted by this supplier.
   */
  async getQuotations(input: SupplierPortalContext) {
    const supplier = await this.resolveSupplier(input);

    return this.repository.getQuotations({
      supplier_id: supplier.id,
    });
  }

  /**
   * Retrieve one quotation belonging to this supplier.
   */
  async getQuotation(input: SupplierPortalQuotationContext) {
    const supplier = await this.resolveSupplier(input);

    const quotation = await this.repository.getQuotation({
      quotation_id: input.quotation_id,
      supplier_id: supplier.id,
    });

    if (!quotation) {
      throw new NotFoundError(
        "Quotation does not exist or does not belong to this supplier.",
      );
    }

    return quotation;
  }

  /**
   * Submit a quotation for an RFQ accessible to this supplier.
   */
  async submitQuotation(input: SubmitQuotationContext) {
    const supplier = await this.resolveSupplier(input);

    // The repository returns the purchasing company's tenant and
    // company context through the RFQ record.
    const rfq = await this.repository.getRFQ({
      rfq_id: input.rfq_id,
      supplier_id: supplier.id,
    });

    if (!rfq) {
      throw new NotFoundError(
        "RFQ does not exist or is not available to this supplier.",
      );
    }

    if (
      input.body.valid_until &&
      input.body.valid_until.getTime() < Date.now()
    ) {
      throw new Error("Quotation validity date cannot be in the past.");
    }

    // Every RFQ item must be quoted exactly once.
    const rfqItemsById = new Map(rfq.items.map((item) => [item.id, item]));

    if (input.body.items.length !== rfq.items.length) {
      throw new Error(
        "A quotation must include every item in the RFQ exactly once.",
      );
    }

    const submittedItemIds = new Set<string>();

    let totalAmount = new Decimal(0);

    const quotationItems = input.body.items.map((item, index) => {
      const rfqItem = rfqItemsById.get(item.rfq_item_id);

      if (!rfqItem) {
        throw new Error("A quoted item does not belong to this RFQ.");
      }

      if (submittedItemIds.has(item.rfq_item_id)) {
        throw new Error(
          "An RFQ item cannot appear more than once in a quotation.",
        );
      }

      submittedItemIds.add(item.rfq_item_id);

      const lineTotal = this.calculateLineTotal(
        item.quoted_quantity,
        item.unit_price,
        input.body.currency_code,
      );

      totalAmount = totalAmount.add(lineTotal);

      return {
        tenant_id: rfq.tenant_id,
        company_id: rfq.company_id,
        rfq_item_id: rfqItem.id,
        line_no: index + 1,
        quoted_quantity: item.quoted_quantity.toFixed(4),
        unit_price: this.formatAmount(
          new Decimal(item.unit_price),
          input.body.currency_code,
        ),
        total_price: this.formatAmount(lineTotal, input.body.currency_code),
        ...(item.lead_time_days !== undefined
          ? { lead_time_days: item.lead_time_days }
          : {}),
        ...(item.remarks !== undefined ? { remarks: item.remarks } : {}),
      };
    });

    const submittedAt = new Date();
    const quotationId = crypto.randomUUID();

    const quotationNumber = this.generateQuotationNumber(
      submittedAt,
      quotationId,
      1,
    );

    const quotation = await this.repository.submitQuotation({
      // These IDs belong to the purchasing company, which owns the RFQ.
      tenant_id: rfq.tenant_id,
      company_id: rfq.company_id,

      supplier_id: supplier.id,
      rfq_id: rfq.id,
      quotation_number: quotationNumber,
      currency_code: input.body.currency_code,
      total_amount: this.formatAmount(totalAmount, input.body.currency_code),
      submitted_at: submittedAt,
      valid_until: input.body.valid_until ?? null,
      items: quotationItems,
    });

    if (!quotation) {
      throw new Error(
        "Quotation submission failed. The RFQ may have closed, " +
          "the supplier relationship may no longer be active, " +
          "or a quotation may already exist for this RFQ.",
      );
    }

    // Notify subscribers only after the repository successfully creates
    // the quotation.
    await this.eventBus.publish(SUPPLIER_QUOTATION_SUBMITTED_EVENT, {
      quotation_id: quotation.id,
      quotation_number: quotation.quotation_number,
      tenant_id: quotation.tenant_id,
      company_id: quotation.company_id,
      supplier_id: quotation.supplier_id,
      rfq_id: quotation.rfq_id,
      currency_code: quotation.currency_code,
      total_amount: quotation.total_amount,
      submitted_at: quotation.submitted_at,
    });

    return quotation;
  }
}
