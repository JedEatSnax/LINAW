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

  const nodeId = validateId("nodeId", r["nodeId"]);
  const nodeTypeValue = r["nodeType"];
  const nodeSecret = validateStr("nodeSecret", r["nodeSecret"]);
  const affiliationValue = r["affiliation"];
  const attributesValue = r["attributes"];

  return {
    nodeId,
    nodeType:
      nodeTypeValue === "peer" || nodeTypeValue === "orderer"
        ? nodeTypeValue
        : (() => {
            throw new Error("nodeType must be peer or orderer");
          })(),
    nodeSecret,
    affiliation: affiliationValue
      ? validateId("affiliation", affiliationValue)
      : undefined,
    attributes:
      attributesValue && typeof attributesValue === "object"
        ? (attributesValue as Record<string, string>)
        : undefined,
  };
}
