import Sidebar from "../components/sidebar";
import { Header } from "../components/header";

export function TransactionHistory() {
    return(
        <main>
            <Header />
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    <h1 className="font-ibm-mono text-amber-400">Transaction History</h1>
                </div>
            </div>
        </main>
    );
}

export default TransactionHistory