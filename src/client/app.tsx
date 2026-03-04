import { Routes, Route } from 'react-router-dom';
import './app.css';
import { Login } from "./entry/login.js";
import { Register } from "./entry/register.js";
import { Home } from "./main/home.js";
import { Dashboard } from "./main/dashboard.js";
import { ChaincodeEvent } from './main/chaincodeEvent.js';
import { QueryLedger } from './main/queryLedger.js';
import { Settings } from './main/settings.js';
import { TransactionHistory } from './main/transactionHistory.js';
import { SubmitTransaction } from './main/submitTransaction.js';

export function App() {
    return (
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chaincodeevents" element={<ChaincodeEvent />} />
                <Route path="/queryledger" element={<QueryLedger />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/transactionhistory" element={<TransactionHistory />} />
                <Route path="/submittransaction" element={<SubmitTransaction />} />
            </Routes>
    );
}

export default App;