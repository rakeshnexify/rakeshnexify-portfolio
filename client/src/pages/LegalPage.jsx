import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import useSiteSettings from "../hooks/useSiteSettings";

function createContentBlocks(value) {
  return String(value || "")
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function LegalPage({
  pageKey,
  canonicalPath,
  defaultTitle,
}) {
  const { settings, isLoading } = useSiteSettings();

  const brandName =
    String(settings?.brand?.name || "").trim() || "RakeshNexify";

  const legalPage = settings?.legal?.[pageKey] || {};

  const isPublished =
    legalPage.isPublished === true &&
    Boolean(String(legalPage.content || "").trim());

  const title =
    String(legalPage.title || "").trim() || defaultTitle;

  const seoTitle =
    String(legalPage.seoTitle || "").trim() ||
    `${title} | ${brandName}`;

  const seoDescription =
    String(legalPage.seoDescription || "").trim() ||
    `Read the ${title} for ${brandName}.`;

  const sharingImage =
    String(settings?.seo?.ogImageUrl || "").trim();

  const contentBlocks = createContentBlocks(legalPage.content);

  return (
    <>
      <PageSeo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={canonicalPath}
        image={sharingImage}
        type="website"
        noIndex={!isPublished}
        brandName={brandName}
      />

      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-[calc(100vh-5rem)] overflow-x-hidden bg-slate-50 px-4 py-10 sm:py-14"
      >
        <article className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          {isLoading ? (
            <div
              role="status"
              aria-live="polite"
              className="space-y-3"
            >
              <span className="sr-only">
                Loading {defaultTitle}...
              </span>

              <div className="h-7 w-48 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
            </div>
          ) : isPublished ? (
            <>
              <header className="border-b border-slate-200 pb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
                  Legal
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {title}
                </h1>
              </header>

              <div className="mt-6 space-y-5 text-[15px] leading-7 text-slate-700">
                {contentBlocks.map((block, index) => (
                  <p
                    key={`${pageKey}-${index}`}
                    className="whitespace-pre-line break-words"
                  >
                    {block}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <div className="py-10 text-center sm:py-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
                Legal
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-950">
                {defaultTitle}
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                This legal page is not published yet.
              </p>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </>
  );
}

export default LegalPage;