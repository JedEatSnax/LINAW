import { Sidebar } from "../components/sidebar";
import { Homedash } from "../components/homedash";
import { Topbar } from "../components/topbar";

function Dashboard() {
    return(
        <main>
            <Topbar />
            <Sidebar />
            <Homedash />
        </main>
    );
}

export default Dashboard;