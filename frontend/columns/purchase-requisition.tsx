"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { type DataTableFeatures } from "../types/data-table-features";
import { formatCurrency } from "../lib/currencies";

export type PurchaseRequisition = {
  id: string;
  tenant_id: string;
  company_id: string;
  requested_by_user_id: string;
  root_id: string;
  pr_number: string;
  purpose: string | null;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" | null;
  currency_code: string;
  total_amount: number | string;
  submitted_at: string | Date | null;
};

const columnHelper = createColumnHelper<
  DataTableFeatures,
  PurchaseRequisition
>();

export const prColumns = columnHelper.columns([
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("tenant_id", { header: "Tenant ID" }),
  columnHelper.accessor("company_id", { header: "Company ID" }),
  columnHelper.accessor("requested_by_user_id", { header: "Requester ID" }),
  columnHelper.accessor("root_id", { header: "Root ID" }),

  columnHelper.accessor("pr_number", {
    header: "PR Number",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("pr_number")}</div>
    ),
  }),
  columnHelper.accessor("purpose", { header: "Purpose" }),
  columnHelper.accessor("status", { header: "Status" }),
  columnHelper.accessor("priority", { header: "Priority" }),
  columnHelper.accessor("total_amount", {
    header: () => <div className="text-right">Total Amount</div>,
    cell: ({ row }) => {
      const amount = Number(row.getValue("total_amount"));
      const formatted = formatCurrency(amount, row.original.currency_code);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  }),
  columnHelper.accessor("submitted_at", {
    header: "Submitted",
    cell: ({ row }) => {
      const value = row.getValue("submitted_at");
      if (!value) return "—";
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(value as string | Date));
    },
  }),
]);
