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

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";

export function Organizations() {
  const [organization, setOrganization] = useState("org1");
  const [response, setResponse] = useState<PeerStartResponse | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  async function startPeerNode() {
    setIsLaunching(true);
    setResponse(null);

    try {
      const result = await axios.post<PeerStartResponse>(
        `${backendUrl}/api/v1/fabric/peer/start`,
        {
          organization,
        },
      );
      setResponse(result.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setResponse({
          ok: false,
          error: error.response?.data?.error ?? error.message,
        });
      } else {
        setResponse({
          ok: false,
          error: "Unable to launch the peer node",
        });
      }
    } finally {
      setIsLaunching(false);
    }
  }

  return (
    <main className="h-screen overflow-hidden flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-hidden bg-zinc-950 px-6 py-10 text-zinc-100">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-blue-400">
                Organizations
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white">
                Launch a peer node
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                This page calls the backend, which launches the Fabric CLI
                command in the background. The test-network still needs the
                crypto material created by{" "}
                <span className="text-zinc-200">./network.sh up</span>.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/30">
              <label
                className="block text-sm font-medium text-zinc-300"
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

            {response ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
                <p className={response.ok ? "text-blue-400" : "text-rose-400"}>
                  {response.ok ? response.message : response.error}
                </p>
                <div className="mt-4 space-y-2 text-sm text-zinc-300">
                  {response.organization ? (
                    <p>Organization: {response.organization}</p>
                  ) : null}
                  {response.peerName ? <p>Peer: {response.peerName}</p> : null}
                  {response.pid ? <p>PID: {response.pid}</p> : null}
                  {response.command ? <p>Command: {response.command}</p> : null}
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
