import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  deleteAdminPost,
  fetchAdminPosts,
  updateAdminPost,
} from "../../services/adminPostsApi";

const initialFilters = {
  search: "",
  type: "",
  category: "",
  tag: "",
  visibility: "all",
  featured: "all",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.14em] text-slate-500";

function createApiFilters(filters) {
  const apiFilters = {
    search: filters.search.trim(),
    category: filters.category.trim(),
    tag: filters.tag.trim(),
  };

  if (["blog", "news"].includes(filters.type)) {
    apiFilters.type = filters.type;
  }

  if (filters.visibility === "visible") {
    apiFilters.isVisible = true;
  }

  if (filters.visibility === "hidden") {
    apiFilters.isVisible = false;
  }

  if (filters.featured === "featured") {
    apiFilters.isFeatured = true;
  }

  if (filters.featured === "standard") {
    apiFilters.isFeatured = false;
  }

  return apiFilters;
}

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPostType(type) {
  return type === "news" ? "News" : "Blog";
}

function createPostInitial(type) {
  return type === "news" ? "N" : "B";
}

function AdminPostsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, admin, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({ ...initialFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...initialFilters });
  const [posts, setPosts] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionPostId, setActionPostId] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || "",
  );

  useEffect(() => {
    if (!location.state?.successMessage) {
      return;
    }

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.state, navigate]);

  const apiFilters = useMemo(
    () => createApiFilters(appliedFilters),
    [appliedFilters],
  );

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadPosts() {
      setIsLoading(true);

      try {
        const response = await fetchAdminPosts(accessToken, apiFilters, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setPosts(response.posts);
        setResultCount(response.count);
        setError("");
      } catch (requestError) {
        if (controller.signal.aborted || requestError?.name === "AbortError") {
          return;
        }

        if (requestError?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,
            state: {
              from: {
                pathname: "/admin/posts",
              },
            },
          });

          return;
        }

        console.error("Admin Posts loading failed:", requestError);

        setPosts([]);
        setResultCount(0);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Posts could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadPosts();

    return () => {
      controller.abort();
    };
  }, [accessToken, apiFilters, logout, navigate, refreshKey]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function handleFilterSubmit(event) {
    event.preventDefault();

    if (isLoading || actionPostId) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setAppliedFilters({ ...formFilters });
  }

  function handleClearFilters() {
    if (isLoading || actionPostId) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setFormFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
  }

  function handleRefresh() {
    if (isLoading || actionPostId) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setRefreshKey((currentKey) => currentKey + 1);
  }

  function handlePostActionError(requestError) {
    if (requestError?.status === 401) {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: {
            pathname: "/admin/posts",
          },
        },
      });

      return;
    }

    if (requestError?.status === 403) {
      setError(
        requestError.message ||
          "Your Admin role cannot perform this Post action.",
      );

      return;
    }

    console.error("Admin Post action failed:", requestError);

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Post action could not be completed.",
    );
  }

  async function handleToggleVisibility(post) {
    if (!post?._id || actionPostId || isLoading) {
      return;
    }

    try {
      setActionPostId(post._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminPost(accessToken, post._id, {
        isVisible: !post.isVisible,
      });

      setSuccessMessage(
        response.post.isVisible
          ? `"${response.post.title}" is now publicly visible.`
          : `"${response.post.title}" is now hidden from public pages.`,
      );

      setIsLoading(true);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handlePostActionError(requestError);
    } finally {
      setActionPostId("");
    }
  }

  async function handleToggleFeatured(post) {
    if (!post?._id || actionPostId || isLoading) {
      return;
    }

    try {
      setActionPostId(post._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminPost(accessToken, post._id, {
        isFeatured: !post.isFeatured,
      });

      setSuccessMessage(
        response.post.isFeatured
          ? `"${response.post.title}" is now featured.`
          : `"${response.post.title}" is now a standard Post.`,
      );

      setIsLoading(true);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handlePostActionError(requestError);
    } finally {
      setActionPostId("");
    }
  }

  async function handleDeletePost(post) {
    if (!post?._id || actionPostId || isLoading) {
      return;
    }

    const isConfirmed = window.confirm(
      `Permanently delete "${post.title}"?\n\nThis action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setActionPostId(post._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminPost(accessToken, post._id);

      setSuccessMessage(
        `"${response.deletedPost.title}" was permanently deleted.`,
      );

      setIsLoading(true);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handlePostActionError(requestError);
    } finally {
      setActionPostId("");
    }
  }

  const canDeletePosts = ["super-admin", "admin"].includes(admin?.role);

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Publishing
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Blog & News
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage Blog and News Posts, publishing metadata, categories,
              tags, related Projects and public display priority.
            </p>
          </div>

          <Link
            to="/admin/posts/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Add Post
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="post-search" className={labelClassName}>
                Search
              </label>

              <input
                id="post-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Title, slug, content or author"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="post-type-filter" className={labelClassName}>
                Type
              </label>

              <select
                id="post-type-filter"
                name="type"
                value={formFilters.type}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="">Blog & News</option>
                <option value="blog">Blog only</option>
                <option value="news">News only</option>
              </select>
            </div>

            <div>
              <label htmlFor="post-category-filter" className={labelClassName}>
                Category
              </label>

              <input
                id="post-category-filter"
                name="category"
                type="text"
                value={formFilters.category}
                onChange={handleFilterChange}
                placeholder="Exact category"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="post-tag-filter" className={labelClassName}>
                Tag
              </label>

              <input
                id="post-tag-filter"
                name="tag"
                type="text"
                value={formFilters.tag}
                onChange={handleFilterChange}
                placeholder="Exact tag"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="post-visibility-filter"
                className={labelClassName}
              >
                Visibility
              </label>

              <select
                id="post-visibility-filter"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All visibility</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="post-featured-filter"
                className={labelClassName}
              >
                Display type
              </label>

              <select
                id="post-featured-filter"
                name="featured"
                value={formFilters.featured}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All records</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={isLoading || Boolean(actionPostId)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              Clear
            </button>

            <button
              type="submit"
              disabled={isLoading || Boolean(actionPostId)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {isLoading
                ? "Loading Posts..."
                : `${resultCount} Post${resultCount === 1 ? "" : "s"}`}
            </p>

            {!isLoading && (
              <p className="mt-1 text-xs text-slate-500">
                Showing Blog and News records matching the applied filters.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading || Boolean(actionPostId)}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            Refresh
          </button>
        </div>

        <div aria-live="polite">
          {successMessage && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700"
            >
              {successMessage}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <span className="sr-only">Loading Posts...</span>

            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-[31rem] animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && posts.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-brand-50 text-lg font-bold text-brand-600">
              P
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-950">
              No Posts found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Change the filters or create the first Blog or News Post.
            </p>
          </div>
        )}

        {!isLoading && posts.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => {
              const isActionPending = actionPostId === post._id;

              const relatedProjectCount = Array.isArray(post.relatedProjects)
                ? post.relatedProjects.length
                : 0;

              const tags = Array.isArray(post.tags) ? post.tags : [];

              return (
                <article
                  key={post._id}
                  className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-950">
                    <div className="grid size-full place-items-center text-3xl font-bold text-white/75">
                      {createPostInitial(post.type)}
                    </div>

                    {post.featuredImageUrl && (
                      <img
                        src={post.featuredImageUrl}
                        alt={
                          post.featuredImageAlt ||
                          `${post.title} featured image`
                        }
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                        className="absolute inset-0 size-full object-cover"
                      />
                    )}

                    <div className="absolute inset-x-0 top-0 flex flex-wrap gap-2 p-4">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          post.type === "news"
                            ? "bg-sky-50 text-sky-800"
                            : "bg-violet-50 text-violet-800"
                        }`}
                      >
                        {formatPostType(post.type)}
                      </span>

                      {post.isFeatured && (
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                          Featured
                        </span>
                      )}

                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          post.isVisible
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {post.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="break-words text-lg font-bold leading-7 text-slate-950">
                      {post.title}
                    </h2>

                    <p className="mt-1 break-all text-xs font-medium text-slate-400">
                      /{post.slug}
                    </p>

                    {post.excerpt && (
                      <p className="mt-4 line-clamp-4 break-words text-sm leading-6 text-slate-600">
                        {post.excerpt}
                      </p>
                    )}

                    {(post.category || tags.length > 0) && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.category && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {post.category}
                          </span>
                        )}

                        {tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
                          >
                            #{tag}
                          </span>
                        ))}

                        {tags.length > 3 && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            +{tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <dl className="mt-5 divide-y divide-slate-100 border-y border-slate-100 text-sm">
                      <div className="flex items-start justify-between gap-4 py-3">
                        <dt className="text-slate-500">Author</dt>

                        <dd className="max-w-[65%] break-words text-right font-semibold text-slate-800">
                          {post.authorName}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4 py-3">
                        <dt className="text-slate-500">Published</dt>

                        <dd className="text-right font-semibold text-slate-700">
                          {formatDate(post.publishedAt)}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4 py-3">
                        <dt className="text-slate-500">Reading time</dt>

                        <dd className="font-semibold text-slate-800">
                          {post.readingTime ?? 1} min
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4 py-3">
                        <dt className="text-slate-500">Related Projects</dt>

                        <dd className="font-semibold text-slate-800">
                          {relatedProjectCount}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4 py-3">
                        <dt className="text-slate-500">Display order</dt>

                        <dd className="font-semibold text-slate-800">
                          {post.order ?? 0}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                      <Link
                        to={`/admin/posts/${post._id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(post)}
                        disabled={isLoading || Boolean(actionPostId)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                      >
                        {isActionPending
                          ? "Working..."
                          : post.isVisible
                            ? "Hide"
                            : "Show"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(post)}
                        disabled={isLoading || Boolean(actionPostId)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                      >
                        {isActionPending
                          ? "Working..."
                          : post.isFeatured
                            ? "Make Standard"
                            : "Make Featured"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePost(post)}
                        disabled={
                          isLoading ||
                          Boolean(actionPostId) ||
                          !canDeletePosts
                        }
                        title={
                          canDeletePosts
                            ? "Permanently delete Post"
                            : "Your role cannot permanently delete Posts"
                        }
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                      >
                        {isActionPending ? "Working..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminPostsPage;