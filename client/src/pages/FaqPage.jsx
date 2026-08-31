import { useMemo, useState } from "react";

import FaqAccordion from "../components/faqs/FaqAccordion";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import Container from "../components/layout/Container";
import PageSeo from "../components/seo/PageSeo";
import useFaqs from "../hooks/useFaqs";
import useSiteSettings from "../hooks/useSiteSettings";

const SITE_URL = "https://rakeshnexify.com";

const defaultContent = {
  eyebrow: "Frequently Asked Questions",
  heading: "Answers to common questions",
  description:
    "Browse common questions about development, pricing, project timelines, support and working together.",
};

const defaultKeywords = [
  "frequently asked questions",
  "MERN development FAQ",
  "website development questions",
  "website pricing FAQ",
  "RakeshNexify FAQ",
];

function cleanText(value) {
  return String(value || "").trim();
}

function FaqPage() {
  const { faqs, isLoading, error, refreshFaqs } = useFaqs();
  const { settings } = useSiteSettings();

  const [searchInput, setSearchInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("all");
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
  });

  const sectionContent = settings?.faqSection || {};
  const brandName = cleanText(settings?.brand?.name) || "RakeshNexify";
  const seo = settings?.seo || {};

  const eyebrow =
    cleanText(sectionContent.eyebrow) || defaultContent.eyebrow;

  const heading =
    cleanText(sectionContent.heading || sectionContent.title) ||
    defaultContent.heading;

  const description =
    cleanText(sectionContent.description) || defaultContent.description;

  const publicFaqs = useMemo(
    () => (Array.isArray(faqs) ? faqs : []),
    [faqs],
  );

  const categories = useMemo(() => {
    const categoryMap = new Map();

    publicFaqs.forEach((faq) => {
      const category = cleanText(faq?.category);

      if (!category) {
        return;
      }

      const key = category.toLowerCase();

      if (!categoryMap.has(key)) {
        categoryMap.set(key, category);
      }
    });

    return [...categoryMap.values()].sort((first, second) =>
      first.localeCompare(second, undefined, {
        sensitivity: "base",
      }),
    );
  }, [publicFaqs]);

  const filteredFaqs = useMemo(() => {
    const search = filters.search.toLowerCase();
    const selectedCategory = filters.category.toLowerCase();

    return publicFaqs.filter((faq) => {
      const question = cleanText(faq?.question);
      const answer = cleanText(faq?.answer);
      const category = cleanText(faq?.category);

      const matchesSearch =
        !search ||
        question.toLowerCase().includes(search) ||
        answer.toLowerCase().includes(search) ||
        category.toLowerCase().includes(search);

      const matchesCategory =
        selectedCategory === "all" ||
        category.toLowerCase() === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [filters, publicFaqs]);

  const hasActiveFilters =
    Boolean(filters.search) || filters.category !== "all";

  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: `${heading} | ${brandName}`,
      description,
      url: `${SITE_URL}/faq`,
      isPartOf: {
        "@type": "WebSite",
        name: brandName,
        url: `${SITE_URL}/`,
      },
      mainEntity: publicFaqs
        .filter(
          (faq) =>
            cleanText(faq?.question) &&
            cleanText(faq?.answer),
        )
        .map((faq) => ({
          "@type": "Question",
          name: cleanText(faq.question),
          acceptedAnswer: {
            "@type": "Answer",
            text: cleanText(faq.answer),
          },
        })),
    }),
    [brandName, description, heading, publicFaqs],
  );

  function handleFilterSubmit(event) {
    event.preventDefault();

    setFilters({
      search: searchInput.trim(),
      category: categoryInput || "all",
    });
  }

  function handleClearFilters() {
    setSearchInput("");
    setCategoryInput("all");
    setFilters({
      search: "",
      category: "all",
    });
  }

  return (
    <>
      <PageSeo
        title={`FAQ | ${brandName}`}
        description={description}
        keywords={defaultKeywords}
        canonicalPath="/faq"
        image={cleanText(seo.ogImageUrl)}
        type="website"
        brandName={brandName}
        structuredData={hasActiveFilters ? null : structuredData}
      />

      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl" />

          <Container>
            <div className="relative max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                {eyebrow}
              </p>

              <h1 className="mt-4 break-words text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {heading}
              </h1>

              <p className="mt-6 max-w-3xl break-words text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                  {publicFaqs.length} {publicFaqs.length === 1 ? "FAQ" : "FAQs"}
                </span>

                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                  {categories.length}{" "}
                  {categories.length === 1 ? "Category" : "Categories"}
                </span>
              </div>
            </div>
          </Container>
        </section>

        <section className="border-b border-slate-200 bg-white py-6">
          <Container>
            <form
              onSubmit={handleFilterSubmit}
              className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem_auto]"
            >
              <div>
                <label
                  htmlFor="faq-public-search"
                  className="text-sm font-semibold text-slate-700"
                >
                  Search FAQs
                </label>

                <input
                  id="faq-public-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search questions or answers"
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                />
              </div>

              <div>
                <label
                  htmlFor="faq-public-category"
                  className="text-sm font-semibold text-slate-700"
                >
                  Category
                </label>

                <select
                  id="faq-public-category"
                  value={categoryInput}
                  onChange={(event) => setCategoryInput(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-600"
                >
                  <option value="all">All Categories</option>

                  {categories.map((category) => (
                    <option key={category.toLowerCase()} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="min-h-11 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white"
                >
                  Apply
                </button>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-600"
                >
                  Clear
                </button>
              </div>
            </form>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            <div className="mx-auto max-w-4xl">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-500" aria-live="polite">
                  {isLoading
                    ? "Loading FAQs..."
                    : hasActiveFilters
                      ? `${filteredFaqs.length} matching FAQ(s)`
                      : `${publicFaqs.length} published FAQ(s)`}
                </p>
              </div>

              {error && (
                <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-amber-800">
                      FAQs could not be loaded
                    </p>
                    <p className="mt-1 text-sm text-amber-700">{error}</p>
                  </div>

                  <button
                    type="button"
                    onClick={refreshFaqs}
                    disabled={isLoading}
                    className="min-h-10 rounded-xl border border-amber-300 bg-white px-4 text-sm font-bold text-amber-800 disabled:opacity-60"
                  >
                    Retry
                  </button>
                </div>
              )}

              {isLoading && publicFaqs.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="h-24 animate-pulse rounded-2xl bg-slate-200"
                    />
                  ))}
                </div>
              ) : (
                !error && (
                  <FaqAccordion
                    faqs={filteredFaqs}
                    emptyMessage={
                      hasActiveFilters
                        ? "No FAQs match the current filters."
                        : "No public FAQs are available yet."
                    }
                  />
                )
              )}
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default FaqPage;
