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

export type PurchaseRequisition = {
  requisition_id: string;
  requisition_number: string;
  requisition_status:
    | "DRAFT"
    | "SUBMITTED"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";
  total_estimated_amount: string | number;
  currency_code: string;
  created_at: string | Date;
  updated_at: string | Date;
};

const columnHelper = createColumnHelper<
  DataTableFeatures,
  PurchaseRequisition
>();

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

  columnHelper.accessor("requisition_number", {
    meta: {
      isSearchable: true,
      searchPlaceholder: "Search PR number...",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PR Number" />
    ),
  }),

  columnHelper.accessor("total_estimated_amount", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Estimated Total" />
    ),
    cell: ({ row }) => {
      const amount = Number.parseFloat(
        row.getValue("total_estimated_amount") as string,
      );
      const currency = row.original.currency_code || "USD";

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(amount);
    },
  }),

  columnHelper.accessor("created_at", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
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

  columnHelper.accessor("requisition_status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue(
        "requisition_status",
      ) as PurchaseRequisition["requisition_status"];
      return <span className="font-medium">{status}</span>;
    },
  }),

  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const pr = row.original;

      // Strict business rules based on the API contract.
      const canSubmitOrUpdate = pr.requisition_status === "DRAFT";
      const canCancel =
        pr.requisition_status === "DRAFT" ||
        pr.requisition_status === "SUBMITTED";
      const canResubmit = pr.requisition_status === "REJECTED";

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
                onClick={() => navigator.clipboard.writeText(pr.requisition_id)}
              >
                <Copy className="h-4 w-4" />
                Requisition ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(pr.requisition_number)
                }
              >
                <Copy className="h-4 w-4" />
                PR Number
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem disabled={!canSubmitOrUpdate}>
                Submit
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canSubmitOrUpdate}>
                Update
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canResubmit}>
                Resubmit
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canCancel}>Cancel</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);
