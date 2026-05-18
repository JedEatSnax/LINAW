// Type definitions for tenant management
export interface TenantProvisionRequest {
  tenantName: string;
  tlsAdminUser: string;
  tlsAdminPassword: string;
  orgAdminUser: string;
  orgAdminPassword: string;
}

export interface TenantMetadata {
  tenantId: string;
  tenantName: string;
  tlsCaName: string;
  orgCaName: string;
  tlsCaPort: number;
  tlsCaOpsPort: number;
  orgCaPort: number;
  orgCaOpsPort: number;
  tlsCertPem: string;
  tlsAdminUser: string;
  tlsAdminPasswordEncrypted: string; // Encrypted
  orgAdminUser: string;
  orgAdminPasswordEncrypted: string; // Encrypted
  status: "initializing" | "ready" | "error";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeProvisionRequest {
  nodeId: string;
  nodeType: "peer" | "orderer";
  nodeSecret: string;
  affiliation?: string;
  attributes?: Record<string, string>;
}

export interface NodeMetadata {
  nodeId: string;
  tenantId: string;
  nodeType: "peer" | "orderer";
  tlsCertPem: string;
  identityCertPem: string;
  privateKeyPem: string;
  status: "enrolled" | "revoked";
  enrolledAt: Date;
}

// Validation
export function validateTenantProvisionRequest(
  req: unknown,
): TenantProvisionRequest {
  if (!req || typeof req !== "object") {
    throw new Error("Invalid request body");
  }

  const r = req as Record<string, unknown>;

  const validate = (field: string, value: unknown): string => {
    if (typeof value !== "string") {
      throw new Error(`${field} must be a string`);
    }
    if (value.length === 0) {
      throw new Error(`${field} is required`);
    }
    if (value.length > 128) {
      throw new Error(`${field} exceeds max length of 128`);
    }
    // Prevent special chars that could break Docker/Fabric
    const dangerousChars = /[;&|`$()\\"'\s:@/]/;
    if (dangerousChars.test(value)) {
      throw new Error(`${field} contains invalid characters`);
    }
    return value;
  };

  return {
    tenantName: validate("tenantName", r["tenantName"]),
    tlsAdminUser: validate("tlsAdminUser", r["tlsAdminUser"]),
    tlsAdminPassword: validate("tlsAdminPassword", r["tlsAdminPassword"]),
    orgAdminUser: validate("orgAdminUser", r["orgAdminUser"]),
    orgAdminPassword: validate("orgAdminPassword", r["orgAdminPassword"]),
  };
}

export function validateNodeProvisionRequest(
  req: unknown,
): NodeProvisionRequest {
  if (!req || typeof req !== "object") {
    throw new Error("Invalid request body");
  }

  const r = req as Record<string, unknown>;

  const validateId = (field: string, value: unknown): string => {
    if (typeof value !== "string") {
      throw new Error(`${field} must be a string`);
    }
    if (!/^[a-z0-9-]+$/.test(value)) {
      throw new Error(`${field} must be alphanumeric with hyphens only`);
    }
    return value;
  };

  const validateStr = (field: string, value: unknown): string => {
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(`${field} is required`);
    }
    return value;
  };

  return {
    nodeId: validateId("nodeId", r["nodeId"]),
    nodeType:
      r["nodeType"] === "peer" || r["nodeType"] === "orderer"
        ? (r["nodeType"] as "peer" | "orderer")
        : (() => {
            throw new Error("nodeType must be peer or orderer");
          })(),
    nodeSecret: validateStr("nodeSecret", r["nodeSecret"]),
    affiliation: r["affiliation"]
      ? validateId("affiliation", r["affiliation"])
      : undefined,
    attributes:
      r["attributes"] && typeof r["attributes"] === "object"
        ? (r["attributes"] as Record<string, string>)
        : undefined,
  };
}
