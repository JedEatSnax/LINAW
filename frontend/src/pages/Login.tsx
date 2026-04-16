import { Link, useNavigate } from "react-router-dom";
import {getAuth, signInWithEmailAndPassword} from "firebase/auth";
import { useState } from "react";
import axios from "axios";

export function Login() {

    const auth = getAuth();
    const navigate = useNavigate();

    const [authorizing, setAuthorizing] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const signInEmail = async () => {
        setAuthorizing(true);
        setError("");

        signInWithEmailAndPassword(auth, email, password)
            .then(response => {
                if (auth.currentUser?.emailVerified === false) {
                    setAuthorizing(false);
                    console.log("email not verified");
                    setError("Email not verified. Please check your inbox for a verification email.");
                    return;
                }
                console.log("Signed in with email and password:", response.user.uid);
                postLogin(email, auth.currentUser?.uid ?? "");
                navigate("/dashboard");
            })
            .catch((error) => {
                switch (error.code) {
                    case "auth/user-not-found":
                        setError("No account found with this email.");
                        break;
                    case "auth/invalid-credential":
                        setError("Invalid email or password.");
                        break;
                    case "auth/invalid-email":
                        setError("Invalid email.");
                        break;
                    case "auth/invalid-password":
                        setError("Invalid password.");
                        break;
                    case "auth/too-many-requests":
                        setError("Too many attempts. Please try again later.");
                        break;
                    default:
                        console.log("default");
                        setError(error.message || "Failed to log in");
                }
                console.error("Error signing in with email and password:", error);
                setAuthorizing(false);
            });
    };

    const postLogin = async (email: string, firebase_uid: string) => {
        try {
            await axios.post("/api/login", { email, firebase_uid });
        } catch (error) {
            console.error("Error posting login:", error);
        }
    };

    return (
            <div className="flex items-center justify-center h-screen bg-zinc-950">
                <div className="flex flex-col items-center justify-center">
                    <div className="w-110" >
                        <div className="flex items-center justify-center">
                            <h1 className="tracking-wider text-5xl font-ibm-mono font-bold mb-5 text-amber-400">LINAW</h1>
                        </div>
                        {error && (
                            <div className="p-4 w-full bg-zinc-800 rounded mb-4">
                                <p className="text-red-500 text-sm ml-2">{error}</p>
                            </div>
                        )}
                        
                        <div>
                            <p className="text-amber-400 font-ibm-mono left-align">Email<span className="text-red-500">*</span></p>
                            <input type="email" 
                            className="text-lg mb-3 p-2 border border-gray-300 rounded text-gray-400 bg-zinc-900 w-full font-ibm-sans" 
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            />
                        </div>

                        <div>
                            <p className="text-amber-400 font-ibm-mono left-align">Password<span className="text-red-500">*</span></p>
                            <input type="password" 
                            className="text-lg mb-4 p-2 border border-gray-300 rounded text-gray-400 bg-zinc-900 w-full font-ibm-sans" 
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            />
                        </div>

                        <div>
                            <button className="bg-amber-600 hover:bg-amber-700 text-gray-100 text-lg px-4 py-2 mb-1 rounded w-full font-ibm-mono tracking-wider" 
                            name="loginButton"
                            onClick={signInEmail}
                            disabled={authorizing}
                            >LOGIN</button>
                        </div>

                        <div className="flex flex-col items-center justify-center mt-2">
                            <hr className="border-gray-300 w-full p-1"></hr>
                            <Link to="/forgot-password" className="text-amber-300 text-sm mb-1 font-ibm-sans hover:text-amber-500 transition-colors duration-200">Forgot password?</Link>
                            <span className="text-gray-300 text-sm">Don't have an account?
                                <Link to="/register" className="text-amber-300 text-sm font-ibm-sans hover:text-amber-500 transition-colors duration-200"> Register</Link> </span>
                        </div>
                    </div>
                </div>
            </div>
    );
}

export default Login;
