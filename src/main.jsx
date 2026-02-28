import react from "react";
import reactDom from "react-dom/client";
import App from "./app.jsx";
import { BrowserRouter } from "react-router";

const root = reactDom.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

