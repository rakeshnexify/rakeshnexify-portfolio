import useServices from "../../hooks/useServices";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";

function ServiceCard({ service, index }) {
  const serviceId =
    service._id || service.id || service.slug || `${service.title}-${index}`;

  const features = Array.isArray(service.features) ? service.features : [];

  const technologies = Array.isArray(service.technologies)
    ? service.technologies
    : [];

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/70 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-sm font-extrabold text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
          {String(index + 1).padStart(2, "0")}
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            service.isFeatured
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-slate-200 text-slate-500"
          }`}
        >
          {service.isFeatured ? "Featured" : "Service"}
        </span>
      </div>

      <h3 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
        {service.title}
      </h3>

      <p className="mt-4 leading-7 text-slate-600">
        {service.shortDescription}
      </p>

      {features.length > 0 && (
        <ul className="mt-6 space-y-3">
          {features.map((feature, featureIndex) => (
            <li
              key={`${serviceId}-${feature}-${featureIndex}`}
              className="flex items-start gap-3 text-sm leading-6 text-slate-600"
            >
              <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 10 3 3 7-7" />
                </svg>
              </span>

              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {technologies.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {technologies.map((technology, technologyIndex) => (
            <span
              key={`${serviceId}-${technology}-${technologyIndex}`}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
            >
              {technology}
            </span>
          ))}
        </div>
      )}

      <a
        href="#contact"
        className="mt-auto pt-8 text-sm font-bold text-brand-600 transition hover:text-brand-700"
      >
        Discuss this service →
      </a>
    </article>
  );
}

function ServicesSection() {
  const { services, isLoading, error } = useServices();

  return (
    <Section
      id="services"
      className="scroll-mt-20 border-t border-slate-200 bg-slate-50"
    >
      <Container>
        <SectionHeading
          eyebrow="My Services"
          title="Professional digital services for businesses and creators"
          description="From complete MERN applications to WordPress websites and e-commerce stores, I provide modern development solutions focused on design, usability and long-term growth."
        />

        {error && (
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-amber-700">
            Live services could not be loaded. Showing saved website data.
          </p>
        )}

        {isLoading && (
          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Loading services...
          </p>
        )}

        {!isLoading && services.length === 0 && (
          <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <p className="font-semibold text-slate-700">
              Services will be added soon.
            </p>
          </div>
        )}

        {services.length > 0 && (
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service, index) => (
              <ServiceCard
                key={
                  service._id ||
                  service.id ||
                  service.slug ||
                  `${service.title}-${index}`
                }
                service={service}
                index={index}
              />
            ))}
          </div>
        )}

        <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-3xl bg-slate-950 px-6 py-8 text-center sm:px-8 lg:flex-row lg:text-left">
          <div>
            <p className="text-xl font-bold text-white">
              Need a customised digital solution?
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Tell me about your business, project requirements and goals.
            </p>
          </div>

          <a
            href="#contact"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Start Your Project
          </a>
        </div>
      </Container>
    </Section>
  );
}

export default ServicesSection;
