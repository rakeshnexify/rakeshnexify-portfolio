import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  deleteAdminService,
  fetchAdminServices,
  updateAdminService,
} from "../../services/adminServicesApi";

const initialFilters = {
  search: "",
  visibility: "all",
  featured: "all",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition-colors duration-150 motion-reduce:transition-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.08em] text-slate-500";

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

function AdminServicesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { accessToken, logout, admin } = useAdminAuth();

  const [formFilters, setFormFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const [services, setServices] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionServiceId, setActionServiceId] = useState("");

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

    async function loadServices() {
      try {
        const response = await fetchAdminServices(accessToken, apiFilters, {
          signal: controller.signal,
        });

        setServices(response.services);
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
                pathname: "/admin/services",
              },
            },
          });

          return;
        }

        console.error("Admin services loading failed:", requestError);

        setServices([]);
        setResultCount(0);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Services could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadServices();

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
            pathname: "/admin/services",
          },
        },
      });

      return;
    }

    console.error("Admin service action failed:", requestError);

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Service action could not be completed.",
    );
  }

  async function handleToggleVisibility(service) {
    if (!service?._id || actionServiceId) {
      return;
    }

    try {
      setActionServiceId(service._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminService(accessToken, service._id, {
        isVisible: !service.isVisible,
      });

      setSuccessMessage(
        response.service.isVisible
          ? `"${response.service.title}" is now visible on the portfolio.`
          : `"${response.service.title}" is now hidden from the portfolio.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleAdminActionError(requestError);
    } finally {
      setActionServiceId("");
    }
  }

  async function handleToggleFeatured(service) {
    if (!service?._id || actionServiceId) {
      return;
    }

    try {
      setActionServiceId(service._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminService(accessToken, service._id, {
        isFeatured: !service.isFeatured,
      });

      setSuccessMessage(
        response.service.isFeatured
          ? `"${response.service.title}" is now featured.`
          : `"${response.service.title}" is now a standard service.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleAdminActionError(requestError);
    } finally {
      setActionServiceId("");
    }
  }

  async function handleDeleteService(service) {
    if (!service?._id || actionServiceId) {
      return;
    }

    const isConfirmed = window.confirm(
      `Permanently delete "${service.title}"?\n\nThis action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setActionServiceId(service._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminService(accessToken, service._id);

      setSuccessMessage(
        `"${response.deletedService.title}" was permanently deleted.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleAdminActionError(requestError);
    } finally {
      setActionServiceId("");
    }
  }

  const canDeleteServices = ["super-admin", "admin"].includes(admin?.role);

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="uppercase tracking-[0.14em] text-brand-700">
                Services & Sales
              </span>

              <span aria-hidden="true" className="text-slate-300">
                /
              </span>

              <span className="text-slate-500">Content management</span>
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Services
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage the Services displayed across the public portfolio,
              including visibility, featured state and ordering.
            </p>
          </div>

          <Link
            to="/admin/services/new"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Add Service
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto] lg:items-end">
            <div>
              <label htmlFor="service-search" className={labelClassName}>
                Search
              </label>

              <input
                id="service-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Title, slug or description"
                className={`${inputClassName} px-4 placeholder:text-slate-400`}
              />
            </div>

            <div>
              <label htmlFor="service-visibility" className={labelClassName}>
                Visibility
              </label>

              <select
                id="service-visibility"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All Services</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label htmlFor="service-featured" className={labelClassName}>
                Featured state
              </label>

              <select
                id="service-featured"
                name="featured"
                value={formFilters.featured}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All states</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 lg:flex-none"
              >
                Apply
              </button>

              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-slate-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Clear
              </button>
            </div>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-700">
              {isLoading
                ? "Loading Services..."
                : `${resultCount} Service${resultCount === 1 ? "" : "s"}`}
            </p>

            {!isLoading ? (
              <p className="mt-0.5 text-xs text-slate-500">
                Matching the currently applied filters.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading || Boolean(actionServiceId)}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div aria-live="polite">
          {successMessage ? (
            <div
              role="status"
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
            >
              <p className="text-sm font-semibold leading-6 text-emerald-800">
                {successMessage}
              </p>
            </div>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm font-semibold leading-6 text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-3 min-h-10 text-sm font-bold text-red-700 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && services.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-base font-black text-slate-950">
              No Services found
            </p>

            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Try changing the filters or add a new Service.
            </p>
          </div>
        ) : null}

        {!isLoading && services.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => {
              const isActionPending = actionServiceId === service._id;
              const technologies = Array.isArray(service.technologies)
                ? service.technologies
                : [];

              return (
                <article
                  key={service._id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      Order {service.order ?? 0}
                    </span>

                    <div className="flex flex-wrap justify-end gap-2">
                      {service.isFeatured ? (
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          Featured
                        </span>
                      ) : null}

                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          service.isVisible
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {service.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 min-w-0">
                    <h2 className="break-words text-lg font-black tracking-tight text-slate-950">
                      {service.title}
                    </h2>

                    <p className="mt-1.5 break-all text-xs font-semibold text-brand-700">
                      {service.slug}
                    </p>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {service.shortDescription}
                    </p>
                  </div>

                  {technologies.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {technologies.slice(0, 4).map((technology) => (
                        <span
                          key={`${service._id}-${technology}`}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
                        >
                          {technology}
                        </span>
                      ))}

                      {technologies.length > 4 ? (
                        <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                          +{technologies.length - 4} more
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-auto pt-5">
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-xs text-slate-400">
                        Updated {formatDate(service.updatedAt)}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link
                          to={`/admin/services/${service._id}/edit`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(service)}
                          disabled={Boolean(actionServiceId)}
                          className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${
                            service.isVisible
                              ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                              : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {isActionPending
                            ? "Working..."
                            : service.isVisible
                              ? "Hide"
                              : "Show"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(service)}
                          disabled={Boolean(actionServiceId)}
                          className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${
                            service.isFeatured
                              ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                              : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          }`}
                        >
                          {isActionPending
                            ? "Working..."
                            : service.isFeatured
                              ? "Make Standard"
                              : "Make Featured"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteService(service)}
                          disabled={
                            Boolean(actionServiceId) || !canDeleteServices
                          }
                          title={
                            canDeleteServices
                              ? "Permanently delete Service"
                              : "Your role cannot permanently delete Services"
                          }
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-sm font-bold text-red-700 transition-colors duration-150 motion-reduce:transition-none hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isActionPending ? "Working..." : "Delete"}
                        </button>
                      </div>
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

export default AdminServicesPage;