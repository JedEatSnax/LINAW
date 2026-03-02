import { Link } from "react-router-dom";


function Home() {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold mb-4">Welcome to the Home Page!</h1>
            </div>

            <div className="flex items-center justify-center space-x-4 ">
                <button className="bg-green-500 text-white px-4 py-2 rounded"><Link to="/register">Register</Link></button>
                <button className="bg-blue-500 text-white px-4 py-2 rounded"><Link to="/login">Login</Link></button>
            </div>
        </div>
    );
}

export default Home;