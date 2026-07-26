import { useCallback, useEffect, useMemo, useState } from "react";

import siteData from "../data/siteData";
import { fetchPublicSiteSettings } from "../services/siteSettingsApi";
import mergeSiteSettings from "../utils/mergeSiteSettings";
import SiteSettingsContext from "./siteSettingsContext";

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : "Dynamic website settings could not be loaded.";
}

function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(siteData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialSettings() {
      try {
        const databaseSettings = await fetchPublicSiteSettings({
          signal: controller.signal,
        });

        setSettings(mergeSiteSettings(siteData, databaseSettings));
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        console.error("Site settings load failed:", requestError);

        setSettings(siteData);
        setError(getErrorMessage(requestError));
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialSettings();

    return () => {
      controller.abort();
    };
  }, []);

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const databaseSettings = await fetchPublicSiteSettings();

      setSettings(mergeSiteSettings(siteData, databaseSettings));
    } catch (requestError) {
      console.error("Site settings refresh failed:", requestError);

      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      settings,
      isLoading,
      error,
      refreshSettings,
    }),
    [settings, isLoading, error, refreshSettings],
  );

  return (
    <SiteSettingsContext.Provider value={contextValue}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export default SiteSettingsProvider;
