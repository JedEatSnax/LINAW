import { Sidebar } from "../components/sidebar";
import { Homedash } from "../components/homedash";
import { Topbar } from "../components/topbar";

export function Dashboard() {
    return(
        <main>
            <Header />
            <Sidebar />
        </main>
    );
}

export default Dashboard