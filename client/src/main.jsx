import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import SiteSettingsProvider from "./context/SiteSettingsProvider.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SiteSettingsProvider>
      <App />
    </SiteSettingsProvider>
  </StrictMode>,
);
