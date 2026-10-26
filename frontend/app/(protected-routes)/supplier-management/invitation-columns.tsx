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

export type SupplierInvitation = {
  invitation_id: string;
  email: string;
  invitation_status: "DRAFT" | "SENDING" | "PENDING" | "ACCEPTED";
  expires_at: string | Date | null;
  accepted_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

const columnHelper = createColumnHelper<
  DataTableFeatures,
  SupplierInvitation
>();

export const invitationColumns = columnHelper.columns([
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

  columnHelper.accessor("email", {
    meta: {
      isSearchable: true,
      searchPlaceholder: "Search email...",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email Address" />
    ),
  }),

  columnHelper.accessor("invitation_status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue(
        "invitation_status",
      ) as SupplierInvitation["invitation_status"];

      switch (status) {
        case "ACCEPTED":
          return <span className="font-medium">ACCEPTED</span>;
        case "PENDING":
          return <span className="font-medium">PENDING</span>;
        case "DRAFT":
        case "SENDING":
          return (
            <span className="text-muted-foreground font-medium">{status}</span>
          );
        default:
          return status;
      }
    },
  }),

  columnHelper.accessor("created_at", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sent Date" />
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

  columnHelper.accessor("expires_at", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expiration" />
    ),
    cell: ({ row }) => {
      const rawDate = row.getValue("expires_at") as string | Date | null;
      if (!rawDate) return <span className="text-muted-foreground">-</span>;

      const expiryDate = new Date(rawDate);
      const isExpired = expiryDate < new Date();

      return (
        <span className={isExpired ? "text-destructive" : ""}>
          {expiryDate.toLocaleDateString("en-US", {
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
      const invitation = row.original;

      const isExpired = invitation.expires_at
        ? new Date(invitation.expires_at) < new Date()
        : false;
      const canResend =
        invitation.invitation_status === "DRAFT" ||
        (invitation.invitation_status === "PENDING" && isExpired);

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
                onClick={() =>
                  navigator.clipboard.writeText(invitation.invitation_id)
                }
              >
                <Copy className="h-4 w-4" />
                Invitation ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(invitation.email)}
              >
                <Copy className="h-4 w-4" />
                Email
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem disabled={!canResend}>
                Resend Invitation
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);
