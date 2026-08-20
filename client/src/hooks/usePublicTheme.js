import { useContext } from "react";

import PublicThemeContext from "../context/publicThemeContext";

export default function usePublicTheme() {
  const context = useContext(PublicThemeContext);

  if (!context) {
    throw new Error(
      "usePublicTheme must be used inside PublicThemeProvider.",
    );
  }

  return context;
}
