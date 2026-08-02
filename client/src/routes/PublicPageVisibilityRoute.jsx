import { Outlet } from "react-router";

import NotFoundPage from "../pages/NotFoundPage";
import useSiteSettings from "../hooks/useSiteSettings";

function normalizeSectionKey(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();

  return key === "home" ? "hero" : key;
}

function findSectionByKey(sections, requiredSectionKey) {
  if (!Array.isArray(sections)) {
    return null;
  }

  const normalizedRequiredKey = normalizeSectionKey(requiredSectionKey);

  return (
    sections.find(
      (section) => normalizeSectionKey(section?.key) === normalizedRequiredKey,
    ) || null
  );
}

function PublicPageVisibilityRoute({ sectionKey }) {
  const { settings, isLoading } = useSiteSettings();

  /*
   * Parent PublicSiteRoute normally loading
   * complete hone ke baad hi Outlet render karta hai.
   * Ye additional check defensive safety ke liye hai.
   */
  if (isLoading) {
    return null;
  }

  const section = findSectionByKey(settings?.sections, sectionKey);

  /*
   * Purane database records mein isPageVisible
   * field absent ho sakti hai. Aise records ko
   * backward compatibility ke liye visible rakhenge.
   */
  const isPageVisible = section?.isPageVisible !== false;

  if (!isPageVisible) {
    return <NotFoundPage />;
  }

  return <Outlet />;
}

export default PublicPageVisibilityRoute;
