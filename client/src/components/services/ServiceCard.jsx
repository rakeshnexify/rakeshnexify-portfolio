import { Link } from "react-router";

function ServiceAction({ href, children, className = "" }) {
  const destination = String(href || "").trim();

  if (!destination) {
    return null;
  }

  const isExternal =
    destination.startsWith("http://") || destination.startsWith("https://");

  if (isExternal) {
    return (
      <a
        href={destination}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  if (destination.startsWith("/")) {
    return (
      <Link to={destination} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={destination} className={className}>
      {children}
    </a>
  );
}

function ServiceCard({
  service,
  index = 0,
  compact = false,
  actionLabel = "Discuss this service",
  actionHref = "#contact",
}) {
  const serviceId =
    service?._id ||
    service?.id ||
    service?.slug ||
    `${service?.title || "service"}-${index}`;

  const features = Array.isArray(service?.features) ? service.features : [];

  const technologies = Array.isArray(service?.technologies)
    ? service.technologies
    : [];

  const visibleFeatures = compact ? features.slice(0, 4) : features;

  const visibleTechnologies = compact ? technologies.slice(0, 5) : technologies;

  const safeActionLabel =
    String(actionLabel || "").trim() || "Discuss this service";

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/70 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-50 text-sm font-extrabold text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
          <span aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>

          {service?.iconUrl && (
            <img
              key={service.iconUrl}
              src={service.iconUrl}
              alt=""
              className="absolute inset-0 h-full w-full bg-white object-contain p-2"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          )}
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            service?.isFeatured
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-slate-200 text-slate-500"
          }`}
        >
          {service?.isFeatured ? "Featured" : "Service"}
        </span>
      </div>

      <h3 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
        {service?.title || "Professional Service"}
      </h3>

      {service?.shortDescription && (
        <p className="mt-4 leading-7 text-slate-600">
          {service.shortDescription}
        </p>
      )}

      {visibleFeatures.length > 0 && (
        <ul className="mt-6 space-y-3">
          {visibleFeatures.map((feature, featureIndex) => (
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

      {visibleTechnologies.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {visibleTechnologies.map((technology, technologyIndex) => (
            <span
              key={`${serviceId}-${technology}-${technologyIndex}`}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
            >
              {technology}
            </span>
          ))}
        </div>
      )}

      <ServiceAction
        href={actionHref}
        className="mt-auto pt-8 text-sm font-bold text-brand-600 transition hover:text-brand-700"
      >
        {safeActionLabel} →
      </ServiceAction>
    </article>
  );
}

export default ServiceCard;
