import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { type CSSProperties, useState } from "react"
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

export default function Organizations() {
  const [orgUser, setOrgUser] = useState("")
  const [orgPassword, setOrgPassword] = useState("")
  const [caname, setCaname] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function isInvalidToken(value: string): string | null {
    if (!value || value.length === 0) return "required"
    if (value.startsWith("-")) return "must not start with '-'"
    if (value.includes(":")) return "must not include ':'"
    const dangerousChars = /[;&|`$()\\"'\s]/
    if (dangerousChars.test(value)) return "contains invalid characters"
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fields = [
      { v: orgUser, name: "Admin username" },
      { v: orgPassword, name: "Admin password" },
    ]
    for (const f of fields) {
      const bad = isInvalidToken(f.v)
      if (bad) {
        setError(`${f.name} ${bad}`)
        return
      }
    }
    if (caname) {
      const bad = isInvalidToken(caname)
      if (bad) {
        setError(`CA name ${bad}`)
        return
      }
    }

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000"

    setLoading(true)
    try {
      const response = await fetch(`${backendUrl}/api/fabric-ca-server/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          containerName: orgUser,
          orgUser,
          orgPassword,
          caname,
        }),
      })
      if (!response.ok) {
        let backendMessage = ""
        try {
          const payload = (await response.json()) as { error?: string }
          backendMessage = payload.error ?? ""
        } catch {
          // Ignore JSON parse errors and fall back to status text.
        }

        setError(
          backendMessage ||
            `Request failed (${response.status} ${response.statusText})`
        )
        return
      }

      setOrgUser("")
      setOrgPassword("")
      setCaname("")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error"
      setError(`Request failed: ${message}`)
    } finally {
      setLoading(false)
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
            <div className="flex flex-col gap-4 py-4 px-4 md:gap-6 md:py-6 md:px-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    Create Organization
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <form onSubmit={handleSubmit} noValidate>
                    <DialogHeader>
                      <DialogTitle>Create Organization</DialogTitle>
                      <DialogDescription>
                        Make changes to your organization credentials here.
                        Click save when you&apos;re done.
                      </DialogDescription>
                    </DialogHeader>
                    {error ? (
                      <div className="max-h-28 overflow-y-auto rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap text-red-700">
                        {error}
                      </div>
                    ) : null}
                    <FieldGroup className="gap-4 py-4">
                      <Field className="space-y-2">
                        <Label htmlFor="orgUser">Admin Username</Label>
                        <Input
                          id="orgUser"
                          name="orgUser"
                          value={orgUser}
                          onChange={(e) => {
                            setOrgUser(e.target.value)
                          }}
                          required
                        />
                      </Field>
                      <Field className="space-y-2">
                        <Label htmlFor="orgPassword">Admin Password</Label>
                        <Input
                          id="orgPassword"
                          name="orgPassword"
                          type="password"
                          value={orgPassword}
                          onChange={(e) => setOrgPassword(e.target.value)}
                          required
                        />
                      </Field>
                      <Field className="space-y-2">
                        <Label htmlFor="caname">
                          Certificate Authority Name (optional)
                        </Label>
                        <Input
                          id="caname"
                          name="caname"
                          value={caname}
                          onChange={(e) => setCaname(e.target.value)}
                        />
                      </Field>
                    </FieldGroup>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="destructive" className="sm:mr-auto">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Submitting..." : "Save changes"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}