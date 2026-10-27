"use client";

import { useEffect, useState } from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  getPurchaseRequisition,
  type PurchaseRequisitionDetail,
} from "@/app/api/purchase-requisition/client";
import {
  createRfq,
  listProcurementQueue,
  listRfqQuotations,
  listRfqs,
  publishRfq,
  RfqApiError,
  selectRfqQuotation,
  type ProcurementQueueItem,
  type Quotation,
  type Rfq,
} from "@/app/api/purchase-orders/rfq-client";

const formSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(255),
  description: z.string().max(5000),
  closingDate: z.string().min(1, "A submission deadline is required."),
});

const dateFormat = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "Not provided";
const display = (value?: string | number | null) =>
  value === null || value === undefined || value === ""
    ? "Not provided"
    : String(value);
const errorMessage = (error: unknown) =>
  error instanceof RfqApiError
    ? error.message
    : "RFQ data could not be loaded. Please try again.";
const itemLine = (
  item: { line_no?: number; line_number?: number },
  index: number,
) => item.line_number ?? item.line_no ?? index + 1;
const itemKey = (
  item: { id?: string; line_no?: number; line_number?: number },
  index: number,
) => item.id ?? String(itemLine(item, index));

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "PUBLISHED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "POSTED"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : status === "SELECTED"
          ? "border-blue-200 bg-blue-50 text-blue-800"
      : status === "DRAFT"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <Badge variant="outline" className={styles}>
      <span className="mr-1.5 size-1.5 rounded-full bg-current" />
      {status.replace("_", " ")}
    </Badge>
  );
}

function Notice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <span className="flex items-center gap-2">
        <AlertCircleIcon className="size-4" />
        {message}
      </span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCwIcon />
          Retry
        </Button>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

