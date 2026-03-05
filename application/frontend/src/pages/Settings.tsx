import { Sidebar } from "../components/sidebar";
import { Topbar } from "../components/topbar";

export function Settings() {
    return(
        <main>
            <Topbar />
            <Sidebar />
            <h1>Settings</h1>
        </main>
    );
}


export default Settings