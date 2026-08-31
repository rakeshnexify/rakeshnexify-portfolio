import { useMemo } from "react";
import { Link } from "react-router";

import ExperienceTimelineCard from "../components/experience/ExperienceTimelineCard";
import { getSafeHttpUrl } from "../components/experience/ExperienceTimelineCard.utils";
import Container from "../components/layout/Container";
import PublicPageCTA from "../components/layout/PublicPageCTA";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import useExperience from "../hooks/useExperience";
import useSiteSettings from "../hooks/useSiteSettings";

const defaultPageContent = {
  eyebrow: "Professional Experience",

  heading: "Work, freelance and business experience",

  description:
    "Explore the professional roles, responsibilities, achievements, skills and tools that shaped my practical development journey.",
};

const defaultExperienceKeywords = [
  "RakeshNexify experience",
  "Rakesh Pandit work experience",
  "MERN developer experience",
  "full stack developer experience",
  "freelance web developer",
  "React developer experience",
  "Node.js developer experience",
  "WordPress developer experience",
  "professional developer portfolio",
];

const SITE_URL = "https://rakeshnexify.com";

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Experience records could not be loaded.";
}

function createStructuredDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function ExperienceLoadingState() {
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
            <div className="h-6 w-44 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-6 h-14 max-w-3xl animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-5 h-24 max-w-2xl animate-pulse rounded-xl bg-slate-200" />

            <div className="mt-12 space-y-7">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-96 animate-pulse rounded-3xl bg-slate-200"
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

function ExperienceErrorState({ error, onRetry, isRetrying }) {
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

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Experience Error
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Experience records could not be loaded
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
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function ExperiencePage() {
  const {
    experienceRecords,
    isLoading,
    error,
    refreshExperience,
  } = useExperience();

  const { settings } = useSiteSettings();

  const brand = settings?.brand || {};

  const owner = settings?.owner || {};

  const sectionContent = settings?.experienceSection || {};

  const brandName = String(brand.name || "").trim() || "RakeshNexify";

  const ownerName =
    String(owner.name || "").trim() || "Rakesh Pandit";

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

  const seoKeywords = [...globalSeoKeywords, ...defaultExperienceKeywords];

  const socialSharingImage = String(seo.ogImageUrl || "").trim();

  const seoTitle = `Experience | ${brandName}`;

  const experience = useMemo(
    () =>
      Array.isArray(experienceRecords)
        ? experienceRecords
        : [],
    [experienceRecords],
  );

  const currentExperienceCount = experience.filter(
    (record) => record?.isCurrent,
  ).length;

  const organizationCount = useMemo(() => {
    return new Set(
      experience
        .map((record) =>
          String(record?.organizationName || "").trim().toLowerCase(),
        )
        .filter(Boolean),
    ).size;
  }, [experience]);

  const experienceStructuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seoTitle,
      headline: heading,
      description,
      url: `${SITE_URL}/experience`,
      isPartOf: {
        "@type": "WebSite",
        name: brandName,
        url: `${SITE_URL}/`,
      },
      mainEntity: {
        "@type": "ItemList",
        name: `${ownerName} Professional Experience`,
        numberOfItems: experience.length,
        itemListElement: experience.map((record, index) => {
          const organizationName =
            String(record?.organizationName || "").trim() || "Organization";

          const jobTitle =
            String(record?.jobTitle || "").trim() || "Professional Role";

          const safeOrganizationUrl = getSafeHttpUrl(
            record?.organizationWebsiteUrl,
          );

          const startDate = createStructuredDate(record?.startDate);

          const endDate = record?.isCurrent
            ? ""
            : createStructuredDate(record?.endDate);

          return {
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "OrganizationRole",
              roleName: jobTitle,
              name: `${jobTitle} at ${organizationName}`,
              description: String(
                record?.shortDescription || record?.description || "",
              ).trim(),
              ...(startDate ? { startDate } : {}),
              ...(endDate ? { endDate } : {}),
              member: {
                "@type": "Person",
                name: ownerName,
              },
              memberOf: {
                "@type": "Organization",
                name: organizationName,
                ...(safeOrganizationUrl
                  ? { url: safeOrganizationUrl }
                  : {}),
              },
            },
          };
        }),
      },
    }),
    [
      brandName,
      description,
      experience,
      heading,
      ownerName,
      seoTitle,
    ],
  );

  if (isLoading && experience.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/experience"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
          structuredData={experienceStructuredData}
        />

        <ExperienceLoadingState />
      </>
    );
  }

  if (error && experience.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/experience"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <ExperienceErrorState
          error={error}
          onRetry={refreshExperience}
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
        canonicalPath="/experience"
        image={socialSharingImage}
        type="website"
        brandName={brandName}
        structuredData={experienceStructuredData}
      />

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

              <h1 className="mt-4 break-words text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {heading}
              </h1>

              <p className="mt-6 max-w-3xl break-words text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                  {experience.length}{" "}
                  {experience.length === 1 ? "Role" : "Roles"}
                </span>

                <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                  {organizationCount}{" "}
                  {organizationCount === 1
                    ? "Organization"
                    : "Organizations"}
                </span>

                {currentExperienceCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200">
                    {currentExperienceCount} current{" "}
                    {currentExperienceCount === 1 ? "position" : "positions"}
                  </span>
                )}
              </div>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            {error && experience.length > 0 && (
              <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-800">
                    Saved Experience information is being displayed
                  </p>

                  <p className="mt-1 break-words text-sm leading-6 text-amber-700">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshExperience}
                  disabled={isLoading}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </button>
              </div>
            )}

            {experience.length > 0 ? (
              <div className="mx-auto max-w-5xl space-y-8">
                {experience.map((record, index) => (
                  <ExperienceTimelineCard
                    key={
                      record._id ||
                      record.id ||
                      record.slug ||
                      `${record.organizationName}-${index}`
                    }
                    experience={record}
                    showTimelineConnector={index < experience.length - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                  0
                </div>

                <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
                  No public Experience records available
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                  Experience records will appear here after they are created
                  and published from the Admin Panel.
                </p>

                <Link
                  to="/#contact"
                  className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Contact Me
                </Link>
              </div>
            )}
          </Container>
        </section>

        <PublicPageCTA
          ctaKey="experience"
        />
      </main>

      <Footer />
    </>
  );
}

export default ExperiencePage;
