import siteData from "../../data/siteData";

function Logo({
  showTagline = false,
  className = "",
  textClassName = "",
}) {
  const { brand } = siteData;

  const brandParts = brand.name.match(/^(.+?)(Nexify)$/i);

  const firstPart = brandParts ? brandParts[1] : brand.name;
  const highlightedPart = brandParts ? brandParts[2] : "";

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-lg font-extrabold text-white shadow-lg shadow-brand-600/20">
        {brand.shortName}
      </div>

      <div className="min-w-0">
        <p
          className={`text-xl font-extrabold tracking-tight text-slate-950 ${textClassName}`}
        >
          {firstPart}

          {highlightedPart && (
            <span className="text-brand-600">
              {highlightedPart}
            </span>
          )}
        </p>

        {showTagline && (
          <p className="mt-0.5 text-xs font-medium tracking-wide text-slate-500">
            {brand.tagline}
          </p>
        )}
      </div>
    </div>
  );
}

export default Logo;