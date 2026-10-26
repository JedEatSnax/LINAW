import {
  userColumns,
  type UserManagement,
} from "@/app/(protected-routes)/organization-settings/user-columns";
import { editProfileModal } from "@/app/(protected-routes)/organization-settings/user-modal";
import {
  roleColumns,
  type OrganizationRole,
} from "@/app/(protected-routes)/organization-settings/role-columns";
import { roleModal } from "@/app/(protected-routes)/organization-settings/role-modal";
import { DataTable } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardTitle,
  CardHeader,
  CardFooter,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UserRoundPlus, UserRoundKey, UserCog } from "lucide-react";

export async function getUserManagement(): Promise<UserManagement[]> {
  // TODO: Replace with actual backend API call
  return [
    {
      user_id: "user-uuid-1",
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
      job_title: "Finance Manager",
      status: "ACTIVE",
      company_name: "Example Company",
    },
    {
      user_id: "user-uuid-2",
      first_name: "Juan",
      last_name: "Dela Cruz",
      email: "juan.delacruz@domain.com",
      job_title: null,
      status: "ACTIVE",
      company_name: null,
    },
  ];
}

export async function getOrganizationRoles(): Promise<OrganizationRole[]> {
  return [
    {
      id: "role-uuid-001",
      tenant_id: "tenant-uuid-1",
      company_id: "company-uuid-1",
      code: "organization_admin",
      name: "Organization Administrator",
      description: "Full administrative access to company settings and users.",
      is_system: true,
      created_at: "2026-10-01T08:00:00.000Z",
      updated_at: "2026-10-01T08:00:00.000Z",
    },
    {
      id: "role-uuid-002",
      tenant_id: "tenant-uuid-1",
      company_id: "company-uuid-1",
      code: "finance_manager",
      name: "Finance Manager",
      description: "Approves finance requests and purchase orders.",
      is_system: false,
      created_at: "2026-10-15T14:30:00.000Z",
      updated_at: "2026-10-21T10:15:00.000Z",
    },
  ];
}

export default async function OrganizationSettingsPage() {
  const userData = await getUserManagement();
  const roleData = await getOrganizationRoles();

  return (
    <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Organization Settings
              </h1>
            </div>

            <p className="text-sm text-muted-foreground">
              Create and customize roles, users, and organization information
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:self-center">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
            <UserRoundKey className="h-3.5 w-3.5 text-primary" />
            <span>
              Total Roles:{" "}
              <strong className="font-semibold text-foreground">
                {roleData.length}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
            <UserRoundPlus className="h-3.5 w-3.5 text-primary" />
            <span>
              Total Users:{" "}
              <strong className="font-semibold text-foreground">
                {userData.length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="roles-and-permissions" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-2 border rounded-2xl bg-transparent p-2">
          <TabsTrigger
            value="roles-and-permissions"
            className="rounded-full px-6 py-4 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-md"
          >
            <UserRoundKey className="mr-2 size-4" />
            Roles and Permissions
          </TabsTrigger>
          <TabsTrigger
            value="user-management"
            className="rounded-full px-6 py-4 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-md"
          >
            <UserRoundPlus className="mr-2 size-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger
            value="organization-management"
            className="rounded-full px-6 py-4 text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-md"
          >
            <UserCog className="mr-2 size-4" />
            Organization Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles-and-permissions" className="space-y-6">
          <DataTable
            columns={roleColumns}
            data={roleData}
            searchKey="name"
            searchPlaceholder="Search role name..."
            toolbarActions={roleModal}
            enableExport={true}
            exportFileName="roles-and-permissions"
          />
        </TabsContent>

        <TabsContent value="user-management" className="space-y-6">
          <DataTable
            columns={userColumns}
            data={userData}
            searchKey="email"
            searchPlaceholder="Search email..."
            toolbarActions={editProfileModal}
            enableExport={true}
            exportFileName="user-management"
          />
        </TabsContent>

        <TabsContent value="organization-management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Management</CardTitle>
              <CardDescription>
                Update your company's contact and naming information
              </CardDescription>
            </CardHeader>
            <form>
              <CardContent className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      placeholder="e.g. LINAW Procurement"
                      maxLength={150}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalName">Legal Name</Label>
                    <Input
                      id="legalName"
                      name="legalName"
                      placeholder="e.g. LINAW Procurement Ltd"
                      maxLength={200}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Company Email</Label>
                    <Input
                      id="companyEmail"
                      name="companyEmail"
                      type="email"
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      placeholder="+1 555 0100"
                      maxLength={30}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="1 Example Street, City, Country"
                    maxLength={500}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t px-6 py-4">
                <Button type="submit">Save Settings</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
