import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  deleteAdminFaq,
  fetchAdminFaqs,
  updateAdminFaq,
} from "../../services/adminFaqsApi";

const initialFilters = {
  search: "",
  category: "",
  visibility: "all",
  featured: "all",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 motion-reduce:transition-none";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.14em] text-slate-500";

function createApiFilters(filters, page) {
  const apiFilters = {
    search: filters.search.trim(),
    category: filters.category.trim(),
    page,
    limit: 20,
  };

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

function formatUpdatedDate(value) {
  if (!value) {
    return "Not available";
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

function AdminFaqsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, admin, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({ ...initialFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...initialFilters });
  const [faqs, setFaqs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || "",
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionFaqId, setActionFaqId] = useState("");

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
    () => createApiFilters(appliedFilters, page),
    [appliedFilters, page],
  );

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadFaqs() {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetchAdminFaqs(accessToken, apiFilters, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setFaqs(response.faqs);
        setPagination(response.pagination);
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
                pathname: "/admin/faqs",
              },
            },
          });

          return;
        }

        setFaqs([]);
        setPagination({
          page: 1,
          limit: 20,
          total: 0,
          pages: 1,
        });

        setError(
          requestError instanceof Error
            ? requestError.message
            : "FAQs could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadFaqs();

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

    setPage(1);
    setSuccessMessage("");
    setAppliedFilters({ ...formFilters });
  }

  function handleClearFilters() {
    setFormFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
    setPage(1);
    setError("");
    setSuccessMessage("");
  }

  function handleRefresh() {
    setError("");
    setSuccessMessage("");
    setRefreshKey((currentKey) => currentKey + 1);
  }

  function handleActionError(requestError) {
    if (requestError?.status === 401) {
      logout();
      navigate("/admin/login", { replace: true });
      return;
    }

    if (requestError?.status === 403) {
      setError(
        requestError.message ||
          "Your Admin role cannot perform this FAQ action.",
      );

      return;
    }

    setError(
      requestError instanceof Error
        ? requestError.message
        : "FAQ action could not be completed.",
    );
  }

  function updateCollection(updatedFaq, filterField) {
    const filterValue = apiFilters[filterField];

    const shouldRemove =
      typeof filterValue === "boolean" &&
      updatedFaq[filterField] !== filterValue;

    setFaqs((currentFaqs) =>
      shouldRemove
        ? currentFaqs.filter((faq) => faq._id !== updatedFaq._id)
        : currentFaqs.map((faq) =>
            faq._id === updatedFaq._id ? updatedFaq : faq,
          ),
    );

    if (shouldRemove) {
      setPagination((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
      }));
    }
  }

  async function handleToggleVisibility(faq) {
    if (!faq?._id || actionFaqId) {
      return;
    }

    try {
      setActionFaqId(faq._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminFaq(accessToken, faq._id, {
        isVisible: !faq.isVisible,
      });

      setSuccessMessage(
        response.faq.isVisible
          ? `"${response.faq.question}" is now visible.`
          : `"${response.faq.question}" is now hidden.`,
      );

      updateCollection(response.faq, "isVisible");
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionFaqId("");
    }
  }

  async function handleToggleFeatured(faq) {
    if (!faq?._id || actionFaqId) {
      return;
    }

    try {
      setActionFaqId(faq._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminFaq(accessToken, faq._id, {
        isFeatured: !faq.isFeatured,
      });

      setSuccessMessage(
        response.faq.isFeatured
          ? `"${response.faq.question}" is now featured.`
          : `"${response.faq.question}" is now a standard FAQ.`,
      );

      updateCollection(response.faq, "isFeatured");
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionFaqId("");
    }
  }

  async function handleDelete(faq) {
    if (!faq?._id || actionFaqId) {
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete this FAQ?\n\n${faq.question}\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionFaqId(faq._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminFaq(accessToken, faq._id);

      setSuccessMessage(
        `"${response.deletedFaq.question}" was permanently deleted.`,
      );

      setFaqs((currentFaqs) =>
        currentFaqs.filter((record) => record._id !== faq._id),
      );

      setPagination((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
      }));
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionFaqId("");
    }
  }

  const canDeleteFaqs = ["super-admin", "admin"].includes(admin?.role);

  return (
    <main className="admin-faqs-compact-page min-h-screen">
      <section className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="admin-faqs-eyebrow text-[10px] font-bold uppercase tracking-[0.16em]">
              Help & Answers
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              FAQs
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-5">
              Manage customer questions, visibility and display priority.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="admin-faqs-count-pill rounded-lg px-3 py-2 text-[11px] font-semibold">
              {isLoading
                ? "Loading..."
                : `${pagination.total} FAQ${pagination.total === 1 ? "" : "s"}`}
            </span>

            <Link
              className="admin-faqs-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
              to="/admin/faqs/new"
            >
              Add FAQ
            </Link>
          </div>
        </header>

        <form
          className="admin-faqs-toolbar mt-4 rounded-xl p-3"
          onSubmit={handleFilterSubmit}
        >
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(250px,1.5fr)_180px_150px_auto]">
            <div>
              <label className="sr-only" htmlFor="faq-search">
                Search FAQs
              </label>

              <input
                className={`${inputClassName} admin-faqs-input !mt-0 !min-h-10 !rounded-lg`}
                id="faq-search"
                name="search"
                onChange={handleFilterChange}
                placeholder="Search question, answer or category..."
                type="search"
                value={formFilters.search}
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="faq-category-filter">
                Category
              </label>

              <input
                className={`${inputClassName} admin-faqs-input !mt-0 !min-h-10 !rounded-lg`}
                id="faq-category-filter"
                name="category"
                onChange={handleFilterChange}
                placeholder="Category"
                type="text"
                value={formFilters.category}
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="faq-visibility-filter">
                Visibility
              </label>

              <select
                className={`${inputClassName} admin-faqs-input !mt-0 !min-h-10 !rounded-lg`}
                id="faq-visibility-filter"
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
                className="admin-faqs-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
                disabled={isLoading || Boolean(actionFaqId)}
                type="submit"
              >
                Apply
              </button>

              <button
                aria-label="Clear FAQ filters"
                className="admin-faqs-secondary-button inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold"
                disabled={isLoading || Boolean(actionFaqId)}
                onClick={handleClearFilters}
                title="Clear filters"
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          <details className="admin-faqs-more mt-2 rounded-lg">
            <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold">
              More Filters
            </summary>

            <div className="border-t px-3 py-3 sm:max-w-xs">
              <label
                className={`${labelClassName} !text-[10px]`}
                htmlFor="faq-featured-filter"
              >
                Display Type
              </label>

              <select
                className={`${inputClassName} admin-faqs-input !mt-1.5 !min-h-10 !rounded-lg`}
                id="faq-featured-filter"
                name="featured"
                onChange={handleFilterChange}
                value={formFilters.featured}
              >
                <option value="all">All FAQs</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </details>
        </form>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold">
            {isLoading
              ? "Loading FAQs..."
              : `${pagination.total} result${pagination.total === 1 ? "" : "s"} · Page ${pagination.page}/${pagination.pages}`}
          </p>

          <button
            className="admin-faqs-secondary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[11px] font-semibold"
            disabled={isLoading || Boolean(actionFaqId)}
            onClick={handleRefresh}
            type="button"
          >
            Refresh
          </button>
        </div>

        <div aria-live="polite">
          {successMessage ? (
            <div
              className="admin-faqs-success mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
              role="status"
            >
              {successMessage}
            </div>
          ) : null}

          {error ? (
            <div
              className="admin-faqs-error mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
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
            <span className="sr-only">Loading FAQs...</span>

            {[1, 2, 3, 4, 5].map((placeholder) => (
              <div
                className="admin-faqs-skeleton h-[88px] rounded-xl motion-reduce:animate-none"
                key={placeholder}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && faqs.length === 0 ? (
          <div className="admin-faqs-empty mt-3 rounded-xl px-5 py-9 text-center">
            <h2 className="text-base font-bold">No FAQs found</h2>

            <p className="mt-1 text-xs">
              Change the filters or create the first FAQ.
            </p>
          </div>
        ) : null}

        {!isLoading && faqs.length > 0 ? (
          <div className="mt-3 space-y-2">
            {faqs.map((faq) => {
              const actionPending = actionFaqId === faq._id;

              return (
                <article
                  className="admin-faqs-row min-w-0 rounded-xl"
                  key={faq._id}
                >
                  <div className="grid min-w-0 gap-3 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="admin-faqs-badge is-category rounded-md px-2 py-1 text-[9px] font-bold">
                          {faq.category}
                        </span>

                        <span
                          className={`admin-faqs-badge rounded-md px-2 py-1 text-[9px] font-bold ${
                            faq.isVisible ? "is-visible" : "is-hidden"
                          }`}
                        >
                          {faq.isVisible ? "Visible" : "Hidden"}
                        </span>

                        {faq.isFeatured ? (
                          <span className="admin-faqs-badge is-featured rounded-md px-2 py-1 text-[9px] font-bold">
                            Featured
                          </span>
                        ) : null}

                        <span className="admin-faqs-badge rounded-md px-2 py-1 text-[9px] font-bold">
                          Order {faq.order ?? 0}
                        </span>
                      </div>

                      <h2 className="mt-1.5 truncate text-sm font-bold">
                        {faq.question}
                      </h2>

                      <p className="mt-1 line-clamp-1 whitespace-pre-line text-[10px] leading-4">
                        {faq.answer}
                      </p>

                      <p className="mt-1 text-[9px]">
                        Updated {formatUpdatedDate(faq.updatedAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-2">
                      <Link
                        className="admin-faqs-primary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[10px] font-bold"
                        to={`/admin/faqs/${faq._id}/edit`}
                      >
                        Edit
                      </Link>

                      <details className="admin-faqs-actions relative">
                        <summary
                          aria-label={`More actions for ${faq.question}`}
                          className="admin-faqs-secondary-button inline-flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-base font-bold"
                          title="More actions"
                        >
                          …
                        </summary>

                        <div className="admin-faqs-action-menu absolute right-0 top-[calc(100%+0.4rem)] z-30 w-44 rounded-xl p-1.5">
                          <button
                            className="admin-faqs-menu-action"
                            disabled={actionFaqId !== ""}
                            onClick={() => handleToggleVisibility(faq)}
                            type="button"
                          >
                            {actionPending
                              ? "Working..."
                              : faq.isVisible
                                ? "Hide from public"
                                : "Show on public"}
                          </button>

                          <button
                            className="admin-faqs-menu-action"
                            disabled={actionFaqId !== ""}
                            onClick={() => handleToggleFeatured(faq)}
                            type="button"
                          >
                            {actionPending
                              ? "Working..."
                              : faq.isFeatured
                                ? "Make standard"
                                : "Make featured"}
                          </button>

                          <div className="admin-faqs-menu-divider my-1" />

                          <button
                            className="admin-faqs-menu-action is-danger"
                            disabled={actionFaqId !== "" || !canDeleteFaqs}
                            onClick={() => handleDelete(faq)}
                            title={
                              canDeleteFaqs
                                ? "Permanently delete FAQ"
                                : "Your role cannot permanently delete FAQs"
                            }
                            type="button"
                          >
                            {actionPending ? "Working..." : "Delete"}
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

        {pagination.pages > 1 ? (
          <nav
            aria-label="FAQ pagination"
            className="admin-faqs-pagination mt-4 flex items-center justify-between gap-3 rounded-xl p-2.5"
          >
            <button
              className="admin-faqs-secondary-button inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              Previous
            </button>

            <span className="text-[11px] font-semibold">
              {pagination.page} / {pagination.pages}
            </span>

            <button
              className="admin-faqs-secondary-button inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold"
              disabled={page >= pagination.pages || isLoading}
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.pages, current + 1),
                )
              }
              type="button"
            >
              Next
            </button>
          </nav>
        ) : null}
      </section>
    </main>
  );
}

export default AdminFaqsPage;