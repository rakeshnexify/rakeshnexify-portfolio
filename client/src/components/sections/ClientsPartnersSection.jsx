import { useMemo } from "react";
import { Link } from "react-router";

import ClientPartnerCard from "../companies/ClientPartnerCard";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import useCompanies from "../../hooks/useCompanies";
import useSiteSettings from "../../hooks/useSiteSettings";

const defaultSectionContent = {
  eyebrow: "Clients & Partners",
  heading: "Trusted clients and business partners",
  description:
    "Companies and organizations I have worked with, supported or partnered with.",
  ctaButton: {
    label: "View All Clients & Partners",
    url: "/clients-partners",
  },
};

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

function getSafePublicUrl(value, fallback = "/clients-partners") {
  const url = cleanText(value);

  if (!url || containsControlCharacters(url)) {
    return fallback;
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
      parsedUrl.hostname &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return url;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function findSection(sections, key) {
  if (!Array.isArray(sections)) {
    return null;
  }

  const normalizedKey = cleanText(key).toLowerCase();

  return (
    sections.find(
      (sectionItem) =>
        cleanText(sectionItem?.key).toLowerCase() === normalizedKey,
    ) || null
  );
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

function DynamicActionLink({ url, children, className }) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
        <span className="sr-only"> opens in a new tab</span>
      </a>
    );
  }

  if (url.startsWith("/")) {
    return (
      <Link to={url} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={url} className={className}>
      {children}
    </a>
  );
}

function ClientsPartnersSection() {
  const { companies, isLoading, error, refreshCompanies } = useCompanies();

  const { settings } = useSiteSettings();

  const sectionContent = settings?.clientsPartnersSection || {};
  const registryItem = findSection(settings?.sections, "clients-partners");

  const eyebrow =
    cleanText(sectionContent.eyebrow) || defaultSectionContent.eyebrow;

  const heading =
    cleanText(sectionContent.heading || sectionContent.title) ||
    defaultSectionContent.heading;

  const description =
    cleanText(sectionContent.description) || defaultSectionContent.description;

  const ctaButton = sectionContent.ctaButton || sectionContent.action || {};

  const ctaLabel =
    cleanText(ctaButton.label) || defaultSectionContent.ctaButton.label;

  const ctaUrl = getSafePublicUrl(
    ctaButton.url || ctaButton.href,
    defaultSectionContent.ctaButton.url,
  );

  const clientsPartners = useMemo(() => {
    const sourceCompanies = Array.isArray(companies) ? companies : [];

    return sourceCompanies
      .filter((company) =>
        ["client", "partner"].includes(
          cleanText(company?.relationship).toLowerCase(),
        ),
      )
      .sort(sortClientsPartners);
  }, [companies]);

  const previewCompanies = clientsPartners.slice(0, 6);

  const clientCount = clientsPartners.filter(
    (company) => cleanText(company?.relationship).toLowerCase() === "client",
  ).length;

  const partnerCount = clientsPartners.filter(
    (company) => cleanText(company?.relationship).toLowerCase() === "partner",
  ).length;

  const pageIsVisible = registryItem?.isPageVisible !== false;

  const ctaTargetsDedicatedPage =
    ctaUrl === "/clients-partners" ||
    ctaUrl.startsWith("/clients-partners?") ||
    ctaUrl.startsWith("/clients-partners#");

  const showCta =
    Boolean(ctaLabel && ctaUrl) &&
    !(ctaTargetsDedicatedPage && !pageIsVisible);

  return (
    <Section
      id="clients-partners"
      className="scroll-mt-20 border-t border-slate-200 bg-white"
    >
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={heading}
          description={description}
        />

        <p aria-live="polite" className="sr-only">
          {isLoading
            ? "Loading clients and partners."
            : `${clientsPartners.length} clients and partners loaded.`}
        </p>

        {!isLoading && !error && clientsPartners.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              {clientCount} {clientCount === 1 ? "Client" : "Clients"}
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              {partnerCount} {partnerCount === 1 ? "Partner" : "Partners"}
            </span>
          </div>
        )}

        {error && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-red-800">
                Clients and partners could not be loaded
              </p>

              <p className="mt-1 break-words text-sm leading-6 text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={refreshCompanies}
              disabled={isLoading}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {isLoading && clientsPartners.length === 0 && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-3xl bg-slate-100"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && clientsPartners.length === 0 && (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <p className="text-lg font-bold text-slate-950">
              No public clients or partners available
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Companies marked as Client Company or Business Partner will appear
              here after they are published from Companies Management.
            </p>
          </div>
        )}

        {previewCompanies.length > 0 && (
          <div className="mt-10 grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {previewCompanies.map((company) => (
              <ClientPartnerCard
                key={company._id || company.id || company.slug}
                company={company}
              />
            ))}
          </div>
        )}

        {previewCompanies.length > 0 && showCta && (
          <div className="mt-8 flex justify-center">
            <DynamicActionLink
              url={ctaUrl}
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {ctaLabel} →
            </DynamicActionLink>
          </div>
        )}
      </Container>
    </Section>
  );
}

export default ClientsPartnersSection;
