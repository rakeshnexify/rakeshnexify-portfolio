import { useEffect } from "react";
import { Link, useParams } from "react-router";

import Container from "../components/layout/Container";
import useCompany from "../hooks/useCompany";

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
    .filter(Boolean)
    .join(", ");
}

function CompanyLink({ href, children, variant = "primary" }) {
  if (!href) {
    return null;
  }

  const baseClasses =
    "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition";

  const variantClasses = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",

    secondary: "bg-slate-950 text-white hover:bg-slate-800",

    outline:
      "border border-slate-300 bg-white text-slate-700 hover:border-brand-600 hover:text-brand-600",
  };

  const className = `${baseClasses} ${
    variantClasses[variant] || variantClasses.primary
  }`;

  const isExternalLink = /^https?:\/\//i.test(href);

  if (!isExternalLink) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}

      <span aria-hidden="true" className="ml-2">
        ↗
      </span>
    </a>
  );
}

function DetailList({ title, items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-bold tracking-tight text-slate-950">
        {title}
      </h2>

      <ul className="mt-6 grid gap-4">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}-${item}`}
            className="flex items-start gap-3 leading-7 text-slate-600"
          >
            <span className="mt-2.5 size-2 shrink-0 rounded-full bg-brand-600" />

            <span>{item}</span>
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

      <dd className="mt-2 text-sm font-semibold leading-6 text-slate-700">
        {children}
      </dd>
    </div>
  );
}

function CompanyLoadingState() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <Container>
          <div className="flex min-h-20 items-center">
            <Link to="/" className="font-extrabold text-slate-950">
              RakeshNexify
            </Link>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-16">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-6 h-14 max-w-3xl animate-pulse rounded-xl bg-slate-200" />

          <div className="mt-5 h-24 max-w-2xl animate-pulse rounded-xl bg-slate-200" />

          <div className="mt-10 h-96 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      </Container>
    </main>
  );
}

function CompanyErrorState({ error, status, onRetry }) {
  const isNotFound = status === 404;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
          !
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
          {isNotFound ? "Company Not Found" : "Company Error"}
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          {isNotFound
            ? "This company is unavailable"
            : "Company could not be loaded"}
        </h1>

        <p className="mt-4 leading-7 text-slate-600">
          {isNotFound
            ? "The company may be hidden, deleted or the company URL may be incorrect."
            : error}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {!isNotFound && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Retry
            </button>
          )}

          <Link
            to="/#companies"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
          >
            Return to companies
          </Link>
        </div>
      </div>
    </main>
  );
}

function CompanyDetailsPage() {
  const { slug } = useParams();

  const { company, isLoading, error, status, refreshCompany } =
    useCompany(slug);

  useEffect(() => {
    const previousTitle = document.title;

    if (company?.seo?.title) {
      document.title = company.seo.title;
    } else if (company?.name) {
      document.title = `${company.name} | RakeshNexify`;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [company]);

  if (isLoading) {
    return <CompanyLoadingState />;
  }

  if (error || !company) {
    return (
      <CompanyErrorState
        error={error}
        status={status}
        onRetry={refreshCompany}
      />
    );
  }

  const businessAreas = Array.isArray(company.businessAreas)
    ? company.businessAreas
    : [];

  const services = Array.isArray(company.services) ? company.services : [];

  const highlights = Array.isArray(company.highlights)
    ? company.highlights
    : [];

  const statistics = Array.isArray(company.statistics)
    ? company.statistics.filter(
        (statistic) => statistic?.label && statistic?.value,
      )
    : [];

  const contact = company.contact || {};

  const socialLinks = company.socialLinks || {};

  const availableSocialLinks = socialPlatforms.filter(
    (platform) => socialLinks[platform.key],
  );

  const location = formatLocation(contact);

  const relationshipLabel =
    relationshipLabels[company.relationship] ||
    company.relationship ||
    "Company";

  const statusLabel =
    statusLabels[company.status] || company.status || "Company";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <Container>
          <div className="flex min-h-20 items-center justify-between gap-5">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-brand-600 font-extrabold text-white">
                RN
              </div>

              <div>
                <p className="font-extrabold text-slate-950">RakeshNexify</p>

                <p className="text-xs font-medium text-slate-500">
                  Company Profile
                </p>
              </div>
            </Link>

            <Link
              to="/#companies"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
            >
              ← All Companies
            </Link>
          </div>
        </Container>
      </header>

      <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
        {company.coverImageUrl && (
          <img
            src={company.coverImageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-20"
          />
        )}

        {company.coverImageUrl && (
          <div className="absolute inset-0 bg-slate-950/80" />
        )}

        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl" />

        <div className="absolute -bottom-40 left-10 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <Container>
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
                  {company.industry || "Business"}
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
                  {relationshipLabel}
                </span>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
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

              <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                Company Profile
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {company.name}
              </h1>

              {company.legalName && company.legalName !== company.name && (
                <p className="mt-3 text-base font-semibold text-slate-400">
                  {company.legalName}
                </p>
              )}

              {company.tagline && (
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                  {company.tagline}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <CompanyLink href={company.websiteUrl}>
                  Visit Official Website
                </CompanyLink>

                <CompanyLink href="/#contact" variant="outline">
                  Discuss a Partnership
                </CompanyLink>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl">
              {company.logoUrl ? (
                <div className="grid aspect-[16/10] place-items-center rounded-2xl bg-white p-8">
                  <img
                    src={company.logoUrl}
                    alt={`${company.name} logo`}
                    className="max-h-52 max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="grid aspect-[16/10] place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-600/30 via-slate-900 to-cyan-500/20">
                  <div className="text-center">
                    <div className="mx-auto grid size-24 place-items-center rounded-3xl border border-white/10 bg-white/10 text-3xl font-black text-white">
                      {createInitials(company.name)}
                    </div>

                    <p className="mt-5 font-bold text-white">{company.name}</p>

                    <p className="mt-2 text-sm text-slate-400">
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
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="space-y-8">
              {company.description && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
                    Company Overview
                  </p>

                  <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                    About this company
                  </h2>

                  <p className="mt-6 whitespace-pre-line text-base leading-8 text-slate-600">
                    {company.description}
                  </p>
                </section>
              )}

              <DetailList title="Business Areas" items={businessAreas} />

              <DetailList title="Products and Services" items={services} />

              <DetailList title="Company Highlights" items={highlights} />

              {statistics.length > 0 && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                    Company Statistics
                  </h2>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {statistics.map((statistic, index) => (
                      <div
                        key={statistic._id || `${statistic.label}-${index}`}
                        className="rounded-2xl border border-brand-100 bg-brand-50 p-5"
                      >
                        <p className="text-2xl font-black text-brand-700">
                          {statistic.value}
                        </p>

                        <p className="mt-2 text-sm font-semibold text-slate-600">
                          {statistic.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">
                  Company Information
                </h2>

                <dl className="mt-6 divide-y divide-slate-100">
                  <InformationItem label="Legal Name">
                    {company.legalName}
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

              {(contact.email || contact.phone || location) && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-950">
                    Contact Information
                  </h2>

                  <div className="mt-5 grid gap-3">
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
                      >
                        {contact.email}
                      </a>
                    )}

                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
                      >
                        {contact.phone}
                      </a>
                    )}

                    {location && (
                      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                        {location}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {availableSocialLinks.length > 0 && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-950">
                    Social Links
                  </h2>

                  <div className="mt-5 grid gap-3">
                    {availableSocialLinks.map((platform) => (
                      <CompanyLink
                        key={platform.key}
                        href={socialLinks[platform.key]}
                        variant="outline"
                      >
                        {platform.label}
                      </CompanyLink>
                    ))}
                  </div>
                </section>
              )}

              {company.websiteUrl && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-950">
                    Official Website
                  </h2>

                  <p className="mt-3 break-words text-sm leading-6 text-slate-500">
                    {company.websiteUrl}
                  </p>

                  <div className="mt-5">
                    <CompanyLink href={company.websiteUrl}>
                      Open Website
                    </CompanyLink>
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
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
              Business Collaboration
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
              Need an e-commerce platform or professional business website?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">
              Let us discuss your business goals, required features and the best
              digital solution for long-term growth.
            </p>

            <Link
              to="/#contact"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Discuss Your Business
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default CompanyDetailsPage;
