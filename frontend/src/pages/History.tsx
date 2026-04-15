import Sidebar from "../components/sidebar";
import { Header } from "../components/header";
import { uiClasses } from "../components/uiClasses";

export function History() {
    return(
        <main className="h-screen overflow-hidden flex flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className={uiClasses.sectionTitle}>
                        Transaction History
                        <hr className="border-gray-700 mt-2"></hr>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default History