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

export type SupplierPortalRFQItem = {
  id: string;
  line_no: number;
  description: string;
  quantity: string | number;
  unit_of_measure: string;
  specification: string | null;
};

export type SupplierPortalRFQ = {
  id: string;
  rfq_number: string;
  title: string;
  description: string | null;
  status: "PUBLISHED";
  issue_date: string | Date | null;
  closing_date: string | Date | null;
  items: SupplierPortalRFQItem[];
};

const columnHelper = createColumnHelper<DataTableFeatures, SupplierPortalRFQ>();

export const rfqColumns = columnHelper.columns([
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

  columnHelper.accessor("rfq_number", {
    meta: {
      isSearchable: true,
      searchPlaceholder: "Search RFQ number...",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="RFQ Number" />
    ),
  }),

  columnHelper.accessor("title", {
    meta: {
      isSearchable: true,
      searchPlaceholder: "Search title...",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
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

  columnHelper.accessor("issue_date", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Issued On" />
    ),
    cell: ({ row }) => {
      const rawDate = row.getValue("issue_date") as string | Date | null;
      if (!rawDate) return "-";

      return new Date(rawDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  }),

  columnHelper.accessor("closing_date", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Closing Date" />
    ),
    cell: ({ row }) => {
      const rawDate = row.getValue("closing_date") as string | Date | null;
      if (!rawDate) return <span className="text-muted-foreground">-</span>;

      const closingDate = new Date(rawDate);
      const isExpired = closingDate < new Date();

      return (
        <span
          className={isExpired ? "text-destructive font-medium" : "font-medium"}
        >
          {closingDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      );
    },
  }),

  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const rfq = row.original;

      const isClosed = rfq.closing_date
        ? new Date(rfq.closing_date) < new Date()
        : false;

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
                onClick={() => navigator.clipboard.writeText(rfq.id)}
              >
                <Copy className="h-4 w-4" />
                RFQ ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(rfq.rfq_number)}
              >
                <Copy className="h-4 w-4" />
                RFQ Number
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem disabled={isClosed}>Submit</DropdownMenuItem>
              <DropdownMenuItem>View</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);
