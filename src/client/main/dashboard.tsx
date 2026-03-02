import { Sidebar } from "../components/sidebar";
import { Homedash } from "../components/homedash";

function Dashboard() {
    return(
        <main className="grid gap-4 p-4 grid-cols-[220px,1fr]">
            <Sidebar />
            <Homedash />
        </main>
    );
}

export default Dashboard;