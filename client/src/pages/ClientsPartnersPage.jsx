import { useMemo, useState } from "react";
import { Link } from "react-router";

import ClientPartnerCard from "../components/companies/ClientPartnerCard";
import Container from "../components/layout/Container";
import Footer from "../components/layout/Footer";
import PublicPageCTA from "../components/layout/PublicPageCTA";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import useCompanies from "../hooks/useCompanies";
import useSiteSettings from "../hooks/useSiteSettings";

const SITE_URL = "https://rakeshnexify.com";

const defaultPageContent = {
  heading: "Clients & Partners",
  description:
    "We are proud to work with amazing clients and trusted partners around the world, building strong relationships and delivering exceptional results.",
};

const defaultKeywords = [
  "RakeshNexify clients",
  "business partners",
  "client companies",
  "development clients",
  "web development partners",
  "MERN development clients",
  "business collaboration",
];

const filterOptions = [
  { key: "all", label: "All" },
  { key: "client", label: "Clients" },
  { key: "partner", label: "Partners" },
];

const trustItems = [
  {
    title: "Trusted Relationships",
    description: "Long-term partnerships built on trust and results.",
    icon: "people",
  },
  {
    title: "Quality Focused",
    description: "Delivering high-quality solutions, every time.",
    icon: "star",
  },
  {
    title: "On-Time Delivery",
    description: "Committed to deadlines and project success.",
    icon: "delivery",
  },
  {
    title: "Ongoing Support",
    description: "Continuous support even after project completion.",
    icon: "heart",
  },
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

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function TrustIcon({ name }) {
  const commonProps = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    className: "size-5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "star") {
    return (
      <svg {...commonProps}>
        <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9z" />
      </svg>
    );
  }

  if (name === "delivery") {
    return (
      <svg {...commonProps}>
        <path d="M4 17V7h10v10zM14 10h3l3 3v4h-6z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    );
  }

  if (name === "heart") {
    return (
      <svg {...commonProps}>
        <path d="M20.8 5.7a5.4 5.4 0 00-7.6 0L12 6.9l-1.2-1.2a5.4 5.4 0 00-7.6 7.6L12 22l8.8-8.7a5.4 5.4 0 000-7.6z" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M16 20v-1.5a4.5 4.5 0 00-4.5-4.5h-4A4.5 4.5 0 003 18.5V20" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M17 11a4 4 0 014 4v1" />
      <path d="M16.5 3.3a4 4 0 010 7.4" />
    </svg>
  );
}

function GlobeVisual({ count, companies }) {
  const orbitCompanies = Array.isArray(companies) ? companies.slice(0, 4) : [];

  return (
    <div className="relative mx-auto aspect-[1.1/1] w-full max-w-[17.5rem] select-none sm:max-w-[19rem] lg:max-w-[21rem]">
      <div
        aria-hidden="true"
        className="absolute inset-[8%] rounded-full border border-dashed border-brand-300/55 animate-spin [animation-duration:28s] motion-reduce:animate-none [body.public-theme-active[data-public-theme='dark']_&]:border-cyan-300/20"
      />
      <span
        aria-hidden="true"
        className="absolute left-[12%] top-[48%] z-10 size-2 rounded-full bg-brand-500 shadow-[0_0_18px_rgba(59,130,246,0.65)] animate-pulse motion-reduce:animate-none [body.public-theme-active[data-public-theme='dark']_&]:bg-cyan-300"
      />
      <span
        aria-hidden="true"
        className="absolute right-[14%] top-[29%] z-10 size-1.5 rounded-full bg-violet-500 shadow-[0_0_16px_rgba(139,92,246,0.55)] animate-pulse [animation-delay:900ms] motion-reduce:animate-none [body.public-theme-active[data-public-theme='dark']_&]:bg-violet-300"
      />

      <div
        aria-hidden="true"
        className="absolute inset-[20%] overflow-hidden rounded-full bg-gradient-to-br from-brand-100 via-indigo-100 to-violet-200 shadow-[0_28px_80px_rgba(79,70,229,0.20)] transition-transform duration-700 hover:scale-[1.02] [body.public-theme-active[data-public-theme='dark']_&]:from-[#10233f] [body.public-theme-active[data-public-theme='dark']_&]:via-[#172554] [body.public-theme-active[data-public-theme='dark']_&]:to-[#211946] [body.public-theme-active[data-public-theme='dark']_&]:shadow-[0_28px_80px_rgba(30,64,175,0.22)]"
      >
        <svg
          viewBox="0 0 300 300"
          className="size-full text-brand-400/55 animate-pulse [animation-duration:5s] motion-reduce:animate-none [body.public-theme-active[data-public-theme='dark']_&]:text-cyan-200/22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <ellipse cx="150" cy="150" rx="70" ry="128" />
          <ellipse cx="150" cy="150" rx="125" ry="50" />
          <circle cx="150" cy="150" r="126" />
          <path d="M32 110c50 18 186 18 236 0M32 190c50-18 186-18 236 0" />
        </svg>
      </div>

      <div className="absolute left-[29%] top-[37%] z-10 rounded-[1.35rem] border border-white/80 bg-white/90 px-4 py-3.5 shadow-[0_18px_44px_rgba(15,23,42,0.12)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 sm:px-5 [body.public-theme-active[data-public-theme='dark']_&]:border-white/10 [body.public-theme-active[data-public-theme='dark']_&]:bg-[#081321]/90 [body.public-theme-active[data-public-theme='dark']_&]:shadow-[0_18px_46px_rgba(2,8,23,0.38)]">
        <p className="text-xs font-semibold text-slate-500 [body.public-theme-active[data-public-theme='dark']_&]:text-slate-400">Trusted by</p>
        <p className="mt-1 text-3xl font-black tracking-tight text-slate-950 [body.public-theme-active[data-public-theme='dark']_&]:text-white">
          {count}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-600 [body.public-theme-active[data-public-theme='dark']_&]:text-slate-300">
          Clients & Partners
        </p>
      </div>

      {orbitCompanies.map((company, index) => {
        const positions = [
          "left-[5%] top-[10%]",
          "right-[3%] top-[17%]",
          "bottom-[7%] left-[4%]",
          "bottom-[5%] right-[5%]",
        ];
        const name = cleanText(company?.name) || "Company";
        const initials =
          name
            .split(/\s+/)
            .slice(0, 2)
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase() || "CP";
        const logoUrl = getSafeMediaUrl(company?.logoUrl);

        return (
          <div
            key={company?._id || company?.id || company?.slug || index}
            className={`absolute z-20 grid size-11 place-items-center overflow-hidden rounded-full border-4 border-white/90 bg-white/95 text-[11px] font-black text-brand-700 shadow-lg transition duration-500 hover:scale-110 sm:size-12 [body.public-theme-active[data-public-theme='dark']_&]:border-[#0b1626] [body.public-theme-active[data-public-theme='dark']_&]:bg-[#07111f] ${positions[index]}`}
            title={name}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-contain p-1"
              />
            ) : (
              initials
            )}
          </div>
        );
      })}
    </div>
  );
}

