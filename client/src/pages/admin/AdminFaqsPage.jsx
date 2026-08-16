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
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Help & Answers
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              FAQs
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage customer-facing questions, answers, dynamic categories,
              publication state and display priority.
            </p>
          </div>

          <Link
            to="/admin/faqs/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Add FAQ
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label htmlFor="faq-search" className={labelClassName}>
                Search
              </label>

              <input
                id="faq-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Question, answer or category"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="faq-category-filter" className={labelClassName}>
                Category
              </label>

              <input
                id="faq-category-filter"
                name="category"
                type="text"
                value={formFilters.category}
                onChange={handleFilterChange}
                placeholder="e.g. General"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="faq-visibility-filter"
                className={labelClassName}
              >
                Visibility
              </label>

              <select
                id="faq-visibility-filter"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All FAQs</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="faq-featured-filter"
                className={labelClassName}
              >
                Display type
              </label>

              <select
                id="faq-featured-filter"
                name="featured"
                value={formFilters.featured}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All FAQs</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              Clear
            </button>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {isLoading
                ? "Loading FAQs..."
                : `${pagination.total} FAQ${pagination.total === 1 ? "" : "s"}`}
            </p>

            {!isLoading && (
              <p className="mt-1 text-xs text-slate-500">
                Showing page {pagination.page} of {pagination.pages}.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
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
            className="mt-5 space-y-4"
          >
            <span className="sr-only">Loading FAQs...</span>

            {[1, 2, 3, 4].map((placeholder) => (
              <div
                key={placeholder}
                className="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && faqs.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-brand-50 text-xl font-bold text-brand-600">
              ?
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-950">
              No FAQs found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Change the filters or create the first FAQ.
            </p>
          </div>
        )}

        {!isLoading && faqs.length > 0 && (
          <div className="mt-5 space-y-4">
            {faqs.map((faq) => {
              const actionPending = actionFaqId === faq._id;

              return (
                <article
                  key={faq._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                          {faq.category}
                        </span>

                        {faq.isFeatured && (
                          <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                            Featured
                          </span>
                        )}

                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                            faq.isVisible
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {faq.isVisible ? "Visible" : "Hidden"}
                        </span>

                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          Order {faq.order ?? 0}
                        </span>
                      </div>

                      <h2 className="mt-4 break-words text-lg font-bold leading-7 text-slate-950">
                        {faq.question}
                      </h2>

                      <p className="mt-3 line-clamp-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                        {faq.answer}
                      </p>

                      <dl className="mt-4 border-t border-slate-100 pt-3 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <dt className="text-slate-500">Updated</dt>

                          <dd className="font-semibold text-slate-700">
                            {formatUpdatedDate(faq.updatedAt)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="grid shrink-0 grid-cols-2 gap-2 lg:w-64">
                      <Link
                        to={`/admin/faqs/${faq._id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(faq)}
                        disabled={actionFaqId !== ""}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                      >
                        {actionPending
                          ? "Working..."
                          : faq.isVisible
                            ? "Hide"
                            : "Show"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(faq)}
                        disabled={actionFaqId !== ""}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                      >
                        {actionPending
                          ? "Working..."
                          : faq.isFeatured
                            ? "Make Standard"
                            : "Make Featured"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(faq)}
                        disabled={actionFaqId !== "" || !canDeleteFaqs}
                        title={
                          canDeleteFaqs
                            ? "Permanently delete FAQ"
                            : "Your role cannot permanently delete FAQs"
                        }
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                      >
                        {actionPending ? "Working..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {pagination.pages > 1 && (
          <nav
            className="mt-6 flex flex-wrap items-center justify-center gap-3"
            aria-label="FAQ pagination"
          >
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || isLoading}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
            >
              Previous
            </button>

            <span className="text-sm font-semibold text-slate-600">
              Page {pagination.page} of {pagination.pages}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.min(pagination.pages, current + 1),
                )
              }
              disabled={page >= pagination.pages || isLoading}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
            >
              Next
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}

export default AdminFaqsPage;