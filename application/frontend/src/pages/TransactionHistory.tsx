import Sidebar from "../components/sidebar";
import { Topbar } from "../components/topbar";

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