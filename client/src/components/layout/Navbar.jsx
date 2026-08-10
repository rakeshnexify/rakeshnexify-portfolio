import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import siteData from "../../data/siteData";
import { mergeHomepageSections } from "../../config/homepageSections";
import useSiteSettings from "../../hooks/useSiteSettings";
import Button from "../ui/Button";
import Logo from "../ui/Logo";
import Container from "./Container";

const defaultNavigationSections = [
  {
    key: "hero",
    label: "Home",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 1,
    navigationOrder: 1,
  },
  {
    key: "about",
    label: "About",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 2,
    navigationOrder: 2,
  },
  {
    key: "statistics",
    label: "Statistics",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 3,
    navigationOrder: 3,
  },
  {
    key: "skills",
    label: "Skills",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 4,
    navigationOrder: 4,
  },
  {
    key: "services",
    label: "Services",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 5,
    navigationOrder: 5,
  },
  {
    key: "projects",
    label: "Projects",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 6,
    navigationOrder: 6,
  },
  {
    key: "education",
    label: "Education",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 7,
    navigationOrder: 7,
  },
  {
    key: "experience",
    label: "Experience",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 8,
    navigationOrder: 8,
  },
  {
    key: "achievements",
    label: "Achievements",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 9,
    navigationOrder: 9,
  },
  {
    key: "team",
    label: "Team",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 10,
    navigationOrder: 10,
  },
  {
    key: "companies",
    label: "Companies",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 11,
    navigationOrder: 11,
  },
  {
    key: "clients-partners",
    label: "Clients & Partners",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 12,
    navigationOrder: 12,
  },
  {
    key: "testimonials",
    label: "Testimonials",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 14,
    navigationOrder: 13,
  },
  {
    key: "faq",
    label: "FAQ",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 15,
    navigationOrder: 14,
  },
  {
    key: "contact",
    label: "Contact",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 16,
    navigationOrder: 15,
  },
  {
    key: "blog",
    label: "Blog",
    isVisible: false,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 17,
    navigationOrder: 16,
  },
  {
    key: "news",
    label: "News",
    isVisible: false,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 18,
    navigationOrder: 17,
  },
];

const sectionDestinations = {
  hero: {
    type: "section",
    target: "home",
  },
  about: {
    type: "section",
    target: "about",
  },
  statistics: {
    type: "page",
    target: "/statistics",
  },
  skills: {
    type: "page",
    target: "/skills",
  },
  services: {
    type: "page",
    target: "/services",
  },
  projects: {
    type: "page",
    target: "/projects",
  },
  education: {
    type: "page",
    target: "/education",
  },
  experience: {
    type: "page",
    target: "/experience",
  },
  achievements: {
    type: "page",
    target: "/achievements",
  },
  team: {
    type: "page",
    target: "/team",
  },
  companies: {
    type: "page",
    target: "/companies",
  },
  "clients-partners": {
    type: "page",
    target: "/clients-partners",
  },
  testimonials: {
    type: "page",
    target: "/testimonials",
  },
  faq: {
    type: "page",
    target: "/faq",
  },
  blog: {
    type: "page",
    target: "/blog",
  },
  news: {
    type: "page",
    target: "/news",
  },
  contact: {
    type: "section",
    target: "contact",
  },
};

const supportedNavigationSections = new Set(
  defaultNavigationSections.map((section) => section.key),
);

const defaultSectionByKey = Object.fromEntries(
  defaultNavigationSections.map((section) => [section.key, section]),
);

function normaliseSectionKey(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();

  return key === "home" ? "hero" : key;
}

function getSafeSectionLabel(sectionKey, value) {
  const label = String(value || "").trim();

  if (sectionKey === "hero" && label.toLowerCase() === "hero") {
    return "Home";
  }

  return label || defaultSectionByKey[sectionKey]?.label || sectionKey;
}

