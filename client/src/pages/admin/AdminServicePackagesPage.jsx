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

  const [formFilters, setFormFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
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

        console.error("Admin Service Packages loading failed:", requestError);

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
            pathname: "/admin/service-packages",
          },
        },
      });

      return;
    }

    console.error("Admin Service Package action failed:", requestError);

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

    const service = servicesById.get(getRelationId(servicePackage?.service));

    return service?.title || "Service";
  }

  function handleLogout() {
    logout();

    navigate("/admin/login", {
      replace: true,
    });
  }

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
                Service Packages Management
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
              Pricing Management
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Service Packages
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              Manage Development and Management packages, pricing, billing,
              comparison features, badges and public visibility for every
              Service.
            </p>
          </div>

          <Link
            to="/admin/service-packages/new"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Add New Package
          </Link>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:grid-cols-[1fr_0.75fr_0.55fr_0.55fr_0.55fr_auto]"
        >
          <div>
            <label
              htmlFor="service-package-search"
              className="text-sm font-semibold text-slate-700"
            >
              Search packages
            </label>

            <input
              id="service-package-search"
              name="search"
              type="search"
              value={formFilters.search}
              onChange={handleFilterChange}
              placeholder="Name, slug or description"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <div>
            <label
              htmlFor="service-package-service-filter"
              className="text-sm font-semibold text-slate-700"
            >
              Service
            </label>

            <select
              id="service-package-service-filter"
              name="service"
              value={formFilters.service}
              onChange={handleFilterChange}
              disabled={servicesLoading}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            >
              <option value="">All Services</option>

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
              className="text-sm font-semibold text-slate-700"
            >
              Group
            </label>

            <select
              id="service-package-group-filter"
              name="group"
              value={formFilters.group}
              onChange={handleFilterChange}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            >
              <option value="">All groups</option>
              <option value="development">Development</option>
              <option value="management">Management</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="service-package-visibility-filter"
              className="text-sm font-semibold text-slate-700"
            >
              Visibility
            </label>

            <select
              id="service-package-visibility-filter"
              name="visibility"
              value={formFilters.visibility}
              onChange={handleFilterChange}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            >
              <option value="all">All</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="service-package-featured-filter"
              className="text-sm font-semibold text-slate-700"
            >
              Type
            </label>

            <select
              id="service-package-featured-filter"
              name="featured"
              value={formFilters.featured}
              onChange={handleFilterChange}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            >
              <option value="all">All</option>
              <option value="featured">Featured</option>
              <option value="standard">Standard</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
            >
              Clear
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-600">
            {isLoading
              ? "Loading Service Packages..."
              : `${resultCount} package(s) found`}
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
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && servicePackages.length === 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-950">
              No Service Packages found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Create a package or change the current filters.
            </p>
          </div>
        )}

        {!isLoading && servicePackages.length > 0 && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {servicePackages.map((servicePackage) => (
              <article
                key={servicePackage._id}
                className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                      servicePackage.group === "management"
                        ? "bg-violet-100 text-violet-700"
                        : "bg-sky-100 text-sky-700"
                    }`}
                  >
                    {servicePackage.group === "management"
                      ? "Management"
                      : "Development"}
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {servicePackage.isFeatured && (
                      <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                        Featured
                      </span>
                    )}

                    <span
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                        servicePackage.isVisible
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {servicePackage.isVisible ? "Visible" : "Hidden"}
                    </span>
                  </div>
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  {getServiceLabel(servicePackage)}
                </p>

                <h2 className="mt-2 break-words text-xl font-bold text-slate-950">
                  {servicePackage.name}
                </h2>

                <p className="mt-1 break-all text-xs font-semibold text-brand-600">
                  {servicePackage.slug}
                </p>

                <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
                  <p className="text-2xl font-extrabold">
                    {formatPrice(servicePackage)}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {servicePackage.billingLabel ||
                      formatBillingCycle(servicePackage.billingCycle)}
                  </p>
                </div>

                <p className="mt-4 line-clamp-3 leading-7 text-slate-600">
                  {servicePackage.shortDescription}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-400">
                      Features
                    </p>
                    <p className="mt-1 font-bold text-slate-700">
                      {Array.isArray(servicePackage.features)
                        ? servicePackage.features.length
                        : 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-400">
                      Display order
                    </p>
                    <p className="mt-1 font-bold text-slate-700">
                      {servicePackage.order}
                    </p>
                  </div>
                </div>

                {servicePackage.badge && (
                  <p className="mt-4 text-sm font-semibold text-amber-700">
                    Badge: {servicePackage.badge}
                  </p>
                )}

                <div className="mt-auto border-t border-slate-100 pt-5">
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to={`/admin/service-packages/${servicePackage._id}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                    >
                      Edit
                    </Link>

                    <Link
                      to={`/admin/package-designs?servicePackage=${servicePackage._id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-center text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
                    >
                      Manage Designs
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(servicePackage)}
                      disabled={Boolean(actionPackageId)}
                      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        servicePackage.isVisible
                          ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {actionPackageId === servicePackage._id
                        ? "Updating..."
                        : servicePackage.isVisible
                          ? "Hide"
                          : "Show"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(servicePackage)}
                      disabled={Boolean(actionPackageId)}
                      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        servicePackage.isFeatured
                          ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                    >
                      {actionPackageId === servicePackage._id
                        ? "Updating..."
                        : servicePackage.isFeatured
                          ? "Make Standard"
                          : "Make Featured"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(servicePackage)}
                      disabled={
                        Boolean(actionPackageId) ||
                        !["super-admin", "admin"].includes(admin?.role)
                      }
                      title={
                        ["super-admin", "admin"].includes(admin?.role)
                          ? "Permanently delete package"
                          : "Your role cannot permanently delete packages"
                      }
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionPackageId === servicePackage._id
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

export default AdminServicePackagesPage;
