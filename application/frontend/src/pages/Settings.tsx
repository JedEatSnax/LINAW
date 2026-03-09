import { Sidebar } from "../components/hamburger";
import { Topbar } from "../components/header";

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