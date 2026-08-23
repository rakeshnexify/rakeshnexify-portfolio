const relationshipLabels = {
  client: "Client",
  partner: "Partner",
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    if (code <= 31 || code === 127) {
      return true;
    }
  }

  return false;
}

function getSafeMediaUrl(value) {
  const url = cleanText(value);

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
      parsedUrl.hostname &&
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

function getSafeWebsiteUrl(value) {
  const url = cleanText(value);

  if (!url || containsControlCharacters(url)) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      parsedUrl.hostname &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return parsedUrl.toString();
    }
  } catch {
    return "";
  }

  return "";
}

function createInitials(name) {
  const initials = cleanText(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "CP";
}

function formatMonthYear(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function createRelationshipPeriod(company) {
  const start = formatMonthYear(company?.relationshipStartDate);
  const end = formatMonthYear(company?.relationshipEndDate);

  if (!start && !end) {
    return "";
  }

  if (start && end) {
    return `${start} – ${end}`;
  }

  if (start) {
    return `${start} – Present`;
  }

  return `Until ${end}`;
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 3v3M17 3v3M4 9h16" />
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18M10 12v2h4v-2" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 5h5v5M19 5l-8 8" />
      <path d="M19 13v5a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1h5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
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
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ClientPartnerCard({ company }) {
  const name = cleanText(company?.name) || "Company";
  const websiteUrl = getSafeWebsiteUrl(company?.websiteUrl);
  const industry = cleanText(company?.industry) || "Business";
  const description = cleanText(
    company?.shortDescription || company?.tagline || company?.description,
  );
  const relationship = cleanText(company?.relationship).toLowerCase();
  const relationshipLabel =
    relationshipLabels[relationship] || "Business Relationship";
  const logoUrl = getSafeMediaUrl(company?.logoUrl);
  const relationshipPeriod = createRelationshipPeriod(company);
  const role = cleanText(company?.role);
  const services = Array.isArray(company?.services)
    ? company.services.map(cleanText).filter(Boolean)
    : [];
  const collaborationLabel = role || services.slice(0, 2).join(", ");

  return (
    <article className="public-client-partner-card group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.4rem] border border-blue-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,247,255,0.96))] p-4 shadow-[0_1px_0_rgba(255,255,255,0.95)_inset,0_18px_34px_rgba(37,99,235,0.08),0_0_0_1px_rgba(148,163,184,0.08)] transition duration-300 hover:-translate-y-1 hover:border-sky-300/80 hover:shadow-[0_1px_0_rgba(255,255,255,0.95)_inset,0_24px_42px_rgba(37,99,235,0.13),0_0_0_1px_rgba(59,130,246,0.12)] sm:p-5 [body.public-theme-active[data-public-theme='dark']_&]:border-cyan-300/10 [body.public-theme-active[data-public-theme='dark']_&]:bg-[linear-gradient(180deg,#0d1b2d_0%,#091523_100%)] [body.public-theme-active[data-public-theme='dark']_&]:shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_20px_38px_rgba(2,8,23,0.38),0_0_0_1px_rgba(34,211,238,0.06)] [body.public-theme-active[data-public-theme='dark']_&]:hover:border-cyan-300/22 [body.public-theme-active[data-public-theme='dark']_&]:hover:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_26px_46px_rgba(8,47,73,0.28),0_0_0_1px_rgba(34,211,238,0.08)]">
      <div className="flex min-w-0 items-start gap-3.5">
        {logoUrl ? (
          <div className="grid size-[4.5rem] shrink-0 place-items-center overflow-hidden rounded-[1.15rem] border border-blue-200/70 bg-white/92 p-2.5 shadow-[0_10px_22px_rgba(37,99,235,0.08)] sm:size-[5rem] [body.public-theme-active[data-public-theme='dark']_&]:border-white/7 [body.public-theme-active[data-public-theme='dark']_&]:bg-[#081524]/92 [body.public-theme-active[data-public-theme='dark']_&]:shadow-[0_10px_24px_rgba(2,8,23,0.34)]">
            <img
              src={logoUrl}
              alt={`${name} logo`}
              loading="lazy"
              decoding="async"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="grid size-[4.5rem] shrink-0 place-items-center rounded-[1.15rem] border border-brand-100/80 bg-gradient-to-br from-brand-50 via-white to-indigo-50 text-lg font-black text-brand-700 shadow-[0_10px_22px_rgba(37,99,235,0.08)] sm:size-[5rem] sm:text-xl [body.public-theme-active[data-public-theme='dark']_&]:border-blue-400/10 [body.public-theme-active[data-public-theme='dark']_&]:from-blue-500/10 [body.public-theme-active[data-public-theme='dark']_&]:via-[#0d1b2d] [body.public-theme-active[data-public-theme='dark']_&]:to-indigo-500/8 [body.public-theme-active[data-public-theme='dark']_&]:text-blue-300 [body.public-theme-active[data-public-theme='dark']_&]:shadow-[0_10px_24px_rgba(2,8,23,0.34)]">
            {createInitials(name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 break-words text-lg font-bold tracking-tight text-slate-950 sm:text-xl [body.public-theme-active[data-public-theme='dark']_&]:text-white">
              {name}
            </h2>

            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                relationship === "partner"
                  ? "bg-emerald-50 text-emerald-700 [body.public-theme-active[data-public-theme='dark']_&]:bg-emerald-400/10 [body.public-theme-active[data-public-theme='dark']_&]:text-emerald-300"
                  : "bg-brand-50 text-brand-700 [body.public-theme-active[data-public-theme='dark']_&]:bg-blue-400/10 [body.public-theme-active[data-public-theme='dark']_&]:text-blue-300"
              }`}
            >
              {relationshipLabel}
            </span>
          </div>

          <p className="mt-0.5 break-words text-[13px] font-semibold text-brand-600">
            {industry}
          </p>

          {description && (
            <p className="mt-2.5 line-clamp-2 break-words text-[13px] leading-[1.4rem] text-slate-600 [body.public-theme-active[data-public-theme='dark']_&]:text-slate-300">
              {description}
            </p>
          )}
        </div>
      </div>

      {(relationshipPeriod || collaborationLabel) && (
        <div className="mt-4 grid gap-2.5 border-t border-blue-100/60 pt-3.5 text-xs font-medium text-slate-600 sm:grid-cols-2 [body.public-theme-active[data-public-theme='dark']_&]:border-white/7 [body.public-theme-active[data-public-theme='dark']_&]:text-slate-300">
          {relationshipPeriod && (
            <div className="flex min-w-0 items-center gap-2">
              <CalendarIcon />
              <span className="truncate">{relationshipPeriod}</span>
            </div>
          )}

          {collaborationLabel && (
            <div className="flex min-w-0 items-center gap-2">
              <BriefcaseIcon />
              <span className="truncate">{collaborationLabel}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        {websiteUrl ? (
          <>
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-brand-600 transition hover:text-brand-700 hover:underline"
            >
              <span className="truncate">
                {(() => {
                  try {
                    return new URL(websiteUrl).hostname.replace(/^www\./, "");
                  } catch {
                    return "Visit Website";
                  }
                })()}
              </span>
              <ExternalIcon />
              <span className="sr-only"> opens in a new tab</span>
            </a>

            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${name} website`}
              title={`Open ${name} website`}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-[0.9rem] border border-brand-300/80 bg-white/90 text-brand-600 shadow-[0_10px_18px_rgba(37,99,235,0.10)] transition hover:border-brand-500 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 [body.public-theme-active[data-public-theme='dark']_&]:border-blue-400/25 [body.public-theme-active[data-public-theme='dark']_&]:bg-blue-400/8 [body.public-theme-active[data-public-theme='dark']_&]:text-blue-300 [body.public-theme-active[data-public-theme='dark']_&]:shadow-[0_10px_18px_rgba(2,8,23,0.32)] [body.public-theme-active[data-public-theme='dark']_&]:hover:border-blue-300/40 [body.public-theme-active[data-public-theme='dark']_&]:hover:bg-blue-400/12"
            >
              <ArrowIcon />
            </a>
          </>
        ) : (
          <span className="text-sm font-medium text-slate-400 [body.public-theme-active[data-public-theme='dark']_&]:text-slate-500">
            Website unavailable
          </span>
        )}
      </div>
    </article>
  );
}

export default ClientPartnerCard;
