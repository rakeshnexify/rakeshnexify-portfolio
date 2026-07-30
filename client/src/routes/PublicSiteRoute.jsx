import { Outlet } from "react-router";

import Container from "../components/layout/Container";
import useSiteSettings from "../hooks/useSiteSettings";

function PublicSiteRoute() {
  const { settings, isLoading, refreshSettings } = useSiteSettings();

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100">
        <div role="status" className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />

          <p className="mt-5 text-sm font-semibold text-slate-600">
            Loading website...
          </p>
        </div>
      </main>
    );
  }

  if (settings?.isPublished !== false) {
    return <Outlet />;
  }

  const brand = settings?.brand || {};
  const owner = settings?.owner || {};
  const contact = settings?.contact || {};

  const brandName = brand.name || "RakeshNexify";

  const shortName = brand.shortName || "RN";

  const ownerName = owner.name || "";

  const email = String(contact.email || "").trim();

  const availability = String(contact.availability || "").trim();

  return (
    <main className="flex min-h-screen items-center bg-slate-100 py-12">
      <Container>
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-200/70 sm:p-10 lg:p-14">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-600 text-xl font-black text-white shadow-lg shadow-brand-600/20">
            {shortName}
          </div>

          <p className="mt-7 text-sm font-bold uppercase tracking-[0.2em] text-brand-600">
            {brandName}
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Website update in progress
          </h1>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-slate-600">
            This website is temporarily unavailable while its content and
            settings are being updated. Please check again shortly.
          </p>

          {availability && (
            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold leading-6 text-slate-700">
                {availability}
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Contact {ownerName || brandName}
              </a>
            )}

            <button
              type="button"
              onClick={refreshSettings}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
            >
              Check Again
            </button>
          </div>
        </div>
      </Container>
    </main>
  );
}

export default PublicSiteRoute;
