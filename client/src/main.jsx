import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App.jsx";
import AdminAuthProvider from "./context/AdminAuthProvider.jsx";
import AdminThemeProvider from "./context/AdminThemeProvider.jsx";
import PublicThemeProvider from "./context/PublicThemeProvider.jsx";
import SiteSettingsProvider from "./context/SiteSettingsProvider.jsx";
import "./index.css";
import "./styles/adminTheme.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <PublicThemeProvider>
        <AdminThemeProvider>
          <SiteSettingsProvider>
            <AdminAuthProvider>
              <App />
            </AdminAuthProvider>
          </SiteSettingsProvider>
        </AdminThemeProvider>
      </PublicThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
