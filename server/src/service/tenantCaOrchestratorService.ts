import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { FabricCaApiClient } from "./fabricCaApiClient.js";
import forge from "node-forge";

const SERVICE_DIR = fileURLToPath(new URL(".", import.meta.url));
const SERVER_ROOT = join(SERVICE_DIR, "..", "..");
const TENANTS_DIR = process.env["TENANTS_DIR"] || join(SERVER_ROOT, "tenants");
const COMPOSE_CMD = process.env["COMPOSE_CMD"] || "docker compose";

export interface TenantCAConfig {
  tenantId: string;
  tenantName: string;
  tlsCaName: string;
  orgCaName: string;
  tlsCaPort: number;
  orgCaPort: number;
  tlsCaOpsPort: number;
  orgCaOpsPort: number;
  tlsAdminUser: string;
  tlsAdminPassword: string;
  orgAdminUser: string;
  orgAdminPassword: string;
  containerNetworkName: string;
}

export interface TenantCAStatus {
  tenantId: string;
  tlsCaUrl: string;
  orgCaUrl: string;
  tlsCertPem: string;
  tlsAdminUser: string;
  orgAdminUser: string;
  status: "initializing" | "ready" | "error";
  errorMessage?: string;
}

/**
 * Tenant CA Orchestrator — manages lifecycle of tenant CA containers
 */
export class TenantCaOrchestrator {
  /**
   * Initialize tenants directory
   */
  init(): void {
    if (!existsSync(TENANTS_DIR)) {
      mkdirSync(TENANTS_DIR, { recursive: true });
    }
  }

  /**
   * Generate Docker Compose file for tenant from template
   */
  private generateComposeFile(
    config: TenantCAConfig,
    templatePath: string,
  ): string {
    let template = readFileSync(templatePath, "utf-8");

    template = template.replace(/{TENANT_ID}/g, config.tenantId);
    template = template.replace(/{TENANT_NAME}/g, config.tenantName);
    template = template.replace(/{TLS_CA_NAME}/g, config.tlsCaName);
    template = template.replace(/{ORG_CA_NAME}/g, config.orgCaName);
    template = template.replace(/{TLS_CA_PORT}/g, config.tlsCaPort.toString());
    template = template.replace(/{ORG_CA_PORT}/g, config.orgCaPort.toString());
    template = template.replace(
      /{TLS_CA_OPS_PORT}/g,
      config.tlsCaOpsPort.toString(),
    );
    template = template.replace(
      /{ORG_CA_OPS_PORT}/g,
      config.orgCaOpsPort.toString(),
    );
    template = template.replace(/{TLS_ADMIN_USER}/g, config.tlsAdminUser);
    template = template.replace(
      /{TLS_ADMIN_PASSWORD}/g,
      config.tlsAdminPassword,
    );
    template = template.replace(/{ORG_ADMIN_USER}/g, config.orgAdminUser);
    template = template.replace(
      /{ORG_ADMIN_PASSWORD}/g,
      config.orgAdminPassword,
    );

    const composePath = join(TENANTS_DIR, `compose-${config.tenantId}.yml`);
    writeFileSync(composePath, template);

    return composePath;
  }

