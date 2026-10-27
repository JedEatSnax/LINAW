"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createColumns,
  type ApprovalWorkflow,
} from "@/app/(protected-routes)/approval-workflows/column-definitions";
import {
  ApprovalWorkflowApiError,
  createWorkflowDefinition,
  createWorkflowLevel,
  getApprovalRequest,
  getApprovalRequests,
  getWorkflowDefinitions,
  submitApprovalDecision,
  type ApprovalRequest,
  type WorkflowDefinition,
} from "@/app/api/approval-workflow/client";
import {
  getRoles,
  type OrganizationRole,
} from "@/app/api/organization-administration/client";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
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

function toApprovalWorkflow(request: ApprovalRequest): ApprovalWorkflow {
  const status = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELLED: "Cancelled",
  } as const;

  return {
    id: request.id,
    request: request.request,
    requester: request.requester,
    approvalLevel: request.currentLevel,
    price: request.amount,
    currencyCode: request.currencyCode,
    date: request.submittedAt,
    status: status[request.status],
  };
}

export default function ApprovalWorkflowsPage() {
  const [statusFilter, setStatusFilter] = useState<
    ApprovalRequest["status"] | undefined
  >();
  const [data, setData] = useState<ApprovalWorkflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<ApprovalRequest | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [rejectionTarget, setRejectionTarget] =
    useState<ApprovalWorkflow | null>(null);
  const [rejectionRemarks, setRejectionRemarks] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [workflowDefinitions, setWorkflowDefinitions] = useState<
    WorkflowDefinition[]
  >([]);
  const [roles, setRoles] = useState<OrganizationRole[]>([]);
  const [configurationError, setConfigurationError] = useState<string | null>(
    null,
  );
  const [isConfigurationLoading, setIsConfigurationLoading] = useState(false);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({
    workflow_code: "",
    name: "",
    description: "",
    entity_type: "purchase_requisition",
  });
  const [levelForm, setLevelForm] = useState({
    workflow_code: "",
    level_no: "1",
    role_code: "",
    min_amount: "0",
    max_amount: "0",
    is_required: true,
  });

  async function loadRequests(filter = statusFilter) {
    setIsLoading(true);
    setError(null);

    try {
      const requests = await getApprovalRequests(filter);
      setData(requests.map(toApprovalWorkflow));
    } catch (requestError: unknown) {
      if (
        requestError instanceof ApprovalWorkflowApiError &&
        requestError.status === 401
      ) {
        window.location.assign("/login");
        return;
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load approval workflows.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, [statusFilter]);

  useEffect(() => {
    getWorkflowDefinitions()
      .then(setWorkflowDefinitions)
      .catch(() => undefined);
    getRoles()
      .then(setRoles)
      .catch(() => undefined);
  }, []);

  async function viewDetails(workflow: ApprovalWorkflow) {
    setDetailError(null);
    setSelectedRequest(null);
    setIsDetailLoading(true);

    try {
      setSelectedRequest(await getApprovalRequest(workflow.id));
    } catch (requestError: unknown) {
      setDetailError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load workflow details.",
      );
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function decide(
    workflow: ApprovalWorkflow,
    decision: "approve" | "reject",
    remarks?: string,
  ) {
    setActionError(null);
    setIsActionLoading(true);

    try {
      await submitApprovalDecision(workflow.id, decision, remarks);
      setRejectionTarget(null);
      setRejectionRemarks("");
      await loadRequests();
    } catch (requestError: unknown) {
      if (
        requestError instanceof ApprovalWorkflowApiError &&
        requestError.status === 401
      ) {
        window.location.assign("/login");
        return;
      }
      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to complete the approval action.",
      );
    } finally {
      setIsActionLoading(false);
    }
  }

  async function submitWorkflow(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfigurationError(null);
    setIsConfigurationLoading(true);
    try {
      await createWorkflowDefinition({
        ...workflowForm,
        description: workflowForm.description || undefined,
      });
      setWorkflowDialogOpen(false);
      setWorkflowForm({
        workflow_code: "",
        name: "",
        description: "",
        entity_type: "purchase_requisition",
      });
      const definitions = await getWorkflowDefinitions();
      setWorkflowDefinitions(definitions);
    } catch (requestError: unknown) {
      setConfigurationError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create workflow definition.",
      );
    } finally {
      setIsConfigurationLoading(false);
    }
  }

  async function submitLevel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const levelNo = Number(levelForm.level_no);
    const minAmount = Number(levelForm.min_amount);
    const maxAmount = Number(levelForm.max_amount);
    if (
      !Number.isInteger(levelNo) ||
      levelNo < 1 ||
      !Number.isFinite(minAmount) ||
      !Number.isFinite(maxAmount) ||
      minAmount < 0 ||
      maxAmount < minAmount ||
      !levelForm.workflow_code ||
      !levelForm.role_code.trim()
    ) {
      setConfigurationError(
        "Enter a valid workflow, role, level, and non-overlapping amount range.",
      );
      return;
    }

    setConfigurationError(null);
    setIsConfigurationLoading(true);
    try {
      await createWorkflowLevel({
        workflow_code: levelForm.workflow_code,
        level_no: levelNo,
        role_code: levelForm.role_code.trim(),
        min_amount: minAmount,
        max_amount: maxAmount,
        is_required: levelForm.is_required,
      });
      setLevelDialogOpen(false);
      setLevelForm({
        ...levelForm,
        level_no: String(levelNo + 1),
        role_code: "",
      });
    } catch (requestError: unknown) {
      setConfigurationError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create workflow level.",
      );
    } finally {
      setIsConfigurationLoading(false);
    }
  }

  const columns = useMemo(
    () =>
      createColumns({
        onView: viewDetails,
        onApprove: (workflow) => void decide(workflow, "approve"),
        onReject: (workflow) => {
          setActionError(null);
          setRejectionRemarks("");
          setRejectionTarget(workflow);
        },
      }),
    [statusFilter],
  );

  const filters: Array<{ label: string; value?: ApprovalRequest["status"] }> = [
    { label: "All requests" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <main className="min-h-[calc(100svh-var(--header-height))]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <header className="border-b border-slate-200/80 pb-5 dark:border-slate-800">
          <div className="mb-2 flex items-center gap-2 text-sm">
            <span>Procurement</span>
            <span aria-hidden="true">/</span>
            <span className="font-medium">Approval workflows</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">
            Approval workflows
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6">
            Review purchase requisitions currently routed to your approval
            level.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setWorkflowDialogOpen(true)}
            >
              New workflow definition
            </Button>
            <Button variant="outline" onClick={() => setLevelDialogOpen(true)}>
              Add approval level
            </Button>
          </div>
        </header>

        <section className="rounded-xl border border-slate-200/80 pb-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:border-slate-800">
          <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-5 pt-4 sm:px-6 dark:border-slate-800">
            {filters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={`whitespace-nowrap border-b-2 px-1 pb-4 text-xs font-medium transition-colors ${
                  statusFilter === filter.value
                    ? "border-[#1c63f2]"
                    : "border-transparent"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {error && (
            <div
              className="border-b border-amber-200 px-5 py-3 text-sm text-destructive sm:px-6"
              role="alert"
            >
              {error}
            </div>
          )}
          {actionError && !rejectionTarget && (
            <div
              className="border-b border-amber-200 px-5 py-3 text-sm text-destructive sm:px-6"
              role="alert"
            >
              {actionError}
            </div>
          )}
          {isLoading ? (
            <p className="px-6 py-12 text-center text-sm">
              Loading approval workflows...
            </p>
          ) : error ? null : (
            <DataTable
              columns={columns}
              data={data}
              searchKey="request"
              searchPlaceholder="Search requests..."
              density="comfortable"
            />
          )}
        </section>
      </div>

      <Dialog
        open={
          Boolean(selectedRequest) || isDetailLoading || Boolean(detailError)
        }
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setDetailError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Approval request details</DialogTitle>
            <DialogDescription>
              Review the request and its recorded approval actions.
            </DialogDescription>
          </DialogHeader>
          {isDetailLoading ? (
            <p>Loading request details...</p>
          ) : detailError ? (
            <p className="text-destructive" role="alert">
              {detailError}
            </p>
          ) : selectedRequest ? (
            <div className="grid gap-4 text-sm">
              <div className="grid gap-1">
                <span className="text-xs">Request</span>
                <strong>{selectedRequest.request}</strong>
                <span className="font-mono text-xs">
                  {selectedRequest.entityId}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs">Requester</span>
                  <strong>{selectedRequest.requester}</strong>
                </div>
                <div>
                  <span className="block text-xs">Status</span>
                  <strong>{selectedRequest.status}</strong>
                </div>
                <div>
                  <span className="block text-xs">Current level</span>
                  <strong>L{selectedRequest.currentLevel}</strong>
                </div>
                <div>
                  <span className="block text-xs">Submitted</span>
                  <strong>{selectedRequest.submittedAt}</strong>
                </div>
              </div>
              {selectedRequest.actions.length > 0 && (
                <div className="grid gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                  <span className="text-xs font-semibold">Activity</span>
                  {selectedRequest.actions.map((action) => (
                    <div
                      key={action.id}
                      className="flex justify-between gap-3 text-xs"
                    >
                      <span>
                        {action.action} by {action.actor}
                      </span>
                      <span>{action.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Close</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(rejectionTarget)}
        onOpenChange={(open) => !open && setRejectionTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject approval request</DialogTitle>
            <DialogDescription>
              Rejection remarks are required by the approval API.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <label htmlFor="rejection-remarks" className="text-sm font-medium">
              Remarks
            </label>
            <Input
              id="rejection-remarks"
              value={rejectionRemarks}
              onChange={(event) => setRejectionRemarks(event.target.value)}
              placeholder="Explain why this request cannot be approved"
              maxLength={1000}
            />
          </div>
          {actionError && (
            <p className="text-sm text-destructive" role="alert">
              {actionError}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button
              variant="destructive"
              disabled={
                !rejectionRemarks.trim() || isActionLoading || !rejectionTarget
              }
              onClick={() =>
                rejectionTarget &&
                void decide(rejectionTarget, "reject", rejectionRemarks.trim())
              }
            >
              {isActionLoading ? "Rejecting..." : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={workflowDialogOpen} onOpenChange={setWorkflowDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create workflow definition</DialogTitle>
            <DialogDescription>
              Define a tenant-owned workflow that approval requests can use.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={submitWorkflow}>
            <label className="grid gap-2 text-sm">
              Workflow code
              <Input
                required
                pattern="[A-Z0-9_]+"
                maxLength={100}
                value={workflowForm.workflow_code}
                onChange={(event) =>
                  setWorkflowForm({
                    ...workflowForm,
                    workflow_code: event.target.value.toUpperCase(),
                  })
                }
                placeholder="PURCHASE_REQUISITION_CUSTOM"
              />
            </label>
            <label className="grid gap-2 text-sm">
              Name
              <Input
                required
                maxLength={150}
                value={workflowForm.name}
                onChange={(event) =>
                  setWorkflowForm({ ...workflowForm, name: event.target.value })
                }
              />
            </label>
            <label className="grid gap-2 text-sm">
              Entity type
              <Input
                required
                maxLength={100}
                value={workflowForm.entity_type}
                onChange={(event) =>
                  setWorkflowForm({
                    ...workflowForm,
                    entity_type: event.target.value,
                  })
                }
              />
            </label>
            <label className="grid gap-2 text-sm">
              Description
              <Input
                maxLength={1000}
                value={workflowForm.description}
                onChange={(event) =>
                  setWorkflowForm({
                    ...workflowForm,
                    description: event.target.value,
                  })
                }
              />
            </label>
            {configurationError && (
              <p className="text-sm text-destructive" role="alert">
                {configurationError}
              </p>
            )}
            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                }
              />
              <Button type="submit" disabled={isConfigurationLoading}>
                {isConfigurationLoading ? "Creating..." : "Create workflow"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add approval level</DialogTitle>
            <DialogDescription>
              Assign a role and amount range to an existing workflow.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={submitLevel}>
            <label className="grid gap-2 text-sm">
              Workflow
              <select
                required
                className="h-9 rounded-md border border-input px-2.5 text-sm"
                value={levelForm.workflow_code}
                onChange={(event) =>
                  setLevelForm({
                    ...levelForm,
                    workflow_code: event.target.value,
                  })
                }
              >
                <option value="">Select workflow</option>
                {workflowDefinitions.map((definition) => (
                  <option key={definition.id} value={definition.workflow_code}>
                    {definition.name} ({definition.workflow_code})
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              Role
              <select
                required
                className="h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                value={levelForm.role_code}
                onChange={(event) =>
                  setLevelForm({ ...levelForm, role_code: event.target.value })
                }
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.code}>
                    {role.code} - {role.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="grid gap-2 text-sm">
                Level
                <Input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={levelForm.level_no}
                  onChange={(event) =>
                    setLevelForm({ ...levelForm, level_no: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-2 text-sm">
                Minimum
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={levelForm.min_amount}
                  onChange={(event) =>
                    setLevelForm({
                      ...levelForm,
                      min_amount: event.target.value,
                    })
                  }
                />
              </label>
              <label className="grid gap-2 text-sm">
                Maximum
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={levelForm.max_amount}
                  onChange={(event) =>
                    setLevelForm({
                      ...levelForm,
                      max_amount: event.target.value,
                    })
                  }
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={levelForm.is_required}
                onChange={(event) =>
                  setLevelForm({
                    ...levelForm,
                    is_required: event.target.checked,
                  })
                }
              />{" "}
              Required level
            </label>
            {configurationError && (
              <p className="text-sm text-destructive" role="alert">
                {configurationError}
              </p>
            )}
            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                }
              />
              <Button type="submit" disabled={isConfigurationLoading}>
                {isConfigurationLoading ? "Creating..." : "Add level"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
