import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import Container from "../components/layout/Container";
import PublicPageCTA from "../components/layout/PublicPageCTA";
import { mergeHomepageSections } from "../config/homepageSections";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import { formatPostDate } from "../components/posts/PostCard";
import PageSeo from "../components/seo/PageSeo";
import usePost from "../hooks/usePost";
import useSiteSettings from "../hooks/useSiteSettings";

const SITE_URL = "https://rakeshnexify.com";

const defaultPostSeo = {
  blog: {
    description:
      "Read this RakeshNexify web development article, including practical insights, guidance and development experience.",
    keywords: [
      "web development article",
      "MERN article",
      "React article",
      "Node.js article",
      "RakeshNexify blog",
    ],
  },
  news: {
    description:
      "Read this RakeshNexify News update, announcement or development update.",
    keywords: [
      "RakeshNexify news",
      "development news",
      "project update",
      "technology update",
    ],
  },
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

function createIsoDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Post could not be loaded.";
}

function PostLoadingState() {
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
            <div className="mt-6 h-16 max-w-4xl animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-5 h-24 max-w-2xl animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-10 h-96 animate-pulse rounded-3xl bg-slate-200" />
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}

function PostErrorState({
  expectedType,
  error,
  status,
  isTypeMismatch,
  onRetry,
  isRetrying,
  showAlternatePageLink,
}) {
  const isNotFound = status === 404 || isTypeMismatch;
  const typeLabel = expectedType === "news" ? "News" : "Blog";
  const listingPath = expectedType === "news" ? "/news" : "/blog";

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
            {isNotFound ? `${typeLabel} Post Not Found` : "Post Error"}
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
            {isNotFound
              ? `This ${typeLabel} post is unavailable`
              : "Post could not be loaded"}
          </h1>

          <p className="mt-4 break-words leading-7 text-slate-600">
            {isTypeMismatch
              ? `The requested URL belongs to a different Post type and cannot be shown as ${typeLabel}.`
              : isNotFound
                ? "The Post may be hidden, deleted or the URL may be incorrect."
                : getErrorMessage(error)}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            {!isNotFound && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isRetrying ? "Retrying..." : "Retry"}
              </button>
            )}

            <Link
              to={listingPath}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
            >
              View All {typeLabel}
            </Link>

            {showAlternatePageLink && (
              <Link
                to={expectedType === "news" ? "/blog" : "/news"}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
              >
                View {expectedType === "news" ? "Blog" : "News"}
              </Link>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function PostDetailsPage({ expectedType = "blog" }) {
  const { slug } = useParams();
  const { post, isLoading, error, status, refreshPost } = usePost(slug);
  const { settings } = useSiteSettings();

  const featuredImageUrl = String(post?.featuredImageUrl || "").trim();
  const [hasFeaturedImageError, setHasFeaturedImageError] = useState(false);

  useEffect(() => {
    setHasFeaturedImageError(false);
  }, [featuredImageUrl]);

  const safeExpectedType = expectedType === "news" ? "news" : "blog";
  const typeLabel = safeExpectedType === "news" ? "News" : "Blog";

  const publicationSections = useMemo(
    () => mergeHomepageSections(settings?.sections),
    [settings?.sections],
  );

  const alternatePageKey = safeExpectedType === "news" ? "blog" : "news";

  const isAlternatePageVisible =
    publicationSections.find((section) => section.key === alternatePageKey)
      ?.isPageVisible !== false;

  const brandName =
    String(settings?.brand?.name || "").trim() || "RakeshNexify";

  const globalSeo =
    settings?.seo && typeof settings.seo === "object" ? settings.seo : {};

  const postSeo =
    post?.seo && typeof post.seo === "object" ? post.seo : {};

  const safeSlug = typeof slug === "string" ? slug.trim().toLowerCase() : "";

  const canonicalPath = safeSlug
    ? `/${safeExpectedType}/${encodeURIComponent(safeSlug)}`
    : `/${safeExpectedType}`;

  const globalKeywords = Array.isArray(globalSeo.keywords)
    ? globalSeo.keywords
    : String(globalSeo.keywords || "")
        .split(/[,\n]/)
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  const postKeywords = Array.isArray(postSeo.keywords)
    ? postSeo.keywords
    : String(postSeo.keywords || "")
        .split(/[,\n]/)
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  const tags = Array.isArray(post?.tags)
    ? post.tags.filter((tag) => typeof tag === "string" && tag.trim())
    : [];

  const defaultSeo = defaultPostSeo[safeExpectedType];

  const seoTitle =
    String(postSeo.title || "").trim() ||
    (post?.title
      ? `${post.title} | ${brandName}`
      : `${typeLabel} | ${brandName}`);

  const seoDescription =
    String(postSeo.description || post?.excerpt || "").trim() ||
    defaultSeo.description;

  const seoKeywords = [
    ...globalKeywords,
    ...postKeywords,
    ...tags,
    post?.category,
    post?.title,
    ...defaultSeo.keywords,
  ].filter(Boolean);

  const socialSharingImage = String(
    postSeo.ogImageUrl ||
      post?.featuredImageUrl ||
      globalSeo.ogImageUrl ||
      "",
  ).trim();

  const isTypeMismatch = Boolean(
    post && post.type !== safeExpectedType,
  );

  const postStructuredData = useMemo(() => {
    if (!post || post.type !== safeExpectedType || !safeSlug) {
      return undefined;
    }

    const postTitle =
      String(post.title || "").trim() || `${typeLabel} Post`;

    const canonicalUrl = createAbsoluteSiteUrl(canonicalPath);
    const listingUrl = createAbsoluteSiteUrl(`/${safeExpectedType}`);
    const publishedAt = createIsoDate(post.publishedAt);
    const updatedAt = createIsoDate(post.updatedAt);
    const structuredDataImage =
      createStructuredDataImageUrl(socialSharingImage);
    const authorName = String(post.authorName || "").trim();
    const category = String(post.category || "").trim();

    const structuredKeywords = [
      ...postKeywords,
      ...tags,
      category,
    ]
      .map((keyword) => String(keyword || "").trim())
      .filter(Boolean);

    const article = {
      "@context": "https://schema.org",
      "@type":
        safeExpectedType === "news" ? "NewsArticle" : "BlogPosting",
      headline: postTitle,
      description: seoDescription,
      url: canonicalUrl,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl,
      },
      isPartOf: {
        "@type": "CollectionPage",
        "@id": listingUrl,
        name: `${typeLabel} | ${brandName}`,
      },
      publisher: {
        "@type": "Organization",
        name: brandName,
        url: `${SITE_URL}/`,
      },
    };

    if (authorName) {
      article.author = {
        "@type": "Person",
        name: authorName,
      };
    }

    if (publishedAt) {
      article.datePublished = publishedAt;
    }

    if (updatedAt) {
      article.dateModified = updatedAt;
    }

    if (structuredDataImage) {
      article.image = structuredDataImage;
    }

    if (category) {
      article.articleSection = category;
    }

    if (structuredKeywords.length > 0) {
      article.keywords = [...new Set(structuredKeywords)].join(", ");
    }

    const breadcrumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${SITE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: typeLabel,
          item: listingUrl,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: postTitle,
          item: canonicalUrl,
        },
      ],
    };

    return [article, breadcrumbs];
  }, [
    brandName,
    canonicalPath,
    post,
    postKeywords,
    safeExpectedType,
    safeSlug,
    seoDescription,
    socialSharingImage,
    tags,
    typeLabel,
  ]);

  if (isLoading) {
    return (
      <>
        <PageSeo
          title={`${typeLabel} | ${brandName}`}
          description={defaultSeo.description}
          keywords={[...globalKeywords, ...defaultSeo.keywords]}
          canonicalPath={canonicalPath}
          image={String(globalSeo.ogImageUrl || "").trim()}
          type="article"
          brandName={brandName}
        />

        <PostLoadingState />
      </>
    );
  }

  if (error || !post || isTypeMismatch) {
    const isNotFound = status === 404 || isTypeMismatch;

    return (
      <>
        <PageSeo
          title={
            isNotFound
              ? `${typeLabel} Post Not Found | ${brandName}`
              : `Post Error | ${brandName}`
          }
          description={
            isNotFound
              ? `The requested ${typeLabel} Post is unavailable or the URL is incorrect.`
              : "The requested Post could not be loaded at this time."
          }
          keywords={[...globalKeywords, ...defaultSeo.keywords]}
          canonicalPath={canonicalPath}
          image={String(globalSeo.ogImageUrl || "").trim()}
          type="article"
          noIndex
          brandName={brandName}
        />

        <PostErrorState
          expectedType={safeExpectedType}
          error={error}
          status={status}
          isTypeMismatch={isTypeMismatch}
          onRetry={refreshPost}
          isRetrying={isLoading}
          showAlternatePageLink={isAlternatePageVisible}
        />
      </>
    );
  }

  const publishedDate = formatPostDate(post.publishedAt);
  const updatedDate = formatPostDate(post.updatedAt);
  const relatedProjects = Array.isArray(post.relatedProjects)
    ? post.relatedProjects.filter(
        (project) =>
          project &&
          typeof project === "object" &&
          !Array.isArray(project),
      )
    : [];

  const numericReadingTime = Number(post.readingTime);
  const readingTime =
    Number.isInteger(numericReadingTime) && numericReadingTime >= 1
      ? numericReadingTime
      : 1;

  return (
    <>
      <PageSeo
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalPath={canonicalPath}
        image={socialSharingImage}
        type="article"
        brandName={brandName}
        structuredData={postStructuredData}
      />

      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <article>
          <header className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
            <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl" />
            <div className="absolute -bottom-40 left-10 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

            <Container>
              <div className="relative mx-auto max-w-5xl">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span
                    className={
                      safeExpectedType === "news"
                        ? "rounded-full bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-800"
                        : "rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800"
                    }
                  >
                    {typeLabel}
                  </span>

                  {post.category && (
                    <span className="max-w-full break-words rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
                      {post.category}
                    </span>
                  )}

                  {post.isFeatured && (
                    <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
                      Featured
                    </span>
                  )}
                </div>

                <h1 className="mt-6 break-words text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {post.title}
                </h1>

                <p className="mt-6 max-w-4xl break-words text-lg leading-8 text-slate-300">
                  {post.excerpt}
                </p>

                <div className="mt-8 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold text-slate-300">
                  {post.authorName && <span>By {post.authorName}</span>}
                  {publishedDate && <span>{publishedDate}</span>}
                  <span>
                    {readingTime} {readingTime === 1 ? "minute" : "minutes"} read
                  </span>
                </div>
              </div>
            </Container>
          </header>

          {featuredImageUrl && (
            <section className="border-b border-slate-200 bg-white">
              <Container>
                <div className="mx-auto max-w-5xl py-8 sm:py-10">
                  {!hasFeaturedImageError ? (
                    <img
                      key={featuredImageUrl}
                      src={featuredImageUrl}
                      alt={
                        post.featuredImageAlt ||
                        `${post.title} featured image`
                      }
                      className="max-h-[36rem] w-full rounded-3xl border border-slate-200 object-cover shadow-sm"
                      onError={() => {
                        setHasFeaturedImageError(true);
                      }}
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={`${post.title} featured image unavailable`}
                      className="grid min-h-64 w-full place-items-center rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-50 via-white to-slate-100 p-8 text-center shadow-sm sm:min-h-80"
                    >
                      <div className="max-w-md">
                        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-950 text-2xl font-black text-white">
                          {typeLabel.charAt(0)}
                        </div>

                        <p className="mt-5 break-words text-lg font-bold text-slate-950">
                          Featured image unavailable
                        </p>

                        <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                          The article content is still available below.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Container>
            </section>
          )}

          <section className="py-12 sm:py-16">
            <Container>
              <div className="mx-auto grid max-w-6xl min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0">
                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
                      {typeLabel} Content
                    </p>

                    <div className="mt-6 whitespace-pre-wrap break-words text-base leading-8 text-slate-700">
                      {post.content}
                    </div>
                  </section>

                  {relatedProjects.length > 0 && (
                    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                        Related Projects
                      </h2>

                      <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2">
                        {relatedProjects.map((project, index) => {
                          const projectKey =
                            project._id ||
                            project.id ||
                            project.slug ||
                            `${project.title}-${index}`;

                          const projectContent = (
                            <>
                              <p className="break-words text-base font-bold text-slate-950">
                                {project.title || "Portfolio Project"}
                              </p>

                              {project.shortDescription && (
                                <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-slate-600">
                                  {project.shortDescription}
                                </p>
                              )}

                              {project.category && (
                                <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-600">
                                  {project.category}
                                </p>
                              )}
                            </>
                          );

                          return project.slug ? (
                            <Link
                              key={projectKey}
                              to={`/projects/${project.slug}`}
                              className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-brand-300 hover:bg-brand-50"
                            >
                              {projectContent}
                            </Link>
                          ) : (
                            <div
                              key={projectKey}
                              className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                            >
                              {projectContent}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </div>

                <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-950">
                      Article Information
                    </h2>

                    <dl className="mt-5 divide-y divide-slate-100">
                      <div className="py-4 first:pt-0">
                        <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Type
                        </dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-700">
                          {typeLabel}
                        </dd>
                      </div>

                      {post.authorName && (
                        <div className="py-4">
                          <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Author
                          </dt>
                          <dd className="mt-2 break-words text-sm font-semibold text-slate-700">
                            {post.authorName}
                          </dd>
                        </div>
                      )}

                      {publishedDate && (
                        <div className="py-4">
                          <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Published
                          </dt>
                          <dd className="mt-2 text-sm font-semibold text-slate-700">
                            {publishedDate}
                          </dd>
                        </div>
                      )}

                      {updatedDate && updatedDate !== publishedDate && (
                        <div className="py-4">
                          <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Updated
                          </dt>
                          <dd className="mt-2 text-sm font-semibold text-slate-700">
                            {updatedDate}
                          </dd>
                        </div>
                      )}

                      <div className="py-4">
                        <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Reading Time
                        </dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-700">
                          {readingTime} {readingTime === 1 ? "minute" : "minutes"}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  {tags.length > 0 && (
                    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <h2 className="text-lg font-bold text-slate-950">
                        Tags
                      </h2>

                      <div className="mt-5 flex min-w-0 flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <span
                            key={`${tag}-${index}`}
                            className="max-w-full break-words rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  <Link
                    to={`/${safeExpectedType}`}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
                  >
                    ← Back to All {typeLabel}
                  </Link>
                </aside>
              </div>
            </Container>
          </section>
        </article>

        <PublicPageCTA
          ctaKey="postDetails"
        />
      </main>

      <Footer />
    </>
  );
}

export default PostDetailsPage;
