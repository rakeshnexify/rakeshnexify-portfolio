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

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
              Content Management
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Services
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Search and review every public or hidden service stored in
              MongoDB.
            </p>
          </div>

          <Link
            to="/admin/services/new"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Add New Service
          </Link>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_0.45fr_0.45fr_auto]"
        >
          <div>
            <label
              htmlFor="service-search"
              className="text-sm font-semibold text-slate-700"
            >
              Search services
            </label>

            <input
              id="service-search"
              name="search"
              type="search"
              value={formFilters.search}
              onChange={handleFilterChange}
              placeholder="Search title, slug or description"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <div>
            <label
              htmlFor="service-visibility"
              className="text-sm font-semibold text-slate-700"
            >
              Visibility
            </label>

            <select
              id="service-visibility"
              name="visibility"
              value={formFilters.visibility}
              onChange={handleFilterChange}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            >
              <option value="all">All services</option>

              <option value="visible">Visible</option>

              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="service-featured"
              className="text-sm font-semibold text-slate-700"
            >
              Type
            </label>

            <select
              id="service-featured"
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
              ? "Loading services..."
              : `${resultCount} service(s) found`}
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

        {!isLoading && !error && services.length === 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-950">
              No services found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Try changing or clearing the current filters.
            </p>
          </div>
        )}

        {!isLoading && services.length > 0 && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article
                key={service._id}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                    Order {service.order}
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {service.isFeatured && (
                      <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                        Featured
                      </span>
                    )}

                    <span
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                        service.isVisible
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {service.isVisible ? "Visible" : "Hidden"}
                    </span>
                  </div>
                </div>

                <h2 className="mt-5 text-xl font-bold text-slate-950">
                  {service.title}
                </h2>

                <p className="mt-2 break-all text-xs font-semibold text-brand-600">
                  {service.slug}
                </p>

                <p className="mt-4 line-clamp-3 leading-7 text-slate-600">
                  {service.shortDescription}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(service.technologies || [])
                    .slice(0, 4)
                    .map((technology) => (
                      <span
                        key={`${service._id}-${technology}`}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                      >
                        {technology}
                      </span>
                    ))}
                </div>

                <div className="mt-auto border-t border-slate-100 pt-5">
                  <p className="text-xs text-slate-400">
                    Updated {formatDate(service.updatedAt)}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Link
                      to={`/admin/services/${service._id}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(service)}
                      disabled={Boolean(actionServiceId)}
                      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        service.isVisible
                          ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {actionServiceId === service._id
                        ? "Updating..."
                        : service.isVisible
                          ? "Hide"
                          : "Show"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(service)}
                      disabled={Boolean(actionServiceId)}
                      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        service.isFeatured
                          ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                    >
                      {actionServiceId === service._id
                        ? "Updating..."
                        : service.isFeatured
                          ? "Make Standard"
                          : "Make Featured"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteService(service)}
                      disabled={
                        Boolean(actionServiceId) ||
                        !["super-admin", "admin"].includes(admin?.role)
                      }
                      title={
                        ["super-admin", "admin"].includes(admin?.role)
                          ? "Permanently delete service"
                          : "Your role cannot permanently delete services"
                      }
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionServiceId === service._id
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

export default AdminServicesPage;
