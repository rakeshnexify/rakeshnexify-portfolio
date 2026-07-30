import { useMemo } from "react";
import { Link } from "react-router";

import siteData from "../../data/siteData";
import useCompanies from "../../hooks/useCompanies";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";

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

function normaliseCompany(company, index) {
  const businessAreas = Array.isArray(company.businessAreas)
    ? company.businessAreas
    : [];

  const services = Array.isArray(company.services) ? company.services : [];

  const highlights = Array.isArray(company.highlights)
    ? company.highlights
    : [];

  const numericOrder = Number(company.order);

  return {
    id: company._id || company.id || company.slug || `company-${index + 1}`,

    name: company.name || "Company",

    slug: company.slug || "",

    legalName: company.legalName || "",

    tagline: company.tagline || "",

    description: company.shortDescription || company.description || "",

    fullDescription: company.description || "",

    industry: company.industry || company.category || "Business",

    relationship: company.relationship || "owned",

    status: company.status || "active",

    role: company.role || "",

    websiteUrl: company.websiteUrl || company.website || "",

    logoUrl: company.logoUrl || "",

    coverImageUrl: company.coverImageUrl || "",

    businessAreas,
    services,
    highlights,

    featured: Boolean(company.isFeatured ?? company.featured),

    order: Number.isFinite(numericOrder) ? numericOrder : index,
  };
}