export function RfqWorkspace() {
  const [queue, setQueue] = useState<ProcurementQueueItem[]>([]);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProcurementQueueItem | null>(null);
  const [selectedDetail, setSelectedDetail] =
    useState<PurchaseRequisitionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rfqOpen, setRfqOpen] = useState(false);
  const [rfqDetail, setRfqDetail] = useState<Rfq | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    closingDate: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [mutation, setMutation] = useState<"post" | "select" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [nextQueue, nextRfqs] = await Promise.all([
        listProcurementQueue(),
        listRfqs(),
      ]);
      setQueue(nextQueue);
      setRfqs(nextRfqs);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function openCreate(pr: ProcurementQueueItem) {
    setSelected(pr);
    setSelectedDetail(null);
    setDetailLoading(true);

    setRfqOpen(true);
    setFormError(null);
    setForm({
      title: `Request for quotation - ${pr.pr_number}`,
      description: pr.purpose ?? pr.justification ?? "",
      closingDate: "",
    });
    try {
      setSelectedDetail(await getPurchaseRequisition(pr.id));
    } catch {
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function post() {
    if (!selected) return;
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(
        parsed.error.issues[0]?.message ?? "Review the RFQ details.",
      );
      return;
    }
    const items = (selectedDetail?.items ?? selected.items ?? []).map(
      (item, index) => ({
        line_no: itemLine(item, index),
        description: item.description,
        quantity: Number(item.quantity),
        unit_of_measure: item.unit_of_measure,
        specification: item.specification ?? "Not specified",
      }),
    );
    if (items.length === 0) {
      setFormError("The approved requisition has no items to quote.");
      return;
    }
    setMutation("post");
    setFormError(null);
    try {
      const draft = await createRfq({
        purchase_requisition_id: selected.id,
        title: parsed.data.title,
        description: parsed.data.description || undefined,
        closing_date: parsed.data.closingDate,
        rfq_items: items,
      });
      await publishRfq(draft.id);
      setRfqOpen(false);
      setNotice(`${draft.rfq_number} was published.`);
      await load();
    } catch (requestError) {
      setFormError(errorMessage(requestError));
    } finally {
      setMutation(null);
    }
  }

  async function openRfq(rfq: Rfq) {
    setRfqDetail(rfq);
    setQuotations([]);
    try {
      setQuotations(await listRfqQuotations(rfq.id));
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  async function selectQuotation(quotation: Quotation) {
    if (!rfqDetail || mutation === "select") return;

    setMutation("select");
    setError(null);
    try {
      await selectRfqQuotation(rfqDetail.id, quotation.id);
      setNotice(
        `${quotation.quotation_number} was selected and the purchase order was created.`,
      );
      setQuotations(await listRfqQuotations(rfqDetail.id));
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setMutation(null);
    }
  }

  const items = selectedDetail?.items ?? selected?.items ?? [];
  return (
    <div className="space-y-6">
      {notice && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2Icon className="size-4" />
            {notice}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
            Dismiss
          </Button>
        </div>
      )}
      {error && <Notice message={error} onRetry={() => void load()} />}
      <section className="overflow-hidden rounded-xl border border-border/70 bg-background/80 shadow-sm">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="font-heading text-base font-semibold">
            Approved requisitions
          </h2>
          <p className="text-sm text-muted-foreground">
            Select an eligible PR to prepare its quotation request.
          </p>
        </div>
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            Loading approved requisitions
          </div>
        ) : queue.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <ClipboardCheckIcon className="size-8 text-muted-foreground/70" />
            <h3 className="font-heading font-semibold">
              No approved requisitions are waiting
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Approved requisitions without an RFQ will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">PR reference</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead className="pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((pr) => (
                  <TableRow
                    key={pr.id}
                    className="cursor-pointer"
                    onClick={() => void openCreate(pr)}
                  >
                    <TableCell className="pl-5 font-medium">
                      {pr.pr_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {display(
                        [
                          pr.requested_by_user?.first_name,
                          pr.requested_by_user?.last_name,
                        ]
                          .filter(Boolean)
                          .join(" "),
                      )}
                    </TableCell>
                    <TableCell>{pr.items?.length ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateFormat(pr.approved_at)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <ChevronRightIcon className="ml-auto size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
      <section className="overflow-hidden rounded-xl border border-border/70 bg-background/80 shadow-sm">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="font-heading text-base font-semibold">
            RFQs and quotations
          </h2>
          <p className="text-sm text-muted-foreground">
            Track published requests and inspect supplier responses.
          </p>
        </div>
        {rfqs.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No RFQs have been created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">RFQ reference</TableHead>
                  <TableHead>Source PR</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.map((rfq) => (
                  <TableRow
                    key={rfq.id}
                    className="cursor-pointer"
                    onClick={() => void openRfq(rfq)}
                  >
                    <TableCell className="pl-5 font-medium">
                      {rfq.rfq_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {display(rfq.purchase_requisition_id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateFormat(rfq.closing_date)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={rfq.status} />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <ChevronRightIcon className="ml-auto size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
      <Dialog open={rfqOpen} onOpenChange={setRfqOpen}>
        <DialogContent className="max-h-[92svh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prepare RFQ from {selected?.pr_number}</DialogTitle>
            <DialogDescription>
              Approved requisition information is inherited read-only. Complete
              the RFQ fields, review, then publish.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div className="grid gap-4 rounded-lg border border-border/70 p-4 sm:grid-cols-3">
                <Info label="PR reference" value={selected.pr_number} />
                <Info
                  label="Purpose"
                  value={
                    selectedDetail?.purpose ??
                    selected.purpose ??
                    "Not provided"
                  }
                />
                <Info
                  label="Estimated amount"
                  value={`${display(selectedDetail?.total_estimated_amount ?? selected.total_amount)} ${selectedDetail?.currency_code ?? selected.currency_code ?? ""}`}
                />
              </div>
              {detailLoading ? (
                <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Loading requisition details
                </div>
              ) : (
                <div>
                  <h3 className="mb-3 text-sm font-semibold">
                    Requested items
                  </h3>
                  <div className="divide-y rounded-lg border border-border/70">
                    {items.map((item, index) => (
                      <div
                        key={itemKey(item, index)}
                        className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_auto]"
                      >
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} {item.unit_of_measure} ·{" "}
                            {item.specification || "No specification"}
                          </p>
                        </div>
                        <span className="text-muted-foreground">
                          Line {itemLine(item, index)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  RFQ title
                  <Input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Submission deadline
                  <Input
                    type="date"
                    value={form.closingDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        closingDate: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm font-medium">
                Procurement instructions
                <textarea
                  className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                Supplier assignment is not available in the documented Purchase
                Order Management API. Publishing will use the supported RFQ
                lifecycle; supplier quotations will appear here when submitted
                through the existing supplier workflow.
              </div>
              {formError && <Notice message={formError} />}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRfqOpen(false)}
              disabled={mutation !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void post()}
              disabled={mutation !== null || detailLoading}
            >
              {mutation === "post" && <Loader2Icon className="animate-spin" />}
              Review and post RFQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(rfqDetail)}
        onOpenChange={(open) => {
          if (!open) setRfqDetail(null);
        }}
      >
        <DialogContent className="max-h-[92svh] max-w-4xl overflow-y-auto">
          <DialogHeader className="border-b border-border/70 pb-5">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div className="min-w-0">
                <DialogTitle className="truncate text-lg">
                  {rfqDetail?.rfq_number}
                </DialogTitle>
                <DialogDescription className="mt-1 truncate">
                  {rfqDetail?.title}
                </DialogDescription>
              </div>
              {rfqDetail && <StatusBadge status={rfqDetail.status} />}
            </div>
          </DialogHeader>
          {rfqDetail && (
            <div className="space-y-6">
              <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-3">
                <Info
                  label="Source PR"
                  value={display(rfqDetail.purchase_requisition_id)}
                />
                <Info
                  label="Deadline"
                  value={dateFormat(rfqDetail.closing_date)}
                />
                <Info label="Status" value={rfqDetail.status} />
              </div>
              <div>
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-base font-semibold">
                        Supplier quotations
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Review submitted offers and select one to issue the purchase order.
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      {quotations.length} {quotations.length === 1 ? "offer" : "offers"}
                    </span>
                  </div>
                {quotations.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                    No quotations have been submitted for this RFQ.
                  </p>
                ) : (
                    <div className="space-y-3">
                    {quotations.map((quotation) => (
                      <div
                        key={quotation.id}
                          className="grid gap-4 rounded-xl border border-border/70 bg-background p-4 text-sm shadow-sm transition-colors hover:border-border hover:bg-muted/20 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                      >
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                            {quotation.quotation_number}
                          </p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                            {quotation.supplier?.legal_name ??
                              quotation.supplier?.name ??
                              quotation.supplier?.supplier_code ??
                              quotation.supplier_id}
                          </p>
                        </div>
                          <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                            <p className="font-heading text-base font-semibold tabular-nums">
                              {quotation.total_amount} {quotation.currency_code}
                            </p>
                            <StatusBadge status={quotation.status} />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => void selectQuotation(quotation)}
                            disabled={
                              quotation.status !== "POSTED" ||
                              mutation === "select"
                            }
                            className="w-full sm:w-auto"
                          >
                            {mutation === "select" ? (
                              <Loader2Icon className="animate-spin" />
                            ) : null}
                            {quotation.status === "POSTED"
                              ? "Select supplier"
                              : "Unavailable"}
                          </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRfqDetail(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
