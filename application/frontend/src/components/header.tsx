"use-client";

export const Header = () => {
    return (
        <div>
            <header className="bg-gray-950 border-b border-gray-700 flex justify-between p-4 h-16">
                <button className="text-amber-500 font-bo lg:hidden">
                    ☰
                </button>
                <h1 className="text-amber-500 font-bold font-ibm-mono tracking-widest">
                    LINAW FABRIC EXPLORER
                </h1>
                <div className="bg-gray-700 w-10 h-10 rounded-full">

                </div>
            </header>
        </div>
    );
}