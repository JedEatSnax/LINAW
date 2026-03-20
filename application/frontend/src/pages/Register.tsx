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
            <div className="flex items-center justify-center h-screen bg-zinc-950">
                <div className="flex flex-col items-center justify-center">
                    <div className="w-110">
                        <div className="flex flex-col items-center justify-center mb-4">
                            <h1 className="tracking-wider text-5xl text-amber-400 font-bold p-1 font-ibm-mono">LINAW</h1>
                            <p className="text-amber-400 font-ibm-mono text-lg">Register Account</p>
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
                            <div className="p-4 w-full bg-zinc-900 rounded mb-4 font-ibm-sans">
                                <p className="text-red-500 text-sm text-center">{error}</p>
                            </div>
                        )}

                        <div>
                            <p className="text-amber-400 font-ibm-mono left-align">Email<span className="text-red-500">*</span></p>
                            <input type="email" 
                            className="text-lg mb-3 p-2 border border-gray-300 text-gray-400 rounded bg-zinc-900 w-full font-ibm-sans" 
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <p className="text-amber-400 font-ibm-mono left-align">Password<span className="text-red-500">*</span></p>
                            <input type="password" 
                            className="text-lg mb-3 p-2 border border-gray-300 text-gray-400 bg-zinc-900 rounded w-full font-ibm-sans" 
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div>
                            <p className="text-amber-400 font-ibm-mono left-align">Confirm Password<span className="text-red-500 text-bold">*</span></p>
                            <input type="password"  
                            className="text-lg mb-4 p-2 border border-gray-300 text-gray-400 bg-zinc-900 rounded w-full font-ibm-sans" 
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <div className="mb-3 flex items-center justify-center">
                            <button className="bg-amber-600 hover:bg-amber-700 text-gray-100 text-lg px-4 py-2 mb-1 rounded w-full font-ibm-mono tracking-wider" 
                            name="registerButton"
                            onClick={registerUser}>Register</button>
                        </div>

                        <div className="flex flex-col items-center justify-center mt-2">
                            <hr className="border-gray-300 w-full p-1"></hr>
                            <Link to="/login" className="text-amber-300 text-sm hover:text-amber-500 transition-colors">Already have an account?</Link>
                        </div>
                    </div>
                </div>
            </div>
    );
}

export default Register;