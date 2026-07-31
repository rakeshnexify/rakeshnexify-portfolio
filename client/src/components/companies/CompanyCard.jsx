import { Link } from "react-router";

const relationshipLabels = {
  owned: "Owned Company",
  managed: "Managed Company",
  partner: "Business Partner",
  client: "Client Company",
  other: "Associated Company",
};

const statusLabels = {
  planned: "Planned",
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};

const statusClasses = {
  planned: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-200 text-slate-700",
  archived: "bg-red-100 text-red-700",
};

function createInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "CO";
}

function getSafeWebsiteUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return "";
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

function normaliseCompany(company = {}, index = 0) {
  const businessAreas = Array.isArray(company.businessAreas)
    ? company.businessAreas
    : [];

  const services = Array.isArray(company.services) ? company.services : [];

  const highlights = Array.isArray(company.highlights)
    ? company.highlights
    : [];

  const numericOrder = Number(company.order);

  return {
    id: company._id || company.id || company.slug || `company-${index + 1}`,

    name: company.name || "Company",

    slug: company.slug || "",

    legalName: company.legalName || "",

    tagline: company.tagline || "",

    description: company.shortDescription || company.description || "",

    fullDescription: company.description || "",

    industry: company.industry || company.category || "Business",

    relationship: company.relationship || "owned",

    status: company.status || "active",

    role: company.role || "",

    websiteUrl: getSafeWebsiteUrl(company.websiteUrl || company.website),

    logoUrl: company.logoUrl || "",

    coverImageUrl: company.coverImageUrl || "",

    businessAreas,

    services,

    highlights,

    featured: Boolean(company.isFeatured ?? company.featured),

    order: Number.isFinite(numericOrder) ? numericOrder : index,
  };
}

function WebsiteLink({ href, children }) {
  if (!href) {
    return (
      <span
        aria-disabled="true"
        title="Official website will be added soon"
        className="inline-flex min-h-11 max-w-full cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-slate-400"
      >
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
    >
      {children}

      <span aria-hidden="true" className="ml-2">
        ↗
      </span>
    </a>
  );
}

function CompanyCard({ company, index = 0, compact = false }) {
  const normalisedCompany = normaliseCompany(company, index);

  const statusLabel =
    statusLabels[normalisedCompany.status] ||
    normalisedCompany.status ||
    "Company";

  const relationshipLabel =
    relationshipLabels[normalisedCompany.relationship] ||
    normalisedCompany.relationship ||
    "Company";

  const visibleBusinessAreas = compact
    ? normalisedCompany.businessAreas.slice(0, 4)
    : normalisedCompany.businessAreas.slice(0, 8);

  const visibleHighlights = compact
    ? normalisedCompany.highlights.slice(0, 4)
    : normalisedCompany.highlights.slice(0, 8);

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="relative min-w-0 overflow-hidden bg-slate-950 px-6 py-8 sm:px-8">
        {normalisedCompany.coverImageUrl && (
          <img
            src={normalisedCompany.coverImageUrl}
            alt={`${normalisedCompany.name} cover`}
            loading="lazy"
            className="absolute inset-0 size-full object-cover opacity-30 transition duration-500 group-hover:scale-105"
          />
        )}

        {normalisedCompany.coverImageUrl && (
          <div className="absolute inset-0 bg-slate-950/70" />
        )}

        <div className="absolute -right-10 -top-12 size-40 rounded-full bg-brand-600/20 blur-3xl" />

        <div className="absolute -bottom-16 left-10 size-40 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex min-w-0 items-start justify-between gap-5">
          {normalisedCompany.logoUrl ? (
            <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white">
              <img
                src={normalisedCompany.logoUrl}
                alt={`${normalisedCompany.name} logo`}
                loading="lazy"
                className="size-full object-contain p-1"
              />
            </div>
          ) : (
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-xl font-extrabold text-white">
              {createInitials(normalisedCompany.name)}
            </div>
          )}

          <span className="shrink-0 text-4xl font-black tracking-tight text-white/10">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="relative mt-10 min-w-0">
          <div className="flex min-w-0 flex-wrap gap-2">
            <span className="max-w-full break-words rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
              {normalisedCompany.industry}
            </span>

            {normalisedCompany.featured && (
              <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
                Featured
              </span>
            )}
          </div>

          <h3 className="mt-4 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {normalisedCompany.name}
          </h3>

          {normalisedCompany.legalName &&
            normalisedCompany.legalName !== normalisedCompany.name && (
              <p className="mt-2 break-words text-sm font-medium text-slate-400">
                {normalisedCompany.legalName}
              </p>
            )}

          {normalisedCompany.tagline && (
            <p className="mt-4 max-w-xl break-words leading-7 text-slate-300">
              {normalisedCompany.tagline}
            </p>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-8">
        <div className="flex min-w-0 flex-wrap gap-2">
          <span className="max-w-full break-words rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
            {relationshipLabel}
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusClasses[normalisedCompany.status] ||
              "bg-slate-200 text-slate-700"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {normalisedCompany.role && (
          <div className="mt-5 min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              My Role
            </p>

            <p className="mt-2 break-words text-sm font-semibold text-slate-700">
              {normalisedCompany.role}
            </p>
          </div>
        )}

        {normalisedCompany.description && (
          <p className="mt-5 break-words leading-7 text-slate-600">
            {normalisedCompany.description}
          </p>
        )}

        {visibleBusinessAreas.length > 0 && (
          <div className="mt-6 min-w-0">
            <p className="text-sm font-bold text-slate-950">Business areas</p>

            <div className="mt-3 flex min-w-0 flex-wrap gap-2">
              {visibleBusinessAreas.map((area, areaIndex) => (
                <span
                  key={`${normalisedCompany.id}-${area}-${areaIndex}`}
                  className="max-w-full break-words rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {visibleHighlights.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="text-sm font-bold text-slate-950">
              Company highlights
            </p>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {visibleHighlights.map((highlight, highlightIndex) => (
                <li
                  key={`${normalisedCompany.id}-${highlight}-${highlightIndex}`}
                  className="flex min-w-0 items-start gap-2.5 text-sm leading-6 text-slate-600"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-600" />

                  <span className="min-w-0 break-words">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto flex min-w-0 flex-col gap-3 pt-8 sm:flex-row sm:flex-wrap">
          {normalisedCompany.slug && (
            <Link
              to={`/companies/${encodeURIComponent(normalisedCompany.slug)}`}
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-brand-600 bg-white px-4 py-2.5 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              View Company Profile
            </Link>
          )}

          <WebsiteLink href={normalisedCompany.websiteUrl}>
            Visit Official Website
          </WebsiteLink>
        </div>
      </div>
    </article>
  );
}

export default CompanyCard;
