import Sidebar from "../components/sidebar";
import { Header } from "../components/header";

export function SubmitTransaction() {
    return(
        <main>
            <Header />

            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    
                    <div className="font-ibm-mono text-slate-300 font-bold text-xl tracking-wide mb-6">
                        <h1>Submit Transaction</h1>
                        <hr className="border-gray-700 mt-2"></hr>
                    </div>

                    <div className="bg-slate-900/60 border border-gray-700 border-l-3 border-l-amber-500 rounded-md p-6 shadow-md">
                        <h1 className="font-ibm-mono text-amber-500 font-bold text-lg">
                            How does Submit Transaction work?
                        </h1>
                        <p className="font-ibm-sans text-slate-300 mt-2">
                            Placeholder text.
                        </p>
                    </div>

                </div>
            </div>
        </main>
    );
}

export default SubmitTransaction