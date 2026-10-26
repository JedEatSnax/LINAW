import { prisma } from "../../config/database.js";
import { Prisma } from "../../generated/prisma/client.js";

export type PurchaseOrderSnapshot = {
  purchase_order_id: string;
  po_number: string;

  company: {
    id: string;
    name: string;
  };

  supplier: {
    id: string;
    name: string;
  };

  currency_code: string;
  final_amount: number;
  order_date: Date;

  items: {
    description: string;
    quantity: number;
    price: number;
    total_price: number;
  }[];

  approvals: {
    approved_by: {
      id: string;
      name: string;
    };
    action: string;
    timestamp: Date;
  }[];

  receipt: {
    receipt_number: string;
    receipt_date: Date;
    received_by: string;
  } | null;
};

type audit_trail_input = {
  tenant_id: string;
  actor_user_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  result: string | null;
  snapshot_json: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
};

export type audit_hashes_input = {
  tenant_id: string;
  audit_trail_id: string;
  hash_algorithm: string;
  hash_value: string;
};

export type audit_trail_blockchain_refs_input = {
  tenant_id: string;
  audit_trail_id: string;
  network_ref?: string | null;
  blockchain_transaction_hash: string;
  block_number: number;
  anchored_at: Date;
};

export type ListAuditsInput = {
  tenantId: string;
  companyId: string;
  entityType?: string;
  action?: string;
  result?: string;
  skip: number;
  take: number;
};

