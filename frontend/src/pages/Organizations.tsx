import Sidebar from "../components/sidebar";

import axios from "axios";
import { useState } from "react";

type PeerStartResponse = {
  ok: boolean;
  message?: string;
  organization?: string;
  peerName?: string;
  pid?: number;
  command?: string;
  error?: string;
};

type ProvisionedOrganization = {
  id: string;
  organizationName: string;
  slug: string;
  mspId: string;
  domain: string;
  adminIdentity: {
    enrollmentId: string;
    email: string;
    secret: string;
    status: string;
  };
  networkAttachment: {
    channel: string;
    status: string;
  };
  createdAt: string;
};

type ProvisionResponse = {
  ok: boolean;
  message?: string;
  organization?: ProvisionedOrganization;
  error?: string;
};

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";

export function Organizations() {
  const [organization, setOrganization] = useState("org1");
  const [peerResponse, setPeerResponse] = useState<PeerStartResponse | null>(
    null,
  );
  const [isLaunching, setIsLaunching] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [channelName, setChannelName] = useState("mychannel");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionResponse, setProvisionResponse] =
    useState<ProvisionResponse | null>(null);

  async function startPeerNode() {
    setIsLaunching(true);
    setPeerResponse(null);

    try {
      const result = await axios.post<PeerStartResponse>(
        `${backendUrl}/api/v1/fabric/peer/start`,
        {
          organization,
        },
      );
      setPeerResponse(result.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setPeerResponse({
          ok: false,
          error: error.response?.data?.error ?? error.message,
        });
      } else {
        setPeerResponse({
          ok: false,
          error: "Unable to launch the peer node",
        });
      }
    } finally {
      setIsLaunching(false);
    }
  }

  async function provisionOrganization() {
    setIsProvisioning(true);
    setProvisionResponse(null);

    try {
      const result = await axios.post<ProvisionResponse>(
        `${backendUrl}/api/v1/fabric/org/provision`,
        {
          organizationName,
          adminEmail,
          domain,
          channelName,
        },
      );
      setProvisionResponse(result.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setProvisionResponse({
          ok: false,
          error: error.response?.data?.error ?? error.message,
        });
      } else {
        setProvisionResponse({
          ok: false,
          error: "Unable to provision the organization",
        });
      }
    } finally {
      setIsProvisioning(false);
    }
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto bg-zinc-950 px-6 py-10 text-zinc-100">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-blue-400">
                Organizations
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white">
                Provision and operate organizations
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                Provision a new organization, issue its first admin identity,
                attach it to a channel, and start a peer node. The test-network
                still needs the crypto material created by{" "}
                <span className="text-zinc-200">./network.sh up</span>.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/30">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                Org lifecycle
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">
                Provision organization
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="block text-sm font-medium text-zinc-300"
                    htmlFor="organizationName"
                  >
                    Organization name
                  </label>
                  <input
                    id="organizationName"
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                    value={organizationName}
                    onChange={(event) =>
                      setOrganizationName(event.target.value)
                    }
                    placeholder="Acme Payments"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-zinc-300"
                    htmlFor="adminEmail"
                  >
                    Admin email
                  </label>
                  <input
                    id="adminEmail"
                    type="email"
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                    value={adminEmail}
                    onChange={(event) => setAdminEmail(event.target.value)}
                    placeholder="admin@acme.example"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-zinc-300"
                    htmlFor="domain"
                  >
                    Domain (optional)
                  </label>
                  <input
                    id="domain"
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                    value={domain}
                    onChange={(event) => setDomain(event.target.value)}
                    placeholder="acme.linaw.example.com"
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-zinc-300"
                    htmlFor="channelName"
                  >
                    Channel
                  </label>
                  <input
                    id="channelName"
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                    value={channelName}
                    onChange={(event) => setChannelName(event.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={provisionOrganization}
                disabled={isProvisioning}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProvisioning ? "Provisioning..." : "Provision organization"}
              </button>

              {provisionResponse ? (
                <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <p
                    className={
                      provisionResponse.ok ? "text-blue-400" : "text-rose-400"
                    }
                  >
                    {provisionResponse.ok
                      ? provisionResponse.message
                      : provisionResponse.error}
                  </p>
                  {provisionResponse.organization ? (
                    <div className="mt-3 space-y-1 text-sm text-zinc-300">
                      <p>
                        Name: {provisionResponse.organization.organizationName}
                      </p>
                      <p>MSP: {provisionResponse.organization.mspId}</p>
                      <p>Domain: {provisionResponse.organization.domain}</p>
                      <p>
                        Identity:{" "}
                        {
                          provisionResponse.organization.adminIdentity
                            .enrollmentId
                        }
                      </p>
                      <p>
                        Enrollment secret:{" "}
                        {provisionResponse.organization.adminIdentity.secret}
                      </p>
                      <p>
                        Channel:{" "}
                        {
                          provisionResponse.organization.networkAttachment
                            .channel
                        }
                      </p>
                      <p>
                        Attachment status:{" "}
                        {
                          provisionResponse.organization.networkAttachment
                            .status
                        }
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/30">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                Node operations
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">
                Launch peer node
              </h2>
              <label
                className="mt-4 block text-sm font-medium text-zinc-300"
                htmlFor="organization"
              >
                Organization
              </label>
              <select
                id="organization"
                className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                value={organization}
                onChange={(event) => setOrganization(event.target.value)}
              >
                <option value="org1">Org1</option>
                <option value="org2">Org2</option>
              </select>

              <button
                type="button"
                onClick={startPeerNode}
                disabled={isLaunching}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLaunching ? "Launching..." : "Invoke peer node start"}
              </button>
            </div>

            {peerResponse ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
                <p
                  className={
                    peerResponse.ok ? "text-blue-400" : "text-rose-400"
                  }
                >
                  {peerResponse.ok ? peerResponse.message : peerResponse.error}
                </p>
                <div className="mt-4 space-y-2 text-sm text-zinc-300">
                  {peerResponse.organization ? (
                    <p>Organization: {peerResponse.organization}</p>
                  ) : null}
                  {peerResponse.peerName ? (
                    <p>Peer: {peerResponse.peerName}</p>
                  ) : null}
                  {peerResponse.pid ? <p>PID: {peerResponse.pid}</p> : null}
                  {peerResponse.command ? (
                    <p>Command: {peerResponse.command}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Organizations;
