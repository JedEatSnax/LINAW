import { Routes, Route } from 'react-router-dom';
import './app.css';
import Login from "./entry/login.jsx";
import Register from "./entry/register.jsx";

function App() {
    return (
        <div className="text-3xl font-bold flex items-center justify-center h-screen" style={{"backgroundImage": "url(/assets/github-private-email.png)"}}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </div>
    );
}

export default App;