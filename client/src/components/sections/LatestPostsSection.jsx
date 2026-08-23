import { useMemo } from "react";
import { mergeHomepageSections } from "../../config/homepageSections";
import usePosts from "../../hooks/usePosts";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import PostCard from "../posts/PostCard";

import PublicCTAButton from "../layout/PublicCTAButton";
const SITE_URL = "https://rakeshnexify.com";

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const characterCode = text.charCodeAt(index);

    if (characterCode <= 31 || characterCode === 127) {
      return true;
    }
  }

  return false;
}

function getSafePublicUrl(value, fallbackUrl = "/blog") {
  const url = String(value || "").trim();

  if (!url || containsControlCharacters(url)) {
    return fallbackUrl;
  }

  if (/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(url)) {
    return url;
  }

  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return url;
    }
  } catch {
    return fallbackUrl;
  }

  return fallbackUrl;
}

function getSameSitePostListingType(value) {
  const url = String(value || "").trim();

  if (!url) {
    return "";
  }

  try {
    const siteUrl = new URL(SITE_URL);
    const destinationUrl = new URL(url, siteUrl);
    const normalizedPathname =
      destinationUrl.pathname.replace(/\/+$/, "") || "/";

    if (destinationUrl.origin !== siteUrl.origin) {
      return "";
    }

    if (normalizedPathname === "/blog") {
      return "blog";
    }

    if (normalizedPathname === "/news") {
      return "news";
    }
  } catch {
    return "";
  }

  return "";
}

function getDateTimestamp(value) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortLatestPosts(firstPost, secondPost) {
  const publishedDifference =
    getDateTimestamp(secondPost?.publishedAt) -
    getDateTimestamp(firstPost?.publishedAt);

  if (publishedDifference !== 0) {
    return publishedDifference;
  }

  const createdDifference =
    getDateTimestamp(secondPost?.createdAt) -
    getDateTimestamp(firstPost?.createdAt);

  if (createdDifference !== 0) {
    return createdDifference;
  }

  const firstKey = String(
    firstPost?._id || firstPost?.id || firstPost?.slug || "",
  );

  const secondKey = String(
    secondPost?._id || secondPost?.id || secondPost?.slug || "",
  );

  return firstKey.localeCompare(secondKey);
}

function LatestPostsSection() {
  const { posts, isLoading, error, refreshPosts } = usePosts();
  const { settings } = useSiteSettings();

  const sectionContent = settings?.postsSection || {};

  const eyebrow =
    String(sectionContent.eyebrow || "").trim();

  const heading =
    String(sectionContent.heading || "").trim();

  const description =
    String(sectionContent.description || "").trim();

  const ctaButton = sectionContent.ctaButton || sectionContent.action || {};

  const ctaLabel =
    String(ctaButton.label || "").trim();

  const ctaUrl = getSafePublicUrl(
    ctaButton.url || ctaButton.href, "");

  const sectionsByKey = useMemo(() => {
    return new Map(
      mergeHomepageSections(settings?.sections).map((section) => [
        section.key,
        section,
      ]),
    );
  }, [settings?.sections]);

  const isBlogPageVisible =
    sectionsByKey.get("blog")?.isPageVisible !== false;

  const isNewsPageVisible =
    sectionsByKey.get("news")?.isPageVisible !== false;

  const configuredCtaDestination = getSameSitePostListingType(ctaUrl);

  const isConfiguredCtaAvailable =
    configuredCtaDestination === "blog"
      ? isBlogPageVisible
      : configuredCtaDestination === "news"
        ? isNewsPageVisible
        : true;

  let secondaryPageType = "";

  if (isConfiguredCtaAvailable && configuredCtaDestination === "blog") {
    secondaryPageType = isNewsPageVisible ? "news" : "";
  } else if (
    isConfiguredCtaAvailable &&
    configuredCtaDestination === "news"
  ) {
    secondaryPageType = isBlogPageVisible ? "blog" : "";
  } else if (!isConfiguredCtaAvailable) {
    secondaryPageType = isBlogPageVisible
      ? "blog"
      : isNewsPageVisible
        ? "news"
        : "";
  }

  const publicPosts = Array.isArray(posts) ? posts : [];

  const previewPosts = useMemo(() => {
    const sourcePosts = Array.isArray(posts) ? posts : [];

    return [...sourcePosts].sort(sortLatestPosts).slice(0, 4);
  }, [posts]);

  return (
    <Section
      id="posts"
      className="scroll-mt-20 border-t border-slate-200 bg-white"
    >
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={heading}
          description={description}
        />

        <p aria-live="polite" className="sr-only">
          {isLoading
            ? "Loading latest Blog and News posts."
            : `${publicPosts.length} public Blog and News posts loaded.`}
        </p>

        {error && (
          <div className="mt-8 flex min-w-0 flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="break-words text-sm font-bold text-amber-800">
                Latest Posts could not be loaded
              </p>

              <p className="mt-1 break-words text-sm leading-6 text-amber-700">
                The public Blog and News API could not be reached.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshPosts}
              disabled={isLoading}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {isLoading && previewPosts.length === 0 && (
          <div className="mt-10 grid min-w-0 gap-7 [&>*]:min-w-0 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-[34rem] animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && previewPosts.length === 0 && (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <p className="text-lg font-bold text-slate-950">
              No public Blog or News posts available
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Articles and News will appear here after they are created and
              published from the Admin Panel.
            </p>
          </div>
        )}

        {previewPosts.length > 0 && (
          <div className="mt-10 grid min-w-0 gap-7 [&>*]:min-w-0 lg:grid-cols-2">
            {previewPosts.map((post, index) => (
              <PostCard
                key={
                  post._id ||
                  post.id ||
                  post.slug ||
                  `${post.title}-${index}`
                }
                post={post}
                index={index}
                linkEnabled={
                  post.type === "news"
                    ? isNewsPageVisible
                    : isBlogPageVisible
                }
              />
            ))}
          </div>
        )}

        {previewPosts.length > 0 &&
          (isConfiguredCtaAvailable || secondaryPageType) && (
            <div className="mt-8 flex min-w-0 flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="break-words font-bold text-slate-950">
                  Continue reading the complete Blog and News collections
                </p>

                <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                  The homepage shows a small preview of the latest visible
                  Posts.
                </p>
              </div>

              <div className="flex min-w-0 shrink-0 flex-col gap-3 sm:flex-row">
                {isConfiguredCtaAvailable && (
                  <PublicCTAButton
                    url={ctaUrl}
                    label={ctaLabel}
                  />
                )}

                {secondaryPageType && (
                  <PublicCTAButton
                    url={`/${secondaryPageType}`}
                    label={`View ${
                      secondaryPageType === "news"
                        ? "News"
                        : "Blog"
                    }`}
                  />
                )}
              </div>
            </div>
          )}
      </Container>
    </Section>
  );
}

export default LatestPostsSection;
