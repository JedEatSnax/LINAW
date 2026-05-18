import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const SALT_LENGTH = 16;
const IV_LENGTH = 16;

/**
 * Encrypts a string value (e.g., passwords)
 * Returns: salt:iv:encrypted:tag (all base64 encoded and separated by colons)
 */
export function encryptValue(plaintext: string, masterKey: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const key = scryptSync(masterKey, salt, 32);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return [
    salt.toString("base64"),
    iv.toString("base64"),
    encrypted,
    tag.toString("base64"),
  ].join(":");
}

/**
 * Decrypts a string value
 * Input: salt:iv:encrypted:tag (from encryptValue)
 */
export function decryptValue(encrypted: string, masterKey: string): string {
  const parts = encrypted.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted value format");
  }

  const salt = Buffer.from(parts[0]!, "base64");
  const iv = Buffer.from(parts[1]!, "base64");
  const encryptedData = parts[2]!;
  const tag = Buffer.from(parts[3]!, "base64");

  const key = scryptSync(masterKey, salt, 32);
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  // Work with Buffers to satisfy TypeScript overloads and avoid encoding overload ambiguity
  const decryptedChunks: Buffer[] = [];
  decryptedChunks.push(decipher.update(Buffer.from(encryptedData, "hex")));
  decryptedChunks.push(decipher.final());
  const decryptedBuf = Buffer.concat(decryptedChunks);

  return decryptedBuf.toString("utf8");
}

/**
 * Generate a random encryption key (call once, store securely)
 */
export function generateMasterKey(): string {
  return randomBytes(32).toString("hex");
}
