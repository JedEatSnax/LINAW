import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { validateTenantProvisionRequest } from "../model/tenantModel.js";
import { encryptValue } from "../service/encryptionService.js";
import { TenantCaOrchestrator } from "../service/tenantCaOrchestratorService.js";
import { join } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";

const orchestrator = new TenantCaOrchestrator();
const CONTROLLER_DIR = fileURLToPath(new URL(".", import.meta.url));
const COMPOSE_TEMPLATE_PATH = join(CONTROLLER_DIR, "../compose-template.yml");
const ENCRYPTION_KEY =
  process.env["ENCRYPTION_KEY"] || "dev-insecure-key-change-in-prod";

// In-memory tenant store (replace with database in production)
type TenantRecord = {
  tenantId: string;
  tenantName: string;
  tlsAdminUser: string;
  tlsAdminPasswordEncrypted: string;
  orgAdminUser: string;
  orgAdminPasswordEncrypted: string;
  tlsCaName: string;
  orgCaName: string;
  status: "initializing" | "ready" | "error";
  createdAt: Date;
  updatedAt?: Date;
  tlsCaPort?: number;
  orgCaPort?: number;
  tlsCaOpsPort?: number;
  orgCaOpsPort?: number;
  tlsCertPem?: string;
  orgCertPem?: string;
  tlsPrivateKeyPem?: string;
  orgPrivateKeyPem?: string;
  errorMessage?: string;
};

const tenantStore = new Map<string, TenantRecord>();

function getTenantIdParam(req: Request): string {
  const tenantId = req.params["tenantId"];
  if (typeof tenantId !== "string" || tenantId.length === 0) {
    throw new Error("tenantId is required");
  }
  return tenantId;
}

/**
 * POST /api/tenants — Provision new tenant CA pair
 */
export async function createTenant(req: Request, res: Response): Promise<void> {
  try {
    const input = validateTenantProvisionRequest(req.body);

    // Check if tenant already exists
    if (
      Array.from(tenantStore.values()).some(
        (t) => t.tenantName === input.tenantName,
      )
    ) {
      res.status(409).json({ error: "Tenant with this name already exists" });
      return;
    }

    const tenantId = uuidv4();
    const tenantRecord: TenantRecord = {
      tenantId,
      tenantName: input.tenantName,
      tlsAdminUser: input.tlsAdminUser,
      tlsAdminPasswordEncrypted: encryptValue(
        input.tlsAdminPassword,
        ENCRYPTION_KEY,
      ),
      orgAdminUser: input.orgAdminUser,
      orgAdminPasswordEncrypted: encryptValue(
        input.orgAdminPassword,
        ENCRYPTION_KEY,
      ),
      tlsCaName: `tls-ca-${tenantId.substring(0, 8)}`,
      orgCaName: `org-ca-${tenantId.substring(0, 8)}`,
      status: "initializing",
      createdAt: new Date(),
    };

    tenantStore.set(tenantId, tenantRecord);

    res.status(202).json({
      tenantId,
      status: "initializing",
      message: "Tenant provisioning started",
    });

    // Async provisioning (don't wait for completion)
    provisionTenantAsync(tenantId, input, tenantRecord).catch((error) => {
      console.error(`[${tenantId}] Provisioning failed:`, error);
      tenantRecord.status = "error";
      tenantRecord.errorMessage =
        error instanceof Error ? error.message : String(error);
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid request",
    });
  }
}

/**
 * GET /api/tenants — List all tenants
 */
export function listTenants(req: Request, res: Response): void {
  void req;
  const tenants = Array.from(tenantStore.values()).map((t) => ({
    tenantId: t.tenantId,
    tenantName: t.tenantName,
    tlsCaName: t.tlsCaName,
    orgCaName: t.orgCaName,
    status: t.status,
    createdAt: t.createdAt,
    errorMessage: t.errorMessage,
  }));

  res.json({ tenants, count: tenants.length });
}

/**
 * GET /api/tenants/:tenantId — Get tenant metadata
 */
export function getTenant(req: Request, res: Response): void {
  let tenantId: string;
  try {
    tenantId = getTenantIdParam(req);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid tenant id",
    });
    return;
  }

  const tenant = tenantStore.get(tenantId);

  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  res.json({
    tenantId: tenant.tenantId,
    tenantName: tenant.tenantName,
    tlsCaName: tenant.tlsCaName,
    orgCaName: tenant.orgCaName,
    tlsCaPort: tenant.tlsCaPort,
    orgCaPort: tenant.orgCaPort,
    status: tenant.status,
    createdAt: tenant.createdAt,
    errorMessage: tenant.errorMessage,
    tlsCert: tenant.tlsCertPem ? "Available" : "Not available",
  });
}

/**
 * DELETE /api/tenants/:tenantId — Delete tenant and cleanup
 */
export async function deleteTenant(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantIdParam(req);
    const tenant = tenantStore.get(tenantId);

    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    // Stop containers
    await orchestrator.stopTenantCA(tenantId);

    // Remove from store
    tenantStore.delete(tenantId);

    res.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete tenant",
    });
  }
}

