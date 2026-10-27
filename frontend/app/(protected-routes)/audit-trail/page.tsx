"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  Loader2Icon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react";
import {
  AuditTrailApiError,
  getAuditTrail,
  getAuditTrailDetail,
  type AuditTrailDetail,
  type AuditTrailFilters,
  type AuditTrailPage,
  type AuditTrailRecord,
} from "@/app/api/audit-trail/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
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

const initialFilters: AuditTrailFilters = {
  entityType: "",
  action: "",
  result: "",
  page: 1,
  pageSize: 25,
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
function shortId(value: string) {
  return value.length > 18
    ? `${value.slice(0, 8)}...${value.slice(-6)}`
    : value;
}
function statusVariant(
  result: string | null,
): "default" | "secondary" | "destructive" | "outline" {
  if (result?.toUpperCase() === "SUCCESS") return "default";
  if (["FAILURE", "FAILED"].includes(result?.toUpperCase() ?? ""))
    return "destructive";
  return "secondary";
}
function errorMessage(error: unknown) {
  if (error instanceof AuditTrailApiError) {
    if (error.status === 401)
      return "Your session has expired. Please sign in again.";
    if (error.status === 403)
      return "You do not have permission to view the audit trail.";
    if (error.status === 404)
      return "Your account does not currently have an active company context.";
    return error.message;
  }
  return "Unable to load the audit trail. Please try again.";
}

function DetailValue({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm">{value || "Not available"}</dd>
    </div>
  );
}

function AuditDetail({ detail }: { detail: AuditTrailDetail }) {
  const { audit, blockchain } = detail;
  return (
    <div className="space-y-6">
      <dl className="grid gap-5 sm:grid-cols-2">
        <DetailValue label="Event ID" value={audit.id} />
        <DetailValue label="Actor user ID" value={audit.actor_user_id} />
        <DetailValue
          label="Entity"
          value={`${audit.entity_type} / ${audit.entity_id}`}
        />
        <DetailValue label="Action" value={audit.action} />
        <DetailValue label="Result" value={audit.result} />
        <DetailValue label="Recorded" value={formatDate(audit.created_at)} />
      </dl>
      <div className="border-t pt-5">
        <h3 className="text-sm font-semibold">Blockchain record</h3>
        <dl className="mt-4 grid gap-5 sm:grid-cols-2">
          <DetailValue
            label="Blockchain audit ID"
            value={blockchain?.auditId}
          />
          <DetailValue label="Hash value" value={blockchain?.hashValue} />
          <DetailValue label="Event type" value={blockchain?.eventType} />
          <DetailValue
            label="Anchored at"
            value={
              blockchain
                ? new Date(blockchain.anchoredAt * 1000).toLocaleString()
                : null
            }
          />
        </dl>
      </div>
      <div className="border-t pt-5">
        <h3 className="text-sm font-semibold">Stored snapshot</h3>
        <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-muted p-4 text-xs leading-5">
          {JSON.stringify(audit.snapshot_json, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <TableBody>
      {Array.from({ length: 5 }, (_, index) => (
        <TableRow key={index}>
          {Array.from({ length: 5 }, (_, cell) => (
            <TableCell key={cell}>
              <div className="h-4 animate-pulse rounded bg-muted" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

function AuditTable({
  records,
  onInspect,
}: {
  records: AuditTrailRecord[];
  onInspect: (record: AuditTrailRecord) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recorded</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Result</TableHead>
            <TableHead className="text-right">Inspect</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="whitespace-nowrap text-sm">
                {formatDate(record.createdAt)}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(record.result)}>
                  {record.action}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium">{record.entityType}</div>
                <div
                  className="max-w-[260px] truncate font-mono text-xs text-muted-foreground"
                  title={record.entityId}
                >
                  {shortId(record.entityId)}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {record.result ?? "Not recorded"}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Inspect audit event ${record.id}`}
                  onClick={() => onInspect(record)}
                >
                  <EyeIcon className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AuditTrailPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState<AuditTrailPage>({
    records: [],
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AuditTrailRecord | null>(null);
  const [detail, setDetail] = useState<AuditTrailDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const listControllerRef = useRef<AbortController | null>(null);
  const detailControllerRef = useRef<AbortController | null>(null);
  const load = useCallback(async (currentFilters: AuditTrailFilters) => {
    listControllerRef.current?.abort();
    const controller = new AbortController();
    listControllerRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      setData(await getAuditTrail(currentFilters, controller.signal));
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      )
        return;
      setError(errorMessage(requestError));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load(filters);
    return () => listControllerRef.current?.abort();
  }, [filters, load]);
  async function openDetail(record: AuditTrailRecord) {
    detailControllerRef.current?.abort();
    const controller = new AbortController();
    detailControllerRef.current = controller;
    setSelected(record);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      setDetail(await getAuditTrailDetail(record.id, controller.signal));
    } catch (requestError) {
      if (
        requestError instanceof DOMException &&
        requestError.name === "AbortError"
      )
        return;
      setDetailError(errorMessage(requestError));
    } finally {
      if (!controller.signal.aborted) setDetailLoading(false);
    }
  }
  function updateFilter(
    name: "entityType" | "action" | "result",
    value: string,
  ) {
    setFilters((current) => ({ ...current, [name]: value, page: 1 }));
  }
  const totalPages = data?.totalPages ?? 0;
  const hasRecords = Boolean(data?.records.length);

  return (
    <main className="min-h-[calc(100svh-var(--header-height))]">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-7 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Governance & compliance
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Audit Trail
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review completed procurement activity recorded for your company,
              with immutable snapshot and blockchain references.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void load(filters)}
            disabled={loading}
          >
            <RefreshCwIcon
              className={loading ? "size-4 animate-spin" : "size-4"}
            />
            Refresh
          </Button>
        </header>
        <Card className="overflow-visible">
          <CardHeader className="border-b">
            <CardTitle>Recorded activity</CardTitle>
            <CardDescription>
              Search by the attributes supported by the audit service. Select an
              event to inspect its stored record.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Entity type"
                  value={filters.entityType}
                  onChange={(event) =>
                    updateFilter("entityType", event.target.value)
                  }
                  aria-label="Filter by entity type"
                />
              </div>
              <Input
                className="w-full lg:w-44"
                placeholder="Action"
                value={filters.action}
                onChange={(event) => updateFilter("action", event.target.value)}
                aria-label="Filter by action"
              />
              <Input
                className="w-full lg:w-44"
                placeholder="Result"
                value={filters.result}
                onChange={(event) => updateFilter("result", event.target.value)}
                aria-label="Filter by result"
              />
              <Button
                variant="ghost"
                onClick={() => setFilters(initialFilters)}
                disabled={
                  !filters.entityType && !filters.action && !filters.result
                }
              >
                <XIcon className="size-4" />
                Clear
              </Button>
            </div>
            {error && (
              <div
                className="m-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
                role="alert"
              >
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                <span>{error}</span>
              </div>
            )}
            {loading ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recorded</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Inspect</TableHead>
                    </TableRow>
                  </TableHeader>
                  <LoadingRows />
                </Table>
              </div>
            ) : error ? null : !hasRecords ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
                <ShieldCheckIcon className="size-8 text-muted-foreground/60" />
                <h2 className="font-medium">No audit events found</h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  No records match the current filters. Clear the filters or
                  refresh to check for new activity.
                </p>
              </div>
            ) : (
              <AuditTable
                records={data.records}
                onInspect={(record) => void openDetail(record)}
              />
            )}
            {!loading && !error && data && (
              <div className="flex flex-col gap-3 border-t px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  {data.total === 0
                    ? "No records"
                    : `Showing ${(data.page - 1) * data.pageSize + 1}-${Math.min(data.page * data.pageSize, data.total)} of ${data.total} events`}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Previous page"
                    disabled={data.page <= 1}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: current.page - 1,
                      }))
                    }
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Button>
                  <span className="min-w-20 text-center">
                    Page {data.page} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Next page"
                    disabled={data.page >= totalPages}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        page: current.page + 1,
                      }))
                    }
                  >
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setDetail(null);
          }
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit event details</DialogTitle>
            <DialogDescription>
              {selected
                ? `Read-only record ${shortId(selected.id)}`
                : "Read-only audit event"}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : detailError ? (
            <div
              className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
              role="alert"
            >
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              <span>{detailError}</span>
            </div>
          ) : detail ? (
            <AuditDetail detail={detail} />
          ) : null}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
