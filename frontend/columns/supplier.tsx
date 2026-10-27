"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { type DataTableFeatures } from "../types/data-table-features";

export type Supplier = {
  supplier_id: string;
  supplier_code?: string | null;
  legal_name?: string | null;
  display_name?: string | null;
  contact_email?: string | null;
  relationship_status?: string | null;
  created_at?: string | null;
};

const columnHelper = createColumnHelper<DataTableFeatures, Supplier>();

export const supplierColumns = columnHelper.columns([
  columnHelper.accessor("supplier_id", { header: "Supplier ID" }),
  columnHelper.accessor("display_name", { header: "Supplier" }),
  columnHelper.accessor("contact_email", { header: "Contact" }),
  columnHelper.accessor("relationship_status", { header: "Relationship" }),
  columnHelper.accessor("created_at", { header: "Established" }),
]);
