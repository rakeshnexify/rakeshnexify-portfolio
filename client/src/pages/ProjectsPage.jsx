import { useEffect, useMemo } from "react";
import { Link } from "react-router";

import Container from "../components/layout/Container";
import ProjectCard from "../components/projects/ProjectCard";
import Logo from "../components/ui/Logo";
import siteData from "../data/siteData";
import useProjects from "../hooks/useProjects";
import useSiteSettings from "../hooks/useSiteSettings";

const defaultPageContent = {
  eyebrow: "All Projects",

  heading:
    "Websites, applications and digital products built for real-world use",

  description:
    "Explore all published MERN applications, e-commerce platforms, WordPress websites and frontend projects, including live demonstrations, source code and detailed case studies.",
};

function sortProjects(firstProject, secondProject) {
  const firstFeatured = Boolean(
    firstProject?.isFeatured ?? firstProject?.featured,
  );

  const secondFeatured = Boolean(
    secondProject?.isFeatured ?? secondProject?.featured,
  );

  const featuredDifference = Number(secondFeatured) - Number(firstFeatured);

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  return Number(firstProject?.order || 0) - Number(secondProject?.order || 0);
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Projects could not be loaded.";
}

function ProjectsLoadingState() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <Container>
          <div className="flex min-h-20 min-w-0 flex-col items-start justify-center gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <Link to="/" className="inline-flex min-w-0 max-w-full">
              <Logo />
            </Link>

            <Link
              to="/#projects"
              className="inline-flex min-h-10 max-w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
            >
              ← Back Home
            </Link>
          </div>
        </Container>
      </header>

      <Container>
        <div className="py-16">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-6 h-14 max-w-3xl animate-pulse rounded-xl bg-slate-200" />

          <div className="mt-5 h-24 max-w-2xl animate-pulse rounded-xl bg-slate-200" />

          <div className="mt-12 grid min-w-0 gap-7 [&>*]:min-w-0 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[32rem] animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}

function ProjectsErrorState({ error, onRetry, isRetrying }) {
  return (
    <main className="grid min-h-screen overflow-x-hidden place-items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-red-600">
          !
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
          Projects Error
        </p>

        <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
          Projects could not be loaded
        </h1>

        <p className="mt-4 break-words leading-7 text-slate-600">
          {getErrorMessage(error)}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isRetrying ? "Retrying..." : "Retry"}
          </button>

          <Link
            to="/#projects"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}

function ProjectsPage() {
  const {
    projects: loadedProjects,
    isLoading,
    error,
    refreshProjects,
  } = useProjects({
    fallbackProjects: siteData.projects,
  });

  const { settings } = useSiteSettings();

  const brand = settings?.brand || {};

  const sectionContent = settings?.projectsSection || {};

  const brandName = String(brand.name || "").trim() || "RakeshNexify";

  const eyebrow =
    String(sectionContent.eyebrow || "").trim() || defaultPageContent.eyebrow;

  const heading =
    String(sectionContent.heading || sectionContent.title || "").trim() ||
    defaultPageContent.heading;

  const description =
    String(sectionContent.description || "").trim() ||
    defaultPageContent.description;

  const projects = useMemo(() => {
    const sourceProjects = Array.isArray(loadedProjects) ? loadedProjects : [];

    return [...sourceProjects].sort(sortProjects);
  }, [loadedProjects]);

  useEffect(() => {
    const previousTitle = document.title;

    document.title = `Projects | ${brandName}`;

    return () => {
      document.title = previousTitle;
    };
  }, [brandName]);

  if (isLoading && projects.length === 0) {
    return <ProjectsLoadingState />;
  }

  if (error && projects.length === 0) {
    return (
      <ProjectsErrorState
        error={error}
        onRetry={refreshProjects}
        isRetrying={isLoading}
      />
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <Container>
          <div className="flex min-h-20 min-w-0 flex-col items-start justify-center gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <Link
              to="/"
              aria-label={`Go to ${brandName} homepage`}
              className="inline-flex min-w-0 max-w-full"
            >
              <Logo showTagline />
            </Link>

            <Link
              to="/#projects"
              className="inline-flex min-h-10 max-w-full shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
            >
              ← Back Home
            </Link>
          </div>
        </Container>
      </header>

      <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl" />

        <div className="absolute -bottom-40 left-10 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <Container>
          <div className="relative min-w-0 max-w-4xl">
            <p className="break-words text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
              {eyebrow}
            </p>

            <h1 className="mt-4 break-words text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              {heading}
            </h1>

            <p className="mt-6 max-w-3xl break-words text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              {description}
            </p>

            <div className="mt-8 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="inline-flex max-w-full items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-center text-sm font-semibold text-slate-200">
                {projects.length}{" "}
                {projects.length === 1 ? "Public Project" : "Public Projects"}
              </span>

              <Link
                to="/#contact"
                className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Discuss Your Project
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container>
          {error && projects.length > 0 && (
            <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Saved projects are being displayed
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-700">
                  The live Projects API could not be reached.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshProjects}
                disabled={isLoading}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}

          {projects.length > 0 ? (
            <div className="grid min-w-0 gap-7 [&>*]:min-w-0 lg:grid-cols-2">
              {projects.map((project, index) => (
                <ProjectCard
                  key={
                    project._id ||
                    project.id ||
                    project.slug ||
                    `${project.title}-${index}`
                  }
                  project={project}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                0
              </div>

              <h2 className="mt-6 break-words text-2xl font-bold tracking-tight text-slate-950">
                No public projects available
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                Projects will appear here after they are created and published
                from the Admin Panel.
              </p>

              <Link
                to="/#contact"
                className="mt-7 inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Discuss a Project
              </Link>
            </div>
          )}
        </Container>
      </section>

      <section className="border-t border-slate-200 bg-white py-14">
        <Container>
          <div className="rounded-3xl bg-slate-950 px-6 py-10 text-center text-white sm:px-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
              Custom Development
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl break-words text-2xl font-bold tracking-tight sm:text-4xl">
              Need a professional website or web application?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">
              Share your business idea, required features and expected timeline.
              A suitable development plan can be prepared according to your
              project goals.
            </p>

            <Link
              to="/#contact"
              className="mt-7 inline-flex min-h-12 max-w-full items-center justify-center rounded-xl bg-brand-600 px-6 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Start Your Project
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default ProjectsPage;
