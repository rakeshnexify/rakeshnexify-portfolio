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
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="uppercase tracking-[0.14em] text-brand-700">
                Catalog
              </span>

              <span aria-hidden="true" className="text-slate-300">
                /
              </span>

              <span className="text-slate-500">
                Pricing management
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Service Packages
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage Development and Management packages, pricing,
              billing, comparison features, badges and public visibility
              for each Service.
            </p>
          </div>

          <Link
            to="/admin/service-packages/new"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Add Package
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div>
            <h2 className="text-base font-black text-slate-950">
              Filters
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Narrow packages by Service, package group and public state.
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="md:col-span-2 xl:col-span-1">
              <label
                htmlFor="service-package-search"
                className={labelClassName}
              >
                Search
              </label>

              <input
                id="service-package-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Name, slug or description"
                className={`${inputClassName} px-4 placeholder:text-slate-400`}
              />
            </div>

            <div>
              <label
                htmlFor="service-package-service-filter"
                className={labelClassName}
              >
                Service
              </label>

              <select
                id="service-package-service-filter"
                name="service"
                value={formFilters.service}
                onChange={handleFilterChange}
                disabled={servicesLoading}
                className={inputClassName}
              >
                <option value="">
                  {servicesLoading
                    ? "Loading Services..."
                    : "All Services"}
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
                htmlFor="service-package-group-filter"
                className={labelClassName}
              >
                Group
              </label>

              <select
                id="service-package-group-filter"
                name="group"
                value={formFilters.group}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="">All groups</option>
                <option value="development">Development</option>
                <option value="management">Management</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="service-package-visibility-filter"
                className={labelClassName}
              >
                Visibility
              </label>

              <select
                id="service-package-visibility-filter"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All packages</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="service-package-featured-filter"
                className={labelClassName}
              >
                Featured
              </label>

              <select
                id="service-package-featured-filter"
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
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-slate-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Clear
            </button>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-700">
              {isLoading
                ? "Loading Service Packages..."
                : `${resultCount} package${
                    resultCount === 1 ? "" : "s"
                  }`}
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
            disabled={isLoading}
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
                className="h-[29rem] animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && servicePackages.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-base font-black text-slate-950">
              No Service Packages found
            </p>

            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Change the filters or create a new package.
            </p>
          </div>
        ) : null}

        {!isLoading && servicePackages.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {servicePackages.map((servicePackage) => {
              const isActionPending =
                actionPackageId === servicePackage._id;

              const featureCount = Array.isArray(
                servicePackage.features,
              )
                ? servicePackage.features.length
                : 0;

              return (
                <article
                  key={servicePackage._id}
                  className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          servicePackage.group === "management"
                            ? "bg-violet-50 text-violet-700"
                            : "bg-sky-50 text-sky-700"
                        }`}
                      >
                        {servicePackage.group === "management"
                          ? "Management"
                          : "Development"}
                      </span>

                      {servicePackage.isFeatured ? (
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          Featured
                        </span>
                      ) : null}
                    </div>

                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                        servicePackage.isVisible
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {servicePackage.isVisible ? "Visible" : "Hidden"}
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                    {getServiceLabel(servicePackage)}
                  </p>

                  <h2 className="mt-2 break-words text-lg font-black tracking-tight text-slate-950">
                    {servicePackage.name}
                  </h2>

                  <p className="mt-1 break-all text-xs font-semibold text-brand-700">
                    {servicePackage.slug}
                  </p>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xl font-black tracking-tight text-slate-950">
                      {formatPrice(servicePackage)}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {servicePackage.billingLabel ||
                        formatBillingCycle(
                          servicePackage.billingCycle,
                        )}
                    </p>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                    {servicePackage.shortDescription}
                  </p>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-slate-100 py-4">
                    <div>
                      <dt className={labelClassName}>Features</dt>

                      <dd className="mt-1 text-sm font-bold text-slate-700">
                        {featureCount}
                      </dd>
                    </div>

                    <div>
                      <dt className={labelClassName}>Display order</dt>

                      <dd className="mt-1 text-sm font-bold text-slate-700">
                        {servicePackage.order ?? 0}
                      </dd>
                    </div>
                  </dl>

                  {servicePackage.badge ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={labelClassName}>Badge</span>

                      <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                        {servicePackage.badge}
                      </span>
                    </div>
                  ) : null}

                  <div className="mt-auto pt-5">
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                      <Link
                        to={`/admin/service-packages/${servicePackage._id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                      >
                        Edit
                      </Link>

                      <Link
                        to={`/admin/package-designs?servicePackage=${servicePackage._id}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-3 text-center text-sm font-bold text-brand-700 transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                      >
                        Manage Designs
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleVisibility(servicePackage)
                        }
                        disabled={actionPackageId !== ""}
                        className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${
                          servicePackage.isVisible
                            ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                            : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {isActionPending
                          ? "Updating..."
                          : servicePackage.isVisible
                            ? "Hide"
                            : "Show"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleFeatured(servicePackage)
                        }
                        disabled={actionPackageId !== ""}
                        className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${
                          servicePackage.isFeatured
                            ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                        }`}
                      >
                        {isActionPending
                          ? "Updating..."
                          : servicePackage.isFeatured
                            ? "Make Standard"
                            : "Make Featured"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(servicePackage)}
                        disabled={
                          actionPackageId !== "" || !canDeletePackages
                        }
                        title={
                          canDeletePackages
                            ? "Permanently delete package"
                            : "Your role cannot permanently delete packages"
                        }
                        className="col-span-2 inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-sm font-bold text-red-700 transition-colors duration-150 motion-reduce:transition-none hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActionPending ? "Deleting..." : "Delete"}
                      </button>
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