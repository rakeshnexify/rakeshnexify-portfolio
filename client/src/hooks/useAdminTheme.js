import { useContext } from "react";

import AdminThemeContext from "../context/adminThemeContext";

function useAdminTheme() {
  const context = useContext(AdminThemeContext);

  if (!context) {
    throw new Error(
      "useAdminTheme must be used within an AdminThemeProvider.",
    );
  }

  return context;
}

export default useAdminTheme;
