import { Governance } from "@/app/(protected-routes)/suppliers/page";

export default function SupplierManagementPage() {
  return (
    <main className="min-h-full bg-muted/20">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Supplier management
          </h1>
          <p className="text-sm text-muted-foreground">
            Govern supplier relationships and invitations for your organization.
          </p>
        </div>
        <Governance />
      </div>
    </main>
  );
}