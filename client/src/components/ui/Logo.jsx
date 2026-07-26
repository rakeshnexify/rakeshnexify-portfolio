import useSiteSettings from "../../hooks/useSiteSettings";

function Logo({
  className = "",
  iconClassName = "",
  textClassName = "",
  showTagline = false,
}) {
  const { settings } = useSiteSettings();

  const brand = settings?.brand || {};

  const brandName = brand.name || "RakeshNexify";
  const shortName = brand.shortName || "RN";
  const tagline = brand.tagline || "Developer · Creator · Entrepreneur";
  const logoUrl = brand.logoUrl || "";

  const isDefaultBrand = brandName.toLowerCase() === "rakeshnexify";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${brandName} logo`}
          className={`h-12 w-12 rounded-2xl object-cover shadow-md ${iconClassName}`}
        />
      ) : (
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-lg font-extrabold text-white shadow-md ${iconClassName}`}
          aria-hidden="true"
        >
          {shortName}
        </span>
      )}

      <div className="min-w-0">
        <p
          className={`truncate text-xl font-extrabold tracking-tight text-slate-950 ${textClassName}`}
        >
          {isDefaultBrand ? (
            <>
              Rakesh
              <span className="text-brand-600">Nexify</span>
            </>
          ) : (
            brandName
          )}
        </p>

        {showTagline && (
          <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
            {tagline}
          </p>
        )}
      </div>
    </div>
  );
}

export default Logo;
