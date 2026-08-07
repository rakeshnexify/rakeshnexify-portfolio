import { Link } from "react-router";

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

function normalisePost(post = {}, index = 0) {
  const type = post.type === "news" ? "news" : "blog";
  const tags = Array.isArray(post.tags)
    ? post.tags.filter((tag) => typeof tag === "string" && tag.trim())
    : [];

  const numericReadingTime = Number(post.readingTime);

  return {
    id: post._id || post.id || post.slug || `post-${index + 1}`,
    title: post.title || "Untitled Post",
    slug: post.slug || "",
    type,
    excerpt: post.excerpt || "",
    featuredImageUrl: post.featuredImageUrl || "",
    featuredImageAlt: post.featuredImageAlt || "",
    category: post.category || "",
    tags,
    authorName: post.authorName || "",
    publishedAt: formatPostDate(post.publishedAt),
    readingTime:
      Number.isInteger(numericReadingTime) && numericReadingTime >= 1
        ? numericReadingTime
        : 1,
    isFeatured: Boolean(post.isFeatured),
  };
}

function PostCard({ post, index = 0, linkEnabled = true }) {
  const normalisedPost = normalisePost(post, index);

  const detailsPath =
    linkEnabled && normalisedPost.slug
      ? `/${normalisedPost.type}/${normalisedPost.slug}`
      : "";

  const typeLabel = normalisedPost.type === "news" ? "News" : "Blog";

  const typeBadgeClasses =
    normalisedPost.type === "news"
      ? "bg-sky-100 text-sky-800"
      : "bg-violet-100 text-violet-800";

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="relative aspect-[16/10] min-w-0 overflow-hidden bg-slate-950">
        <div className="grid size-full place-items-center bg-gradient-to-br from-brand-600/30 via-slate-950 to-cyan-500/20 text-5xl font-black text-white/20">
          {typeLabel.charAt(0)}
        </div>

        {normalisedPost.featuredImageUrl && (
          <img
            key={normalisedPost.featuredImageUrl}
            src={normalisedPost.featuredImageUrl}
            alt={
              normalisedPost.featuredImageAlt ||
              `${normalisedPost.title} featured image`
            }
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/70 to-transparent" />

        <div className="absolute left-4 top-4 flex min-w-0 flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${typeBadgeClasses}`}
          >
            {typeLabel}
          </span>

          {normalisedPost.isFeatured && (
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
              Featured
            </span>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-7">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold text-slate-500">
          {normalisedPost.category && (
            <span className="max-w-full break-words rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
              {normalisedPost.category}
            </span>
          )}

          {normalisedPost.publishedAt && (
            <span>{normalisedPost.publishedAt}</span>
          )}

          <span>
            {normalisedPost.readingTime}{" "}
            {normalisedPost.readingTime === 1 ? "min" : "mins"} read
          </span>
        </div>

        <h2 className="mt-5 break-words text-2xl font-bold tracking-tight text-slate-950">
          {normalisedPost.title}
        </h2>

        {normalisedPost.excerpt && (
          <p className="mt-4 line-clamp-4 break-words leading-7 text-slate-600">
            {normalisedPost.excerpt}
          </p>
        )}

        {normalisedPost.tags.length > 0 && (
          <div className="mt-5 flex min-w-0 flex-wrap gap-2">
            {normalisedPost.tags.slice(0, 5).map((tag, tagIndex) => (
              <span
                key={`${normalisedPost.id}-${tag}-${tagIndex}`}
                className="max-w-full break-words rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex min-w-0 flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Author
            </p>

            <p className="mt-1 break-words text-sm font-semibold text-slate-700">
              {normalisedPost.authorName || "RakeshNexify"}
            </p>
          </div>

          {detailsPath ? (
            <Link
              to={detailsPath}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Read {typeLabel}
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex min-h-11 shrink-0 cursor-not-allowed items-center justify-center rounded-xl bg-slate-100 px-5 text-sm font-semibold text-slate-400"
            >
              Unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export { formatPostDate, normalisePost };
export default PostCard;
