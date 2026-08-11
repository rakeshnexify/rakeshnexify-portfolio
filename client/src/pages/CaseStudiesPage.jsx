import { useMemo, useState } from "react";
import { Link } from "react-router";

import CaseStudyCard from "../components/projects/CaseStudyCard";
import Container from "../components/layout/Container";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import useProjects from "../hooks/useProjects";
import useSiteSettings from "../hooks/useSiteSettings";

const defaultPageContent = {
  eyebrow: "Case Studies",
  heading: "Real project stories from challenge to measurable outcome",
  description:
    "Explore selected project case studies covering the problem, approach, implementation, technologies and results behind completed work.",
};

const defaultCaseStudyKeywords = [
  "web development case studies",
  "MERN case studies",
  "React case studies",
  "Node.js case studies",
  "MongoDB case studies",
  "WordPress case studies",
  "website development case studies",
  "web application case studies",
  "software project case studies",
  "portfolio case studies",
];

const SITE_URL = "https://rakeshnexify.com";

function normaliseSectionKey(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();

  return key === "home" ? "hero" : key;
}

function isSectionPageVisible(sections, requiredKey) {
  if (!Array.isArray(sections)) {
    return true;
  }

  const normalizedRequiredKey = normaliseSectionKey(requiredKey);

  const section = sections.find(
    (item) => normaliseSectionKey(item?.key) === normalizedRequiredKey,
  );

  return section?.isPageVisible !== false;
}

function createAbsolutePublicUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  return `${SITE_URL}${normalizedPath}`;
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Case Studies could not be loaded.";
}

function createCaseStudyJsonLd(caseStudies) {
  const items = caseStudies
    .map((project, index) => {
      const title = String(project?.title || "").trim();
      const slug = String(project?.slug || "")
        .trim()
        .toLowerCase();

      if (!title || !slug) {
        return null;
      }

      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "CreativeWork",
          name: title,
          url: createAbsolutePublicUrl(
            `/projects/${encodeURIComponent(slug)}`,
          ),
          ...(project.shortDescription
            ? { description: String(project.shortDescription).trim() }
            : {}),
          ...(project.coverImageUrl
            ? { image: createAbsolutePublicUrl(project.coverImageUrl) }
            : {}),
        },
      };
    })
    .filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Case Studies",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items,
    },
  };
}

