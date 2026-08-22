import { useEffect, useRef, useState } from "react";

function ChevronIcon({ isOpen }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`size-4 shrink-0 transition-transform ${
        isOpen ? "rotate-180" : ""
      }`}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ExternalArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 13 13 7" />
      <path d="M8 7h5v5" />
    </svg>
  );
}

function CompanyLinks({ companies, isDark, onNavigate }) {
  return companies.map((company) => (
    <a
      key={company.key}
      href={company.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      className={`flex min-w-0 items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
        isDark
          ? "text-slate-100 hover:bg-white/10 hover:text-cyan-200"
          : "text-slate-700 hover:bg-brand-50 hover:text-brand-600"
      }`}
      title={`${company.name} - opens in a new tab`}
    >
      <span className="min-w-0 truncate">{company.name}</span>
      <ExternalArrowIcon />
      <span className="sr-only"> opens in a new tab</span>
    </a>
  ));
}

function CompanyNavigationMenu({
  label = "Companies",
  companies = [],
  variant = "desktop",
  isDark = false,
  onNavigate,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const isMobile = variant === "mobile";
  const isTablet = variant === "tablet";

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscapeKey(event) {
      if (event.key !== "Escape") {
        return;
      }

      setIsOpen(false);

      requestAnimationFrame(() => {
        buttonRef.current?.focus();
      });
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  if (!Array.isArray(companies) || companies.length === 0) {
    return null;
  }

  function handleCompanyNavigate() {
    setIsOpen(false);
    onNavigate?.();
  }

  if (isMobile) {
    return (
      <div ref={menuRef} className="min-w-0">
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={isOpen}
          aria-controls="mobile-company-navigation"
          onClick={() => setIsOpen((currentValue) => !currentValue)}
          className={`flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
            isDark
              ? "text-slate-200 hover:bg-white/10 hover:text-cyan-200"
              : "text-slate-700 hover:bg-brand-50 hover:text-brand-600"
          }`}
        >
          <span className="min-w-0 truncate">{label}</span>
          <ChevronIcon isOpen={isOpen} />
        </button>

        {isOpen && (
          <div
            id="mobile-company-navigation"
            className={`mt-1 min-w-0 rounded-xl border p-1.5 ${
              isDark
                ? "border-white/10 bg-white/5"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <CompanyLinks
              companies={companies}
              isDark={isDark}
              onNavigate={handleCompanyNavigate}
            />
          </div>
        )}
      </div>
    );
  }

  const buttonClasses = isTablet
    ? "min-w-0 max-w-24 border-b-2 px-1.5 py-2 text-[13px]"
    : "max-w-28 border-b-2 py-2 text-sm";

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={`company-navigation-${variant}`}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className={`inline-flex min-h-10 items-center gap-1.5 truncate border-transparent font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${buttonClasses} ${
          isDark
            ? "text-slate-100 hover:text-cyan-300"
            : "text-slate-600 hover:text-brand-600"
        }`}
      >
        <span className="min-w-0 truncate">{label}</span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div
          id={`company-navigation-${variant}`}
          className="public-tech-menu-panel absolute left-1/2 top-full z-[90] mt-3 w-64 -translate-x-1/2 overflow-hidden rounded-2xl p-2"
        >
          <div className="flex max-h-[70vh] min-w-0 flex-col gap-1 overflow-y-auto">
            <CompanyLinks
              companies={companies}
              isDark={isDark}
              onNavigate={handleCompanyNavigate}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CompanyNavigationMenu;
