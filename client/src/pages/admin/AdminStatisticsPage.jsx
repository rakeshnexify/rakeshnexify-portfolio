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

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
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

  function handleLogout() {
    logout();

    navigate("/admin/login", {
      replace: true,
    });
  }

  const canDelete = ["super-admin", "admin"].includes(admin?.role);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <Link
            to="/admin/dashboard"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-600 font-extrabold text-white">
              RN
            </div>

            <div className="min-w-0">
              <p className="truncate font-extrabold text-slate-950">
                RakeshNexify
              </p>

              <p className="truncate text-xs font-medium text-slate-500">
                Statistics Management
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-slate-500 md:inline">
              {admin?.name}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
            >
              <span aria-hidden="true">←</span>
              Dashboard
            </Link>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
              Content Management
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Statistics
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Manage portfolio numbers such as completed projects, technologies,
              experience, companies and published content.
            </p>
          </div>

          <Link
            to="/admin/statistics/new"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Add New Statistic
          </Link>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_0.45fr_0.45fr_auto]"
        >
          <div>
            <label
              htmlFor="statistic-search"
              className="text-sm font-semibold text-slate-700"
            >
              Search statistics
            </label>

            <input
              id="statistic-search"
              name="search"
              type="search"
              value={formFilters.search}
              onChange={handleFilterChange}
              placeholder="Search label, key, value or description"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <div>
            <label
              htmlFor="statistic-visibility"
              className="text-sm font-semibold text-slate-700"
            >
              Visibility
            </label>

            <select
              id="statistic-visibility"
              name="visibility"
              value={formFilters.visibility}
              onChange={handleFilterChange}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            >
              <option value="all">All statistics</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="statistic-featured"
              className="text-sm font-semibold text-slate-700"
            >
              Type
            </label>

            <select
              id="statistic-featured"
              name="featured"
              value={formFilters.featured}
              onChange={handleFilterChange}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            >
              <option value="all">All types</option>
              <option value="featured">Featured</option>
              <option value="standard">Standard</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
            >
              Clear
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-600">
            {isLoading
              ? "Loading statistics..."
              : `${resultCount} statistic(s) found`}
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        {successMessage && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium leading-6 text-emerald-700"
          >
            {successMessage}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700"
          >
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && statistics.length === 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-950">
              No statistics found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Try changing or clearing the current filters.
            </p>
          </div>
        )}

        {!isLoading && statistics.length > 0 && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {statistics.map((statistic) => (
              <article
                key={statistic._id}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                    Order {statistic.order}
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {statistic.isFeatured && (
                      <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                        Featured
                      </span>
                    )}

                    <span
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                        statistic.isVisible
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {statistic.isVisible ? "Visible" : "Hidden"}
                    </span>
                  </div>
                </div>

                <p className="mt-6 text-4xl font-extrabold tracking-tight text-brand-600">
                  {createDisplayValue(statistic)}
                </p>

                <h2 className="mt-3 text-xl font-bold text-slate-950">
                  {statistic.label}
                </h2>

                <p className="mt-2 break-all text-xs font-semibold text-brand-600">
                  {statistic.key}
                </p>

                {statistic.description && (
                  <p className="mt-4 line-clamp-3 leading-7 text-slate-600">
                    {statistic.description}
                  </p>
                )}

                <div className="mt-auto border-t border-slate-100 pt-5">
                  <p className="text-xs text-slate-400">
                    Updated {formatDate(statistic.updatedAt)}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Link
                      to={`/admin/statistics/${statistic._id}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(statistic)}
                      disabled={Boolean(actionStatisticId)}
                      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        statistic.isVisible
                          ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {actionStatisticId === statistic._id
                        ? "Updating..."
                        : statistic.isVisible
                          ? "Hide"
                          : "Show"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(statistic)}
                      disabled={Boolean(actionStatisticId)}
                      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        statistic.isFeatured
                          ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                    >
                      {actionStatisticId === statistic._id
                        ? "Updating..."
                        : statistic.isFeatured
                          ? "Make Standard"
                          : "Make Featured"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteStatistic(statistic)}
                      disabled={Boolean(actionStatisticId) || !canDelete}
                      title={
                        canDelete
                          ? "Permanently delete statistic"
                          : "Your role cannot permanently delete statistics"
                      }
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionStatisticId === statistic._id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminStatisticsPage;
