import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import siteData from "../../data/siteData";
import usePublicTheme from "../../hooks/usePublicTheme";
import useSiteSettings from "../../hooks/useSiteSettings";
import { getNavbarNavigationItems } from "../../utils/publicNavigation";
import Button from "../ui/Button";
import Logo from "../ui/Logo";
import Container from "./Container";

function NavbarLink({
  section,
  isActive,
  isMobile = false,
  isTablet = false,
  isDark = false,
  onNavigate,
}) {
  const baseClasses = isMobile
    ? "min-w-0 break-words rounded-xl px-4 py-3 text-sm font-semibold transition"
    : isTablet
      ? "min-w-0 max-w-20 truncate border-b-2 px-1.5 py-2 text-[13px] font-semibold transition-colors"
      : "max-w-24 truncate border-b-2 py-2 text-sm font-semibold transition-colors xl:max-w-28";

  const stateClasses = isMobile
    ? isActive
      ? "bg-brand-50 text-brand-600"
      : "text-slate-700 hover:bg-brand-50 hover:text-brand-600"
    : isActive
      ? "border-brand-600 text-brand-600"
      : isDark
        ? "border-transparent text-slate-100 hover:text-brand-500"
        : "border-transparent text-slate-600 hover:text-brand-600";

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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [activeSectionKey, setActiveSectionKey] = useState("hero");
  const { theme: navbarTheme, toggleTheme: toggleNavbarTheme } =
    usePublicTheme();

  const mobileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const moreMenuRef = useRef(null);
  const moreMenuButtonRef = useRef(null);

  const brandName =
    String(settings?.brand?.name || siteData.brand?.name || "").trim() ||
    "RakeshNexify";

  const visibleSections = useMemo(
    () => getNavbarNavigationItems(settings?.sections),
    [settings?.sections],
  );

  const navigationSections = useMemo(
    () => visibleSections.filter((section) => section.key !== "contact"),
    [visibleSections],
  );

  const contactSection = visibleSections.find(
    (section) => section.key === "contact",
  );

  const desktopNavigationSections = navigationSections.slice(0, 4);
  const tabletNavigationSections = navigationSections.slice(0, 5);
  const overflowNavigationSections = navigationSections.slice(4);
  const isDarkNavbar = navbarTheme === "dark";

  const isOverflowSectionActive = overflowNavigationSections.some(
    (section) => section.key === activeSectionKey,
  );

  function closeMobileMenu() {
    setIsMenuOpen(false);
  }

  function closeMoreMenu() {
    setIsMoreMenuOpen(false);
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

  function navigateFromMoreMenu(section) {
    closeMoreMenu();

    if (section.type === "section") {
      goToHomepageSection(section.targetId, section.key);
    }
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
        setIsMenuOpen(false);

        requestAnimationFrame(() => {
          mobileMenuButtonRef.current?.focus();
        });
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

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl md:max-lg:border-b-0 md:max-lg:bg-transparent md:max-lg:py-3 md:max-lg:backdrop-blur-none">
        <Container>
          <div
            className={`flex min-h-20 min-w-0 items-center justify-between gap-4 sm:gap-6 md:max-lg:min-h-[72px] md:max-lg:gap-3 md:max-lg:rounded-2xl md:max-lg:border md:max-lg:px-4 md:max-lg:backdrop-blur-2xl md:max-lg:transition-colors ${
              isDarkNavbar
                ? "md:max-lg:border-white/10 md:max-lg:bg-slate-950/90 md:max-lg:shadow-[0_16px_36px_rgba(2,6,23,0.28)]"
                : "md:max-lg:border-slate-200/80 md:max-lg:bg-white/80 md:max-lg:shadow-[0_14px_32px_rgba(15,23,42,0.12)]"
            }`}
          >
            <a
              href="#home"
              aria-label={`Go to ${brandName} homepage`}
              onClick={(event) => {
                event.preventDefault();
                goToHomepageSection("home", "hero");
              }}
              className="inline-flex min-w-0 max-w-full shrink-0 md:hidden lg:inline-flex"
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
              className="hidden min-w-0 max-w-[176px] shrink-0 md:inline-flex lg:hidden"
            >
              <Logo
                showTagline
                className={`!gap-2 ${
                  isDarkNavbar ? "[&_p:last-child]:!text-slate-300" : ""
                }`}
                iconClassName="!h-10 !w-10 !rounded-xl"
                textClassName={`!text-base ${
                  isDarkNavbar ? "!text-white" : "!text-slate-950"
                }`}
              />
            </a>

            {tabletNavigationSections.length > 0 && (
              <nav
                className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden md:flex lg:hidden min-[900px]:gap-2"
                aria-label="Tablet navigation"
              >
                {tabletNavigationSections.map((section) => (
                  <NavbarLink
                    key={section.key}
                    section={section}
                    isActive={activeSectionKey === section.key}
                    isTablet
                    isDark={isDarkNavbar}
                    onNavigate={
                      section.type === "page"
                        ? closeMobileMenu
                        : goToHomepageSection
                    }
                  />
                ))}
              </nav>
            )}

            {navigationSections.length > 0 && (
              <nav
                className="hidden min-w-0 items-center gap-3 lg:flex xl:gap-4"
                aria-label="Main navigation"
              >
                {desktopNavigationSections.map((section) => (
                  <NavbarLink
                    key={section.key}
                    section={section}
                    isActive={activeSectionKey === section.key}
                    onNavigate={
                      section.type === "page"
                        ? closeMobileMenu
                        : goToHomepageSection
                    }
                  />
                ))}

                {overflowNavigationSections.length > 0 && (
                  <div ref={moreMenuRef} className="relative shrink-0">
                    <button
                      ref={moreMenuButtonRef}
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={isMoreMenuOpen}
                      aria-controls="desktop-more-navigation"
                      onClick={() => {
                        setIsMoreMenuOpen((currentValue) => !currentValue);
                      }}
                      className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition ${
                        isOverflowSectionActive
                          ? "bg-brand-50 text-brand-600"
                          : "text-slate-600 hover:bg-slate-100 hover:text-brand-600"
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
                        id="desktop-more-navigation"
                        className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10"
                      >
                        <div className="flex max-h-[70vh] min-w-0 flex-col gap-1 overflow-y-auto">
                          {overflowNavigationSections.map((section) => (
                            <NavbarLink
                              key={section.key}
                              section={section}
                              isActive={activeSectionKey === section.key}
                              isMobile
                              onNavigate={
                                section.type === "page"
                                  ? closeMoreMenu
                                  : () => navigateFromMoreMenu(section)
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </nav>
            )}

            <button data-ui="public-desktop-theme-toggle-anchor"
                type="button"
                aria-label={`Switch to ${isDarkNavbar ? "light" : "dark"} theme`}
                aria-pressed={isDarkNavbar}
                onClick={toggleNavbarTheme}
                className={`hidden lg:grid ml-auto size-10 shrink-0 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                  isDarkNavbar
                    ? "text-slate-100 hover:bg-white/10 hover:text-white"
                    : "text-slate-900 hover:bg-slate-100 hover:text-brand-600"
                }`}
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
              <div className="hidden shrink-0 lg:block">
                <Button
                  size="small"
                  onClick={() =>
                    goToHomepageSection(
                      contactSection.targetId,
                      contactSection.key,
                    )
                  }
                  className={
                    activeSectionKey === "contact"
                      ? "ring-4 ring-brand-500/15"
                      : ""
                  }
                >
                  {contactSection.label}
                </Button>
              </div>
            )}

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label={`Switch to ${isDarkNavbar ? "light" : "dark"} theme`}
                aria-pressed={isDarkNavbar}
                onClick={toggleNavbarTheme}
                className={`grid lg:hidden ml-auto size-10 shrink-0 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                  isDarkNavbar
                    ? "text-slate-100 hover:bg-white/10 hover:text-white"
                    : "text-slate-900 hover:bg-slate-100 hover:text-brand-600"
                }`}
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
                  className={`grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-900 transition hover:border-brand-600 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 md:max-lg:size-10 md:max-lg:border-transparent md:max-lg:bg-transparent lg:hidden ${
                    isDarkNavbar
                      ? "md:max-lg:text-slate-100 md:max-lg:hover:border-transparent md:max-lg:hover:bg-white/10 md:max-lg:hover:text-white"
                      : "md:max-lg:text-slate-900 md:max-lg:hover:border-transparent md:max-lg:hover:bg-slate-100 md:max-lg:hover:text-brand-600"
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
                    id="mobile-navigation"
                    className="absolute inset-x-0 top-full min-w-0 border-t border-slate-200 bg-white shadow-xl shadow-slate-950/10"
                  >
                    <Container>
                      <nav
                        className="max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain py-5"
                        aria-label="Mobile navigation"
                      >
                        <div className="flex min-w-0 flex-col gap-2">
                          {navigationSections.map((section) => (
                            <NavbarLink
                              key={section.key}
                              section={section}
                              isActive={activeSectionKey === section.key}
                              isMobile
                              onNavigate={
                                section.type === "page"
                                  ? closeMobileMenu
                                  : goToHomepageSection
                              }
                            />
                          ))}

                          {contactSection && (
                            <Button
                              className="mt-3 w-full max-w-full"
                              onClick={() =>
                                goToHomepageSection(
                                  contactSection.targetId,
                                  contactSection.key,
                                )
                              }
                            >
                              {contactSection.label}
                            </Button>
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
