import {} from 'firebase/auth';

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
            </div>
        </div>
    );
}

export default ForgotPass