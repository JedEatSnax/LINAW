import { prisma } from "../../config/database.js";
import {
  RFQStatus,
  type ListPurchaseOrdersQuery,
  type ListRFQsQuery,
  type ProcurementQueueQuery,
} from "./purchaseOrderManagementValidator.js";

interface CreateRFQSContext {
  id: string;
  tenant_id: string;
  company_id: string;

  rfq_number: string;
  purchase_requisition_id: string;
  created_by_user_id: string;

  title: string;
  description: string | undefined;
  closing_date: Date;
  status: string;
  created_at: Date;

  items: {
    tenant_id: string;
    line_no: number;
    description: string;
    quantity: number;
    unit_of_measure: string;
    specification: string;
  }[];
}

interface QuotationContext {
  quotation_id: string;
  tenant_id: string;
  company_id: string;
}

interface RFQContext {
  rfq_id: string;
  tenant_id: string;
  company_id: string;
}

interface POContext {
  po_id: string;
  tenant_id: string;
  company_id: string;
}

interface SupplierSelectionContext {
  id: string;
  tenant_id: string;
  company_id: string;
  user_id: string;

  rfq_id: string;
  quotation_id: string;
  supplier_id: string;

  po_number: string;
  order_date: Date;
  expected_delivery_date: Date | undefined;
}

interface PublishContext {
  tenant_id: string;
  company_id: string;
  rfq_id: string;
}

interface PoQueryContext {
  tenant_id: string;
  company_id: string;
  query?: ListPurchaseOrdersQuery;
}

interface RfqQueryContext {
  tenant_id: string;
  company_id: string;
  query?: ListRFQsQuery;
}

interface ProcurementQueueQueryContext {
  tenant_id: string;
  company_id: string;
  query?: ProcurementQueueQuery;
}

interface QuotationsListContext {
  tenant_id: string;
  company_id: string;
  rfq_id: string;
}

interface GetQuotationContext {
  tenant_id: string;
  company_id: string;
  rfq_id: string;
  quotation_id: string;
}

interface UpdateRfqsContext {
  rfq_id: string;
  tenant_id: string;
  company_id: string;
  title: string | undefined;
  description: string | undefined;
  closing_date: Date | undefined;
  items:
    | {
        line_no: number;
        description: string;
        quantity: number;
        unit_of_measure: string;
        specification: string;
      }[]
    | undefined;
}

interface OrderPurchaseOrderRepositoryContext {
  po_id: string;
  tenant_id: string;
  company_id: string;
}

interface UpdatePoContext {
  po_id: string;
  tenant_id: string;
  company_id: string;
  expected_delivery_date: Date | undefined;
  currency_code: string | undefined;
  items:
    | {
        line_no: number;
        description: string;
        quantity: number;
        unit_of_measure: string;
        unit_price: number;
      }[]
    | undefined;
}

export class PurchaseOrderManagementRepository {
  // Create

  async createRFQS(data: CreateRFQSContext) {
    return prisma.rFQ.create({
      data: {
        id: data.id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,

        rfq_number: data.rfq_number,
        purchase_requisition_id: data.purchase_requisition_id,
        created_by_user_id: data.created_by_user_id,

        title: data.title,
        description: data.description,
        closing_date: data.closing_date,
        status: data.status,
        created_at: data.created_at,

        items: {
          create: data.items,
        },
      },
    });
  }

  // Find

  async findRfqById(data: RFQContext) {
    return prisma.rFQ.findFirst({
      where: {
        id: data.rfq_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
      },
      include: {
        items: true,
      },
    });
  }

  async findQuotationById(data: QuotationContext) {
    return prisma.supplierQuotation.findFirst({
      where: {
        id: data.quotation_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
      },
    });
  }

  async findPoById(data: POContext) {
    return prisma.purchaseOrder.findFirst({
      where: {
        id: data.po_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
      },
    });
  }

