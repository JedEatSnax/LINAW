import { NotFoundError } from "../../shared/errors/appError.js";
import type { EventBus } from "../../shared/events/eventBus.js";
import type { SupplierQuotationSubmittedEvent } from "../../shared/events/supplierQuotationSubmittedEvent";
import { PurchaseOrderManagementRepository } from "./purchaseOrderManagementRepository";
import type {
  CreateRFQ,
  ListPurchaseOrdersQuery,
  ListRFQsQuery,
  ProcurementQueueQuery,
  RFQIdParams,
  QuotationParams,
  PurchaseOrderIdParams,
  UpdatePurchaseOrder,
  UpdateRFQ,
  MonthlyCompletedProcurementQuery,
} from "./purchaseOrderManagementValidator";

import { ConflictError } from "../../shared/errors/appError.js";
import Decimal from "decimal.js";
import {
  PURCHASE_ORDER_AUDIT_EVENT,
  type PurchaseOrderAuditAction,
} from "../../shared/events/purchaseOrderEvents.js";

interface OrderPurchaseOrderContext {
  user_id: string;
  tenant_id: string;
  company_id: string;
  poId: string;
}

interface CreateRFQInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  body: CreateRFQ;
}

interface ServicePoQuery {
  user_id: string;
  tenant_id: string;
  company_id: string;
  query?: ListPurchaseOrdersQuery;
}

interface ServiceRfqsQuery {
  user_id: string;
  tenant_id: string;
  company_id: string;
  query?: ListRFQsQuery;
}

interface ServiceProcurementQueueQuery {
  tenant_id: string;
  company_id: string;
  query?: ProcurementQueueQuery;
}

interface ServiceRfqIdParam {
  user_id: string;
  tenant_id: string;
  company_id: string;
  params: RFQIdParams;
}

interface ServiceQuotationParam {
  user_id: string;
  tenant_id: string;
  company_id: string;
  params: QuotationParams;
}

interface ServicesPurchaseOrderIdParam {
  user_id: string;
  tenant_id: string;
  company_id: string;
  params: PurchaseOrderIdParams;
}

interface ServiceUpdateRfqInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  params: RFQIdParams;
  body: UpdateRFQ;
}

interface ServiceUpdatePurchaseOrderInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  params: PurchaseOrderIdParams;
  body: UpdatePurchaseOrder;
}

interface ServiceDeleteRfqsInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  params: RFQIdParams;
}

interface ServiceDeletePurchaseOrderInput {
  user_id: string;
  tenant_id: string;
  company_id: string;
  params: PurchaseOrderIdParams;
}

interface ApprovedPRContext {
  purchaseRequisition_id?: string;
  approvalWorkflow_id?: string;
  tenant_id?: string;
  company_id?: string;
  user_id?: string;
}

export class PurchaseOrderManagementService {
  constructor(
    private repository: PurchaseOrderManagementRepository,
    private eventBus: EventBus,
  ) {}

  private async publishAuditEvent(input: {
    tenantId: string;
    companyId: string;
    actorId: string | null;
    entityType: "RFQ" | "SUPPLIER_QUOTATION" | "PURCHASE_ORDER";
    entityId: string;
    action: PurchaseOrderAuditAction;
    metadata: Record<string, unknown>;
  }) {
    await this.eventBus.publish(PURCHASE_ORDER_AUDIT_EVENT, input);
  }

  private NumberGenerator(
    creationDate: Date,
    uniqueIdentifier: string,
    revision: number,
  ): string {
    const date = creationDate.toISOString().slice(0, 10).replaceAll("-", "");

    return `${uniqueIdentifier}-${date}-${revision}`;
  }

  async orderPurchaseOrder(input: OrderPurchaseOrderContext) {
    const purchaseOrder = await this.repository.findPoById({
      po_id: input.poId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    });

    if (!purchaseOrder) {
      throw new NotFoundError("Purchase order does not exist");
    }

    const orderedPurchaseOrder =
      purchaseOrder.status === "DRAFT"
        ? await this.repository.issuePurchaseOrder({
            po_id: input.poId,
            tenant_id: input.tenant_id,
            company_id: input.company_id,
          })
        : purchaseOrder.status === "ISSUED"
          ? await this.repository.orderPurchaseOrder({
              po_id: input.poId,
              tenant_id: input.tenant_id,
              company_id: input.company_id,
            })
          : null;

    if (!orderedPurchaseOrder) {
      throw new ConflictError(
        "Purchase order cannot be ordered in its current state",
      );
    }

    await this.publishAuditEvent({
      tenantId: input.tenant_id,
      companyId: input.company_id,
      actorId: input.user_id,
      entityType: "PURCHASE_ORDER",
      entityId: input.poId,
      action: purchaseOrder.status === "DRAFT" ? "ISSUED" : "ORDERED",
      metadata: {
        purchaseOrderId: input.poId,
        previousStatus: purchaseOrder.status,
        status: orderedPurchaseOrder.status,
      },
    });

    return orderedPurchaseOrder;
  }

