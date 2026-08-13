import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

import siteData from "../../data/siteData";
import useSiteSettings from "../../hooks/useSiteSettings";
import {
  getNavbarNavigationItems,
  isPublicNavigationItemActive,
} from "../../utils/publicNavigation";
import Logo from "../ui/Logo";
import Container from "./Container";

function PublicNavigationLink({
  item,
  isActive,
  isMobile = false,
  onNavigate,
}) {
  const baseClasses = isMobile
    ? "min-w-0 break-words rounded-xl px-4 py-3 text-sm font-semibold transition"
    : "max-w-24 truncate border-b-2 py-2 text-sm font-semibold transition xl:max-w-28";

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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const mobileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const moreMenuRef = useRef(null);
  const moreMenuButtonRef = useRef(null);

  const brandName =
    String(settings?.brand?.name || siteData.brand?.name || "").trim() ||
    "RakeshNexify";

  const navigationItems = useMemo(
    () => getNavbarNavigationItems(settings?.sections),
    [settings?.sections],
  );

  const standardNavigationItems = navigationItems.filter(
    (item) => item.key !== "contact",
  );

  const contactItem = navigationItems.find((item) => item.key === "contact");

  const desktopNavigationItems = standardNavigationItems.slice(0, 4);
  const overflowNavigationItems = standardNavigationItems.slice(4);

  const isOverflowItemActive = overflowNavigationItems.some((item) =>
    isPublicNavigationItemActive(item, pathname, hash),
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
                className="hidden min-w-0 items-center gap-3 lg:flex xl:gap-4"
              >
                {desktopNavigationItems.map((item) => (
                  <PublicNavigationLink
                    key={item.key}
                    item={item}
                    isActive={isPublicNavigationItemActive(
                      item,
                      pathname,
                      hash,
                    )}
                    onNavigate={closeMobileMenu}
                  />
                ))}

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
                      className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition ${
                        isOverflowItemActive
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
                        id="public-desktop-more-navigation"
                        className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10"
                      >
                        <div className="flex max-h-[70vh] min-w-0 flex-col gap-1 overflow-y-auto">
                          {overflowNavigationItems.map((item) => (
                            <PublicNavigationLink
                              key={item.key}
                              item={item}
                              isActive={isPublicNavigationItemActive(
                                item,
                                pathname,
                                hash,
                              )}
                              isMobile
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

            {contactItem && (
              <Link
                to={contactItem.href}
                onClick={closeMobileMenu}
                className="hidden min-h-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 lg:inline-flex"
              >
                {contactItem.label}
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
                            isActive={isPublicNavigationItemActive(
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
