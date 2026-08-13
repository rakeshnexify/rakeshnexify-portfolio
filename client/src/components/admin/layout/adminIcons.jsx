const iconPaths = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  projects: (
    <>
      <path d="M3 7.5h18" />
      <path d="M5 4h5l2 2h7a2 2 0 0 1 2 2v9.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11A2.5 2.5 0 0 1 5.5 4Z" />
    </>
  ),
  posts: (
    <>
      <path d="M6 3h9l3 3v15H6Z" />
      <path d="M15 3v4h4" />
      <path d="M9 11h6" />
      <path d="M9 15h6" />
    </>
  ),
  testimonials: (
    <>
      <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </>
  ),
  faq: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.4 2.4 0 1 1 3.7 2c-.9.6-1.5 1.1-1.5 2" />
      <path d="M12 17h.01" />
    </>
  ),
  media: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m5 17 4.5-4.5 3 3 2-2L19 18" />
    </>
  ),
  skills: (
    <>
      <path d="m14.7 6.3 3-3 3 3-3 3" />
      <path d="M12 9 4.5 16.5a2.1 2.1 0 1 0 3 3L15 12" />
      <path d="m5 5 4 4" />
      <path d="M4 8 8 4" />
    </>
  ),
  education: (
    <>
      <path d="m3 9 9-5 9 5-9 5Z" />
      <path d="M7 12v5c3 2 7 2 10 0v-5" />
      <path d="M21 9v6" />
    </>
  ),
  experience: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
      <path d="M10 12v2h4v-2" />
    </>
  ),
  achievements: (
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="m8.5 12-1.5 9 5-3 5 3-1.5-9" />
      <path d="m10.5 8 1 1 2-2" />
    </>
  ),
  services: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
      <circle cx="7" cy="7" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="17" cy="17" r="1.5" />
    </>
  ),
  packages: (
    <>
      <path d="m12 3 8 4-8 4-8-4Z" />
      <path d="m4 7 8 4 8-4" />
      <path d="m4 12 8 4 8-4" />
      <path d="m4 17 8 4 8-4" />
    </>
  ),
  designs: (
    <>
      <path d="M4 20h16" />
      <path d="M7 16 17 6l1 1-10 10-3 1Z" />
      <path d="M14 5 16 3l3 3-2 2" />
    </>
  ),
  orders: (
    <>
      <path d="M6 3h12l2 4H4Z" />
      <path d="M5 7h14l-1 14H6Z" />
      <path d="M9 11v6" />
      <path d="M15 11v6" />
    </>
  ),
  appointments: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M3 10h18" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  leads: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
      <path d="M18 4h3v3" />
      <path d="m21 4-4 4" />
    </>
  ),
  messages: (
    <>
      <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 3V7a2 2 0 0 1 2-2Z" />
      <path d="M7 9h10" />
      <path d="M7 13h7" />
    </>
  ),
  companies: (
    <>
      <path d="M4 21V7l8-4v18" />
      <path d="M12 9h8v12" />
      <path d="M7 9h2" />
      <path d="M7 13h2" />
      <path d="M7 17h2" />
      <path d="M15 13h2" />
      <path d="M15 17h2" />
    </>
  ),
  subscribers: (
    <>
      <path d="M4 5h16v14H4Z" />
      <path d="m4 7 8 6 8-6" />
      <path d="M17 3v4" />
      <path d="M15 5h4" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M14 15a5 5 0 0 1 7 5" />
    </>
  ),
  statistics: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21H10v-.08a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14H3v-4h.08a1.7 1.7 0 0 0 1.56-1.04 1.7 1.7 0 0 0-.34-1.87l-.06-.06L7.07 4.2l.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3h4a1.7 1.7 0 0 0 1.04 1.6 1.7 1.7 0 0 0 1.87-.34l.06-.06 2.83 2.83-.06.06a1.7 1.7 0 0 0-.34 1.87A1.7 1.7 0 0 0 21 10h.08v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  audit: (
    <>
      <path d="M12 3 5 6v5c0 4.5 2.8 8.3 7 10 4.2-1.7 7-5.5 7-10V6Z" />
      <path d="M9 12h6" />
      <path d="M9 9h6" />
      <path d="M9 15h4" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 13v6H5V6h6" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H5v16h5" />
      <path d="m15 8 4 4-4 4" />
      <path d="M19 12H9" />
    </>
  ),
  pin: (
    <>
      <path d="m14 4 6 6" />
      <path d="m17 7-5 5" />
      <path d="m12 12-7 7" />
      <path d="M9 5 5 9l10 10 4-4" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </>
  ),
  chevronDown: <path d="m7 9 5 5 5-5" />,
  chevronRight: <path d="m9 7 5 5-5 5" />,
};

function AdminIcon({
  name,
  size = 20,
  strokeWidth = 1.8,
  className = "",
  title,
}) {
  const paths = iconPaths[name] ?? iconPaths.dashboard;

  return (
    <svg
      aria-hidden={title ? undefined : "true"}
      aria-label={title || undefined}
      className={className}
      fill="none"
      height={size}
      role={title ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
    >
      {title ? <title>{title}</title> : null}
      {paths}
    </svg>
  );
}

export { AdminIcon };
