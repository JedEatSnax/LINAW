import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { type CSSProperties, useEffect, useState } from "react"
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
import { Trash2 } from "lucide-react"
import BadgeReady from "@/components/ui/badge-ready"
import BadgePending from "@/components/ui/badge-pending"
import BadgeError from "@/components/ui/badge-error"

interface Tenant {
  tenantId: string
  tenantName: string
  tlsCaName: string
  orgCaName: string
  status: "initializing" | "ready" | "error"
  createdAt: string
  errorMessage?: string
}

export default function Organizations() {
  // Form state
  const [tenantName, setTenantName] = useState("")
  const [tlsAdminUser, setTlsAdminUser] = useState("")
  const [tlsAdminPassword, setTlsAdminPassword] = useState("")
  const [orgAdminUser, setOrgAdminUser] = useState("")
  const [orgAdminPassword, setOrgAdminPassword] = useState("")

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingTenantId, setDeletingTenantId] = useState<string | null>(null)

  const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000"

  // Load tenants on mount and periodically
  useEffect(() => {
    const loadTenants = async () => {
      try {
        setLoadingTenants(true)
        const response = await fetch(`${backendUrl}/api/tenants`)
        if (response.ok) {
          const data = (await response.json()) as { tenants: Tenant[] }
          setTenants(data.tenants)
        }
      } catch (err) {
        console.error("Failed to load tenants:", err)
      } finally {
        setLoadingTenants(false)
      }
    }

    loadTenants()
    const interval = setInterval(loadTenants, 5000) // Poll every 5s

    return () => clearInterval(interval)
  }, [backendUrl])

  function isInvalidInput(value: string): string | null {
    if (!value || value.length === 0) return "required"
    if (value.startsWith("-")) return "must not start with '-'"
    if (value.includes(":")) return "must not include ':'"
    if (value.includes("@")) return "must not include '@'"
    if (value.includes("/")) return "must not include '/'"
    const dangerousChars = /[;&|`$()\\"'\s]/
    if (dangerousChars.test(value)) return "contains invalid characters"
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const fields = [
      { v: tenantName, name: "Tenant name" },
      { v: tlsAdminUser, name: "TLS admin username" },
      { v: tlsAdminPassword, name: "TLS admin password" },
      { v: orgAdminUser, name: "Org admin username" },
      { v: orgAdminPassword, name: "Org admin password" },
    ]

    for (const f of fields) {
      const bad = isInvalidInput(f.v)
      if (bad) {
        setError(`${f.name} ${bad}`)
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch(`${backendUrl}/api/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantName,
          tlsAdminUser,
          tlsAdminPassword,
          orgAdminUser,
          orgAdminPassword,
        }),
      })

      if (!response.ok) {
        let backendMessage = ""
        try {
          const payload = (await response.json()) as { error?: string }
          backendMessage = payload.error ?? ""
        } catch {
          // Ignore parse errors
        }

        setError(
          backendMessage ||
            `Request failed (${response.status} ${response.statusText})`
        )
        return
      }

      // Clear form and close dialog
      setTenantName("")
      setTlsAdminUser("")
      setTlsAdminPassword("")
      setOrgAdminUser("")
      setOrgAdminPassword("")
      setIsDialogOpen(false)

      // Reload tenants
      const listResponse = await fetch(`${backendUrl}/api/tenants`)
      if (listResponse.ok) {
        const data = (await listResponse.json()) as { tenants: Tenant[] }
        setTenants(data.tenants)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error"
      setError(`Request failed: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteTenant(tenantId: string) {
    if (
      !window.confirm(
        "Are you sure you want to delete this tenant? This action cannot be undone."
      )
    ) {
      return
    }

    setDeletingTenantId(tenantId)
    try {
      const response = await fetch(`${backendUrl}/api/tenants/${tenantId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        let backendMessage = ""
        try {
          const payload = (await response.json()) as { error?: string }
          backendMessage = payload.error ?? ""
        } catch {
          // Ignore parse errors
        }
        alert(
          backendMessage ||
            `Delete failed (${response.status} ${response.statusText})`
        )
        return
      }

      // Reload tenants
      const listResponse = await fetch(`${backendUrl}/api/tenants`)
      if (listResponse.ok) {
        const data = (await listResponse.json()) as { tenants: Tenant[] }
        setTenants(data.tenants)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error"
      alert(`Delete failed: ${message}`)
    } finally {
      setDeletingTenantId(null)
    }
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
        <SiteHeader title="Organizations" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
              {/* Create Tenant Button */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    Create Tenant Organization
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <form onSubmit={handleSubmit} noValidate>
                    <DialogHeader>
                      <DialogTitle className="text-center">
                        Create Tenant Organization
                      </DialogTitle>
                      <DialogDescription className="text-center">
                        Provision your organization's root TLS and Signing
                        certificate authority
                      </DialogDescription>
                    </DialogHeader>

                    {error ? (
                      <div className="max-h-28 overflow-y-auto rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap text-red-700">
                        {error}
                      </div>
                    ) : null}

                    <FieldGroup className="gap-4 py-4">
                      <Field className="space-y-2">
                        <Label htmlFor="tenantName">Tenant Name</Label>
                        <Input
                          id="tenantName"
                          name="tenantName"
                          value={tenantName}
                          onChange={(e) => setTenantName(e.target.value)}
                          required
                        />
                      </Field>

                      <div className="border-t pt-4">
                        <Field className="mb-3 space-y-2">
                          <Label htmlFor="tlsAdminUser">
                            TLS Admin Username
                          </Label>
                          <Input
                            id="tlsAdminUser"
                            name="tlsAdminUser"
                            value={tlsAdminUser}
                            onChange={(e) => setTlsAdminUser(e.target.value)}
                            required
                          />
                        </Field>
                        <Field className="space-y-2">
                          <Label htmlFor="tlsAdminPassword">
                            TLS Admin Password
                          </Label>
                          <Input
                            id="tlsAdminPassword"
                            name="tlsAdminPassword"
                            type="password"
                            value={tlsAdminPassword}
                            onChange={(e) =>
                              setTlsAdminPassword(e.target.value)
                            }
                            required
                          />
                        </Field>
                      </div>

                      <div className="border-t pt-4">
                        <Field className="mb-3 space-y-2">
                          <Label htmlFor="orgAdminUser">
                            Org Admin Username
                          </Label>
                          <Input
                            id="orgAdminUser"
                            name="orgAdminUser"
                            value={orgAdminUser}
                            onChange={(e) => setOrgAdminUser(e.target.value)}
                            required
                          />
                        </Field>
                        <Field className="space-y-2">
                          <Label htmlFor="orgAdminPassword">
                            Org Admin Password
                          </Label>
                          <Input
                            id="orgAdminPassword"
                            name="orgAdminPassword"
                            type="password"
                            value={orgAdminPassword}
                            onChange={(e) =>
                              setOrgAdminPassword(e.target.value)
                            }
                            required
                          />
                        </Field>
                      </div>
                    </FieldGroup>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="destructive" className="sm:mr-auto">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Provisioning..." : "Create Tenant"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Tenants Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant Name</TableHead>
                      <TableHead>TLS ID</TableHead>
                      <TableHead>Org/Signing ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTenants ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-gray-500"
                        >
                          Loading tenants...
                        </TableCell>
                      </TableRow>
                    ) : tenants.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-gray-500"
                        >
                          No tenants created yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      tenants.map((tenant) => (
                        <TableRow key={tenant.tenantId}>
                          <TableCell className="font-medium">
                            {tenant.tenantName}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {tenant.tlsCaName}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {tenant.orgCaName}
                          </TableCell>
                          <TableCell>
                            {tenant.status === "ready" ? (
                              <BadgeReady />
                            ) : tenant.status === "error" ? (
                              <BadgeError />
                            ) : (
                              <BadgePending />
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(tenant.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              }
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteTenant(tenant.tenantId)
                              }
                              disabled={deletingTenantId === tenant.tenantId}
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {tenants.length > 0 && (
                <div className="text-sm text-gray-600">
                  Total tenants: {tenants.length}
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
