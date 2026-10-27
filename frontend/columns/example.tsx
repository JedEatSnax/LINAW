"use client";

import { createColumnHelper } from "@tanstack/react-table";

import { type DataTableFeatures } from "../types/data-table-features";

export type Payment = {
  id: string;
  productName: string;
  price: number;
  availability: "In Stock" | "Out of Stock" | "Limited";
};

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, Payment>();

export const columns = columnHelper.columns([
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("productName", {
    header: "Product Name",
  }),
  columnHelper.accessor("price", {
    header: "Price",
    cell: ({ row }) => {
      const price = Number.parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price);

      return formatted;
    },
  }),
  columnHelper.accessor("availability", {
    header: "Availability",
  }),
]);
