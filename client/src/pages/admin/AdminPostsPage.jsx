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
    const routeMessage = location.state?.successMessage || "";

    if (!routeMessage) {
      return;
    }

    setSuccessMessage(routeMessage);

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
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/admin/dashboard"
          className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-600 transition hover:text-brand-700"
        >
          ← Back to Admin Dashboard
        </Link>

        <div className="mt-6 flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
              Blog & News Management
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Manage Posts
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Manage Blog and News articles from one shared Post system,
              including content, type, publishing metadata, SEO, related
              Projects, display order, featured status and visibility.
            </p>
          </div>

          <Link
            to="/admin/posts/new"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Add New Post
          </Link>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label
                htmlFor="post-search"
                className="text-sm font-semibold text-slate-700"
              >
                Search
              </label>

              <input
                id="post-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Title, slug, content, author..."
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="post-type-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Type
              </label>

              <select
                id="post-type-filter"
                name="type"
                value={formFilters.type}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="">Blog & News</option>
                <option value="blog">Blog only</option>
                <option value="news">News only</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="post-category-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Category
              </label>

              <input
                id="post-category-filter"
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
                htmlFor="post-tag-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Tag
              </label>

              <input
                id="post-tag-filter"
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
                htmlFor="post-visibility-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Visibility
              </label>

              <select
                id="post-visibility-filter"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="all">All visibility</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="post-featured-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Featured
              </label>

              <select
                id="post-featured-filter"
                name="featured"
                value={formFilters.featured}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="all">All records</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isLoading || Boolean(actionPostId)}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply Filters
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              disabled={isLoading || Boolean(actionPostId)}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear Filters
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || Boolean(actionPostId)}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">
            {isLoading
              ? "Loading Posts..."
              : `${resultCount} Post${resultCount === 1 ? "" : "s"} found`}
          </p>
        </div>

        {successMessage && (
          <div
            role="status"
            className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700"
          >
            {successMessage}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 grid min-h-64 place-items-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto size-11 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
              <p className="mt-4 text-sm font-semibold text-slate-600">
                Loading Posts...
              </p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
              P
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-950">
              No Posts found
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
              Create your first Blog or News Post, or clear the current
              filters.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => {
              const isActionPending = actionPostId === post._id;
              const relatedProjectCount = Array.isArray(post.relatedProjects)
                ? post.relatedProjects.length
                : 0;

              return (
                <article
                  key={post._id}
                  className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-900">
                    <div className="grid size-full place-items-center text-4xl font-black text-white/80">
                      {createPostInitial(post.type)}
                    </div>

                    {post.featuredImageUrl && (
                      <img
                        src={post.featuredImageUrl}
                        alt={
                          post.featuredImageAlt ||
                          `${post.title} featured image`
                        }
                        className="absolute inset-0 size-full object-cover"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                      />
                    )}

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span
                        className={
                          post.type === "news"
                            ? "rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800"
                            : "rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800"
                        }
                      >
                        {formatPostType(post.type)}
                      </span>

                      {post.isFeatured && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="break-words text-xl font-bold text-slate-950">
                      {post.title}
                    </h2>

                    <p className="mt-1 break-all text-xs font-medium text-slate-400">
                      /{post.slug}
                    </p>

                    <p className="mt-4 line-clamp-4 break-words leading-7 text-slate-600">
                      {post.excerpt}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.category && (
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {post.category}
                        </span>
                      )}

                      {(Array.isArray(post.tags) ? post.tags : [])
                        .slice(0, 3)
                        .map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
                          >
                            #{tag}
                          </span>
                        ))}
                    </div>

                    <dl className="mt-6 grid gap-3 text-sm">
                      <div className="flex items-start justify-between gap-4">
                        <dt className="font-semibold text-slate-500">
                          Visibility
                        </dt>
                        <dd
                          className={
                            post.isVisible
                              ? "font-semibold text-emerald-700"
                              : "font-semibold text-slate-500"
                          }
                        >
                          {post.isVisible ? "Visible" : "Hidden"}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <dt className="font-semibold text-slate-500">
                          Author
                        </dt>
                        <dd className="max-w-[65%] break-words text-right font-semibold text-slate-700">
                          {post.authorName}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <dt className="font-semibold text-slate-500">
                          Published
                        </dt>
                        <dd className="font-semibold text-slate-700">
                          {formatDate(post.publishedAt)}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <dt className="font-semibold text-slate-500">
                          Reading
                        </dt>
                        <dd className="font-semibold text-slate-700">
                          {post.readingTime ?? 1} min
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <dt className="font-semibold text-slate-500">
                          Projects
                        </dt>
                        <dd className="font-semibold text-slate-700">
                          {relatedProjectCount}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <dt className="font-semibold text-slate-500">
                          Order
                        </dt>
                        <dd className="font-semibold text-slate-700">
                          {post.order ?? 0}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                      <Link
                        to={`/admin/posts/${post._id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(post)}
                        disabled={isLoading || Boolean(actionPostId)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActionPending
                          ? "Working..."
                          : post.isFeatured
                            ? "Unfeature"
                            : "Feature"}
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
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>
    </main>
  );
}

export default AdminPostsPage;
