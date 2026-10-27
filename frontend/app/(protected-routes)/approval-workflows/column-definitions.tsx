"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { type DataTableFeatures } from "@/types/data-table-features";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ApprovalWorkflow = {
  id: string;
  request: string;
  requester: string;
  approvalLevel: number;
  price: number | null;
  currencyCode?: string;
  date: string | number | Date;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
};

const columnHelper = createColumnHelper<DataTableFeatures, ApprovalWorkflow>();

export function createColumns(actions: {
  onView: (workflow: ApprovalWorkflow) => void;
  onApprove: (workflow: ApprovalWorkflow) => void;
  onReject: (workflow: ApprovalWorkflow) => void;
}) {
  return columnHelper.columns([
    columnHelper.accessor("id", {
      header: "ID",
      cell: ({ row }) => (
        <span
          className="block max-w-40 truncate font-mono text-xs"
          title={row.original.id}
        >
          {row.original.id}
        </span>
      ),
    }),

    columnHelper.accessor("request", {
      meta: {
        isSearchable: true,
        searchPlaceholder: "Filter requests...",
      },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Request" />
      ),
    }),

    columnHelper.accessor("requester", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Requester" />
      ),
    }),

    columnHelper.accessor("approvalLevel", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Level" />
      ),
      cell: ({ row }) => (
        <div className="text-center font-medium tabular-nums">
          L{row.getValue("approvalLevel")}
        </div>
      ),
    }),

    columnHelper.accessor("price", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => {
        const price = row.original.price;
        if (price === null || !row.original.currencyCode) {
          return <span className="text-muted-foreground">Unavailable</span>;
        }

        return (
          <span className="tabular-nums">
            {new Intl.NumberFormat("en-PH", {
              style: "currency",
              currency: row.original.currencyCode,
            }).format(price)}
          </span>
        );
      },
    }),

    columnHelper.accessor("date", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => {
        const rawDate = row.original.date;

        return (
          <span className="tabular-nums">
            {new Date(rawDate).toLocaleDateString("en-PH", {
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
        const status = row.getValue("status") as ApprovalWorkflow["status"];
        return <span className="font-medium">{status}</span>;
      },
    }),

    columnHelper.display({
      id: "actions",
      cell: ({ row }) => {
        const workflow = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => actions.onView(workflow)}>
                  View details
                </DropdownMenuItem>
                {workflow.status === "Pending" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => actions.onApprove(workflow)}
                    >
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => actions.onReject(workflow)}
                    >
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
  ]);
}
