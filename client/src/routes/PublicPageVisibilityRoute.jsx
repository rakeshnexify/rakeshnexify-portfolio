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

function isSectionPageVisible(sections, requiredSectionKey) {
  const section = findSectionByKey(sections, requiredSectionKey);

  /*
   * Purane database records mein section ya
   * isPageVisible field absent ho sakti hai.
   * Backward compatibility ke liye visible rakhenge.
   */
  return section?.isPageVisible !== false;
}

function PublicPageVisibilityRoute({ sectionKey, sectionKeys = [] }) {
  const { settings, isLoading } = useSiteSettings();

  /*
   * Parent PublicSiteRoute normally loading
   * complete hone ke baad hi Outlet render karta hai.
   * Ye additional check defensive safety ke liye hai.
   */
  if (isLoading) {
    return null;
  }

  const requiredSectionKeys = [
    ...new Set(
      [sectionKey, ...(Array.isArray(sectionKeys) ? sectionKeys : [])]
        .map((key) => normalizeSectionKey(key))
        .filter(Boolean),
    ),
  ];

  /*
   * Existing single-section routes ka behavior
   * unchanged rahega.
   *
   * Shared canonical detail routes multiple public
   * modules ke liye reusable ho sakte hain. Aise
   * cases mein sectionKeys diya ja sakta hai aur
   * kam se kam ek related public page enabled hone
   * par route accessible rahega.
   */
  const isPageVisible =
    requiredSectionKeys.length === 0 ||
    requiredSectionKeys.some((requiredSectionKey) =>
      isSectionPageVisible(settings?.sections, requiredSectionKey),
    );

  if (!isPageVisible) {
    return <NotFoundPage />;
  }

  return <Outlet />;
}

export default PublicPageVisibilityRoute;
