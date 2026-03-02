import { Link } from "react-router-dom";


function Register() {
    return (
            <div className="text-3xl flex items-center justify-center h-screen">
                <div className="flex flex-col items-center justify-center">
                    <div className="bg-gray-800 font-mono p-4 rounded shadow-md w-80">
                        <form>
                            <div className="flex items-center justify-center">
                                <h1 className="text-2xl text-amber-400 font-bold mb-4 p-2">Register</h1>
                            </div>
                                
                            <div>
                                <input type="text" placeholder="Username" className="text-lg mb-2 p-2 border border-gray-300 text-gray-400 rounded w-full" id="username"/>
                             </div>
                                
                             <div>
                                <input type="email" placeholder="Email" className="text-lg mb-2 p-2 border border-gray-300 text-gray-400 rounded w-full" id="email"/>
                            </div>

                            <div>
                                <input type="password" placeholder="Password" className="text-lg mb-2 p-2 border border-gray-300 text-gray-400 rounded w-full" id="password"/>
                            </div>

                             <div>
                                <input type="password" placeholder="Confirm Password" className="text-lg mb-2 p-2 border border-gray-300 text-gray-400 rounded w-full" id="confirmPassword"/>
                            </div>

                            <div className="mb-2 flex items-center justify-center">
                                <button className="bg-amber-600 text-white text-lg px-4 py-2 rounded w-full" id="registerButton">Register</button>
                            </div>

                            <div className="flex flex-col items-center justify-center mt-1">
                                <Link to="/login" className="text-amber-300 text-sm">Already have an account?</Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
    );
}

export default Register;