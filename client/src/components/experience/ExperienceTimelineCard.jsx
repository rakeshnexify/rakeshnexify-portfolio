import { getSafeHttpUrl } from "./ExperienceTimelineCard.utils";

const employmentTypeLabels = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  freelance: "Freelance",
  contract: "Contract",
  internship: "Internship",
  "self-employed": "Self-employed",
  founder: "Founder",
  volunteer: "Volunteer",
  other: "Other",
};

const employmentTypeStyles = {
  "full-time": "bg-indigo-100 text-indigo-700",
  "part-time": "bg-violet-100 text-violet-700",
  freelance: "bg-cyan-100 text-cyan-700",
  contract: "bg-blue-100 text-blue-700",
  internship: "bg-orange-100 text-orange-700",
  "self-employed": "bg-emerald-100 text-emerald-700",
  founder: "bg-amber-100 text-amber-800",
  volunteer: "bg-pink-100 text-pink-700",
  other: "bg-slate-100 text-slate-700",
};

const locationTypeLabels = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

function formatExperienceDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function createOrganizationInitials(value) {
  const initials = String(value || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "EX";
}

function getStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const usedItems = new Set();

  return value
    .map((item) => String(item || "").trim())
    .filter((item) => {
      if (!item) {
        return false;
      }

      const normalizedItem = item.toLowerCase();

      if (usedItems.has(normalizedItem)) {
        return false;
      }

      usedItems.add(normalizedItem);

      return true;
    });
}

function ExperienceListBlock({ title, items, tone = "slate" }) {
  if (items.length === 0) {
    return null;
  }

  const toneClasses =
    tone === "success"
      ? "border-emerald-100 bg-emerald-50/70 marker:text-emerald-600"
      : "border-slate-200 bg-slate-50 marker:text-brand-600";

  return (
    <div className={`rounded-2xl border p-5 ${toneClasses}`}>
      <h4 className="font-bold text-slate-950">{title}</h4>

      <ul className="mt-4 space-y-3 pl-5 text-sm leading-6 text-slate-600">
        {items.map((item, index) => (
          <li key={`${title}-${item}-${index}`} className="break-words">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExperienceTagGroup({ title, items, featured = false }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {title}
      </h4>

      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span
            key={`${title}-${item}-${index}`}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
              featured
                ? "bg-brand-50 text-brand-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ExperienceTimelineCard({
  experience,
  compact = false,
  showTimelineConnector = false,
}) {
  const organizationName =
    String(experience?.organizationName || "").trim() || "Organization";

  const jobTitle =
    String(experience?.jobTitle || "").trim() || "Professional Role";

  const employmentType =
    String(experience?.employmentType || "other").trim().toLowerCase();

  const employmentTypeLabel =
    employmentTypeLabels[employmentType] || employmentTypeLabels.other;

  const employmentTypeStyle =
    employmentTypeStyles[employmentType] || employmentTypeStyles.other;

  const location = String(experience?.location || "").trim();

  const locationType =
    String(experience?.locationType || "").trim().toLowerCase();

  const locationTypeLabel = locationTypeLabels[locationType] || "";

  const shortDescription = String(
    experience?.shortDescription || "",
  ).trim();

  const detailedDescription = String(
    experience?.description || shortDescription,
  ).trim();

  const responsibilities = getStringList(experience?.responsibilities);

  const achievements = getStringList(experience?.achievements);

  const skills = getStringList(experience?.skills);

  const tools = getStringList(experience?.tools);

  const startDate = formatExperienceDate(experience?.startDate);

  const endDate = experience?.isCurrent
    ? "Present"
    : formatExperienceDate(experience?.endDate);

  const timelineLabel = [startDate, endDate].filter(Boolean).join(" — ");

  const organizationWebsiteUrl = getSafeHttpUrl(
    experience?.organizationWebsiteUrl,
  );

  const organizationLogoUrl = getSafeHttpUrl(
    experience?.organizationLogoUrl,
  );

  const previewSkills = compact ? skills.slice(0, 6) : skills;

  const previewTools = compact ? tools.slice(0, 5) : tools;

  const description = compact ? shortDescription : detailedDescription;

  return (
    <article className="relative min-w-0">
      {showTimelineConnector && (
        <div
          aria-hidden="true"
          className="absolute bottom-[-2rem] left-6 top-14 w-px bg-slate-200 sm:left-8"
        />
      )}

      <div className="relative flex min-w-0 gap-4 sm:gap-6">
        <div className="relative z-10 grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-slate-950 font-black text-white shadow-md sm:size-16">
          <span>{createOrganizationInitials(organizationName)}</span>

          {organizationLogoUrl && (
            <img
              src={organizationLogoUrl}
              alt={`${organizationName} logo`}
              className="absolute inset-0 size-full bg-white object-contain p-2"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          )}
        </div>

        <div
          className={`min-w-0 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-200 hover:shadow-lg ${
            compact ? "p-5 sm:p-6" : "p-6 sm:p-8"
          }`}
        >
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="break-words text-sm font-bold text-brand-600">
                {organizationName}
              </p>

              <h3
                className={`mt-2 break-words font-black tracking-tight text-slate-950 ${
                  compact ? "text-xl" : "text-2xl"
                }`}
              >
                {jobTitle}
              </h3>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {experience?.isFeatured && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  Featured
                </span>
              )}

              {experience?.isCurrent && (
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">
                  Current Position
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${employmentTypeStyle}`}
            >
              {employmentTypeLabel}
            </span>

            {timelineLabel && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {timelineLabel}
              </span>
            )}

            {locationTypeLabel && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                {locationTypeLabel}
              </span>
            )}
          </div>

          {location && (
            <p className="mt-4 break-words text-sm font-medium text-slate-500">
              {location}
            </p>
          )}

          {description && (
            <p
              className={`mt-5 break-words whitespace-pre-line text-sm leading-7 text-slate-600 ${
                compact ? "line-clamp-4" : ""
              }`}
            >
              {description}
            </p>
          )}

          {(previewSkills.length > 0 || previewTools.length > 0) && (
            <div
              className={`mt-6 grid gap-5 border-t border-slate-100 pt-5 ${
                compact ? "" : "md:grid-cols-2"
              }`}
            >
              <ExperienceTagGroup
                title="Skills"
                items={previewSkills}
                featured
              />

              <ExperienceTagGroup title="Tools" items={previewTools} />
            </div>
          )}

          {compact && skills.length > previewSkills.length && (
            <p className="mt-3 text-xs font-semibold text-slate-400">
              +{skills.length - previewSkills.length} more skills
            </p>
          )}

          {!compact &&
            (responsibilities.length > 0 || achievements.length > 0) && (
              <div className="mt-6 grid gap-5 border-t border-slate-100 pt-6 lg:grid-cols-2">
                <ExperienceListBlock
                  title="Key Responsibilities"
                  items={responsibilities}
                />

                <ExperienceListBlock
                  title="Achievements"
                  items={achievements}
                  tone="success"
                />
              </div>
            )}

          {organizationWebsiteUrl && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <a
                href={organizationWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Visit Organization Website
                <span className="sr-only"> opens in a new tab</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default ExperienceTimelineCard;
