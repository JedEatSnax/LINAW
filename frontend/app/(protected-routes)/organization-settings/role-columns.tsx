"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { MoreHorizontal, ShieldAlert, ShieldCheck, Copy } from "lucide-react";
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

export type OrganizationRole = {
  id: string;
  tenant_id: string | null;
  company_id: string | null;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

const columnHelper = createColumnHelper<DataTableFeatures, OrganizationRole>();

export const roleColumns = columnHelper.columns([
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

  columnHelper.accessor("name", {
    meta: {
      isSearchable: true,
      searchPlaceholder: "Search role name...",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  }),

  columnHelper.accessor("code", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role Code" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.getValue("code")}
      </span>
    ),
  }),

  columnHelper.accessor("description", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;
      return (
        <span className="truncate max-w-[250px] inline-block">
          {description || (
            <span className="text-muted-foreground italic">No description</span>
          )}
        </span>
      );
    },
  }),

  columnHelper.accessor("is_system", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const isSystem = row.getValue("is_system") as boolean;
      return isSystem ? (
        <div className="flex items-center text-blue-600 text-xs font-medium">
          <ShieldCheck className="mr-1 h-3.5 w-3.5" />
          System
        </div>
      ) : (
        <div className="flex items-center text-muted-foreground text-xs font-medium">
          <ShieldAlert className="mr-1 h-3.5 w-3.5" />
          Custom
        </div>
      );
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

  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const role = row.original;

      // System roles cannot be deleted or have permissions modified
      const isSystem = role.is_system;

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
                onClick={() => navigator.clipboard.writeText(role.id)}
              >
                <Copy className="h-4 w-4" />
                Role ID
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem disabled={isSystem}>
                Manage Permissions
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isSystem}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);
