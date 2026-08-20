import useAdminTheme from "../../../hooks/useAdminTheme";

function AdminThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useAdminTheme();

  return (
    <button
      type="button"
      aria-label={`Switch Admin to ${isDark ? "light" : "dark"} theme`}
      aria-pressed={isDark}
      className={`admin-theme-toggle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border focus-visible:outline-none ${className}`}
      onClick={toggleTheme}
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
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
  );
}

export default AdminThemeToggle;
