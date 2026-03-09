import { Sidebar } from "../components/sidebar";
import { Topbar } from "../components/topbar";

export function SubmitTransaction() {
    return(
        <main>
            <Topbar />
            <Sidebar />
            <h1>Submit Transaction</h1>
        </main>
    );
}

export default SubmitTransaction