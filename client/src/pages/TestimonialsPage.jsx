import { useMemo, useState } from "react";
import { Link } from "react-router";

import Container from "../components/layout/Container";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import TestimonialCard, {
  normalizeRating,
} from "../components/testimonials/TestimonialCard";
import useSiteSettings from "../hooks/useSiteSettings";
import useTestimonials from "../hooks/useTestimonials";

const defaultPageContent = {
  eyebrow: "Client Testimonials",
  heading: "What clients say about working with me",
  description:
    "Explore published client feedback, project experiences and ratings from people and businesses I have worked with.",
};

const defaultKeywords = [
  "RakeshNexify testimonials",
  "Rakesh Pandit client reviews",
  "web developer testimonials",
  "MERN developer reviews",
  "WordPress developer reviews",
  "freelance developer testimonials",
  "client feedback web development",
];

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Testimonials could not be loaded.";
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function TestimonialsLoadingState() {
  return (
    <>
      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <Container>
          <div className="py-16 sm:py-20">
            <div className="h-6 w-44 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-6 h-14 max-w-3xl animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-5 h-24 max-w-2xl animate-pulse rounded-xl bg-slate-200" />

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-96 animate-pulse rounded-3xl bg-slate-200"
                />
              ))}
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}

function TestimonialsPage() {
  const { settings } = useSiteSettings();

  const [searchInput, setSearchInput] = useState("");
  const [ratingInput, setRatingInput] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    rating: undefined,
  });

  const {
    testimonials,
    isLoading,
    error,
    refreshTestimonials,
  } = useTestimonials(filters);

  const brand = settings?.brand || {};
  const owner = settings?.owner || {};
  const sectionContent = settings?.testimonialsSection || {};
  const seo =
    settings?.seo && typeof settings.seo === "object" ? settings.seo : {};

  const brandName = cleanText(brand.name) || "RakeshNexify";
  const ownerName = cleanText(owner.name) || "Rakesh Pandit";

  const eyebrow =
    cleanText(sectionContent.eyebrow) ||
    defaultPageContent.eyebrow;

  const heading =
    cleanText(sectionContent.heading || sectionContent.title) ||
    defaultPageContent.heading;

  const description =
    cleanText(sectionContent.description) ||
    defaultPageContent.description;

  const publicTestimonials = Array.isArray(testimonials)
    ? testimonials
    : [];

  const hasActiveFilters = Boolean(
    cleanText(filters.search) || filters.rating,
  );

  const validRatingValues = useMemo(() => {
    return publicTestimonials
      .map((testimonial) => normalizeRating(testimonial?.rating))
      .filter((rating) => rating > 0);
  }, [publicTestimonials]);

  const averageRating = useMemo(() => {
    if (validRatingValues.length === 0) {
      return 0;
    }

    const total = validRatingValues.reduce(
      (sum, rating) => sum + rating,
      0,
    );

    return total / validRatingValues.length;
  }, [validRatingValues]);

  const structuredTestimonials = useMemo(() => {
    if (hasActiveFilters) {
      return [];
    }

    const validReviews = publicTestimonials.flatMap((testimonial) => {
      const rating = normalizeRating(testimonial?.rating);
      const reviewText = cleanText(testimonial?.reviewText);
      const clientName = cleanText(testimonial?.clientName);
      const clientRole = cleanText(testimonial?.clientRole);
      const companyName = cleanText(testimonial?.companyName);

      if (!rating || !reviewText || !clientName) {
        return [];
      }

      return [
        {
          "@type": "Review",
          author: {
            "@type": "Person",
            name: clientName,
            ...(clientRole ? { jobTitle: clientRole } : {}),
            ...(companyName
              ? {
                  affiliation: {
                    "@type": "Organization",
                    name: companyName,
                  },
                }
              : {}),
          },
          itemReviewed: {
            "@type": "Person",
            name: ownerName,
            url: "https://rakeshnexify.com/",
          },
          reviewBody: reviewText,
          reviewRating: {
            "@type": "Rating",
            ratingValue: rating,
            bestRating: 5,
            worstRating: 1,
          },
        },
      ];
    });

    return validReviews.map((review, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: review,
    }));
  }, [hasActiveFilters, ownerName, publicTestimonials]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${heading} | ${brandName}`,
    description,
    url: "https://rakeshnexify.com/testimonials",
    about: {
      "@type": "Person",
      name: ownerName,
      url: "https://rakeshnexify.com/",
    },
    ...(!hasActiveFilters
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: structuredTestimonials.length,
            itemListElement: structuredTestimonials,
          },
        }
      : {}),
  };

  function handleFilterSubmit(event) {
    event.preventDefault();

    setFilters({
      search: searchInput.trim(),
      rating: /^[1-5]$/.test(ratingInput)
        ? ratingInput
        : undefined,
    });
  }

  function handleClearFilters() {
    setSearchInput("");
    setRatingInput("");
    setFilters({
      search: "",
      rating: undefined,
    });
  }

  if (isLoading && publicTestimonials.length === 0) {
    return <TestimonialsLoadingState />;
  }

  return (
    <>
      <PageSeo
        title={`Testimonials | ${brandName}`}
        description={description}
        keywords={defaultKeywords}
        canonicalPath="/testimonials"
        image={cleanText(seo.ogImageUrl)}
        type="website"
        brandName={brandName}
        structuredData={structuredData}
      />

      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <section className="bg-slate-950 py-14 text-white sm:py-18">
          <Container>
            <div className="max-w-4xl">
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
                <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                  {publicTestimonials.length}{" "}
                  {hasActiveFilters
                    ? publicTestimonials.length === 1
                      ? "Matching Testimonial"
                      : "Matching Testimonials"
                    : publicTestimonials.length === 1
                      ? "Testimonial"
                      : "Testimonials"}
                </span>

                {averageRating > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">
                    {averageRating.toFixed(1)} average rating
                  </span>
                )}
              </div>
            </div>
          </Container>
        </section>

        <section className="border-b border-slate-200 bg-white py-6">
          <Container>
            <form
              onSubmit={handleFilterSubmit}
              className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_auto]"
            >
              <div>
                <label
                  htmlFor="testimonials-search"
                  className="text-sm font-semibold text-slate-700"
                >
                  Search Testimonials
                </label>

                <input
                  id="testimonials-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Client, company or review"
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                />
              </div>

              <div>
                <label
                  htmlFor="testimonials-rating"
                  className="text-sm font-semibold text-slate-700"
                >
                  Rating
                </label>

                <select
                  id="testimonials-rating"
                  value={ratingInput}
                  onChange={(event) => setRatingInput(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                >
                  <option value="">All ratings</option>
                  <option value="5">5 stars</option>
                  <option value="4">4 stars</option>
                  <option value="3">3 stars</option>
                  <option value="2">2 stars</option>
                  <option value="1">1 star</option>
                </select>
              </div>

              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Apply
                </button>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={isLoading}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Clear
                </button>
              </div>
            </form>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            {error && (
              <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-800">
                    Testimonials could not be loaded
                  </p>

                  <p className="mt-1 break-words text-sm leading-6 text-amber-700">
                    {getErrorMessage(error)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshTestimonials}
                  disabled={isLoading}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </button>
              </div>
            )}

            {publicTestimonials.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {publicTestimonials.map((testimonial, index) => (
                  <TestimonialCard
                    key={
                      testimonial._id ||
                      testimonial.id ||
                      `${testimonial.clientName}-${index}`
                    }
                    testimonial={testimonial}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                  0
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-950">
                  No Testimonials found
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                  Try clearing the current filters, or check back after new
                  client feedback is published.
                </p>

                {(filters.search || filters.rating) && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            <div className="mt-12 rounded-3xl bg-slate-950 px-6 py-10 text-center text-white sm:px-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                Start Your Project
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to build something valuable together?
              </h2>

              <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">
                Share your project requirements and we can discuss the right
                solution, timeline and development approach.
              </p>

              <Link
                to="/#contact"
                className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Start a Project
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default TestimonialsPage;
