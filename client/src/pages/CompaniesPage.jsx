import { useMemo } from "react";
import { Link } from "react-router";

import CompanyCard from "../components/companies/CompanyCard";
import Container from "../components/layout/Container";
import PublicPageCTA from "../components/layout/PublicPageCTA";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import siteData from "../data/siteData";
import useCompanies from "../hooks/useCompanies";
import useSiteSettings from "../hooks/useSiteSettings";

const defaultPageContent = {
  eyebrow: "All Companies",

  heading: "Companies and business ventures built for long-term growth",

  description:
    "Explore all published companies, e-commerce businesses and digital ventures that I own, manage, partner with or help develop.",
};

const defaultCompanyKeywords = [
  "business website development",
  "company website development",
  "MERN business applications",
  "WordPress business websites",
  "custom business platforms",
  "startup website development",
  "business web application development",
  "digital product development",
  "company portfolio",
  "business ventures",
  "e-commerce business solutions",
];

function sortCompanies(firstCompany, secondCompany) {
  const firstFeatured = Boolean(
    firstCompany?.isFeatured ?? firstCompany?.featured,
  );

  const secondFeatured = Boolean(
    secondCompany?.isFeatured ?? secondCompany?.featured,
  );

  const featuredDifference = Number(secondFeatured) - Number(firstFeatured);

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  return Number(firstCompany?.order || 0) - Number(secondCompany?.order || 0);
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Companies could not be loaded.";
}

function CompaniesLoadingState() {
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
                  className="h-[34rem] animate-pulse rounded-3xl bg-slate-200"
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

function CompaniesErrorState({ error, onRetry, isRetrying }) {
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
            Companies Error
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
            Companies could not be loaded
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

function CompaniesPage() {
  const fallbackCompanies = Array.isArray(siteData.companies)
    ? siteData.companies
    : [];

  const {
    companies: loadedCompanies,
    isLoading,
    error,
    refreshCompanies,
  } = useCompanies({
    fallbackCompanies,
  });

  const { settings } = useSiteSettings();

  const brand = settings?.brand || {};

  const sectionContent = settings?.companiesSection || {};

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

  const seoKeywords = [...globalSeoKeywords, ...defaultCompanyKeywords];

  const socialSharingImage = String(seo.ogImageUrl || "").trim();

  const seoTitle = `Companies | ${brandName}`;

  const companies = useMemo(() => {
    const sourceCompanies = Array.isArray(loadedCompanies)
      ? loadedCompanies
      : [];

    return [...sourceCompanies].sort(sortCompanies);
  }, [loadedCompanies]);

  if (isLoading && companies.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/companies"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <CompaniesLoadingState />
      </>
    );
  }

  if (error && companies.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/companies"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <CompaniesErrorState
          error={error}
          onRetry={refreshCompanies}
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
        canonicalPath="/companies"
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
                  {companies.length}{" "}
                  {companies.length === 1
                    ? "Public Company"
                    : "Public Companies"}
                </span>

                <Link
                  to="/#contact"
                  className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Discuss a Business Project
                </Link>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            {error && companies.length > 0 && (
              <div className="mb-8 flex min-w-0 flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-amber-800">
                    Saved company information is being displayed
                  </p>

                  <p className="mt-1 break-words text-sm leading-6 text-amber-700">
                    The live Companies API could not be reached.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshCompanies}
                  disabled={isLoading}
                  className="inline-flex min-h-10 max-w-full shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-center text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </button>
              </div>
            )}

            {companies.length > 0 ? (
              <div className="grid min-w-0 gap-7 [&>*]:min-w-0 lg:grid-cols-2">
                {companies.map((company, index) => (
                  <CompanyCard
                    key={
                      company._id ||
                      company.id ||
                      company.slug ||
                      `${company.name}-${index}`
                    }
                    company={company}
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
                  No public companies available
                </h2>

                <p className="mx-auto mt-3 max-w-xl break-words leading-7 text-slate-600">
                  Companies will appear here after they are created and
                  published from the Admin Panel.
                </p>

                <Link
                  to="/#contact"
                  className="mt-7 inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Discuss a Business Project
                </Link>
              </div>
            )}
          </Container>
        </section>

        <PublicPageCTA
          ctaKey="companies"
        />
      </main>
      <Footer />
    </>
  );
}

export default CompaniesPage;