function WebsiteLink({ href, children }) {
  if (!href) {
    return (
      <span
        aria-disabled="true"
        title="Official website will be added soon"
        className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400"
      >
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
    >
      {children}

      <span aria-hidden="true" className="ml-2">
        ↗
      </span>
    </a>
  );
}

function CompanyCard({ company, index }) {
  const statusLabel =
    statusLabels[company.status] || company.status || "Company";

  const relationshipLabel =
    relationshipLabels[company.relationship] ||
    company.relationship ||
    "Company";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="relative overflow-hidden bg-slate-950 px-6 py-8 sm:px-8">
        {company.coverImageUrl && (
          <img
            src={company.coverImageUrl}
            alt={`${company.name} cover`}
            loading="lazy"
            className="absolute inset-0 size-full object-cover opacity-30 transition duration-500 group-hover:scale-105"
          />
        )}

        {company.coverImageUrl && (
          <div className="absolute inset-0 bg-slate-950/70" />
        )}

        <div className="absolute -right-10 -top-12 size-40 rounded-full bg-brand-600/20 blur-3xl" />

        <div className="absolute -bottom-16 left-10 size-40 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-5">
          {company.logoUrl ? (
            <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white">
              <img
                src={company.logoUrl}
                alt={`${company.name} logo`}
                loading="lazy"
                className="size-full object-contain p-1"
              />
            </div>
          ) : (
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-xl font-extrabold text-white">
              {createInitials(company.name)}
            </div>
          )}

          <span className="text-4xl font-black tracking-tight text-white/10">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="relative mt-10">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
              {company.industry}
            </span>

            {company.featured && (
              <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
                Featured
              </span>
            )}
          </div>

          <h3 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {company.name}
          </h3>

          {company.legalName && company.legalName !== company.name && (
            <p className="mt-2 text-sm font-medium text-slate-400">
              {company.legalName}
            </p>
          )}

          {company.tagline && (
            <p className="mt-4 max-w-xl leading-7 text-slate-300">
              {company.tagline}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
            {relationshipLabel}
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusClasses[company.status] || "bg-slate-200 text-slate-700"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {company.role && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              My Role
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-700">
              {company.role}
            </p>
          </div>
        )}

        <p className="mt-5 leading-7 text-slate-600">{company.description}</p>

        {company.businessAreas.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-bold text-slate-950">Business areas</p>

            <div className="mt-3 flex flex-wrap gap-2">
              {company.businessAreas.slice(0, 5).map((area) => (
                <span
                  key={`${company.id}-${area}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {company.highlights.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-6">
            <p className="text-sm font-bold text-slate-950">
              Company highlights
            </p>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {company.highlights.slice(0, 4).map((highlight) => (
                <li
                  key={`${company.id}-${highlight}`}
                  className="flex items-start gap-2.5 text-sm leading-6 text-slate-600"
                >
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-600" />

                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row sm:flex-wrap">
          {company.slug && (
            <Link
              to={`/companies/${encodeURIComponent(company.slug)}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-600 bg-white px-4 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              View Company Profile
            </Link>
          )}

          <WebsiteLink href={company.websiteUrl}>
            Visit Official Website
          </WebsiteLink>
        </div>
      </div>
    </article>
  );
}

function BrandCard({ brand }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/70 sm:p-8">
      <div className="flex items-start justify-between gap-5">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-600 text-lg font-extrabold text-white shadow-lg shadow-brand-600/20">
          {createInitials(brand.name)}
        </div>

        <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500">
          Brand
        </span>
      </div>

      <p className="mt-7 text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
        {brand.category}
      </p>

      <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
        {brand.name}
      </h3>

      <p className="mt-4 leading-7 text-slate-600">{brand.description}</p>

      <div className="mt-auto pt-8">
        <WebsiteLink href={brand.website}>Visit Brand Website</WebsiteLink>
      </div>
    </article>
  );
}

function CompaniesSection() {
  const fallbackCompanies = Array.isArray(siteData.companies)
    ? siteData.companies
    : [];

  const brands = Array.isArray(siteData.brands) ? siteData.brands : [];

  const {
    companies: loadedCompanies,
    isLoading,
    error,
    refreshCompanies,
  } = useCompanies({
    fallbackCompanies,
  });

  const companies = useMemo(
    () =>
      loadedCompanies
        .map(normaliseCompany)
        .sort(
          (firstCompany, secondCompany) =>
            Number(secondCompany.featured) - Number(firstCompany.featured) ||
            firstCompany.order - secondCompany.order,
        ),
    [loadedCompanies],
  );

  const hasCompanies = companies.length > 0;

  const hasBrands = brands.length > 0;

  return (
    <Section
      id="companies"
      className="scroll-mt-20 border-t border-slate-200 bg-slate-50"
    >
      <Container>
        <SectionHeading
          eyebrow="Companies and Brands"
          title="Businesses and digital brands built for long-term growth"
          description="Explore the registered companies, e-commerce businesses and creator brands that I own, manage or develop."
        />

        <p aria-live="polite" className="sr-only">
          {isLoading
            ? "Loading companies."
            : `${companies.length} companies loaded.`}
        </p>

        {error && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
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
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {hasCompanies && (
          <div className="mt-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
                  Registered Businesses
                </p>

                <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  My companies
                </h3>
              </div>

              <p className="text-sm text-slate-500">
                {companies.length}{" "}
                {companies.length === 1 ? "company" : "companies"}
              </p>
            </div>

            <div className="mt-7 grid gap-7 lg:grid-cols-2">
              {companies.map((company, index) => (
                <CompanyCard key={company.id} company={company} index={index} />
              ))}
            </div>
          </div>
        )}

        {!hasCompanies && !isLoading && (
          <div className="mt-12 rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-lg font-bold text-slate-950">
              No public companies available
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Company information will appear here after it is published.
            </p>
          </div>
        )}

        {hasBrands && (
          <div className="mt-16">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
                  Digital Presence
                </p>

                <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  Personal and creator brands
                </h3>
              </div>

              <p className="text-sm text-slate-500">
                {brands.length} {brands.length === 1 ? "brand" : "brands"}
              </p>
            </div>

            <div className="mt-7 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {brands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 rounded-3xl bg-slate-950 px-6 py-9 text-center sm:px-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
            Business Collaboration
          </p>

          <h3 className="mx-auto mt-3 max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Looking for website development or a digital business partnership?
          </h3>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">
            Contact me to discuss business websites, e-commerce platforms,
            development services and digital-product opportunities.
          </p>

          <a
            href="#contact"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Discuss a Business Project
          </a>
        </div>
      </Container>
    </Section>
  );
}

export default CompaniesSection;
