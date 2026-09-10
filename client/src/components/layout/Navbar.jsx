import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import siteData from "../../data/siteData";
import useCompanyNavigation from "../../hooks/useCompanyNavigation";
import usePublicTheme from "../../hooks/usePublicTheme";
import useSiteSettings from "../../hooks/useSiteSettings";
import { getNavbarNavigationItems } from "../../utils/publicNavigation";
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

function NavbarLink({
  section,
  isActive,
  isMobile = false,
  isDark = false,
  onNavigate,
}) {
  const baseClasses = isMobile
    ? "min-w-0 break-words rounded-xl px-4 py-3 text-sm font-semibold transition"
    : "shrink-0 whitespace-nowrap border-b-2 px-0.5 py-2 text-[10px] font-semibold transition-colors min-[1080px]:px-1 min-[1080px]:text-[11px] xl:text-sm";

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

  const isExternal =
    section?.isExternalNavigation === true ||
    section?.type === "external" ||
    /^https?:\/\//i.test(String(section?.href || "").trim());

  if (isExternal) {
    return (
      <a
        href={section.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={`${baseClasses} ${stateClasses}`}
        title={`${section.label} - opens in a new tab`}
      >
        {section.label}
        <span className="sr-only"> opens in a new tab</span>
      </a>
    );
  }

  if (section.type === "page") {
    return (
      <Link
        to={section.href}
        onClick={onNavigate}
        className={`${baseClasses} ${stateClasses}`}
        title={section.label}
      >
        {section.label}
      </Link>
    );
  }

  return (
    <a
      href={`#${section.targetId}`}
      aria-current={isActive ? "location" : undefined}
      onClick={(event) => {
        event.preventDefault();

        onNavigate(section.targetId, section.key);
      }}
      className={`${baseClasses} ${stateClasses}`}
      title={section.label}
    >
      {section.label}
    </a>
  );
}

function Navbar() {
  const { settings } = useSiteSettings();
  const { companies: companyNavigationCompanies } = useCompanyNavigation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSectionKey, setActiveSectionKey] = useState("hero");
  const { theme: navbarTheme, toggleTheme: toggleNavbarTheme } =
    usePublicTheme();

  const mobileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);

  const brandName =
    String(settings?.brand?.name || siteData.brand?.name || "").trim() ||
    "RakeshNexify";

  const visibleSections = useMemo(
    () =>
      getUnifiedBlogNewsNavigationItems(
        getNavbarNavigationItems(settings?.sections),
      ),
    [settings?.sections],
  );

  const navigationSections = useMemo(
    () =>
      visibleSections.filter(
        (section) =>
          section.key !== "contact" &&
          (section.key !== "companies" ||
            companyNavigationCompanies.length > 0),
      ),
    [companyNavigationCompanies.length, visibleSections],
  );

  const contactSection = visibleSections.find(
    (section) => section.key === "contact",
  );
  const companyNavigationSection = navigationSections.find(
    (section) => section.key === "companies",
  );

  const desktopNavigationSections = navigationSections;
  const isDarkNavbar = navbarTheme === "dark";

  const headerClasses =
    "public-tech-header sticky top-0 z-50";

  const headerPanelClasses =
    "public-tech-navbar-row relative flex min-h-20 min-w-0 items-center justify-between gap-2 overflow-visible sm:gap-3 md:max-xl:min-h-[72px] min-[900px]:gap-2 xl:gap-4";

  const themeToggleClasses = isDarkNavbar
    ? "public-tech-nav-control text-slate-100 hover:text-cyan-200"
    : "public-tech-nav-control text-slate-900 hover:text-brand-600";

  const mobileMenuButtonClasses = isDarkNavbar
    ? "public-tech-nav-control border-white/10 text-slate-100 hover:text-cyan-200"
    : "public-tech-nav-control border-sky-200/80 text-slate-900 hover:text-brand-600";

  const mobileMenuPanelClasses =
    "public-tech-mobile-menu absolute inset-x-0 top-full z-[70] min-w-0";

  function closeMobileMenu() {
    setIsMenuOpen(false);
  }

  function goToHomepageSection(sectionId, sectionKey) {
    const targetSection = document.getElementById(sectionId);

    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else if (sectionKey === "hero") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    const nextHash = `#${sectionId}`;

    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }

    setActiveSectionKey(sectionKey);
    closeMobileMenu();
  }

  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key !== "Escape" || !isMenuOpen) {
        return;
      }

      setIsMenuOpen(false);

      requestAnimationFrame(() => {
        mobileMenuButtonRef.current?.focus();
      });
    }

    function handleWindowResize() {
      if (window.innerWidth >= 900) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscapeKey);
    window.addEventListener("resize", handleWindowResize);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [isMenuOpen]);

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
    let animationFrameId = 0;

    const sectionElements = visibleSections
      .filter((section) => section.type === "section")
      .map((section) => ({
        key: section.key,
        element: document.getElementById(section.targetId),
      }))
      .filter((section) => section.element);

    function updateActiveSection() {
      if (sectionElements.length === 0) {
        return;
      }

      const navigationOffset = Math.min(160, window.innerHeight * 0.3);
      let nextActiveSection = sectionElements[0].key;

      sectionElements.forEach((section) => {
        const position = section.element.getBoundingClientRect();

        if (position.top <= navigationOffset) {
          nextActiveSection = section.key;
        }
      });

      const reachedPageBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;

      if (reachedPageBottom) {
        nextActiveSection = sectionElements[sectionElements.length - 1].key;
      }

      setActiveSectionKey((currentSection) =>
        currentSection === nextActiveSection
          ? currentSection
          : nextActiveSection,
      );
    }

    function scheduleUpdate() {
      if (animationFrameId) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = 0;
        updateActiveSection();
      });
    }

    scheduleUpdate();

    window.addEventListener("scroll", scheduleUpdate, {
      passive: true,
    });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [visibleSections]);

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl transition focus:translate-y-0"
      >
        Skip to main content
      </a>

      <header className={headerClasses}>
        <Container>
          <div className={headerPanelClasses}>
            <a
              href="#home"
              aria-label={`Go to ${brandName} homepage`}
              onClick={(event) => {
                event.preventDefault();
                goToHomepageSection("home", "hero");
              }}
              className="inline-flex min-w-0 max-w-full shrink-0 md:hidden xl:inline-flex"
            >
              <Logo
                showTagline />
            </a>

            <a
              href="#home"
              aria-label={`Go to ${brandName} homepage`}
              onClick={(event) => {
                event.preventDefault();
                goToHomepageSection("home", "hero");
              }}
              className="hidden min-w-0 max-w-[154px] shrink-0 md:inline-flex xl:hidden"
            >
              <Logo
                showTagline
                className={`!gap-2 ${
                  isDarkNavbar ? "[&_p:last-child]:!text-slate-300" : ""
                }`}
                iconClassName="!h-9 !w-9 !rounded-xl"
                textClassName={`!text-sm ${
                  isDarkNavbar ? "!text-white" : "!text-slate-950"
                }`}
              />
            </a>

            {navigationSections.length > 0 && (
              <nav
                className="rnx-public-desktop-nav hidden min-w-0 flex-1 items-center justify-center gap-1.5 overflow-visible min-[900px]:flex min-[1080px]:gap-2 xl:gap-4"
                aria-label="Main navigation"
              >
                {desktopNavigationSections.map((section) =>
                  section.key === "companies" ? (
                    <CompanyNavigationMenu
                      key={section.key}
                      label={section.label}
                      companies={companyNavigationCompanies}
                      isDark={isDarkNavbar}
                    />
                  ) : (
                    <NavbarLink
                      key={section.key}
                      section={section}
                      isActive={activeSectionKey === section.key}
                      isDark={isDarkNavbar}
                      onNavigate={
                        section.type !== "section"
                          ? closeMobileMenu
                          : goToHomepageSection
                      }
                    />
                  ),
                )}

              </nav>
            )}

            <button data-ui="public-desktop-theme-toggle-anchor"
                type="button"
                aria-label={`Switch to ${isDarkNavbar ? "light" : "dark"} theme`}
                aria-pressed={isDarkNavbar}
                onClick={toggleNavbarTheme}
                className={`ml-auto hidden size-9 shrink-0 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 min-[900px]:grid xl:size-10 ${themeToggleClasses}`}
              >
                {isDarkNavbar ? (
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

            {contactSection && (
              <Link
                to={contactSection.href}
                className="hidden min-h-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-3 text-xs font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 min-[900px]:inline-flex xl:min-h-10 xl:px-4 xl:text-sm"
              >
                {contactSection.label}
              </Link>
            )}

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label={`Switch to ${isDarkNavbar ? "light" : "dark"} theme`}
                aria-pressed={isDarkNavbar}
                onClick={toggleNavbarTheme}
                className={`ml-auto grid size-10 shrink-0 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 min-[900px]:hidden ${themeToggleClasses}`}
              >
                {isDarkNavbar ? (
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

              <div ref={mobileMenuRef} className="shrink-0">
                <button
                  ref={mobileMenuButtonRef}
                  type="button"
                  aria-label={
                    isMenuOpen
                      ? "Close navigation menu"
                      : "Open navigation menu"
                  }
                  aria-expanded={isMenuOpen}
                  aria-controls="mobile-navigation"
                  aria-haspopup="true"
                  onClick={() => {
                    setIsMenuOpen((currentValue) => !currentValue);
                  }}
                  className={`grid size-11 shrink-0 place-items-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 md:size-10 min-[900px]:hidden ${mobileMenuButtonClasses}`}
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
                    id="mobile-navigation"
                    className={mobileMenuPanelClasses}
                  >
                    <Container>
                      <nav
                        className="max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain py-5"
                        aria-label="Mobile navigation"
                      >
                        <div className="flex min-w-0 flex-col gap-2">
                          {navigationSections.map((section) =>
                            section.key === "companies" ? (
                              <CompanyNavigationMenu
                                key={section.key}
                                label={
                                  companyNavigationSection?.label ||
                                  section.label
                                }
                                companies={companyNavigationCompanies}
                                variant="mobile"
                                isDark={isDarkNavbar}
                                onNavigate={closeMobileMenu}
                              />
                            ) : (
                              <NavbarLink
                                key={section.key}
                                section={section}
                                isActive={activeSectionKey === section.key}
                                isMobile
                                isDark={isDarkNavbar}
                                onNavigate={
                                  section.type !== "section"
                                    ? closeMobileMenu
                                    : goToHomepageSection
                                }
                              />
                            ),
                          )}

                          {contactSection && (
                            <Link
                              to={contactSection.href}
                              onClick={closeMobileMenu}
                              className="mt-3 inline-flex min-h-11 w-full max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
                            >
                              {contactSection.label}
                            </Link>
                          )}
                        </div>
                      </nav>
                    </Container>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </header>
    </>
  );
}

export default Navbar;
