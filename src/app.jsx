import './app.css';
import Login from "./login";

function App() {
    return (
        <div className="text-3xl font-bold underline flex items-center justify-center h-screen" style={{"backgroundImage": "url(/assets/github-private-email.png)"}}>
            <Login />   
        </div>
    );
}

export default App;