function Login() {
    return (
        <div className="Login back">
            <div className="text-3xl font-bold underline flex items-center justify-center h-screen">
                <div className="flex flex-col items-center justify-center">
                    <form className="bg-white p-6 rounded shadow-md">
                        <div>
                            <h1 className="text-4xl font-bold mb-4">Login</h1>
                        </div>
                        
                        <div>
                            <input type="text" placeholder="Username" className="mb-2 p-2 border border-gray-300 rounded" />
                        </div>

                        <div>
                            <input type="password" placeholder="Password" className="mb-4 p-2 border border-gray-300 rounded" />
                        </div>

                        <div>
                            <button className="bg-blue-500 text-white px-4 py-2 rounded">Login</button>
                        </div>

                        <div className="mt-4">
                            <a href="#" className="text-blue-500">Forgot password?</a>
                        </div>

                        <div>
                            <a href="/register" className="text-blue-500">Don't have an account?</a>
                        </div>
                        
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;