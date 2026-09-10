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
        className="text-lg font-semibold tracking-tight text-white"
      >
        {block.text}
      </h3>
    );
  }

  if (block.type === "unordered-list") {
    return (
      <ul
        key={`${keyPrefix}-unordered`}
        className="space-y-2 pl-5 text-sm leading-7 text-slate-300 marker:text-brand-400 list-disc"
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
        className="space-y-2 pl-5 text-sm leading-7 text-slate-300 marker:text-brand-400 list-decimal"
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
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.2),_transparent_30%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.98))] shadow-[0_24px_80px_rgba(15,23,42,0.45)]">
            <div className="border-b border-white/10 px-5 py-3 sm:px-8">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-brand-300">
                  Legal
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                  {isPublished ? "Published" : "Draft"}
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                  Updated {publishedDateLabel}
                </span>
              </div>
            </div>

            <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-end">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-300">
                    Legal Document
                  </p>

                  <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[3.1rem]">
                    {title}
                  </h1>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-[15px]">
                    {summary}
                  </p>
                </div>

                <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Reading notes
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-200">
                      This page can show sections, subheadings, bullet lists and numbered clauses.
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3">
                    <p className="text-xs font-semibold text-emerald-200">
                      Tip:
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-100/90">
                      Use the Admin template buttons to create a full professional legal structure quickly, then edit the text as needed.
                    </p>
                  </div>
                </div>
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
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-800/80 motion-reduce:animate-none" />
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
            <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">
                    Quick navigation
                  </p>

                  <div className="mt-4 space-y-2">
                    {sections.map((section, index) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 transition hover:border-brand-500/50 hover:bg-slate-900"
                      >
                        <span className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-300">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-sm leading-5 text-slate-200">
                          {section.title}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">
                    Document details
                  </p>

                  <dl className="mt-4 grid gap-3 text-sm">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Status
                      </dt>
                      <dd className="mt-1 text-slate-100">
                        Published
                      </dd>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Last updated
                      </dt>
                      <dd className="mt-1 text-slate-100">
                        {publishedDateLabel}
                      </dd>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Website
                      </dt>
                      <dd className="mt-1 text-slate-100">
                        {brandName}
                      </dd>
                    </div>
                  </dl>
                </div>

                {(contactEmail || contactPhone) && (
                  <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-5 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">
                      Legal contact
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      For policy or terms questions, use the contact details below.
                    </p>

                    <div className="mt-4 space-y-2 text-sm text-slate-100">
                      {contactEmail && (
                        <a
                          href={`mailto:${contactEmail}`}
                          className="block rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 transition hover:border-brand-500/50"
                        >
                          {contactEmail}
                        </a>
                      )}

                      {contactPhone && (
                        <a
                          href={`tel:${contactPhone}`}
                          className="block rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 transition hover:border-brand-500/50"
                        >
                          {contactPhone}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </aside>

              <article className="space-y-5">
                {intro.length > 0 && (
                  <section className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-5 shadow-sm sm:p-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">
                      Introduction
                    </p>

                    <div className="mt-4 space-y-4">
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
                    className="scroll-mt-24 rounded-[24px] border border-slate-800 bg-slate-900/70 p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-wrap items-start gap-3 border-b border-slate-800 pb-4">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-400/30 bg-brand-500/10 text-xs font-bold text-brand-200">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                          Section
                        </p>
                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
                          {section.title}
                        </h2>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
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
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default LegalPage;