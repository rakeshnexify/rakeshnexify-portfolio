import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import useSiteSettings from "../hooks/useSiteSettings";

function slugify(value, fallback = "section") {
  const slug = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function formatPublishedDate(value) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function createStructuredLegalContent(value) {
  const sourceBlocks = String(value || "")
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const intro = [];
  const sections = [];
  let currentSection = null;

  function ensureSection() {
    if (!currentSection) {
      currentSection = {
        id: "overview",
        title: "Overview",
        blocks: [],
      };
      sections.push(currentSection);
    }

    return currentSection;
  }

  sourceBlocks.forEach((block, blockIndex) => {
    const lines = block
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      return;
    }

    if (lines.length === 1 && /^##\s+/.test(lines[0])) {
      const title = lines[0].replace(/^##\s+/, "").trim();

      currentSection = {
        id: slugify(title, `section-${blockIndex + 1}`),
        title,
        blocks: [],
      };

      sections.push(currentSection);
      return;
    }

    if (lines.length === 1 && /^###\s+/.test(lines[0])) {
      ensureSection().blocks.push({
        type: "subheading",
        text: lines[0].replace(/^###\s+/, "").trim(),
      });
      return;
    }

    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      ensureSection().blocks.push({
        type: "unordered-list",
        items: lines.map((line) => line.replace(/^[-*]\s+/, "").trim()),
      });
      return;
    }

    if (lines.every((line) => /^\d+\.\s+/.test(line))) {
      ensureSection().blocks.push({
        type: "ordered-list",
        items: lines.map((line) => line.replace(/^\d+\.\s+/, "").trim()),
      });
      return;
    }

    const paragraph = lines.join(" ").trim();

    if (!paragraph) {
      return;
    }

    if (currentSection) {
      currentSection.blocks.push({
        type: "paragraph",
        text: paragraph,
      });
      return;
    }

    intro.push(paragraph);
  });

  if (!sections.length && intro.length) {
    sections.push({
      id: "overview",
      title: "Overview",
      blocks: intro.map((text) => ({
        type: "paragraph",
        text,
      })),
    });

    intro.length = 0;
  }

  return {
    intro,
    sections,
  };
}

function renderSectionBlock(block, keyPrefix) {
  if (block.type === "subheading") {
    return (
      <h3
        key={`${keyPrefix}-heading`}
        className="text-base font-semibold tracking-tight text-white sm:text-lg"
      >
        {block.text}
      </h3>
    );
  }

  if (block.type === "unordered-list") {
    return (
      <ul
        key={`${keyPrefix}-unordered`}
        className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-300 marker:text-brand-400"
      >
        {block.items.map((item, itemIndex) => (
          <li key={`${keyPrefix}-unordered-${itemIndex}`}>{item}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "ordered-list") {
    return (
      <ol
        key={`${keyPrefix}-ordered`}
        className="list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-300 marker:text-brand-400"
      >
        {block.items.map((item, itemIndex) => (
          <li key={`${keyPrefix}-ordered-${itemIndex}`}>{item}</li>
        ))}
      </ol>
    );
  }

  return (
    <p
      key={`${keyPrefix}-paragraph`}
      className="text-sm leading-7 text-slate-300"
    >
      {block.text}
    </p>
  );
}

function LegalPage({ pageKey, canonicalPath, defaultTitle }) {
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

  const { intro, sections } = createStructuredLegalContent(
    legalPage.content,
  );

  const summary =
    intro[0] ||
    seoDescription ||
    `Review the ${title} for ${brandName}.`;

  const publishedDateLabel = formatPublishedDate(
    legalPage.publishedAt,
  );

  const contactEmail = String(settings?.contact?.email || "").trim();
  const contactPhone = String(settings?.contact?.phone || "").trim();

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
        className="min-h-[calc(100vh-5rem)] overflow-x-hidden bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <section className="rounded-[24px] border border-slate-800 bg-[linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.94))] px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.35)] sm:px-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-300">
                  Legal
                </span>

                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                  {isPublished ? "Published" : "Draft"}
                </span>

                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                  Updated {publishedDateLabel}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2 xl:flex-row xl:items-baseline xl:gap-5">
                <h1 className="shrink-0 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {title}
                </h1>

                <p className="max-w-4xl text-sm leading-6 text-slate-300">
                  {summary}
                </p>
              </div>
            </div>
          </section>

          {isLoading ? (
            <section className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-6 shadow-sm sm:p-8">
              <div
                role="status"
                aria-live="polite"
                className="space-y-3"
              >
                <span className="sr-only">
                  Loading {defaultTitle}...
                </span>

                <div className="h-8 w-56 animate-pulse rounded bg-slate-800 motion-reduce:animate-none" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-800/80 motion-reduce:animate-none" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-slate-800/80 motion-reduce:animate-none" />
              </div>
            </section>
          ) : !isPublished ? (
            <section className="rounded-[24px] border border-slate-800 bg-slate-900/80 p-6 shadow-sm sm:p-8">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">
                  Legal
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                  {defaultTitle}
                </h2>

                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                  This legal page is not published yet. Add full content in Admin, review it and enable the Published toggle when it is ready for the public website.
                </p>
              </div>
            </section>
          ) : (
            <>

              <article className="space-y-4">
                {intro.length > 0 && (
                  <section className="rounded-[22px] border border-slate-800 bg-slate-900/70 p-5 shadow-sm sm:p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-300">
                      Introduction
                    </p>

                    <div className="mt-3 space-y-4">
                      {intro.map((paragraph, index) => (
                        <p
                          key={`intro-${index}`}
                          className="text-sm leading-7 text-slate-300"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                )}

                {sections.map((section, index) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-36 rounded-[22px] border border-slate-800 bg-slate-900/70 p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-wrap items-start gap-3 border-b border-slate-800 pb-4">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand-400/30 bg-brand-500/10 text-[11px] font-bold text-brand-200">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                          Section
                        </p>

                        <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
                          {section.title}
                        </h2>
                      </div>
                    </div>

                    <div className="mt-4 space-y-4">
                      {section.blocks.map((block, blockIndex) =>
                        renderSectionBlock(
                          block,
                          `${section.id}-${blockIndex}`,
                        ),
                      )}
                    </div>
                  </section>
                ))}
              </article>

              <section className="rounded-[22px] border border-slate-800 bg-slate-900/70 px-4 py-4 shadow-sm sm:px-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-center">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Status
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">
                      Published
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Last updated
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">
                      {publishedDateLabel}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Website
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-white">
                      {brandName}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Email
                    </p>
                    {contactEmail ? (
                      <a
                        href={`mailto:${contactEmail}`}
                        className="mt-1 block truncate text-sm font-semibold text-brand-300 transition hover:text-brand-200"
                      >
                        {contactEmail}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-slate-500">â€”</p>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Phone
                    </p>
                    {contactPhone ? (
                      <a
                        href={`tel:${contactPhone}`}
                        className="mt-1 block truncate text-sm font-semibold text-brand-300 transition hover:text-brand-200"
                      >
                        {contactPhone}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-slate-500">â€”</p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default LegalPage;