function formatPackagePrice(servicePackage) {
  if (servicePackage?.pricingMode === "custom") {
    return servicePackage?.priceLabel || "Custom pricing";
  }

  const numericPrice = Number(servicePackage?.price);

  if (!Number.isFinite(numericPrice)) {
    return servicePackage?.priceLabel || "Contact for pricing";
  }

  const currency = String(servicePackage?.currency || "NPR").toUpperCase();

  let formattedPrice = `${currency} ${numericPrice.toLocaleString("en-US")}`;

  try {
    formattedPrice = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(numericPrice);
  } catch {
    // Keep the safe currency + numeric fallback.
  }

  if (servicePackage?.pricingMode === "starting-from") {
    return `From ${formattedPrice}`;
  }

  return formattedPrice;
}

function PackageCard({ servicePackage, isSelected, onSelect }) {
  const features = Array.isArray(servicePackage?.features)
    ? servicePackage.features
    : [];

  return (
    <article
      className={`flex h-full flex-col rounded-3xl border bg-white p-6 shadow-sm transition ${
        isSelected
          ? "border-brand-400 ring-4 ring-brand-100"
          : servicePackage?.isFeatured
            ? "border-amber-200"
            : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {servicePackage?.badge && (
          <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
            {servicePackage.badge}
          </span>
        )}

        {servicePackage?.isFeatured && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
            Featured
          </span>
        )}

        {isSelected && (
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
            Selected
          </span>
        )}
      </div>

      <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
        {servicePackage?.name || "Package"}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {servicePackage?.shortDescription}
      </p>

      <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
        <p className="text-2xl font-black">
          {formatPackagePrice(servicePackage)}
        </p>

        <p className="mt-1 text-xs font-semibold text-slate-400">
          {servicePackage?.billingLabel ||
            String(servicePackage?.billingCycle || "")
              .replace("-", " ")
              .replace(/\b\w/g, (letter) => letter.toUpperCase())}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        {[
          ["Best for", servicePackage?.bestFor],
          ["Delivery", servicePackage?.deliveryLabel],
          ["Support", servicePackage?.supportLabel],
          ["Revisions", servicePackage?.revisionsLabel],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs font-semibold text-slate-400">{label}</dt>
            <dd className="mt-1 break-words font-bold text-slate-700">
              {value || "—"}
            </dd>
          </div>
        ))}
      </dl>

      {features.length > 0 && (
        <ul className="mt-5 space-y-3">
          {features.slice(0, 6).map((feature, index) => (
            <li
              key={feature?.key || `${feature?.label}-${index}`}
              className="flex items-start gap-3 text-sm leading-6 text-slate-600"
            >
              <span
                className={`mt-1 grid size-5 shrink-0 place-items-center rounded-full ${
                  feature?.included
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {feature?.included ? "✓" : "–"}
              </span>

              <span>
                <span className="font-semibold text-slate-700">
                  {feature?.label}
                </span>
                {feature?.value && (
                  <span className="block text-xs text-slate-400">
                    {feature.value}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onSelect(servicePackage)}
        className={`mt-auto inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-bold transition ${
          isSelected
            ? "bg-slate-950 text-white hover:bg-slate-800"
            : "bg-brand-600 text-white hover:bg-brand-700"
        }`}
      >
        {isSelected
          ? "Package selected"
          : servicePackage?.ctaLabel || "View Designs"}
      </button>
    </article>
  );
}

export { formatPackagePrice };
export default PackageCard;
