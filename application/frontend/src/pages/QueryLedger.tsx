import { Sidebar } from "../components/hamburger";
import { Topbar } from "../components/header";

export function QueryLedger() {
    return(
        <main>
            <Topbar />
            <Sidebar />
            <h1>Query Ledger</h1>
        </main>
    );
}

export default QueryLedger