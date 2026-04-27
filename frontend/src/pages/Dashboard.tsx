import Sidebar from "../components/sidebar";

export function Dashboard() {
  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto bg-zinc-950 px-6 py-10 text-zinc-100">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-blue-400">
                Dashboard
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white">
                Manage and oversee consortiums
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                Manage your consortium or business network, which is comprised
                of grouped organizations that have the same goals.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/30">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                consortium lifecycle
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
