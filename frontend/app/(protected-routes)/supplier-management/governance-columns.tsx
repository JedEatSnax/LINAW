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

export type SupplierRelationship = {
  relationship_id: string;
  relationship_status: "ACTIVE" | "INACTIVE" | string; // should be changed to either string or a "STATUS"
};

export type GovernanceSupplier = {
  supplier_id: string;
  supplier_code: string;
  company_id: string;
  legal_name: string;
  display_name: string;
  tax_id: string | null;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  supplier_status: string;
  relationship_status: "ACTIVE" | "INACTIVE" | string; // should be changed to either string or a "STATUS"
  relationship: SupplierRelationship;
  created_at: string | Date;
  updated_at: string | Date;
};

const columnHelper = createColumnHelper<
  DataTableFeatures,
  GovernanceSupplier
>();

export const governanceColumns = columnHelper.columns([
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

  columnHelper.accessor("supplier_code", {
    meta: {
      isSearchable: true,
      searchPlaceholder: "Search code...",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Supplier Code" />
    ),
  }),

  columnHelper.accessor("legal_name", {
    meta: {
      isSearchable: true,
      searchPlaceholder: "Search name...",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Legal Name" />
    ),
  }),

  columnHelper.accessor("contact_email", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Contact Email" />
    ),
  }),

  columnHelper.accessor("created_at", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Onboarded" />
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

  columnHelper.accessor("relationship_status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Relationship" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("relationship_status") as string;
      return (
        <span
          className={
            status === "ACTIVE" ? "font-medium" : "text-muted-foreground"
          }
        >
          {status}
        </span>
      );
    },
  }),

  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const supplier = row.original;
      const isRelationshipActive = supplier.relationship_status === "ACTIVE";

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
                  navigator.clipboard.writeText(supplier.supplier_id)
                }
              >
                <Copy className="h-4 w-4" />
                Supplier ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(supplier.contact_email)
                }
              >
                <Copy className="h-4 w-4" />
                Email
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={!isRelationshipActive}
                className="text-destructive"
              >
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }),
]);
