"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { MoreHorizontal, Copy } from "lucide-react";
import { type DataTableFeatures } from "@/types/data-table-features";
import { Button } from "@/components/ui/button";
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

export type UserManagement = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string | null;
  status: string;
  company_name: string | null;
};

const columnHelper = createColumnHelper<DataTableFeatures, UserManagement>();

export const userColumns = columnHelper.columns([
  columnHelper.accessor("first_name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="First Name" />
    ),
  }),

  columnHelper.accessor("last_name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Name" />
    ),
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

  columnHelper.accessor("job_title", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Job Title" />
    ),
    cell: ({ row }) =>
      row.getValue("job_title") ?? (
        <span className="text-muted-foreground">-</span>
      ),
  }),

  columnHelper.accessor("company_name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    cell: ({ row }) =>
      row.getValue("company_name") ?? (
        <span className="text-muted-foreground">-</span>
      ),
  }),

  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      // The authentication middleware requires the user status to be ACTIVE.
      return <span>{status}</span>;
    },
  }),

  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const profile = row.original;

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
                onClick={() => navigator.clipboard.writeText(profile.user_id)}
              >
                <Copy className="h-4 w-4" />
                User ID
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              {/* Profile updates are handled via PATCH /api/userManagementRouter/profile */}
              <DropdownMenuItem>Update Profile</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);
