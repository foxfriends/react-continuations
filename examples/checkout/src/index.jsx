import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./index.css";

const child = document.createElement("div");
document.body.appendChild(child);
const root = createRoot(child);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
