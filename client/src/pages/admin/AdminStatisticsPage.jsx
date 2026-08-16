import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  deleteAdminStatistic,
  fetchAdminStatistics,
  updateAdminStatistic,
} from "../../services/adminStatisticsApi";

const initialFilters = {
  search: "",
  visibility: "all",
  featured: "all",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 motion-reduce:transition-none";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.14em] text-slate-500";

function createApiFilters(filters) {
  const apiFilters = {
    search: filters.search.trim(),
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

function formatDate(value) {
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

function createDisplayValue(statistic) {
  const prefix = String(statistic?.prefix || "").trim();
  const value = String(statistic?.value || "").trim();
  const suffix = String(statistic?.suffix || "").trim();

  return `${prefix}${value}${suffix}` || "0";
}

function AdminStatisticsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { accessToken, logout, admin } = useAdminAuth();

  const [formFilters, setFormFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [statistics, setStatistics] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionStatisticId, setActionStatisticId] = useState("");

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

    async function loadStatistics() {
      try {
        const response = await fetchAdminStatistics(accessToken, apiFilters, {
          signal: controller.signal,
        });

        setStatistics(response.statistics);
        setResultCount(response.count);
        setError("");
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
          return;
        }

        if (requestError?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,
            state: {
              from: {
                pathname: "/admin/statistics",
              },
            },
          });

          return;
        }

        console.error("Admin statistics loading failed:", requestError);

        setStatistics([]);
        setResultCount(0);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Statistics could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadStatistics();

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

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setAppliedFilters(formFilters);
  }

  function handleClearFilters() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setFormFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }

  function handleRefresh() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    setRefreshKey((currentKey) => currentKey + 1);
  }

  function handleAdminActionError(requestError) {
    if (requestError?.status === 401) {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: {
            pathname: "/admin/statistics",
          },
        },
      });

      return;
    }

    console.error("Admin statistic action failed:", requestError);

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Statistic action could not be completed.",
    );
  }

  async function handleToggleVisibility(statistic) {
    if (!statistic?._id || actionStatisticId) {
      return;
    }

    try {
      setActionStatisticId(statistic._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminStatistic(accessToken, statistic._id, {
        isVisible: !statistic.isVisible,
      });

      setSuccessMessage(
        response.statistic.isVisible
          ? `"${response.statistic.label}" is now visible on the portfolio.`
          : `"${response.statistic.label}" is now hidden from the portfolio.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleAdminActionError(requestError);
    } finally {
      setActionStatisticId("");
    }
  }

  async function handleToggleFeatured(statistic) {
    if (!statistic?._id || actionStatisticId) {
      return;
    }

    try {
      setActionStatisticId(statistic._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminStatistic(accessToken, statistic._id, {
        isFeatured: !statistic.isFeatured,
      });

      setSuccessMessage(
        response.statistic.isFeatured
          ? `"${response.statistic.label}" is now featured.`
          : `"${response.statistic.label}" is now a standard statistic.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleAdminActionError(requestError);
    } finally {
      setActionStatisticId("");
    }
  }

  async function handleDeleteStatistic(statistic) {
    if (!statistic?._id || actionStatisticId) {
      return;
    }

    const isConfirmed = window.confirm(
      `Permanently delete "${statistic.label}"?\n\nThis action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setActionStatisticId(statistic._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminStatistic(accessToken, statistic._id);

      setSuccessMessage(
        `"${response.deletedStatistic.label}" was permanently deleted.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleAdminActionError(requestError);
    } finally {
      setActionStatisticId("");
    }
  }

  const canDelete = ["super-admin", "admin"].includes(admin?.role);

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Content
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Statistics
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage portfolio metrics, display order, visibility and featured
              state.
            </p>
          </div>

          <Link
            to="/admin/statistics/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Add Statistic
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.5fr)_minmax(180px,0.5fr)]">
            <div>
              <label htmlFor="statistic-search" className={labelClassName}>
                Search
              </label>

              <input
                id="statistic-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Label, key, value or description"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="statistic-visibility" className={labelClassName}>
                Visibility
              </label>

              <select
                id="statistic-visibility"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All statistics</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label htmlFor="statistic-featured" className={labelClassName}>
                Display type
              </label>

              <select
                id="statistic-featured"
                name="featured"
                value={formFilters.featured}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All types</option>
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
                ? "Loading statistics..."
                : `${resultCount} statistic${resultCount === 1 ? "" : "s"}`}
            </p>

            {!isLoading && (
              <p className="mt-1 text-xs text-slate-500">
                Showing the records matching the applied filters.
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

        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <span className="sr-only">Loading statistics...</span>

            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && statistics.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-base font-bold text-slate-950">
              No statistics found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Try changing the filters or create a new statistic.
            </p>
          </div>
        )}

        {!isLoading && statistics.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {statistics.map((statistic) => {
              const isActionPending =
                actionStatisticId === statistic._id;

              return (
                <article
                  key={statistic._id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      Order {statistic.order ?? 0}
                    </span>

                    <div className="flex flex-wrap justify-end gap-2">
                      {statistic.isFeatured && (
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          Featured
                        </span>
                      )}

                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          statistic.isVisible
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {statistic.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="break-words text-3xl font-bold tracking-tight text-brand-600">
                      {createDisplayValue(statistic)}
                    </p>

                    <h2 className="mt-2 break-words text-lg font-bold text-slate-950">
                      {statistic.label}
                    </h2>

                    <p className="mt-1 break-all text-xs font-semibold text-brand-700">
                      {statistic.key}
                    </p>
                  </div>

                  {statistic.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {statistic.description}
                    </p>
                  )}

                  <dl className="mt-5 border-t border-slate-100 pt-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500">Updated</dt>

                      <dd className="text-right font-semibold text-slate-700">
                        {formatDate(statistic.updatedAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <Link
                      to={`/admin/statistics/${statistic._id}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(statistic)}
                      disabled={actionStatisticId !== ""}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending
                        ? "Working..."
                        : statistic.isVisible
                          ? "Hide"
                          : "Show"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(statistic)}
                      disabled={actionStatisticId !== ""}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending
                        ? "Working..."
                        : statistic.isFeatured
                          ? "Make Standard"
                          : "Make Featured"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteStatistic(statistic)}
                      disabled={actionStatisticId !== "" || !canDelete}
                      title={
                        canDelete
                          ? "Permanently delete statistic"
                          : "Your role cannot permanently delete statistics"
                      }
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending ? "Working..." : "Delete"}
                    </button>
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

export default AdminStatisticsPage;