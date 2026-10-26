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

export type SupplierQuotationItem = {
  id: string;
  rfq_item_id: string;
  quoted_quantity: string | number;
  unit_price: string | number;
  lead_time_days: number | null;
  remarks: string | null;
};

export type SupplierQuotation = {
  id: string;
  rfq_id: string;
  status: "SUBMITTED" | "SELECTED" | string;
  currency_code: string;
  total_amount: string | number;
  valid_until: string | Date | null;
  created_at: string | Date;
  items: SupplierQuotationItem[];
};

const columnHelper = createColumnHelper<DataTableFeatures, SupplierQuotation>();

export const quotationColumns = columnHelper.columns([
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

  columnHelper.accessor("id", {
    meta: {
      isSearchable: true,
      searchPlaceholder: "Search quotation ID...",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Quotation ID" />
    ),
    cell: ({ row }) => {
      const id = row.getValue("id") as string;
      return <span className="font-mono text-xs">{id.split("-")[0]}...</span>;
    },
  }),

  columnHelper.accessor("rfq_id", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ref. RFQ ID" />
    ),
    cell: ({ row }) => {
      const rfqId = row.getValue("rfq_id") as string;
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {rfqId.split("-")[0]}...
        </span>
      );
    },
  }),

  columnHelper.accessor("total_amount", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Amount" />
    ),
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("total_amount") as string);
      const currency = row.original.currency_code || "USD";

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(amount);
    },
  }),

  columnHelper.accessor("items", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Items" />
    ),
    cell: ({ row }) => {
      const items = row.original.items;
      return <span className="font-medium">{items?.length || 0} line(s)</span>;
    },
  }),

  columnHelper.accessor("created_at", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Submitted On" />
    ),
    cell: ({ row }) => {
      const rawDate = row.getValue("created_at") as string | Date;
      if (!rawDate) return "-";

      return new Date(rawDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  }),

  columnHelper.accessor("valid_until", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Valid Until" />
    ),
    cell: ({ row }) => {
      const rawDate = row.getValue("valid_until") as string | Date | null;
      if (!rawDate) return <span className="text-muted-foreground">-</span>;

      const validDate = new Date(rawDate);
      const isExpired = validDate < new Date();

      return (
        <span
          className={isExpired ? "text-destructive font-medium" : "font-medium"}
        >
          {validDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      );
    },
  }),

  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <span>{status}</span>;
    },
  }),

  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const quotation = row.original;

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
                onClick={() => navigator.clipboard.writeText(quotation.id)}
              >
                <Copy className="h-4 w-4" />
                Quotation ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(quotation.rfq_id)}
              >
                <Copy className="h-4 w-4" />
                RFQ ID
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>View</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);
