"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { type DataTableFeatures } from "../types/data-table-features";

export type User = {
  id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
};

const columnHelper = createColumnHelper<DataTableFeatures, User>();

export const userColumns = columnHelper.columns([
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("tenant_id", { header: "Tenant ID" }),

  columnHelper.accessor("first_name", { header: "First Name" }),
  columnHelper.accessor("last_name", { header: "Last Name" }),
  columnHelper.accessor("email", { header: "Email" }),
  columnHelper.accessor("status", { header: "Status" }),
]);
