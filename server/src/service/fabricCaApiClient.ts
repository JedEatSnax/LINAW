import https from "https";

export interface EnrollRequest {
  certificate_request: string;
  caname?: string;
  attr_reqs?: Array<{ name: string; optional: boolean }>;
}

export interface EnrollResponse {
  success: boolean;
  result?: {
    Cert: string; // base64 encoded cert
    ServerInfo: {
      CAName: string;
      CAChain: string;
      IssuerPublicKey: string;
      IssuerRevocationPublicKey: string;
      Version: string;
    };
  };
  errors?: Array<{ code: number; message: string }>;
}

export interface RegisterRequest {
  id: string;
  type: string;
  secret?: string;
  max_enrollments?: number;
  affiliation?: string;
  attrs?: Array<{ name: string; value: string; ecert?: boolean }>;
  caname?: string;
}

export interface RegisterResponse {
  success: boolean;
  result?: {
    secret: string;
  };
  errors?: Array<{ code: number; message: string }>;
}

export interface CAInfoResponse {
  success: boolean;
  result?: {
    CAName: string;
    CAChain: string;
    IssuerPublicKey: string;
    IssuerRevocationPublicKey: string;
    Version: string;
  };
  errors?: Array<{ code: number; message: string }>;
}

/**
 * HTTP client for Fabric CA REST API
 */
export class FabricCaApiClient {
  private hostname: string;
  private port: number;

  constructor(caUrl: string) {
    // Parse URL: "localhost:7054" or "https://localhost:7054"
    const urlStr = caUrl.includes("://") ? caUrl : `https://${caUrl}`;
    const url = new URL(urlStr);
    this.hostname = url.hostname;
    this.port = url.port ? parseInt(url.port) : 443;
  }

  /**
   * POST /api/v1/enroll — Enroll with HTTP Basic Auth
   */
  async enroll(
    enrollmentId: string,
    enrollmentSecret: string,
    csr: string,
    caname?: string,
  ): Promise<EnrollResponse> {
    const basicAuth = Buffer.from(
      `${enrollmentId}:${enrollmentSecret}`,
    ).toString("base64");

    const body: EnrollRequest = {
      certificate_request: csr,
    };

    if (caname) {
      body.caname = caname;
    }

    return this.post("/api/v1/enroll", JSON.stringify(body), {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
    });
  }

  /**
   * POST /api/v1/register — Register identity with enrollment token
   */
  async register(
    token: string,
    request: RegisterRequest,
  ): Promise<RegisterResponse> {
    return this.post("/api/v1/register", JSON.stringify(request), {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });
  }

  /**
   * POST /api/v1/reenroll — Reenroll with enrollment token
   */
  async reenroll(
    token: string,
    csr: string,
    caname?: string,
  ): Promise<EnrollResponse> {
    const body: any = {
      request: csr,
    };
    if (caname) {
      body.caname = caname;
    }

    return this.post("/api/v1/reenroll", JSON.stringify(body), {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });
  }

  /**
   * GET /api/v1/cainfo — Get CA info (no auth required)
   */
  async getCAInfo(caname?: string): Promise<CAInfoResponse> {
    const path = caname ? `/api/v1/cainfo?ca=${caname}` : "/api/v1/cainfo";
    return this.get(path);
  }

  /**
   * Generic POST helper
   */
  private post(
    path: string,
    body: string,
    headers: Record<string, string>,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.hostname,
        port: this.port,
        path,
        method: "POST",
        headers: {
          "Content-Length": Buffer.byteLength(body),
          ...headers,
        },
        rejectUnauthorized: false, // For self-signed certs in dev
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      });

      req.on("error", reject);
      req.write(body);
      req.end();
    });
  }

  /**
   * Generic GET helper
   */
  private get(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.hostname,
        port: this.port,
        path,
        method: "GET",
        rejectUnauthorized: false, // For self-signed certs in dev
      };

      https
        .get(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new Error(`Failed to parse response: ${data}`));
            }
          });
        })
        .on("error", reject);
    });
  }
}
