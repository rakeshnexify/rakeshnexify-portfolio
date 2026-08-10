function PackageDesignSelector({
  packageName,
  designs,
  selectedDesignSlug,
  isLoading,
  error,
  onSelectDesign,
}) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-56 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
        Designs could not be loaded.
      </div>
    );
  }

  if (!designs.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
        No designs available for {packageName || "this package"}.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {designs.map((design) => {
        const isSelected = design.slug === selectedDesignSlug;

        return (
          <button
            key={design._id || design.slug}
            type="button"
            onClick={() => onSelectDesign(design)}
            className={`overflow-hidden rounded-2xl border bg-white text-left transition ${
              isSelected
                ? "border-brand-500 ring-4 ring-brand-100"
                : "border-slate-200 hover:border-brand-300 hover:shadow-lg"
            }`}
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
              {design.thumbnailUrl ? (
                <img
                  src={design.thumbnailUrl}
                  alt={design.thumbnailAlt || design.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center text-xs font-bold text-slate-400">
                  No Preview
                </div>
              )}

              {isSelected && (
                <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-brand-600 font-black text-white shadow">
                  ✓
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 p-4">
              <h3 className="truncate text-base font-black text-slate-950">
                {design.name}
              </h3>

              <span
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${
                  isSelected
                    ? "bg-brand-600 text-white"
                    : "bg-slate-950 text-white"
                }`}
              >
                {isSelected ? "Selected" : "Choose"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default PackageDesignSelector;
