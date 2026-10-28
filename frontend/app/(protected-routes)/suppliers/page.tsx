"use client";

import { useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MailPlus,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  createInvitation,
  getQuotation,
  getRfq,
  getSupplier,
  listAvailableRfqs,
  listInvitations,
  listQuotations,
  listSuppliers,
  resendInvitation,
  submitQuotation,
  type Invitation,
  type Quotation,
  type QuotationInput,
  type Rfq,
  type Supplier,
} from "@/app/api/suppliers/client";
import { type DataTableFeatures } from "@/types/data-table-features";

const dateFormat = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "-";
const display = (value?: string | null) => value?.trim() || "-";
const companyName = (value?: Rfq["company"] | Rfq["purchasing_company"]) =>
  value?.display_name ||
  value?.legal_name ||
  value?.name ||
  "Purchasing company";
const money = (value?: string | number | null, currency = "USD") =>
  value == null
    ? "-"
    : `${currency} ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function StatusBadge({ status }: { status?: string | null }) {
  const normalized = status?.toUpperCase();
  return (
    <Badge
      variant={
        normalized === "ACTIVE" ||
        normalized === "ACCEPTED" ||
        normalized === "SUBMITTED"
          ? "default"
          : normalized === "INACTIVE"
            ? "outline"
            : "secondary"
      }
    >
      {display(status)}
    </Badge>
  );
}

function LoadingRows({ columns = 4 }: { columns?: number }) {
  return (
    <>
      {[1, 2, 3].map((row) => (
        <TableRow key={row}>
          {Array.from({ length: columns }, (_, index) => (
            <TableCell key={index}>
              <Skeleton className="h-4 w-24" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
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
    <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
      <span>{message}</span>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function Governance() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [supplierDetail, setSupplierDetail] = useState<Supplier | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [activeView, setActiveView] = useState("suppliers");

  async function loadSuppliers() {
    setLoading(true);
    setError("");
    try {
      const result = await listSuppliers();
      setSuppliers(result.suppliers ?? []);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load suppliers.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function loadInvitations() {
    setLoading(true);
    setError("");
    try {
      const result = await listInvitations();
      setInvitations(result.invitations ?? []);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load invitations.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void (activeView === "suppliers" ? loadSuppliers() : loadInvitations());
  }, [activeView]);

  useEffect(() => {
    const refreshOnReturn = () => {
      if (document.visibilityState !== "visible") return;
      void (activeView === "suppliers" ? loadSuppliers() : loadInvitations());
    };

    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);

    return () => {
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, [activeView]);

  async function openSupplier(supplierId: string) {
    setError("");
    try {
      setSupplierDetail(await getSupplier(supplierId));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load supplier details.",
      );
    }
  }
  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await createInvitation(email);
      setEmail("");
      setInviteOpen(false);
      setMessage("Invitation sent. The supplier can now complete onboarding.");
      await loadInvitations();
      setActiveView("invitations");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to send invitation.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  async function resend(invitationId: string) {
    setSubmitting(true);
    setError("");
    try {
      await resendInvitation(invitationId);
      await loadInvitations();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to resend invitation.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Governance
          </p>
          <p className="mb-1 text-sm text-muted-foreground">
            Keep active relationships distinct from invitations still in
            progress.
          </p>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Supplier relationships
          </h2>
        </div>
        <Button
          onClick={() => {
            setError("");
            setInviteOpen(true);
          }}
        >
          <MailPlus />
          Invite supplier
        </Button>
      </div>
      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
          <CheckCircle2 className="size-4 text-primary" />
          {message}
        </div>
      )}
      {error && (
        <Notice
          message={error}
          onRetry={() =>
            void (activeView === "suppliers"
              ? loadSuppliers()
              : loadInvitations())
          }
        />
      )}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList>
          <TabsTrigger value="suppliers">
            <Building2 />
            Suppliers{" "}
            <span className="ml-1 text-xs text-muted-foreground">
              {suppliers.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Clock3 />
            Invitations{" "}
            <span className="ml-1 text-xs text-muted-foreground">
              {invitations.length}
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="suppliers" className="pt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between border-b">
              <div>
                <CardTitle>Associated suppliers</CardTitle>
                <CardDescription>
                  Supplier companies connected to your purchasing company.
                </CardDescription>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Refresh suppliers"
                onClick={() => void loadSuppliers()}
              >
                <RefreshCw />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!loading && suppliers.length === 0 ? (
                <EmptyState
                  icon={<Building2 />}
                  title="No active suppliers"
                  detail="Invite a supplier company to begin a relationship."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Established</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <LoadingRows columns={5} />
                    ) : (
                      suppliers.map((supplier) => (
                        <TableRow
                          key={supplier.supplier_id}
                          className="cursor-pointer"
                          onClick={() =>
                            void openSupplier(supplier.supplier_id)
                          }
                        >
                          <TableCell>
                            <div className="font-medium">
                              {display(
                                supplier.display_name || supplier.legal_name,
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {display(supplier.supplier_code)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {display(supplier.contact_email)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={supplier.relationship_status}
                            />
                          </TableCell>
                          <TableCell>
                            {dateFormat(supplier.created_at)}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="size-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="invitations" className="pt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between border-b">
              <div>
                <CardTitle>Invitation activity</CardTitle>
                <CardDescription>
                  Pending invitations are not active relationships.
                </CardDescription>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Refresh invitations"
                onClick={() => void loadInvitations()}
              >
                <RefreshCw />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!loading && invitations.length === 0 ? (
                <EmptyState
                  icon={<Clock3 />}
                  title="No invitations yet"
                  detail="Sent invitations will appear here with their current status."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <LoadingRows columns={5} />
                    ) : (
                      invitations.map((invitation) => (
                        <TableRow key={invitation.invitation_id}>
                          <TableCell className="font-medium">
                            {invitation.email}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={invitation.invitation_status}
                            />
                          </TableCell>
                          <TableCell>
                            {dateFormat(invitation.created_at)}
                          </TableCell>
                          <TableCell>
                            {dateFormat(invitation.expires_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            {invitation.invitation_status === "PENDING" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={submitting}
                                onClick={() =>
                                  void resend(invitation.invitation_id)
                                }
                              >
                                Resend
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a supplier</DialogTitle>
            <DialogDescription>
              Enter the recipient email. The backend will create the invitation
              and deliver the onboarding email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={invite} className="space-y-5">
            <label className="block space-y-2 text-sm font-medium">
              Recipient email
              <Input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="supplier@example.com"
              />
            </label>
            <DialogFooter className="pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending..." : "Send invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(supplierDetail)}
        onOpenChange={(open) => {
          if (!open) setSupplierDetail(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {display(
                supplierDetail?.display_name || supplierDetail?.legal_name,
              )}
            </DialogTitle>
            <DialogDescription>Supplier relationship details</DialogDescription>
          </DialogHeader>
          {supplierDetail && (
            <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
              <Info
                label="Supplier code"
                value={supplierDetail.supplier_code}
              />
              <Info
                label="Contact email"
                value={supplierDetail.contact_email}
              />
              <Info label="Phone" value={supplierDetail.contact_phone} />
              <Info
                label="Relationship"
                value={supplierDetail.relationship_status}
              />
              <Info
                label="Established"
                value={dateFormat(supplierDetail.created_at)}
              />
              <Info label="Tax ID" value={supplierDetail.tax_id} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupplierDetail(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function Portal() {
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("rfqs");
  const [selectedRfq, setSelectedRfq] = useState<Rfq | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const rfqColumns = useMemo(() => {
    const columnHelper = createColumnHelper<DataTableFeatures, Rfq>();
    return columnHelper.columns([
      columnHelper.accessor("rfq_number", {
        header: "RFQ",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{display(row.original.rfq_number || row.original.id)}</div>
            <div className="text-xs text-muted-foreground">{display(row.original.title)}</div>
          </div>
        ),
      }),
      columnHelper.display({
        id: "purchasing_company",
        header: "Purchasing company",
        cell: ({ row }) => companyName(row.original.purchasing_company || row.original.company),
      }),
      columnHelper.accessor("closing_date", {
        header: "Deadline",
        cell: ({ row }) => dateFormat(row.original.closing_date),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: () => <ChevronRight className="size-4 text-muted-foreground" />,
      }),
    ]);
  }, []);
  const quotationColumns = useMemo(() => {
    const columnHelper = createColumnHelper<DataTableFeatures, Quotation>();
    return columnHelper.columns([
      columnHelper.accessor("quotation_number", {
        header: "Quotation",
        cell: ({ row }) => (
          <span className="font-medium">{display(row.original.quotation_number || row.original.id)}</span>
        ),
      }),
      columnHelper.display({
        id: "rfq",
        header: "RFQ",
        cell: ({ row }) => display(row.original.rfq?.rfq_number || row.original.rfq_id),
      }),
      columnHelper.accessor("total_amount", {
        header: "Total",
        cell: ({ row }) => money(row.original.total_amount, row.original.currency_code || "USD"),
      }),
      columnHelper.display({
        id: "submitted",
        header: "Submitted",
        cell: ({ row }) => dateFormat(row.original.submitted_at || row.original.created_at),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      }),
    ]);
  }, []);
  async function loadRfqs() {
    setLoading(true);
    setError("");
    try {
      setRfqs(await listAvailableRfqs());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load available RFQs.",
      );
    } finally {
      setLoading(false);
    }
  }
  async function loadQuotations() {
    setLoading(true);
    setError("");
    try {
      setQuotations(await listQuotations());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load quotations.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void (activeView === "rfqs" ? loadRfqs() : loadQuotations());
  }, [activeView]);
  async function openRfq(rfqId: string) {
    setError("");
    try {
      setSelectedRfq(await getRfq(rfqId));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "This RFQ is no longer available.",
      );
    }
  }
  async function openQuotation(quotationId: string) {
    setError("");
    try {
      setSelectedQuotation(await getQuotation(quotationId));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load quotation details.",
      );
    }
  }
  async function submit(rfqId: string, input: QuotationInput) {
    setSubmitting(true);
    setError("");
    try {
      await submitQuotation(rfqId, input);
      setSelectedRfq(null);
      setMessage("Quotation submitted successfully.");
      await loadQuotations();
      setActiveView("quotations");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to submit quotation. The RFQ may have closed.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <section className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Supplier portal
        </p>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Quotation opportunities
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review RFQs assigned to your supplier company and keep submitted
          quotations together.
        </p>
      </div>
      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
          <CheckCircle2 className="size-4 text-primary" />
          {message}
        </div>
      )}
      {error && (
        <Notice
          message={error}
          onRetry={() =>
            void (activeView === "rfqs" ? loadRfqs() : loadQuotations())
          }
        />
      )}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList>
          <TabsTrigger value="rfqs">
            <Sparkles />
            Available RFQs{" "}
            <span className="ml-1 text-xs text-muted-foreground">
              {rfqs.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="quotations">
            <Send />
            My quotations{" "}
            <span className="ml-1 text-xs text-muted-foreground">
              {quotations.length}
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="rfqs" className="pt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between border-b">
              <div>
                <CardTitle>Available RFQs</CardTitle>
                <CardDescription>
                  Only published RFQs available to your authorized supplier
                  relationship appear here.
                </CardDescription>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Refresh available RFQs"
                onClick={() => void loadRfqs()}
              >
                <RefreshCw />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!loading && rfqs.length === 0 ? (
                <EmptyState
                  icon={<Sparkles />}
                  title="No RFQs available"
                  detail="New eligible quotation requests will appear here."
                />
              ) : (
                <DataTable
                  columns={rfqColumns}
                  data={rfqs}
                  enableExport
                  exportFileName="available-rfqs"
                  onRowClick={(rfq) => void openRfq(rfq.id)}
                  density="comfortable"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="quotations" className="pt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between border-b">
              <div>
                <CardTitle>My quotations</CardTitle>
                <CardDescription>
                  Saved quotations returned for your authenticated supplier
                  company.
                </CardDescription>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Refresh quotations"
                onClick={() => void loadQuotations()}
              >
                <RefreshCw />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!loading && quotations.length === 0 ? (
                <EmptyState
                  icon={<Send />}
                  title="No submitted quotations"
                  detail="Open an available RFQ to prepare your first quotation."
                />
              ) : (
                <DataTable
                  columns={quotationColumns}
                  data={quotations}
                  enableExport
                  exportFileName="supplier-quotations"
                  onRowClick={(quotation) => void openQuotation(quotation.id)}
                  density="comfortable"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <QuotationDialog
        rfq={selectedRfq}
        open={Boolean(selectedRfq)}
        onClose={() => setSelectedRfq(null)}
        onSubmit={submit}
        submitting={submitting}
      />
      <QuotationDetail
        quotation={selectedQuotation}
        onClose={() => setSelectedQuotation(null)}
      />
    </section>
  );
}

type QuoteDraft = {
  quantity: string;
  price: string;
  lead: string;
  remarks: string;
};
const emptyQuoteDraft = (): QuoteDraft => ({
  quantity: "",
  price: "",
  lead: "",
  remarks: "",
});

function QuotationDialog({
  rfq,
  open,
  onClose,
  onSubmit,
  submitting,
}: {
  rfq: Rfq | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (rfqId: string, input: QuotationInput) => Promise<void>;
  submitting: boolean;
}) {
  const [currency, setCurrency] = useState("USD");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<Record<string, QuoteDraft>>({});
  useEffect(() => {
    if (rfq) {
      const next: Record<string, QuoteDraft> = {};
      (rfq.items ?? []).forEach((item) => {
        next[item.id] = {
          ...emptyQuoteDraft(),
          quantity: String(item.quantity ?? ""),
        };
      });
      setItems(next);
    }
  }, [rfq]);
  function updateItem(itemId: string, field: keyof QuoteDraft, value: string) {
    setItems((current) => ({
      ...current,
      [itemId]: { ...(current[itemId] ?? emptyQuoteDraft()), [field]: value },
    }));
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!rfq) return;
    void onSubmit(rfq.id, {
      currency_code: currency,
      valid_until: validUntil || undefined,
      items: (rfq.items ?? []).map((item) => ({
        rfq_item_id: item.id,
        quoted_quantity: Number(items[item.id]?.quantity),
        unit_price: Number(items[item.id]?.price),
        lead_time_days: items[item.id]?.lead
          ? Number(items[item.id]?.lead)
          : undefined,
        remarks: items[item.id]?.remarks || undefined,
      })),
    });
  }
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{display(rfq?.rfq_number || rfq?.title)}</DialogTitle>
          <DialogDescription>
            {companyName(rfq?.purchasing_company || rfq?.company)} · submission
            deadline {dateFormat(rfq?.closing_date)}
          </DialogDescription>
        </DialogHeader>
        {rfq && (
          <form
            onSubmit={submit}
            className="max-h-[65vh] space-y-5 overflow-y-auto"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Currency code
                <Input
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value.toUpperCase())
                  }
                  maxLength={3}
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Quotation valid until
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(event) => setValidUntil(event.target.value)}
                />
              </label>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Requested items</h3>
              {(rfq.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_130px_130px]"
                >
                  <div>
                    <p className="font-medium">{display(item.description)}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested {display(String(item.quantity))}{" "}
                      {display(item.unit_of_measure)} ·{" "}
                      {display(item.specification)}
                    </p>
                  </div>
                  <label className="space-y-1 text-xs font-medium">
                    Quantity
                    <Input
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      required
                      value={items[item.id]?.quantity ?? ""}
                      onChange={(event) =>
                        updateItem(item.id, "quantity", event.target.value)
                      }
                    />
                  </label>
                  <label className="space-y-1 text-xs font-medium">
                    Unit price
                    <Input
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      required
                      value={items[item.id]?.price ?? ""}
                      onChange={(event) =>
                        updateItem(item.id, "price", event.target.value)
                      }
                    />
                  </label>
                  <label className="space-y-1 text-xs font-medium sm:col-span-2">
                    Lead time (days)
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={items[item.id]?.lead ?? ""}
                      onChange={(event) =>
                        updateItem(item.id, "lead", event.target.value)
                      }
                    />
                  </label>
                  <label className="space-y-1 text-xs font-medium sm:col-span-2">
                    Remarks
                    <textarea
                      className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      maxLength={1000}
                      value={items[item.id]?.remarks ?? ""}
                      onChange={(event) =>
                        updateItem(item.id, "remarks", event.target.value)
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit quotation"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuotationDetail({
  quotation,
  onClose,
}: {
  quotation: Quotation | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={Boolean(quotation)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {display(quotation?.quotation_number || quotation?.id)}
          </DialogTitle>
          <DialogDescription>Saved quotation details</DialogDescription>
        </DialogHeader>
        {quotation && (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
              <Info
                label="RFQ"
                value={quotation.rfq?.rfq_number || quotation.rfq_id}
              />
              <Info
                label="Total"
                value={money(
                  quotation.total_amount,
                  quotation.currency_code || "USD",
                )}
              />
              <Info
                label="Submitted"
                value={dateFormat(
                  quotation.submitted_at || quotation.created_at,
                )}
              />
              <Info
                label="Valid until"
                value={dateFormat(quotation.valid_until)}
              />
            </div>
            <div className="divide-y rounded-lg border">
              {(quotation.items ?? []).map((item, index) => (
                <div
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                  key={item.id || item.rfq_item_id || index}
                >
                  <span>
                    Item {index + 1} · qty{" "}
                    {display(String(item.quoted_quantity))}
                  </span>
                  <span className="font-medium">
                    {money(item.line_total, quotation.currency_code || "USD")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{display(value)}</p>
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <main className="min-h-full bg-muted/20">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Supplier management
          </h1>
          <p className="text-sm text-muted-foreground">
            Govern relationships and respond to eligible procurement requests.
          </p>
        </div>
        <Tabs defaultValue="governance">
          <TabsList>
            <TabsTrigger value="governance">
              <Building2 />
              Governance
            </TabsTrigger>
            <TabsTrigger value="portal">
              <Sparkles />
              Supplier portal
            </TabsTrigger>
          </TabsList>
          <TabsContent value="governance" className="pt-6">
            <Governance />
          </TabsContent>
          <TabsContent value="portal" className="pt-6">
            <Portal />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
