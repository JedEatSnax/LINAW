import { Sidebar } from "../components/hamburger";
import { Topbar } from "../components/header";

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