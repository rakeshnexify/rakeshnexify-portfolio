import { useMemo, useState } from "react";
import { Link } from "react-router";

import ClientPartnerCard from "../components/companies/ClientPartnerCard";
import Container from "../components/layout/Container";
import PublicPageCTA from "../components/layout/PublicPageCTA";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import useCompanies from "../hooks/useCompanies";
import useSiteSettings from "../hooks/useSiteSettings";

const SITE_URL = "https://rakeshnexify.com";

const defaultPageContent = {
  eyebrow: "Clients & Partners",
  heading: "Trusted clients and business partners",
  description:
    "Explore companies and organizations I have worked with, supported or partnered with.",
};

const defaultKeywords = [
  "RakeshNexify clients",
  "business partners",
  "client companies",
  "development clients",
  "web development partners",
  "MERN development clients",
  "WordPress clients",
  "business collaboration",
];

const filterOptions = [
  { key: "all", label: "All" },
  { key: "client", label: "Clients" },
  { key: "partner", label: "Partners" },
];

function cleanText(value) {
  return String(value ?? "").trim();
}

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    if (code <= 31 || code === 127) {
      return true;
    }
  }

  return false;
}

function getSafeMediaUrl(value) {
  const url = cleanText(value);

  if (!url || containsControlCharacters(url)) {
    return "";
  }

  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      parsedUrl.hostname &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return url;
    }
  } catch {
    return "";
  }

  return "";
}

function getSafeWebsiteUrl(value) {
  const url = cleanText(value);

  if (!url || containsControlCharacters(url)) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      parsedUrl.hostname &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return parsedUrl.toString();
    }
  } catch {
    return "";
  }

  return "";
}

