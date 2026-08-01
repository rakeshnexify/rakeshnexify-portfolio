import { useEffect } from "react";
import { Link, useParams } from "react-router";

import Container from "../components/layout/Container";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import useProject from "../hooks/useProject";
import useSiteSettings from "../hooks/useSiteSettings";

const statusLabels = {
  planning: "Planning",
  "in-progress": "In Development",
  completed: "Completed",
  maintained: "Active Project",
  archived: "Archived",
};

const statusClasses = {
  planning: "bg-violet-100 text-violet-700",
  "in-progress": "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  maintained: "bg-blue-100 text-blue-700",
  archived: "bg-slate-200 text-slate-700",
};

const projectTypeLabels = {
  personal: "Personal Project",
  client: "Client Project",
  company: "Company Project",
  "open-source": "Open-Source Project",
  practice: "Practice Project",
};

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Project could not be loaded.";
}

function ProjectLink({ href, children, variant = "primary" }) {
  if (!href) {
    return null;
  }

  const baseClasses =
    "inline-flex min-h-11 max-w-full items-center justify-center rounded-xl px-5 py-2.5 text-center text-sm font-semibold transition";

  const variantClasses = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",

    secondary: "bg-slate-950 text-white hover:bg-slate-800",

    outline:
      "border border-slate-300 bg-white text-slate-700 hover:border-brand-600 hover:text-brand-600",
  };

  const className = `${baseClasses} ${
    variantClasses[variant] || variantClasses.primary
  }`;

  const isExternalLink = /^https?:\/\//i.test(href);

  if (!isExternalLink) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}

      <span aria-hidden="true" className="ml-2">
        ↗
      </span>
    </a>
  );
}

