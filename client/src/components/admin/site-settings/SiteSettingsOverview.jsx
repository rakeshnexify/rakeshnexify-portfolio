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

function SiteSettingsOverview() {
  return (
    <section aria-labelledby="settings-overview-heading">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
          Settings Categories
        </p>

        <h2
          id="settings-overview-heading"
          className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
        >
          Choose what you want to manage
        </h2>

        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          Website settings are divided into small pages. Open only the category
          you need, update its fields and save the changes.
        </p>
      </div>

      <div className="mt-6 grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {siteSettingsPageDefinitions.map((page, index) => (
          <article
            key={page.key}
            className="group flex min-w-0 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/60"
          >
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-sm font-black text-brand-600 ring-1 ring-brand-100">
                {pageIcons[page.key] || "ST"}
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <h3 className="mt-6 break-words text-xl font-bold text-slate-950">
              {page.title}
            </h3>

            <p className="mt-3 break-words text-sm leading-6 text-slate-600">
              {page.description}
            </p>

            <div className="mt-auto pt-6">
              <Link
                to={page.path}
                className="inline-flex min-h-11 w-full max-w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-center text-sm font-semibold text-slate-700 transition group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white"
              >
                Open {page.shortTitle} Settings
                <span aria-hidden="true" className="ml-2">
                  →
                </span>
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-bold text-blue-800">
          Changes remain connected
        </p>

        <p className="mt-1 text-sm leading-6 text-blue-700">
          All pages use the same Site Settings database record and Admin API.
          Dividing the interface into pages does not create duplicate settings.
        </p>
      </div>
    </section>
  );
}

export default SiteSettingsOverview;
