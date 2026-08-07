import { useMemo, useState } from "react";
import { Link } from "react-router";

import Container from "../components/layout/Container";
import { mergeHomepageSections } from "../config/homepageSections";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PostCard from "../components/posts/PostCard";
import PageSeo from "../components/seo/PageSeo";
import usePosts from "../hooks/usePosts";
import useSiteSettings from "../hooks/useSiteSettings";

const SITE_URL = "https://rakeshnexify.com";

const pageContentByType = {
  blog: {
    eyebrow: "Blog",
    heading: "Practical web development articles, guides and insights",
    description:
      "Explore MERN, React, Node.js, MongoDB, WordPress and modern web development articles published from the RakeshNexify Admin Panel.",
    emptyTitle: "No public Blog posts available",
    emptyDescription:
      "Blog articles will appear here after they are created and published from the Admin Panel.",
    errorLabel: "Blog Error",
    typeLabel: "Blog",
    canonicalPath: "/blog",
  },
  news: {
    eyebrow: "News",
    heading: "Latest updates, announcements and development news",
    description:
      "Read project updates, RakeshNexify announcements, technology updates and other published News from the shared dynamic Post system.",
    emptyTitle: "No public News posts available",
    emptyDescription:
      "News articles will appear here after they are created and published from the Admin Panel.",
    errorLabel: "News Error",
    typeLabel: "News",
    canonicalPath: "/news",
  },
};

const defaultKeywordsByType = {
  blog: [
    "RakeshNexify blog",
    "MERN development blog",
    "React articles",
    "Node.js articles",
    "MongoDB articles",
    "WordPress development blog",
    "web development guides",
  ],
  news: [
    "RakeshNexify news",
    "web development news",
    "project updates",
    "technology updates",
    "development announcements",
  ],
};

const initialFilters = {
  search: "",
  category: "",
  tag: "",
  featured: "all",
};

function createAbsoluteSiteUrl(pathname) {
  const safePath = String(pathname || "").trim();

  if (!safePath || safePath === "/") {
    return `${SITE_URL}/`;
  }

  return `${SITE_URL}${safePath.startsWith("/") ? safePath : `/${safePath}`}`;
}

function createStructuredDataImageUrl(value) {
  const imageUrl = String(value || "").trim();

  if (!imageUrl) {
    return "";
  }

  return imageUrl.startsWith("/") ? `${SITE_URL}${imageUrl}` : imageUrl;
}

function createApiFilters(type, filters) {
  const apiFilters = {
    type,
    search: filters.search.trim(),
    category: filters.category.trim(),
    tag: filters.tag.trim(),
  };

  if (filters.featured === "featured") {
    apiFilters.featured = true;
  }

  if (filters.featured === "standard") {
    apiFilters.featured = false;
  }

  return apiFilters;
}

function getErrorMessage(error, typeLabel) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return `${typeLabel} posts could not be loaded.`;
}