function ClientsPartnersLoadingState() {
  return (
    <>
      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(219,234,254,0.38),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#f5f7fb_52%,#f8fafc_100%)] [body.public-theme-active[data-public-theme='dark']_&]:bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.10),transparent_34%),linear-gradient(180deg,#07111f_0%,#08111d_48%,#060d18_100%)]"
      >
        <Container>
          <div className="py-8 sm:py-10">
            <div className="h-72 animate-pulse rounded-[2rem] bg-white shadow-sm" />

            <div className="mt-5 rounded-[2rem] bg-white p-6 shadow-sm">
              <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="h-64 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
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
        className="grid min-h-[calc(100vh-5rem)] place-items-center overflow-x-hidden bg-[linear-gradient(180deg,#f8fbff,#f5f7fb)] px-4 py-12 [body.public-theme-active[data-public-theme='dark']_&]:bg-[linear-gradient(180deg,#07111f,#060d18)]"
      >
        <div className="w-full max-w-xl rounded-3xl border border-slate-200/60 bg-white/92 p-8 text-center shadow-sm sm:p-10 [body.public-theme-active[data-public-theme='dark']_&]:border-white/8 [body.public-theme-active[data-public-theme='dark']_&]:bg-[#0b1626]">
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
  const [industryFilter, setIndustryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    companies: loadedCompanies,
    isLoading,
    error,
    refreshCompanies,
  } = useCompanies({ status: "active" });

  const { settings } = useSiteSettings();

  const brandName = cleanText(settings?.brand?.name) || "RakeshNexify";
  const sectionContent = settings?.clientsPartnersSection || {};

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

  const industries = useMemo(
    () =>
      Array.from(
        new Set(
          clientsPartners
            .map((company) => cleanText(company?.industry))
            .filter(Boolean),
        ),
      ).sort((first, second) =>
        first.localeCompare(second, undefined, { sensitivity: "base" }),
      ),
    [clientsPartners],
  );

  const filteredCompanies = useMemo(() => {
    const normalizedSearch = cleanText(searchQuery).toLowerCase();

    return clientsPartners.filter((company) => {
      const relationship = cleanText(company?.relationship).toLowerCase();

      if (activeFilter !== "all" && relationship !== activeFilter) {
        return false;
      }

      const industry = cleanText(company?.industry);

      if (
        industryFilter !== "all" &&
        industry.toLowerCase() !== industryFilter.toLowerCase()
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        company?.name,
        company?.industry,
        company?.shortDescription,
        company?.tagline,
        company?.role,
        ...(Array.isArray(company?.services) ? company.services : []),
      ]
        .map(cleanText)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [activeFilter, clientsPartners, industryFilter, searchQuery]);

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
      headline: defaultPageContent.heading,
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
  }, [brandName, clientsPartners, description, seoTitle]);

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
        className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(219,234,254,0.38),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#f5f7fb_52%,#f8fafc_100%)] [body.public-theme-active[data-public-theme='dark']_&]:bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.10),transparent_34%),linear-gradient(180deg,#07111f_0%,#08111d_48%,#060d18_100%)]"
      >
        <Container>
          <div className="py-7 sm:py-10">
            <section className="public-clients-partners-page-hero relative isolate overflow-hidden rounded-[1.85rem] border border-slate-200/45 bg-white/80 px-5 py-6 shadow-[0_20px_64px_rgba(30,64,175,0.08)] backdrop-blur-xl sm:px-8 sm:py-8 lg:px-10 lg:py-9 [body.public-theme-active[data-public-theme='dark']_&]:border-white/6 [body.public-theme-active[data-public-theme='dark']_&]:bg-[#091422]/90 [body.public-theme-active[data-public-theme='dark']_&]:shadow-[0_24px_80px_rgba(2,8,23,0.46)]">
              <div
                aria-hidden="true"
                className="absolute -right-16 -top-20 size-56 rounded-full bg-brand-100/45 blur-3xl animate-pulse [animation-duration:7s] motion-reduce:animate-none [body.public-theme-active[data-public-theme='dark']_&]:bg-cyan-400/8"
              />

              <div
                aria-hidden="true"
                className="absolute -bottom-20 -left-20 size-56 rounded-full bg-indigo-100/35 blur-3xl animate-pulse [animation-delay:1.2s] [animation-duration:8s] motion-reduce:animate-none [body.public-theme-active[data-public-theme='dark']_&]:bg-blue-500/7"
              />

              <div
                aria-hidden="true"
                className="absolute left-[9%] top-[15%] h-px w-24 bg-gradient-to-r from-transparent via-brand-400/40 to-transparent sm:w-40 [body.public-theme-active[data-public-theme='dark']_&]:via-cyan-300/28"
              />

              <div className="relative grid gap-7 lg:grid-cols-[1fr_0.84fr] lg:items-center">
                <div>
                  <div aria-hidden="true" className="mb-4 flex items-center gap-2">
                    <span className="size-2 rounded-full bg-brand-500 shadow-[0_0_0_6px_rgba(59,130,246,0.10)] animate-pulse motion-reduce:animate-none [body.public-theme-active[data-public-theme='dark']_&]:bg-cyan-300 [body.public-theme-active[data-public-theme='dark']_&]:shadow-[0_0_0_6px_rgba(103,232,249,0.08)]" />
                    <span className="h-px w-16 bg-gradient-to-r from-brand-500/80 to-transparent [body.public-theme-active[data-public-theme='dark']_&]:from-cyan-300/60" />
                  </div>

                  <h1 className="text-[2.45rem] font-black tracking-[-0.04em] text-slate-950 sm:text-[3rem] lg:text-[3.35rem] lg:leading-[1.02] [body.public-theme-active[data-public-theme='dark']_&]:text-white">
                    {defaultPageContent.heading}
                  </h1>

                  <div className="relative mt-4 h-1 w-16 overflow-hidden rounded-full bg-brand-100 [body.public-theme-active[data-public-theme='dark']_&]:bg-white/8">
                    <span className="absolute inset-y-0 left-0 w-12 rounded-full bg-gradient-to-r from-brand-600 via-violet-500 to-cyan-400 shadow-[0_0_18px_rgba(59,130,246,0.38)]" />
                  </div>

                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-[15px] sm:leading-7 [body.public-theme-active[data-public-theme='dark']_&]:text-slate-300">
                    {description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2.5">
                    <span className="rounded-full border border-brand-100/65 bg-white/70 px-4 py-2.5 text-xs font-bold text-brand-700 shadow-[0_8px_24px_rgba(37,99,235,0.07)] backdrop-blur [body.public-theme-active[data-public-theme='dark']_&]:border-blue-400/15 [body.public-theme-active[data-public-theme='dark']_&]:bg-blue-500/8 [body.public-theme-active[data-public-theme='dark']_&]:text-blue-300">
                      {clientCount} {clientCount === 1 ? "Client" : "Clients"}
                    </span>
                    <span className="rounded-full border border-emerald-100/65 bg-white/70 px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-[0_8px_24px_rgba(16,185,129,0.07)] backdrop-blur [body.public-theme-active[data-public-theme='dark']_&]:border-emerald-400/15 [body.public-theme-active[data-public-theme='dark']_&]:bg-emerald-400/8 [body.public-theme-active[data-public-theme='dark']_&]:text-emerald-300">
                      {partnerCount} {partnerCount === 1 ? "Partner" : "Partners"}
                    </span>
                  </div>
                </div>

                <GlobeVisual
                  count={clientsPartners.length}
                  companies={clientsPartners}
                />
              </div>
            </section>

            <section className="public-clients-partners-page-content mt-5 overflow-hidden rounded-[2rem] border border-slate-200/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,250,255,0.90))] p-4 shadow-[0_22px_70px_rgba(30,64,175,0.07)] backdrop-blur-xl sm:p-6 lg:p-7 [body.public-theme-active[data-public-theme='dark']_&]:border-white/7 [body.public-theme-active[data-public-theme='dark']_&]:bg-[linear-gradient(180deg,rgba(9,20,35,0.97),rgba(7,16,29,0.97))] [body.public-theme-active[data-public-theme='dark']_&]:shadow-[0_26px_80px_rgba(2,8,23,0.42)]">
              <div className="public-clients-partners-filterbar flex flex-col gap-4 rounded-2xl border border-slate-200/40 bg-white/76 p-3.5 shadow-[0_10px_30px_rgba(30,64,175,0.04)] backdrop-blur lg:flex-row lg:items-center lg:justify-between [body.public-theme-active[data-public-theme='dark']_&]:border-sky-300/10 [body.public-theme-active[data-public-theme='dark']_&]:bg-[#0b1727]/88 [body.public-theme-active[data-public-theme='dark']_&]:shadow-[0_16px_38px_rgba(2,8,23,0.28)]">
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    role="group"
                    aria-label="Relationship filters"
                    className="flex flex-wrap gap-2"
                  >
                    {filterOptions.map((option) => {
                      const isActive = activeFilter === option.key;

                      return (
                        <button
                          key={option.key}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => setActiveFilter(option.key)}
                          className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                            isActive
                              ? "bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white shadow-[0_8px_22px_rgba(14,165,233,0.22)]"
                              : "border border-slate-200/70 bg-slate-50/75 text-slate-700 hover:border-sky-300/70 hover:bg-sky-50/70 hover:text-sky-700 [body.public-theme-active[data-public-theme='dark']_&]:border-sky-300/12 [body.public-theme-active[data-public-theme='dark']_&]:bg-[#091523] [body.public-theme-active[data-public-theme='dark']_&]:text-slate-300 [body.public-theme-active[data-public-theme='dark']_&]:hover:border-cyan-300/24 [body.public-theme-active[data-public-theme='dark']_&]:hover:bg-cyan-400/[0.055] [body.public-theme-active[data-public-theme='dark']_&]:hover:text-cyan-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  <span
                    aria-hidden="true"
                    className="mx-1 hidden h-8 w-px bg-slate-200/80 sm:block [body.public-theme-active[data-public-theme='dark']_&]:bg-sky-300/10"
                  />

                  <label className="relative">
                    <span className="sr-only">Filter by industry</span>
                    <select
                      value={industryFilter}
                      onChange={(event) => setIndustryFilter(event.target.value)}
                      className="min-h-10 appearance-none rounded-xl border border-slate-200/70 bg-slate-50/80 py-2 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 [body.public-theme-active[data-public-theme='dark']_&]:border-sky-300/12 [body.public-theme-active[data-public-theme='dark']_&]:bg-[#091523] [body.public-theme-active[data-public-theme='dark']_&]:text-slate-200 [body.public-theme-active[data-public-theme='dark']_&]:focus:border-cyan-300/30 [body.public-theme-active[data-public-theme='dark']_&]:focus:ring-cyan-400/8"
                    >
                      <option value="all">All Industries</option>
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>

                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 [body.public-theme-active[data-public-theme='dark']_&]:text-slate-500"
                    >
                      ⌄
                    </span>
                  </label>
                </div>

                <label className="relative w-full lg:max-w-xs">
                  <span className="sr-only">Search companies</span>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search company..."
                    className="min-h-11 w-full rounded-xl border border-slate-200/70 bg-slate-50/80 py-2 pl-4 pr-11 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 [body.public-theme-active[data-public-theme='dark']_&]:border-sky-300/12 [body.public-theme-active[data-public-theme='dark']_&]:bg-[#091523] [body.public-theme-active[data-public-theme='dark']_&]:text-slate-100 [body.public-theme-active[data-public-theme='dark']_&]:placeholder:text-slate-500 [body.public-theme-active[data-public-theme='dark']_&]:focus:border-cyan-300/30 [body.public-theme-active[data-public-theme='dark']_&]:focus:ring-cyan-400/8"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 [body.public-theme-active[data-public-theme='dark']_&]:text-slate-400"
                  >
                    <SearchIcon />
                  </span>
                </label>
              </div>

              {error && clientsPartners.length > 0 && (
                <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-amber-800">
                    Existing client and partner information is being shown, but
                    the latest refresh failed.
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
                <div className="px-6 py-14 text-center">
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-xl font-black text-brand-600">
                    0
                  </div>
                  <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
                    No public clients or partners available
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
                    Published client and partner relationships will appear here
                    after they are managed from Admin.
                  </p>
                </div>
              ) : filteredCompanies.length > 0 ? (
                <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-2">
                  {filteredCompanies.map((company) => (
                    <ClientPartnerCard
                      key={company._id || company.id || company.slug}
                      company={company}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-6 py-14 text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                    No matching companies found
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Try a different relationship, industry or search term.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveFilter("all");
                      setIndustryFilter("all");
                      setSearchQuery("");
                    }}
                    className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-300 px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {clientsPartners.length > 0 && (
                <div className="mt-6 grid gap-3 border-t border-slate-200/60 pt-5 sm:grid-cols-2 lg:grid-cols-4 [body.public-theme-active[data-public-theme='dark']_&]:border-white/7">
                  {trustItems.map((item, index) => {
                    const toneClasses = [
                      "bg-violet-50 text-violet-600 [body.public-theme-active[data-public-theme='dark']_&]:bg-violet-400/10 [body.public-theme-active[data-public-theme='dark']_&]:text-violet-300",
                      "bg-emerald-50 text-emerald-600 [body.public-theme-active[data-public-theme='dark']_&]:bg-emerald-400/10 [body.public-theme-active[data-public-theme='dark']_&]:text-emerald-300",
                      "bg-blue-50 text-blue-600 [body.public-theme-active[data-public-theme='dark']_&]:bg-blue-400/10 [body.public-theme-active[data-public-theme='dark']_&]:text-blue-300",
                      "bg-orange-50 text-orange-600 [body.public-theme-active[data-public-theme='dark']_&]:bg-orange-400/10 [body.public-theme-active[data-public-theme='dark']_&]:text-orange-300",
                    ];

                    return (
                      <div
                        key={item.title}
                        className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200/35 bg-white/55 p-3.5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200/55 hover:bg-white/80 [body.public-theme-active[data-public-theme='dark']_&]:border-white/6 [body.public-theme-active[data-public-theme='dark']_&]:bg-white/[0.025] [body.public-theme-active[data-public-theme='dark']_&]:hover:border-cyan-300/14 [body.public-theme-active[data-public-theme='dark']_&]:hover:bg-white/[0.04]"
                      >
                        <div
                          className={`grid size-11 shrink-0 place-items-center rounded-2xl shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${toneClasses[index]}`}
                        >
                          <TrustIcon name={item.icon} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-slate-950 [body.public-theme-active[data-public-theme='dark']_&]:text-slate-100">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-slate-500 [body.public-theme-active[data-public-theme='dark']_&]:text-slate-400">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </Container>

        <PublicPageCTA ctaKey="clientsPartners" />
      </main>

      <Footer />
    </>
  );
}

export default ClientsPartnersPage;
