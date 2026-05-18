import BadgeError from "@/components/ui/badge-error"
import BadgePending from "@/components/ui/badge-pending"
import BadgeReady from "@/components/ui/badge-ready"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface TenantRow {
  tenantId: string
  tenantName: string
  tlsCaName: string
  orgCaName: string
  status: "initializing" | "ready" | "error"
  createdAt: string
}

type OrganizationsDataTableProps = {
  tenants: TenantRow[]
  loadingTenants: boolean
  onDeleteTenant: (tenantId: string) => void | Promise<void>
}

export default function OrganizationsDataTable({
  tenants,
  loadingTenants,
  onDeleteTenant,
}: OrganizationsDataTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow>
            <TableHead>Tenant Name</TableHead>
            <TableHead>TLS ID</TableHead>
            <TableHead>Org/Signing ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Row actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingTenants ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-gray-500">
                Loading tenants...
              </TableCell>
            </TableRow>
          ) : tenants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-gray-500">
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
                  {new Date(tenant.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open actions menu</span>⋯
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault()
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={(event) => {
                          event.preventDefault()
                          void onDeleteTenant(tenant.tenantId)
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
