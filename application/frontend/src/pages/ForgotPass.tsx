import {} from 'firebase/auth';
<<<<<<< HEAD
import { Link } from 'react-router-dom';

export function ForgotPass() {

    return(
        <div className="flex flex-col items-center justify-center h-screen bg-zinc-950">
            <h1 className="tracking-wider text-5xl font-ibm-mono font-bold text-amber-400"> LINAW </h1>
            <p className="tracking-wider text-md font-ibm-mono font-bold mb-5 text-amber-400">Password Reset </p>

            <div className="w-110 flex flex-col">
                <p className="text-amber-400 font-ibm-mono left-align">Email<span className="text-red-500">*</span></p>

                <input type="email" 
                className="text-lg mb-3 p-2 border border-gray-300 rounded text-gray-400 w-full font-ibm-sans" 
                name="email"
                />

                <button className="bg-amber-600 hover:bg-amber-700 text-gray-100 text-lg px-4 py-2 mb-1 rounded font-ibm-mono tracking-wider">
                    Reset Password 
                </button>

                <div className="flex flex-col items-center justify-center mt-2">
                    <hr className="border-gray-300 w-full p-1"></hr>
                    <Link to="/login" className="text-amber-300 text-sm font-ibm-sans hover:text-amber-500 transition-colors duration-200">
                    Back to Login
                    </Link>
                </div>
=======

export function ForgotPass() {
    return(
        <div className="flex flex-col items-center justify-center h-screen bg-slate-950">
            <h1 className="tracking-wider text-2xl font-ibm-mono font-bold text-amber-400"> LINAW </h1>
            <p className="tracking-wider text-md font-ibm-mono font-bold mb-5 text-amber-400">Password Reset </p>

            <div className="w-90">
                <p className="text-amber-400 font-ibm-mono left-align">Email<span className="text-red-500">*</span></p>
                <input type="email" 
                placeholder="E-mail" 
                className="text-lg mb-3 p-2 border border-gray-300 rounded text-gray-400 w-full font-ibm-sans" 
                name="email"
                />
                <button className="bg-amber-600 hover:bg-amber-700 text-gray-100 text-lg px-4 py-2 rounded w-90 font-ibm-mono tracking-wider">
                    Reset Password 
                </button>
>>>>>>> f61f337 (Created Forgot Password page)
            </div>
        </div>
    );
}

export default ForgotPass