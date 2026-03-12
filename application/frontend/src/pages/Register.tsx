import { Link, useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";

export function Register() {
    const auth = getAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const registerUser = async () => {
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then(response => {
                console.log("User registered:", response.user);
                navigate("/dashboard");
            })
            .catch(error => {
                setError("Failed to create account: " + error.message);
                console.error("Error registering user:", error);
            });
    };

    return (
            <div className="text-3xl flex items-center justify-center h-screen bg-zinc-950">
                <div className="flex flex-col items-center justify-center">
                    <div className="bg-zinc-900 font-mono p-4 rounded shadow-md w-90">
                        <div className="flex items-center justify-center">
                            <h1 className="tracking-wider text-2xl text-amber-400 font-bold mb-4 p-2 font-ibm-mono">Register to LINAW</h1>
                        </div>
{/*                     
                        <div>
                            <input type="text" 
                            placeholder="Username" 
                            className="text-lg mb-2 p-2 border border-gray-300 text-gray-400 rounded w-full" 
                            name="username"
                            />
                        </div>
                        Commenting this out since we are using email/password auth from firebase.
                        It will remain here if we want to add username auth in the future or we unanimously decide to just use email instead
                        Then this piece of code will be deleted
*/}
                        {error && (
                            <div className="p-4 w-full bg-zinc-700 rounded mb-4 font-ibm-sans">
                                <p className="text-red-500 text-sm ml-2">{error}</p>
                            </div>
                        )}

                        <div>
                            <input type="email" 
                            placeholder="Email" 
                            className="text-lg mb-3 p-2 border border-gray-300 text-gray-400 rounded w-full font-ibm-sans" 
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <input type="password" 
                            placeholder="Password" 
                            className="text-lg mb-3 p-2 border border-gray-300 text-gray-400 rounded w-full font-ibm-sans" 
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                            <div>
                            <input type="password" 
                            placeholder="Confirm Password" 
                            className="text-lg mb-3 p-2 border border-gray-300 text-gray-400 rounded w-full font-ibm-sans" 
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <div className="mb-3 flex items-center justify-center">
                            <button className="bg-amber-600 hover:bg-amber-700 text-gray-100 text-lg px-4 py-2 mb-3 rounded w-full font-ibm-mono tracking-wider" 
                            name="registerButton"
                            onClick={registerUser}>Register</button>
                        </div>

                        <div className="flex flex-col items-center justify-center mt-1">
                            <Link to="/login" className="text-amber-300 text-sm hover:text-amber-500 transition-colors">Already have an account?</Link>
                        </div>
                    </div>
                </div>
            </div>
    );
}

export default Register;