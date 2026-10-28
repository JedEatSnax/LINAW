"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleHelpIcon,
  FilePlus2Icon,
  Loader2Icon,
  RefreshCwIcon,
  SendIcon,
  XCircleIcon,
} from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  cancelPurchaseRequisition,
  createPurchaseRequisition,
  getPurchaseRequisition,
  listPurchaseRequisitions,
  PurchaseRequisitionApiError,
  submitPurchaseRequisition,
  type CreatePurchaseRequisitionInput,
  type PurchaseRequisitionDetail,
  type PurchaseRequisitionStatus,
  type PurchaseRequisitionSummary,
} from "@/app/api/purchase-requisition/client";
import {
  getWorkflowDefinitions,
  type WorkflowDefinition,
} from "@/app/api/approval-workflow/client";
import { formatCurrency, supportedCurrencies } from "@/lib/currencies";
import { type DataTableFeatures } from "@/types/data-table-features";

const statusStyles: Record<PurchaseRequisitionStatus, string> = {
  DRAFT:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
  SUBMITTED:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200",
  APPROVED:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
  REJECTED:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200",
  CANCELLED:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const statusLabels: Record<PurchaseRequisitionStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const itemSchema = z.object({
  item_type: z.enum(["GOODS", "SERVICE", "ASSET"]),
  description: z.string().trim().min(1, "Description is required.").max(255),
  specification: z.string().max(1000),
  quantity: z
    .string()
    .min(1, "Quantity is required.")
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) > 0,
      "Quantity must be greater than zero.",
    ),
  unit_of_measure: z.string().trim().min(1, "Unit is required.").max(50),
  estimated_unit_cost: z
    .string()
    .min(1, "Estimated unit cost is required.")
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) >= 0,
      "Cost cannot be negative.",
    ),
});

const formSchema = z.object({
  workflow_code: z.string().min(1, "Approval workflow is required."),
  purpose: z.string().max(500),
  justification: z
    .string()
    .trim()
    .min(10, "Justification must be at least 10 characters.")
    .max(500),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  currency_code: z.string().length(3),
  needed_by_date: z.string(),
  items: z.array(itemSchema).min(1, "Add at least one line item."),
});

type FormItem = {
  item_type: "GOODS" | "SERVICE" | "ASSET";
  description: string;
  specification: string;
  quantity: string;
  unit_of_measure: string;
  estimated_unit_cost: string;
};

type FormState = {
  workflow_code: string;
  purpose: string;
  justification: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  currency_code: string;
  needed_by_date: string;
  items: FormItem[];
};

const emptyForm: FormState & { items: [FormItem, ...FormItem[]] } = {
  workflow_code: "",
  purpose: "",
  justification: "",
  priority: "NORMAL",
  currency_code: "PHP",
  needed_by_date: "",
  items: [
    {
      item_type: "GOODS",
      description: "",
      specification: "",
      quantity: "1",
      unit_of_measure: "EA",
      estimated_unit_cost: "",
    },
  ],
};

function createFormItem(): FormItem {
  return {
    item_type: "GOODS",
    description: "",
    specification: "",
    quantity: "1",
    unit_of_measure: "EA",
    estimated_unit_cost: "",
  };
}

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

function StatusBadge({ status }: { status: PurchaseRequisitionStatus }) {
  return (
    <Badge variant="outline" className={statusStyles[status]}>
      {statusLabels[status]}
    </Badge>
  );
}

