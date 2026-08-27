import { useMemo } from "react";
import Container from "../layout/Container";
import Section from "../layout/Section";
import useCompanies from "../../hooks/useCompanies";
import useSiteSettings from "../../hooks/useSiteSettings";

import PublicSectionEyebrow from "../layout/PublicSectionEyebrow";
import PublicCTAButton from "../layout/PublicCTAButton";
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

function createInitials(name) {
  const initials = cleanText(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "CP";
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

const COMPANY_CLIENTS_PARTNERS_URL =
  "https://idomere.com/clients-partners";

function ClientsPartnersSection() {
  const { companies, isLoading, error, refreshCompanies } = useCompanies();
  const { settings } = useSiteSettings();

  const sectionContent = settings?.clientsPartnersSection || {};
  const registryItem = findSection(settings?.sections, "clients-partners");

  const eyebrow =
    cleanText(sectionContent.eyebrow);

  const heading =
    cleanText(sectionContent.heading);

  const description =
    cleanText(sectionContent.description);

  const ctaButton = sectionContent.ctaButton || sectionContent.action || {};

  const ctaLabel =
    cleanText(ctaButton.label);

  const configuredCtaUrl = getSafePublicUrl(
    ctaButton.url || ctaButton.href,
    COMPANY_CLIENTS_PARTNERS_URL,
  );

  const ctaUrl =
    configuredCtaUrl === "/clients-partners"
      ? COMPANY_CLIENTS_PARTNERS_URL
      : configuredCtaUrl;

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
      className="rnx-home-clients-section scroll-mt-20 border-t border-slate-200/60"
    >
      <Container>
        <div className="rnx-home-clients-shell">
          <div className="rnx-home-clients-panel">
            <div className="rnx-home-clients-hero">
              <div className="rnx-home-clients-heading">
                <PublicSectionEyebrow eyebrow={eyebrow} />
                <h2 className="rnx-home-clients-title">{heading}</h2>
                <p className="rnx-home-clients-description">{description}</p>


          </div>

              {!isLoading && !error && clientsPartners.length > 0 && (
                <div className="rnx-home-clients-counts">
                  <span className="rnx-home-clients-count rnx-home-clients-count--client">
                    {clientCount} {clientCount === 1 ? "Client" : "Clients"}
                  </span>

                  <span className="rnx-home-clients-count rnx-home-clients-count--partner">
                    {partnerCount} {partnerCount === 1 ? "Partner" : "Partners"}
                  </span>
                </div>
              )}
            </div>

            <p aria-live="polite" className="sr-only">
              {isLoading
                ? "Loading clients and partners."
                : `${clientsPartners.length} clients and partners loaded.`}
            </p>

            {error && (
              <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-red-200 bg-red-50/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
              <div className="rnx-home-clients-cards" aria-hidden="true">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="rnx-home-clients-card rnx-home-clients-card--loading"
                  />
                ))}
              </div>
            )}

            {!isLoading && !error && clientsPartners.length === 0 && (
              <div className="mt-10 rounded-3xl border border-slate-200/80 bg-white/80 px-6 py-12 text-center shadow-sm backdrop-blur">
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
              <div className="rnx-home-clients-cards" role="list">
                {previewCompanies.map((company) => {
                  const companyId = company?._id || company?.id || company?.slug;
                  const name = cleanText(company?.name) || "Company";
                  const logoUrl = getSafeMediaUrl(company?.logoUrl);

                  return (
                    <article
                      key={companyId}
                      role="listitem"
                      className="rnx-home-clients-card"
                    >
                      <div className="rnx-home-clients-card-shine" />

                      <div className="rnx-home-clients-card-logo">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={`${name} logo`}
                            loading="lazy"
                            decoding="async"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="rnx-home-clients-card-initials">
                            {createInitials(name)}
                          </span>
                        )}
                      </div>

                      <h3 className="rnx-home-clients-card-name">{name}</h3>
                    </article>
                  );
                })}
              </div>
            )}

            {previewCompanies.length > 0 && showCta && (
              <div className="rnx-home-clients-cta-wrap">
                <PublicCTAButton
                  url={ctaUrl}
                  label={ctaLabel}
                />
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default ClientsPartnersSection;
