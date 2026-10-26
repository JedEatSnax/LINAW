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

export type ApprovalWorkflows = {
  id: string;
  tenant_id: string;
  company_id: string;
  entity_type: string;
  entity_id: string;
  requester_user_id: string;
  current_level: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  submitted_at: string | Date;
  resolved_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
  requester_user: {
    first_name: string;
    last_name: string;
  };
  purchase_requisition: {
    pr_number: string;
    purpose: string;
    currency_code: string;
    total_amount: string | number;
  };
};

const columnHelper = createColumnHelper<DataTableFeatures, ApprovalWorkflows>();

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

  columnHelper.accessor("purchase_requisition.pr_number", {
    meta: {
      isSearchable: true,
      searchPlaceholder: "Search PR number...",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PR Number" />
    ),
  }),

  columnHelper.accessor("purchase_requisition.purpose", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Purpose" />
    ),
  }),

  columnHelper.accessor("requester_user", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Requester" />
    ),
    cell: ({ row }) => {
      const user = row.getValue(
        "requester_user",
      ) as ApprovalWorkflows["requester_user"];
      return `${user.first_name} ${user.last_name}`;
    },
  }),

  columnHelper.accessor("current_level", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Level" />
    ),
    cell: ({ row }) => (
      <div className="text-center font-medium">
        L{row.getValue("current_level")}
      </div>
    ),
  }),

  columnHelper.accessor("purchase_requisition.total_amount", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total Amount" />
    ),
    cell: ({ row }) => {
      const req = row.original.purchase_requisition;
      const amount = Number.parseFloat(req.total_amount as string);

      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: req.currency_code,
      }).format(amount);
    },
  }),

  columnHelper.accessor("submitted_at", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Submitted" />
    ),
    cell: ({ row }) => {
      const rawDate = row.getValue("submitted_at") as string | Date;
      if (!rawDate) return "-";

      return new Date(rawDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  }),

  columnHelper.accessor("status", {
    meta: {
      isSearchable: true,
      searchPlaceholder: "Search PR number...",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as ApprovalWorkflows["status"];
      return <span className="font-medium">{status}</span>;
    },
  }),

  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const request = row.original;

      // Approval decisions require the request to be PENDING.
      const isPending = request.status === "PENDING";

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
                onClick={() => navigator.clipboard.writeText(request.id)}
              >
                <Copy className="h-4 w-4" />
                Request ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(
                    request.purchase_requisition.pr_number,
                  )
                }
              >
                <Copy className="h-4 w-4" />
                PR Number
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem disabled={!isPending}>Approve</DropdownMenuItem>
              <DropdownMenuItem disabled={!isPending}>Reject</DropdownMenuItem>
              <DropdownMenuItem disabled={!isPending}>Cancel</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);
