import { useMemo } from "react";
import { Link } from "react-router";

import Container from "../components/layout/Container";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import StatisticCard from "../components/statistics/StatisticCard";
import useSiteSettings from "../hooks/useSiteSettings";
import useStatistics from "../hooks/useStatistics";

const defaultPageContent = {
  eyebrow: "All Statistics",

  heading: "Portfolio achievements, experience and progress in numbers",

  description:
    "Explore the complete collection of published statistics representing projects, technologies, content, companies and professional progress behind RakeshNexify.",
};

const defaultStatisticKeywords = [
  "RakeshNexify statistics",
  "developer portfolio statistics",
  "web development achievements",
  "MERN development experience",
  "WordPress development experience",
  "completed web projects",
  "developer achievements",
  "portfolio impact",
  "business development statistics",
  "content creation statistics",
];

function sortStatistics(firstStatistic, secondStatistic) {
  const firstFeatured = Boolean(firstStatistic?.isFeatured);

  const secondFeatured = Boolean(secondStatistic?.isFeatured);

  const featuredDifference = Number(secondFeatured) - Number(firstFeatured);

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  return (
    Number(firstStatistic?.order || 0) - Number(secondStatistic?.order || 0)
  );
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Statistics could not be loaded.";
}

function StatisticsLoadingState() {
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

            <div className="mt-12 grid min-w-0 gap-6 [&>*]:min-w-0 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
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

function StatisticsErrorState({ error, onRetry, isRetrying }) {
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
            Statistics Error
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
            Statistics could not be loaded
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

function StatisticsPage() {
  const {
    statistics: loadedStatistics,
    isLoading,
    error,
    refreshStatistics,
  } = useStatistics();

  const { settings } = useSiteSettings();

  const brand = settings?.brand || {};

  const sectionContent = settings?.statisticsSection || {};

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

  const seoKeywords = [...globalSeoKeywords, ...defaultStatisticKeywords];

  const socialSharingImage = String(seo.ogImageUrl || "").trim();

  const seoTitle = `Statistics | ${brandName}`;

  const statistics = useMemo(() => {
    const sourceStatistics = Array.isArray(loadedStatistics)
      ? loadedStatistics
      : [];

    return [...sourceStatistics].sort(sortStatistics);
  }, [loadedStatistics]);

  if (isLoading && statistics.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/statistics"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <StatisticsLoadingState />
      </>
    );
  }

  if (error && statistics.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/statistics"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <StatisticsErrorState
          error={error}
          onRetry={refreshStatistics}
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
        canonicalPath="/statistics"
        image={socialSharingImage}
        type="website"
        brandName={brandName}
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
                  {statistics.length}{" "}
                  {statistics.length === 1
                    ? "Public Statistic"
                    : "Public Statistics"}
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
            {error && statistics.length > 0 && (
              <div className="mb-8 flex min-w-0 flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-amber-800">
                    Previously loaded statistics are being displayed
                  </p>

                  <p className="mt-1 break-words text-sm leading-6 text-amber-700">
                    The live Statistics API could not be refreshed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshStatistics}
                  disabled={isLoading}
                  className="inline-flex min-h-10 max-w-full shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-center text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </button>
              </div>
            )}

            {statistics.length > 0 ? (
              <div className="grid min-w-0 gap-6 [&>*]:min-w-0 md:grid-cols-2 xl:grid-cols-3">
                {statistics.map((statistic, index) => (
                  <StatisticCard
                    key={
                      statistic._id ||
                      statistic.key ||
                      `${statistic.label}-${index}`
                    }
                    statistic={statistic}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                  0
                </div>

                <h2 className="mt-6 break-words text-2xl font-bold tracking-tight text-slate-950">
                  No public statistics available
                </h2>

                <p className="mx-auto mt-3 max-w-xl break-words leading-7 text-slate-600">
                  Statistics will appear here after they are created and
                  published from the Admin Panel.
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
              <p className="break-words text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                Build the Next Result
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl break-words text-2xl font-bold tracking-tight sm:text-4xl">
                Need a professional website, application or digital platform?
              </h2>

              <p className="mx-auto mt-5 max-w-2xl break-words leading-7 text-slate-300">
                Share your business goals, required features and expected
                outcome. A suitable development plan can be prepared according
                to your project requirements.
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

      <Footer />
    </>
  );
}

export default StatisticsPage;
