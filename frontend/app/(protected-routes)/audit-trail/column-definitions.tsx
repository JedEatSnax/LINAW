"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { type DataTableFeatures } from "@/types/data-table-features";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/data-table-column-header";

export type AuditTrailHash = {
  hash_algorithm: string;
  hash_value: string;
};

export type AuditTrailBlockchainRef = {
  blockchain_transaction_hash: string;
  block_number: string | null;
  anchored_at: string | Date;
};

export type AuditTrail = {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  result: "SUCCESS" | "FAILED" | null;
  created_at: string | Date;
  actor_user_id: string | null;
  hash: AuditTrailHash | null;
  blockchain_ref: AuditTrailBlockchainRef | null;
};

const columnHelper = createColumnHelper<DataTableFeatures, AuditTrail>();

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

  columnHelper.accessor("id", {
    meta: {
      isSearchable: true,
      searchPlaceholder: "Search audit ID...",
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Audit ID" />
    ),
  }),

  columnHelper.accessor("entity_id", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Entity ID" />
    ),
  }),

  columnHelper.accessor("action", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Action" />
    ),
  }),

  columnHelper.accessor("result", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Result" />
    ),
    cell: ({ row }) => {
      const result = row.getValue("result") as AuditTrail["result"];

      if (!result) {
        return <span className="text-muted-foreground">PENDING</span>;
      }

      return (
        <span
          className={
            result === "SUCCESS"
              ? "text-green-600 font-medium"
              : "text-destructive font-medium"
          }
        >
          {result}
        </span>
      );
    },
  }),

  columnHelper.accessor("blockchain_ref", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Blockchain Block" />
    ),
    cell: ({ row }) => {
      const ref = row.original.blockchain_ref;
      return ref?.block_number ? (
        `#${ref.block_number}`
      ) : (
        <span className="text-muted-foreground">Unanchored</span>
      );
    },
  }),

  columnHelper.accessor("created_at", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Timestamp" />
    ),
    cell: ({ row }) => {
      const rawDate = row.getValue("created_at") as string | Date;
      if (!rawDate) return "-";

      return new Date(rawDate).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      });
    },
  }),
]);
