const iconPaths = {
  briefcase: (
    <>
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M4 7h16v12H4z" />
      <path d="M4 12h16" />
      <path d="M10 12v2h4v-2" />
    </>
  ),

  code: (
    <>
      <path d="m9 18-6-6 6-6" />
      <path d="m15 6 6 6-6 6" />
      <path d="m14 4-4 16" />
    </>
  ),

  building: (
    <>
      <path d="M4 21V5l8-3 8 3v16" />
      <path d="M9 21v-4h6v4" />
      <path d="M8 8h1" />
      <path d="M15 8h1" />
      <path d="M8 12h1" />
      <path d="M15 12h1" />
    </>
  ),

  video: (
    <>
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="m17 10 4-2v8l-4-2" />
    </>
  ),

  github: (
    <>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.5 5.5 0 0 0 19.3 4 5.2 5.2 0 0 0 19.1.5S17.9.1 15 2a13.4 13.4 0 0 0-7 0C5.1.1 3.9.5 3.9.5A5.2 5.2 0 0 0 3.7 4a5.5 5.5 0 0 0-1.5 3.5c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 8 18v4" />
      <path d="M8 19c-3 .9-3-1.5-4-2" />
    </>
  ),

  layers: (
    <>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </>
  ),

  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),

  trophy: (
    <>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v2a4 4 0 0 0 4 4" />
      <path d="M17 6h3v2a4 4 0 0 1-4 4" />
    </>
  ),

  rocket: (
    <>
      <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2" />
      <path d="m9 15-3-3s3.5-6.5 10-8.5c3.5-1 4.5 0 3.5 3.5C17.5 13.5 11 17 11 17l-2-2Z" />
      <circle cx="15" cy="8" r="1.5" />
    </>
  ),

  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 11h18" />
    </>
  ),
};

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const characterCode = text.charCodeAt(index);

    if (characterCode <= 31 || characterCode === 127) {
      return true;
    }
  }

  return false;
}

function getSafeImageUrl(value) {
  const url = String(value || "").trim();

  if (!url || containsControlCharacters(url)) {
    return "";
  }

  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return url;
    }
  } catch {
    return "";
  }

  return "";
}

function createDisplayValue(statistic) {
  const prefix = String(statistic?.prefix || "").trim();
  const value = String(statistic?.value || "").trim();
  const suffix = String(statistic?.suffix || "").trim();

  return `${prefix}${value}${suffix}`;
}

function createStatisticSymbol(statistic) {
  const icon = String(statistic?.icon || "").trim();

  if (icon && [...icon].length <= 4) {
    return icon;
  }

  const label = String(statistic?.label || "").trim();

  return label.charAt(0).toUpperCase() || "#";
}

function StatisticIcon({ statistic }) {
  const iconUrl = getSafeImageUrl(statistic?.iconUrl);

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        loading="lazy"
        className="size-7 object-contain"
      />
    );
  }

  const iconName = String(statistic?.icon || "")
    .trim()
    .toLowerCase();

  if (iconPaths[iconName]) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-6"
      >
        {iconPaths[iconName]}
      </svg>
    );
  }

  return (
    <span aria-hidden="true" className="text-base font-extrabold">
      {createStatisticSymbol(statistic)}
    </span>
  );
}

function StatisticCard({ statistic, compact = false }) {
  const displayValue = createDisplayValue(statistic);

  const isFeatured = statistic?.isFeatured === true;

  return (
    <article
      className={`group relative flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isFeatured
          ? "border-brand-200 bg-brand-50 shadow-sm hover:shadow-brand-100/70"
          : "border-slate-200 bg-white shadow-sm hover:border-brand-200 hover:shadow-slate-200/70"
      } ${compact ? "p-6" : "p-6 sm:p-8"}`}
    >
      <div
        aria-hidden="true"
        className="absolute -right-10 -top-10 size-32 rounded-full bg-brand-100/70 transition duration-500 group-hover:scale-125"
      />

      <div
        aria-hidden="true"
        className="absolute -bottom-16 -left-10 size-32 rounded-full bg-cyan-100/40 blur-2xl"
      />

      <div className="relative flex h-full min-w-0 flex-col">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div
            className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
              isFeatured
                ? "bg-brand-600 text-white"
                : "bg-slate-50 text-brand-600 ring-1 ring-slate-200"
            }`}
          >
            <StatisticIcon statistic={statistic} />
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              isFeatured
                ? "bg-brand-600/10 text-brand-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {isFeatured ? "Featured" : "Statistic"}
          </span>
        </div>

        <p
          className={`mt-7 break-words font-black tracking-tight text-slate-950 ${
            compact ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl"
          }`}
        >
          {displayValue || "0"}
        </p>

        <h3 className="mt-3 break-words text-lg font-bold text-slate-900">
          {statistic?.label || "Portfolio Statistic"}
        </h3>

        {statistic?.description && (
          <p
            className={`mt-3 break-words text-sm leading-6 text-slate-600 ${
              compact ? "line-clamp-3" : ""
            }`}
          >
            {statistic.description}
          </p>
        )}

        <div className="mt-auto pt-6">
          <div
            className={`h-1.5 w-16 rounded-full transition-all duration-300 group-hover:w-24 ${
              isFeatured ? "bg-brand-600" : "bg-slate-300"
            }`}
          />
        </div>
      </div>
    </article>
  );
}

export default StatisticCard;
