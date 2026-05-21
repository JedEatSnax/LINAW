import { AppSidebar } from "@/components/app-sidebar"
import { PageHero } from "@/components/page-hero"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { type CSSProperties, useEffect, useRef, useState } from "react"
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
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import OrganizationsDataTable, {
  type TenantRow,
} from "@/components/ui/organizations-data-table"
import { Plus } from "lucide-react"

const INVALID_CHARACTER_RULES = [
  { character: ":", label: "colon" },
  { character: "@", label: "at sign" },
  { character: "/", label: "forward slash" },
  { character: ";", label: "semicolon" },
  { character: "&", label: "ampersand" },
  { character: "|", label: "pipe" },
  { character: "`", label: "backtick" },
  { character: "$", label: "dollar sign" },
  { character: "(", label: "left parenthesis" },
  { character: ")", label: "right parenthesis" },
  { character: "\\", label: "backslash" },
  { character: '"', label: "double quote" },
  { character: "'", label: "single quote" },
  { character: " ", label: "space" },
] as const

function getInvalidCharacters(value: string): string[] {
  const invalidCharacters = new Set<string>()

  for (const rule of INVALID_CHARACTER_RULES) {
    if (value.includes(rule.character)) {
      invalidCharacters.add(rule.label)
    }
  }

  if (/\t/.test(value)) {
    invalidCharacters.add("tab")
  }

  if (/\n|\r/.test(value)) {
    invalidCharacters.add("newline")
  }

  return [...invalidCharacters]
}

function getInputValidationMessage(value: string): string | null {
  if (!value || value.length === 0) return "required"
  if (value.startsWith("-")) return "must not start with '-'"

  const invalidCharacters = getInvalidCharacters(value)
  if (invalidCharacters.length > 0) {
    return `Contains invalid characters: ${invalidCharacters.join(", ")}`
  }

  return null
}

interface Tenant extends TenantRow {
  errorMessage?: string
}

export default function Organizations() {
  const [tenantName, setTenantName] = useState("")
  const [tlsAdminUser, setTlsAdminUser] = useState("")
  const [tlsAdminPassword, setTlsAdminPassword] = useState("")
  const [orgAdminUser, setOrgAdminUser] = useState("")
  const [orgAdminPassword, setOrgAdminPassword] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000"
  const tenantsSignatureRef = useRef("")

  useEffect(() => {
    const loadTenants = async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false
      try {
        if (!silent) {
          setLoadingTenants(true)
        }

        const response = await fetch(`${backendUrl}/api/tenants`)
        if (response.ok) {
          const data = (await response.json()) as { tenants: Tenant[] }
          const nextSignature = JSON.stringify(data.tenants)
          if (nextSignature !== tenantsSignatureRef.current) {
            tenantsSignatureRef.current = nextSignature
            setTenants(data.tenants)
          }
        }
      } catch (err) {
        console.error("Failed to load tenants:", err)
      } finally {
        if (!silent) {
          setLoadingTenants(false)
        }
      }
    }

    loadTenants()
    const interval = setInterval(() => {
      void loadTenants({ silent: true })
    }, 5000)

    return () => clearInterval(interval)
  }, [backendUrl])

  function isInvalidInput(value: string): string | null {
    return getInputValidationMessage(value)
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

      setTenantName("")
      setTlsAdminUser("")
      setTlsAdminPassword("")
      setOrgAdminUser("")
      setOrgAdminPassword("")
      setIsDialogOpen(false)

      const listResponse = await fetch(`${backendUrl}/api/tenants`)
      if (listResponse.ok) {
        const data = (await listResponse.json()) as { tenants: Tenant[] }
        tenantsSignatureRef.current = JSON.stringify(data.tenants)
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

      const listResponse = await fetch(`${backendUrl}/api/tenants`)
      if (listResponse.ok) {
        const data = (await listResponse.json()) as { tenants: Tenant[] }
        tenantsSignatureRef.current = JSON.stringify(data.tenants)
        setTenants(data.tenants)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error"
      alert(`Delete failed: ${message}`)
    }
  }

  const tenantNameError =
    tenantName.length > 0 ? isInvalidInput(tenantName) : null
  const tlsAdminUserError =
    tlsAdminUser.length > 0 ? isInvalidInput(tlsAdminUser) : null
  const tlsAdminPasswordError =
    tlsAdminPassword.length > 0 ? isInvalidInput(tlsAdminPassword) : null
  const orgAdminUserError =
    orgAdminUser.length > 0 ? isInvalidInput(orgAdminUser) : null
  const orgAdminPasswordError =
    orgAdminPassword.length > 0 ? isInvalidInput(orgAdminPassword) : null

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
        <main className="flex flex-1 flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
          <PageHero
            title="Organizations"
            description="Manage certificate authorities and tenant provisioning"
            actions={
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    className="bg-white text-slate-950 hover:bg-white/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Certificate Authority
                  </Button>
                </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleSubmit} noValidate>
                      <DialogHeader>
                        <DialogTitle className="text-center">
                          Create Certificate Authority
                        </DialogTitle>
                        <DialogDescription className="text-center">
                          Provision your root TLS and Signing certificate
                          authority
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
                            aria-invalid={Boolean(tenantNameError)}
                            required
                          />
                          {tenantNameError ? (
                            <FieldDescription className="text-destructive">
                              {tenantNameError}
                            </FieldDescription>
                          ) : null}
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
                              aria-invalid={Boolean(tlsAdminUserError)}
                              required
                            />
                            {tlsAdminUserError ? (
                              <FieldDescription className="text-destructive">
                                {tlsAdminUserError}
                              </FieldDescription>
                            ) : null}
                          </Field>
                          <Field className="space-y-2">
                            <Label htmlFor="tlsAdminPassword">
                              TLS Admin Password
                            </Label>
                            <PasswordInput
                              id="tlsAdminPassword"
                              name="tlsAdminPassword"
                              value={tlsAdminPassword}
                              onChange={(e) =>
                                setTlsAdminPassword(e.target.value)
                              }
                              aria-invalid={Boolean(tlsAdminPasswordError)}
                              required
                            />
                            {tlsAdminPasswordError ? (
                              <FieldDescription className="text-destructive">
                                {tlsAdminPasswordError}
                              </FieldDescription>
                            ) : null}
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
                              aria-invalid={Boolean(orgAdminUserError)}
                              required
                            />
                            {orgAdminUserError ? (
                              <FieldDescription className="text-destructive">
                                {orgAdminUserError}
                              </FieldDescription>
                            ) : null}
                          </Field>
                          <Field className="space-y-2">
                            <Label htmlFor="orgAdminPassword">
                              Org Admin Password
                            </Label>
                            <PasswordInput
                              id="orgAdminPassword"
                              name="orgAdminPassword"
                              value={orgAdminPassword}
                              onChange={(e) =>
                                setOrgAdminPassword(e.target.value)
                              }
                              aria-invalid={Boolean(orgAdminPasswordError)}
                              required
                            />
                            {orgAdminPasswordError ? (
                              <FieldDescription className="text-destructive">
                                {orgAdminPasswordError}
                              </FieldDescription>
                            ) : null}
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
            }
          />

          <OrganizationsDataTable
            tenants={tenants}
            loadingTenants={loadingTenants}
            onDeleteTenant={handleDeleteTenant}
          />

          {tenants.length > 0 && (
            <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
              Total Certificate Authorities: {tenants.length}
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