  /**
   * Start tenant CA containers
   */
  async startTenantCA(
    config: TenantCAConfig,
    templatePath: string,
  ): Promise<void> {
    try {
      const composePath = this.generateComposeFile(config, templatePath);
      const workDir = TENANTS_DIR;

      // Ensure host directories for persistent CA data exist (volumes mounted in compose)
      const tenantDir = join(TENANTS_DIR, config.tenantId);
      const tlsDir = join(tenantDir, "tls-ca");
      const orgDir = join(tenantDir, "org-ca");
      const orgClientDir = join(tenantDir, "org-ca-client");

      if (!existsSync(tenantDir)) mkdirSync(tenantDir, { recursive: true });
      if (!existsSync(tlsDir)) mkdirSync(tlsDir, { recursive: true });
      if (!existsSync(orgDir)) mkdirSync(orgDir, { recursive: true });
      if (!existsSync(orgClientDir))
        mkdirSync(orgClientDir, { recursive: true });

      // Execute: docker compose -f compose-{tenantId}.yml up -d
      const cmd = `${COMPOSE_CMD} -f ${composePath} up -d`;
      console.log(`[${config.tenantId}] Starting containers: ${cmd}`);

      execSync(cmd, { cwd: workDir, stdio: "inherit" });

      // Wait for health checks
      await this.waitForCAHealthy(config.tlsCaPort, 30);
      await this.waitForCAHealthy(config.orgCaPort, 30);

      console.log(`[${config.tenantId}] Containers started and healthy`);
    } catch (error) {
      throw new Error(
        `Failed to start tenant CA: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Poll CA health endpoint until ready or timeout
   */
  private async waitForCAHealthy(
    port: number,
    maxRetries: number,
  ): Promise<void> {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const client = new FabricCaApiClient(`localhost:${port}`);
        await client.getCAInfo();
        return;
      } catch {
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    throw new Error(
      `CA on port ${port} did not become healthy after ${maxRetries}s`,
    );
  }

  /**
   * Initialize Tenant CAs via API: enroll bootstrap admins
   */
  async initializeTenantCAs(config: TenantCAConfig): Promise<{
    tlsCertPem: string;
    orgCertPem: string;
    tlsPrivateKey: string;
    orgPrivateKey: string;
  }> {
    const tlsClient = new FabricCaApiClient(`localhost:${config.tlsCaPort}`);
    const orgClient = new FabricCaApiClient(`localhost:${config.orgCaPort}`);

    // Generate valid PKCS#10 CSRs and matching private keys for admin enrollments.
    const tlsIdentity = this.generateEnrollmentCSR(config.tlsAdminUser);
    const orgIdentity = this.generateEnrollmentCSR(config.orgAdminUser);

    try {
      console.log(`[${config.tenantId}] Enrolling TLS CA admin...`);
      const tlsEnrollRes = await tlsClient.enroll(
        config.tlsAdminUser,
        config.tlsAdminPassword,
        tlsIdentity.csrPem,
        config.tlsCaName,
      );

      if (!tlsEnrollRes.success || !tlsEnrollRes.result?.Cert) {
        throw new Error(
          `TLS CA enroll failed: ${JSON.stringify(tlsEnrollRes.errors)}`,
        );
      }

      const tlsCertPem = Buffer.from(
        tlsEnrollRes.result.Cert,
        "base64",
      ).toString("utf-8");

      console.log(`[${config.tenantId}] Enrolling Org CA admin...`);
      const orgEnrollRes = await orgClient.enroll(
        config.orgAdminUser,
        config.orgAdminPassword,
        orgIdentity.csrPem,
        config.orgCaName,
      );

      if (!orgEnrollRes.success || !orgEnrollRes.result?.Cert) {
        throw new Error(
          `Org CA enroll failed: ${JSON.stringify(orgEnrollRes.errors)}`,
        );
      }

      const orgCertPem = Buffer.from(
        orgEnrollRes.result.Cert,
        "base64",
      ).toString("utf-8");

      return {
        tlsCertPem,
        orgCertPem,
        tlsPrivateKey: tlsIdentity.privateKeyPem,
        orgPrivateKey: orgIdentity.privateKeyPem,
      };
    } catch (error) {
      throw new Error(
        `Failed to initialize tenant CAs: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Stop and remove tenant CA containers
   */
  async stopTenantCA(tenantId: string): Promise<void> {
    try {
      const composePath = join(TENANTS_DIR, `compose-${tenantId}.yml`);

      if (existsSync(composePath)) {
        const cmd = `${COMPOSE_CMD} -f ${composePath} down -v`;
        console.log(`[${tenantId}] Stopping containers: ${cmd}`);
        execSync(cmd, { cwd: TENANTS_DIR, stdio: "inherit" });

        // Remove compose file and tenant directory
        rmSync(composePath);
      }

      const tenantDir = join(TENANTS_DIR, tenantId);
      if (existsSync(tenantDir)) {
        rmSync(tenantDir, { recursive: true, force: true });
      }

      console.log(`[${tenantId}] Containers stopped and cleaned up`);
    } catch (error) {
      throw new Error(
        `Failed to stop tenant CA: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get tenant CA containers status
   */
  async getContainerStatus(tenantId: string): Promise<{
    tlsContainer: string | null;
    orgContainer: string | null;
  }> {
    try {
      const cmd = `docker ps -a --filter "label=tenant=${tenantId}" --format "table {{.Names}}\t{{.State}}"`;
      const output = execSync(cmd, { encoding: "utf-8" });

      const lines = output.split("\n").filter((line) => line.trim().length > 0);
      let tlsContainer = null;
      let orgContainer = null;

      for (const line of lines) {
        if (line.includes(`tls-ca-${tenantId}`))
          tlsContainer = line.split("\t")[0] ?? null;
        if (line.includes(`org-ca-${tenantId}`))
          orgContainer = line.split("\t")[0] ?? null;
      }

      return { tlsContainer, orgContainer };
    } catch {
      return { tlsContainer: null, orgContainer: null };
    }
  }

  /**
   * Generate a valid PKCS#10 CSR and return its matching private key.
   */
  private generateEnrollmentCSR(commonName: string): {
    csrPem: string;
    privateKeyPem: string;
  } {
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const csr = forge.pki.createCertificationRequest();

    csr.publicKey = keys.publicKey;
    csr.setSubject([
      {
        name: "commonName",
        value: commonName,
      },
    ]);
    csr.sign(keys.privateKey, forge.md.sha256.create());

    if (!csr.verify()) {
      throw new Error(`Generated CSR verification failed for ${commonName}`);
    }

    return {
      csrPem: forge.pki.certificationRequestToPem(csr),
      privateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
    };
  }
}
