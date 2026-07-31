import { useMemo } from "react";
import { Link } from "react-router";

import CompanyCard from "../companies/CompanyCard";
import Container from "../layout/Container";
import ResponsiveCardRow from "../layout/ResponsiveCardRow";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import siteData from "../../data/siteData";
import useCompanies from "../../hooks/useCompanies";
import useSiteSettings from "../../hooks/useSiteSettings";

const defaultSectionContent = {
  eyebrow: "My Companies",

  heading: "Businesses and digital ventures built for long-term growth",

  description:
    "Explore the registered companies, e-commerce businesses and digital ventures that I own, manage or develop.",

  ctaButton: {
    label: "View All Companies",
    url: "/companies",
  },
};

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const characterCode = text.charCodeAt(index);

    if (characterCode <= 31 || characterCode === 127) {
      return true;
    }
  }

  return false;
}

function getSafePublicUrl(value, fallbackUrl = "/companies") {
  const url = String(value || "").trim();

  if (!url || containsControlCharacters(url)) {
    return fallbackUrl;
  }

  if (/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(url)) {
    return url;
  }

  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return url;
    }
  } catch {
    return fallbackUrl;
  }

  return fallbackUrl;
}

function sortCompaniesForPreview(firstCompany, secondCompany) {
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

function DynamicActionLink({ url, children, className = "" }) {
  const safeUrl = getSafePublicUrl(url);

  if (safeUrl.startsWith("http://") || safeUrl.startsWith("https://")) {
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  if (safeUrl.startsWith("/")) {
    return (
      <Link to={safeUrl} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={safeUrl} className={className}>
      {children}
    </a>
  );
}

function CompaniesSection() {
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

  const sectionContent = settings?.companiesSection || {};

  const eyebrow =
    String(sectionContent.eyebrow || "").trim() ||
    defaultSectionContent.eyebrow;

  const heading =
    String(sectionContent.heading || sectionContent.title || "").trim() ||
    defaultSectionContent.heading;

  const description =
    String(sectionContent.description || "").trim() ||
    defaultSectionContent.description;

  const ctaButton = sectionContent.ctaButton || sectionContent.action || {};

  const ctaLabel =
    String(ctaButton.label || "").trim() ||
    defaultSectionContent.ctaButton.label;

  const ctaUrl = getSafePublicUrl(
    ctaButton.url || ctaButton.href,
    defaultSectionContent.ctaButton.url,
  );

  const companies = useMemo(() => {
    const sourceCompanies = Array.isArray(loadedCompanies)
      ? loadedCompanies
      : [];

    return [...sourceCompanies].sort(sortCompaniesForPreview);
  }, [loadedCompanies]);

  const previewCompanies = companies.slice(0, 2);

  return (
    <Section
      id="companies"
      className="scroll-mt-20 border-t border-slate-200 bg-slate-50"
    >
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={heading}
          description={description}
        />

        <p aria-live="polite" className="sr-only">
          {isLoading
            ? "Loading companies."
            : `${companies.length} companies loaded.`}
        </p>

        {error && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-800">
                Saved company information is being displayed
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                The live Companies API could not be reached.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshCompanies}
              disabled={isLoading}
              className="inline-flex min-h-10 max-w-full shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-center text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Retrying..." : "Retry Companies"}
            </button>
          </div>
        )}

        {isLoading && companies.length === 0 && (
          <div className="mt-10 grid min-w-0 gap-7 [&>*]:min-w-0 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-[32rem] animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {!isLoading && companies.length === 0 && (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-lg font-bold text-slate-950">
              No public companies available
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Company information will appear here after it is published.
            </p>
          </div>
        )}

        {previewCompanies.length > 0 && (
          <ResponsiveCardRow
            desktopColumns={2}
            ariaLabel="Featured companies"
            className="mt-10"
          >
            {previewCompanies.map((company, index) => (
              <CompanyCard
                key={
                  company._id ||
                  company.id ||
                  company.slug ||
                  `${company.name}-${index}`
                }
                company={company}
                index={index}
                compact
              />
            ))}
          </ResponsiveCardRow>
        )}

        {previewCompanies.length > 0 && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-bold text-slate-950">
                Explore all companies and business ventures
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                The homepage shows selected companies only. Open the complete
                Companies page to view every published business profile.
              </p>
            </div>

            <DynamicActionLink
              url={ctaUrl}
              className="inline-flex min-h-11 max-w-full shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {ctaLabel} →
            </DynamicActionLink>
          </div>
        )}
      </Container>
    </Section>
  );
}

export default CompaniesSection;
