import { uiClasses } from "../components/uiClasses";
import Sidebar from "../components/sidebar";
import { Header } from "../components/header";

type AssetInputFieldProps = {
    id: string;
    label: string;
    placeholder: string;
    type?: string;
};

function CreateInputField({ id, label, placeholder, type = "text" }: AssetInputFieldProps) {
    return (
        <div>
            <label className={uiClasses.label} htmlFor={id}>
                {label}
            </label>
            <input
                className={uiClasses.input}
                id={id}
                type={type}
                placeholder={placeholder}
            />
        </div>
    );
}

function TransferInputField({ id, label, placeholder }: AssetInputFieldProps) {
    return (
        <div>
            <label className={uiClasses.label} htmlFor={id}>
                {label}
            </label>
            <input
                className={uiClasses.input}
                id={id}
                type="text"
                placeholder={placeholder}
            />
        </div>
    );
}

export function SubmitTransaction() {

    async function handleCreate() {

    }

    async function handleTransfer() {

    }

    async function handleDelete() {
        
    }

    async function handleUpdate() {

    }

    return(
        <main>
            <Header />

            <div className="flex">
                <Sidebar />

                <div className="flex-1 p-6">
                    
                    <div className={uiClasses.sectionTitle}>
                        <h1>Submit Transaction</h1>
                        <hr className="border-gray-700 mt-2"></hr>
                    </div>


                    <div className={uiClasses.infoCard}>
                        <h1 className="font-ibm-mono text-amber-500 font-bold text-lg">
                            How does Submit Transaction work?
                        </h1>
                        <p className="font-ibm-sans text-slate-300 mt-2">
                            Placeholder text.
                        </p>
                    </div>


                    <div className={uiClasses.panel}>
                        <div className={uiClasses.panelHeader}>
                            CREATE ASSET
                        </div>
                        <div className={uiClasses.panelBody}>
                            <form className={`${uiClasses.formGrid} grid-cols-5`}>
                                <CreateInputField id="assetID" label="ASSET ID *" placeholder="Enter asset ID" />
                                <CreateInputField id="color" label="COLOR *" placeholder="Enter color" />
                                <CreateInputField id="size" label="SIZE *" placeholder="Enter size" />
                                <CreateInputField id="owner" label="OWNER *" placeholder="Enter owner" />
                                <CreateInputField id="appraisedValue" label="APPRAISED VALUE *" placeholder="Enter appraised value" />
                            </form>
                            <button
                                type='button'
                                onClick={handleCreate}
                                className={uiClasses.primaryButton}
                            >
                                Create Asset
                            </button>
                        </div>
                    </div>

                    <div className={uiClasses.panel}>
                        <div className={uiClasses.panelHeader}>
                            TRANSFER ASSET
                        </div>
                        <div className={uiClasses.panelBody}>
                            <form className={`${uiClasses.formGrid} grid-cols-2`}>
                                <TransferInputField id="assetID" label="ASSET ID *" placeholder="Enter asset ID" />
                                <TransferInputField id="newOwner" label="NEW OWNER *" placeholder="Enter new owner" />
                            </form>
                            <button
                                type='button'
                                onClick={handleTransfer}
                                className={uiClasses.primaryButton}
                            >
                                Transfer Asset
                            </button>
                        </div>
                    </div>

                    
                </div>
            </div>
        </main>
    );
}

export default SubmitTransaction