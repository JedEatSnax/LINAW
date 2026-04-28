import Sidebar from '../components/sidebar';
import { uiClasses } from '../components/uiClasses';



export function Chaincode() {
    return (
        <main className="h-screen overflow-hidden flex flex-col">
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className={uiClasses.sectionTitle}>
                        Chaincode
                        <hr className="border-gray-700 mt-2"></hr>
                    </div>
                </div>
            </div>
        </main>
    );
}