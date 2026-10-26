export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);

  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
