import { Link } from "react-router";

import { siteSettingsPageDefinitions } from "../../../config/siteSettingsPages";

const pageIcons = {
  brand: "BR",
  owner: "OW",
  hero: "HE",
  about: "AB",
  "listing-sections": "SC",
  contact: "CO",
  platforms: "PL",
  navigation: "NV",
  footer: "FT",
  seo: "SE",
  publication: "PB",
};

const settingsGroups = [
  { label: "Identity", keys: ["brand", "owner"] },
  { label: "Homepage Content", keys: ["hero", "about", "listing-sections"] },
  { label: "Contact & Profiles", keys: ["contact", "platforms"] },
  { label: "Structure", keys: ["navigation", "footer"] },
  { label: "Discovery & Access", keys: ["seo", "publication"] },
];

const pageByKey = Object.fromEntries(
  siteSettingsPageDefinitions.map((page) => [page.key, page]),
);

function SiteSettingsOverview() {
  return (
    <section
      aria-label="Site Settings categories"
      className="rnx-admin-site-settings-overview-v482 space-y-2.5"
    >
      {settingsGroups.map((group) => (
        <section
          key={group.label}
          className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3"
        >
          <h2 className="text-xs font-bold text-slate-950 dark:text-white sm:text-[13px]">
            {group.label}
          </h2>

          <div className="mt-2 grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
            {group.keys.map((pageKey) => {
              const page = pageByKey[pageKey];

              if (!page) {
                return null;
              }

              return (
                <Link
                  key={page.key}
                  to={page.path}
                  className="group flex min-w-0 items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 p-2 transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-700 dark:bg-slate-950/60 dark:hover:border-brand-700 dark:hover:bg-brand-950/20"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-[9px] font-black text-brand-700 ring-1 ring-brand-100 dark:bg-brand-950/50 dark:text-brand-300 dark:ring-brand-900">
                    {pageIcons[page.key] || "ST"}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-bold text-slate-900 dark:text-slate-100 sm:text-xs">
                      {page.title}
                    </span>
                    <span className="mt-0.5 line-clamp-1 block text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
                      {page.description}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className="shrink-0 text-sm font-bold text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 dark:text-slate-600 dark:group-hover:text-brand-300"
                  >
                    &rarr;
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}

export default SiteSettingsOverview;
