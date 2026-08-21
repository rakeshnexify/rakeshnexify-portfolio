import { useMemo, useState } from "react";
import { Link } from "react-router";

import Container from "../components/layout/Container";
import PublicPageCTA from "../components/layout/PublicPageCTA";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import ProjectCard from "../components/projects/ProjectCard";
import PageSeo from "../components/seo/PageSeo";
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

const defaultProjectKeywords = [
  "MERN projects",
  "WordPress projects",
  "web application projects",
  "custom website projects",
  "full stack development projects",
  "React projects",
  "Node.js projects",
  "MongoDB projects",
  "business website projects",
  "e-commerce projects",
  "web development portfolio",
];

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


function cleanCategory(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function createCategoryKey(value) {
  return cleanCategory(value).toLowerCase();
}

function ProjectsFilterIcon({ all = false }) {
  if (all) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="4" y="4" width="6" height="6" rx="1.2" />
        <rect x="14" y="4" width="6" height="6" rx="1.2" />
        <rect x="4" y="14" width="6" height="6" rx="1.2" />
        <rect x="14" y="14" width="6" height="6" rx="1.2" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3.75 7.75A1.75 1.75 0 0 1 5.5 6h4l1.6 2h7.4a1.75 1.75 0 0 1 1.75 1.75v7A1.75 1.75 0 0 1 18.5 18.5h-13a1.75 1.75 0 0 1-1.75-1.75v-9Z" />
    </svg>
  );
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
      <Footer />
    </>
  );
}

function ProjectsErrorState({ error, onRetry, isRetrying }) {
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
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isRetrying ? "Retrying..." : "Retry"}
            </button>

            <Link
              to="/"
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-center text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
            >
              Return Home
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