  async findApprovedPurchaseRequisition(data: {
    purchaseRequisition_id: string;
    approvalWorkflow_id: string;
    tenant_id: string;
    company_id: string;
  }) {
    return prisma.purchaseRequisition.findFirst({
      where: {
        id: data.purchaseRequisition_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
        status: "APPROVED",
        approved_at: {
          not: null,
        },
      },
      include: {
        items: true,
        rfqs: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  async findApprovedPurchaseRequisitionForRFQ(data: {
    purchaseRequisition_id: string;
    tenant_id: string;
    company_id: string;
  }) {
    return prisma.purchaseRequisition.findFirst({
      where: {
        id: data.purchaseRequisition_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
        status: "APPROVED",
        approved_at: {
          not: null,
        },
      },
      include: {
        rfqs: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  // Publish / Selection

  async publishRfq(data: PublishContext) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.rFQ.updateMany({
        where: {
          id: data.rfq_id,
          tenant_id: data.tenant_id,
          company_id: data.company_id,
          status: RFQStatus.DRAFT,
        },
        data: {
          status: RFQStatus.PUBLISHED,
          issue_date: new Date(),
        },
      });

      if (result.count !== 1) {
        return null;
      }

      const relationships = await tx.supplierCompanyRelationship.findMany({
        where: {
          tenant_id: data.tenant_id,
          company_id: data.company_id,
          relationship_status: "ACTIVE",
        },
        select: { supplier_id: true },
      });

      if (relationships.length > 0) {
        await tx.rFQSupplierAssignment.createMany({
          data: relationships.map(({ supplier_id }) => ({
            tenant_id: data.tenant_id,
            company_id: data.company_id,
            rfq_id: data.rfq_id,
            supplier_id,
          })),
          skipDuplicates: true,
        });
      }

      return tx.rFQ.findFirst({
        where: {
          id: data.rfq_id,
          tenant_id: data.tenant_id,
          company_id: data.company_id,
        },
        include: { items: true },
      });
    });
  }

  async selectSupplier(data: SupplierSelectionContext) {
    return prisma.$transaction(async (tx) => {
      const rfq = await tx.rFQ.findFirst({
        where: {
          id: data.rfq_id,
          tenant_id: data.tenant_id,
          company_id: data.company_id,
          status: RFQStatus.PUBLISHED,
        },
        select: {
          id: true,
          purchase_requisition_id: true,
        },
      });

      if (!rfq) {
        return null;
      }

      const quotation = await tx.supplierQuotation.findFirst({
        where: {
          id: data.quotation_id,
          tenant_id: data.tenant_id,
          company_id: data.company_id,
          rfq_id: rfq.id,
          supplier_id: data.supplier_id,
          status: "POSTED",
        },
        include: {
          items: true,
        },
      });

      if (!quotation) {
        return null;
      }

      const rfqItems = await tx.rFQItem.findMany({
        where: {
          rfq_id: rfq.id,
          tenant_id: data.tenant_id,
        },
      });

      const rfqItemsById = new Map(rfqItems.map((item) => [item.id, item]));

      const purchaseOrderItems = quotation.items.map((item) => {
        const rfqItem = rfqItemsById.get(item.rfq_item_id);

        if (!rfqItem) {
          throw new Error(`RFQ item ${item.rfq_item_id} was not found`);
        }

        return {
          tenant_id: data.tenant_id,
          source_item_type: "RFQ_ITEM",
          source_item_id: rfqItem.id,
          line_no: item.line_no,
          description: rfqItem.description,
          quantity: item.quoted_quantity,
          unit_of_measure: rfqItem.unit_of_measure,
          unit_price: item.unit_price,
          total_price: item.total_price,
          status: "ACTIVE",
        };
      });
      // Ensure this quotation has not already been selected.
      const selection = await tx.supplierQuotation.updateMany({
        where: {
          id: quotation.id,
          tenant_id: data.tenant_id,
          company_id: data.company_id,
          rfq_id: rfq.id,
          supplier_id: data.supplier_id,
          status: "POSTED",
        },
        data: {
          status: "SELECTED",
        },
      });

      if (selection.count !== 1) {
        return null;
      }

      const assignment = await tx.rFQSupplierAssignment.findFirst({
        where: {
          tenant_id: data.tenant_id,
          company_id: data.company_id,
          rfq_id: rfq.id,
          supplier_id: data.supplier_id,
        },
        select: {
          id: true,
        },
      });

      if (!assignment) {
        return null;
      }

      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          id: data.id,
          tenant_id: data.tenant_id,
          company_id: data.company_id,
          supplier_id: data.supplier_id,

          purchase_requisition_id: rfq.purchase_requisition_id,
          rfq_id: rfq.id,
          supplier_quotation_id: quotation.id,

          po_number: data.po_number,
          issued_by_user_id: data.user_id,
          status: "DRAFT",

          currency_code: quotation.currency_code,
          total_amount: quotation.total_amount,

          order_date: data.order_date,
          expected_delivery_date: data.expected_delivery_date,

          items: {
            create: purchaseOrderItems,
          },
        },
        include: {
          items: true,
        },
      });

      return purchaseOrder;
    });
  }

  async markQuotationPosted(data: QuotationContext) {
    const result = await prisma.supplierQuotation.updateMany({
      where: {
        id: data.quotation_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
        status: "SUBMITTED",
      },
      data: {
        status: "POSTED",
      },
    });

    return result.count === 1;
  }

  // Query

  async getList(data: PoQueryContext) {
    return prisma.purchaseOrder.findMany({
      take: 20,
      where: {
        tenant_id: data.tenant_id,
        company_id: data.company_id,

        ...(data.query?.status && {
          status: data.query.status,
        }),

        ...(data.query?.referenceNo && {
          po_number: {
            contains: data.query.referenceNo,
            mode: "insensitive",
          },
        }),
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        items: true,
        supplier: {
          select: {
            id: true,
            supplier_code: true,
            company: {
              select: {
                legal_name: true,
                display_name: true,
              },
            },
          },
        },
      },
    });
  }

  async countList(data: PoQueryContext) {
    return prisma.purchaseOrder.count({
      where: {
        tenant_id: data.tenant_id,
        company_id: data.company_id,
        ...(data.query?.status && { status: data.query.status }),
        ...(data.query?.referenceNo && {
          po_number: { contains: data.query.referenceNo, mode: "insensitive" },
        }),
      },
    });
  }

  async getRFQS(data: RfqQueryContext) {
    return prisma.rFQ.findMany({
      take: 20,
      where: {
        tenant_id: data.tenant_id,
        company_id: data.company_id,

        ...(data.query?.status && {
          status: data.query.status,
        }),

        ...(data.query?.purchase_requisition_id && {
          purchase_requisition_id: data.query.purchase_requisition_id,
        }),
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        items: true,
      },
    });
  }

  async countRFQS(data: RfqQueryContext) {
    return prisma.rFQ.count({
      where: {
        tenant_id: data.tenant_id,
        company_id: data.company_id,
        ...(data.query?.status && { status: data.query.status }),
        ...(data.query?.purchase_requisition_id && {
          purchase_requisition_id: data.query.purchase_requisition_id,
        }),
      },
    });
  }

  async getProcurementQueue(data: ProcurementQueueQueryContext) {
    return prisma.purchaseRequisition.findMany({
      where: {
        tenant_id: data.tenant_id,
        company_id: data.company_id,
        status: "APPROVED",
        approved_at: { not: null },
        rfqs: { none: {} },
        ...(data.query?.referenceNo && {
          pr_number: {
            contains: data.query.referenceNo,
            mode: "insensitive",
          },
        }),
      },
      orderBy: { approved_at: "desc" },
      include: { items: true },
    });
  }

  async getQuotationList(data: QuotationsListContext) {
    return prisma.supplierQuotation.findMany({
      where: {
        tenant_id: data.tenant_id,
        company_id: data.company_id,
        rfq_id: data.rfq_id,
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        items: true,
      },
    });
  }

  async getAllQuotations(data: { tenant_id: string; company_id: string }) {
    return prisma.supplierQuotation.findMany({
      where: {
        tenant_id: data.tenant_id,
        company_id: data.company_id,
      },
      orderBy: { created_at: "desc" },
      include: {
        items: true,
        rfq: { select: { id: true, rfq_number: true, title: true } },
        supplier: { select: { id: true, supplier_code: true } },
      },
    });
  }

  async countQuotations(data: { tenant_id: string; company_id: string }) {
    return prisma.supplierQuotation.count({
      where: {
        tenant_id: data.tenant_id,
        company_id: data.company_id,
      },
    });
  }

  async getQuotation(data: GetQuotationContext) {
    return prisma.supplierQuotation.findFirst({
      where: {
        id: data.quotation_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
        rfq_id: data.rfq_id,
      },
      include: {
        items: true,
      },
    });
  }

  async getPO(data: POContext) {
    return prisma.purchaseOrder.findFirst({
      where: {
        id: data.po_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
      },
      include: {
        items: true,
        company: {
          select: {
            id: true,
            legal_name: true,
            display_name: true,
          },
        },
        supplier: {
          include: {
            company: {
              select: {
                id: true,
                legal_name: true,
                display_name: true,
              },
            },
          },
        },
        purchase_requisition: {
          include: {
            items: true,
          },
        },
        rfq: {
          select: {
            id: true,
            rfq_number: true,
            title: true,
          },
        },
        supplier_quotation: {
          include: {
            items: {
              include: {
                rfq_item: true,
              },
            },
          },
        },
      },
    });
  }

  // Update

  async updateRFQS(data: UpdateRfqsContext) {
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: data.rfq_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!rfq || rfq.status !== RFQStatus.DRAFT) {
      return null;
    }

    return prisma.$transaction(async (tx) => {
      const updatedRfq = await tx.rFQ.update({
        where: {
          id: rfq.id,
        },
        data: {
          ...(data.title !== undefined && {
            title: data.title,
          }),

          ...(data.description !== undefined && {
            description: data.description,
          }),

          ...(data.closing_date !== undefined && {
            closing_date: data.closing_date,
          }),
        },
      });

      if (data.items !== undefined) {
        for (const item of data.items) {
          await tx.rFQItem.updateMany({
            where: {
              rfq_id: rfq.id,
              tenant_id: data.tenant_id,
              line_no: item.line_no,
            },
            data: {
              description: item.description,
              quantity: item.quantity,
              unit_of_measure: item.unit_of_measure,
              specification: item.specification,
            },
          });
        }
      }

      return updatedRfq;
    });
  }

  async updatePO(data: UpdatePoContext) {
    const po = await prisma.purchaseOrder.findFirst({
      where: {
        id: data.po_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
      },
      select: {
        id: true,
      },
    });

    if (!po) {
      return null;
    }

    return prisma.$transaction(async (tx) => {
      let totalAmount: number | undefined;

      if (data.items !== undefined) {
        totalAmount = data.items.reduce(
          (total, item) => total + item.quantity * item.unit_price,
          0,
        );

        for (const item of data.items) {
          await tx.purchaseOrderItem.updateMany({
            where: {
              purchase_order_id: po.id,
              tenant_id: data.tenant_id,
              line_no: item.line_no,
            },
            data: {
              description: item.description,
              quantity: item.quantity,
              unit_of_measure: item.unit_of_measure,
              unit_price: item.unit_price,
              total_price: item.quantity * item.unit_price,
            },
          });
        }
      }

      return tx.purchaseOrder.update({
        where: {
          id: po.id,
        },
        data: {
          ...(data.expected_delivery_date !== undefined && {
            expected_delivery_date: data.expected_delivery_date,
          }),

          ...(data.currency_code !== undefined && {
            currency_code: data.currency_code,
          }),

          ...(totalAmount !== undefined && {
            total_amount: totalAmount,
          }),
        },
        include: {
          items: true,
        },
      });
    });
  }

  async orderPurchaseOrder(data: OrderPurchaseOrderRepositoryContext) {
    const result = await prisma.purchaseOrder.updateMany({
      where: {
        id: data.po_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
        status: "ISSUED",
      },
      data: {
        status: "ORDERED",
      },
    });

    if (result.count !== 1) {
      return null;
    }

    return this.getPO({
      po_id: data.po_id,
      tenant_id: data.tenant_id,
      company_id: data.company_id,
    });
  }

  async issuePurchaseOrder(data: OrderPurchaseOrderRepositoryContext) {
    const result = await prisma.purchaseOrder.updateMany({
      where: {
        id: data.po_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
        status: "DRAFT",
      },
      data: {
        status: "ISSUED",
      },
    });

    if (result.count !== 1) {
      return null;
    }

    return this.getPO(data);
  }

  async completePurchaseOrder(data: OrderPurchaseOrderRepositoryContext) {
    const result = await prisma.purchaseOrder.updateMany({
      where: {
        id: data.po_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
        status: "ORDERED",
      },
      data: {
        status: "COMPLETED",
      },
    });

    if (result.count !== 1) {
      return null;
    }

    return this.getPO(data);
  }

  // Delete

  async deleteRfq(data: RFQContext) {
    const rfq = await prisma.rFQ.findFirst({
      where: {
        id: data.rfq_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!rfq || rfq.status !== RFQStatus.DRAFT) {
      return null;
    }

    return prisma.rFQ.update({
      where: {
        id: rfq.id,
      },
      data: {
        status: RFQStatus.CANCELLED,
      },
    });
  }

  async deletePo(data: POContext) {
    const po = await prisma.purchaseOrder.findFirst({
      where: {
        id: data.po_id,
        tenant_id: data.tenant_id,
        company_id: data.company_id,
      },
      select: {
        id: true,
      },
    });

    if (!po) {
      return null;
    }

    return prisma.purchaseOrder.update({
      where: {
        id: po.id,
      },
      data: {
        status: "CANCELLED",
      },
    });
  }
}
