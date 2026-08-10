import { Link } from "react-router";

function getInitials(title = "") {
  return String(title)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function ServiceOverviewCard({ service, index = 0 }) {
  const technologies = Array.isArray(service?.technologies)
    ? service.technologies.slice(0, 3)
    : [];

  const slug = String(service?.slug || "").trim();

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl">
      <div className="relative aspect-[16/8.5] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900">
        {service?.iconUrl ? (
          <img
            src={service.iconUrl}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-[1.04]"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : (
          <div className="grid size-full place-items-center">
            <span className="text-4xl font-black tracking-tight text-white/90">
              {getInitials(service?.title) ||
                String(index + 1).padStart(2, "0")}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <span className="rounded-full border border-white/15 bg-slate-950/55 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
            {service?.isFeatured ? "Featured Service" : "Professional Service"}
          </span>

          <span className="grid size-8 place-items-center rounded-full bg-white/15 text-xs font-black text-white backdrop-blur">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="line-clamp-2 text-xl font-black tracking-tight text-slate-950">
          {service?.title || "Professional Service"}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {service?.shortDescription || service?.description}
        </p>

        {technologies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {technologies.map((technology, technologyIndex) => (
              <span
                key={`${technology}-${technologyIndex}`}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
              >
                {technology}
              </span>
            ))}
          </div>
        )}

        <Link
          to={`/services?service=${encodeURIComponent(slug)}`}
          className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition hover:bg-brand-700"
        >
          View Packages →
        </Link>
      </div>
    </article>
  );
}

export default ServiceOverviewCard;
