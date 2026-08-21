import { useMemo } from "react";
import { Link } from "react-router";

import EducationTimelineCard, {
  getSafeHttpUrl,
} from "../components/education/EducationTimelineCard";
import Container from "../components/layout/Container";
import PublicPageCTA from "../components/layout/PublicPageCTA";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import useEducation from "../hooks/useEducation";
import useSiteSettings from "../hooks/useSiteSettings";

const defaultPageContent = {
  eyebrow: "Education Journey",

  heading: "Academic learning, courses and professional qualifications",

  description:
    "Explore the institutions, qualifications, certifications, courses and training that support my technical knowledge and professional development.",
};

const defaultEducationKeywords = [
  "RakeshNexify education",
  "Rakesh Pandit education",
  "developer education",
  "computer science education",
  "web development training",
  "MERN developer qualification",
  "professional certifications",
  "technical courses",
  "academic background",
];

const SITE_URL = "https://rakeshnexify.com";

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Education records could not be loaded.";
}

function EducationLoadingState() {
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

            <div className="mt-12 space-y-7">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-80 animate-pulse rounded-3xl bg-slate-200"
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

function EducationErrorState({ error, onRetry, isRetrying }) {
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
            Education Error
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Education records could not be loaded
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

function EducationPage() {
  const {
    educationRecords,
    isLoading,
    error,
    refreshEducation,
  } = useEducation();

  const { settings } = useSiteSettings();

  const brand = settings?.brand || {};

  const sectionContent = settings?.educationSection || {};

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

  const seoKeywords = [...globalSeoKeywords, ...defaultEducationKeywords];

  const socialSharingImage = String(seo.ogImageUrl || "").trim();

  const seoTitle = `Education | ${brandName}`;

  const education = Array.isArray(educationRecords)
    ? educationRecords
    : [];

  const currentEducationCount = education.filter(
    (record) => record?.isCurrentlyStudying,
  ).length;

  const institutionCount = useMemo(() => {
    return new Set(
      education
        .map((record) =>
          String(record?.institutionName || "").trim().toLowerCase(),
        )
        .filter(Boolean),
    ).size;
  }, [education]);

  const educationStructuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seoTitle,
      headline: heading,
      description,
      url: `${SITE_URL}/education`,
      isPartOf: {
        "@type": "WebSite",
        name: brandName,
        url: `${SITE_URL}/`,
      },
      mainEntity: {
        "@type": "ItemList",
        name: `${brandName} Education and Qualifications`,
        numberOfItems: education.length,
        itemListElement: education.map((record, index) => {
          const safeInstitutionUrl = getSafeHttpUrl(record?.institutionUrl);

          return {
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "EducationalOccupationalCredential",
              name:
                String(record?.degree || "").trim() ||
                "Professional Qualification",
              description: String(
                record?.shortDescription || record?.description || "",
              ).trim(),
              credentialCategory: String(
                record?.educationType || "education",
              ).trim(),
              recognizedBy: {
                "@type": "Organization",
                name:
                  String(record?.institutionName || "").trim() ||
                  "Institution",
                ...(safeInstitutionUrl ? { url: safeInstitutionUrl } : {}),
              },
            },
          };
        }),
      },
    }),
    [brandName, description, education, heading, seoTitle],
  );

  if (isLoading && education.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/education"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
          structuredData={educationStructuredData}
        />

        <EducationLoadingState />
      </>
    );
  }

  if (error && education.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/education"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <EducationErrorState
          error={error}
          onRetry={refreshEducation}
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
        canonicalPath="/education"
        image={socialSharingImage}
        type="website"
        brandName={brandName}
        structuredData={educationStructuredData}
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
                  {education.length}{" "}
                  {education.length === 1 ? "Record" : "Records"}
                </span>

                <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                  {institutionCount}{" "}
                  {institutionCount === 1 ? "Institution" : "Institutions"}
                </span>

                {currentEducationCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200">
                    {currentEducationCount} currently studying
                  </span>
                )}
              </div>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            {error && education.length > 0 && (
              <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-800">
                    Saved Education information is being displayed
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-700">
                    The live Education API could not be reached.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshEducation}
                  disabled={isLoading}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </button>
              </div>
            )}

            {education.length > 0 ? (
              <div className="mx-auto max-w-5xl space-y-8">
                {education.map((record, index) => (
                  <EducationTimelineCard
                    key={
                      record._id ||
                      record.id ||
                      record.slug ||
                      `${record.institutionName}-${index}`
                    }
                    education={record}
                    showTimelineConnector={index < education.length - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                  0
                </div>

                <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
                  No public Education records available
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                  Education records will appear here after they are created and
                  published from the Admin Panel.
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
          ctaKey="education"
        />
      </main>

      <Footer />
    </>
  );
}

export default EducationPage;