function Notice({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
      role="alert"
    >
      <span className="flex items-center gap-2">
        <AlertCircleIcon className="size-4" />
        {error}
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

export default function PurchaseRequisitionsPage() {
  const [requisitions, setRequisitions] = useState<
    PurchaseRequisitionSummary[]
  >([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PurchaseRequisitionDetail | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mutation, setMutation] = useState<
    "create" | "submit" | "cancel" | null
  >(null);
  const [cancelRemarks, setCancelRemarks] = useState("");

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<
      DataTableFeatures,
      PurchaseRequisitionSummary
    >();

    return columnHelper.columns([
      columnHelper.accessor("requisition_number", {
        header: "Requisition",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.requisition_number}</span>
        ),
      }),
      columnHelper.accessor("workflow_code", {
        header: "Workflow",
        cell: ({ row }) => (
          <span className="block max-w-72 truncate text-muted-foreground">
            {row.original.workflow_code ?? "Purchase request"}
          </span>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: "Created",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {dateFormat(row.original.created_at)}
          </span>
        ),
      }),
      columnHelper.accessor("total_estimated_amount", {
        header: "Amount",
        cell: ({ row }) =>
          formatCurrency(
            row.original.total_estimated_amount,
            row.original.currency_code,
          ),
      }),
      columnHelper.accessor("requisition_status", {
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge status={row.original.requisition_status} />
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: () => (
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        ),
      }),
    ]);
  }, []);

  async function loadList() {
    setListLoading(true);
    setListError(null);
    try {
      setRequisitions((await listPurchaseRequisitions()).requisitions);
    } catch (error) {
      setListError(errorMessage(error));
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    void loadList();
    void getWorkflowDefinitions()
      .then((data) =>
        setWorkflows(
          data.filter((item) => item.is_active && item.workflow_code),
        ),
      )
      .catch(() => setWorkflowError("Approval workflows could not be loaded."));

    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") void loadList();
    };

    document.addEventListener("visibilitychange", refreshOnReturn);
    return () =>
      document.removeEventListener("visibilitychange", refreshOnReturn);
  }, []);

  async function openDetail(id: string) {
    setSelected(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      setSelected(await getPurchaseRequisition(id));
    } catch (error) {
      setDetailError(errorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  }

  function updateForm(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
  }

  function updateItem(index: number, field: keyof FormItem, value: string) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
    setFormError(null);
  }

  function resetCreate() {
    setForm({
      ...emptyForm,
      workflow_code: workflows[0]?.workflow_code ?? "",
      items: [createFormItem()],
    });
    setFormError(null);
  }

  async function createDraft() {
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Review the form.");
      return;
    }
    setMutation("create");
    setFormError(null);
    try {
      const input: CreatePurchaseRequisitionInput = {
        ...parsed.data,
        purpose: parsed.data.purpose || undefined,
        needed_by_date: parsed.data.needed_by_date || undefined,
        items: parsed.data.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          estimated_unit_cost: Number(item.estimated_unit_cost),
        })),
      };
      const created = await createPurchaseRequisition(input);
      setRequisitions((current) => [
        created,
        ...current.filter(
          (item) => item.requisition_id !== created.requisition_id,
        ),
      ]);
      setCreateOpen(false);
      resetCreate();
      setNotice(`${created.requisition_number} was created as a draft.`);
      void openDetail(created.requisition_id);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setMutation(null);
    }
  }

  async function submit() {
    if (!selected || selected.requisition_status !== "DRAFT") return;
    setMutation("submit");
    try {
      await submitPurchaseRequisition(selected.requisition_id);
      setNotice("Requisition submitted for approval.");
      await loadList();
      await openDetail(selected.requisition_id);
    } catch (error) {
      setDetailError(errorMessage(error));
    } finally {
      setMutation(null);
    }
  }

  async function cancel() {
    if (!selected || !cancelRemarks.trim()) return;
    setMutation("cancel");
    try {
      await cancelPurchaseRequisition(
        selected.requisition_id,
        cancelRemarks.trim(),
      );
      setCancelOpen(false);
      setCancelRemarks("");
      setNotice("Requisition cancelled.");
      await loadList();
      await openDetail(selected.requisition_id);
    } catch (error) {
      setDetailError(errorMessage(error));
    } finally {
      setMutation(null);
    }
  }

  const total = useMemo(
    () =>
      form.items.reduce(
        (sum, item) =>
          sum +
          Number(item.quantity || 0) * Number(item.estimated_unit_cost || 0),
        0,
      ),
    [form.items],
  );

  return (
    <main className="min-h-[calc(100svh-var(--header-height))] bg-background">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
        <header className="flex flex-col gap-5 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Procurement / Requests
            </p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Purchase requisitions
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Create, track, and move purchase requests through your approval
              workflow.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => {
              resetCreate();
              setCreateOpen(true);
            }}
          >
            <FilePlus2Icon />
            Create purchase requisition
          </Button>
        </header>
        {notice && (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
            <span className="flex items-center gap-2">
              <CheckCircle2Icon className="size-4" />
              {notice}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setNotice(null)}>
              Dismiss
            </Button>
          </div>
        )}
        {listError && (
          <Notice error={listError} onRetry={() => void loadList()} />
        )}
        <section className="overflow-hidden rounded-xl border border-border/70 bg-background/80 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
            <div>
              <h2 className="font-heading text-base font-semibold">
                Your requests
              </h2>
              <p className="text-sm text-muted-foreground">
                {requisitions.length} of the latest 10 requisitions
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => void loadList()}
              aria-label="Refresh requisitions"
            >
              <RefreshCwIcon />
            </Button>
          </div>
          {listLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              Loading requisitions
            </div>
          ) : requisitions.length === 0 && !listError ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <CircleHelpIcon className="size-8 text-muted-foreground" />
              <h3 className="font-heading font-semibold">
                No requisitions yet
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Start a draft request when you have a purchase that needs
                approval.
              </p>
              <Button
                onClick={() => {
                  resetCreate();
                  setCreateOpen(true);
                }}
              >
                <FilePlus2Icon />
                Create your first requisition
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={requisitions}
              enableExport
              searchKey="workflow_code"
              searchPlaceholder="Search workflow code..."
              exportFileName="purchase-requisitions"
              onRowClick={(item) => void openDetail(item.requisition_id)}
              density="comfortable"
            />
          )}
        </section>
      </div>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90svh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create purchase requisition</DialogTitle>
            <DialogDescription>
              Save a complete request as a draft. You can submit it after
              reviewing the details.
            </DialogDescription>
          </DialogHeader>
          {formError && <Notice error={formError} />}
          {workflowError && <Notice error={workflowError} />}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel>
                Approval workflow <span>*</span>
              </FieldLabel>
              <FieldContent>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm"
                  value={form.workflow_code}
                  onChange={(event) =>
                    updateForm("workflow_code", event.target.value)
                  }
                >
                  <option value="">Select a workflow</option>
                  {workflows.map((workflow) => (
                    <option
                      key={workflow.workflow_code}
                      value={workflow.workflow_code}
                    >
                      {workflow.name}
                    </option>
                  ))}
                </select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Purpose</FieldLabel>
              <FieldContent>
                <Input
                  value={form.purpose}
                  onChange={(event) =>
                    updateForm("purpose", event.target.value)
                  }
                  placeholder="What is this purchase for?"
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Priority</FieldLabel>
              <FieldContent>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm"
                  value={form.priority}
                  onChange={(event) =>
                    updateForm("priority", event.target.value)
                  }
                >
                  <option>LOW</option>
                  <option>NORMAL</option>
                  <option>HIGH</option>
                  <option>URGENT</option>
                </select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Currency</FieldLabel>
              <FieldContent>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm"
                  value={form.currency_code}
                  onChange={(event) =>
                    updateForm("currency_code", event.target.value)
                  }
                >
                  {supportedCurrencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.currency}
                    </option>
                  ))}
                </select>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel>Needed by</FieldLabel>
              <FieldContent>
                <Input
                  type="date"
                  value={form.needed_by_date}
                  onChange={(event) =>
                    updateForm("needed_by_date", event.target.value)
                  }
                />
              </FieldContent>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>
                Justification <span>*</span>
              </FieldLabel>
              <FieldContent>
                <textarea
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={form.justification}
                  onChange={(event) =>
                    updateForm("justification", event.target.value)
                  }
                  placeholder="Explain the business need (at least 10 characters)"
                />
              </FieldContent>
            </Field>
          </div>
          <div className="rounded-lg border border-border/70">
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold">Line items</h3>
                <p className="text-xs text-muted-foreground">
                  At least one item is required.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    items: [...current.items, { ...emptyForm.items[0] }],
                  }))
                }
              >
                <FilePlus2Icon />
                Add item
              </Button>
            </div>
            <div className="grid gap-4 p-4">
              {form.items.map((item, index) => (
                <div
                  className="grid gap-3 rounded-md border border-border/70 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_0.65fr_0.8fr_0.9fr]"
                  key={index}
                >
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={item.item_type}
                    onChange={(event) =>
                      updateItem(index, "item_type", event.target.value)
                    }
                    aria-label="Item type"
                  >
                    <option>GOODS</option>
                    <option>SERVICE</option>
                    <option>ASSET</option>
                  </select>
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(event) =>
                      updateItem(index, "description", event.target.value)
                    }
                    aria-label="Item description"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(index, "quantity", event.target.value)
                    }
                    aria-label="Quantity"
                  />
                  <Input
                    placeholder="Unit"
                    value={item.unit_of_measure}
                    onChange={(event) =>
                      updateItem(index, "unit_of_measure", event.target.value)
                    }
                    aria-label="Unit of measure"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.0001"
                    placeholder="Unit cost"
                    value={item.estimated_unit_cost}
                    onChange={(event) =>
                      updateItem(
                        index,
                        "estimated_unit_cost",
                        event.target.value,
                      )
                    }
                    aria-label="Estimated unit cost"
                  />
                  <Input
                    className="sm:col-span-2 lg:col-span-5"
                    placeholder="Specification (optional)"
                    value={item.specification}
                    onChange={(event) =>
                      updateItem(index, "specification", event.target.value)
                    }
                    aria-label="Specification"
                  />
                </div>
              ))}
            </div>
            <div className="border-t border-border/70 px-4 py-3 text-right text-sm font-semibold">
              Estimated total: {formatCurrency(total, form.currency_code)}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={mutation === "create"}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void createDraft()}
              disabled={mutation === "create" || workflows.length === 0}
            >
              {mutation === "create" && (
                <Loader2Icon className="animate-spin" />
              )}
              Create draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(selected) || detailLoading}
        onOpenChange={(open) => {
          if (!open && !mutation) setSelected(null);
        }}
      >
        <DialogContent className="w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] max-h-[90svh] overflow-y-auto p-4 sm:!max-w-5xl sm:p-6">
          <DialogHeader className="min-w-0 pr-12 sm:pr-16">
            <DialogTitle className="min-w-0 truncate">
              {detailLoading
                ? "Loading requisition"
                : selected?.requisition_number}
            </DialogTitle>
            <DialogDescription>
              Purchase requisition details and workflow actions.
            </DialogDescription>
            {!detailLoading && selected && (
              <div className="pt-1">
                <StatusBadge status={selected.requisition_status} />
              </div>
            )}
          </DialogHeader>
          {detailError && (
            <Notice
              error={detailError}
              onRetry={() =>
                selected && void openDetail(selected.requisition_id)
              }
            />
          )}
          {detailLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              Loading details
            </div>
          ) : (
            selected && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Info
                    label="Created"
                    value={dateFormat(selected.created_at)}
                  />
                  <Info label="Priority" value={display(selected.priority)} />
                  <Info
                    label="Total"
                    value={formatCurrency(
                      selected.total_estimated_amount,
                      selected.currency_code,
                    )}
                  />
                </div>
                <div className="grid gap-4 rounded-lg border border-border/70 p-4 sm:grid-cols-2">
                  <Info label="Purpose" value={display(selected.purpose)} />
                  <Info
                    label="Needed by"
                    value={dateFormat(selected.needed_by_date)}
                  />
                  <div className="sm:col-span-2">
                    <Info
                      label="Justification"
                      value={display(selected.justification)}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold">
                    Requested items
                  </h3>
                  <div className="divide-y rounded-lg border border-border/70">
                    {(selected.items ?? selected.line_items ?? []).map(
                      (item, index) => (
                        <div
                          className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3 text-sm"
                          key={`${item.description}-${index}`}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {item.description}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.item_type} / {item.unit_of_measure}{" "}
                              {item.specification
                                ? `· ${item.specification}`
                                : ""}
                            </p>
                          </div>
                          <p className="shrink-0 text-muted-foreground">
                            {item.quantity} ×{" "}
                            {formatCurrency(
                              item.estimated_unit_cost,
                              selected.currency_code,
                            )}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
                <DialogFooter className="mt-2 flex-wrap border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
                  {(selected.requisition_status === "DRAFT" ||
                    selected.requisition_status === "SUBMITTED") && (
                    <Button
                      className="w-full sm:w-auto"
                      variant="destructive"
                      onClick={() => setCancelOpen(true)}
                      disabled={Boolean(mutation)}
                    >
                      <XCircleIcon />
                      Cancel requisition
                    </Button>
                  )}
                  {selected.requisition_status === "DRAFT" && (
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => void submit()}
                      disabled={Boolean(mutation)}
                    >
                      <SendIcon />
                      {mutation === "submit"
                        ? "Submitting..."
                        : "Submit for approval"}
                    </Button>
                  )}
                  {selected.requisition_status !== "DRAFT" &&
                    selected.requisition_status !== "SUBMITTED" && (
                      <span className="text-xs text-muted-foreground">
                        No actions are available for this status.
                      </span>
                    )}
                </DialogFooter>
              </>
            )
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel requisition?</DialogTitle>
            <DialogDescription>
              This changes the workflow status to CANCELLED. The record will not
              be deleted.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel>
              Reason <span>*</span>
            </FieldLabel>
            <FieldContent>
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={cancelRemarks}
                onChange={(event) => setCancelRemarks(event.target.value)}
                placeholder="Why is this request no longer needed?"
                maxLength={500}
              />
            </FieldContent>
          </Field>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={mutation === "cancel"}
            >
              Keep requisition
            </Button>
            <Button
              variant="destructive"
              onClick={() => void cancel()}
              disabled={
                mutation === "cancel" || cancelRemarks.trim().length === 0
              }
            >
              {mutation === "cancel" && (
                <Loader2Icon className="animate-spin" />
              )}
              Cancel requisition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
function errorMessage(error: unknown) {
  return error instanceof PurchaseRequisitionApiError
    ? error.message
    : "Something went wrong. Please try again.";
}
