"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircleIcon,
  ArchiveIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  FileDownIcon,
  Loader2Icon,
  RefreshCwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  cancelPurchaseOrder,
  completePurchaseOrder,
  getPurchaseOrder,
  listPurchaseOrders,
  orderPurchaseOrder,
  PurchaseOrderApiError,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from "@/app/api/purchase-orders/client";
import { RfqWorkspace } from "./rfq-workspace";

const statuses: Array<PurchaseOrderStatus | "ALL"> = [
  "ALL",
  "DRAFT",
  "ISSUED",
  "ORDERED",
  "COMPLETED",
  "CANCELLED",
];
const statusStyles: Record<PurchaseOrderStatus, string> = {
  DRAFT: "border-slate-200 bg-slate-50 text-slate-700",
  ISSUED: "border-blue-200 bg-blue-50 text-blue-700",
  ORDERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  COMPLETED: "border-violet-200 bg-violet-50 text-violet-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
};
const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "Not provided";
const formatMoney = (value: number | string, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
const errorMessage = (error: unknown) =>
  error instanceof PurchaseOrderApiError
    ? error.message
    : "Purchase orders could not be loaded. Please try again.";

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      <span className="size-1.5 rounded-full bg-current" />
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

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PurchaseOrderStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mutation, setMutation] = useState<"cancel" | "order" | "complete" | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  async function loadOrders() {
    setLoading(true);
    setError(null);
    try {
      const result = await listPurchaseOrders({
        referenceNo: search.trim() || undefined,
        status: status === "ALL" ? undefined : status,
      });
      setOrders(result.list);
      setTotal(result.total);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => void loadOrders(), 250);
    return () => window.clearTimeout(timer);
  }, [search, status]);
  async function openDetail(id: string) {
    setDetailLoading(true);
    setSelected(null);
    setError(null);
    try {
      setSelected(await getPurchaseOrder(id));
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setDetailLoading(false);
    }
  }
  async function cancel() {
    if (!selected) return;
    setMutation("cancel");
    try {
      await cancelPurchaseOrder(selected.id);
      setCancelOpen(false);
      setNotice(`${selected.po_number} was cancelled.`);
      setSelected(null);
      await loadOrders();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setMutation(null);
    }
  }

  async function advanceOrder() {
    if (!selected) return;
    setMutation("order");
    setError(null);
    try {
      const updated = await orderPurchaseOrder(selected.id);
      setSelected(updated);
      setNotice(`${updated.po_number} is now ${updated.status}.`);
      await loadOrders();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setMutation(null);
    }
  }

  async function complete() {
    if (!selected) return;
    setMutation("complete");
    setError(null);
    try {
      const updated = await completePurchaseOrder(selected.id);
      setSelected(updated);
      setNotice(`${updated.po_number} was completed.`);
      await loadOrders();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setMutation(null);
    }
  }
  const counts = useMemo(
    () =>
      statuses.slice(1).map((item) => ({
        status: item,
        count: orders.filter((orderItem) => orderItem.status === item).length,
      })),
    [orders],
  );
  const canCancel =
    selected &&
    !["ORDERED", "COMPLETED", "CANCELLED"].includes(selected.status);

  return (
    <Tabs
      defaultValue="purchase-orders"
      className="min-h-[calc(100svh-var(--header-height))] bg-background"
    >
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-7 sm:px-6 lg:px-10 lg:py-9">
        <TabsList
          variant="line"
          className="w-full justify-start border-b border-border/70"
        >
          <TabsTrigger value="purchase-orders">Purchase orders</TabsTrigger>
          <TabsTrigger value="rfqs">RFQs &amp; quotations</TabsTrigger>
        </TabsList>
        <TabsContent value="purchase-orders">
          <header className="flex flex-col gap-5 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                Procurement / Operations
              </p>
              <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Purchase orders
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Issue, track, and manage legally binding orders with your
                suppliers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <FileDownIcon />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadOrders()}
              >
                <RefreshCwIcon />
                Refresh
              </Button>
            </div>
          </header>
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
          {error && (
            <Notice message={error} onRetry={() => void loadOrders()} />
          )}
          <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/70 bg-border/70 sm:grid-cols-3 lg:grid-cols-5">
            {counts.map(({ status: itemStatus, count }) => (
              <div key={itemStatus} className="bg-background px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {itemStatus}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {count}
                </p>
              </div>
            ))}
          </section>
          <section className="overflow-hidden rounded-xl border border-border/70 bg-background/80 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-heading text-base font-semibold">
                  Order register
                </h2>
                <p className="text-sm text-muted-foreground">
                  {total} matching purchase order{total === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-2 sm:ml-auto sm:max-w-2xl sm:flex-row">
                <div className="relative flex-1">
                  <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search PO number"
                    aria-label="Search purchase orders"
                  />
                </div>
                <div className="relative">
                  <SlidersHorizontalIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    className="h-9 w-full appearance-none rounded-md border border-input bg-background px-9 pr-8 text-sm sm:w-40"
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target.value as PurchaseOrderStatus | "ALL",
                      )
                    }
                    aria-label="Filter by status"
                  >
                    {statuses.map((itemStatus) => (
                      <option key={itemStatus} value={itemStatus}>
                        {itemStatus === "ALL" ? "All statuses" : itemStatus}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Loading purchase orders
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                <ArchiveIcon className="size-9 text-muted-foreground/70" />
                <h3 className="font-heading font-semibold">
                  No purchase orders found
                </h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Try changing the search or status filter. New orders appear
                  here after supplier selection creates an issued PO.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">PO number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Delivery date</TableHead>
                      <TableHead>Total amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12 pr-5" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((orderItem) => (
                      <TableRow
                        key={orderItem.id}
                        className="group cursor-pointer"
                        onClick={() => void openDetail(orderItem.id)}
                      >
                        <TableCell className="pl-5 font-medium">
                          {orderItem.po_number}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {orderItem.supplier?.company?.display_name ??
                            orderItem.supplier?.company?.legal_name ??
                            orderItem.supplier?.legal_name ??
                            orderItem.supplier?.name ??
                            "Supplier not provided"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(orderItem.expected_delivery_date)}
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          {formatMoney(
                            orderItem.total_amount,
                            orderItem.currency_code,
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={orderItem.status} />
                        </TableCell>
                        <TableCell className="pr-5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`View ${orderItem.po_number}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              void openDetail(orderItem.id);
                            }}
                          >
                            <ChevronRightIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
          <p className="text-right text-xs text-muted-foreground">
            Showing up to 20 most recent orders, as supported by the API.
          </p>
          <Dialog
            open={Boolean(selected) || detailLoading}
            onOpenChange={(open) => {
              if (!open && !mutation) setSelected(null);
            }}
          >
            <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {detailLoading
                    ? "Loading purchase order"
                    : selected?.po_number}
                </DialogTitle>
                <DialogDescription>
                  Purchase order details and lifecycle actions.
                </DialogDescription>
                {selected && (
                  <div className="pt-1">
                    <StatusBadge status={selected.status} />
                  </div>
                )}
              </DialogHeader>
              {detailLoading ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Loading details
                </div>
              ) : (
                selected && (
                  <div className="space-y-6">
                    <div className="grid gap-4 rounded-lg border border-border/70 p-4 sm:grid-cols-3">
                      <Info
                        label="Source PR"
                        value={
                          selected.purchase_requisition?.pr_number ??
                          selected.purchase_requisition_id ??
                          "Not provided"
                        }
                      />
                      <Info
                        label="RFQ"
                        value={
                          selected.rfq?.rfq_number ??
                          selected.rfq_id ??
                          "Not provided"
                        }
                      />
                      <Info
                        label="Quotation"
                        value={
                          selected.supplier_quotation?.quotation_number ??
                          selected.supplier_quotation_id ??
                          "Not provided"
                        }
                      />
                      <Info
                        label="Supplier"
                        value={
                          selected.supplier?.company?.display_name ??
                          selected.supplier?.company?.legal_name ??
                          selected.supplier?.legal_name ??
                          selected.supplier?.name ??
                          "Not provided"
                        }
                      />
                      <Info
                        label="Order date"
                        value={formatDate(selected.order_date)}
                      />
                      <Info
                        label="Delivery date"
                        value={formatDate(selected.expected_delivery_date)}
                      />
                      <Info
                        label="Total"
                        value={formatMoney(
                          selected.total_amount,
                          selected.currency_code,
                        )}
                      />
                      <Info label="Currency" value={selected.currency_code} />
                    </div>
                    {selected.purchase_requisition && (
                      <div>
                        <h3 className="mb-3 text-sm font-semibold">
                          Original requisition
                        </h3>
                        <p className="mb-3 text-sm text-muted-foreground">
                          {selected.purchase_requisition.purpose ||
                            selected.purchase_requisition.justification ||
                            "No requisition description provided."}
                        </p>
                        <div className="divide-y rounded-lg border border-border/70">
                          {(selected.purchase_requisition.items ?? []).map(
                            (item) => (
                              <div
                                key={item.id ?? item.line_no}
                                className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3 text-sm"
                              >
                                <div>
                                  <p className="font-medium">{item.description}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.quantity} {item.unit_of_measure} at {" "}
                                    {formatMoney(
                                      item.estimated_unit_cost,
                                      selected.purchase_requisition?.currency_code ??
                                        selected.currency_code,
                                    )}
                                  </p>
                                  {item.specification && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {item.specification}
                                    </p>
                                  )}
                                </div>
                                <p className="font-medium tabular-nums">
                                  {formatMoney(
                                    item.estimated_total_cost,
                                    selected.purchase_requisition?.currency_code ??
                                      selected.currency_code,
                                  )}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                    {selected.supplier_quotation && (
                      <div>
                        <h3 className="mb-3 text-sm font-semibold">
                          Selected quotation
                        </h3>
                        <div className="divide-y rounded-lg border border-border/70">
                          {(selected.supplier_quotation.items ?? []).map(
                            (item) => (
                              <div
                                key={item.id ?? item.line_no}
                                className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3 text-sm"
                              >
                                <div>
                                  <p className="font-medium">
                                    {item.rfq_item?.description ??
                                      `Line ${item.line_no}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.quoted_quantity} {item.rfq_item?.unit_of_measure ?? ""} at {" "}
                                    {formatMoney(
                                      item.unit_price,
                                      selected.supplier_quotation?.currency_code ??
                                        selected.currency_code,
                                    )}
                                  </p>
                                  {item.rfq_item?.specification && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {item.rfq_item.specification}
                                    </p>
                                  )}
                                </div>
                                <p className="font-medium tabular-nums">
                                  {formatMoney(
                                    item.total_price,
                                    selected.supplier_quotation?.currency_code ??
                                      selected.currency_code,
                                  )}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold">Line items</h3>
                      <div className="divide-y rounded-lg border border-border/70">
                        {(selected.items ?? []).map((item) => (
                          <div
                            key={item.id ?? item.line_no}
                            className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3 text-sm"
                          >
                            <div>
                              <p className="font-medium">{item.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} {item.unit_of_measure} at{" "}
                                {formatMoney(
                                  item.unit_price,
                                  selected.currency_code,
                                )}
                              </p>
                            </div>
                            <p className="font-medium tabular-nums">
                              {formatMoney(
                                Number(item.quantity) * Number(item.unit_price),
                                selected.currency_code,
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              )}
              <DialogFooter>
                {selected && (
                  <>
                    {canCancel && (
                      <Button
                        variant="destructive"
                        onClick={() => setCancelOpen(true)}
                        disabled={mutation !== null}
                      >
                        Cancel order
                      </Button>
                    )}
                    {selected && ["DRAFT", "ISSUED"].includes(selected.status) && (
                      <Button
                        onClick={() => void advanceOrder()}
                        disabled={mutation !== null}
                      >
                        {mutation === "order" && (
                          <Loader2Icon className="animate-spin" />
                        )}
                        Order
                      </Button>
                    )}
                    {selected?.status === "ORDERED" && (
                      <Button
                        onClick={() => void complete()}
                        disabled={mutation !== null}
                      >
                        {mutation === "complete" && (
                          <Loader2Icon className="animate-spin" />
                        )}
                        Complete Order
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => setSelected(null)}
                      disabled={mutation !== null}
                    >
                      Close
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cancel purchase order?</DialogTitle>
                <DialogDescription>
                  This will mark {selected?.po_number} as CANCELLED. The record
                  will remain available for audit history.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCancelOpen(false)}
                  disabled={mutation === "cancel"}
                >
                  Keep order
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => void cancel()}
                  disabled={mutation === "cancel"}
                >
                  {mutation === "cancel" && (
                    <Loader2Icon className="animate-spin" />
                  )}
                  Cancel order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="rfqs">
          <RfqWorkspace />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm">{value}</p>
    </div>
  );
}
