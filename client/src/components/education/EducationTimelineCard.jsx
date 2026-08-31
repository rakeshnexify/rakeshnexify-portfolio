import { getSafeHttpUrl } from "./EducationTimelineCard.utils";

const educationTypeLabels = {
  school: "School",
  college: "College",
  university: "University",
  course: "Course",
  training: "Training",
  certification: "Certification",
  other: "Other",
};

const educationTypeStyles = {
  school: "bg-blue-100 text-blue-700",
  college: "bg-violet-100 text-violet-700",
  university: "bg-indigo-100 text-indigo-700",
  course: "bg-cyan-100 text-cyan-700",
  training: "bg-orange-100 text-orange-700",
  certification: "bg-emerald-100 text-emerald-700",
  other: "bg-slate-100 text-slate-700",
};

function formatEducationDate(value) {
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

function createInstitutionInitials(value) {
  const initials = String(value || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "ED";
}

function EducationTimelineCard({
  education,
  compact = false,
  showTimelineConnector = false,
}) {
  const institutionName =
    String(education?.institutionName || "").trim() || "Institution";

  const degree =
    String(education?.degree || "").trim() || "Education Qualification";

  const fieldOfStudy = String(education?.fieldOfStudy || "").trim();

  const shortDescription = String(
    education?.shortDescription || education?.description || "",
  ).trim();

  const educationType =
    String(education?.educationType || "other").trim().toLowerCase();

  const typeLabel =
    educationTypeLabels[educationType] || educationTypeLabels.other;

  const typeStyle =
    educationTypeStyles[educationType] || educationTypeStyles.other;

  const startDate = formatEducationDate(education?.startDate);

  const endDate = education?.isCurrentlyStudying
    ? "Present"
    : formatEducationDate(education?.endDate);

  const timelineLabel = [startDate, endDate].filter(Boolean).join(" — ");

  const institutionUrl = getSafeHttpUrl(education?.institutionUrl);

  const certificateUrl = getSafeHttpUrl(education?.certificateUrl);

  const logoUrl = getSafeHttpUrl(education?.logoUrl);

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
          <span>{createInstitutionInitials(institutionName)}</span>

          {logoUrl && (
            <img
              src={logoUrl}
              alt=""
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
                {institutionName}
              </p>

              <h3
                className={`mt-2 break-words font-black tracking-tight text-slate-950 ${
                  compact ? "text-xl" : "text-2xl"
                }`}
              >
                {degree}
              </h3>

              {fieldOfStudy && (
                <p className="mt-2 break-words text-sm font-semibold text-slate-600">
                  {fieldOfStudy}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {education?.isFeatured && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  Featured
                </span>
              )}

              {education?.isCurrentlyStudying && (
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">
                  Current
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${typeStyle}`}
            >
              {typeLabel}
            </span>

            {timelineLabel && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {timelineLabel}
              </span>
            )}

            {education?.grade && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                {education.grade}
              </span>
            )}
          </div>

          {education?.location && (
            <p className="mt-4 break-words text-sm font-medium text-slate-500">
              {education.location}
            </p>
          )}

          {shortDescription && (
            <p
              className={`mt-5 break-words text-sm leading-7 text-slate-600 ${
                compact ? "line-clamp-4" : ""
              }`}
            >
              {shortDescription}
            </p>
          )}

          {(institutionUrl || certificateUrl) && (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              {institutionUrl && (
                <a
                  href={institutionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
                >
                  Institution Website
                  <span className="sr-only"> opens in a new tab</span>
                </a>
              )}

              {certificateUrl && (
                <a
                  href={certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  View Certificate
                  <span className="sr-only"> opens in a new tab</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default EducationTimelineCard;
