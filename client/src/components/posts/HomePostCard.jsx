import styles from "./HomePostCard.module.css";

function formatPostDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function PostTypeIcon({ type }) {
  if (type === "news") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className={styles.badgeIcon}
      >
        <path
          d="M4.5 8.25v3.5m0-3.5h2.2l5.8-3.1v9.7l-5.8-3.1H4.5m2.2 0 .8 3.1H9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.25 7.1a4.25 4.25 0 0 1 0 5.8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={styles.badgeIcon}
    >
      <path
        d="M3.75 4.5A2.25 2.25 0 0 1 6 2.25h3.25v13.5H6A2.25 2.25 0 0 0 3.75 18V4.5Zm12.5 0A2.25 2.25 0 0 0 14 2.25h-3.25v13.5H14A2.25 2.25 0 0 1 16.25 18V4.5Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={styles.actionIcon}
    >
      <path
        d="M4 10h11.5M11 5.5 15.5 10 11 14.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomePostCard({
  post,
  index = 0,
}) {
  const type = post?.type === "news" ? "news" : "blog";
  const typeLabel = type === "news" ? "News" : "Blog";
  const title = String(post?.title || "").trim();
  const slug = String(post?.slug || "").trim();
  const excerpt = String(post?.excerpt || "").trim();
  const imageUrl = String(post?.featuredImageUrl || "").trim();
  const imageAlt = String(post?.featuredImageAlt || "").trim();
  const publishedAt = formatPostDate(post?.publishedAt);
  const id =
    post?._id ||
    post?.id ||
    slug ||
    `${type}-post-${index + 1}`;

  if (!title) {
    return null;
  }

  const detailsUrl =
    type === "news"
      ? "https://idomere.com/news"
      : "https://idomere.com/blog";

  return (
    <article
      className={styles.card}
      data-post-type={type}
      data-post-id={id}
    >
      <header className={styles.header}>
        <h3 className={styles.title}>
          <a
            href={detailsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${title} - open ${typeLabel} on Idomere`}
          >
            {title}
          </a>
        </h3>
      </header>

      <div className={styles.media}>
        <div className={styles.fallback} aria-hidden="true">
          <PostTypeIcon type={type} />
        </div>

        {imageUrl && (
          <img
            src={imageUrl}
            alt={imageAlt || `${title} featured image`}
            loading="lazy"
            className={styles.image}
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        )}

        <div className={styles.mediaShade} aria-hidden="true" />

        <span
          className={
            type === "news"
              ? `${styles.badge} ${styles.newsBadge}`
              : `${styles.badge} ${styles.blogBadge}`
          }
        >
          <PostTypeIcon type={type} />
          <span>{typeLabel}</span>
        </span>

        {publishedAt && (
          <time
            className={styles.datePill}
            dateTime={String(post?.publishedAt || "")}
          >
            {publishedAt}
          </time>
        )}
      </div>

      <div className={styles.body}>
        {excerpt && <p className={styles.excerpt}>{excerpt}</p>}

        <a
          href={detailsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.action}
          aria-label={`Read more on Idomere: ${title}`}
        >
          <span>Read More</span>
          <ArrowIcon />
        </a>
      </div>
    </article>
  );
}

export default HomePostCard;
