import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App.jsx";
import AdminAuthProvider from "./context/AdminAuthProvider.jsx";
import SiteSettingsProvider from "./context/SiteSettingsProvider.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <SiteSettingsProvider>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
  </StrictMode>,
);
