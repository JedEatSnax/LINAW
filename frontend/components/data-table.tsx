"use client";

import * as React from "react";
import {
  useTable,
  type RowData,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableViewOptions } from "./data-table-view-options";
import { features, type DataTableFeatures } from "@/types/data-table-features";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  toolbarActions?: React.ReactNode;
  density?: "default" | "comfortable";
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Filter...",
  toolbarActions,
  density = "default",
}: Readonly<DataTableProps<TData>>) {
  const comfortableColumnWidths: Record<string, string> = {
    id: "min-w-[7rem]",
    request: "min-w-[14rem]",
    requester: "min-w-[11rem]",
    approvalLevel: "min-w-[6rem]",
    price: "min-w-[9rem]",
    date: "min-w-[9rem]",
    status: "min-w-[8rem]",
    actions: "w-12",
  };

  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  const table = useTable({
    features,
    data,
    columns,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnVisibility,
      columnFilters,
    },
  });

  return (
    <div>
      <div
        className={
          density === "comfortable"
            ? "flex flex-wrap items-center gap-3 px-5 py-5 sm:px-6"
            : "flex items-center py-4"
        }
      >
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className={density === "comfortable" ? "w-full sm:max-w-sm" : "max-w-sm"}
          />
        )}

        <div className="ml-auto flex items-center gap-2">
          <DataTableViewOptions table={table} />
          {toolbarActions}
        </div>
      </div>

      <div className={density === "comfortable" ? "px-5 sm:px-6" : undefined}>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className={
                          density === "comfortable"
                            ? `h-12 px-4 ${comfortableColumnWidths[header.column.id] ?? ""}`
                            : undefined
                        }
                      >
                        {header.isPlaceholder ? null : (
                          <table.FlexRender header={header} />
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          density === "comfortable"
                            ? `px-4 py-3.5 ${comfortableColumnWidths[cell.column.id] ?? ""}`
                            : undefined
                        }
                      >
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className={density === "comfortable" ? "h-28 px-4 text-center" : "h-24 text-center"}
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className={density === "comfortable" ? "px-5 sm:px-6" : undefined}>
        <DataTablePagination table={table} density={density} />
      </div>
    </div>
  );
}