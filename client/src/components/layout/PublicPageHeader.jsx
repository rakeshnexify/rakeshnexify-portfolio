import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import siteData from "../../data/siteData";
import useSiteSettings from "../../hooks/useSiteSettings";
import Logo from "../ui/Logo";
import Container from "./Container";

const defaultNavigationItems = [
  {
    key: "hero",
    label: "Home",
    href: "/",
    order: 1,
  },
  {
    key: "about",
    label: "About",
    href: "/#about",
    order: 2,
  },
  {
    key: "services",
    label: "Services",
    href: "/services",
    order: 3,
  },
  {
    key: "projects",
    label: "Projects",
    href: "/projects",
    order: 4,
  },
  {
    key: "companies",
    label: "Companies",
    href: "/companies",
    order: 5,
  },
  {
    key: "contact",
    label: "Contact",
    href: "/#contact",
    order: 6,
  },
];

const defaultItemByKey = Object.fromEntries(
  defaultNavigationItems.map((item) => [item.key, item]),
);

function normaliseSectionKey(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();

  return key === "home" ? "hero" : key;
}

function getSafeLabel(key, value) {
  const label = String(value || "").trim();

  if (key === "hero" && label.toLowerCase() === "hero") {
    return "Home";
  }

  return label || defaultItemByKey[key]?.label || key;
}

function createNavigationItems(settingsSections) {
  const settingsByKey = new Map();

  if (Array.isArray(settingsSections)) {
    settingsSections.forEach((section) => {
      const key = normaliseSectionKey(section?.key);

      if (!defaultItemByKey[key]) {
        return;
      }

      settingsByKey.set(key, section);
    });
  }

  return defaultNavigationItems
    .map((defaultItem) => {
      const settingsItem = settingsByKey.get(defaultItem.key);

      const numericOrder = Number(settingsItem?.order);

      return {
        ...defaultItem,

        label: getSafeLabel(defaultItem.key, settingsItem?.label),

        /*
         * Home remains available even when
         * the Hero section is hidden.
         */
        isVisible:
          defaultItem.key === "hero" || settingsItem?.isVisible !== false,

        order: Number.isFinite(numericOrder) ? numericOrder : defaultItem.order,
      };
    })
    .filter((item) => item.isVisible !== false)
    .sort((firstItem, secondItem) => {
      const orderDifference = firstItem.order - secondItem.order;

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return (
        defaultItemByKey[firstItem.key].order -
        defaultItemByKey[secondItem.key].order
      );
    });
}

function isNavigationItemActive(item, pathname, hash) {
  if (item.key === "hero") {
    return pathname === "/" && (!hash || hash === "#home");
  }

  if (item.key === "about") {
    return pathname === "/" && hash === "#about";
  }

  if (item.key === "contact") {
    return pathname === "/" && hash === "#contact";
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function PublicNavigationLink({
  item,
  isActive,
  isMobile = false,
  onNavigate,
}) {
  const baseClasses = isMobile
    ? "min-w-0 break-words rounded-xl px-4 py-3 text-sm font-semibold transition"
    : "max-w-32 truncate border-b-2 py-2 text-sm font-semibold transition xl:max-w-40";

  const stateClasses = isMobile
    ? isActive
      ? "bg-brand-50 text-brand-600"
      : "text-slate-700 hover:bg-brand-50 hover:text-brand-600"
    : isActive
      ? "border-brand-600 text-brand-600"
      : "border-transparent text-slate-600 hover:text-brand-600";

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

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mobileMenuRef = useRef(null);

  const mobileMenuButtonRef = useRef(null);

  const brandName =
    String(settings?.brand?.name || siteData.brand?.name || "").trim() ||
    "RakeshNexify";

  const navigationItems = useMemo(
    () => createNavigationItems(settings?.sections),
    [settings?.sections],
  );

  const standardNavigationItems = navigationItems.filter(
    (item) => item.key !== "contact",
  );

  const contactItem = navigationItems.find((item) => item.key === "contact");

  function closeMobileMenu() {
    setIsMenuOpen(false);
  }

  function closeMenuAndRestoreFocus() {
    setIsMenuOpen(false);

    requestAnimationFrame(() => {
      mobileMenuButtonRef.current?.focus();
    });
  }

  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key === "Escape" && isMenuOpen) {
        closeMenuAndRestoreFocus();
      }
    }

    function handleWindowResize() {
      if (window.innerWidth >= 1024 && isMenuOpen) {
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
                className="hidden min-w-0 items-center gap-5 lg:flex xl:gap-7"
              >
                {standardNavigationItems.map((item) => (
                  <PublicNavigationLink
                    key={item.key}
                    item={item}
                    isActive={isNavigationItemActive(item, pathname, hash)}
                    onNavigate={closeMobileMenu}
                  />
                ))}
              </nav>
            )}

            {contactItem && (
              <Link
                to={contactItem.href}
                onClick={closeMobileMenu}
                className="hidden min-h-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 lg:inline-flex"
              >
                Contact Me
              </Link>
            )}

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
                  id="public-mobile-navigation"
                  className="absolute inset-x-0 top-full min-w-0 border-t border-slate-200 bg-white shadow-xl shadow-slate-950/10"
                >
                  <Container>
                    <nav
                      aria-label="Mobile navigation"
                      className="max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain py-5"
                    >
                      <div className="flex min-w-0 flex-col gap-2">
                        {standardNavigationItems.map((item) => (
                          <PublicNavigationLink
                            key={item.key}
                            item={item}
                            isActive={isNavigationItemActive(
                              item,
                              pathname,
                              hash,
                            )}
                            isMobile
                            onNavigate={closeMobileMenu}
                          />
                        ))}

                        {contactItem && (
                          <Link
                            to={contactItem.href}
                            onClick={closeMobileMenu}
                            className="mt-3 inline-flex min-h-11 w-full max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
                          >
                            Contact Me
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
