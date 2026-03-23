import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { Dashboard } from "./pages/Dashboard"
import { Settings } from "./pages/Settings"
import { ChaincodeEvents } from "./pages/ChaincodeEvents"
import { SubmitTransaction } from "./pages/SubmitTransaction"
import { TransactionHistory } from "./pages/TransactionHistory"
import { QueryLedger } from "./pages/QueryLedger"
import { ForgotPass } from "./pages/ForgotPass"
import AuthRoute from "../AuthRoute"
import AuthRouteReversed from "../AuthRouteReversed"
// import { useState, useEffect } from 'react'
// import axios from "axios"

function App() {
  /**
  const [array, setArray] = useState([])

  const fetchAPI = async () => {
    const response = await axios.get("http://localhost:5000/api")
    setArray(response.data.fruits)
    console.log(response.data.assets)
  }

  useEffect(() => {
    fetchAPI()
  }, [])
  **/

  return(
    <div className="bg-gray-950">
      <BrowserRouter>
        <Routes>
          <Route path = "/" element={<Navigate to="/login"/>}/>
          <Route path = "/login" element={<AuthRouteReversed><Login/></AuthRouteReversed>}/>
          <Route path = "/register" element={<AuthRouteReversed><Register/></AuthRouteReversed>}/>
          <Route path = "/dashboard" element={<AuthRoute><Dashboard/></AuthRoute>}/>
          <Route path = "/chaincode-events" element={<AuthRoute><ChaincodeEvents/></AuthRoute>}/>
          <Route path = "/settings" element={<AuthRoute><Settings/></AuthRoute>}/>
          <Route path = "/transaction-history" element={<AuthRoute><TransactionHistory/></AuthRoute>}/>
          <Route path = "/query-ledger" element={<AuthRoute><QueryLedger/></AuthRoute>}/>
          <Route path = "/submit-transaction" element={<AuthRoute><SubmitTransaction/></AuthRoute>}/>
          <Route path = "/forgot-password" element={<AuthRouteReversed><ForgotPass/></AuthRouteReversed>}/>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App