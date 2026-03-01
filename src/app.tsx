import { Routes, Route } from 'react-router-dom';
import './app.css';
import Login from "./entry/login.js";
import Register from "./entry/register.js";
import Home from "./main/home.jsx";

function App() {
    return (
        <div style={{"backgroundImage": "url(/assets/github-private-email.png)"}}>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={<Home />} />
            </Routes>
        </div>
    );
}

export default App;