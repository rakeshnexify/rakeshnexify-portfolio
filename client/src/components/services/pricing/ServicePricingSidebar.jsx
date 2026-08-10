import { useEffect, useMemo, useState } from "react";

const groups = [
  {
    value: "development",
    label: "Development",
  },
  {
    value: "management",
    label: "Management",
  },
];

function ServiceThumb({ service, index }) {
  return (
    <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-[11px] font-black text-brand-600">
      <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>

      {service?.iconUrl && (
        <img
          src={service.iconUrl}
          alt=""
          className="absolute inset-0 size-full bg-white object-cover"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      )}
    </span>
  );
}

function ServicesMenu({
  services,
  selectedServiceSlug,
  activeGroup,
  servicePackages,
  onSelectService,
  onSelectGroup,
}) {
  const groupCounts = useMemo(() => {
    const counts = {
      development: 0,
      management: 0,
    };

    servicePackages.forEach((servicePackage) => {
      if (servicePackage?.group in counts) {
        counts[servicePackage.group] += 1;
      }
    });

    return counts;
  }, [servicePackages]);

  return (
    <nav aria-label="Services and package types">
      <button
        type="button"
        onClick={() => onSelectService("")}
        className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-xs font-bold transition sm:min-h-11 sm:px-4 sm:text-sm ${
          !selectedServiceSlug
            ? "bg-brand-600 text-white"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        <span>All Services</span>

        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${
            !selectedServiceSlug
              ? "bg-white/15 text-white"
              : "bg-white text-slate-500"
          }`}
        >
          {services.length}
        </span>
      </button>

      <div className="mt-2 space-y-1">
        {services.map((service, index) => {
          const serviceSlug = String(service?.slug || "").trim();
          const isSelected = serviceSlug === selectedServiceSlug;

          return (
            <div
              key={
                service._id ||
                service.id ||
                service.slug ||
                `${service.title}-${index}`
              }
            >
              <button
                type="button"
                onClick={() => onSelectService(serviceSlug)}
                className={`flex min-h-11 w-full items-center gap-2 rounded-xl border px-2 text-left transition sm:min-h-12 sm:gap-3 sm:px-3 ${
                  isSelected
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-transparent text-slate-700 hover:bg-slate-100"
                }`}
              >
                <ServiceThumb service={service} index={index} />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-bold sm:text-sm">
                    {service?.title || "Service"}
                  </span>

                  <span className="mt-0.5 block truncate text-[9px] font-medium text-slate-400 sm:text-[11px]">
                    {isSelected ? "Selected" : "View packages"}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className={`shrink-0 text-sm font-black ${
                    isSelected ? "text-brand-600" : "text-slate-400"
                  }`}
                >
                  {isSelected ? "✓" : "›"}
                </span>
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
                  isSelected
                    ? "mt-1 grid-rows-[1fr] opacity-100"
                    : "mt-0 grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="ml-1 rounded-lg bg-slate-50 p-0.5 sm:ml-2 sm:p-1">
                    <p className="px-1.5 pb-1 text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Package Type
                    </p>

                    <div className="space-y-1">
                      {groups.map((group) => {
                        const isActive = activeGroup === group.value;

                        return (
                          <button
                            key={group.value}
                            type="button"
                            onClick={() =>
                              onSelectGroup(isActive ? "" : group.value)
                            }
                            className={`flex min-h-7 w-full items-center justify-between rounded-md px-1.5 text-left font-bold transition sm:min-h-8 sm:px-2 ${
                              isActive
                                ? "bg-slate-950 text-white"
                                : "bg-white text-slate-600 hover:text-brand-600"
                            }`}
                          >
                            <span className="truncate" style={{ fontSize: "12px", lineHeight: "1.15" }}>
                              {group.label}
                            </span>

                            <span
                              className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] ${
                                isActive
                                  ? "bg-white/10 text-white"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {groupCounts[group.value]}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {activeGroup && (
                      <button
                        type="button"
                        onClick={() => onSelectGroup("")}
                        className="mt-1 min-h-6 w-full rounded-md px-1.5 text-left text-[9px] font-bold leading-4 text-brand-600 transition hover:bg-white"
                      >
                        Show both
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

function ServicePricingSidebar(props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <div className="sticky top-20 z-20 -mx-4 bg-slate-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          aria-expanded={isDrawerOpen}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-left shadow-sm"
        >
          <span className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-brand-600">
              Services Menu
            </span>

            <span className="mt-0.5 block truncate text-sm font-bold text-slate-950">
              {props.selectedServiceTitle || "All Services"}
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-2 text-xs font-bold text-brand-600">
            Open
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </span>
        </button>
      </div>

      <aside className="hidden self-start lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="px-2 pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
              Services & Pricing
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Choose a service, then choose Development or Management.
            </p>
          </div>

          <ServicesMenu {...props} />
        </div>
      </aside>

      <div
        aria-hidden={!isDrawerOpen}
        className={`fixed inset-0 z-[100] lg:hidden ${
          isDrawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <button
          type="button"
          aria-label="Close Services menu"
          onClick={() => setIsDrawerOpen(false)}
          className={`absolute inset-0 bg-slate-950/20 transition-opacity duration-300 ${
            isDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <section
          role="dialog"
          aria-modal="true"
          aria-label="Services menu"
          className={`absolute inset-y-0 left-0 w-[42vw] min-w-[10.5rem] max-w-[16rem] overflow-y-auto border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-2.5 py-3 sm:px-4">
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-brand-600 sm:text-[10px] sm:tracking-[0.14em]">
                Services
              </p>

              <h2 className="mt-0.5 truncate text-sm font-black text-slate-950 sm:text-lg">
                Menu
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close Services menu"
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 sm:size-9"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 5l10 10M15 5 5 15" />
              </svg>
            </button>
          </div>

          <div className="p-2 sm:p-3">
            <ServicesMenu {...props} />
          </div>
        </section>
      </div>
    </>
  );
}

export default ServicePricingSidebar;