  async completePurchaseOrder(input: OrderPurchaseOrderContext) {
    const purchaseOrder = await this.repository.findPoById({
      po_id: input.poId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    });

    if (!purchaseOrder) {
      throw new NotFoundError("Purchase order does not exist");
    }

    if (purchaseOrder.status !== "ORDERED") {
      throw new ConflictError(
        "Only ordered purchase orders can be completed",
      );
    }

    const completedPurchaseOrder =
      await this.repository.completePurchaseOrder({
        po_id: input.poId,
        tenant_id: input.tenant_id,
        company_id: input.company_id,
      });

    if (!completedPurchaseOrder) {
      throw new ConflictError(
        "Purchase order could not be transitioned to COMPLETED",
      );
    }

    await this.publishAuditEvent({
      tenantId: input.tenant_id,
      companyId: input.company_id,
      actorId: input.user_id,
      entityType: "PURCHASE_ORDER",
      entityId: input.poId,
      action: "COMPLETED",
      metadata: {
        purchaseOrderId: input.poId,
        previousStatus: "ORDERED",
        status: completedPurchaseOrder.status,
      },
    });

    return completedPurchaseOrder;
  }

  async getMonthlyCompletedProcurementReport(input: {
    tenant_id: string;
    company_id: string;
    query: MonthlyCompletedProcurementQuery;
  }) {
    const monthMatch = /^(\d{4})-(\d{2})$/.exec(input.query.month);
    if (!monthMatch) {
      throw new ConflictError("Month must use YYYY-MM format.");
    }
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    const result = await this.repository.getCompletedPurchaseOrdersForReport({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      start,
      end,
    });

    const valueByCurrency = new Map<string, Decimal>();
    const categoryValues = new Map<string, Decimal>();
    const categoryOrders = new Map<string, Set<string>>();
    const requesterValues = new Map<string, Map<string, Decimal>>();
    const requesterOrders = new Map<string, Set<string>>();
    const records = result.purchaseOrders.map((purchaseOrder) => {
      const currentValue = valueByCurrency.get(purchaseOrder.currency_code) ?? new Decimal(0);
      valueByCurrency.set(
        purchaseOrder.currency_code,
        currentValue.add(purchaseOrder.total_amount),
      );

      const requester = purchaseOrder.purchase_requisition?.requested_by_user ?? null;
      const requesterId = requester?.id ?? "UNATTRIBUTED";
      const requesterCurrencyValues = requesterValues.get(requesterId) ?? new Map();
      requesterCurrencyValues.set(
        purchaseOrder.currency_code,
        (requesterCurrencyValues.get(purchaseOrder.currency_code) ?? new Decimal(0)).add(
          purchaseOrder.total_amount,
        ),
      );
      requesterValues.set(requesterId, requesterCurrencyValues);
      const requesterOrderSet = requesterOrders.get(requesterId) ?? new Set<string>();
      requesterOrderSet.add(purchaseOrder.id);
      requesterOrders.set(requesterId, requesterOrderSet);

      for (const item of purchaseOrder.items) {
        const category = ["GOODS", "SERVICE", "ASSET"].includes(item.item_type ?? "")
          ? item.item_type!
          : "UNCLASSIFIED";
        categoryValues.set(
          `${category}:${purchaseOrder.currency_code}`,
          (categoryValues.get(`${category}:${purchaseOrder.currency_code}`) ?? new Decimal(0)).add(
            item.total_price,
          ),
        );
        const categoryOrderSet = categoryOrders.get(category) ?? new Set<string>();
        categoryOrderSet.add(purchaseOrder.id);
        categoryOrders.set(category, categoryOrderSet);
      }

      return {
        id: purchaseOrder.id,
        po_number: purchaseOrder.po_number,
        completion_date: purchaseOrder.completion_date,
        supplier: purchaseOrder.supplier.company.display_name ?? purchaseOrder.supplier.company.legal_name,
        requester: requester
          ? `${requester.first_name} ${requester.last_name}`.trim()
          : "Unattributed",
        currency_code: purchaseOrder.currency_code,
        total_amount: purchaseOrder.total_amount.toFixed(2),
        status: purchaseOrder.status,
      };
    });

    const values = (map: Map<string, Decimal>) =>
      [...map.entries()].map(([currency_code, value]) => ({
        currency_code,
        value: value.toFixed(2),
      }));

    const categories = ["GOODS", "SERVICE", "ASSET", "UNCLASSIFIED"].flatMap((category) =>
      [...new Set(result.purchaseOrders.map((purchaseOrder) => purchaseOrder.currency_code))].map(
        (currency_code) => ({
          category,
          currency_code,
          value: (categoryValues.get(`${category}:${currency_code}`) ?? new Decimal(0)).toFixed(2),
          purchase_order_count: categoryOrders.get(category)?.size ?? 0,
        }),
      ),
    );

    const requesters = [...requesterValues.entries()].flatMap(([requesterId, currencyValues]) =>
      values(currencyValues).map((value) => {
        const requester = result.purchaseOrders.find(
          (purchaseOrder) =>
            (purchaseOrder.purchase_requisition?.requested_by_user?.id ?? "UNATTRIBUTED") === requesterId,
        )?.purchase_requisition?.requested_by_user;
        return {
          requester_id: requesterId === "UNATTRIBUTED" ? null : requesterId,
          requester_name: requester
            ? `${requester.first_name} ${requester.last_name}`.trim()
            : "Unattributed",
          currency_code: value.currency_code,
          value: value.value,
          purchase_order_count: requesterOrders.get(requesterId)?.size ?? 0,
        };
      }),
    );

    return {
      period: {
        month: input.query.month,
        start: start.toISOString(),
        end_exclusive: end.toISOString(),
        date_basis: "audit_trail.created_at for PURCHASE_ORDER COMPLETED events",
      },
      metric_definition:
        "Completed Procurement Value is the stored total_amount of completed purchase orders, grouped by currency. It is not a payment or cash-expenditure measure.",
      summary: {
        completed_purchase_order_count: result.purchaseOrders.length,
        values_by_currency: values(valueByCurrency),
      },
      categories,
      requesters,
      records,
      limitations: [
        ...(result.missingCompletionEvents > 0
          ? [`${result.missingCompletionEvents} completed purchase order audit event(s) could not be matched to an in-scope purchase order.`]
          : []),
        "Purchase-order lines without a valid RFQ-to-requisition-item relationship are reported as UNCLASSIFIED.",
      ],
    };
  }

