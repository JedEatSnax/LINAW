import {
  createHash,
  createSign,
  createVerify,
  generateKeyPairSync,
} from "crypto";

/**
 * Generates an ECDSA P-256 key pair for enrollment identity
 */
export function generateEnrollmentKeyPair(): {
  privateKey: string;
  publicKey: string;
} {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return {
    privateKey: privateKey as string,
    publicKey: publicKey as string,
  };
}

/**
 * Computes the enrollment token signature for authenticated Fabric CA API calls
 *
 * Token format: base64(cert) + "." + base64(signature)
 * Signature covers: method + "." + path + "." + base64(sha256(body)) + "." + base64(cert)
 */
export function signEnrollmentToken(
  method: string,
  path: string,
  body: string,
  enrollmentCertPem: string,
  privateKeyPem: string,
): string {
  // Compute SHA256 hash of body
  const bodyHash = createHash("sha256").update(body).digest();
  const bodyHashB64 = bodyHash.toString("base64");

  // Base64 encode the certificate (remove PEM delimiters and newlines)
  const certPem = enrollmentCertPem
    .replace(/-----BEGIN CERTIFICATE-----\n?/, "")
    .replace(/\n?-----END CERTIFICATE-----/, "")
    .replace(/\n/g, "");

  // Construct the data to be signed
  const dataToSign = `${method}.${path}.${bodyHashB64}.${certPem}`;

  // Sign with private key using ECDSA-SHA256
  const sign = createSign("SHA256");
  sign.update(dataToSign);
  const signature = sign.sign(privateKeyPem);
  const signatureB64 = signature.toString("base64");

  // Return token: cert.signature
  return `${certPem}.${signatureB64}`;
}

/**
 * Verifies an enrollment token (for testing/validation)
 */
export function verifyEnrollmentToken(
  token: string,
  method: string,
  path: string,
  body: string,
  publicKeyPem: string,
): boolean {
  const [certB64, signatureB64] = token.split(".");
  if (!certB64 || !signatureB64) {
    return false;
  }

  try {
    const bodyHash = createHash("sha256").update(body).digest();
    const bodyHashB64 = bodyHash.toString("base64");

    const dataToVerify = `${method}.${path}.${bodyHashB64}.${certB64}`;
    const signature = Buffer.from(signatureB64, "base64");

    const verify = createVerify("SHA256");
    verify.update(dataToVerify);
    return verify.verify(publicKeyPem, signature);
  } catch {
    return false;
  }
}
