import { formatPackagePrice } from "./PackageCard";

function buildFeatureRows(servicePackages) {
  const rowsByKey = new Map();

  servicePackages.forEach((servicePackage) => {
    const features = Array.isArray(servicePackage?.features)
      ? servicePackage.features
      : [];

    features.forEach((feature, index) => {
      const key =
        String(feature?.key || "").trim() ||
        String(feature?.label || "").trim().toLowerCase() ||
        `feature-${index}`;

      if (!rowsByKey.has(key)) {
        rowsByKey.set(key, {
          key,
          label: feature?.label || key,
          order: Number(feature?.order ?? index),
        });
      } else {
        const current = rowsByKey.get(key);

        current.order = Math.min(
          current.order,
          Number(feature?.order ?? index),
        );
      }
    });
  });

  return [...rowsByKey.values()].sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order;
    }

    return left.label.localeCompare(right.label);
  });
}

function findFeature(servicePackage, featureKey) {
  const features = Array.isArray(servicePackage?.features)
    ? servicePackage.features
    : [];

  return features.find((feature, index) => {
    const key =
      String(feature?.key || "").trim() ||
      String(feature?.label || "").trim().toLowerCase() ||
      `feature-${index}`;

    return key === featureKey;
  });
}

function ComparisonValue({ feature }) {
  if (!feature || feature.included === false) {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-400">
        <span className="grid size-4 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px]">
          –
        </span>
        <span>Not included</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-start gap-1.5 font-semibold text-slate-700">
      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] text-emerald-700">
        ✓
      </span>

      <span>{feature.value || "Included"}</span>
    </span>
  );
}

function PackageComparison({
  servicePackages,
  selectedPackageSlug,
  onSelectPackage,
}) {
  const packages = Array.isArray(servicePackages) ? servicePackages : [];
  const featureRows = buildFeatureRows(packages);

  if (packages.length === 0) {
    return null;
  }

  const gridTemplateColumns = `minmax(118px, 0.72fr) repeat(${packages.length}, minmax(168px, 1fr))`;

  return (
    <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 scroll-smooth sm:mx-0 sm:px-0">
      <div className="min-w-max overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl">
        <div
          style={{
            display: "grid",
            gridTemplateColumns,
          }}
        >
          <div className="sticky left-0 z-30 border-b border-r border-slate-200 bg-slate-50 p-3 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-brand-600 sm:text-xs">
              Compare
            </p>

            <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:mt-2 sm:text-sm sm:leading-6">
              Package scope
            </p>
          </div>

          {packages.map((servicePackage) => {
            const isSelected =
              servicePackage.slug === selectedPackageSlug;

            return (
              <div
                key={`header-${servicePackage._id || servicePackage.slug}`}
                className={`border-b border-r border-slate-200 p-3 last:border-r-0 sm:p-5 ${
                  isSelected ? "bg-brand-50" : "bg-white"
                }`}
              >
                <div className="flex min-h-5 flex-wrap gap-1 sm:gap-2">
                  {servicePackage.badge && (
                    <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[9px] font-bold text-white sm:px-2.5 sm:py-1 sm:text-[11px]">
                      {servicePackage.badge}
                    </span>
                  )}

                  {servicePackage.isFeatured && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700 sm:px-2.5 sm:py-1 sm:text-[11px]">
                      Featured
                    </span>
                  )}
                </div>

                <h3 className="mt-2 text-base font-black text-slate-950 sm:mt-3 sm:text-xl">
                  {servicePackage.name}
                </h3>

                <p className="mt-2 whitespace-nowrap text-lg font-black text-brand-600 sm:mt-3 sm:text-2xl">
                  {formatPackagePrice(servicePackage)}
                </p>

                <p className="mt-0.5 text-[10px] font-semibold text-slate-400 sm:mt-1 sm:text-xs">
                  {servicePackage.billingLabel ||
                    servicePackage.billingCycle?.replace("-", " ")}
                </p>

                <button
                  type="button"
                  onClick={() => onSelectPackage(servicePackage)}
                  className={`mt-3 min-h-9 w-full rounded-lg px-2 text-[11px] font-bold transition sm:mt-5 sm:min-h-11 sm:rounded-xl sm:px-4 sm:text-sm ${
                    isSelected
                      ? "bg-slate-950 text-white"
                      : "bg-brand-600 text-white hover:bg-brand-700"
                  }`}
                >
                  {isSelected
                    ? "Selected"
                    : servicePackage.ctaLabel || "Choose Package"}
                </button>
              </div>
            );
          })}

          {[
            ["Best for", "bestFor"],
            ["Delivery", "deliveryLabel"],
            ["Support", "supportLabel"],
            ["Revisions", "revisionsLabel"],
          ].map(([label, fieldName]) => (
            <div key={fieldName} className="contents">
              <div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 p-3 text-[11px] font-bold text-slate-700 sm:p-4 sm:text-sm">
                {label}
              </div>

              {packages.map((servicePackage) => (
                <div
                  key={`${fieldName}-${servicePackage._id || servicePackage.slug}`}
                  className={`border-b border-r border-slate-200 p-3 text-[11px] leading-5 text-slate-600 last:border-r-0 sm:p-4 sm:text-sm sm:leading-6 ${
                    servicePackage.slug === selectedPackageSlug
                      ? "bg-brand-50/50"
                      : ""
                  }`}
                >
                  {servicePackage[fieldName] || "—"}
                </div>
              ))}
            </div>
          ))}

          {featureRows.map((featureRow) => (
            <div key={featureRow.key} className="contents">
              <div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50 p-3 text-[11px] font-bold text-slate-700 sm:p-4 sm:text-sm">
                {featureRow.label}
              </div>

              {packages.map((servicePackage) => (
                <div
                  key={`${featureRow.key}-${servicePackage._id || servicePackage.slug}`}
                  className={`border-b border-r border-slate-200 p-3 text-[11px] leading-5 last:border-r-0 sm:p-4 sm:text-sm sm:leading-6 ${
                    servicePackage.slug === selectedPackageSlug
                      ? "bg-brand-50/50"
                      : ""
                  }`}
                >
                  <ComparisonValue
                    feature={findFeature(servicePackage, featureRow.key)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-2 text-center text-[10px] font-semibold text-slate-400 sm:hidden">
        Swipe left or right to compare packages
      </p>
    </div>
  );
}

export default PackageComparison;
