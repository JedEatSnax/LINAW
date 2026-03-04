import { Sidebar } from "../components/sidebar";
import { Topbar } from "../components/topbar";

export function ChaincodeEvent() {
    return(
        <main>
            <Topbar />
            <Sidebar />
            <h1>Chaincode Event</h1>
        </main>
    );
}

export default ChaincodeEvent;