import { Link } from "react-router-dom";

function Login() {
    return (
        <div className="Login">
            <div className="text-3xl font-bold flex items-center justify-center h-screen">
                <div className="flex flex-col items-center justify-center">
                    <form className="bg-white p-6 rounded shadow-md">
                        <div>
                            <h1 className="text-4xl font-bold mb-4">Login</h1>
                        </div>
                        
                        <div>
                            <input type="text" placeholder="Username" className="mb-2 p-2 border border-gray-300 rounded" id="username"/>
                        </div>

                        <div>
                            <input type="password" placeholder="Password" className="mb-4 p-2 border border-gray-300 rounded" id="password" />
                        </div>

                        <div>
                            <button className="bg-blue-500 text-white px-4 py-2 rounded" id="loginButton">Login</button>
                        </div>

                        <div className="mt-4">
                            <a href="#" className="text-blue-500">Forgot password?</a>
                        </div>

                        <div>
                            <span className="text-gray-500">Don't have an account? <Link to ="register" className="text-blue-500">Register here</Link> </span>
                        </div>
                        
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;