function DetailList({ title, items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="break-words text-2xl font-bold tracking-tight text-slate-950">
        {title}
      </h2>

      <ul className="mt-6 grid gap-4">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}-${item}`}
            className="flex min-w-0 items-start gap-3 leading-7 text-slate-600"
          >
            <span className="mt-2.5 size-2 shrink-0 rounded-full bg-brand-600" />

            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectLoadingState() {
  return (
    <>
      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <Container>
          <div className="py-16 sm:py-20">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200" />

            <div className="mt-6 h-14 max-w-3xl animate-pulse rounded-xl bg-slate-200" />

            <div className="mt-5 h-24 max-w-2xl animate-pulse rounded-xl bg-slate-200" />

            <div className="mt-10 h-96 animate-pulse rounded-3xl bg-slate-200" />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function ProjectErrorState({ error, status, onRetry, isRetrying }) {
  const isNotFound = status === 404;

  return (
    <>
      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[calc(100vh-5rem)] overflow-x-hidden place-items-center bg-slate-50 px-4 py-12"
      >
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-red-600">
            !
          </div>

          <p className="mt-6 break-words text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            {isNotFound ? "Project Not Found" : "Project Error"}
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
            {isNotFound
              ? "This project is unavailable"
              : "Project could not be loaded"}
          </h1>

          <p className="mt-4 break-words leading-7 text-slate-600">
            {isNotFound
              ? "The project may be hidden, deleted or the project URL may be incorrect."
              : getErrorMessage(error)}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            {!isNotFound && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isRetrying ? "Retrying..." : "Retry"}
              </button>
            )}

            <Link
              to="/projects"
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-center text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
            >
              View All Projects
            </Link>

            <Link
              to="/#contact"
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-brand-600 bg-white px-5 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              Contact Me
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ProjectDetailsPage() {
  const { slug } = useParams();

  const { project, isLoading, error, status, refreshProject } =
    useProject(slug);

  const { settings } = useSiteSettings();

  const brandName =
    String(settings?.brand?.name || "").trim() || "RakeshNexify";

  useEffect(() => {
    const previousTitle = document.title;

    if (project?.seo?.title) {
      document.title = project.seo.title;
    } else if (project?.title) {
      document.title = `${project.title} | ${brandName}`;
    } else {
      document.title = `Project | ${brandName}`;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [project, brandName]);

  if (isLoading) {
    return <ProjectLoadingState />;
  }

  if (error || !project) {
    return (
      <ProjectErrorState
        error={error}
        status={status}
        onRetry={refreshProject}
        isRetrying={isLoading}
      />
    );
  }

  const technologies = Array.isArray(project.technologies)
    ? project.technologies
    : [];

  const features = Array.isArray(project.features) ? project.features : [];

  const challenges = Array.isArray(project.challenges)
    ? project.challenges
    : [];

  const solutions = Array.isArray(project.solutions) ? project.solutions : [];

  const results = Array.isArray(project.results) ? project.results : [];

  const images = Array.isArray(project.images)
    ? [...project.images].sort(
        (firstImage, secondImage) =>
          Number(firstImage.order || 0) - Number(secondImage.order || 0),
      )
    : [];

  const links = project.links || {};

  const startedAt = formatDate(project.startedAt);

  const completedAt = formatDate(project.completedAt);

  return (
    <>
      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl" />

          <div className="absolute -bottom-40 left-10 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

          <Container>
            <div className="relative grid min-w-0 gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap gap-2">
                  <span className="max-w-full break-words rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
                    {project.category || "Web Project"}
                  </span>

                  <span
                    className={`max-w-full break-words rounded-full px-3 py-1.5 text-xs font-semibold ${
                      statusClasses[project.status] ||
                      "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {statusLabels[project.status] ||
                      project.status ||
                      "Project"}
                  </span>

                  {project.isFeatured && (
                    <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
                      Featured
                    </span>
                  )}
                </div>

                <p className="mt-7 break-words text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                  {projectTypeLabels[project.projectType] ||
                    "Portfolio Project"}
                </p>

                <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {project.title}
                </h1>

                <p className="mt-6 max-w-3xl break-words text-lg leading-8 text-slate-300">
                  {project.shortDescription}
                </p>

                <div className="mt-8 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <ProjectLink href={links.liveUrl}>Live Project</ProjectLink>

                  <ProjectLink href={links.sourceCodeUrl} variant="secondary">
                    Source Code
                  </ProjectLink>

                  <ProjectLink href={links.videoUrl} variant="outline">
                    Project Video
                  </ProjectLink>
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl">
                {project.coverImageUrl ? (
                  <img
                    src={project.coverImageUrl}
                    alt={`${project.title} cover`}
                    className="aspect-[16/10] w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="grid aspect-[16/10] place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-600/30 via-slate-900 to-cyan-500/20 p-6">
                    <div className="min-w-0 text-center">
                      <div className="mx-auto grid size-20 place-items-center rounded-3xl border border-white/10 bg-white/10">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="size-10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M4 5h16v14H4z" />
                          <path d="M8 9h8" />
                          <path d="M8 13h5" />
                        </svg>
                      </div>

                      <p className="mt-5 break-words font-bold text-white">
                        {project.title}
                      </p>

                      <p className="mt-2 break-words text-sm text-slate-400">
                        Project preview image will be added soon
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-8">
                {project.description && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <p className="break-words text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
                      Project Overview
                    </p>

                    <h2 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
                      About this project
                    </h2>

                    <p className="mt-6 whitespace-pre-line break-words text-base leading-8 text-slate-600">
                      {project.description}
                    </p>
                  </section>
                )}

                <DetailList title="Project Features" items={features} />

                <div className="grid min-w-0 gap-8 xl:grid-cols-2">
                  <DetailList title="Challenges" items={challenges} />

                  <DetailList title="Solutions" items={solutions} />
                </div>

                {results.length > 0 && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="break-words text-2xl font-bold tracking-tight text-slate-950">
                      Project Results
                    </h2>

                    <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {results.map((result, index) => (
                        <div
                          key={result._id || `${result.label}-${index}`}
                          className="min-w-0 rounded-2xl border border-brand-100 bg-brand-50 p-5"
                        >
                          <p className="break-words text-2xl font-black text-brand-700">
                            {result.value}
                          </p>

                          <p className="mt-2 break-words text-sm font-semibold text-slate-600">
                            {result.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {images.length > 0 && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="break-words text-2xl font-bold tracking-tight text-slate-950">
                      Project Screenshots
                    </h2>

                    <div className="mt-6 grid min-w-0 gap-6">
                      {images.map((image, index) => (
                        <figure
                          key={image._id || `${image.url}-${index}`}
                          className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                        >
                          <img
                            src={image.url}
                            alt={
                              image.alt ||
                              `${project.title} screenshot ${index + 1}`
                            }
                            loading="lazy"
                            className="w-full object-cover"
                          />

                          {image.caption && (
                            <figcaption className="break-words border-t border-slate-200 px-5 py-4 text-sm leading-6 text-slate-500">
                              {image.caption}
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
                <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="break-words text-lg font-bold text-slate-950">
                    Project Information
                  </h2>

                  <dl className="mt-6 divide-y divide-slate-100">
                    {project.role && (
                      <div className="py-4 first:pt-0">
                        <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          My Role
                        </dt>

                        <dd className="mt-2 break-words text-sm font-semibold leading-6 text-slate-700">
                          {project.role}
                        </dd>
                      </div>
                    )}

                    {project.clientName && (
                      <div className="py-4">
                        <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Client
                        </dt>

                        <dd className="mt-2 break-words text-sm font-semibold text-slate-700">
                          {project.clientName}
                        </dd>
                      </div>
                    )}

                    {project.category && (
                      <div className="py-4">
                        <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Category
                        </dt>

                        <dd className="mt-2 break-words text-sm font-semibold text-slate-700">
                          {project.category}
                        </dd>
                      </div>
                    )}

                    {startedAt && (
                      <div className="py-4">
                        <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Started
                        </dt>

                        <dd className="mt-2 text-sm font-semibold text-slate-700">
                          {startedAt}
                        </dd>
                      </div>
                    )}

                    {completedAt && (
                      <div className="py-4">
                        <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Completed
                        </dt>

                        <dd className="mt-2 text-sm font-semibold text-slate-700">
                          {completedAt}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>

                {technologies.length > 0 && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="break-words text-lg font-bold text-slate-950">
                      Technologies Used
                    </h2>

                    <div className="mt-5 flex min-w-0 flex-wrap gap-2">
                      {technologies.map((technology) => (
                        <span
                          key={technology}
                          className="max-w-full break-words rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"
                        >
                          {technology}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {(links.liveUrl || links.sourceCodeUrl || links.videoUrl) && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="break-words text-lg font-bold text-slate-950">
                      Project Links
                    </h2>

                    <div className="mt-5 grid min-w-0 gap-3">
                      <ProjectLink href={links.liveUrl}>
                        Open Live Project
                      </ProjectLink>

                      <ProjectLink
                        href={links.sourceCodeUrl}
                        variant="secondary"
                      >
                        View Source Code
                      </ProjectLink>

                      <ProjectLink href={links.videoUrl} variant="outline">
                        Watch Project Video
                      </ProjectLink>
                    </div>
                  </section>
                )}
              </aside>
            </div>
          </Container>
        </section>

        <section className="border-t border-slate-200 bg-white py-14">
          <Container>
            <div className="rounded-3xl bg-slate-950 px-6 py-10 text-center text-white sm:px-10">
              <p className="break-words text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                Start Your Project
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl break-words text-3xl font-bold tracking-tight sm:text-4xl">
                Need a professional website or web application?
              </h2>

              <p className="mx-auto mt-5 max-w-2xl break-words leading-7 text-slate-300">
                Let us discuss your business idea, required features and the
                best development solution.
              </p>

              <Link
                to="/#contact"
                className="mt-7 inline-flex min-h-12 max-w-full items-center justify-center rounded-xl bg-brand-600 px-6 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Discuss Your Project
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default ProjectDetailsPage;
