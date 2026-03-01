import { Sidebar } from "../components/sidebar";

function Home() {
    return (
        <div className="flex items-center justify-center h-screen">
            <h1 className="text-4xl font-bold mb-4">Welcome to the Home Page!</h1>
            <Sidebar />
        </div>
    );
}

export default Home;