// client/src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      {" "}
      {/* <-- 2. WRAP THE <App /> COMPONENT */}
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
