"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { type DataTableFeatures } from "../types/data-table-features";

export type GoodsReceipt = {
  id: string;
  tenant_id: string;
  company_id: string;
  purchase_order_id: string;
  supplier_id: string;
  receipt_number: string;
  status: string;
  receipt_date: string | Date;
};

const columnHelper = createColumnHelper<DataTableFeatures, GoodsReceipt>();

export const goodsReceiptColumns = columnHelper.columns([
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("tenant_id", { header: "Tenant ID" }),
  columnHelper.accessor("company_id", { header: "Company ID" }),
  columnHelper.accessor("purchase_order_id", { header: "PO ID" }),
  columnHelper.accessor("supplier_id", { header: "Supplier ID" }),

  columnHelper.accessor("receipt_number", {
    header: "Receipt Number",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("receipt_number")}</div>
    ),
  }),
  columnHelper.accessor("status", { header: "Status" }),
  columnHelper.accessor("receipt_date", {
    header: "Receipt Date",
    cell: ({ row }) =>
      new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(row.getValue("receipt_date"))),
  }),
]);
