import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cancelInvite, generateInviteLink, getAcceptedMembers, getPendingInvites, removeMember, resendInvite, resolveOrganizationId } from "@/services/memberService"
import type { Invite, Member } from "@/types/member.types"
import {
  Copy,
  Eye,
  Link2,
  Loader2,
  MailPlus,
  Search,
  Trash2,
  UserRound,
  Users,
  RefreshCw,
} from "lucide-react"
import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

const PAGE_SIZE = 5

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function badgeTone(status: string) {
  switch (status) {
    case "pending":
    case "available":
      return "secondary"
    case "active":
    case "accepted":
      return "default"
    case "revoked":
    case "expired":
    case "inactive":
      return "destructive"
    default:
      return "outline"
  }
}

function toInviteLinkStatusLabel(status: Invite["inviteLinkStatus"]) {
  switch (status) {
    case "available":
      return "Available"
    case "accepted":
      return "Accepted"
    case "expired":
      return "Expired"
    case "revoked":
      return "Revoked"
    default:
      return "Missing"
  }
}

function TableSkeletonRows({ columns = 5 }: { columns?: number }) {
  return (
    <>
      {Array.from({ length: PAGE_SIZE }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <TableCell key={columnIndex}>
              <Skeleton className="h-4 w-full max-w-[180px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export default function AddUser() {
  const navigate = useNavigate()

  const [pendingInvites, setPendingInvites] = useState<Invite[]>([])
  const [acceptedMembers, setAcceptedMembers] = useState<Member[]>([])
  const [isLoadingPending, setIsLoadingPending] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [isInviteLinkDialogOpen, setIsInviteLinkDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [memberSearch, setMemberSearch] = useState("")
  const [memberRoleFilter, setMemberRoleFilter] = useState("all")
  const [pendingPage, setPendingPage] = useState(1)
  const [memberPage, setMemberPage] = useState(1)
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      setError(null)
      setIsLoadingPending(true)
      setIsLoadingMembers(true)

      try {
        await resolveOrganizationId()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Organization context is missing"
        if (!cancelled) {
          setError(message)
          toast.error(message)
        }
        return
      }

      const [pendingResult, memberResult] = await Promise.allSettled([
        getPendingInvites(),
        getAcceptedMembers(),
      ])

      if (cancelled) {
        return
      }

      if (pendingResult.status === "fulfilled") {
        setPendingInvites(pendingResult.value)
      } else {
        const message = pendingResult.reason instanceof Error ? pendingResult.reason.message : "Failed to load pending invites"
        setError(message)
        toast.error(message)
        if ((pendingResult.reason as { status?: number } | undefined)?.status === 401) {
          navigate("/login", { replace: true })
        }
      }

      if (memberResult.status === "fulfilled") {
        setAcceptedMembers(memberResult.value)
      } else {
        const message = memberResult.reason instanceof Error ? memberResult.reason.message : "Failed to load members"
        setError((current) => current ?? message)
        toast.error(message)
        if ((memberResult.reason as { status?: number } | undefined)?.status === 401) {
          navigate("/login", { replace: true })
        }
      }

      setIsLoadingPending(false)
      setIsLoadingMembers(false)
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [navigate])

  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase()

    return acceptedMembers.filter((member) => {
      const matchesQuery =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)

      const matchesRole = memberRoleFilter === "all" || member.role.toLowerCase() === memberRoleFilter

      return matchesQuery && matchesRole
    })
  }, [acceptedMembers, memberRoleFilter, memberSearch])

  const pendingPageCount = Math.max(1, Math.ceil(pendingInvites.length / PAGE_SIZE))
  const memberPageCount = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE))
  const safePendingPage = Math.min(pendingPage, pendingPageCount)
  const safeMemberPage = Math.min(memberPage, memberPageCount)
  const pendingPageItems = pendingInvites.slice((safePendingPage - 1) * PAGE_SIZE, safePendingPage * PAGE_SIZE)
  const memberPageItems = filteredMembers.slice((safeMemberPage - 1) * PAGE_SIZE, safeMemberPage * PAGE_SIZE)

  async function copyText(value: string, inviteId?: string) {
    try {
      await navigator.clipboard.writeText(value)
      if (inviteId) {
        setCopiedInviteId(inviteId)
        window.setTimeout(() => setCopiedInviteId((current) => (current === inviteId ? null : current)), 1500)
      }
      toast.success("Invite link copied")
    } catch {
      toast.error("Unable to copy invite link")
    }
  }

  async function refreshTables() {
    const [pendingResult, memberResult] = await Promise.allSettled([getPendingInvites(), getAcceptedMembers()])

    if (pendingResult.status === "fulfilled") {
      setPendingInvites(pendingResult.value)
    }

    if (memberResult.status === "fulfilled") {
      setAcceptedMembers(memberResult.value)
    }
  }

  async function handleGenerateInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsGeneratingLink(true)

    try {
      const response = await generateInviteLink({
        email: inviteEmail,
        role: inviteRole,
      })

      setPendingInvites((current) => [response.invite, ...current.filter((invite) => invite.id !== response.invite.id)])
      setInviteLink(response.inviteLink)
      setIsGenerateDialogOpen(false)
      setIsInviteLinkDialogOpen(true)
      toast.success("Invite link generated!")

      if (response.inviteLink) {
        await copyText(response.inviteLink, response.inviteId)
      }

      setInviteEmail("")
      setInviteRole("member")
      void refreshTables()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate invite link"
      setError(message)
      toast.error(message)

      if ((err as { status?: number } | undefined)?.status === 401) {
        navigate("/login", { replace: true })
      }
    } finally {
      setIsGeneratingLink(false)
    }
  }

  async function handleResendInvite(invite: Invite) {
    setError(null)
    try {
      const response = await resendInvite(invite.id)
      setPendingInvites((current) => current.map((item) => (item.id === invite.id ? response.invite : item)))
      setInviteLink(response.inviteLink)
      setIsInviteLinkDialogOpen(true)
      toast.success("Invite link generated!")

      if (response.inviteLink) {
        await copyText(response.inviteLink, response.inviteId)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend invite"
      setError(message)
      toast.error(message)
      if ((err as { status?: number } | undefined)?.status === 401) {
        navigate("/login", { replace: true })
      }
    }
  }

  async function handleCancelInvite(inviteId: string) {
    if (!window.confirm("Cancel this invite? This cannot be undone.")) {
      return
    }

    try {
      await cancelInvite(inviteId)
      setPendingInvites((current) => current.filter((invite) => invite.id !== inviteId))
      toast.success("Invite cancelled")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel invite"
      setError(message)
      toast.error(message)
      if ((err as { status?: number } | undefined)?.status === 401) {
        navigate("/login", { replace: true })
      }
    }
  }

  async function handleRemoveMember(member: Member) {
    if (!window.confirm(`Remove ${member.name}?`)) {
      return
    }

    try {
      await removeMember(member.userId)
      setAcceptedMembers((current) => current.filter((item) => item.userId !== member.userId))
      toast.success("Member removed")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove member"
      setError(message)
      toast.error(message)
      if ((err as { status?: number } | undefined)?.status === 401) {
        navigate("/login", { replace: true })
      }
    }
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Members" />
        <main className="flex flex-1 flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.16),_transparent_30%)]" />
            <div className="relative flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
                  <Users className="h-3.5 w-3.5" />
                  Organization member management
                </div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Add and manage invitees</h1>
                <p className="max-w-xl text-sm text-white/72 sm:text-base">
                  Create invite links, monitor pending invitations, and review accepted members from one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsGenerateDialogOpen(true)}
                  className="bg-white text-slate-950 hover:bg-white/90"
                >
                  <MailPlus className="mr-2 h-4 w-4" />
                  Generate Invite Link
                </Button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Pending User Invites</h2>
                  <p className="text-sm text-muted-foreground">Invites that have been sent but not yet accepted.</p>
                </div>
                <Badge variant="outline">{pendingInvites.length} total</Badge>
              </div>

              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email/Username</TableHead>
                      <TableHead>Invite sent</TableHead>
                      <TableHead>Link status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPending ? (
                      <TableSkeletonRows columns={4} />
                    ) : pendingPageItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                          No pending invites
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingPageItems.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{invite.email}</div>
                              <div className="text-xs text-muted-foreground">Role: {invite.role}</div>
                            </div>
                          </TableCell>
                          <TableCell>{formatDateTime(invite.sentAt)}</TableCell>
                          <TableCell>
                            <Badge variant={badgeTone(invite.inviteLinkStatus)}>
                              {toInviteLinkStatusLabel(invite.inviteLinkStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button type="button" size="sm" variant="outline" onClick={() => void handleResendInvite(invite)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Resend invite
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => void copyText(invite.inviteLink ?? "", invite.id)}
                                disabled={!invite.inviteLink}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                {copiedInviteId === invite.id ? "Copied" : "Copy link"}
                              </Button>
                              <Button type="button" size="sm" variant="destructive" onClick={() => void handleCancelInvite(invite.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Cancel invite
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {pendingInvites.length === 0 ? 0 : (safePendingPage - 1) * PAGE_SIZE + 1} to {Math.min(safePendingPage * PAGE_SIZE, pendingInvites.length)} of {pendingInvites.length}
                </span>
                {pendingPageCount > 1 ? (
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setPendingPage((value) => Math.max(1, value - 1))} disabled={pendingPage <= 1}>
                      Previous
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setPendingPage((value) => Math.min(pendingPageCount, value + 1))} disabled={pendingPage >= pendingPageCount}>
                      Next
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Accepted Invites</h2>
                  <p className="text-sm text-muted-foreground">Members who accepted an invitation and can now access the organization.</p>
                </div>
                <Badge variant="outline">{acceptedMembers.length} total</Badge>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={memberSearch}
                    onChange={(event) => setMemberSearch(event.target.value)}
                    placeholder="Search name, email, or role"
                    className="pl-9"
                    aria-label="Search members"
                  />
                </div>
                <div>
                  <Select value={memberRoleFilter} onValueChange={setMemberRoleFilter}>
                    <SelectTrigger className="w-full" aria-label="Filter members by role">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name/Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingMembers ? (
                      <TableSkeletonRows columns={5} />
                    ) : memberPageItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          No members yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      memberPageItems.map((member) => (
                        <TableRow key={member.userId}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{member.name}</div>
                              <div className="text-xs text-muted-foreground">{member.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{member.role}</Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(member.joinedAt)}</TableCell>
                          <TableCell>
                            <Badge variant={badgeTone(member.status)}>{member.status === "active" ? "Active" : "Inactive"}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button type="button" size="sm" variant="outline" onClick={() => setSelectedMember(member)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View profile
                              </Button>
                              <Button type="button" size="sm" variant="destructive" onClick={() => void handleRemoveMember(member)}>
                                <UserRound className="mr-2 h-4 w-4" />
                                Remove member
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {filteredMembers.length === 0 ? 0 : (safeMemberPage - 1) * PAGE_SIZE + 1} to {Math.min(safeMemberPage * PAGE_SIZE, filteredMembers.length)} of {filteredMembers.length}
                </span>
                {memberPageCount > 1 ? (
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setMemberPage((value) => Math.max(1, value - 1))} disabled={memberPage <= 1}>
                      Previous
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setMemberPage((value) => Math.min(memberPageCount, value + 1))} disabled={memberPage >= memberPageCount}>
                      Next
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </main>

        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleGenerateInvite} noValidate>
              <DialogHeader>
                <DialogTitle>Generate Invite Link</DialogTitle>
                <DialogDescription>Create a new member invite and copy the generated link.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="member@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="w-full" id="invite-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                  The invite will be attached to the currently selected organization context for this session.
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isGeneratingLink}>
                  {isGeneratingLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                  {isGeneratingLink ? "Generating..." : "Generate Invite Link"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isInviteLinkDialogOpen} onOpenChange={(open) => setIsInviteLinkDialogOpen(open)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New Invite Link Generated</DialogTitle>
              <DialogDescription>Share this link with the person you want to add to the organization.</DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="break-all rounded-lg border bg-background px-3 py-2 font-mono text-xs text-foreground">
                {inviteLink ?? "Invite link unavailable"}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (inviteLink) {
                    void copyText(inviteLink)
                  }
                }}
                disabled={!inviteLink}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (inviteLink) {
                    window.location.href = `mailto:?subject=${encodeURIComponent("Organization Invite")}&body=${encodeURIComponent(inviteLink)}`
                  }
                }}
                disabled={!inviteLink}
              >
                Send via Email
              </Button>
              <DialogClose asChild>
                <Button type="button">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(selectedMember)} onOpenChange={(open) => !open && setSelectedMember(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Member Profile</DialogTitle>
              <DialogDescription>Quick summary of the selected member.</DialogDescription>
            </DialogHeader>

            {selectedMember ? (
              <div className="space-y-3 py-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Name</div>
                  <div className="font-medium">{selectedMember.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Email</div>
                  <div className="font-medium">{selectedMember.email}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Role</div>
                  <div className="font-medium">{selectedMember.role}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Joined</div>
                  <div className="font-medium">{formatDateTime(selectedMember.joinedAt)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="font-medium">{selectedMember.status}</div>
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
