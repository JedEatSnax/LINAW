"use client";
import Sidebar from "../components/sidebar";
import { Header } from "../components/header";
export function Assets() {
    return(
        <main className="h-screen overflow-hidden flex flex-col">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <div className="flex-1 p-6 overflow-y-auto">
                    <h1 className="font-ibm-mono text-amber-400">Assets</h1>
                </div>
            </div>
        </main>
    );
}

export default Assets