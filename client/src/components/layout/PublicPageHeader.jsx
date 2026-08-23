import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import siteData from "../../data/siteData";
import useCompanyNavigation from "../../hooks/useCompanyNavigation";
import usePublicTheme from "../../hooks/usePublicTheme";
import useSiteSettings from "../../hooks/useSiteSettings";
import {
  createPinnedNavigationLayout,
  getNavbarNavigationItems,
  isPublicNavigationItemActive,
} from "../../utils/publicNavigation";
import CompanyNavigationMenu from "../navigation/CompanyNavigationMenu";
import Logo from "../ui/Logo";
import Container from "./Container";

const IDOMERE_BLOG_NEWS_URL = "https://idomere.com/blog";

function getUnifiedBlogNewsNavigationItems(items) {
  const sourceItems = Array.isArray(items) ? items : [];
  const blogIndex = sourceItems.findIndex((item) => item?.key === "blog");
  const newsIndex = sourceItems.findIndex((item) => item?.key === "news");

  if (blogIndex < 0 && newsIndex < 0) {
    return sourceItems;
  }

  const blogItem = blogIndex >= 0 ? sourceItems[blogIndex] : null;
  const newsItem = newsIndex >= 0 ? sourceItems[newsIndex] : null;
  const blogLabel = String(blogItem?.label || "").trim();
  const newsLabel = String(newsItem?.label || "").trim();

  const combinedLabel =
    blogLabel && blogLabel === newsLabel
      ? blogLabel
      : /blog.*news|news.*blog/i.test(blogLabel)
        ? blogLabel
        : /blog.*news|news.*blog/i.test(newsLabel)
          ? newsLabel
          : `${blogLabel || "Blog"} & ${newsLabel || "News"}`;

  const sourceItem = blogItem || newsItem;
  const combinedItem = {
    ...sourceItem,
    key: "blog-news",
    label: combinedLabel,
    href: IDOMERE_BLOG_NEWS_URL,
    relatedHrefs: [],
    type: "external",
    isExternalNavigation: true,
  };

  const existingIndexes = [blogIndex, newsIndex].filter(
    (index) => index >= 0,
  );
  const firstIndex = Math.min(...existingIndexes);

  return sourceItems.reduce((result, item, index) => {
    if (index === firstIndex) {
      result.push(combinedItem);
      return result;
    }

    if (item?.key === "blog" || item?.key === "news") {
      return result;
    }

    result.push(item);
    return result;
  }, []);
}

function isUnifiedNavigationItemActive(item, pathname, hash) {
  if (item?.key !== "blog-news") {
    return isPublicNavigationItemActive(item, pathname, hash);
  }

  const relatedHrefs = Array.isArray(item?.relatedHrefs)
    ? item.relatedHrefs
    : [];

  return relatedHrefs.some((href) => {
    const hrefPath = String(href || "")
      .split("#")[0]
      .replace(/\/+$/, "");

    if (!hrefPath) {
      return false;
    }

    return (
      pathname === hrefPath ||
      pathname.startsWith(`${hrefPath}/`)
    );
  });
}

function PublicNavigationLink({
  item,
  isActive,
  isMobile = false,
  isDark = false,
  onNavigate,
}) {
  const baseClasses = isMobile
    ? "min-w-0 break-words rounded-xl px-4 py-3 text-sm font-semibold transition"
    : "max-w-24 truncate border-b-2 py-2 text-sm font-semibold transition xl:max-w-28";

  const stateClasses = isMobile
    ? isActive
      ? isDark
        ? "bg-white/10 text-cyan-200"
        : "bg-brand-50 text-brand-600"
      : isDark
        ? "text-slate-200 hover:bg-white/10 hover:text-cyan-200"
        : "text-slate-700 hover:bg-brand-50 hover:text-brand-600"
    : isActive
      ? "border-brand-600 text-brand-600"
      : isDark
        ? "border-transparent text-slate-100 hover:text-cyan-300"
        : "border-transparent text-slate-600 hover:text-brand-600";

  if (item.isExternalNavigation) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        title={`${item.label} - opens on Idomere in a new tab`}
        className={`${baseClasses} ${stateClasses}`}
      >
        {item.label}
        <span className="sr-only"> opens on Idomere in a new tab</span>
      </a>
    );
  }

  return (
    <Link
      to={item.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      title={item.label}
      className={`${baseClasses} ${stateClasses}`}
    >
      {item.label}
    </Link>
  );
}

