import { Sidebar } from "../components/sidebar";
import { Topbar } from "../components/topbar";

export function QueryLedger() {
    return(
        <main>
            <Topbar />
            <Sidebar />
            <h1>Query Ledger</h1>
        </main>
    );
}

export default QueryLedger;