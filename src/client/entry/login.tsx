import { Link } from "react-router-dom";
function Login() {
    return (
            <div className="text-3xl flex items-center justify-center h-screen">
                <div className="flex flex-col items-center justify-center">
                    <form className="bg-gray-800 font-mono p-4 rounded shadow-md w-80">
                        <div className="flex items-center justify-center">
                            <h1 className="text-2xl font-bold mb-4 text-amber-400">Login</h1>
                        </div>
                        
                        <div>
                            <input type="text" placeholder="Username" className="text-lg mb-2 p-2 border border-gray-300 rounded text-gray-400 w-full" id="username"/>
                        </div>

                        <div>
                            <input type="password" placeholder="Password" className="text-lg mb-2 p-2 border border-gray-300 rounded text-gray-400 w-full" id="password" />
                        </div>

                        <div>
                            <button className="bg-amber-600 text-white text-lg px-4 py-2 rounded w-full" id="loginButton">Login</button>
                        </div>

                        <div className="flex flex-col items-center justify-center mt-1">
                            <a href="#" className="text-amber-300 text-sm">Forgot password?</a> 
                            <span className="text-gray-300 text-sm">Don't have an account? <Link to="/register" className="text-amber-300 text-sm">Register here</Link> </span>
                        </div>
                    </form>
                </div>
            </div>
    );
}

export default Login;