function CaseStudiesLoadingState() {
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

            <div className="mt-12 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-[31rem] animate-pulse rounded-3xl bg-slate-200"
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

function CaseStudiesErrorState({
  error,
  onRetry,
  isRetrying,
  showProjectsLink,
}) {
  return (
    <>
      <PublicPageHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[calc(100vh-5rem)] place-items-center overflow-x-hidden bg-slate-50 px-4 py-12"
      >
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-red-600">
            !
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Case Studies Error
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Case Studies could not be loaded
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
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

            {showProjectsLink && (
              <Link
                to="/projects"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
              >
                View Projects
              </Link>
            )}

            <Link
              to="/#contact"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-600 bg-white px-5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
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

function CaseStudiesPage() {
  const {
    projects: loadedCaseStudies,
    isLoading,
    error,
    refreshProjects,
  } = useProjects({
    fallbackProjects: [],
    caseStudy: true,
  });

  const { settings } = useSiteSettings();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const projectsPageVisible = isSectionPageVisible(
    settings?.sections,
    "projects",
  );

  const brandName =
    String(settings?.brand?.name || "").trim() || "RakeshNexify";

  const sectionContent = settings?.caseStudiesSection || {};

  const eyebrow =
    String(sectionContent.eyebrow || "").trim() || defaultPageContent.eyebrow;

  const heading =
    String(sectionContent.heading || sectionContent.title || "").trim() ||
    defaultPageContent.heading;

  const description =
    String(sectionContent.description || "").trim() ||
    defaultPageContent.description;

  const globalSeo =
    settings?.seo && typeof settings.seo === "object" ? settings.seo : {};

  const globalSeoKeywords = Array.isArray(globalSeo.keywords)
    ? globalSeo.keywords
    : String(globalSeo.keywords || "")
        .split(/[,\n]/)
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  const caseStudies = useMemo(
    () => (Array.isArray(loadedCaseStudies) ? loadedCaseStudies : []),
    [loadedCaseStudies],
  );

  const categories = useMemo(() => {
    const values = caseStudies
      .map((project) => String(project?.category || "").trim())
      .filter(Boolean);

    return [...new Set(values)].sort((first, second) =>
      first.localeCompare(second),
    );
  }, [caseStudies]);

  const visibleCaseStudies = useMemo(() => {
    if (selectedCategory === "all") {
      return caseStudies;
    }

    return caseStudies.filter(
      (project) =>
        String(project?.category || "").trim().toLowerCase() ===
        selectedCategory.toLowerCase(),
    );
  }, [caseStudies, selectedCategory]);

  const shouldEmitStructuredData = !isLoading && !error;

  const seoProps = {
    title: `Case Studies | ${brandName}`,
    description,
    keywords: [...globalSeoKeywords, ...defaultCaseStudyKeywords],
    canonicalPath: "/case-studies",
    image: String(globalSeo.ogImageUrl || "").trim(),
    type: "website",
    brandName,
    structuredData: shouldEmitStructuredData
      ? createCaseStudyJsonLd(caseStudies)
      : null,
  };

  if (isLoading && caseStudies.length === 0) {
    return (
      <>
        <PageSeo {...seoProps} />
        <CaseStudiesLoadingState />
      </>
    );
  }

  if (error && caseStudies.length === 0) {
    return (
      <>
        <PageSeo {...seoProps} />
        <CaseStudiesErrorState
          error={error}
          onRetry={refreshProjects}
          isRetrying={isLoading}
          showProjectsLink={projectsPageVisible}
        />
      </>
    );
  }

  return (
    <>
      <PageSeo {...seoProps} />

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
            <div className="relative max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                {eyebrow}
              </p>

              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {heading}
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                  {caseStudies.length}{" "}
                  {caseStudies.length === 1 ? "Case Study" : "Case Studies"}
                </span>

                {projectsPageVisible && (
                  <Link
                    to="/projects"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    View All Projects
                  </Link>
                )}

                <Link
                  to="/#contact"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Discuss Your Project
                </Link>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            {error && caseStudies.length > 0 && (
              <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Saved Case Studies are being displayed
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-700">
                    The live Case Studies request could not be refreshed.
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

            {categories.length > 0 && (
              <div
                role="group"
                className="mb-9 flex flex-wrap gap-2"
                aria-label="Case Study category filters"
              >
                <button
                  type="button"
                  aria-pressed={selectedCategory === "all"}
                  onClick={() => setSelectedCategory("all")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedCategory === "all"
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-600"
                  }`}
                >
                  All ({caseStudies.length})
                </button>

                {categories.map((category) => {
                  const count = caseStudies.filter(
                    (project) =>
                      String(project?.category || "").trim() === category,
                  ).length;

                  return (
                    <button
                      key={category}
                      type="button"
                      aria-pressed={selectedCategory === category}
                      onClick={() => setSelectedCategory(category)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        selectedCategory === category
                          ? "bg-slate-950 text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-600"
                      }`}
                    >
                      {category} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {visibleCaseStudies.length > 0 ? (
              <div className="grid min-w-0 gap-7 md:grid-cols-2 xl:grid-cols-3">
                {visibleCaseStudies.map((project) => (
                  <CaseStudyCard
                    key={project._id || project.slug}
                    project={project}
                  />
                ))}
              </div>
            ) : caseStudies.length > 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  No Case Studies in this category
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                  Choose another category or return to all published Case
                  Studies.
                </p>

                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  View All Case Studies
                </button>
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                  0
                </div>

                <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
                  No Case Studies published yet
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                  Selected Projects will appear here after they are published
                  as Case Studies from the Admin Projects editor.
                </p>

                {projectsPageVisible ? (
                  <Link
                    to="/projects"
                    className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    Browse Projects
                  </Link>
                ) : (
                  <Link
                    to="/#contact"
                    className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    Discuss Your Project
                  </Link>
                )}
              </div>
            )}
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default CaseStudiesPage;
