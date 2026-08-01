import { Link, useParams } from "react-router";

import Container from "../components/layout/Container";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import useCompany from "../hooks/useCompany";
import useSiteSettings from "../hooks/useSiteSettings";

const relationshipLabels = {
  owned: "Owned Company",
  managed: "Managed Company",
  partner: "Business Partner",
  client: "Client Company",
  other: "Associated Company",
};

const statusLabels = {
  planned: "Planned",
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};

const statusClasses = {
  planned: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-200 text-slate-700",
  archived: "bg-red-100 text-red-700",
};

const socialPlatforms = [
  {
    key: "facebook",
    label: "Facebook",
  },
  {
    key: "instagram",
    label: "Instagram",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
  },
  {
    key: "youtube",
    label: "YouTube",
  },
  {
    key: "x",
    label: "X",
  },
];

const defaultCompanySeo = {
  description:
    "Explore this company profile, including its business areas, products, services, company information and digital presence.",

  keywords: [
    "company profile",
    "business company",
    "business website",
    "company website development",
    "MERN business application",
    "WordPress business website",
    "custom business platform",
    "digital business",
    "e-commerce business",
    "business development",
  ],
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

function getSafePublicUrl(value) {
  const url = String(value || "").trim();

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

function getSafeHttpUrl(value) {
  const safeUrl = getSafePublicUrl(value);

  if (safeUrl.startsWith("http://") || safeUrl.startsWith("https://")) {
    return safeUrl;
  }

  return "";
}

function getSafeMediaUrl(value) {
  return getSafePublicUrl(value);
}

function getSafeEmail(value) {
  const email = String(value || "").trim();

  if (!email || containsControlCharacters(email) || email.length > 254) {
    return "";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(email) ? email : "";
}

function getSafePhone(value) {
  const phone = String(value || "").trim();

  if (!phone || containsControlCharacters(phone)) {
    return {
      display: "",
      href: "",
    };
  }

  const phoneHref = phone.replace(/[^\d+]/g, "");

  const isValidPhone = /^\+?\d{6,15}$/.test(phoneHref);

  return {
    display: phone,
    href: isValidPhone ? phoneHref : "",
  };
}

function getTextItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (typeof item !== "string" && typeof item !== "number") {
        return "";
      }

      return String(item).trim();
    })
    .filter(Boolean);
}

function getKeywordItems(value) {
  const sourceItems = Array.isArray(value)
    ? value
    : String(value || "").split(/[,\n]/);

  return sourceItems.map((item) => String(item || "").trim()).filter(Boolean);
}

function getStatistics(statistics) {
  if (!Array.isArray(statistics)) {
    return [];
  }

  return statistics
    .map((statistic) => ({
      ...statistic,

      label: String(statistic?.label || "").trim(),

      value: String(statistic?.value || "").trim(),
    }))
    .filter((statistic) => statistic.label && statistic.value);
}

function createInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "CO";
}

function formatLocation(contact = {}) {
  return [contact.address, contact.city, contact.country]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(", ");
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Company could not be loaded.";
}

function CompanyLink({ href, children, variant = "primary" }) {
  const safeHref = getSafePublicUrl(href);

  if (!safeHref) {
    return null;
  }

  const baseClasses =
    "inline-flex min-h-11 max-w-full items-center justify-center rounded-xl px-5 py-2.5 text-center text-sm font-semibold transition";

  const variantClasses = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",

    secondary: "bg-slate-950 text-white hover:bg-slate-800",

    outline:
      "border border-slate-300 bg-white text-slate-700 hover:border-brand-600 hover:text-brand-600",
  };

  const className = `${baseClasses} ${
    variantClasses[variant] || variantClasses.primary
  }`;

  const isExternalLink =
    safeHref.startsWith("http://") || safeHref.startsWith("https://");

  if (!isExternalLink) {
    return (
      <Link to={safeHref} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}

      <span aria-hidden="true" className="ml-2">
        ↗
      </span>

      <span className="sr-only"> opens in a new tab</span>
    </a>
  );
}

