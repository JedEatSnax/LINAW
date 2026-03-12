import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import axios from "axios"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { Dashboard } from "./pages/Dashboard"
import { Settings } from "./pages/Settings"
import { ChaincodeEvents } from "./pages/ChaincodeEvents"
import { SubmitTransaction } from "./pages/SubmitTransaction"
import { TransactionHistory } from "./pages/TransactionHistory"
import { QueryLedger } from "./pages/QueryLedger"


function App() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState("")
  const [array, setArray] = useState([])

  const fetchAPI = async () => {
    const response = await axios.get("http://localhost:5000/api")
    setArray(response.data.fruits)
    console.log(response.data.assets)
  }

  return(
    <BrowserRouter>
      <Routes>
        <Route path = "/" element={<Navigate to="/login"/>}/>
        <Route path = "/login" element={<Login />}/>
        <Route path = "/register" element={<Register/>}/>
        <Route path = "/dashboard" element={<Dashboard/>}/>
        <Route path = "/chaincode-events" element={<ChaincodeEvents/>}/>
        <Route path = "/settings" element={<Settings/>}/>
        <Route path = "/transaction-history" element={<TransactionHistory/>}/>
        <Route path = "/query-ledger" element={<QueryLedger/>}/>
        <Route path = "/submit-transaction" element={<SubmitTransaction/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App