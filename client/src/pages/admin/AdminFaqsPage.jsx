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

        const response = await fetchAdminFaqs(
          accessToken,
          apiFilters,
          { signal: controller.signal },
        );

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

      const response = await updateAdminFaq(
        accessToken,
        faq._id,
        {
          isVisible: !faq.isVisible,
        },
      );

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

      const response = await updateAdminFaq(
        accessToken,
        faq._id,
        {
          isFeatured: !faq.isFeatured,
        },
      );

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
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
              Help & Answers
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              FAQs
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Manage customer-facing questions, answers, dynamic categories,
              featured priority, display order and public visibility.
            </p>
          </div>

          <Link
            to="/admin/faqs/new"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Add New FAQ
          </Link>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label
                htmlFor="faq-search"
                className="text-sm font-semibold text-slate-700"
              >
                Search
              </label>

              <input
                id="faq-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Question, answer or category"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="faq-category-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Category
              </label>

              <input
                id="faq-category-filter"
                name="category"
                type="text"
                value={formFilters.category}
                onChange={handleFilterChange}
                placeholder="e.g. General"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="faq-visibility-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Visibility
              </label>

              <select
                id="faq-visibility-filter"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-brand-600"
              >
                <option value="all">All</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="faq-featured-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Featured
              </label>

              <select
                id="faq-featured-filter"
                name="featured"
                value={formFilters.featured}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-brand-600"
              >
                <option value="all">All</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              className="min-h-10 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white"
            >
              Apply Filters
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              className="min-h-10 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-600"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              className="min-h-10 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-600"
            >
              Refresh
            </button>
          </div>
        </form>

        {successMessage && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        )}

        {error && (
          <div
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-500">
            {isLoading ? "Loading FAQs..." : `${pagination.total} FAQ(s)`}
          </p>
        </div>

        {!isLoading && !error && faqs.length === 0 && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
              ?
            </div>
            <h2 className="mt-5 text-xl font-black text-slate-950">
              No FAQs found
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Create the first FAQ or change the current filters.
            </p>
          </div>
        )}

        {!isLoading && faqs.length > 0 && (
          <div className="mt-6 space-y-4">
            {faqs.map((faq) => {
              const actionPending = actionFaqId === faq._id;

              return (
                <article
                  key={faq._id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                          {faq.category}
                        </span>

                        {faq.isFeatured && (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                            Featured
                          </span>
                        )}

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            faq.isVisible
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {faq.isVisible ? "Visible" : "Hidden"}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                          Order {faq.order ?? 0}
                        </span>
                      </div>

                      <h2 className="mt-4 break-words text-xl font-black text-slate-950">
                        {faq.question}
                      </h2>

                      <p className="mt-3 line-clamp-3 whitespace-pre-line leading-7 text-slate-600">
                        {faq.answer}
                      </p>

                      <p className="mt-4 text-xs font-semibold text-slate-400">
                        Updated {formatUpdatedDate(faq.updatedAt)}
                      </p>
                    </div>

                    <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:w-64">
                      <Link
                        to={`/admin/faqs/${faq._id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(faq)}
                        disabled={Boolean(actionFaqId)}
                        className="min-h-10 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-600 disabled:opacity-50"
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
                        disabled={Boolean(actionFaqId)}
                        className="min-h-10 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700 disabled:opacity-50"
                      >
                        {actionPending
                          ? "Working..."
                          : faq.isFeatured
                            ? "Unfeature"
                            : "Feature"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(faq)}
                        disabled={Boolean(actionFaqId) || !canDeleteFaqs}
                        title={
                          canDeleteFaqs
                            ? "Permanently delete FAQ"
                            : "Your role cannot permanently delete FAQs"
                        }
                        className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-700 disabled:opacity-40"
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
          <div className="mt-7 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || isLoading}
              className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm font-bold text-slate-500">
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
              className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default AdminFaqsPage;
