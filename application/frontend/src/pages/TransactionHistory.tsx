import { Sidebar } from "../components/hamburger";
import { Topbar } from "../components/header";

export function TransactionHistory() {
    return(
        <main>
            <Topbar />
            <Sidebar />
            <h1>Transaction History</h1>
        </main>
    );
}

export default TransactionHistory