  async createRFQS(input: CreateRFQInput) {
    const purchaseRequisition =
      await this.repository.findApprovedPurchaseRequisitionForRFQ({
        purchaseRequisition_id: input.body.purchase_requisition_id,
        tenant_id: input.tenant_id,
        company_id: input.company_id,
      });

    if (!purchaseRequisition) {
      throw new NotFoundError("Approved purchase requisition does not exist");
    }

    if (purchaseRequisition.rfqs.length > 0) {
      throw new ConflictError("A purchase requisition already has an RFQ");
    }

    const id = crypto.randomUUID();
    const created_at = new Date();
    const generation = 1;

    const rfq_number = this.NumberGenerator(created_at, id, generation);

    const data = {
      id: id,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      rfq_number: rfq_number,
      purchase_requisition_id: input.body.purchase_requisition_id,
      created_by_user_id: input.user_id,
      title: input.body.title,
      description: input.body.description,
      status: "DRAFT",
      closing_date: input.body.closing_date,
      created_at: created_at,

      items: input.body.rfq_items.map((item) => ({
        tenant_id: input.tenant_id,
        line_no: item.line_no,
        description: item.description,
        quantity: item.quantity,
        unit_of_measure: item.unit_of_measure,
        specification: item.specification,
      })),
    };

    const createdRfq = await this.repository.createRFQS(data);

    await this.publishAuditEvent({
      tenantId: input.tenant_id,
      companyId: input.company_id,
      actorId: input.user_id,
      entityType: "RFQ",
      entityId: createdRfq.id,
      action: "RFQ_CREATED",
      metadata: {
        rfqId: createdRfq.id,
        rfqNumber: createdRfq.rfq_number,
        purchaseRequisitionId: input.body.purchase_requisition_id,
      },
    });

    return createdRfq;
  }