/**
 * GET /api/tenants/:tenantId/tls-cert — Download TLS certificate
 */
export function getTLSCert(req: Request, res: Response): void {
  let tenantId: string;
  try {
    tenantId = getTenantIdParam(req);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Invalid tenant id",
    });
    return;
  }

  const tenant = tenantStore.get(tenantId);

  if (!tenant || !tenant.tlsCertPem) {
    res.status(404).json({ error: "TLS certificate not found" });
    return;
  }

  res.setHeader("Content-Type", "text/plain");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="tls-ca-${tenantId}.pem"`,
  );
  res.send(tenant.tlsCertPem);
}

/**
 * Async provisioning logic
 */
async function provisionTenantAsync(
  tenantId: string,
  input: any,
  tenantRecord: any,
): Promise<void> {
  orchestrator.init();

  try {
    // Allocate ports
    const ports = {
      tlsCaPort: 7054 + Math.floor(Math.random() * 100),
      orgCaPort: 8054 + Math.floor(Math.random() * 100),
      tlsCaOpsPort: 17054 + Math.floor(Math.random() * 100),
      orgCaOpsPort: 18054 + Math.floor(Math.random() * 100),
    };

    const config = {
      tenantId,
      tenantName: input.tenantName,
      tlsCaName: tenantRecord.tlsCaName,
      orgCaName: tenantRecord.orgCaName,
      tlsAdminUser: input.tlsAdminUser,
      tlsAdminPassword: input.tlsAdminPassword,
      orgAdminUser: input.orgAdminUser,
      orgAdminPassword: input.orgAdminPassword,
      containerNetworkName: `fabric-${tenantId}`,
      ...ports,
    };

    // Start containers
    console.log(`[${tenantId}] Starting CA containers...`);
    await orchestrator.startTenantCA(config, COMPOSE_TEMPLATE_PATH);

    // Initialize CAs via API
    console.log(`[${tenantId}] Initializing CA admin enrollments...`);
    const certs = await orchestrator.initializeTenantCAs(config);

    // Store results
    tenantRecord.tlsCaPort = ports.tlsCaPort;
    tenantRecord.orgCaPort = ports.orgCaPort;
    tenantRecord.tlsCaOpsPort = ports.tlsCaOpsPort;
    tenantRecord.orgCaOpsPort = ports.orgCaOpsPort;
    tenantRecord.tlsCertPem = certs.tlsCertPem;
    tenantRecord.orgCertPem = certs.orgCertPem;
    tenantRecord.tlsPrivateKeyPem = certs.tlsPrivateKey;
    tenantRecord.orgPrivateKeyPem = certs.orgPrivateKey;
    tenantRecord.status = "ready";
    tenantRecord.updatedAt = new Date();

    // Persist certs and keys to host under TENANTS_DIR for recovery
    const SERVER_ROOT = join(CONTROLLER_DIR, "..", "..");
    const TENANTS_DIR =
      process.env["TENANTS_DIR"] || join(SERVER_ROOT, "tenants");
    const tenantDir = join(TENANTS_DIR, tenantId);
    try {
      if (!existsSync(tenantDir)) {
        mkdirSync(tenantDir, { recursive: true });
      }

      const tlsDir = join(tenantDir, "tls-ca");
      const orgDir = join(tenantDir, "org-ca");
      if (!existsSync(tlsDir)) mkdirSync(tlsDir, { recursive: true });
      if (!existsSync(orgDir)) mkdirSync(orgDir, { recursive: true });

      // Write files
      writeFileSync(
        join(tlsDir, `tls-ca-${tenantId}.pem`),
        certs.tlsCertPem,
        "utf8",
      );
      writeFileSync(
        join(tlsDir, `tls-ca-${tenantId}-key.pem`),
        certs.tlsPrivateKey,
        "utf8",
      );
      writeFileSync(
        join(orgDir, `org-ca-${tenantId}.pem`),
        certs.orgCertPem,
        "utf8",
      );
      writeFileSync(
        join(orgDir, `org-ca-${tenantId}-key.pem`),
        certs.orgPrivateKey,
        "utf8",
      );

      // Also write a small metadata file
      writeFileSync(
        join(tenantDir, "tenant-metadata.json"),
        JSON.stringify(
          {
            tenantId,
            tenantName: input.tenantName,
            ports,
            createdAt: new Date().toISOString(),
          },
          null,
          2,
        ),
        "utf8",
      );
    } catch (err) {
      console.error(`[${tenantId}] Failed to persist tenant files:`, err);
    }

    console.log(`[${tenantId}] Provisioning complete`);
  } catch (error) {
    console.error(`[${tenantId}] Provisioning failed:`, error);
    tenantRecord.status = "error";
    tenantRecord.errorMessage =
      error instanceof Error ? error.message : String(error);

    // Attempt cleanup
    try {
      await orchestrator.stopTenantCA(tenantId);
    } catch {
      // Silently fail cleanup
    }
  }
}
