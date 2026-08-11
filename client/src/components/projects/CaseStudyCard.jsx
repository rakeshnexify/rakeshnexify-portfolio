import { Link } from "react-router";

const projectTypeLabels = {
  personal: "Personal Project",
  client: "Client Project",
  company: "Company Project",
  "open-source": "Open Source",
  practice: "Practice Project",
};

function getProjectInitials(title) {
  return String(title || "Project")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function CaseStudyCard({ project, compact = false }) {
  if (!project) {
    return null;
  }

  const title = String(project.title || "").trim() || "Untitled Project";

  const slug = String(project.slug || "")
    .trim()
    .toLowerCase();

  const category = String(project.category || "").trim() || "Case Study";

  const shortDescription = String(project.shortDescription || "").trim();

  const clientName = String(project.clientName || "").trim();

  const role = String(project.role || "").trim();

  const coverImageUrl = String(project.coverImageUrl || "").trim();

  const technologies = Array.isArray(project.technologies)
    ? project.technologies.filter(Boolean)
    : [];

  const caseStudy =
    project.caseStudy && typeof project.caseStudy === "object"
      ? project.caseStudy
      : {};

  const isFeatured = Boolean(caseStudy.isFeatured);

  const detailPath = slug ? `/projects/${encodeURIComponent(slug)}` : "";

  const content = (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl">
      <div
        className={`relative overflow-hidden bg-slate-950 ${
          compact ? "aspect-[16/9]" : "aspect-[16/10]"
        }`}
      >
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={`${title} case study cover`}
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand-600/40 via-slate-950 to-cyan-500/25">
            <div className="grid size-20 place-items-center rounded-3xl border border-white/10 bg-white/10 text-2xl font-black text-white shadow-xl backdrop-blur">
              {getProjectInitials(title)}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-2 p-4 sm:p-5">
          <span className="max-w-full rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
            {category}
          </span>

          {isFeatured && (
            <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
              Featured Case Study
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">
            {projectTypeLabels[project.projectType] || "Project Case Study"}
          </p>
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${compact ? "p-5" : "p-6"}`}>
        <h3
          className={`break-words font-black tracking-tight text-slate-950 ${
            compact ? "text-xl" : "text-2xl"
          }`}
        >
          {title}
        </h3>

        {shortDescription && (
          <p
            className={`mt-3 break-words text-slate-600 ${
              compact
                ? "line-clamp-3 text-sm leading-6"
                : "line-clamp-4 leading-7"
            }`}
          >
            {shortDescription}
          </p>
        )}

        {(clientName || role) && (
          <dl className="mt-5 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
            {clientName && (
              <div className="min-w-0">
                <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Client
                </dt>

                <dd className="mt-1 truncate text-sm font-semibold text-slate-700">
                  {clientName}
                </dd>
              </div>
            )}

            {role && (
              <div className="min-w-0">
                <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Role
                </dt>

                <dd className="mt-1 truncate text-sm font-semibold text-slate-700">
                  {role}
                </dd>
              </div>
            )}
          </dl>
        )}

        {technologies.length > 0 && (
          <div className="mt-5 flex min-w-0 flex-wrap gap-2">
            {technologies.slice(0, compact ? 4 : 6).map((technology) => (
              <span
                key={`${project._id || slug}-${technology}`}
                className="max-w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600"
              >
                {technology}
              </span>
            ))}

            {technologies.length > (compact ? 4 : 6) && (
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500">
                +{technologies.length - (compact ? 4 : 6)}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-6">
          <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition group-hover:bg-brand-600">
            Read Case Study
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </span>
        </div>
      </div>
    </article>
  );

  if (!detailPath) {
    return content;
  }

  return (
    <Link
      to={detailPath}
      aria-label={`Read ${title} case study`}
      className="block h-full min-w-0 rounded-3xl focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
    >
      {content}
    </Link>
  );
}

export default CaseStudyCard;