function createVisibleSections(settingsSections, allowDefaultFallback = true) {
  const sourceSections = mergeHomepageSections(settingsSections);

  const sectionsByKey = new Map();

  sourceSections.forEach((section, index) => {
    const key = normaliseSectionKey(section?.key);

    if (!key || !supportedNavigationSections.has(key)) {
      return;
    }

    const destination = sectionDestinations[key];

    if (!destination) {
      return;
    }

    const numericHomepageOrder = Number(section?.order);

    const fallbackHomepageOrder = defaultSectionByKey[key]?.order ?? index + 1;

    const homepageOrder = Number.isFinite(numericHomepageOrder)
      ? numericHomepageOrder
      : fallbackHomepageOrder;

    const numericNavigationOrder = Number(section?.navigationOrder);

    const fallbackNavigationOrder =
      defaultSectionByKey[key]?.navigationOrder ?? homepageOrder;

    const navigationOrder = Number.isFinite(numericNavigationOrder)
      ? numericNavigationOrder
      : fallbackNavigationOrder;

    const isHomepageVisible = section?.isVisible !== false;

    const isNavigationVisible = section?.isNavigationVisible !== false;

    const isPageVisible = section?.isPageVisible !== false;

    /*
     * Hero/Home Navbar item homepage Hero
     * hidden hone par bhi available reh sakta hai.
     *
     * About aur Contact jaise anchor items
     * homepage section hidden hone par Navbar
     * se bhi remove honge, taaki broken link na bane.
     *
     * Dedicated page items tabhi Navbar mein
     * dikhenge jab public page enabled ho.
     */
    const isDestinationAvailable =
      key === "hero" ||
      (destination.type === "page" ? isPageVisible : isHomepageVisible);

    sectionsByKey.set(key, {
      key,

      label: getSafeSectionLabel(key, section?.label),

      isHomepageVisible,

      isNavigationVisible,

      isPageVisible,

      homepageOrder,

      navigationOrder,

      isDestinationAvailable,
    });
  });

  if (sectionsByKey.size === 0 && allowDefaultFallback) {
    return createVisibleSections(defaultNavigationSections, false);
  }

  return [...sectionsByKey.values()]
    .filter(
      (section) =>
        section.isNavigationVisible !== false &&
        section.isDestinationAvailable !== false,
    )
    .sort((firstSection, secondSection) => {
      const orderDifference =
        firstSection.navigationOrder - secondSection.navigationOrder;

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return (
        (defaultSectionByKey[firstSection.key]?.navigationOrder || 0) -
        (defaultSectionByKey[secondSection.key]?.navigationOrder || 0)
      );
    });
}

function NavbarLink({ section, isActive, isMobile = false, onNavigate }) {
  const destination = sectionDestinations[section.key];

  if (!destination) {
    return null;
  }

  const baseClasses = isMobile
    ? "min-w-0 break-words rounded-xl px-4 py-3 text-sm font-semibold transition"
    : "max-w-24 truncate border-b-2 py-2 text-sm font-semibold transition-colors xl:max-w-28";

  const stateClasses = isMobile
    ? isActive
      ? "bg-brand-50 text-brand-600"
      : "text-slate-700 hover:bg-brand-50 hover:text-brand-600"
    : isActive
      ? "border-brand-600 text-brand-600"
      : "border-transparent text-slate-600 hover:text-brand-600";

  if (destination.type === "page") {
    return (
      <Link
        to={destination.target}
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
      href={`#${destination.target}`}
      aria-current={isActive ? "location" : undefined}
      onClick={(event) => {
        event.preventDefault();

        onNavigate(destination.target, section.key);
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

  const mobileMenuRef = useRef(null);

  const mobileMenuButtonRef = useRef(null);

  const moreMenuRef = useRef(null);

  const moreMenuButtonRef = useRef(null);

  const brandName =
    String(settings?.brand?.name || siteData.brand?.name || "").trim() ||
    "RakeshNexify";

  const visibleSections = useMemo(
    () => createVisibleSections(settings?.sections),
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

  const overflowNavigationSections = navigationSections.slice(4);

  const isOverflowSectionActive = overflowNavigationSections.some(
    (section) => section.key === activeSectionKey,
  );

  function closeMobileMenu() {
    setIsMenuOpen(false);
  }

  function closeMoreMenu() {
    setIsMoreMenuOpen(false);
  }

  function navigateFromMoreMenu(section) {
    const destination = sectionDestinations[section.key];

    closeMoreMenu();

    if (destination?.type === "section") {
      goToHomepageSection(destination.target, section.key);
    }
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
      .map((section) => {
        const destination = sectionDestinations[section.key];

        if (destination?.type !== "section") {
          return null;
        }

        return {
          key: section.key,

          element: document.getElementById(destination.target),
        };
      })
      .filter((section) => section?.element);

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

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <Container>
          <div className="flex min-h-20 min-w-0 items-center justify-between gap-4 sm:gap-6">
            <a
              href="#home"
              aria-label={`Go to ${brandName} homepage`}
              onClick={(event) => {
                event.preventDefault();

                goToHomepageSection("home", "hero");
              }}
              className="inline-flex min-w-0 max-w-full shrink-0"
            >
              <Logo />
            </a>

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
                      sectionDestinations[section.key]?.type === "page"
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
                                sectionDestinations[section.key]?.type === "page"
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

            {contactSection && (
              <div className="hidden shrink-0 lg:block">
                <Button
                  size="small"
                  onClick={() => goToHomepageSection("contact", "contact")}
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

            <div ref={mobileMenuRef} className="shrink-0 lg:hidden">
              <button
                ref={mobileMenuButtonRef}
                type="button"
                aria-label={
                  isMenuOpen ? "Close navigation menu" : "Open navigation menu"
                }
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation"
                aria-haspopup="true"
                onClick={() => {
                  setIsMenuOpen((currentValue) => !currentValue);
                }}
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-900 transition hover:border-brand-600 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
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
                              sectionDestinations[section.key]?.type === "page"
                                ? closeMobileMenu
                                : goToHomepageSection
                            }
                          />
                        ))}

                        {contactSection && (
                          <Button
                            className="mt-3 w-full max-w-full"
                            onClick={() =>
                              goToHomepageSection("contact", "contact")
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
        </Container>
      </header>
    </>
  );
}

export default Navbar;
