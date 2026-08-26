"use client"

import { createColumnHelper } from "@tanstack/react-table"
import type { License } from "@/types/api"
import { type DataTableFeatures } from "@/components/data-table-features"

const columnHelper = createColumnHelper<DataTableFeatures, License>()
export const columns = [
  columnHelper.accessor("id", {
    header: "ID",
  }),

  columnHelper.accessor("name", {
    header: "Name",
  }),

  columnHelper.accessor("product_key", {
    header: "Product Key",
  }),

  columnHelper.accessor("expiration_date", {
    header: "Expiration Date",
    cell: ({ row }) => {
      const date = row.original.expiration_date

      return date ? new Date(date).toLocaleDateString() : "No expiration"
    },
  }),

  columnHelper.accessor("licensedToEmail", {
    header: "Licensed To",
    cell: ({ row }) => {
      return row.original.licensedTo?.name ?? row.original.licensedToEmail
    },
  }),
]
