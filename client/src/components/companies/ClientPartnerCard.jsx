import { Link } from "react-router";

const relationshipLabels = {
  client: "Client",
  partner: "Business Partner",
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

function createInitials(name) {
  const initials = cleanText(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "CP";
}

function ClientPartnerCard({ company }) {
  const name = cleanText(company?.name) || "Company";
  const slug = cleanText(company?.slug);
  const industry = cleanText(company?.industry) || "Business";
  const description = cleanText(
    company?.shortDescription || company?.tagline || company?.description,
  );
  const relationship = cleanText(company?.relationship).toLowerCase();
  const relationshipLabel =
    relationshipLabels[relationship] || "Business Relationship";
  const logoUrl = getSafeMediaUrl(company?.logoUrl);

  return (
    <article className="group flex h-full min-w-0 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="flex min-w-0 items-start justify-between gap-4">
        {logoUrl ? (
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <img
              src={logoUrl}
              alt={`${name} logo`}
              loading="lazy"
              decoding="async"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xl font-black text-white">
            {createInitials(name)}
          </div>
        )}

        <span
          className={`max-w-full rounded-full px-3 py-1.5 text-xs font-bold ${
            relationship === "partner"
              ? "bg-cyan-50 text-cyan-700"
              : "bg-brand-50 text-brand-700"
          }`}
        >
          {relationshipLabel}
        </span>
      </div>

      <div className="mt-6 min-w-0">
        <p className="break-words text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          {industry}
        </p>

        <h3 className="mt-2 break-words text-xl font-bold tracking-tight text-slate-950">
          {name}
        </h3>

        {description && (
          <p className="mt-4 line-clamp-4 break-words text-sm leading-7 text-slate-600">
            {description}
          </p>
        )}
      </div>

      <div className="mt-auto pt-6">
        {slug ? (
          <Link
            to={`/companies/${encodeURIComponent(slug)}`}
            className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-brand-600 bg-white px-4 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
          >
            View Company Profile
          </Link>
        ) : (
          <span className="inline-flex min-h-11 max-w-full cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-center text-sm font-semibold text-slate-400">
            Profile unavailable
          </span>
        )}
      </div>
    </article>
  );
}

export default ClientPartnerCard;
