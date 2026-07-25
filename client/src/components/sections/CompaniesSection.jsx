import siteData from "../../data/siteData";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";

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
    </a>
  );
}

function CompanyCard({ company, index }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="relative overflow-hidden bg-slate-950 px-6 py-8 sm:px-8">
        <div className="absolute -right-10 -top-12 size-40 rounded-full bg-brand-600/20 blur-3xl" />

        <div className="relative flex items-start justify-between gap-5">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-xl font-extrabold text-white">
            {company.name
              .split(" ")
              .slice(0, 2)
              .map((word) => word.charAt(0))
              .join("")}
          </div>

          <span className="text-4xl font-black tracking-tight text-white/10">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="relative mt-10">
          <p className="text-sm font-semibold text-brand-400">
            {company.category}
          </p>

          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {company.name}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <span className="w-fit rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
          {company.role}
        </span>

        <p className="mt-5 leading-7 text-slate-600">
          {company.description}
        </p>

        <div className="mt-auto pt-8">
          <WebsiteLink href={company.website}>
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
          {brand.name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .slice(0, 2)}
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

      <p className="mt-4 leading-7 text-slate-600">
        {brand.description}
      </p>

      <div className="mt-auto pt-8">
        <WebsiteLink href={brand.website}>
          Visit Brand Website
        </WebsiteLink>
      </div>
    </article>
  );
}

function CompaniesSection() {
  const hasCompanies = siteData.companies.length > 0;
  const hasBrands = siteData.brands.length > 0;

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
                {siteData.companies.length}{" "}
                {siteData.companies.length === 1 ? "company" : "companies"}
              </p>
            </div>

            <div className="mt-7 grid gap-7 lg:grid-cols-2">
              {siteData.companies.map((company, index) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  index={index}
                />
              ))}
            </div>
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
                {siteData.brands.length}{" "}
                {siteData.brands.length === 1 ? "brand" : "brands"}
              </p>
            </div>

            <div className="mt-7 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {siteData.brands.map((brand) => (
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