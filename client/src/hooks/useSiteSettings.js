import { useContext } from "react";

import SiteSettingsContext from "../context/siteSettingsContext";

export default function useSiteSettings() {
  const context = useContext(SiteSettingsContext);

  if (!context) {
    throw new Error(
      "useSiteSettings must be used inside SiteSettingsProvider.",
    );
  }

  return context;
}
