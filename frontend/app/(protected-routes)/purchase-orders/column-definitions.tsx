"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { MoreHorizontal, Copy } from "lucide-react";
import { type DataTableFeatures } from "@/types/data-table-features";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type PurchaseOrderItem = {
  line_no: number;
  description: string;
  quantity: number;
  unit_of_measure: string;
  unit_price: number;
};

export type PurchaseOrder = {
  id: string;
  po_number: string;
  issuer: string;
  expected_delivery_date: string | number | Date;
  currency_code: string;
  total: number;
  status: "DRAFT" | "ISSUED" | "ORDERED" | "CANCELLED" | "COMPLETED";
  items?: PurchaseOrderItem[];
};

const columnHelper = createColumnHelper<DataTableFeatures, PurchaseOrder>();

export const columns = columnHelper.columns([
  columnHelper.display({
    id: "select",
    header: ({ table }) => {
      const allSelected = table.getIsAllPageRowsSelected();
      const someSelected = table.getIsSomePageRowsSelected() && !allSelected;

      return (
        <Checkbox
          checked={allSelected}
          aria-checked={someSelected ? "mixed" : allSelected}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5"
        />
      );
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }),

  columnHelper.accessor("po_number", {
    meta: {
      isSearchable: true,
      searchPlaceholder: "Search PO number...",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PO Number" />
    ),
  }),

  columnHelper.accessor("issuer", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Issuer" />
    ),
  }),

  columnHelper.accessor("expected_delivery_date", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Delivery Date" />
    ),
    cell: ({ row }) => {
      const rawDate = row.original.expected_delivery_date;
      if (!rawDate) return "-";

      return new Date(rawDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  }),

  columnHelper.accessor("total", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Amount" />
    ),
    cell: ({ row }) => {
      const total = Number.parseFloat(row.getValue("total"));
      const currency = row.original.currency_code || "USD";

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(total);
    },
  }),

  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as PurchaseOrder["status"];
      return <span className="font-medium">{status}</span>;
    },
  }),

  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const po = row.original;

      // Business rules mapped from API contract
      const canUpdate = po.status === "ISSUED";
      const canOrder = po.status === "ISSUED";
      const canCancel = !["ORDERED", "COMPLETED", "CANCELLED"].includes(
        po.status,
      );

      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" className="h-8 w-8 p-0" />}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(po.id)}
              >
                <Copy className="h-4 w-4" />
                PO ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(po.po_number)}
              >
                <Copy className="h-4 w-4" />
                PO Number
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem disabled={!canOrder}>
                Mark Ordered
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canUpdate}>Update</DropdownMenuItem>
              <DropdownMenuItem disabled={!canCancel}>Cancel</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);
