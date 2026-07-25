import { useEffect, useRef, useState } from "react";

import siteData from "../../data/siteData";
import Button from "../ui/Button";
import Logo from "../ui/Logo";
import Container from "./Container";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  const navigationLinks = siteData.navigation.filter(
    (link) => link.label !== "Contact",
  );

  function closeMobileMenu() {
    setIsMenuOpen(false);
  }

  function goToContactSection() {
    window.location.hash = "contact";
    closeMobileMenu();
  }

  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    function handleWindowResize() {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscapeKey);
    window.addEventListener("resize", handleWindowResize);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

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
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <Container>
        <div className="flex min-h-20 items-center justify-between gap-6">
          <a
            href="#home"
            aria-label={`Go to ${siteData.brand.name} homepage`}
            onClick={closeMobileMenu}
          >
            <Logo />
          </a>

          <nav
            className="hidden items-center gap-7 lg:flex"
            aria-label="Main navigation"
          >
            {navigationLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-brand-600"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:block">
            <Button size="small" onClick={goToContactSection}>
              Contact Me
            </Button>
          </div>

          <div ref={mobileMenuRef} className="lg:hidden">
            <button
              type="button"
              aria-label={
                isMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => {
                setIsMenuOpen((currentValue) => !currentValue);
              }}
              className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-900 transition hover:border-brand-600 hover:text-brand-600"
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
                className="absolute inset-x-0 top-full border-t border-slate-200 bg-white shadow-xl shadow-slate-950/10"
              >
                <Container>
                  <nav
                    className="max-h-[calc(100vh-5rem)] overflow-y-auto py-5"
                    aria-label="Mobile navigation"
                  >
                    <div className="flex flex-col gap-2">
                      {navigationLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          onClick={closeMobileMenu}
                          className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-brand-50 hover:text-brand-600"
                        >
                          {link.label}
                        </a>
                      ))}

                      <Button
                        className="mt-3 w-full"
                        onClick={goToContactSection}
                      >
                        Contact Me
                      </Button>
                    </div>
                  </nav>
                </Container>
              </div>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}

export default Navbar;