import useAdminTheme from "../../../hooks/useAdminTheme";

function AdminThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useAdminTheme();

  const actionLabel = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";

  return (
    <button
      aria-label={actionLabel}
      aria-pressed={isDark}
      className={`admin-theme-toggle admin-reference-icon-button inline-flex size-10 shrink-0 items-center justify-center rounded-xl border focus-visible:outline-none ${className}`}
      onClick={toggleTheme}
      title={actionLabel}
      type="button"
    >
      {isDark ? (
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.25"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="4.25" />
          <path d="M12 2.5v2M12 19.5v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2.5 12h2M19.5 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.25"
          viewBox="0 0 24 24"
        >
          <path d="M20.5 15.4A8.5 8.5 0 0 1 8.6 3.5 8.75 8.75 0 1 0 20.5 15.4Z" />
        </svg>
      )}
    </button>
  );
}

export default AdminThemeToggle;