function PostsLoadingState({ typeLabel }) {
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
            <div className="h-6 w-32 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-6 h-14 max-w-3xl animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-5 h-24 max-w-2xl animate-pulse rounded-xl bg-slate-200" />

            <p className="sr-only">Loading {typeLabel} posts...</p>

            <div className="mt-12 grid min-w-0 gap-7 [&>*]:min-w-0 lg:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-[34rem] animate-pulse rounded-3xl bg-slate-200"
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

function PostsErrorState({
  error,
  typeLabel,
  canonicalPath,
  onRetry,
  isRetrying,
  showAlternatePageLink,
}) {
  return (
    <>
      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[calc(100vh-5rem)] overflow-x-hidden place-items-center bg-slate-50 px-4 py-12"
      >
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-red-600">
            !
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            {typeLabel} Error
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
            {typeLabel} posts could not be loaded
          </h1>

          <p className="mt-4 break-words leading-7 text-slate-600">
            {getErrorMessage(error, typeLabel)}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isRetrying ? "Retrying..." : "Retry"}
            </button>

            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
            >
              Return Home
            </Link>

            {showAlternatePageLink && (
              <Link
                to={canonicalPath === "/blog" ? "/news" : "/blog"}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
              >
                View {canonicalPath === "/blog" ? "News" : "Blog"}
              </Link>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function PostsListingPage({ type }) {
  const pageContent = pageContentByType[type] || pageContentByType.blog;

  const [formFilters, setFormFilters] = useState({ ...initialFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...initialFilters });

  const apiFilters = useMemo(
    () => createApiFilters(type, appliedFilters),
    [appliedFilters, type],
  );

  const { posts, isLoading, error, refreshPosts } = usePosts(apiFilters);
  const { settings } = useSiteSettings();

  const publicationSections = useMemo(
    () => mergeHomepageSections(settings?.sections),
    [settings?.sections],
  );

  const alternatePageKey = type === "blog" ? "news" : "blog";

  const isAlternatePageVisible =
    publicationSections.find((section) => section.key === alternatePageKey)
      ?.isPageVisible !== false;

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

  const seoKeywords = [
    ...globalKeywords,
    ...(defaultKeywordsByType[type] || defaultKeywordsByType.blog),
  ];

  const seoTitle = `${pageContent.typeLabel} | ${brandName}`;
  const socialSharingImage = String(globalSeo.ogImageUrl || "").trim();

  const isCanonicalListingState =
    !appliedFilters.search.trim() &&
    !appliedFilters.category.trim() &&
    !appliedFilters.tag.trim() &&
    appliedFilters.featured === "all";

  const listingStructuredData = useMemo(() => {
    const sourcePosts = Array.isArray(posts) ? posts : [];

    const eligiblePosts = sourcePosts
      .map((post) => {
        const postSlug = String(post?.slug || "").trim();

        if (!postSlug || post?.type !== type) {
          return null;
        }

        return {
          slug: postSlug,
          title:
            String(post?.title || "").trim() ||
            `${pageContent.typeLabel} Post`,
        };
      })
      .filter(Boolean);

    const itemListElements = eligiblePosts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: createAbsoluteSiteUrl(
        `/${type}/${encodeURIComponent(post.slug)}`,
      ),
      name: post.title,
    }));

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seoTitle,
      headline: pageContent.heading,
      description: pageContent.description,
      url: createAbsoluteSiteUrl(pageContent.canonicalPath),
      isPartOf: {
        "@type": "WebSite",
        name: brandName,
        url: `${SITE_URL}/`,
      },
      mainEntity: {
        "@type": "ItemList",
        name: `${brandName} ${pageContent.typeLabel} Posts`,
        numberOfItems: itemListElements.length,
        itemListElement: itemListElements,
      },
    };

    const structuredDataImage =
      createStructuredDataImageUrl(socialSharingImage);

    if (structuredDataImage) {
      structuredData.image = structuredDataImage;
    }

    return structuredData;
  }, [
    brandName,
    pageContent.canonicalPath,
    pageContent.description,
    pageContent.heading,
    pageContent.typeLabel,
    posts,
    seoTitle,
    socialSharingImage,
    type,
  ]);

  const shouldEmitListingStructuredData =
    isCanonicalListingState && !isLoading && !error;

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function handleFilterSubmit(event) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setAppliedFilters({ ...formFilters });
  }

  function handleClearFilters() {
    if (isLoading) {
      return;
    }

    setFormFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
  }

  if (isLoading && posts.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={pageContent.description}
          keywords={seoKeywords}
          canonicalPath={pageContent.canonicalPath}
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <PostsLoadingState typeLabel={pageContent.typeLabel} />
      </>
    );
  }

  if (error && posts.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={pageContent.description}
          keywords={seoKeywords}
          canonicalPath={pageContent.canonicalPath}
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <PostsErrorState
          error={error}
          typeLabel={pageContent.typeLabel}
          canonicalPath={pageContent.canonicalPath}
          onRetry={refreshPosts}
          isRetrying={isLoading}
          showAlternatePageLink={isAlternatePageVisible}
        />
      </>
    );
  }

  return (
    <>
      <PageSeo
        title={seoTitle}
        description={pageContent.description}
        keywords={seoKeywords}
        canonicalPath={pageContent.canonicalPath}
        image={socialSharingImage}
        type="website"
        brandName={brandName}
        structuredData={
          shouldEmitListingStructuredData ? listingStructuredData : undefined
        }
      />

      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute -bottom-40 left-10 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

          <Container>
            <div className="relative min-w-0 max-w-4xl">
              <p className="break-words text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                {pageContent.eyebrow}
              </p>

              <h1 className="mt-4 break-words text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {pageContent.heading}
              </h1>

              <p className="mt-6 max-w-3xl break-words text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {pageContent.description}
              </p>

              <div className="mt-8 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <span className="inline-flex max-w-full items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-center text-sm font-semibold text-slate-200">
                  {posts.length} Public{" "}
                  {posts.length === 1
                    ? `${pageContent.typeLabel} Post`
                    : `${pageContent.typeLabel} Posts`}
                </span>

                {isAlternatePageVisible && (
                  <Link
                    to={type === "blog" ? "/news" : "/blog"}
                    className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    View {type === "blog" ? "News" : "Blog"}
                  </Link>
                )}
              </div>
            </div>
          </Container>
        </section>

        <section className="border-b border-slate-200 bg-white py-8">
          <Container>
            <form
              onSubmit={handleFilterSubmit}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label
                    htmlFor={`${type}-search`}
                    className="text-sm font-semibold text-slate-700"
                  >
                    Search
                  </label>

                  <input
                    id={`${type}-search`}
                    name="search"
                    type="search"
                    value={formFilters.search}
                    onChange={handleFilterChange}
                    placeholder="Search published posts"
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${type}-category`}
                    className="text-sm font-semibold text-slate-700"
                  >
                    Category
                  </label>

                  <input
                    id={`${type}-category`}
                    name="category"
                    type="text"
                    value={formFilters.category}
                    onChange={handleFilterChange}
                    placeholder="Exact category"
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${type}-tag`}
                    className="text-sm font-semibold text-slate-700"
                  >
                    Tag
                  </label>

                  <input
                    id={`${type}-tag`}
                    name="tag"
                    type="text"
                    value={formFilters.tag}
                    onChange={handleFilterChange}
                    placeholder="Exact tag"
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${type}-featured`}
                    className="text-sm font-semibold text-slate-700"
                  >
                    Featured
                  </label>

                  <select
                    id={`${type}-featured`}
                    name="featured"
                    value={formFilters.featured}
                    onChange={handleFilterChange}
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  >
                    <option value="all">All posts</option>
                    <option value="featured">Featured only</option>
                    <option value="standard">Standard only</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply Filters
                </button>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={isLoading}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear Filters
                </button>

                <button
                  type="button"
                  onClick={refreshPosts}
                  disabled={isLoading}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </form>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            {posts.length > 0 ? (
              <div className="grid min-w-0 gap-7 [&>*]:min-w-0 lg:grid-cols-2">
                {posts.map((post, index) => (
                  <PostCard
                    key={
                      post._id ||
                      post.id ||
                      post.slug ||
                      `${post.title}-${index}`
                    }
                    post={post}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                  0
                </div>

                <h2 className="mt-6 break-words text-2xl font-bold tracking-tight text-slate-950">
                  {pageContent.emptyTitle}
                </h2>

                <p className="mx-auto mt-3 max-w-xl break-words leading-7 text-slate-600">
                  {pageContent.emptyDescription}
                </p>
              </div>
            )}
          </Container>
        </section>

        <section className="border-t border-slate-200 bg-white py-14">
          <Container>
            <div className="rounded-3xl bg-slate-950 px-6 py-10 text-center text-white sm:px-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                RakeshNexify
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl break-words text-2xl font-bold tracking-tight sm:text-4xl">
                Need help with a website or MERN application?
              </h2>

              <p className="mx-auto mt-5 max-w-2xl break-words leading-7 text-slate-300">
                Discuss your project goals, required features and development
                requirements directly through the portfolio contact section.
              </p>

              <Link
                to="/#contact"
                className="mt-7 inline-flex min-h-12 max-w-full items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Contact Me
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}

function BlogPage() {
  return <PostsListingPage type="blog" />;
}

export { PostsListingPage };
export default BlogPage;
