import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import axios from "axios"


import { Dashboard } from "./pages/Dashboard"


function App() {

  return(
    <Route>
      <Routes>
        <Route path = "/" element={<Dashboard/>}/>
      </Routes>
    </Route>
  )

  const fetchAPI = async () => {
    const response = await axios.get("http://localhost:5000/api")
    setArray(response.data.fruits)
    console.log(response.data.assets)
  }

  useEffect(() => {
    fetchAPI()
  }, [])
}

export default App