function ProjectsPage() {
  const [activeCategoryKey, setActiveCategoryKey] = useState("all");

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

  const seo =
    settings?.seo && typeof settings.seo === "object" ? settings.seo : {};

  const globalSeoKeywords = Array.isArray(seo.keywords)
    ? seo.keywords
    : String(seo.keywords || "")
        .split(/[,\n]/)
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  const seoKeywords = [...globalSeoKeywords, ...defaultProjectKeywords];

  const socialSharingImage = String(seo.ogImageUrl || "").trim();

  const seoTitle = `Projects | ${brandName}`;

  const projects = useMemo(() => {
    const sourceProjects = Array.isArray(loadedProjects) ? loadedProjects : [];

    return [...sourceProjects].sort(sortProjects);
  }, [loadedProjects]);

  const categories = useMemo(() => {
    const seenCategoryKeys = new Set();

    return projects.reduce((result, project) => {
      const label = cleanCategory(project?.category);

      if (!label) {
        return result;
      }

      const key = createCategoryKey(label);

      if (!seenCategoryKeys.has(key)) {
        seenCategoryKeys.add(key);

        result.push({
          key,
          label,
        });
      }

      return result;
    }, []);
  }, [projects]);

  const activeCategoryExists =
    activeCategoryKey === "all" ||
    categories.some((category) => category.key === activeCategoryKey);

  const resolvedActiveCategoryKey = activeCategoryExists
    ? activeCategoryKey
    : "all";

  const filteredProjects = useMemo(() => {
    if (resolvedActiveCategoryKey === "all") {
      return projects;
    }

    return projects.filter(
      (project) =>
        createCategoryKey(project?.category) === resolvedActiveCategoryKey,
    );
  }, [projects, resolvedActiveCategoryKey]);

  if (isLoading && projects.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/projects"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <ProjectsLoadingState />
      </>
    );
  }

  if (error && projects.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/projects"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <ProjectsErrorState
          error={error}
          onRetry={refreshProjects}
          isRetrying={isLoading}
        />
      </>
    );
  }

  return (
    <>
      <PageSeo
        title={seoTitle}
        description={description}
        keywords={seoKeywords}
        canonicalPath="/projects"
        image={socialSharingImage}
        type="website"
        brandName={brandName}
      />

      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="public-projects-page-shell min-h-screen overflow-x-hidden bg-slate-50"
      >
        <section className="public-projects-page-hero relative overflow-hidden bg-slate-950 py-5 text-white sm:py-6">
          <div className="public-projects-page-hero-orb public-projects-page-hero-orb-a absolute -right-16 -top-20 size-56 rounded-full blur-3xl" />

          <div className="public-projects-page-hero-orb public-projects-page-hero-orb-b absolute -bottom-28 left-12 size-52 rounded-full blur-3xl" />

          <Container>
            <div className="public-projects-page-hero-content relative flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
              <div className="min-w-0 flex-1">
                <p className="public-projects-page-hero-eyebrow break-words text-[0.65rem] font-bold uppercase tracking-[0.18em] text-brand-400">
                  {eyebrow}
                </p>

                <h1 className="public-projects-page-hero-heading mt-2 break-words text-2xl font-black leading-[1.05] tracking-tight sm:text-3xl lg:text-4xl">
                  {heading}
                </h1>

                <p className="public-projects-page-hero-description mt-2 line-clamp-2 max-w-4xl break-words text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6 lg:line-clamp-1">
                  {description}
                </p>
              </div>

              <div className="public-projects-page-hero-actions flex min-w-0 shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                <span className="public-projects-page-count inline-flex min-h-9 max-w-full items-center justify-center rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-center text-xs font-semibold text-slate-200">
                  {projects.length}{" "}
                  {projects.length === 1 ? "Public Project" : "Public Projects"}
                </span>

                <Link
                  to="/#contact"
                  className="public-projects-page-hero-cta inline-flex min-h-9 max-w-full items-center justify-center rounded-xl bg-brand-600 px-4 text-center text-xs font-semibold text-white transition hover:bg-brand-700"
                >
                  Discuss Your Project
                </Link>
              </div>
            </div>
          </Container>
        </section>

        <section className="public-projects-page-listing relative py-12 sm:py-16">
          <Container>
            {error && projects.length > 0 && (
              <div className="mb-8 flex min-w-0 flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-amber-800">
                    Saved projects are being displayed
                  </p>

                  <p className="mt-1 break-words text-sm leading-6 text-amber-700">
                    The live Projects API could not be reached.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshProjects}
                  disabled={isLoading}
                  className="inline-flex min-h-10 max-w-full shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-center text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </button>
              </div>
            )}

            {categories.length > 0 && (
              <div
                className="public-projects-filters public-projects-page-filters"
                aria-label="Filter projects by category"
              >
                <button
                  type="button"
                  aria-pressed={resolvedActiveCategoryKey === "all"}
                  className={
                    resolvedActiveCategoryKey === "all"
                      ? "public-project-filter public-project-filter-active"
                      : "public-project-filter"
                  }
                  onClick={() => setActiveCategoryKey("all")}
                >
                  <span className="public-project-filter-icon">
                    <ProjectsFilterIcon all />
                  </span>

                  <span>All Projects</span>
                </button>

                {categories.map((category) => (
                  <button
                    key={category.key}
                    type="button"
                    aria-pressed={resolvedActiveCategoryKey === category.key}
                    className={
                      resolvedActiveCategoryKey === category.key
                        ? "public-project-filter public-project-filter-active"
                        : "public-project-filter"
                    }
                    onClick={() => setActiveCategoryKey(category.key)}
                  >
                    <span className="public-project-filter-icon">
                      <ProjectsFilterIcon />
                    </span>

                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            )}

            {projects.length > 0 ? (
              filteredProjects.length > 0 ? (
                <div
                  className="public-projects-page-grid"
                  aria-label="Projects"
                >
                  {filteredProjects.map((project, index) => (
                    <ProjectCard
                      key={
                        project._id ||
                        project.id ||
                        project.slug ||
                        `${project.title}-${index}`
                      }
                      project={project}
                      index={index}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <div className="public-projects-page-empty">
                  <p className="text-lg font-bold text-slate-950">
                    No projects in this category
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    Choose another category or return to all published projects.
                  </p>

                  <button
                    type="button"
                    className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-600 bg-white px-4 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
                    onClick={() => setActiveCategoryKey("all")}
                  >
                    Show All Projects
                  </button>
                </div>
              )
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                  0
                </div>

                <h2 className="mt-6 break-words text-2xl font-bold tracking-tight text-slate-950">
                  No public projects available
                </h2>

                <p className="mx-auto mt-3 max-w-xl break-words leading-7 text-slate-600">
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

        <PublicPageCTA
          ctaKey="projects"
          sectionClassName="public-projects-page-conversion"
        />
      </main>
      <Footer />
    </>
  );
}

export default ProjectsPage;