function DetailList({ title, items = [] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="break-words text-2xl font-bold tracking-tight text-slate-950">
        {title}
      </h2>

      <ul className="mt-6 grid gap-4">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}-${item}`}
            className="flex min-w-0 items-start gap-3 leading-7 text-slate-600"
          >
            <span className="mt-2.5 size-2 shrink-0 rounded-full bg-brand-600" />

            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function InformationItem({ label, children }) {
  if (children === undefined || children === null || children === "") {
    return null;
  }

  return (
    <div className="py-4 first:pt-0">
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </dt>

      <dd className="mt-2 break-words text-sm font-semibold leading-6 text-slate-700">
        {children}
      </dd>
    </div>
  );
}

function CompanyLoadingState() {
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

            <div className="mt-10 h-96 animate-pulse rounded-3xl bg-slate-200" />
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}

function CompanyErrorState({ error, status, onRetry, isRetrying }) {
  const isNotFound = status === 404;

  return (
    <>
      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[calc(100vh-5rem)] overflow-x-hidden place-items-center bg-slate-50 px-4 py-12"
      >
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
            !
          </div>

          <p className="mt-6 break-words text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            {isNotFound ? "Company Not Found" : "Company Error"}
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
            {isNotFound
              ? "This company is unavailable"
              : "Company could not be loaded"}
          </h1>

          <p className="mt-4 break-words leading-7 text-slate-600">
            {isNotFound
              ? "The company may be hidden, deleted or the company URL may be incorrect."
              : getErrorMessage(error)}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            {!isNotFound && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isRetrying ? "Retrying..." : "Retry"}
              </button>
            )}

            <Link
              to="/companies"
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-center text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
            >
              View All Companies
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

function CompanyDetailsPage() {
  const { slug } = useParams();

  const { company, isLoading, error, status, refreshCompany } =
    useCompany(slug);

  const { settings } = useSiteSettings();

  const brandName =
    String(settings?.brand?.name || "").trim() || "RakeshNexify";

  const companyName = String(company?.name || "").trim() || "Company";

  const globalSeo =
    settings?.seo && typeof settings.seo === "object" ? settings.seo : {};

  const companySeo =
    company?.seo && typeof company.seo === "object" ? company.seo : {};

  const safeSlug = String(slug || "").trim();

  const canonicalPath = safeSlug
    ? `/companies/${encodeURIComponent(safeSlug)}`
    : "/companies";

  const globalSeoKeywords = getKeywordItems(globalSeo.keywords);

  const companySeoKeywords = getKeywordItems(companySeo.keywords);

  const companyBusinessAreas = getTextItems(company?.businessAreas);

  const companyServices = getTextItems(company?.services);

  const seoTitle =
    String(companySeo.title || "").trim() ||
    (company?.name
      ? `${companyName} | ${brandName}`
      : `Company | ${brandName}`);

  const seoDescription =
    String(
      companySeo.description || company?.tagline || company?.description || "",
    ).trim() || defaultCompanySeo.description;

  const seoKeywords = [
    ...globalSeoKeywords,
    ...companySeoKeywords,
    ...companyBusinessAreas,
    ...companyServices,
    company?.industry,
    company?.name ? `${companyName} company` : "",
    relationshipLabels[company?.relationship],
    ...defaultCompanySeo.keywords,
  ].filter(Boolean);

  const socialSharingImage =
    getSafeMediaUrl(companySeo.ogImageUrl) ||
    getSafeMediaUrl(company?.coverImageUrl) ||
    getSafeMediaUrl(company?.logoUrl) ||
    getSafeMediaUrl(globalSeo.ogImageUrl);

  if (isLoading && !company) {
    return (
      <>
        <PageSeo
          title={`Company | ${brandName}`}
          description={defaultCompanySeo.description}
          keywords={[...globalSeoKeywords, ...defaultCompanySeo.keywords]}
          canonicalPath={canonicalPath}
          image={getSafeMediaUrl(globalSeo.ogImageUrl)}
          type="website"
          brandName={brandName}
        />

        <CompanyLoadingState />
      </>
    );
  }

  if (error || !company) {
    const isNotFound = status === 404;

    return (
      <>
        <PageSeo
          title={
            isNotFound
              ? `Company Not Found | ${brandName}`
              : `Company Error | ${brandName}`
          }
          description={
            isNotFound
              ? "The requested company is unavailable, hidden, deleted or the company URL is incorrect."
              : "The requested company could not be loaded at this time."
          }
          keywords={[...globalSeoKeywords, ...defaultCompanySeo.keywords]}
          canonicalPath={canonicalPath}
          image={getSafeMediaUrl(globalSeo.ogImageUrl)}
          type="website"
          noIndex={isNotFound}
          brandName={brandName}
        />

        <CompanyErrorState
          error={error}
          status={status}
          onRetry={refreshCompany}
          isRetrying={isLoading}
        />
      </>
    );
  }

  const businessAreas = getTextItems(company.businessAreas);

  const services = getTextItems(company.services);

  const highlights = getTextItems(company.highlights);

  const statistics = getStatistics(company.statistics);

  const contact =
    company.contact && typeof company.contact === "object"
      ? company.contact
      : {};

  const socialLinks =
    company.socialLinks && typeof company.socialLinks === "object"
      ? company.socialLinks
      : {};

  const availableSocialLinks = socialPlatforms
    .map((platform) => ({
      ...platform,

      url: getSafeHttpUrl(socialLinks[platform.key]),
    }))
    .filter((platform) => platform.url);

  const location = formatLocation(contact);

  const email = getSafeEmail(contact.email);

  const phone = getSafePhone(contact.phone);

  const websiteUrl = getSafeHttpUrl(company.websiteUrl);

  const coverImageUrl = getSafeMediaUrl(company.coverImageUrl);

  const logoUrl = getSafeMediaUrl(company.logoUrl);

  const legalName = String(company.legalName || "").trim();

  const relationshipLabel =
    relationshipLabels[company.relationship] ||
    String(company.relationship || "").trim() ||
    "Company";

  const statusLabel =
    statusLabels[company.status] ||
    String(company.status || "").trim() ||
    "Company";

  return (
    <>
      <PageSeo
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalPath={canonicalPath}
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
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt=""
              decoding="async"
              className="absolute inset-0 size-full object-cover opacity-20"
            />
          )}

          {coverImageUrl && (
            <div className="absolute inset-0 bg-slate-950/80" />
          )}

          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl" />

          <div className="absolute -bottom-40 left-10 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

          <Container>
            <div className="relative grid min-w-0 gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap gap-2">
                  <span className="max-w-full break-words rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
                    {String(company.industry || "Business")}
                  </span>

                  <span className="max-w-full break-words rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
                    {relationshipLabel}
                  </span>

                  <span
                    className={`max-w-full break-words rounded-full px-3 py-1.5 text-xs font-semibold ${
                      statusClasses[company.status] ||
                      "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {statusLabel}
                  </span>

                  {company.isFeatured && (
                    <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
                      Featured
                    </span>
                  )}
                </div>

                <p className="mt-7 break-words text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                  Company Profile
                </p>

                <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {companyName}
                </h1>

                {legalName && legalName !== companyName && (
                  <p className="mt-3 break-words text-base font-semibold text-slate-400">
                    {legalName}
                  </p>
                )}

                {company.tagline && (
                  <p className="mt-6 max-w-3xl break-words text-lg leading-8 text-slate-300">
                    {company.tagline}
                  </p>
                )}

                <div className="mt-8 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <CompanyLink href={websiteUrl}>
                    Visit Official Website
                  </CompanyLink>

                  <CompanyLink href="/#contact" variant="outline">
                    Discuss a Partnership
                  </CompanyLink>
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl">
                {logoUrl ? (
                  <div className="grid aspect-[16/10] place-items-center rounded-2xl bg-white p-8">
                    <img
                      src={logoUrl}
                      alt={`${companyName} logo`}
                      decoding="async"
                      className="max-h-52 max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="grid aspect-[16/10] place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-600/30 via-slate-900 to-cyan-500/20 p-6">
                    <div className="min-w-0 text-center">
                      <div className="mx-auto grid size-24 place-items-center rounded-3xl border border-white/10 bg-white/10 text-3xl font-black text-white">
                        {createInitials(companyName)}
                      </div>

                      <p className="mt-5 break-words font-bold text-white">
                        {companyName}
                      </p>

                      <p className="mt-2 break-words text-sm text-slate-400">
                        Official company logo will be added soon
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-8">
                {company.description && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <p className="break-words text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
                      Company Overview
                    </p>

                    <h2 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
                      About this company
                    </h2>

                    <p className="mt-6 whitespace-pre-line break-words text-base leading-8 text-slate-600">
                      {company.description}
                    </p>
                  </section>
                )}

                <DetailList title="Business Areas" items={businessAreas} />

                <DetailList title="Products and Services" items={services} />

                <DetailList title="Company Highlights" items={highlights} />

                {statistics.length > 0 && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="break-words text-2xl font-bold tracking-tight text-slate-950">
                      Company Statistics
                    </h2>

                    <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {statistics.map((statistic, index) => (
                        <div
                          key={statistic._id || `${statistic.label}-${index}`}
                          className="min-w-0 rounded-2xl border border-brand-100 bg-brand-50 p-5"
                        >
                          <p className="break-words text-2xl font-black text-brand-700">
                            {statistic.value}
                          </p>

                          <p className="mt-2 break-words text-sm font-semibold text-slate-600">
                            {statistic.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
                <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="break-words text-lg font-bold text-slate-950">
                    Company Information
                  </h2>

                  <dl className="mt-6 divide-y divide-slate-100">
                    <InformationItem label="Legal Name">
                      {legalName}
                    </InformationItem>

                    <InformationItem label="Industry">
                      {company.industry}
                    </InformationItem>

                    <InformationItem label="Relationship">
                      {relationshipLabel}
                    </InformationItem>

                    <InformationItem label="Status">
                      {statusLabel}
                    </InformationItem>

                    <InformationItem label="My Role">
                      {company.role}
                    </InformationItem>

                    <InformationItem label="Founded">
                      {company.foundedYear}
                    </InformationItem>
                  </dl>
                </section>

                {(email || phone.display || location) && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="break-words text-lg font-bold text-slate-950">
                      Contact Information
                    </h2>

                    <div className="mt-5 grid min-w-0 gap-3">
                      {email && (
                        <a
                          href={`mailto:${email}`}
                          className="max-w-full break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
                        >
                          {email}
                        </a>
                      )}

                      {phone.display && phone.href && (
                        <a
                          href={`tel:${phone.href}`}
                          className="max-w-full break-words rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
                        >
                          {phone.display}
                        </a>
                      )}

                      {phone.display && !phone.href && (
                        <p className="max-w-full break-words rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                          {phone.display}
                        </p>
                      )}

                      {location && (
                        <p className="max-w-full break-words rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                          {location}
                        </p>
                      )}
                    </div>
                  </section>
                )}

                {availableSocialLinks.length > 0 && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="break-words text-lg font-bold text-slate-950">
                      Social Links
                    </h2>

                    <div className="mt-5 grid min-w-0 gap-3">
                      {availableSocialLinks.map((platform) => (
                        <CompanyLink
                          key={platform.key}
                          href={platform.url}
                          variant="outline"
                        >
                          {platform.label}
                        </CompanyLink>
                      ))}
                    </div>
                  </section>
                )}

                {websiteUrl && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="break-words text-lg font-bold text-slate-950">
                      Official Website
                    </h2>

                    <p className="mt-3 break-all text-sm leading-6 text-slate-500">
                      {websiteUrl}
                    </p>

                    <div className="mt-5">
                      <CompanyLink href={websiteUrl}>Open Website</CompanyLink>
                    </div>
                  </section>
                )}
              </aside>
            </div>
          </Container>
        </section>

        <section className="border-t border-slate-200 bg-white py-14">
          <Container>
            <div className="rounded-3xl bg-slate-950 px-6 py-10 text-center text-white sm:px-10">
              <p className="break-words text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                Business Collaboration
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl break-words text-3xl font-bold tracking-tight sm:text-4xl">
                Need an e-commerce platform or professional business website?
              </h2>

              <p className="mx-auto mt-5 max-w-2xl break-words leading-7 text-slate-300">
                Let us discuss your business goals, required features and the
                best digital solution for long-term growth.
              </p>

              <Link
                to="/#contact"
                className="mt-7 inline-flex min-h-12 max-w-full items-center justify-center rounded-xl bg-brand-600 px-6 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Discuss Your Business
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default CompanyDetailsPage;
