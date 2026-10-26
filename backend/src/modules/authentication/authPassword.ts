const ITERATIONS = 40_000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

const encoder = new TextEncoder();

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    HASH_LENGTH * 8,
  );

  const hash = new Uint8Array(derivedBits);

  return [
    "pbkdf2",
    "sha256",
    ITERATIONS,
    toBase64Url(salt),
    toBase64Url(hash),
  ].join("$");
}

export async function verifyPassword(
  storedHash: string,
  password: string,
): Promise<boolean> {
  const parts = storedHash.split("$");

  if (parts.length !== 5) {
    return false;
  }

  const [
    algorithm,
    hashAlgorithm,
    iterationsString,
    saltEncoded,
    expectedHashEncoded,
  ] = parts;

  if (
    algorithm !== "pbkdf2" ||
    hashAlgorithm !== "sha256" ||
    !iterationsString ||
    !saltEncoded ||
    !expectedHashEncoded
  ) {
    return false;
  }

  const iterations = Number(iterationsString);

  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  let salt: Uint8Array;
  let expectedHash: Uint8Array;

  try {
    salt = fromBase64Url(saltEncoded);
    expectedHash = fromBase64Url(expectedHashEncoded);
  } catch {
    return false;
  }

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as unknown as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    expectedHash.length * 8,
  );

  const actualHash = new Uint8Array(derivedBits);

  return constantTimeEqual(actualHash, expectedHash);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");

  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }

  return result === 0;
}
