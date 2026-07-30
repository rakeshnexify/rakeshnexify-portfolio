import { useEffect } from "react";
import { Link, useParams } from "react-router";

import Container from "../components/layout/Container";
import useBrand from "../hooks/useBrand";

const brandTypeLabels = {
  personal: "Personal Brand",
  creator: "Creator Brand",
  business: "Business Brand",
  product: "Product Brand",
  media: "Media Brand",
  education: "Education Brand",
  community: "Community Brand",
  other: "Digital Brand",
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
    key: "tiktok",
    label: "TikTok",
  },
  {
    key: "threads",
    label: "Threads",
  },
  {
    key: "x",
    label: "X",
  },
  {
    key: "github",
    label: "GitHub",
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

  return initials || "BR";
}

function BrandLink({ href, children, variant = "primary" }) {
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

function BrandLoadingState() {
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

function BrandErrorState({ error, status, onRetry }) {
  const isNotFound = status === 404;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
          !
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
          {isNotFound ? "Brand Not Found" : "Brand Error"}
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          {isNotFound
            ? "This brand is unavailable"
            : "Brand could not be loaded"}
        </h1>

        <p className="mt-4 leading-7 text-slate-600">
          {isNotFound
            ? "The brand may be hidden, deleted or the brand URL may be incorrect."
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
            Return to brands
          </Link>
        </div>
      </div>
    </main>
  );
}

function BrandDetailsPage() {
  const { slug } = useParams();

  const { brand, isLoading, error, status, refreshBrand } = useBrand(slug);

  useEffect(() => {
    const previousTitle = document.title;

    if (brand?.seo?.title) {
      document.title = brand.seo.title;
    } else if (brand?.name) {
      document.title = `${brand.name} | RakeshNexify`;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [brand]);

  if (isLoading) {
    return <BrandLoadingState />;
  }

  if (error || !brand) {
    return (
      <BrandErrorState error={error} status={status} onRetry={refreshBrand} />
    );
  }

  const focusAreas = Array.isArray(brand.focusAreas) ? brand.focusAreas : [];

  const platforms = Array.isArray(brand.platforms) ? brand.platforms : [];

  const highlights = Array.isArray(brand.highlights) ? brand.highlights : [];

  const statistics = Array.isArray(brand.statistics)
    ? brand.statistics.filter(
        (statistic) => statistic?.label && statistic?.value,
      )
    : [];

  const socialLinks = brand.socialLinks || {};

  const availableSocialLinks = socialPlatforms.filter(
    (platform) => socialLinks[platform.key],
  );

  const brandTypeLabel =
    brandTypeLabels[brand.brandType] || brand.brandType || "Digital Brand";

  const statusLabel = statusLabels[brand.status] || brand.status || "Brand";

  const overview = brand.description || brand.shortDescription || "";

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
                  Brand Profile
                </p>
              </div>
            </Link>

            <Link
              to="/#companies"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
            >
              ← All Brands
            </Link>
          </div>
        </Container>
      </header>

      <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
        {brand.coverImageUrl && (
          <img
            src={brand.coverImageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-20"
          />
        )}

        {brand.coverImageUrl && (
          <div className="absolute inset-0 bg-slate-950/80" />
        )}

        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl" />

        <div className="absolute -bottom-40 left-10 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <Container>
          <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
                  {brand.category || "Digital Brand"}
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
                  {brandTypeLabel}
                </span>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    statusClasses[brand.status] || "bg-slate-200 text-slate-700"
                  }`}
                >
                  {statusLabel}
                </span>

                {brand.isFeatured && (
                  <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
                    Featured
                  </span>
                )}
              </div>

              <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                Brand Profile
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {brand.name}
              </h1>

              {brand.tagline && (
                <p className="mt-6 max-w-3xl text-xl font-semibold leading-8 text-slate-200">
                  {brand.tagline}
                </p>
              )}

              {brand.shortDescription && (
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-400">
                  {brand.shortDescription}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <BrandLink href={brand.websiteUrl}>
                  Visit Official Website
                </BrandLink>

                <BrandLink href="/#contact" variant="outline">
                  Discuss a Project
                </BrandLink>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl">
              {brand.logoUrl ? (
                <div className="grid aspect-[16/10] place-items-center rounded-2xl bg-white p-8">
                  <img
                    src={brand.logoUrl}
                    alt={`${brand.name} logo`}
                    className="max-h-52 max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="grid aspect-[16/10] place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-600/30 via-slate-900 to-cyan-500/20">
                  <div className="text-center">
                    <div className="mx-auto grid size-24 place-items-center rounded-3xl border border-white/10 bg-white/10 text-3xl font-black text-white">
                      {createInitials(brand.name)}
                    </div>

                    <p className="mt-5 font-bold text-white">{brand.name}</p>

                    <p className="mt-2 text-sm text-slate-400">
                      Official brand logo will be added soon
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
              {overview && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
                    Brand Overview
                  </p>

                  <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                    About this brand
                  </h2>

                  <p className="mt-6 whitespace-pre-line text-base leading-8 text-slate-600">
                    {overview}
                  </p>
                </section>
              )}

              <DetailList title="Focus Areas" items={focusAreas} />

              <DetailList title="Available Platforms" items={platforms} />

              <DetailList title="Brand Highlights" items={highlights} />

              {statistics.length > 0 && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                    Brand Statistics
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
                  Brand Information
                </h2>

                <dl className="mt-6 divide-y divide-slate-100">
                  <InformationItem label="Category">
                    {brand.category}
                  </InformationItem>

                  <InformationItem label="Brand Type">
                    {brandTypeLabel}
                  </InformationItem>

                  <InformationItem label="Status">
                    {statusLabel}
                  </InformationItem>

                  <InformationItem label="My Role">
                    {brand.role}
                  </InformationItem>

                  <InformationItem label="Launch Year">
                    {brand.launchedYear}
                  </InformationItem>

                  <InformationItem label="Platforms">
                    {platforms.length > 0
                      ? `${platforms.length} platforms`
                      : ""}
                  </InformationItem>
                </dl>
              </section>

              {availableSocialLinks.length > 0 && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-950">
                    Social Links
                  </h2>

                  <div className="mt-5 grid gap-3">
                    {availableSocialLinks.map((platform) => (
                      <BrandLink
                        key={platform.key}
                        href={socialLinks[platform.key]}
                        variant="outline"
                      >
                        {platform.label}
                      </BrandLink>
                    ))}
                  </div>
                </section>
              )}

              {brand.websiteUrl && (
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-950">
                    Official Website
                  </h2>

                  <p className="mt-3 break-words text-sm leading-6 text-slate-500">
                    {brand.websiteUrl}
                  </p>

                  <div className="mt-5">
                    <BrandLink href={brand.websiteUrl}>Open Website</BrandLink>
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
              Digital Growth
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
              Need a professional website or digital platform for your brand?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">
              Let us discuss your brand goals, required features and the best
              digital solution for building a strong online presence.
            </p>

            <Link
              to="/#contact"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Discuss Your Brand
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}

export default BrandDetailsPage;
