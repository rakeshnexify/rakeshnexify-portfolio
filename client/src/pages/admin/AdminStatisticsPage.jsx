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
  "mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 sm:min-h-10 sm:px-3 sm:text-sm";

const labelClassName =
  "text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 sm:text-[11px]";

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
    <main className="rnx-admin-statistics-ultra-compact-v487 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
        <header className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
              Content
            </p>

            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <h1 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
                Statistics
              </h1>

              <span className="inline-flex min-h-6 items-center rounded-md bg-slate-200/70 px-2 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:text-[10px]">
                {isLoading ? "..." : resultCount}
              </span>
            </div>

            <p className="mt-0.5 hidden text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:block">
              Manage portfolio metrics and public display.
            </p>
          </div>

          <Link
            to="/admin/statistics/new"
            className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 px-3 text-[10px] font-semibold text-white transition hover:bg-brand-700 sm:min-h-9 sm:text-[11px]"
          >
            Add Statistic
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_150px_150px_auto] sm:items-end">
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
                placeholder="Label, key or value"
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
                <option value="all">All</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label htmlFor="statistic-featured" className={labelClassName}>
                Type
              </label>

              <select
                id="statistic-featured"
                name="featured"
                value={formFilters.featured}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-300 bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
              >
                Clear
              </button>

              <button
                type="submit"
                className="inline-flex min-h-8 items-center justify-center rounded-lg bg-brand-600 px-2.5 text-[10px] font-semibold text-white transition hover:bg-brand-700"
              >
                Apply
              </button>
            </div>
          </div>
        </form>

        <div className="mt-2 flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 dark:border-slate-800">
          <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
            {isLoading
              ? "Loading..."
              : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex min-h-7 items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 text-[9px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:text-[10px]"
          >
            Refresh
          </button>
        </div>

        <div aria-live="polite">
          {successMessage && (
            <div
              role="status"
              className="mt-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              {successMessage}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              {error}
            </div>
          )}
        </div>

        {isLoading && (
          <div role="status" aria-live="polite" className="mt-1.5 space-y-1">
            <span className="sr-only">Loading Statistics...</span>

            {[1, 2, 3, 4].map((placeholder) => (
              <div
                key={placeholder}
                className="h-12 animate-pulse rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && statistics.length === 0 && (
          <div className="mt-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-bold text-slate-950 dark:text-white">
              No statistics found
            </p>

            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              Change filters or create the first statistic.
            </p>
          </div>
        )}

        {!isLoading && statistics.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {statistics.map((statistic) => {
              const isActionPending =
                actionStatisticId === statistic._id;

              return (
                <article
                  key={statistic._id}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-[9px] font-black text-white dark:border-slate-700">
                      <span>
                        {String(statistic.label || "S")
                          .trim()
                          .slice(0, 1)
                          .toUpperCase()}
                      </span>

                      {statistic.iconUrl && (
                        <img
                          src={statistic.iconUrl}
                          alt=""
                          className="absolute inset-0 size-full bg-white object-contain p-1"
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                          }}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span className="shrink-0 text-[13px] font-black tracking-tight text-brand-600 dark:text-brand-300 sm:text-sm">
                          {createDisplayValue(statistic)}
                        </span>

                        <h2 className="min-w-0 truncate text-[11px] font-bold text-slate-950 dark:text-white sm:text-xs">
                          {statistic.label}
                        </h2>

                        <span
                          className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                            statistic.isVisible
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {statistic.isVisible ? "Visible" : "Hidden"}
                        </span>

                        {statistic.isFeatured && (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            Featured
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[8px] text-slate-500 dark:text-slate-400 sm:text-[9px]">
                        <span className="max-w-36 truncate font-semibold text-brand-700 dark:text-brand-300">
                          {statistic.key}
                        </span>

                        <span aria-hidden="true">/</span>
                        <span>#{statistic.order ?? 0}</span>

                        {statistic.accent && (
                          <>
                            <span aria-hidden="true">/</span>
                            <span>{statistic.accent}</span>
                          </>
                        )}

                        {statistic.icon && (
                          <>
                            <span aria-hidden="true">/</span>
                            <span className="max-w-28 truncate">{statistic.icon}</span>
                          </>
                        )}

                        {statistic.url && (
                          <>
                            <span aria-hidden="true">/</span>
                            <span>Linked</span>
                          </>
                        )}

                        <span aria-hidden="true">/</span>
                        <span>{formatDate(statistic.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        to={`/admin/statistics/${statistic._id}/edit`}
                        className="inline-flex min-h-7 items-center justify-center rounded-md bg-brand-600 px-2 text-[9px] font-semibold text-white transition hover:bg-brand-700 sm:min-h-8 sm:text-[10px]"
                      >
                        Edit
                      </Link>

                      <details className="group relative">
                        <summary
                          className="grid size-7 cursor-pointer list-none place-items-center rounded-md border border-slate-300 bg-white text-sm font-bold leading-none text-slate-600 marker:hidden transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 sm:size-8"
                          aria-label={`More actions for ${statistic.label}`}
                        >
                          <span aria-hidden="true">&#8942;</span>
                        </summary>

                        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-950">
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(statistic)}
                            disabled={actionStatisticId !== ""}
                            className="flex min-h-8 w-full items-center rounded-md px-2 text-left text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {isActionPending
                              ? "Working..."
                              : statistic.isVisible
                                ? "Hide from public"
                                : "Show publicly"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(statistic)}
                            disabled={actionStatisticId !== ""}
                            className="flex min-h-8 w-full items-center rounded-md px-2 text-left text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {isActionPending
                              ? "Working..."
                              : statistic.isFeatured
                                ? "Make standard"
                                : "Make featured"}
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
                            className="flex min-h-8 w-full items-center rounded-md px-2 text-left text-[10px] font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/50"
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
        )}
      </section>
    </main>
  );
}

export default AdminStatisticsPage;