function createAbsoluteSiteUrl(pathname) {
  const path = cleanText(pathname);

  if (!path || path === "/") {
    return `${SITE_URL}/`;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function sortClientsPartners(firstCompany, secondCompany) {
  const featuredDifference =
    Number(Boolean(secondCompany?.isFeatured ?? secondCompany?.featured)) -
    Number(Boolean(firstCompany?.isFeatured ?? firstCompany?.featured));

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  const orderDifference =
    Number(firstCompany?.order || 0) - Number(secondCompany?.order || 0);

  if (orderDifference !== 0) {
    return orderDifference;
  }

  return cleanText(firstCompany?.name).localeCompare(
    cleanText(secondCompany?.name),
    undefined,
    { sensitivity: "base" },
  );
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return cleanText(error) || "Clients and partners could not be loaded.";
}

function ClientsPartnersLoadingState() {
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

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-3xl bg-slate-200"
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

function ClientsPartnersErrorState({ error, onRetry, isRetrying }) {
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
            Clients & Partners Error
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Clients and partners could not be loaded
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

function ClientsPartnersPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const {
    companies: loadedCompanies,
    isLoading,
    error,
    refreshCompanies,
  } = useCompanies();

  const { settings } = useSiteSettings();

  const brandName = cleanText(settings?.brand?.name) || "RakeshNexify";
  const sectionContent = settings?.clientsPartnersSection || {};

  const eyebrow =
    cleanText(sectionContent.eyebrow) || defaultPageContent.eyebrow;

  const heading =
    cleanText(sectionContent.heading || sectionContent.title) ||
    defaultPageContent.heading;

  const description =
    cleanText(sectionContent.description) || defaultPageContent.description;

  const seo =
    settings?.seo && typeof settings.seo === "object" ? settings.seo : {};

  const globalSeoKeywords = Array.isArray(seo.keywords)
    ? seo.keywords
    : cleanText(seo.keywords)
        .split(/[,\n]/)
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  const seoKeywords = [...globalSeoKeywords, ...defaultKeywords];
  const socialSharingImage = getSafeMediaUrl(seo.ogImageUrl);
  const seoTitle = `Clients & Partners | ${brandName}`;

  const clientsPartners = useMemo(() => {
    const sourceCompanies = Array.isArray(loadedCompanies)
      ? loadedCompanies
      : [];

    return sourceCompanies
      .filter((company) =>
        ["client", "partner"].includes(
          cleanText(company?.relationship).toLowerCase(),
        ),
      )
      .sort(sortClientsPartners);
  }, [loadedCompanies]);

  const filteredCompanies = useMemo(() => {
    if (activeFilter === "all") {
      return clientsPartners;
    }

    return clientsPartners.filter(
      (company) =>
        cleanText(company?.relationship).toLowerCase() === activeFilter,
    );
  }, [activeFilter, clientsPartners]);

  const clientCount = clientsPartners.filter(
    (company) => cleanText(company?.relationship).toLowerCase() === "client",
  ).length;

  const partnerCount = clientsPartners.filter(
    (company) => cleanText(company?.relationship).toLowerCase() === "partner",
  ).length;

  const structuredData = useMemo(() => {
    const eligibleCompanies = clientsPartners
      .map((company) => {
        const name = cleanText(company?.name);

        if (!name) {
          return null;
        }

        const websiteUrl = getSafeWebsiteUrl(company?.websiteUrl);
        const item = {
          "@type": "Organization",
          name,
        };
        const companyDescription = cleanText(
          company?.shortDescription || company?.tagline,
        );

        const logoUrl = getSafeMediaUrl(company?.logoUrl);

        if (websiteUrl) {
          item.url = websiteUrl;
        }

        if (companyDescription) {
          item.description = companyDescription;
        }

        if (logoUrl) {
          item.logo = logoUrl.startsWith("/")
            ? createAbsoluteSiteUrl(logoUrl)
            : logoUrl;
        }

        return item;
      })
      .filter(Boolean);

    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seoTitle,
      headline: heading,
      description,
      url: `${SITE_URL}/clients-partners`,
      isPartOf: {
        "@type": "WebSite",
        name: brandName,
        url: `${SITE_URL}/`,
      },
      mainEntity: {
        "@type": "ItemList",
        name: `${brandName} Clients and Business Partners`,
        numberOfItems: eligibleCompanies.length,
        itemListElement: eligibleCompanies.map((company, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: company,
        })),
      },
    };
  }, [brandName, clientsPartners, description, heading, seoTitle]);
  const shouldEmitStructuredData = !isLoading && !error;

  if (isLoading && clientsPartners.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/clients-partners"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <ClientsPartnersLoadingState />
      </>
    );
  }

  if (error && clientsPartners.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/clients-partners"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <ClientsPartnersErrorState
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
        canonicalPath="/clients-partners"
        image={socialSharingImage}
        type="website"
        brandName={brandName}
        structuredData={shouldEmitStructuredData ? structuredData : null}
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

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                  {clientsPartners.length} Total
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                  {clientCount} {clientCount === 1 ? "Client" : "Clients"}
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                  {partnerCount} {partnerCount === 1 ? "Partner" : "Partners"}
                </span>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            {clientsPartners.length > 0 && (
              <div
                role="group"
                className="flex flex-wrap gap-3"
                aria-label="Relationship filters"
              >
                {filterOptions.map((option) => {
                  const isActive = activeFilter === option.key;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveFilter(option.key)}
                      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition ${
                        isActive
                          ? "bg-brand-600 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:border-brand-600 hover:text-brand-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}

            {error && clientsPartners.length > 0 && (
              <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="break-words text-sm font-semibold text-amber-800">
                  Existing client and partner information is being displayed,
                  but the latest Companies request failed.
                </p>

                <button
                  type="button"
                  onClick={refreshCompanies}
                  disabled={isLoading}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </button>
              </div>
            )}

            {clientsPartners.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                  0
                </div>

                <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
                  No public clients or partners available
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                  Published companies marked as Client Company or Business
                  Partner will appear here.
                </p>
              </div>
            ) : filteredCompanies.length > 0 ? (
              <div className="mt-8 grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCompanies.map((company) => (
                  <ClientPartnerCard
                    key={company._id || company.id || company.slug}
                    company={company}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  No {activeFilter === "client" ? "clients" : "partners"} found
                </h2>

                <p className="mt-3 leading-7 text-slate-600">
                  Try the All filter to view the other published business
                  relationships.
                </p>
              </div>
            )}
          </Container>
        </section>

        <PublicPageCTA
          ctaKey="clientsPartners"
        />
      </main>

      <Footer />
    </>
  );
}

export default ClientsPartnersPage;
