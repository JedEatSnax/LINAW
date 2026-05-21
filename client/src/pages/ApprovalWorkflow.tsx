import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useEffect, useState, type CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, Plus, Eye, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface Submission {
  submission_id: number
  proposalType: string
  status: "draft" | "submitted" | "approved" | "rejected" | "changes-requested"
  owner: string
  fileName?: string
  fileSize?: number
  remarks?: string
  created_at: string
  updated_at?: string
}

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: AlertCircle },
  submitted: {
    label: "Submitted",
    color: "bg-blue-100 text-blue-800",
    icon: FileText,
  },
  "changes-requested": {
    label: "Changes Requested",
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertCircle,
  },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
}

export default function ApprovalWorkflow() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    type: "approve" | "reject" | "request-changes" | null
    submission: Submission | null
  }>({ type: null, submission: null })

  // Form state
  const [formData, setFormData] = useState({
    proposalType: "",
    fileName: "",
  })

  const [actionRemarks, setActionRemarks] = useState("")


  // Load submissions on mount
  useEffect(() => {
    const loadSubmissions = async () => {
      setLoading(true)
      setError(null)
      try {
        // Mock data for demo (backendUrl can be used for real API calls)
        setSubmissions([
          {
            submission_id: 1,
            proposalType: "capex-request",
            status: "submitted",
            owner: "John Doe",
            fileName: "capex-2026.pdf",
            fileSize: 2048000,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            submission_id: 2,
            proposalType: "budget-allocation",
            status: "approved",
            owner: "Jane Smith",
            fileName: "budget-q2-2026.docx",
            fileSize: 1024000,
            remarks: "Approved. Please proceed with implementation.",
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            submission_id: 3,
            proposalType: "vendor-onboarding",
            status: "changes-requested",
            owner: "Bob Johnson",
            fileName: "vendor-proposal.pdf",
            fileSize: 512000,
            remarks: "Please clarify the pricing structure and provide references.",
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            submission_id: 4,
            proposalType: "policy-update",
            status: "draft",
            owner: "Alice Wilson",
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load submissions")
      } finally {
        setLoading(false)
      }
    }

    loadSubmissions()
  }, [])

  const handleCreateSubmission = async () => {
    try {
      setError(null)
      if (!formData.proposalType) {
        setError("Please select a proposal type")
        return
      }

      const newSubmission: Submission = {
        submission_id: Math.max(...submissions.map((s) => s.submission_id), 0) + 1,
        proposalType: formData.proposalType,
        status: "draft",
        owner: "Current User",
        fileName: formData.fileName || undefined,
        created_at: new Date().toISOString(),
      }

      setSubmissions((prev) => [newSubmission, ...prev])
      setFormData({ proposalType: "", fileName: "" })
      setIsDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create submission")
    }
  }

  const handleSubmitForApproval = (submission: Submission) => {
    const updated = { ...submission, status: "submitted" as const }
    setSubmissions((prev) =>
      prev.map((s) => (s.submission_id === submission.submission_id ? updated : s))
    )
    setViewingSubmission(updated)
  }

  const handleApprovalAction = (
    type: "approve" | "reject" | "request-changes",
    submission: Submission
  ) => {
    setActionDialog({ type, submission })
  }

  const confirmAction = () => {
    if (!actionDialog.submission || !actionDialog.type) return

    let newStatus: Submission["status"]
    switch (actionDialog.type) {
      case "approve":
        newStatus = "approved"
        break
      case "reject":
        newStatus = "rejected"
        break
      case "request-changes":
        newStatus = "changes-requested"
        break
    }

    const updated = {
      ...actionDialog.submission,
      status: newStatus,
      remarks: actionRemarks,
    }

    setSubmissions((prev) =>
      prev.map((s) => (s.submission_id === actionDialog.submission!.submission_id ? updated : s))
    )

    if (viewingSubmission?.submission_id === actionDialog.submission.submission_id) {
      setViewingSubmission(updated)
    }

    setActionDialog({ type: null, submission: null })
    setActionRemarks("")
  }

  const getStatusIcon = (status: Submission["status"]) => {
    const Icon = STATUS_CONFIG[status].icon
    return <Icon className="h-4 w-4 inline mr-1" />
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Approval Workflow" />
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Approval Workflow</h1>
              <p className="text-muted-foreground mt-1">
                Manage document submissions and approvals
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New Submission
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <form onSubmit={(e) => { e.preventDefault(); void handleCreateSubmission(); }} noValidate>
                  <DialogHeader>
                    <DialogTitle>Create New Submission</DialogTitle>
                    <DialogDescription>Create a new proposal or document for approval</DialogDescription>
                  </DialogHeader>

                  <FieldGroup className="gap-4 py-4">
                    <Field>
                      <Label htmlFor="proposal-type">Proposal Type *</Label>
                      <Select value={formData.proposalType} onValueChange={(value) => setFormData({ ...formData, proposalType: value })}>
                        <SelectTrigger id="proposal-type">
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="capex-request">Capital Expenditure Request</SelectItem>
                          <SelectItem value="budget-allocation">Budget Allocation</SelectItem>
                          <SelectItem value="vendor-onboarding">Vendor Onboarding</SelectItem>
                          <SelectItem value="policy-update">Policy Update</SelectItem>
                          <SelectItem value="contract-review">Contract Review</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <Label htmlFor="file-name">File Name (Optional)</Label>
                      <Input id="file-name" placeholder="proposal.pdf" value={formData.fileName} onChange={(e) => setFormData({ ...formData, fileName: e.target.value })} />
                    </Field>

                    {error ? (
                      <div className="max-h-28 overflow-y-auto rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm whitespace-pre-wrap text-red-700">{error}</div>
                    ) : null}
                  </FieldGroup>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button">Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Create Submission</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {error && !isDialogOpen && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700 text-sm">{error}</div>
          )}

          <div className="rounded-lg border bg-card text-card-foreground">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">No submissions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Proposal Type</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.submission_id}>
                      <TableCell className="font-medium">#{submission.submission_id}</TableCell>
                      <TableCell>{submission.proposalType.replace(/-/g, " ")}</TableCell>
                      <TableCell>{submission.owner}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_CONFIG[submission.status].color}>
                          {getStatusIcon(submission.status)}
                          {STATUS_CONFIG[submission.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingSubmission(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Submission Detail Dialog */}
          <Dialog open={!!viewingSubmission} onOpenChange={() => setViewingSubmission(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Submission #{viewingSubmission?.submission_id}</DialogTitle>
              </DialogHeader>

              {viewingSubmission && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Proposal Type</p>
                      <p className="font-medium">
                        {viewingSubmission.proposalType.replace(/-/g, " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className={STATUS_CONFIG[viewingSubmission.status].color}>
                        {getStatusIcon(viewingSubmission.status)}
                        {STATUS_CONFIG[viewingSubmission.status].label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Owner</p>
                      <p className="font-medium">{viewingSubmission.owner}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {new Date(viewingSubmission.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {viewingSubmission.fileName && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Attachment</p>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{viewingSubmission.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {(viewingSubmission.fileSize || 0) / 1024 / 1024} MB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {viewingSubmission.remarks && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Remarks</p>
                      <p className="text-sm p-2 bg-gray-50 rounded">{viewingSubmission.remarks}</p>
                    </div>
                  )}

                  {viewingSubmission.status === "draft" && (
                    <div className="border-t pt-4">
                      <Button
                        className="w-full"
                        onClick={() => handleSubmitForApproval(viewingSubmission)}
                      >
                        Submit for Approval
                      </Button>
                    </div>
                  )}

                  {viewingSubmission.status === "submitted" && (
                    <div className="border-t pt-4 space-y-2">
                      <Button
                        className="w-full"
                        variant="default"
                        onClick={() => handleApprovalAction("approve", viewingSubmission)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleApprovalAction("request-changes", viewingSubmission)}
                      >
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Request Changes
                      </Button>
                      <Button
                        className="w-full"
                        variant="destructive"
                        onClick={() => handleApprovalAction("reject", viewingSubmission)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {(viewingSubmission.status === "changes-requested" ||
                    viewingSubmission.status === "rejected") && (
                    <div className="border-t pt-4">
                      <Button className="w-full" variant="outline">
                        Resubmit
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Action Dialog */}
          <Dialog
            open={actionDialog.type !== null}
            onOpenChange={(open) => {
              if (!open) setActionDialog({ type: null, submission: null })
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {actionDialog.type === "approve" && "Approve Submission"}
                  {actionDialog.type === "reject" && "Reject Submission"}
                  {actionDialog.type === "request-changes" && "Request Changes"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Field>
                  <Label htmlFor="remarks">Remarks *</Label>
                  <textarea
                    id="remarks"
                    placeholder="Enter your remarks..."
                    value={actionRemarks}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionRemarks(e.target.value)}
                    className="min-h-[100px] w-full px-3 py-2 border rounded-md border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={4}
                  />
                </Field>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={confirmAction}
                  variant={actionDialog.type === "reject" ? "destructive" : "default"}
                >
                  {actionDialog.type === "approve" && "Approve"}
                  {actionDialog.type === "reject" && "Reject"}
                  {actionDialog.type === "request-changes" && "Request Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
