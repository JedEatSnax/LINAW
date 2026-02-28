import react from "react";
import reactDom from "react-dom/client";
import App from "./app.jsx";
import { BrowserRouter } from "react-router";
import React from "react";

const root = reactDom.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>  
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);

