import { Link } from "react-router";

const statusLabels = {
  planning: "Planning",
  "in-progress": "In Development",
  completed: "Completed",
  maintained: "Active Project",
  archived: "Archived",
};

const statusClasses = {
  Planning: "bg-violet-100 text-violet-700",
  Completed: "bg-emerald-100 text-emerald-700",
  "Active Project": "bg-blue-100 text-blue-700",
  "In Development": "bg-amber-100 text-amber-700",
  Archived: "bg-slate-200 text-slate-700",
};

function formatProjectStatus(status) {
  if (!status) {
    return "Project";
  }

  return statusLabels[status] || status;
}

function normaliseProject(project = {}, index = 0) {
  const links = project.links || {};

  const technologies = Array.isArray(project.technologies)
    ? project.technologies
    : [];

  const highlights = Array.isArray(project.features)
    ? project.features
    : Array.isArray(project.highlights)
      ? project.highlights
      : [];

  const numericOrder = Number(project.order);

  return {
    id: project._id || project.id || project.slug || `project-${index + 1}`,

    title: project.title || "Untitled Project",

    slug: project.slug || "",

    shortDescription: project.shortDescription || "",

    category: project.category || "Web Project",

    status: formatProjectStatus(project.status),

    featured: Boolean(project.isFeatured ?? project.featured),

    order: Number.isFinite(numericOrder) ? numericOrder : index,

    coverImageUrl: project.coverImageUrl || "",

    technologies,

    highlights,

    liveUrl: links.liveUrl || project.liveUrl || "",

    sourceUrl: links.sourceCodeUrl || project.sourceUrl || "",

    caseStudyUrl:
      links.caseStudyUrl ||
      project.caseStudyUrl ||
      (project.slug ? `/projects/${project.slug}` : ""),
  };
}

function ProjectAction({ href, children, variant = "primary" }) {
  const baseClasses =
    "inline-flex min-h-11 max-w-full items-center justify-center rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition";

  const variantClasses = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",

    secondary: "bg-slate-950 text-white hover:bg-slate-800",

    outline:
      "border border-slate-300 bg-white text-slate-700 hover:border-brand-600 hover:text-brand-600",
  };

  const actionClasses = `${baseClasses} ${
    variantClasses[variant] || variantClasses.primary
  }`;

  if (!href) {
    return (
      <span
        aria-disabled="true"
        title="Link will be added soon"
        className={`${baseClasses} cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400`}
      >
        {children}
      </span>
    );
  }

  const isExternalLink = /^https?:\/\//i.test(href);

  if (isExternalLink) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={actionClasses}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={actionClasses}>
      {children}
    </Link>
  );
}

function ProjectCard({ project, index = 0, compact = false }) {
  const normalisedProject = normaliseProject(project, index);

  const projectNumber = String(index + 1).padStart(2, "0");

  const visibleTechnologies = compact
    ? normalisedProject.technologies.slice(0, 5)
    : normalisedProject.technologies;

  const visibleHighlights = compact
    ? normalisedProject.highlights.slice(0, 4)
    : normalisedProject.highlights.slice(0, 6);

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="relative min-w-0 overflow-hidden bg-slate-950 px-6 py-8 sm:px-8">
        {normalisedProject.coverImageUrl && (
          <img
            src={normalisedProject.coverImageUrl}
            alt={`${normalisedProject.title} cover`}
            loading="lazy"
            className="absolute inset-0 size-full object-cover opacity-25 transition duration-500 group-hover:scale-105"
          />
        )}

        {normalisedProject.coverImageUrl && (
          <div className="absolute inset-0 bg-slate-950/70" />
        )}

        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-brand-600/20 blur-3xl" />

        <div className="absolute -bottom-16 left-12 size-40 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="max-w-full break-words rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
                {normalisedProject.category}
              </span>

              {normalisedProject.featured && (
                <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
                  Featured
                </span>
              )}
            </div>

            <span className="text-4xl font-black tracking-tight text-white/10">
              {projectNumber}
            </span>
          </div>

          <div className="mt-10 flex min-w-0 items-end justify-between gap-5 sm:mt-12">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-400">Project</p>

              <h3 className="mt-2 break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {normalisedProject.title}
              </h3>
            </div>

            <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 5h16v14H4z" />
                <path d="M8 9h8" />
                <path d="M8 13h5" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-8">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusClasses[normalisedProject.status] ||
              "bg-slate-200 text-slate-700"
            }`}
          >
            {normalisedProject.status}
          </span>

          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {normalisedProject.technologies.length} Technologies
          </span>
        </div>

        {normalisedProject.shortDescription && (
          <p className="mt-5 break-words text-base leading-7 text-slate-600">
            {normalisedProject.shortDescription}
          </p>
        )}

        {visibleTechnologies.length > 0 && (
          <div className="mt-6 flex min-w-0 flex-wrap gap-2">
            {visibleTechnologies.map((technology, technologyIndex) => (
              <span
                key={`${normalisedProject.id}-${technology}-${technologyIndex}`}
                className="max-w-full break-words rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                {technology}
              </span>
            ))}
          </div>
        )}

        {visibleHighlights.length > 0 && (
          <div className="mt-7 border-t border-slate-200 pt-6">
            <p className="text-sm font-bold text-slate-950">
              Project highlights
            </p>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {visibleHighlights.map((highlight, highlightIndex) => (
                <li
                  key={`${normalisedProject.id}-${highlight}-${highlightIndex}`}
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
          <ProjectAction href={normalisedProject.liveUrl}>
            Live Preview
          </ProjectAction>

          <ProjectAction href={normalisedProject.sourceUrl} variant="secondary">
            Source Code
          </ProjectAction>

          <ProjectAction
            href={normalisedProject.caseStudyUrl}
            variant="outline"
          >
            Case Study
          </ProjectAction>
        </div>
      </div>
    </article>
  );
}

export default ProjectCard;
