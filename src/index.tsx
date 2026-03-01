import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import { BrowserRouter } from "react-router-dom";

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");
const root = ReactDOM.createRoot(container);
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);

