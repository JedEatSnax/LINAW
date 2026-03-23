import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function ForgotPass() {

    const auth = getAuth();
    const [email, setEmail] = useState("");
    const [confirm, setConfirm] = useState("");

    const handleResetPassword = () => {
        sendPasswordResetEmail(auth, email)
        .then(() => {
            console.log("password reset email sent");
            setConfirm("Password reset email sent! Please check your inbox or spam folder.");
        })
        .catch((error) => {
            console.error("Error sending password reset email:", error);
        });
    }

    return(
        <div className="flex flex-col items-center justify-center h-screen bg-zinc-950">
            <h1 className="tracking-wider text-5xl font-ibm-mono font-bold text-amber-400"> LINAW </h1>
            <p className="tracking-wider text-md font-ibm-mono font-bold mb-5 text-amber-400">Password Reset </p>
            <div className="w-110 flex flex-col">
                {confirm && (
                <div className="p-4 w-full bg-zinc-800 rounded mb-4">
                    <p className="text-green-500 text-sm ml-2">{confirm}</p>
                </div>
                )}

                <p className="text-amber-400 font-ibm-mono left-align">Email<span className="text-red-500">*</span></p>

                <input type="email" 
                className="text-lg mb-3 p-2 border border-gray-300 rounded text-gray-400 w-full font-ibm-sans" 
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />

                <button className="bg-amber-600 hover:bg-amber-700 text-gray-100 text-lg px-4 py-2 mb-1 rounded font-ibm-mono tracking-wider"
                onClick={handleResetPassword}>
                    Reset Password 
                </button>

                <div className="flex flex-col items-center justify-center mt-2">
                    <hr className="border-gray-300 w-full p-1"></hr>
                    <Link to="/login" className="text-amber-300 text-sm font-ibm-sans hover:text-amber-500 transition-colors duration-200">
                    Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPass