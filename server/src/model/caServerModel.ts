export interface FabricCommandSpec {
  file: string;
  args: string[];
  display: string;
}

export interface CommandExecutionResult {
  stdout: string;
  stderr: string;
}

export interface CaServerCommandBase {
  orgUser?: string;
  orgPassword?: string;
  caname?: string;
}

export interface CaServerCommandInput extends CaServerCommandBase {
  containerName?: string;
}

export interface NormalizedCaServerCommandInput extends CaServerCommandBase {
  containerName: string;
  orgUser: string;
  orgPassword: string;
  caname?: string;
}

export const CA_SERVER_COMMAND_DEFAULTS = {
  commandTimeoutMs: 30_000,
  commandMaxBufferBytes: 1024 * 1024,
  defaultFabricCaFlags: ["--cors.enabled"],
};

function toStringOrUndefined(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return undefined;
}

function validateCredential(credential: string, fieldName: string): void {
  // Prevent flag injection (e.g., "-b admin")
  if (credential.startsWith("-")) {
    throw new Error(`${fieldName} format is invalid`);
  }

  // Prevent colon which breaks user:password format
  if (credential.includes(":")) {
    throw new Error(`${fieldName} format is invalid`);
  }

  // Prevent shell metacharacters
  const dangerousChars = /[;&|`$()\\"'\s]/;
  if (dangerousChars.test(credential)) {
    throw new Error(`${fieldName} format is invalid`);
  }
}

export function normalizeCaServerCommandInput(
  input: CaServerCommandInput = {},
): NormalizedCaServerCommandInput {
  const containerName = toStringOrUndefined(input.containerName);
  const orgUser = toStringOrUndefined(input.orgUser);
  const orgPassword = toStringOrUndefined(input.orgPassword);
  const caname = toStringOrUndefined(input.caname);

  if (!containerName) {
    throw new Error("containerName is required for Fabric CA commands");
  }

  if (!orgUser || !orgPassword) {
    throw new Error(
      "orgUser and orgPassword are required for Fabric CA commands",
    );
  }

  // Validate credentials to prevent command injection
  validateCredential(orgUser, "orgUser");
  validateCredential(orgPassword, "orgPassword");

  // Optional CA name may be provided (flag: --caname)
  if (caname) {
    validateCredential(caname, "caname");
  }

  return {
    containerName,
    orgUser,
    orgPassword,
    caname,
  };
}