export class AuditTrailRepository {
  async listAudits(input: ListAuditsInput) {
    const [purchaseOrders, rfqs, quotations] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { tenant_id: input.tenantId, company_id: input.companyId },
        select: { id: true },
      }),
      prisma.rFQ.findMany({
        where: { tenant_id: input.tenantId, company_id: input.companyId },
        select: { id: true },
      }),
      prisma.supplierQuotation.findMany({
        where: { tenant_id: input.tenantId, company_id: input.companyId },
        select: { id: true },
      }),
    ]);

    const entityScopes = [
      ...(input.entityType === undefined ||
      input.entityType === "PURCHASE_ORDER"
        ? [
            {
              entity_type: "PURCHASE_ORDER",
              entity_id: { in: purchaseOrders.map((record) => record.id) },
            },
          ]
        : []),
      ...(input.entityType === undefined || input.entityType === "RFQ"
        ? [
            {
              entity_type: "RFQ",
              entity_id: { in: rfqs.map((record) => record.id) },
            },
          ]
        : []),
      ...(input.entityType === undefined ||
      input.entityType === "SUPPLIER_QUOTATION"
        ? [
            {
              entity_type: "SUPPLIER_QUOTATION",
              entity_id: { in: quotations.map((record) => record.id) },
            },
          ]
        : []),
    ];

    if (entityScopes.length === 0) {
      return {
        records: [],
        total: 0,
      };
    }

    const where = {
      tenant_id: input.tenantId,
      OR: entityScopes,
      ...(input.entityType ? { entity_type: input.entityType } : {}),
      ...(input.action ? { action: input.action } : {}),
      ...(input.result ? { result: input.result } : {}),
    };

    const [records, total] = await Promise.all([
      prisma.auditTrail.findMany({
        where,
        select: {
          id: true,
          entity_type: true,
          entity_id: true,
          action: true,
          result: true,
          created_at: true,
          actor_user_id: true,
          hash: {
            select: {
              hash_algorithm: true,
              hash_value: true,
            },
          },
          blockchain_ref: {
            select: {
              blockchain_transaction_hash: true,
              block_number: true,
              anchored_at: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: input.skip,
        take: input.take,
      }),
      prisma.auditTrail.count({ where }),
    ]);

    return { records, total };
  }

  async findAuditByid(auditId: string, tenantId: string, companyId: string) {
    const audit = await prisma.auditTrail.findFirst({
      where: {
        id: auditId,
        tenant_id: tenantId,
      },
    });

    if (!audit) {
      return null;
    }

    const entity =
      audit.entity_type === "PURCHASE_ORDER"
        ? await prisma.purchaseOrder.findFirst({
            where: {
              id: audit.entity_id,
              tenant_id: tenantId,
              company_id: companyId,
            },
            select: { id: true },
          })
        : audit.entity_type === "RFQ"
          ? await prisma.rFQ.findFirst({
              where: {
                id: audit.entity_id,
                tenant_id: tenantId,
                company_id: companyId,
              },
              select: { id: true },
            })
          : audit.entity_type === "SUPPLIER_QUOTATION"
            ? await prisma.supplierQuotation.findFirst({
                where: {
                  id: audit.entity_id,
                  tenant_id: tenantId,
                  company_id: companyId,
                },
                select: { id: true },
              })
            : null;

    return entity ? audit : null;
  }

  async findAuditByEvent(
    tenantId: string,
    entityType: string,
    entityId: string,
    action: string,
  ) {
    return prisma.auditTrail.findFirst({
      where: {
        tenant_id: tenantId,
        entity_type: entityType,
        entity_id: entityId,
        action,
      },
      select: {
        id: true,
        result: true,
        snapshot_json: true,
        hash: true,
        blockchain_ref: true,
      },
    });
  }
  async findById(userId: string) {
    return prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
  }

  async getPurchaseOrderSnapshot(
    purchaseOrderId: string,
  ): Promise<PurchaseOrderSnapshot | null> {
    const po = await prisma.purchaseOrder.findUnique({
      where: {
        id: purchaseOrderId,
      },
      include: {
        company: true,
        supplier: {
          include: {
            company: true,
          },
        },
        items: true,
        goods_receipts: {
          include: {
            received_by_user: true,
          },
        },
      },
    });

    if (po === null) {
      return null;
    }

    const approvalRequest = await prisma.approvalRequest.findFirst({
      where: {
        entity_id: po.id,
        entity_type: "PURCHASE_ORDER",
      },
      include: {
        actions: {
          include: {
            acted_by_user: true,
          },
        },
      },
    });

    const items = po.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      price: Number(item.unit_price),
      total_price: Number(item.total_price),
    }));

    const approvals =
      approvalRequest?.actions.map((action) => ({
        approved_by: {
          id: action.acted_by_user.id,
          name: action.acted_by_user.last_name,
        },
        action: action.action,
        timestamp: action.acted_at,
      })) ?? [];

    return {
      purchase_order_id: po.id,
      po_number: po.po_number,

      company: {
        id: po.company.id,
        name: po.company.display_name,
      },

      supplier: {
        id: po.supplier.id,
        name: po.supplier.company.display_name,
      },

      currency_code: po.currency_code,
      final_amount: Number(po.total_amount),
      order_date: po.order_date,

      items,
      approvals,

      receipt: po.goods_receipts[0]
        ? {
            receipt_number: po.goods_receipts[0].receipt_number,
            receipt_date: po.goods_receipts[0].receipt_date,
            received_by: po.goods_receipts[0].received_by_user.id,
          }
        : null,
    };
  }

  async findAuditForVerification(
    audit_id: string,
    tenantId: string,
    companyId: string,
  ) {
    const audit = await prisma.auditTrail.findFirst({
      where: {
        id: audit_id,
        tenant_id: tenantId,
        entity_type: "PURCHASE_ORDER",
      },
      select: {
        id: true,
        entity_id: true,
        result: true,
        snapshot_json: true,
        hash: true,
        blockchain_ref: true,
      },
    });

    if (!audit) {
      return null;
    }

    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        id: audit.entity_id,
        tenant_id: tenantId,
        company_id: companyId,
      },
      select: { id: true },
    });

    return purchaseOrder ? audit : null;
  }

  async createAuditTrail(data: audit_trail_input) {
    return prisma.auditTrail.create({
      data,
      select: {
        id: true,
        result: true,
        snapshot_json: true,
        hash: true,
        blockchain_ref: true,
      },
    });
  }

  async updateAuditTrail(audit_id: string, result: string | null) {
    return prisma.auditTrail.update({
      where: {
        id: audit_id,
      },
      data: {
        result,
      },
    });
  }

  async createAuditHash(data: audit_hashes_input) {
    return prisma.auditTrailHash.upsert({
      where: {
        audit_trail_id: data.audit_trail_id,
      },
      create: data,
      update: {},
    });
  }

  async createAuditTrailBlockchainRefs(
    data: audit_trail_blockchain_refs_input,
  ) {
    return prisma.auditTrailBlockchainRef.create({
      data,
    });
  }
}
