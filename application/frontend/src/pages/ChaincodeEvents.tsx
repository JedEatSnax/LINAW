import { Sidebar } from "../components/hamburger";
import { Topbar } from "../components/header";

export function ChaincodeEvents() {
    return(
        <main>
            <Topbar />
            <Sidebar />
            <h1>Chaincode Event</h1>
        </main>
    );
}

export default ChaincodeEvents