function PublicPageHeader() {
  const { pathname, hash } = useLocation();
  const { settings } = useSiteSettings();
  const { companies: companyNavigationCompanies } = useCompanyNavigation();
  const { isDark, toggleTheme } = usePublicTheme();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const mobileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const moreMenuRef = useRef(null);
  const moreMenuButtonRef = useRef(null);

  const brandName =
    String(settings?.brand?.name || siteData.brand?.name || "").trim() ||
    "RakeshNexify";

  const navigationItems = useMemo(
    () =>
      getUnifiedBlogNewsNavigationItems(
        getNavbarNavigationItems(settings?.sections),
      ),
    [settings?.sections],
  );

  const standardNavigationItems = useMemo(
    () =>
      navigationItems.filter(
        (item) =>
          item.key !== "contact" &&
          (item.key !== "companies" || companyNavigationCompanies.length > 0),
      ),
    [companyNavigationCompanies.length, navigationItems],
  );

  const contactItem = navigationItems.find((item) => item.key === "contact");
  const companyNavigationItem = standardNavigationItems.find(
    (item) => item.key === "companies",
  );

  const desktopNavigationLayout = useMemo(
    () => createPinnedNavigationLayout(standardNavigationItems, 4),
    [standardNavigationItems],
  );
  const desktopNavigationItems = desktopNavigationLayout.directItems;
  const overflowNavigationItems = desktopNavigationLayout.overflowItems;

  const isOverflowItemActive = overflowNavigationItems.some((item) =>
    isUnifiedNavigationItemActive(item, pathname, hash),
  );

  function closeMobileMenu() {
    setIsMenuOpen(false);
  }

  function closeMoreMenu() {
    setIsMoreMenuOpen(false);
  }

  function closeMenuAndRestoreFocus() {
    setIsMenuOpen(false);

    requestAnimationFrame(() => {
      mobileMenuButtonRef.current?.focus();
    });
  }

  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key !== "Escape") {
        return;
      }

      if (isMoreMenuOpen) {
        setIsMoreMenuOpen(false);

        requestAnimationFrame(() => {
          moreMenuButtonRef.current?.focus();
        });

        return;
      }

      if (isMenuOpen) {
        closeMenuAndRestoreFocus();
      }
    }

    function handleWindowResize() {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(false);
      } else {
        setIsMoreMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscapeKey);
    window.addEventListener("resize", handleWindowResize);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [isMenuOpen, isMoreMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    function handleOutsideClick(event) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMoreMenuOpen) {
      return undefined;
    }

    function handleOutsideClick(event) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [isMoreMenuOpen]);

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl transition focus:translate-y-0"
      >
        Skip to main content
      </a>

      <header className="public-tech-header sticky top-0 z-50">
        <Container>
          <div className="public-tech-navbar-row relative flex min-h-20 min-w-0 items-center justify-between gap-4 overflow-visible sm:gap-6">
            <Link
              to="/"
              aria-label={`Go to ${brandName} homepage`}
              className="inline-flex min-w-0 max-w-full shrink-0"
            >
              <Logo showTagline />
            </Link>

            {standardNavigationItems.length > 0 && (
              <nav
                aria-label="Main navigation"
                className="hidden min-w-0 items-center gap-3 lg:flex xl:gap-4"
              >
                {desktopNavigationItems.map((item) =>
                  item.key === "companies" ? (
                    <CompanyNavigationMenu
                      key={item.key}
                      label={item.label}
                      companies={companyNavigationCompanies}
                      isDark={isDark}
                    />
                  ) : (
                    <PublicNavigationLink
                      key={item.key}
                      item={item}
                      isActive={isUnifiedNavigationItemActive(
                        item,
                        pathname,
                        hash,
                      )}
                      isDark={isDark}
                      onNavigate={closeMobileMenu}
                    />
                  ),
                )}

                {overflowNavigationItems.length > 0 && (
                  <div ref={moreMenuRef} className="relative shrink-0">
                    <button
                      ref={moreMenuButtonRef}
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={isMoreMenuOpen}
                      aria-controls="public-desktop-more-navigation"
                      onClick={() => {
                        setIsMoreMenuOpen((currentValue) => !currentValue);
                      }}
                      className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                        isOverflowItemActive
                          ? isDark
                            ? "bg-white/10 text-cyan-200"
                            : "bg-brand-50 text-brand-600"
                          : isDark
                            ? "text-slate-100 hover:bg-white/10 hover:text-cyan-200"
                            : "text-slate-600 hover:bg-white/70 hover:text-brand-600"
                      }`}
                    >
                      More

                      <svg
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        className={`size-4 transition-transform ${
                          isMoreMenuOpen ? "rotate-180" : ""
                        }`}
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {isMoreMenuOpen && (
                      <div
                        id="public-desktop-more-navigation"
                        className="public-tech-menu-panel absolute right-0 top-full z-[80] mt-3 w-64 overflow-hidden rounded-2xl p-2"
                      >
                        <div className="flex max-h-[70vh] min-w-0 flex-col gap-1 overflow-y-auto">
                          {overflowNavigationItems.map((item) => (
                            <PublicNavigationLink
                              key={item.key}
                              item={item}
                              isActive={isUnifiedNavigationItemActive(
                                item,
                                pathname,
                                hash,
                              )}
                              isMobile
                              isDark={isDark}
                              onNavigate={closeMoreMenu}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </nav>
            )}

            <button data-ui="public-page-desktop-theme-toggle-anchor"
              type="button"
              aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
              aria-pressed={isDark}
              onClick={toggleTheme}
              className={`public-tech-nav-control ml-auto hidden size-10 shrink-0 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 lg:grid ${
                isDark
                  ? "text-slate-100 hover:text-cyan-200"
                  : "text-slate-900 hover:text-brand-600"
              }`}
            >
              {isDark ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.35 15.35A9 9 0 018.65 3.65a9 9 0 1011.7 11.7z" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
                </svg>
              )}
            </button>

            {contactItem && (
              <Link
                to={contactItem.href}
                onClick={closeMobileMenu}
                className="hidden min-h-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 lg:inline-flex"
              >
                {contactItem.label}
              </Link>
            )}

            <button
              type="button"
              aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
              aria-pressed={isDark}
              onClick={toggleTheme}
              className={`public-tech-nav-control ml-auto grid size-10 shrink-0 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 lg:hidden ${
                isDark
                  ? "text-slate-100 hover:text-cyan-200"
                  : "text-slate-900 hover:text-brand-600"
              }`}
            >
              {isDark ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.35 15.35A9 9 0 018.65 3.65a9 9 0 1011.7 11.7z" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
                </svg>
              )}
            </button>
            <div ref={mobileMenuRef} className="shrink-0 lg:hidden">
              <button
                ref={mobileMenuButtonRef}
                type="button"
                aria-label={
                  isMenuOpen ? "Close navigation menu" : "Open navigation menu"
                }
                aria-expanded={isMenuOpen}
                aria-controls="public-mobile-navigation"
                aria-haspopup="true"
                onClick={() => {
                  setIsMenuOpen((currentValue) => !currentValue);
                }}
                className={`public-tech-nav-control grid size-11 shrink-0 place-items-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                  isDark
                    ? "border-white/10 text-slate-100 hover:text-cyan-200"
                    : "border-sky-200/80 text-slate-900 hover:text-brand-600"
                }`}
              >
                {isMenuOpen ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12" />
                    <path d="M18 6L6 18" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </svg>
                )}
              </button>

              {isMenuOpen && (
                <div
                  id="public-mobile-navigation"
                  className="public-tech-mobile-menu absolute inset-x-0 top-full z-[70] min-w-0"
                >
                  <Container>
                    <nav
                      aria-label="Mobile navigation"
                      className="max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain py-5"
                    >
                      <div className="flex min-w-0 flex-col gap-2">
                        {standardNavigationItems.map((item) =>
                          item.key === "companies" ? (
                            <CompanyNavigationMenu
                              key={item.key}
                              label={companyNavigationItem?.label || item.label}
                              companies={companyNavigationCompanies}
                              variant="mobile"
                              isDark={isDark}
                              onNavigate={closeMobileMenu}
                            />
                          ) : (
                            <PublicNavigationLink
                              key={item.key}
                              item={item}
                              isActive={isUnifiedNavigationItemActive(
                                item,
                                pathname,
                                hash,
                              )}
                              isMobile
                              isDark={isDark}
                              onNavigate={closeMobileMenu}
                            />
                          ),
                        )}

                        {contactItem && (
                          <Link
                            to={contactItem.href}
                            onClick={closeMobileMenu}
                            className="mt-3 inline-flex min-h-11 w-full max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
                          >
                            {contactItem.label}
                          </Link>
                        )}
                      </div>
                    </nav>
                  </Container>
                </div>
              )}
            </div>
          </div>
        </Container>
      </header>
    </>
  );
}

export default PublicPageHeader;
