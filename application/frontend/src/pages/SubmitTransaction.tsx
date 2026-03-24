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

                    <div className="bg-slate-900/60 border border-gray-700 border-l-3 border-l-amber-500 rounded-md p-6 shadow-md mb-6">
                        <h1 className="font-ibm-mono text-amber-500 font-bold text-lg">
                            How does Submit Transaction work?
                        </h1>
                        <p className="font-ibm-sans text-slate-300 mt-2">
                            Placeholder text.
                        </p>
                    </div>

                    <div className="bg-slate-900/60 border border-gray-700 rounded-md shadow-md mb-6">
                        <div className="font-ibm-mono text-slate-300/80 font-bold text-sm p-4 pb-4">
                            CREATE ASSET
                        </div>

                        <div className="bg-slate-900/60 border-t border-gray-700 shadow-md p-4">
                            <form className="grid grid-cols-5 gap-4">
                                <div className="">
                                    <label className="font-ibm-sans block text-slate-300/70 text-sm font-bold mb-2" htmlFor="assetID">
                                        ASSET ID *
                                    </label>
                                    <input className="bg-slate-900/60 border border-gray-700 shadow appearance-none rounded w-full py-2 px-3 text-slate-300 leading-tight focus:outline-none focus:shadow-outline" id="assetID" type="text" placeholder="Enter asset ID"/>
                                </div>

                                <div className="">
                                    <label className="font-ibm-sans block text-slate-300/70 text-sm font-bold mb-2" htmlFor="color">
                                        COLOR *
                                    </label>
                                    <input className="bg-slate-900/60 border border-gray-700 shadow appearance-none rounded w-full py-2 px-3 text-slate-300 leading-tight focus:outline-none focus:shadow-outline" id="color" type="text" placeholder="Enter color"/>
                                </div>

                                <div className="">
                                    <label className="font-ibm-sans block text-slate-300/70 text-sm font-bold mb-2" htmlFor="size">
                                        SIZE *
                                    </label>
                                    <input className="bg-slate-900/60 border border-gray-700 shadow appearance-none rounded w-full py-2 px-3 text-slate-300 leading-tight focus:outline-none focus:shadow-outline" id="size" type="text" placeholder="Enter size"/>
                                </div>

                                <div className="">
                                    <label className="font-ibm-sans block text-slate-300/70 text-sm font-bold mb-2" htmlFor="owner">
                                        OWNER *
                                    </label>
                                    <input className="bg-slate-900/60 border border-gray-700 shadow appearance-none rounded w-full py-2 px-3 text-slate-300 leading-tight focus:outline-none focus:shadow-outline" id="owner" type="text" placeholder="Enter owner"/>
                                </div>

                                <div className="">
                                    <label className="font-ibm-sans block text-slate-300/70 text-sm font-bold mb-2" htmlFor="appraisedValue">
                                        APPRAISED VALUE *
                                    </label>
                                    <input className="bg-slate-900/60 border border-gray-700 shadow appearance-none rounded w-full py-2 px-3 text-slate-300 leading-tight focus:outline-none focus:shadow-outline" id="appraisedValue" type="text" placeholder="Enter appraised value"/>
                                </div>
                                
                            </form>
                        </div>
                    </div>
                    
                </div>
            </div>
        </main>
    );
}

export default SubmitTransaction