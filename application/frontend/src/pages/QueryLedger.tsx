import { Header } from "../components/header";
import Sidebar from "../components/sidebar";

export function QueryLedger() {
    return(
        <main>
            <Header />
            <Sidebar />
            <h1>Query Ledger</h1>
        </main>
    );
}

export default QueryLedger