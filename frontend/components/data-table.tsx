"use client";

import * as React from "react";
import Papa from "papaparse";
import writeXlsxFile from "write-excel-file/browser";
import type { Row } from "write-excel-file/browser";
import {
  useTable,
  type RowData,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
} from "@tanstack/react-table";
import { Search, X, DownloadIcon, SearchX, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableViewOptions } from "./data-table-view-options";
import { features, type DataTableFeatures } from "@/types/data-table-features";

export type ExportFormat = "csv" | "xlsx" | "json";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  toolbarActions?: React.ReactNode;
  /** Pass the base backend API endpoint. If omitted, falls back to client-side parsing. */
  exportEndpoint?: string;
  /** Custom file name to override the default "export" prefix */
  exportFileName?: string;
  /** Force enable the export dropdown for client-side generation even without an endpoint */
  enableExport?: boolean;
}

// Helper to handle Blob downloading
const downloadBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export function DataTable<TData extends RowData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  toolbarActions,
  exportEndpoint,
  exportFileName = "export",
  enableExport = false,
}: Readonly<DataTableProps<TData>>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [isExporting, setIsExporting] = React.useState(false);

  const table = useTable({
    features,
    data,
    columns,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      columnVisibility,
      columnFilters,
      rowSelection,
    },
  });

  const searchValue = searchKey
    ? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? "")
    : "";

  // Helper to flatten nested objects for CSV/Excel export
  const flattenExportData = (
    obj: Record<string, unknown>,
    parentKey = "",
  ): Record<string, unknown> => {
    let result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;

      if (value === null || value === undefined) {
        result[newKey] = "";
      } else if (value instanceof Date) {
        result[newKey] = value.toISOString();
      } else if (Array.isArray(value)) {
        // Summarize arrays instead of creating infinite columns
        result[newKey] = value.length ? `[${value.length} items]` : "None";
      } else if (typeof value === "object") {
        // Recursively flatten nested objects (e.g., relationship.status)
        result = {
          ...result,
          ...flattenExportData(value as Record<string, unknown>, newKey),
        };
      } else {
        result[newKey] = value;
      }
    }

    return result;
  };

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      const dateStr = new Date().toISOString().split("T")[0];
      const fileName = `${exportFileName}-${dateStr}`;

      // Backend Route Handler Export
      if (exportEndpoint) {
        const res = await fetch(`${exportEndpoint}?format=${format}`);
        if (!res.ok) throw new Error(`Export failed with status ${res.status}`);

        const blob = await res.blob();
        downloadBlob(blob, `${fileName}.${format}`);
        return;
      }

      // Client-Side Fallback Export
      const rawData = table
        .getFilteredRowModel()
        .rows.map((row) => row.original);

      // Flatten the data for CSV and Excel (keep JSON nested)
      const flatExportData = rawData.map((row) =>
        flattenExportData(row as Record<string, unknown>),
      );

      if (format === "json") {
        const blob = new Blob([JSON.stringify(rawData, null, 2)], {
          type: "application/json",
        });
        downloadBlob(blob, `${fileName}.json`);
      } else if (format === "csv") {
        // Pass the flattened data here
        const csvString = Papa.unparse(flatExportData);
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, `${fileName}.csv`);
      } else if (format === "xlsx") {
        // Pass the flattened data here
        const headers: Row = Object.keys(flatExportData[0] || {}).map((key) => ({
          value: String(key),
          fontWeight: "bold" as const,
        }));

        const rows: Row[] = flatExportData.map((row) =>
          Object.values(row).map((val) => {
            if (typeof val === "number") {
              return { type: Number, value: val };
            }
            if (typeof val === "string") {
              return { type: String, value: val };
            }
            if (typeof val === "boolean") {
              return { type: String, value: String(val) };
            }
            return { type: String, value: "" };
          }),
        );

        const workbook = writeXlsxFile([headers, ...rows]);
        const blob = await workbook.toBlob();
        downloadBlob(blob, `${fileName}.xlsx`);
      }
    } catch (error) {
      console.error(`Failed to export ${format}:`, error);
    } finally {
      setIsExporting(false);
    }
  };

  const showExportMenu = Boolean(exportEndpoint) || enableExport;

  return (
    <div suppressHydrationWarning>
      <div className="flex items-center py-4">
        {searchKey && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="h-8 w-full pl-8 pr-8"
            />

            {searchValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => table.getColumn(searchKey)?.setFilterValue("")}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {showExportMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" disabled={isExporting}>
                    {isExporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <DownloadIcon className="mr-2 h-4 w-4" />
                    )}
                    Export
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("xlsx")}>
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DataTableViewOptions table={table} />
          {toolbarActions}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-[400px] text-center"
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    {searchValue ? (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50 mb-4">
                          <SearchX className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">
                          No results found
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                          We couldn't find anything matching "{searchValue}".{" "}
                          <br />
                          Try adjusting your search or filters.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() =>
                            table.getColumn(searchKey!)?.setFilterValue("")
                          }
                        >
                          Clear search
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50 mb-4">
                          <Inbox className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">
                          No data available
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                          There are no records to display here yet. <br />
                          Get started by creating a new one.
                        </p>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
