import { Sidebar } from "../components/sidebar";
import { Homedash } from "../components/homedash";
import { Topbar } from "../components/topbar";
import { Header } from "../components/header";

export function Dashboard() {
    return(
        <main>
            <Header />
            <Sidebar />
            <Homedash />
        </main>
    );
}

export default Dashboard