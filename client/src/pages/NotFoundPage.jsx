import { Link, useLocation } from "react-router";

import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import useSiteSettings from "../hooks/useSiteSettings";

const defaultNotFoundKeywords = ["page not found", "404 page", "RakeshNexify"];

function NotFoundPage() {
  const { pathname } = useLocation();

  const { settings } = useSiteSettings();

  const brandName =
    String(settings?.brand?.name || "").trim() || "RakeshNexify";

  const globalSeo =
    settings?.seo && typeof settings.seo === "object" ? settings.seo : {};

  const globalKeywords = Array.isArray(globalSeo.keywords)
    ? globalSeo.keywords
    : String(globalSeo.keywords || "")
        .split(/[,\n]/)
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  const socialSharingImage = String(globalSeo.ogImageUrl || "").trim();

  const canonicalPath = String(pathname || "").trim() || "/404";

  return (
    <>
      <PageSeo
        title={`Page Not Found | ${brandName}`}
        description="The requested page could not be found. It may have been moved, removed or the entered URL may be incorrect."
        keywords={[...globalKeywords, ...defaultNotFoundKeywords]}
        canonicalPath={canonicalPath}
        image={socialSharingImage}
        type="website"
        noIndex
        brandName={brandName}
      />

      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[calc(100vh-5rem)] overflow-x-hidden place-items-center bg-slate-50 px-4 py-14 sm:py-20"
      >
        <section className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-950/5">
          <div className="relative overflow-hidden bg-slate-950 px-6 py-12 text-center text-white sm:px-10 sm:py-16">
            <div className="absolute -right-24 -top-24 size-72 rounded-full bg-brand-600/25 blur-3xl" />

            <div className="absolute -bottom-32 -left-20 size-72 rounded-full bg-cyan-500/15 blur-3xl" />

            <div className="relative">
              <p className="text-7xl font-black tracking-tight text-brand-500 sm:text-8xl">
                404
              </p>

              <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                Page Not Found
              </p>

              <h1 className="mx-auto mt-4 max-w-2xl break-words text-3xl font-black tracking-tight sm:text-5xl">
                This page does not exist
              </h1>

              <p className="mx-auto mt-5 max-w-xl break-words text-base leading-7 text-slate-300">
                The page may have been moved, removed or the URL may be
                incorrect.
              </p>
            </div>
          </div>

          <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
            <p className="text-sm font-semibold text-slate-500">
              Requested address
            </p>

            <code className="mx-auto mt-3 block max-w-full overflow-x-auto rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              {pathname}
            </code>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/"
                className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
              >
                Return Home
              </Link>

              <Link
                to="/projects"
                className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-center text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
              >
                View Projects
              </Link>

              <Link
                to="/#contact"
                className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-brand-600 bg-white px-5 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
              >
                Contact Me
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default NotFoundPage;
