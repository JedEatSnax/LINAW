"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { type DataTableFeatures } from "../types/data-table-features";

export type RFQ = {
  id: string;
  tenant_id: string;
  company_id: string;
  created_by_user_id: string;
  rfq_number: string;
  title: string;
  status: string;
  issue_date: string | Date | null;
  closing_date: string | Date | null;
};

const columnHelper = createColumnHelper<DataTableFeatures, RFQ>();

export const rfqColumns = columnHelper.columns([
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("tenant_id", { header: "Tenant ID" }),
  columnHelper.accessor("company_id", { header: "Company ID" }),
  columnHelper.accessor("created_by_user_id", { header: "Creator ID" }),

  columnHelper.accessor("rfq_number", {
    header: "RFQ Number",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("rfq_number")}</div>
    ),
  }),
  columnHelper.accessor("title", { header: "Title" }),
  columnHelper.accessor("status", { header: "Status" }),
  columnHelper.accessor("issue_date", {
    header: "Issue Date",
    cell: ({ row }) => {
      const value = row.getValue("issue_date");
      return value
        ? new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(new Date(value as string | Date))
        : "—";
    },
  }),
  columnHelper.accessor("closing_date", {
    header: "Closing Date",
    cell: ({ row }) => {
      const value = row.getValue("closing_date");
      return value
        ? new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(new Date(value as string | Date))
        : "—";
    },
  }),
]);
