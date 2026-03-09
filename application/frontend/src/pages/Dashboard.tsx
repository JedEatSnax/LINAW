import { Sidebar } from "../components/hamburger";
import { Homedash } from "../components/homedash";
import { Topbar } from "../components/header";

export function Dashboard() {
    return(
        <main>
            <Topbar />
            <Sidebar />
            <Homedash />
        </main>
    );
}

export default Dashboard