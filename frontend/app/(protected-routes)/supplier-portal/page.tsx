import { Portal } from "@/app/(protected-routes)/suppliers/page";

export default function SupplierPortalPage() {
  return (
    <main className="min-h-full bg-muted/20">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Supplier portal
          </h1>
          <p className="text-sm text-muted-foreground">
            Review eligible RFQs and manage your submitted quotations.
          </p>
        </div>
        <Portal />
      </div>
    </main>
  );
}