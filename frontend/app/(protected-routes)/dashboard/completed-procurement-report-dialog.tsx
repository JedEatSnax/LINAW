"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, Loader2, RefreshCwIcon } from "lucide-react";
import jsPDF from "jspdf";
import writeXlsxFile from "write-excel-file/browser";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getMonthlyCompletedProcurementReport,
  type CompletedProcurementReport,
} from "@/app/api/purchase-orders/report-client";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function money(value: string, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function reportRows(report: CompletedProcurementReport) {
  return [
    ["Completed Procurement Report"],
    ["Reporting month", report.period.month],
    ["Metric", report.metric_definition],
    [],
    ["Summary"],
    ["Currency", "Completed value", "Completed purchase orders"],
    ...report.summary.values_by_currency.map((item) => [
      item.currency_code,
      item.value,
      report.summary.completed_purchase_order_count,
    ]),
    [],
    ["Categories"],
    ["Category", "Currency", "Completed value", "Purchase orders"],
    ...report.categories.map((item) => [
      item.category,
      item.currency_code,
      item.value,
      item.purchase_order_count,
    ]),
    [],
    ["Requesters"],
    ["Requester", "Currency", "Completed value", "Purchase orders"],
    ...report.requesters.map((item) => [
      item.requester_name,
      item.currency_code,
      item.value,
      item.purchase_order_count,
    ]),
    [],
    ["Completed Purchase Orders"],
    ["PO number", "Completion date", "Supplier", "Requester", "Currency", "Value", "Status"],
    ...report.records.map((item) => [
      item.po_number,
      item.completion_date ?? "",
      item.supplier,
      item.requester,
      item.currency_code,
      item.total_amount,
      item.status,
    ]),
  ];
}

export function CompletedProcurementReportDialog({
  open,
  onOpenChange,
  onReportLoaded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportLoaded?: (report: CompletedProcurementReport) => void;
}) {
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState<CompletedProcurementReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedReport = await getMonthlyCompletedProcurementReport(month);
      setReport(loadedReport);
      onReportLoaded?.(loadedReport);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The report could not be loaded.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void loadReport();
  }, [open, month]);

  const exportReport = async (format: "csv" | "xlsx" | "pdf") => {
    if (!report) return;
    setExporting(true);
    try {
      const rows = reportRows(report);
      const filename = `completed-procurement-${report.period.month}`;
      if (format === "csv") {
        downloadBlob(
          new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }),
          `${filename}.csv`,
        );
      } else if (format === "xlsx") {
        const sheetRows = rows.map((row) => row.map((value) => ({ value: String(value ?? ""), type: String })));
        const workbook = writeXlsxFile(sheetRows);
        const blob = await workbook.toBlob();
        downloadBlob(blob, `${filename}.xlsx`);
      } else {
        const pdf = new jsPDF({ unit: "pt", format: "a4" });
        let y = 40;
        pdf.setFontSize(16);
        pdf.text("Completed Procurement Report", 40, y);
        y += 22;
        pdf.setFontSize(9);
        pdf.text(`Reporting month: ${report.period.month}`, 40, y);
        y += 15;
        const lines = rows.map((row) => row.join(" | ")).filter(Boolean);
        for (const line of lines) {
          const wrapped = pdf.splitTextToSize(line, 515);
          if (y + wrapped.length * 11 > 800) {
            pdf.addPage();
            y = 40;
          }
          pdf.text(wrapped, 40, y);
          y += wrapped.length * 11;
        }
        pdf.save(`${filename}.pdf`);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && (loading || exporting)) return;
      onOpenChange(nextOpen);
    }}>
      <DialogContent className="max-w-4xl overflow-hidden">
        <DialogHeader className="pr-10">
          <DialogTitle>Completed Procurement Report</DialogTitle>
          <DialogDescription>
            Completed Procurement Value is the stored value of completed purchase orders, not verified payment expenditure.
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-1">
          <div className="flex flex-wrap items-end gap-3 border-b pb-4">
            <label className="grid gap-1 text-xs font-medium">
              Reporting month
              <input
                type="month"
                value={month}
                disabled={loading || exporting}
                onChange={(event) => setMonth(event.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              />
            </label>
            <Button variant="outline" size="sm" onClick={() => void loadReport()} disabled={loading || exporting}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />}
              Refresh
            </Button>
            <div className="ml-auto flex flex-wrap gap-2">
              {(["csv", "xlsx", "pdf"] as const).map((format) => (
                <Button key={format} variant="outline" size="sm" onClick={() => void exportReport(format)} disabled={!report || loading || exporting}>
                  {exporting ? <Loader2 className="size-4 animate-spin" /> : <DownloadIcon className="size-4" />}
                  {format.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          {loading && <div className="py-12 text-center text-sm text-muted-foreground">Loading completed purchase orders...</div>}
          {error && !loading && (
            <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void loadReport()}>Retry</Button>
            </div>
          )}
          {report && !loading && (
            <>
              <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Completed procurement value</p>
                  <div className="mt-2 grid gap-1">
                    {report.summary.values_by_currency.length ? report.summary.values_by_currency.map((item) => (
                      <p key={item.currency_code} className="text-xl font-semibold">{money(item.value, item.currency_code)}</p>
                    )) : <p className="text-xl font-semibold">No completed orders</p>}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Completed purchase orders</p>
                  <p className="mt-2 text-xl font-semibold">{report.summary.completed_purchase_order_count}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{report.period.month} · completion event date</p>
                </div>
              </section>
              <ReportTable title="Category breakdown" headers={["Category", "Currency", "Value", "Orders"]} rows={report.categories.map((item) => [item.category, item.currency_code, money(item.value, item.currency_code), item.purchase_order_count])} />
              <ReportTable title="Original requester breakdown" headers={["Requester", "Currency", "Value", "Orders"]} rows={report.requesters.map((item) => [item.requester_name, item.currency_code, money(item.value, item.currency_code), item.purchase_order_count])} />
              <ReportTable title="Supporting completed purchase orders" headers={["PO", "Completion date", "Supplier", "Requester", "Currency", "Value"]} rows={report.records.map((item) => [item.po_number, item.completion_date ? new Date(item.completion_date).toLocaleDateString() : "Unavailable", item.supplier, item.requester, item.currency_code, money(item.total_amount, item.currency_code)])} />
              {report.limitations.length > 0 && <div className="rounded-md border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-950"><strong>Data limitations:</strong> {report.limitations.join(" ")}</div>}
            </>
          )}
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function ReportTable({ title, headers, rows }: { title: string; headers: string[]; rows: Array<Array<string | number>> }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[36rem] text-left text-xs">
          <thead className="border-b bg-muted/40"><tr>{headers.map((header) => <th key={header} className="px-3 py-2 font-semibold">{header}</th>)}</tr></thead>
          <tbody className="divide-y">{rows.length ? rows.map((row, index) => <tr key={`${title}-${index}`}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`} className="px-3 py-2">{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="px-3 py-6 text-center text-muted-foreground">No records for this month.</td></tr>}</tbody>
        </table>
      </div>
    </section>
  );
}
