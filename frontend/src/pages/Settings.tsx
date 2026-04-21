import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { uiClasses } from "../components/uiClasses";
import { getAuth, signOut } from "firebase/auth";


export function Settings() {
  
  const auth = getAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  return (
    <main className="h-screen overflow-hidden flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 p-6 overflow-y-auto">
          <div className={uiClasses.sectionTitle}>
            Settings
            <hr className="border-gray-700 mt-2"></hr>
          </div>

          <div className="mt-6">
            <div>
              <h2 className="text-xl font-ibm-mono text-gray-300">Account</h2>

              <hr className="border-gray-700 mt-2"></hr>
            </div>

            <div className="w-60 mt-2">
              <button 
              className="bg-red-500 hover:bg-red-800 text-white rounded w-full px-4 py-2"
              onClick={handleLogout}
              >Log out</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Settings;
