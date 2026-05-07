import Sidebar from '../components/sidebar';
import { uiClasses } from '../components/uiClasses';
import { useState } from 'react';


export function Chaincode() {
    const [channelId, setChannelId] = useState<string>("");
    const [contracts, setContracts] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);


    const handleDeployChaincode = async (e: React.FormEvent) => {
        e.preventDefault();
    };

    const handleListContracts = async () => {
        setLoading(true);
        setLoading(false);
    };

  return (
    <main className="h-screen overflow-hidden flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 p-6 overflow-y-auto">
          <div className={uiClasses.sectionTitle}>
            Chaincode
            <hr className="border-gray-700 mt-2"></hr>
          </div>
          
          {/* Deploy Form */}
          <form onSubmit={handleDeployChaincode}>
            {/* Channel selection, chaincode name, etc */}
          </form>

          {/* Contracts List */}
          <div>
            {/* Display deployed contracts */}
          </div>
        </div>
      </div>
    </main>
  );
}
