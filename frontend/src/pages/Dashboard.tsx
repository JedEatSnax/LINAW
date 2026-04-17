import Sidebar from "../components/sidebar";
import EditableSchemaTable from "../components/tableSchema";
import { uiClasses } from "../components/uiClasses";

export function Dashboard() {
  return (
    <main className="h-screen overflow-hidden flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 p-6 overflow-y-auto">
          <div className={uiClasses.sectionTitle}>
            Dashboard
            <hr className="border-gray-700 mt-2"></hr>
          </div>
          <EditableSchemaTable />
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
