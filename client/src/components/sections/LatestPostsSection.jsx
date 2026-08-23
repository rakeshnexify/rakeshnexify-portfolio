import { useMemo } from "react";

import { mergeHomepageSections } from "../../config/homepageSections";
import usePosts from "../../hooks/usePosts";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import PublicCTAButton from "../layout/PublicCTAButton";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import HomePostCard from "../posts/HomePostCard";

import styles from "./LatestPostsSection.module.css";

const SITE_URL = "https://rakeshnexify.com";
const HOME_POST_LIMIT = 4;

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

function LoadingGrid() {
  return (
    <div
      className={styles.grid}
      data-count={HOME_POST_LIMIT}
      aria-label="Loading latest Blog and News posts"
    >
      {Array.from({ length: HOME_POST_LIMIT }, (_, index) => (
        <div
          key={index}
          className={styles.skeleton}
          aria-hidden="true"
        >
          <div className={styles.skeletonTop} />
          <div className={styles.skeletonMedia} />

          <div className={styles.skeletonBody}>
            <div className={styles.skeletonExcerpt} />
            <div className={styles.skeletonExcerpt} />
            <div className={styles.skeletonAction} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LatestPostsSection() {
  const {
    posts,
    isLoading,
    error,
    refreshPosts,
  } = usePosts({
    limit: HOME_POST_LIMIT,
    sort: "latest",
  });

  const { settings } = useSiteSettings();
  const sectionContent = settings?.postsSection || {};

  const eyebrow = String(sectionContent.eyebrow || "").trim();
  const heading = String(sectionContent.heading || "").trim();
  const description = String(sectionContent.description || "").trim();

  const ctaButton = sectionContent.ctaButton || sectionContent.action || {};
  const ctaLabel = String(ctaButton.label || "").trim();
  const ctaUrl = getSafePublicUrl(
    ctaButton.url || ctaButton.href,
    "",
  );

  const sectionsByKey = useMemo(
    () =>
      new Map(
        mergeHomepageSections(settings?.sections).map((section) => [
          section.key,
          section,
        ]),
      ),
    [settings?.sections],
  );

  const isBlogPageVisible =
    sectionsByKey.get("blog")?.isPageVisible !== false;

  const isNewsPageVisible =
    sectionsByKey.get("news")?.isPageVisible !== false;

  const configuredCtaDestination =
    getSameSitePostListingType(ctaUrl);

  const isConfiguredCtaAvailable =
    configuredCtaDestination === "blog"
      ? isBlogPageVisible
      : configuredCtaDestination === "news"
        ? isNewsPageVisible
        : true;

  const previewPosts = Array.isArray(posts) ? posts : [];

  return (
    <Section
      id="posts"
      className={`${styles.section} scroll-mt-20`}
    >
      <Container>
        <div className={styles.content}>
          <SectionHeading
            eyebrow={eyebrow}
            title={heading}
            description={description}
          />

          <p aria-live="polite" className="sr-only">
            {isLoading
              ? "Loading latest Blog and News posts."
              : `${previewPosts.length} latest Blog and News posts loaded.`}
          </p>

          {isLoading && previewPosts.length === 0 && (
            <LoadingGrid />
          )}

          {error && previewPosts.length === 0 && (
            <div
              className={`${styles.state} ${styles.errorState}`}
              role="status"
            >
              <div>
                <p className={styles.stateTitle}>
                  Unable to load posts right now.
                </p>
                <p className={styles.stateCopy}>
                  Please try again in a moment.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshPosts}
                disabled={isLoading}
                className={styles.retryButton}
              >
                {isLoading ? "Trying Again..." : "Try Again"}
              </button>
            </div>
          )}

          {!isLoading && !error && previewPosts.length === 0 && (
            <div className={styles.state}>
              <p className={styles.stateTitle}>
                No articles published yet.
              </p>
              <p className={styles.stateCopy}>
                Published Blog and News content will appear here automatically.
              </p>
            </div>
          )}

          {previewPosts.length > 0 && (
            <div
              className={styles.grid}
              data-count={Math.min(previewPosts.length, HOME_POST_LIMIT)}
            >
              {previewPosts.map((post, index) => (
                <HomePostCard
                  key={
                    post._id ||
                    post.id ||
                    post.slug ||
                    `${post.type}-${index}`
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
            isConfiguredCtaAvailable &&
            ctaLabel && (
              <div className={styles.cta}>
                <PublicCTAButton
                  label={ctaLabel}
                  url={ctaUrl}
                />
              </div>
            )}
        </div>
      </Container>
    </Section>
  );
}

export default LatestPostsSection;
