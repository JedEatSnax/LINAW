import { Link } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
export function Login({setUser}: any) {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const [error, setError] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await axios.post("/api/v1/auth/login", formData);
            localStorage.setItem("token", response.data.token);
            setUser(response.data.user);
        } catch (err) {
            setError("Login failed. Please check your credentials and try again.");
        }
    }

    return (
            <div className="text-3xl flex items-center justify-center h-screen bg-zinc-950">
                <div className="flex flex-col items-center justify-center">
                    <form className="bg-zinc-900 font-mono p-4 rounded shadow-md w-80" onSubmit={handleSubmit}>
                        <div className="flex items-center justify-center">
                            <h1 className="text-2xl font-bold mb-4 text-amber-400">Login</h1>
                            {error && <p className="text-red-500">{error}</p>}
                        </div>
                        
                        <div>
                            <input type="text" 
                            placeholder="Username" 
                            className="text-lg mb-2 p-2 border border-gray-300 rounded text-gray-400 w-full" 
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                            />
                        </div>

                        <div>
                            <input type="password" 
                            placeholder="Password" 
                            className="text-lg mb-2 p-2 border border-gray-300 rounded text-gray-400 w-full" 
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange} 
                            required
                            />
                        </div>

                        <div>
                            <button className="bg-amber-600 hover:bg-amber-700 text-white text-lg px-4 py-2 rounded w-full" 
                            name="loginButton"
                            type="submit"
                            >Login</button>
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
