import { Link } from "react-router-dom";


function Register() {
    return (
            <div className="text-3xl font-bold flex items-center justify-center h-screen">
                <div className="flex flex-col items-center justify-center">
                    <form className="bg-white p-6 rounded shadow-md">
                        <div>
                            <form>
                                <h1 className="text-4xl font-bold mb-4 p-2">Register</h1>
                                
                                <div>
                                    <input type="text" placeholder="Username" className="mb-2 p-2 border border-gray-300 rounded" id="username"/>
                                </div>
                                
                                <div>
                                    <input type="email" placeholder="Email" className="mb-2 p-2 border border-gray-300 rounded" id="email"/>
                                </div>

                                <div>
                                    <input type="password" placeholder="Password" className="mb-2 p-2 border border-gray-300 rounded" id="password"/>
                                </div>

                                <div>
                                    <input type="password" placeholder="Confirm Password" className="mb-4 p-2 border border-gray-300 rounded" id="confirmPassword"/>
                                </div>

                                <div className="mb-4">
                                    <button className="bg-green-500 text-white px-4 py-2 rounded" id="registerButton">Register</button>
                                </div>

                                <div>
                                    <Link to="/" className="text-blue-500">Already have an account?</Link>
                                </div>
                            </form>
                        </div>
                    </form>
                </div>
            </div>
    );
}

export default Register;