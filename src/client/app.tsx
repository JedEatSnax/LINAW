import { Routes, Route } from 'react-router-dom';
import './app.css';
import Login from "./entry/login.js";
import Register from "./entry/register.js";
import Home from "./main/home.js";
import Dashboard from "./main/dashboard.js";

function App() {
    return (
        <div style={{ backgroundColor: "#0a0c0f", minHeight: "100vh" }}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </div>
    );
}

export default App;