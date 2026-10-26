import {
  columns,
  type AuditTrail,
} from "@/app/(protected-routes)/audit-trail/column-definitions";
import { modal } from "@/app/(protected-routes)/audit-trail/modal-definitions";
import { DataTable } from "@/components/data-table";
import { Layers } from "lucide-react";

export async function getAuditTrail(): Promise<AuditTrail[]> {
  // TODO: Replace with actual backend API call
  // const res = await fetch('API_ENDPOINT');
  // return res.json();

  // Delete this array once API is connected
  return [
    {
      id: "audit-uuid-001",
      entity_type: "PURCHASE_ORDER",
      entity_id: "po-uuid-001",
      action: "COMPLETED",
      result: "SUCCESS",
      created_at: "2026-10-21T12:00:00.000Z",
      actor_user_id: "user-uuid-1",
      hash: {
        hash_algorithm: "SHA-256",
        hash_value: "abc123def456...",
      },
      blockchain_ref: {
        blockchain_transaction_hash: "0x123abc...",
        block_number: "12345",
        anchored_at: "2026-10-21T12:00:05.000Z",
      },
    },
    {
      id: "audit-uuid-002",
      entity_type: "PURCHASE_ORDER",
      entity_id: "po-uuid-002",
      action: "COMPLETED",
      result: "FAILED",
      created_at: "2026-10-20T09:30:00.000Z",
      actor_user_id: "user-uuid-2",
      hash: {
        hash_algorithm: "SHA-256",
        hash_value: "def456ghi789...",
      },
      blockchain_ref: null,
    },
    {
      id: "audit-uuid-003",
      entity_type: "PURCHASE_ORDER",
      entity_id: "po-uuid-003",
      action: "COMPLETED",
      result: null, // Pending blockchain anchoring
      created_at: "2026-10-22T08:15:00.000Z",
      actor_user_id: "user-uuid-1",
      hash: null,
      blockchain_ref: null,
    },
  ];
}

export default async function AuditTrailPage() {
  const data = await getAuditTrail();

  return (
    <main className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Audit Trail
              </h1>
            </div>

            <p className="text-sm text-muted-foreground">
              Oversee auditing and cryptographic immutability of purchase orders
              anchored directly to the smart contract
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:self-center">
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>
              Total Audits:{" "}
              <strong className="font-semibold text-foreground">
                {data.length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="id"
        searchPlaceholder="Search audit ID..."
        toolbarActions={modal}
        enableExport={true}
        //exportEndpoint="/api/audit-trail/export" // Temporarily disable the endpoint to force the client-side fallback
        // HTTP method logs:  GET /api/audit-trail/export?format=csv 404 in 161ms
        exportFileName="audit-trail"
      />
    </main>
  );
}
