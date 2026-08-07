import { Link } from "react-router";

function cleanText(value) {
  return String(value ?? "").trim();
}

function getSafeHttpUrl(value) {
  const url = cleanText(value);

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

function createClientInitials(value) {
  const initials = cleanText(value)
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "CL";
}

function normalizeRating(value) {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  ) {
    return value;
  }

  if (typeof value === "string" && /^[1-5]$/.test(value)) {
    return value.charCodeAt(0) - 48;
  }

  return 0;
}

function getRelatedProject(testimonial) {
  const relatedProject = testimonial?.relatedProject;

  if (
    !relatedProject ||
    typeof relatedProject !== "object" ||
    Array.isArray(relatedProject)
  ) {
    return null;
  }

  return relatedProject;
}

function TestimonialCard({ testimonial, compact = false }) {
  const clientName = cleanText(testimonial?.clientName) || "Client";
  const clientRole = cleanText(testimonial?.clientRole);
  const companyName = cleanText(testimonial?.companyName);
  const reviewText = cleanText(testimonial?.reviewText);
  const rating = normalizeRating(testimonial?.rating);

  const profileImageUrl = getSafeHttpUrl(testimonial?.profileImageUrl);

  const profileImageAlt =
    cleanText(testimonial?.profileImageAlt) ||
    `${clientName} profile`;

  const companyWebsiteUrl = getSafeHttpUrl(
    testimonial?.companyWebsiteUrl,
  );

  const relatedProject = getRelatedProject(testimonial);
  const relatedProjectTitle = cleanText(
    relatedProject?.title || relatedProject?.name,
  );
  const relatedProjectSlug = cleanText(relatedProject?.slug);

  return (
    <article
      className={`flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:border-brand-200 hover:shadow-lg ${
        testimonial?.isFeatured
          ? "border-amber-200 ring-1 ring-amber-100"
          : "border-slate-200"
      }`}
    >
      <div className={compact ? "p-5 sm:p-6" : "p-6 sm:p-8"}>
        <div className="flex min-w-0 items-start gap-4">
          <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-950 font-black text-white">
            <span>{createClientInitials(clientName)}</span>

            {profileImageUrl && (
              <img
                src={profileImageUrl}
                alt={profileImageAlt}
                className="absolute inset-0 size-full object-cover"
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                className={`break-words font-black tracking-tight text-slate-950 ${
                  compact ? "text-lg" : "text-xl"
                }`}
              >
                {clientName}
              </h3>

              {testimonial?.isFeatured && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                  Featured
                </span>
              )}
            </div>

            {(clientRole || companyName) && (
              <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                {[clientRole, companyName].filter(Boolean).join(" · ")}
              </p>
            )}

            {rating > 0 && (
              <p
                className="mt-3 text-sm tracking-[0.12em] text-amber-500"
                aria-label={`${rating} out of 5 stars`}
              >
                <span aria-hidden="true">
                  {"★".repeat(rating)}
                  <span className="text-slate-200">
                    {"★".repeat(5 - rating)}
                  </span>
                </span>
              </p>
            )}
          </div>
        </div>

        {reviewText && (
          <blockquote
            className={`mt-6 break-words whitespace-pre-line text-slate-600 ${
              compact
                ? "line-clamp-6 text-sm leading-7"
                : "text-base leading-8"
            }`}
          >
            “{reviewText}”
          </blockquote>
        )}

        {(companyWebsiteUrl ||
          (relatedProjectTitle && relatedProjectSlug)) && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
            {relatedProjectTitle && relatedProjectSlug && (
              <Link
                to={`/projects/${encodeURIComponent(relatedProjectSlug)}`}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
              >
                View {relatedProjectTitle}
              </Link>
            )}

            {companyWebsiteUrl && (
              <a
                href={companyWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
              >
                Company Website
                <span className="sr-only"> opens in a new tab</span>
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export {
  cleanText,
  createClientInitials,
  getSafeHttpUrl,
  normalizeRating,
};

export default TestimonialCard;
