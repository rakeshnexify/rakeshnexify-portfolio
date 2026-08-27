import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import { fetchAdminServices } from "../../services/adminServicesApi";
import {
  deleteAdminServicePackage,
  fetchAdminServicePackages,
  updateAdminServicePackage,
} from "../../services/adminServicePackagesApi";

const initialFilters = {
  search: "",
  service: "",
  group: "",
  visibility: "all",
  featured: "all",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition-colors duration-150 motion-reduce:transition-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.08em] text-slate-500";

function createApiFilters(filters) {
  const apiFilters = {
    search: filters.search.trim(),
    service: filters.service,
    group: filters.group,
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

function getRelationId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
}

function formatPrice(servicePackage) {
  if (servicePackage.pricingMode === "custom") {
    return servicePackage.priceLabel || "Custom pricing";
  }

  if (
    servicePackage.price === null ||
    servicePackage.price === undefined ||
    servicePackage.price === ""
  ) {
    return servicePackage.priceLabel || "Price not set";
  }

  const currency = String(servicePackage.currency || "NPR").toUpperCase();

  try {
    const formattedPrice = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(servicePackage.price));

    return servicePackage.pricingMode === "starting-from"
      ? `From ${formattedPrice}`
      : formattedPrice;
  } catch {
    return `${currency} ${servicePackage.price}`;
  }
}

function formatBillingCycle(value) {
  const labels = {
    "one-time": "One-time",
    monthly: "Monthly",
    yearly: "Yearly",
    custom: "Custom",
  };

  return labels[value] || value || "Not set";
}

function AdminServicePackagesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { accessToken, logout, admin } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({
    ...initialFilters,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    ...initialFilters,
  });

  const [servicePackages, setServicePackages] = useState([]);
  const [services, setServices] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionPackageId, setActionPackageId] = useState("");

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

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadServices() {
      try {
        setServicesLoading(true);

        const response = await fetchAdminServices(
          accessToken,
          {},
          {
            signal: controller.signal,
          },
        );

        setServices(response.services);
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
                pathname: "/admin/service-packages",
              },
            },
          });

          return;
        }

        console.error("Service options loading failed:", requestError);

        setServices([]);
      } finally {
        if (!controller.signal.aborted) {
          setServicesLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      controller.abort();
    };
  }, [accessToken, logout, navigate]);

  const apiFilters = useMemo(
    () => createApiFilters(appliedFilters),
    [appliedFilters],
  );

  const servicesById = useMemo(
    () =>
      new Map(
        services.map((service) => [String(service._id), service]),
      ),
    [services],
  );

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadServicePackages() {
      try {
        const response = await fetchAdminServicePackages(
          accessToken,
          apiFilters,
          {
            signal: controller.signal,
          },
        );

        setServicePackages(response.servicePackages);
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
                pathname: "/admin/service-packages",
              },
            },
          });

          return;
        }

        console.error(
          "Admin Service Packages loading failed:",
          requestError,
        );

        setServicePackages([]);
        setResultCount(0);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Service Packages could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadServicePackages();

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

    setAppliedFilters({
      ...formFilters,
    });
  }

  function handleClearFilters() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    setFormFilters({
      ...initialFilters,
    });

    setAppliedFilters({
      ...initialFilters,
    });
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
            pathname: "/admin/service-packages",
          },
        },
      });

      return;
    }

    console.error(
      "Admin Service Package action failed:",
      requestError,
    );

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Service Package action could not be completed.",
    );
  }

  async function handleToggleVisibility(servicePackage) {
    if (!servicePackage?._id || actionPackageId) {
      return;
    }

    try {
      setActionPackageId(servicePackage._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminServicePackage(
        accessToken,
        servicePackage._id,
        {
          isVisible: !servicePackage.isVisible,
        },
      );

      setSuccessMessage(
        response.servicePackage.isVisible
          ? `"${response.servicePackage.name}" is now visible.`
          : `"${response.servicePackage.name}" is now hidden.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleAdminActionError(requestError);
    } finally {
      setActionPackageId("");
    }
  }

  async function handleToggleFeatured(servicePackage) {
    if (!servicePackage?._id || actionPackageId) {
      return;
    }

    try {
      setActionPackageId(servicePackage._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminServicePackage(
        accessToken,
        servicePackage._id,
        {
          isFeatured: !servicePackage.isFeatured,
        },
      );

      setSuccessMessage(
        response.servicePackage.isFeatured
          ? `"${response.servicePackage.name}" is now featured.`
          : `"${response.servicePackage.name}" is now standard.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleAdminActionError(requestError);
    } finally {
      setActionPackageId("");
    }
  }

  async function handleDelete(servicePackage) {
    if (!servicePackage?._id || actionPackageId) {
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete "${servicePackage.name}"?\n\nIf Package Designs reference this package, deletion will be blocked.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionPackageId(servicePackage._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminServicePackage(
        accessToken,
        servicePackage._id,
      );

      setSuccessMessage(
        response.message ||
          `"${servicePackage.name}" was permanently deleted.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleAdminActionError(requestError);
    } finally {
      setActionPackageId("");
    }
  }

  function getServiceLabel(servicePackage) {
    if (
      servicePackage?.service &&
      typeof servicePackage.service === "object"
    ) {
      return servicePackage.service.title || "Service";
    }

    const service = servicesById.get(
      getRelationId(servicePackage?.service),
    );

    return service?.title || "Service";
  }

  const canDeletePackages = ["super-admin", "admin"].includes(
    admin?.role,
  );

  return (
    <main className="admin-catalog-page min-h-screen">
      <section className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="admin-catalog-eyebrow text-[10px] font-bold uppercase tracking-[0.16em]">
              Services & Sales
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Service Packages
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-5">
              Manage package pricing, billing, features and public state.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="admin-catalog-count-pill rounded-lg px-3 py-2 text-[11px] font-semibold">
              {isLoading
                ? "Loading..."
                : `${resultCount} Package${resultCount === 1 ? "" : "s"}`}
            </span>

            <Link
              className="admin-catalog-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
              to="/admin/service-packages/new"
            >
              Add Package
            </Link>
          </div>
        </header>

        <form
          className="admin-catalog-toolbar mt-4 rounded-xl p-3"
          onSubmit={handleFilterSubmit}
        >
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(230px,1.4fr)_190px_150px_150px_auto]">
            <div>
              <label
                className={`${labelClassName} sr-only`}
                htmlFor="service-package-search"
              >
                Search
              </label>

              <input
                className={`${inputClassName} admin-catalog-input !mt-0 !min-h-10 !rounded-lg`}
                id="service-package-search"
                name="search"
                onChange={handleFilterChange}
                placeholder="Search package..."
                type="search"
                value={formFilters.search}
              />
            </div>

            <div>
              <label
                className={`${labelClassName} sr-only`}
                htmlFor="service-package-service-filter"
              >
                Service
              </label>

              <select
                className={`${inputClassName} admin-catalog-input !mt-0 !min-h-10 !rounded-lg`}
                disabled={servicesLoading}
                id="service-package-service-filter"
                name="service"
                onChange={handleFilterChange}
                value={formFilters.service}
              >
                <option value="">
                  {servicesLoading ? "Loading Services..." : "All Services"}
                </option>

                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`${labelClassName} sr-only`}
                htmlFor="service-package-group-filter"
              >
                Group
              </label>

              <select
                className={`${inputClassName} admin-catalog-input !mt-0 !min-h-10 !rounded-lg`}
                id="service-package-group-filter"
                name="group"
                onChange={handleFilterChange}
                value={formFilters.group}
              >
                <option value="">All groups</option>
                <option value="development">Development</option>
                <option value="management">Management</option>
              </select>
            </div>

            <div>
              <label
                className={`${labelClassName} sr-only`}
                htmlFor="service-package-visibility-filter"
              >
                Visibility
              </label>

              <select
                className={`${inputClassName} admin-catalog-input !mt-0 !min-h-10 !rounded-lg`}
                id="service-package-visibility-filter"
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
                className="admin-catalog-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
                disabled={isLoading || Boolean(actionPackageId)}
                type="submit"
              >
                Apply
              </button>

              <button
                className="admin-catalog-secondary-button inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold"
                disabled={isLoading || Boolean(actionPackageId)}
                onClick={handleClearFilters}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          <details className="admin-catalog-more mt-2 rounded-lg">
            <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold">
              More Filters
            </summary>

            <div className="border-t px-3 py-3 sm:max-w-xs">
              <label
                className={`${labelClassName} !text-[10px]`}
                htmlFor="service-package-featured-filter"
              >
                Featured
              </label>

              <select
                className={`${inputClassName} admin-catalog-input !mt-1.5 !min-h-10 !rounded-lg`}
                id="service-package-featured-filter"
                name="featured"
                onChange={handleFilterChange}
                value={formFilters.featured}
              >
                <option value="all">All states</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </details>
        </form>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold">
            {isLoading
              ? "Loading Service Packages..."
              : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
          </p>

          <button
            className="admin-catalog-secondary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[11px] font-semibold"
            disabled={isLoading || Boolean(actionPackageId)}
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
            <span className="sr-only">Loading Service Packages...</span>

            {[1, 2, 3, 4, 5].map((placeholder) => (
              <div
                className="admin-catalog-skeleton h-[94px] rounded-xl"
                key={placeholder}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && servicePackages.length === 0 ? (
          <div className="admin-catalog-empty mt-3 rounded-xl px-5 py-9 text-center">
            <h2 className="text-base font-bold">No Service Packages found</h2>

            <p className="mt-1 text-xs">
              Change the filters or create a new package.
            </p>
          </div>
        ) : null}

        {!isLoading && servicePackages.length > 0 ? (
          <div className="mt-3 space-y-2">
            {servicePackages.map((servicePackage) => {
              const isActionPending =
                actionPackageId === servicePackage._id;

              const featureCount = Array.isArray(servicePackage.features)
                ? servicePackage.features.length
                : 0;

              return (
                <article
                  className="admin-catalog-row min-w-0 rounded-xl"
                  key={servicePackage._id}
                >
                  <div className="grid min-w-0 gap-3 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span
                          className="admin-catalog-badge rounded-md px-2 py-1 text-[9px] font-bold"
                          data-group={servicePackage.group}
                        >
                          {servicePackage.group === "management"
                            ? "Management"
                            : "Development"}
                        </span>

                        <span
                          className={`admin-catalog-badge rounded-md px-2 py-1 text-[9px] font-bold ${
                            servicePackage.isVisible ? "is-visible" : "is-hidden"
                          }`}
                        >
                          {servicePackage.isVisible ? "Visible" : "Hidden"}
                        </span>

                        {servicePackage.isFeatured ? (
                          <span className="admin-catalog-badge is-featured rounded-md px-2 py-1 text-[9px] font-bold">
                            Featured
                          </span>
                        ) : null}

                        <span className="admin-catalog-meta text-[9px]">
                          {getServiceLabel(servicePackage)}
                        </span>
                      </div>

                      <div className="mt-1.5 flex min-w-0 flex-wrap items-baseline gap-x-2">
                        <h2 className="truncate text-sm font-bold">
                          {servicePackage.name}
                        </h2>

                        <span className="admin-catalog-slug max-w-52 truncate text-[10px]">
                          {servicePackage.slug}
                        </span>
                      </div>

                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                        <span className="admin-catalog-price font-bold">
                          {formatPrice(servicePackage)}
                        </span>

                        <span>
                          {servicePackage.billingLabel ||
                            formatBillingCycle(servicePackage.billingCycle)}
                        </span>

                        <span>{featureCount} features</span>

                        <span>Order {servicePackage.order ?? 0}</span>

                        {servicePackage.badge ? (
                          <span>{servicePackage.badge}</span>
                        ) : null}
                      </div>

                      <p className="mt-1 line-clamp-1 text-[10px] leading-4">
                        {servicePackage.shortDescription}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      <Link
                        className="admin-catalog-primary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[10px] font-bold"
                        to={`/admin/service-packages/${servicePackage._id}/edit`}
                      >
                        Edit
                      </Link>

                      <Link
                        className="admin-catalog-secondary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[10px] font-semibold"
                        to={`/admin/package-designs?servicePackage=${servicePackage._id}`}
                      >
                        Designs
                      </Link>

                      <details className="admin-catalog-actions relative">
                        <summary
                          aria-label={`More actions for ${servicePackage.name}`}
                          className="admin-catalog-secondary-button inline-flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-base font-bold"
                          title="More actions"
                        >
                          …
                        </summary>

                        <div className="admin-catalog-action-menu absolute right-0 top-[calc(100%+0.4rem)] z-30 w-44 rounded-xl p-1.5">
                          <button
                            className="admin-catalog-menu-action"
                            disabled={actionPackageId !== ""}
                            onClick={() =>
                              handleToggleVisibility(servicePackage)
                            }
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : servicePackage.isVisible
                                ? "Hide from public"
                                : "Show on public"}
                          </button>

                          <button
                            className="admin-catalog-menu-action"
                            disabled={actionPackageId !== ""}
                            onClick={() =>
                              handleToggleFeatured(servicePackage)
                            }
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : servicePackage.isFeatured
                                ? "Make standard"
                                : "Make featured"}
                          </button>

                          <div className="admin-catalog-menu-divider my-1" />

                          <button
                            className="admin-catalog-menu-action is-danger"
                            disabled={
                              actionPackageId !== "" || !canDeletePackages
                            }
                            onClick={() => handleDelete(servicePackage)}
                            title={
                              canDeletePackages
                                ? "Permanently delete package"
                                : "Your role cannot permanently delete packages"
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

export default AdminServicePackagesPage;