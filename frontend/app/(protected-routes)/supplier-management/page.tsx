import {
  governanceColumns,
  type GovernanceSupplier,
} from "@/app/(protected-routes)/supplier-management/governance-columns";
import {
  invitationColumns,
  type SupplierInvitation,
} from "@/app/(protected-routes)/supplier-management/invitation-columns";
import { governanceModal } from "@/app/(protected-routes)/supplier-management/governance-modal";
import { invitationsModal } from "@/app/(protected-routes)/supplier-management/invitation-modal";
import { DataTable } from "@/components/data-table";
import { UsersRoundCollaboration, UserRoundPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function getGovernanceSupplier(): Promise<GovernanceSupplier[]> {
  return [
    {
      supplier_id: "sup-uuid-001",
      supplier_code: "SUP-001",
      company_id: "comp-uuid-101",
      legal_name: "Tech Hardware Solutions Inc.",
      display_name: "Tech Hardware",
      tax_id: "123456789",
      contact_email: "sales@techhardware.com",
      contact_phone: "639171234567",
      address: "123 Tech Avenue, Manila",
      supplier_status: "ACTIVE",
      relationship_status: "ACTIVE",
      relationship: {
        relationship_id: "rel-uuid-001",
        relationship_status: "ACTIVE",
      },
      created_at: "2026-10-10T09:00:00.000Z",
      updated_at: "2026-10-10T09:00:00.000Z",
    },
    {
      supplier_id: "sup-uuid-002",
      supplier_code: "SUP-002",
      company_id: "comp-uuid-102",
      legal_name: "Office Supplies Co.",
      display_name: "Office Supplies",
      tax_id: null,
      contact_email: "orders@officesupplies.com",
      contact_phone: null,
      address: null,
      supplier_status: "ACTIVE",
      relationship_status: "INACTIVE",
      relationship: {
        relationship_id: "rel-uuid-002",
        relationship_status: "INACTIVE",
      },
      created_at: "2026-09-15T14:30:00.000Z",
      updated_at: "2026-10-21T10:15:00.000Z",
    },
  ];
}

export async function getSupplierInvitations(): Promise<SupplierInvitation[]> {
  return [
    {
      invitation_id: "inv-uuid-001",
      email: "supplier-contact@example.com",
      invitation_status: "PENDING",
      expires_at: "2026-10-27T12:00:00.000Z", // Active
      accepted_at: null,
      created_at: "2026-10-24T12:00:00.000Z",
      updated_at: "2026-10-24T12:00:00.000Z",
    },
    {
      invitation_id: "inv-uuid-002",
      email: "sales@techhardware.com",
      invitation_status: "ACCEPTED",
      expires_at: "2026-10-13T09:00:00.000Z",
      accepted_at: "2026-10-10T09:00:00.000Z",
      created_at: "2026-10-10T09:00:00.000Z",
      updated_at: "2026-10-10T09:00:00.000Z",
    },
    {
      invitation_id: "inv-uuid-003",
      email: "inactive-supplier@domain.com",
      invitation_status: "PENDING",
      expires_at: "2026-10-05T12:00:00.000Z", // Expired
      accepted_at: null,
      created_at: "2026-10-02T12:00:00.000Z",
      updated_at: "2026-10-05T12:00:00.000Z",
    },
    {
      invitation_id: "inv-uuid-004",
      email: "draft-supplier@domain.com",
      invitation_status: "DRAFT",
      expires_at: null,
      accepted_at: null,
      created_at: "2026-10-24T01:00:00.000Z",
      updated_at: "2026-10-24T01:00:00.000Z",
    },
  ];
}

export default async function SupplierManagementPage() {
  const governanceData = await getGovernanceSupplier();
  const invitationData = await getSupplierInvitations();

  return (
    <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Supplier Management
              </h1>
            </div>

            <p className="text-sm text-muted-foreground">
              Maintain supplier profiles and track invitations for your
              operations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:self-center">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
            <UsersRoundCollaboration className="h-3.5 w-3.5 text-primary" />
            <span>
              Total Suppliers:{" "}
              <strong className="font-semibold text-foreground">
                {governanceData.length}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
            <UserRoundPlus className="h-3.5 w-3.5 text-primary" />
            <span>
              Total Invitations:{" "}
              <strong className="font-semibold text-foreground">
                {invitationData.length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="governance" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-2 border rounded-2xl bg-transparent p-2">
          <TabsTrigger
            value="governance"
            className="rounded-full px-6 py-4 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-md"
          >
            <UsersRoundCollaboration className="mr-2 size-4" />
            Governance
          </TabsTrigger>
          <TabsTrigger
            value="invitation"
            className="rounded-full px-6 py-4 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-md"
          >
            <UserRoundPlus className="mr-2 size-4" />
            Invitations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="governance" className="space-y-6">
          <DataTable
            columns={governanceColumns}
            data={governanceData}
            searchKey="legal_name"
            searchPlaceholder="Search legal name..."
            toolbarActions={governanceModal}
            enableExport={true}
            //exportEndpoint="/api/supplier-invitation/export" // Temporarily disable the endpoint to force the client-side fallback
            // HTTP method logs:  GET /api/supplier-invitation/export?format=csv 404 in 161ms
            exportFileName="supplier-invitation"
          />
        </TabsContent>

        <TabsContent value="invitation" className="space-y-6">
          <DataTable
            columns={invitationColumns}
            data={invitationData}
            searchKey="email"
            searchPlaceholder="Search email..."
            toolbarActions={invitationsModal}
            enableExport={true}
            //exportEndpoint="/api/supplier-governance/export" // Temporarily disable the endpoint to force the client-side fallback
            // HTTP method logs:  GET /api/supplier-governance/export?format=csv 404 in 161ms
            exportFileName="supplier-governance"
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