  async publishRFQS(input: ServiceRfqIdParam) {
    const rfq = await this.repository.findRfqById({
      rfq_id: input.params.rfqId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    });

    if (!rfq) {
      throw new NotFoundError("RFQ does not exist");
    }

    if (rfq.status !== "DRAFT") {
      throw new ConflictError("Only draft RFQs can be published");
    }

    const PublishContext = {
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      rfq_id: input.params.rfqId,
    };

    const publishedRfq = await this.repository.publishRfq(PublishContext);

    if (!publishedRfq) {
      throw new NotFoundError("RFQ not found");
    }

    await this.eventBus.publish("rfq.published", {
      rfq_number: publishedRfq.rfq_number,
      tenant_id: input.tenant_id,
      company_id: input.company_id,

      title: publishedRfq.title,
      description: publishedRfq.description,

      quotation_deadline: publishedRfq.closing_date,

      items: publishedRfq.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit_of_measure,
      })),
    });

    return {
      message: "RFQ successfully published",
    };
  }

  async selectSupplier(input: ServiceQuotationParam) {
    const quotation = await this.repository.findQuotationById({
      quotation_id: input.params.quotationId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    });

    const rfq = await this.repository.findRfqById({
      rfq_id: input.params.rfqId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    });

    if (!quotation || !rfq) {
      throw new NotFoundError("Quotation or RFQ does not exist");
    }

    if (quotation.rfq_id !== rfq.id) {
      throw new NotFoundError("Quotation does not belong to this RFQ");
    }

    if (rfq.status !== "PUBLISHED") {
      throw new ConflictError(
        "Only published RFQs can have quotations selected",
      );
    }

    const createdAt = new Date();
    const id = crypto.randomUUID();
    const poNumber = this.NumberGenerator(createdAt, id, 1);

    const purchaseOrder = await this.repository.selectSupplier({
      id,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      user_id: input.user_id,
      rfq_id: rfq.id,
      quotation_id: quotation.id,
      supplier_id: quotation.supplier_id,
      po_number: poNumber,
      order_date: createdAt,
      expected_delivery_date: undefined,
    });

    if (!purchaseOrder) {
      throw new ConflictError(
        "The quotation could not be selected. It may no longer be available.",
      );
    }

    await this.publishAuditEvent({
      tenantId: input.tenant_id,
      companyId: input.company_id,
      actorId: input.user_id,
      entityType: "SUPPLIER_QUOTATION",
      entityId: quotation.id,
      action: "QUOTATION_SELECTED",
      metadata: {
        quotationId: quotation.id,
        rfqId: rfq.id,
        purchaseOrderId: purchaseOrder.id,
      },
    });

    await this.publishAuditEvent({
      tenantId: input.tenant_id,
      companyId: input.company_id,
      actorId: input.user_id,
      entityType: "PURCHASE_ORDER",
      entityId: purchaseOrder.id,
      action: "PURCHASE_ORDER_CREATED",
      metadata: {
        purchaseOrderId: purchaseOrder.id,
        quotationId: quotation.id,
        rfqId: rfq.id,
        purchaseRequisitionId: purchaseOrder.purchase_requisition_id,
      },
    });

    return purchaseOrder;
  }

  async handleSupplierQuotationSubmitted(
    event: SupplierQuotationSubmittedEvent,
  ) {
    const markedPosted = await this.repository.markQuotationPosted({
      quotation_id: event.quotation_id,
      tenant_id: event.tenant_id,
      company_id: event.company_id,
    });

    if (markedPosted) {
      await this.publishAuditEvent({
        tenantId: event.tenant_id,
        companyId: event.company_id,
        actorId: null,
        entityType: "SUPPLIER_QUOTATION",
        entityId: event.quotation_id,
        action: "QUOTATION_SUBMITTED",
        metadata: {
          quotationId: event.quotation_id,
          quotationNumber: event.quotation_number,
          rfqId: event.rfq_id,
          supplierId: event.supplier_id,
          submittedAt: event.submitted_at.toISOString(),
        },
      });
    }

    return markedPosted;
  }

  async handleApprovedPurchaseRequisition(event: ApprovedPRContext) {
    const {
      purchaseRequisition_id,
      approvalWorkflow_id,
      tenant_id,
      company_id,
    } = event;

    if (
      !purchaseRequisition_id ||
      !approvalWorkflow_id ||
      !tenant_id ||
      !company_id
    ) {
      throw new NotFoundError(
        "Missing required information to handle approved purchase requisition",
      );
    }

    const purchaseRequisition =
      await this.repository.findApprovedPurchaseRequisition({
        purchaseRequisition_id: purchaseRequisition_id,
        approvalWorkflow_id: approvalWorkflow_id,
        tenant_id: tenant_id,
        company_id: company_id,
      });

    if (!purchaseRequisition) {
      throw new NotFoundError("Approved purchase requisition does not exist");
    }

    if (purchaseRequisition.rfqs.length > 0) {
      throw new ConflictError("A purchase requisition already has an RFQ");
    }

    return {
      purchaseRequisition_id: purchaseRequisition.id,
      pr_number: purchaseRequisition.pr_number,
      tenant_id: purchaseRequisition.tenant_id,
      company_id: purchaseRequisition.company_id,
      items: purchaseRequisition.items,
    };
  }

  async getProcurementQueue(input: ServiceProcurementQueueQuery) {
    return this.repository.getProcurementQueue({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      query: input.query,
    });
  }

  async getList(input: ServicePoQuery) {
    return await this.repository.getList({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      query: input.query,
    });
  }

  async countList(input: ServicePoQuery) {
    return this.repository.countList({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      query: input.query,
    });
  }

  async getRFQS(input: ServiceRfqsQuery) {
    return await this.repository.getRFQS({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      query: input.query,
    });
  }

  async countRFQS(input: ServiceRfqsQuery) {
    return this.repository.countRFQS({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      query: input.query,
    });
  }

  async getQuotationList(input: ServiceRfqIdParam) {
    const rfq = await this.repository.findRfqById({
      rfq_id: input.params.rfqId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    });

    if (!rfq) {
      throw new NotFoundError("RFQ does not exist");
    }

    return await this.repository.getQuotationList({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      rfq_id: input.params.rfqId,
    });
  }

  async getAllQuotations(input: { tenant_id: string; company_id: string }) {
    const [list, total] = await Promise.all([
      this.repository.getAllQuotations(input),
      this.repository.countQuotations(input),
    ]);

    return { list, total };
  }

  async getQuotation(input: ServiceQuotationParam) {
    const quotation = await this.repository.getQuotation({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      rfq_id: input.params.rfqId,
      quotation_id: input.params.quotationId,
    });

    if (!quotation) {
      throw new NotFoundError("Quotation does not exist");
    }

    return quotation;
  }

  async getPO(input: ServicesPurchaseOrderIdParam) {
    const purchaseOrder = await this.repository.getPO({
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      po_id: input.params.poId,
    });

    if (!purchaseOrder) {
      throw new NotFoundError("Purchase order does not exist");
    }

    return purchaseOrder;
  }
  async updateRFQS(input: ServiceUpdateRfqInput) {
    const rfq = await this.repository.findRfqById({
      rfq_id: input.params.rfqId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    });

    if (!rfq) {
      throw new NotFoundError("RFQ does not exist");
    }

    if (rfq.status !== "DRAFT") {
      throw new ConflictError("Only draft RFQs can be updated");
    }

    const data = {
      rfq_id: input.params.rfqId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      title: input.body.title,
      description: input.body.description,
      closing_date: input.body.closing_date,

      items: input.body.rfq_items?.map((item) => ({
        line_no: item.line_no,
        description: item.description,
        quantity: item.quantity,
        unit_of_measure: item.unit_of_measure,
        specification: item.specification,
      })),
    };

    return await this.repository.updateRFQS(data);
  }

  async updatePO(input: ServiceUpdatePurchaseOrderInput) {
    const purchaseOrder = await this.repository.findPoById({
      po_id: input.params.poId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    });

    if (!purchaseOrder) {
      throw new NotFoundError("Purchase order does not exist");
    }

    if (purchaseOrder.status !== "ISSUED") {
      throw new ConflictError("Only issued purchase orders can be updated");
    }

    const data = {
      po_id: input.params.poId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
      expected_delivery_date: input.body.expected_delivery_date,
      currency_code: input.body.currency_code,

      items: input.body.items?.map((item) => ({
        line_no: item.line_no,
        description: item.description,
        quantity: item.quantity,
        unit_of_measure: item.unit_of_measure,
        unit_price: item.unit_price,
      })),
    };

    return await this.repository.updatePO(data);
  }

  async deleteRfq(input: ServiceDeleteRfqsInput) {
    const rfq = await this.repository.findRfqById({
      rfq_id: input.params.rfqId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    });

    if (!rfq) {
      throw new NotFoundError("RFQ does not Exist");
    }

    if (rfq.status !== "DRAFT") {
      throw new ConflictError("Only draft RFQs can be deleted");
    }

    const data = {
      rfq_id: input.params.rfqId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    };

    return await this.repository.deleteRfq(data);
  }

  async deletePurchaseOrder(input: ServiceDeletePurchaseOrderInput) {
    const po = await this.repository.findPoById({
      po_id: input.params.poId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    });

    if (!po) {
      throw new NotFoundError("Purchase order does not exist");
    }

    if (["ORDERED", "COMPLETED", "CANCELLED"].includes(po.status)) {
      throw new ConflictError(
        "Purchase order cannot be cancelled in its current state",
      );
    }

    const data = {
      po_id: input.params.poId,
      tenant_id: input.tenant_id,
      company_id: input.company_id,
    };

    return await this.repository.deletePo(data);
  }
}
