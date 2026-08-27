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
    <main className="admin-catalog-page min-h-screen">
      <section className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="admin-catalog-eyebrow text-[10px] font-bold uppercase tracking-[0.16em]">
              Services & Sales
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Services
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-5">
              Manage public Services, visibility, featured state and order.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="admin-catalog-count-pill rounded-lg px-3 py-2 text-[11px] font-semibold">
              {isLoading
                ? "Loading..."
                : `${resultCount} Service${resultCount === 1 ? "" : "s"}`}
            </span>

            <Link
              className="admin-catalog-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
              to="/admin/services/new"
            >
              Add Service
            </Link>
          </div>
        </header>

        <form
          className="admin-catalog-toolbar mt-4 rounded-xl p-3"
          onSubmit={handleFilterSubmit}
        >
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_170px_170px_auto]">
            <div>
              <label
                className={`${labelClassName} sr-only`}
                htmlFor="service-search"
              >
                Search
              </label>

              <input
                className={`${inputClassName} admin-catalog-input !mt-0 !min-h-10 !rounded-lg`}
                id="service-search"
                name="search"
                onChange={handleFilterChange}
                placeholder="Search title, slug or description..."
                type="search"
                value={formFilters.search}
              />
            </div>

            <div>
              <label
                className={`${labelClassName} sr-only`}
                htmlFor="service-visibility"
              >
                Visibility
              </label>

              <select
                className={`${inputClassName} admin-catalog-input !mt-0 !min-h-10 !rounded-lg`}
                id="service-visibility"
                name="visibility"
                onChange={handleFilterChange}
                value={formFilters.visibility}
              >
                <option value="all">All visibility</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label
                className={`${labelClassName} sr-only`}
                htmlFor="service-featured"
              >
                Featured
              </label>

              <select
                className={`${inputClassName} admin-catalog-input !mt-0 !min-h-10 !rounded-lg`}
                id="service-featured"
                name="featured"
                onChange={handleFilterChange}
                value={formFilters.featured}
              >
                <option value="all">All states</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                className="admin-catalog-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
                disabled={isLoading || Boolean(actionServiceId)}
                type="submit"
              >
                Apply
              </button>

              <button
                className="admin-catalog-secondary-button inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold"
                disabled={isLoading || Boolean(actionServiceId)}
                onClick={handleClearFilters}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        </form>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold">
            {isLoading
              ? "Loading Services..."
              : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
          </p>

          <button
            className="admin-catalog-secondary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[11px] font-semibold"
            disabled={isLoading || Boolean(actionServiceId)}
            onClick={handleRefresh}
            type="button"
          >
            Refresh
          </button>
        </div>

        <div aria-live="polite">
          {successMessage ? (
            <div
              className="admin-catalog-success mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
              role="status"
            >
              {successMessage}
            </div>
          ) : null}

          {error ? (
            <div
              className="admin-catalog-error mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
              role="alert"
            >
              {error}

              <button
                className="ml-2 font-bold underline underline-offset-2"
                onClick={handleRefresh}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="mt-3 space-y-2" role="status">
            <span className="sr-only">Loading Services...</span>

            {[1, 2, 3, 4, 5].map((placeholder) => (
              <div
                className="admin-catalog-skeleton h-[86px] rounded-xl"
                key={placeholder}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && services.length === 0 ? (
          <div className="admin-catalog-empty mt-3 rounded-xl px-5 py-9 text-center">
            <h2 className="text-base font-bold">No Services found</h2>

            <p className="mt-1 text-xs">
              Change the filters or add a new Service.
            </p>
          </div>
        ) : null}

        {!isLoading && services.length > 0 ? (
          <div className="mt-3 space-y-2">
            {services.map((service) => {
              const isActionPending = actionServiceId === service._id;
              const technologies = Array.isArray(service.technologies)
                ? service.technologies
                : [];

              return (
                <article
                  className="admin-catalog-row min-w-0 rounded-xl"
                  key={service._id}
                >
                  <div className="grid min-w-0 gap-3 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span
                          className={`admin-catalog-badge rounded-md px-2 py-1 text-[9px] font-bold ${
                            service.isVisible ? "is-visible" : "is-hidden"
                          }`}
                        >
                          {service.isVisible ? "Visible" : "Hidden"}
                        </span>

                        {service.isFeatured ? (
                          <span className="admin-catalog-badge is-featured rounded-md px-2 py-1 text-[9px] font-bold">
                            Featured
                          </span>
                        ) : null}

                        <span className="admin-catalog-badge rounded-md px-2 py-1 text-[9px] font-bold">
                          Order {service.order ?? 0}
                        </span>

                        <span className="admin-catalog-meta text-[9px]">
                          Updated {formatDate(service.updatedAt)}
                        </span>
                      </div>

                      <div className="mt-1.5 flex min-w-0 flex-wrap items-baseline gap-x-2">
                        <h2 className="truncate text-sm font-bold">
                          {service.title}
                        </h2>

                        <span className="admin-catalog-slug max-w-64 truncate text-[10px]">
                          {service.slug}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-1 text-[10px] leading-4">
                        {service.shortDescription}
                      </p>

                      {technologies.length > 0 ? (
                        <div className="mt-1.5 flex min-w-0 flex-wrap gap-1">
                          {technologies.slice(0, 3).map((technology) => (
                            <span
                              className="admin-catalog-tag rounded-md px-1.5 py-0.5 text-[9px]"
                              key={`${service._id}-${technology}`}
                            >
                              {technology}
                            </span>
                          ))}

                          {technologies.length > 3 ? (
                            <span className="admin-catalog-tag rounded-md px-1.5 py-0.5 text-[9px]">
                              +{technologies.length - 3}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-2">
                      <Link
                        className="admin-catalog-primary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[10px] font-bold"
                        to={`/admin/services/${service._id}/edit`}
                      >
                        Edit
                      </Link>

                      <details className="admin-catalog-actions relative">
                        <summary
                          aria-label={`More actions for ${service.title}`}
                          className="admin-catalog-secondary-button inline-flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-base font-bold"
                          title="More actions"
                        >
                          …
                        </summary>

                        <div className="admin-catalog-action-menu absolute right-0 top-[calc(100%+0.4rem)] z-30 w-44 rounded-xl p-1.5">
                          <button
                            className="admin-catalog-menu-action"
                            disabled={Boolean(actionServiceId)}
                            onClick={() => handleToggleVisibility(service)}
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : service.isVisible
                                ? "Hide from public"
                                : "Show on public"}
                          </button>

                          <button
                            className="admin-catalog-menu-action"
                            disabled={Boolean(actionServiceId)}
                            onClick={() => handleToggleFeatured(service)}
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : service.isFeatured
                                ? "Make standard"
                                : "Make featured"}
                          </button>

                          <div className="admin-catalog-menu-divider my-1" />

                          <button
                            className="admin-catalog-menu-action is-danger"
                            disabled={
                              Boolean(actionServiceId) || !canDeleteServices
                            }
                            onClick={() => handleDeleteService(service)}
                            title={
                              canDeleteServices
                                ? "Permanently delete Service"
                                : "Your role cannot permanently delete Services"
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

export default AdminServicesPage;