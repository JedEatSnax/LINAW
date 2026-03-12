import { Header } from "../components/header";
import Sidebar from "../components/sidebar";

export function TransactionHistory() {
    return(
        <main>
            <Header />
            <Sidebar />
            <h1>Transaction History</h1>
        </main>
    );
}

export default TransactionHistory