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
    <main className="admin-posts-compact-page min-h-screen">
      <section className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="admin-posts-eyebrow text-[10px] font-bold uppercase tracking-[0.16em]">
              Publishing
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Blog & News
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-5">
              Manage Blog and News content, visibility and featured priority.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="admin-posts-count-pill rounded-lg px-3 py-2 text-[11px] font-semibold">
              {isLoading
                ? "Loading..."
                : `${resultCount} Post${resultCount === 1 ? "" : "s"}`}
            </span>

            <Link
              className="admin-posts-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
              to="/admin/posts/new"
            >
              Add Post
            </Link>
          </div>
        </header>

        <form
          className="admin-posts-toolbar mt-4 rounded-xl p-3"
          onSubmit={handleFilterSubmit}
        >
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(250px,1.5fr)_150px_150px_auto]">
            <div>
              <label className="sr-only" htmlFor="post-search">
                Search
              </label>

              <input
                className={`${inputClassName} admin-posts-input !mt-0 !min-h-10 !rounded-lg`}
                id="post-search"
                name="search"
                onChange={handleFilterChange}
                placeholder="Search title, slug, content or author..."
                type="search"
                value={formFilters.search}
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="post-type-filter">
                Type
              </label>

              <select
                className={`${inputClassName} admin-posts-input !mt-0 !min-h-10 !rounded-lg`}
                id="post-type-filter"
                name="type"
                onChange={handleFilterChange}
                value={formFilters.type}
              >
                <option value="">Blog & News</option>
                <option value="blog">Blog only</option>
                <option value="news">News only</option>
              </select>
            </div>

            <div>
              <label className="sr-only" htmlFor="post-visibility-filter">
                Visibility
              </label>

              <select
                className={`${inputClassName} admin-posts-input !mt-0 !min-h-10 !rounded-lg`}
                id="post-visibility-filter"
                name="visibility"
                onChange={handleFilterChange}
                value={formFilters.visibility}
              >
                <option value="all">All visibility</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                className="admin-posts-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
                disabled={isLoading || Boolean(actionPostId)}
                type="submit"
              >
                Apply
              </button>

              <button
                aria-label="Clear Blog and News filters"
                className="admin-posts-secondary-button inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold"
                disabled={isLoading || Boolean(actionPostId)}
                onClick={handleClearFilters}
                title="Clear filters"
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          <details className="admin-posts-more mt-2 rounded-lg">
            <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold">
              More Filters
            </summary>

            <div className="grid gap-3 border-t px-3 py-3 md:grid-cols-3">
              <div>
                <label
                  className={`${labelClassName} !text-[10px]`}
                  htmlFor="post-category-filter"
                >
                  Category
                </label>

                <input
                  className={`${inputClassName} admin-posts-input !mt-1.5 !min-h-10 !rounded-lg`}
                  id="post-category-filter"
                  name="category"
                  onChange={handleFilterChange}
                  placeholder="Exact category"
                  type="text"
                  value={formFilters.category}
                />
              </div>

              <div>
                <label
                  className={`${labelClassName} !text-[10px]`}
                  htmlFor="post-tag-filter"
                >
                  Tag
                </label>

                <input
                  className={`${inputClassName} admin-posts-input !mt-1.5 !min-h-10 !rounded-lg`}
                  id="post-tag-filter"
                  name="tag"
                  onChange={handleFilterChange}
                  placeholder="Exact tag"
                  type="text"
                  value={formFilters.tag}
                />
              </div>

              <div>
                <label
                  className={`${labelClassName} !text-[10px]`}
                  htmlFor="post-featured-filter"
                >
                  Featured
                </label>

                <select
                  className={`${inputClassName} admin-posts-input !mt-1.5 !min-h-10 !rounded-lg`}
                  id="post-featured-filter"
                  name="featured"
                  onChange={handleFilterChange}
                  value={formFilters.featured}
                >
                  <option value="all">All records</option>
                  <option value="featured">Featured</option>
                  <option value="standard">Standard</option>
                </select>
              </div>
            </div>
          </details>
        </form>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold">
            {isLoading
              ? "Loading Posts..."
              : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
          </p>

          <button
            className="admin-posts-secondary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[11px] font-semibold"
            disabled={isLoading || Boolean(actionPostId)}
            onClick={handleRefresh}
            type="button"
          >
            Refresh
          </button>
        </div>

        <div aria-live="polite">
          {successMessage ? (
            <div
              className="admin-posts-success mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
              role="status"
            >
              {successMessage}
            </div>
          ) : null}

          {error ? (
            <div
              className="admin-posts-error mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
              role="alert"
            >
              {error}
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div
            aria-live="polite"
            className="mt-3 space-y-2"
            role="status"
          >
            <span className="sr-only">Loading Posts...</span>

            {[1, 2, 3, 4, 5].map((placeholder) => (
              <div
                className="admin-posts-skeleton h-[92px] rounded-xl motion-reduce:animate-none"
                key={placeholder}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && posts.length === 0 ? (
          <div className="admin-posts-empty mt-3 rounded-xl px-5 py-9 text-center">
            <h2 className="text-base font-bold">No Posts found</h2>

            <p className="mt-1 text-xs">
              Change the filters or create the first Blog or News Post.
            </p>
          </div>
        ) : null}

        {!isLoading && posts.length > 0 ? (
          <div className="mt-3 space-y-2">
            {posts.map((post) => {
              const isActionPending = actionPostId === post._id;
              const tags = Array.isArray(post.tags) ? post.tags : [];
              const relatedProjectCount = Array.isArray(post.relatedProjects)
                ? post.relatedProjects.length
                : 0;

              return (
                <article
                  className="admin-posts-row min-w-0 rounded-xl"
                  key={post._id}
                >
                  <div className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] gap-3 p-3 md:grid-cols-[86px_minmax(0,1fr)_auto] md:items-center">
                    <div className="admin-posts-thumb relative h-[64px] overflow-hidden rounded-lg">
                      <div className="grid size-full place-items-center text-lg font-bold">
                        {createPostInitial(post.type)}
                      </div>

                      {post.featuredImageUrl ? (
                        <img
                          alt={
                            post.featuredImageAlt ||
                            `${post.title} featured image`
                          }
                          className="absolute inset-0 size-full object-cover"
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                          }}
                          src={post.featuredImageUrl}
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span
                          className="admin-posts-badge rounded-md px-2 py-1 text-[9px] font-bold"
                          data-type={post.type}
                        >
                          {formatPostType(post.type)}
                        </span>

                        <span
                          className={`admin-posts-badge rounded-md px-2 py-1 text-[9px] font-bold ${
                            post.isVisible ? "is-visible" : "is-hidden"
                          }`}
                        >
                          {post.isVisible ? "Visible" : "Hidden"}
                        </span>

                        {post.isFeatured ? (
                          <span className="admin-posts-badge is-featured rounded-md px-2 py-1 text-[9px] font-bold">
                            Featured
                          </span>
                        ) : null}
                      </div>

                      <h2 className="mt-1.5 truncate text-sm font-bold">
                        {post.title}
                      </h2>

                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                        <span className="max-w-52 truncate">
                          /{post.slug}
                        </span>

                        {post.category ? (
                          <span className="truncate">
                            {post.category}
                          </span>
                        ) : null}

                        <span>{formatDate(post.publishedAt)}</span>

                        <span>{post.readingTime ?? 1} min</span>

                        {relatedProjectCount > 0 ? (
                          <span>
                            {relatedProjectCount} related
                          </span>
                        ) : null}
                      </div>

                      {post.excerpt ? (
                        <p className="mt-1 line-clamp-1 text-[10px] leading-4">
                          {post.excerpt}
                        </p>
                      ) : null}

                      {tags.length > 0 ? (
                        <div className="mt-1.5 flex min-w-0 flex-wrap gap-1">
                          {tags.slice(0, 2).map((tag) => (
                            <span
                              className="admin-posts-tag rounded-md px-1.5 py-0.5 text-[9px]"
                              key={tag}
                            >
                              #{tag}
                            </span>
                          ))}

                          {tags.length > 2 ? (
                            <span className="admin-posts-tag rounded-md px-1.5 py-0.5 text-[9px]">
                              +{tags.length - 2}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="col-span-2 flex shrink-0 items-center justify-end gap-2 md:col-span-1">
                      <Link
                        className="admin-posts-primary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[10px] font-bold"
                        to={`/admin/posts/${post._id}/edit`}
                      >
                        Edit
                      </Link>

                      <details className="admin-posts-actions relative">
                        <summary
                          aria-label={`More actions for ${post.title}`}
                          className="admin-posts-secondary-button inline-flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-base font-bold"
                          title="More actions"
                        >
                          …
                        </summary>

                        <div className="admin-posts-action-menu absolute right-0 top-[calc(100%+0.4rem)] z-30 w-44 rounded-xl p-1.5">
                          <button
                            className="admin-posts-menu-action"
                            disabled={isLoading || Boolean(actionPostId)}
                            onClick={() => handleToggleVisibility(post)}
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : post.isVisible
                                ? "Hide from public"
                                : "Show on public"}
                          </button>

                          <button
                            className="admin-posts-menu-action"
                            disabled={isLoading || Boolean(actionPostId)}
                            onClick={() => handleToggleFeatured(post)}
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : post.isFeatured
                                ? "Make standard"
                                : "Make featured"}
                          </button>

                          <div className="admin-posts-menu-divider my-1" />

                          <button
                            className="admin-posts-menu-action is-danger"
                            disabled={
                              isLoading ||
                              Boolean(actionPostId) ||
                              !canDeletePosts
                            }
                            onClick={() => handleDeletePost(post)}
                            title={
                              canDeletePosts
                                ? "Permanently delete Post"
                                : "Your role cannot permanently delete Posts"
                            }
                            type="button"
                          >
                            {isActionPending ? "Working..." : "Delete"}
                          </button>
                        </div>
                      </details>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default AdminPostsPage;