import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import { fetchAdminServices } from "../../services/adminServicesApi";
import { fetchAdminServicePackages } from "../../services/adminServicePackagesApi";
import {
  deleteAdminPackageDesign,
  fetchAdminPackageDesigns,
  updateAdminPackageDesign,
} from "../../services/adminPackageDesignsApi";
import { getPackageDesignPackageLabel } from "../../utils/packageDesignForm";

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition-colors duration-150 motion-reduce:transition-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.08em] text-slate-500";

function createInitialFilters(search = "") {
  const query = new URLSearchParams(search);

  return {
    search: "",
    service: "",
    servicePackage: query.get("servicePackage") || "",
    group: "",
    visibility: "all",
    defaultState: "all",
    featured: "all",
  };
}

function createApiFilters(filters) {
  const apiFilters = {
    search: filters.search.trim(),
    service: filters.service,
    servicePackage: filters.servicePackage,
    group: filters.group,
  };

  if (filters.visibility === "visible") {
    apiFilters.isVisible = true;
  }

  if (filters.visibility === "hidden") {
    apiFilters.isVisible = false;
  }

  if (filters.defaultState === "default") {
    apiFilters.isDefault = true;
  }

  if (filters.defaultState === "standard") {
    apiFilters.isDefault = false;
  }

  if (filters.featured === "featured") {
    apiFilters.isFeatured = true;
  }

  if (filters.featured === "standard") {
    apiFilters.isFeatured = false;
  }

  return apiFilters;
}

function AdminPackageDesignsWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();

  const { accessToken, logout, admin } = useAdminAuth();

  const [formFilters, setFormFilters] = useState(() =>
    createInitialFilters(location.search),
  );

  const [appliedFilters, setAppliedFilters] = useState(() =>
    createInitialFilters(location.search),
  );
  const [packageDesigns, setPackageDesigns] = useState([]);
  const [services, setServices] = useState([]);
  const [servicePackages, setServicePackages] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionDesignId, setActionDesignId] = useState("");

  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || "",
  );

  useEffect(() => {
    if (!location.state?.successMessage) {
      return;
    }

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadFilterOptions() {
      try {
        setFiltersLoading(true);

        const [servicesResponse, packagesResponse] = await Promise.all([
          fetchAdminServices(
            accessToken,
            {},
            {
              signal: controller.signal,
            },
          ),
          fetchAdminServicePackages(
            accessToken,
            {},
            {
              signal: controller.signal,
            },
          ),
        ]);

        setServices(servicesResponse.services);
        setServicePackages(packagesResponse.servicePackages);
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
                pathname: "/admin/package-designs",
                search: location.search,
              },
            },
          });

          return;
        }

        console.error("Package Design filter options failed:", requestError);

        setServices([]);
        setServicePackages([]);
      } finally {
        if (!controller.signal.aborted) {
          setFiltersLoading(false);
        }
      }
    }

    loadFilterOptions();

    return () => {
      controller.abort();
    };
  }, [accessToken, location.search, logout, navigate]);

  const apiFilters = useMemo(
    () => createApiFilters(appliedFilters),
    [appliedFilters],
  );

  const filteredPackageOptions = useMemo(
    () =>
      servicePackages.filter((servicePackage) => {
        const serviceId = String(
          servicePackage?.service?._id || servicePackage?.service || "",
        );

        if (formFilters.service && serviceId !== formFilters.service) {
          return false;
        }

        if (formFilters.group && servicePackage.group !== formFilters.group) {
          return false;
        }

        return true;
      }),
    [formFilters.group, formFilters.service, servicePackages],
  );

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadPackageDesigns() {
      try {
        const response = await fetchAdminPackageDesigns(
          accessToken,
          apiFilters,
          {
            signal: controller.signal,
          },
        );

        setPackageDesigns(response.packageDesigns);
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
                pathname: "/admin/package-designs",
                search: location.search,
              },
            },
          });

          return;
        }

        console.error("Admin Package Designs loading failed:", requestError);

        setPackageDesigns([]);
        setResultCount(0);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Package Designs could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadPackageDesigns();

    return () => {
      controller.abort();
    };
  }, [accessToken, apiFilters, location.search, logout, navigate, refreshKey]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFormFilters((currentFilters) => {
      const nextFilters = {
        ...currentFilters,
        [name]: value,
      };

      if (name === "service" || name === "group") {
        nextFilters.servicePackage = "";
      }

      return nextFilters;
    });
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
    const cleared = createInitialFilters("");

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    setFormFilters(cleared);
    setAppliedFilters(cleared);

    navigate("/admin/package-designs", {
      replace: true,
      state: null,
    });
  }

  function handleRefresh() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    setRefreshKey((currentKey) => currentKey + 1);
  }

  function handleActionError(requestError) {
    if (requestError?.status === 401) {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: {
            pathname: "/admin/package-designs",
            search: location.search,
          },
        },
      });

      return;
    }

    console.error("Admin Package Design action failed:", requestError);

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Package Design action could not be completed.",
    );
  }

  async function updateQuickState(packageDesign, payload, successText) {
    if (!packageDesign?._id || actionDesignId) {
      return;
    }

    try {
      setActionDesignId(packageDesign._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminPackageDesign(
        accessToken,
        packageDesign._id,
        payload,
      );

      setSuccessMessage(
        typeof successText === "function"
          ? successText(response.packageDesign)
          : successText,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionDesignId("");
    }
  }

  function handleToggleVisibility(packageDesign) {
    return updateQuickState(
      packageDesign,
      {
        isVisible: !packageDesign.isVisible,
      },
      (updatedDesign) =>
        updatedDesign.isVisible
          ? `"${updatedDesign.name}" is now visible.`
          : `"${updatedDesign.name}" is now hidden.`,
    );
  }

  function handleToggleFeatured(packageDesign) {
    return updateQuickState(
      packageDesign,
      {
        isFeatured: !packageDesign.isFeatured,
      },
      (updatedDesign) =>
        updatedDesign.isFeatured
          ? `"${updatedDesign.name}" is now featured.`
          : `"${updatedDesign.name}" is now standard.`,
    );
  }

  function handleMakeDefault(packageDesign) {
    if (packageDesign.isDefault) {
      return;
    }

    return updateQuickState(
      packageDesign,
      {
        isDefault: true,
      },
      (updatedDesign) =>
        `"${updatedDesign.name}" is now the default design for its package.`,
    );
  }

  async function handleDelete(packageDesign) {
    if (!packageDesign?._id || actionDesignId) {
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete "${packageDesign.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionDesignId(packageDesign._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminPackageDesign(
        accessToken,
        packageDesign._id,
      );

      setSuccessMessage(
        response.message || `"${packageDesign.name}" was permanently deleted.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionDesignId("");
    }
  }

  const canDeleteDesigns = ["super-admin", "admin"].includes(admin?.role);

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

              <span className="text-slate-500">Design management</span>
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Package Designs
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage selectable website designs, thumbnails, device screenshots,
              live demos, default selection, featured state and public
              visibility.
            </p>
          </div>

          <Link
            to="/admin/package-designs/new"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Add Design
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div>
            <h2 className="text-base font-black text-slate-950">Filters</h2>

            <p className="mt-1 text-sm text-slate-500">
              Narrow designs by Service, Package, group and publishing state.
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2">
              <label htmlFor="package-design-search" className={labelClassName}>
                Search
              </label>

              <input
                id="package-design-search"
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
                htmlFor="package-design-service-filter"
                className={labelClassName}
              >
                Service
              </label>

              <select
                id="package-design-service-filter"
                name="service"
                value={formFilters.service}
                onChange={handleFilterChange}
                disabled={filtersLoading}
                className={inputClassName}
              >
                <option value="">
                  {filtersLoading ? "Loading Services..." : "All Services"}
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
                htmlFor="package-design-package-filter"
                className={labelClassName}
              >
                Package
              </label>

              <select
                id="package-design-package-filter"
                name="servicePackage"
                value={formFilters.servicePackage}
                onChange={handleFilterChange}
                disabled={filtersLoading}
                className={inputClassName}
              >
                <option value="">
                  {filtersLoading ? "Loading Packages..." : "All Packages"}
                </option>

                {filteredPackageOptions.map((servicePackage) => (
                  <option key={servicePackage._id} value={servicePackage._id}>
                    {getPackageDesignPackageLabel(servicePackage)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="package-design-group-filter"
                className={labelClassName}
              >
                Group
              </label>

              <select
                id="package-design-group-filter"
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
                htmlFor="package-design-visibility-filter"
                className={labelClassName}
              >
                Visibility
              </label>

              <select
                id="package-design-visibility-filter"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All designs</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="package-design-default-filter"
                className={labelClassName}
              >
                Default
              </label>

              <select
                id="package-design-default-filter"
                name="defaultState"
                value={formFilters.defaultState}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All states</option>
                <option value="default">Default</option>
                <option value="standard">Non-default</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="package-design-featured-filter"
                className={labelClassName}
              >
                Featured
              </label>

              <select
                id="package-design-featured-filter"
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
                ? "Loading Package Designs..."
                : `${resultCount} design${resultCount === 1 ? "" : "s"}`}
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
                className="h-[31rem] animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && packageDesigns.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-base font-black text-slate-950">
              No Package Designs found
            </p>

            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Change the filters or create a new design.
            </p>
          </div>
        ) : null}

        {!isLoading && packageDesigns.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {packageDesigns.map((packageDesign) => {
              const servicePackage = packageDesign.servicePackage;

              const serviceTitle = servicePackage?.service?.title || "Service";

              const packageName = servicePackage?.name || "Service Package";

              const screenshotCount = Array.isArray(packageDesign.screenshots)
                ? packageDesign.screenshots.length
                : 0;

              const isActionPending = actionDesignId === packageDesign._id;

              return (
                <article
                  key={packageDesign._id}
                  className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                    {packageDesign.thumbnailUrl ? (
                      <img
                        src={packageDesign.thumbnailUrl}
                        alt={
                          packageDesign.thumbnailAlt ||
                          `${packageDesign.name} preview`
                        }
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="grid size-full place-items-center p-6 text-center text-sm font-semibold text-slate-400">
                        No thumbnail
                      </div>
                    )}

                    <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {packageDesign.isDefault ? (
                          <span className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                            Default
                          </span>
                        ) : null}

                        {packageDesign.isFeatured ? (
                          <span className="rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-bold text-slate-950 shadow-sm">
                            Featured
                          </span>
                        ) : null}
                      </div>

                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold shadow-sm ${
                          packageDesign.isVisible
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-700 text-white"
                        }`}
                      >
                        {packageDesign.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                          {serviceTitle}
                        </p>

                        <p className="mt-1 break-words text-sm font-bold text-brand-700">
                          {packageName}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        Order {packageDesign.order ?? 0}
                      </span>
                    </div>

                    <h2 className="mt-4 break-words text-lg font-black tracking-tight text-slate-950">
                      {packageDesign.name}
                    </h2>

                    <p className="mt-1 break-all text-xs font-semibold text-slate-400">
                      {packageDesign.slug}
                    </p>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {packageDesign.shortDescription}
                    </p>

                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-slate-100 py-4">
                      <div>
                        <dt className={labelClassName}>Screenshots</dt>

                        <dd className="mt-1 text-sm font-bold text-slate-700">
                          {screenshotCount}
                        </dd>
                      </div>

                      <div>
                        <dt className={labelClassName}>Group</dt>

                        <dd className="mt-1 text-sm font-bold capitalize text-slate-700">
                          {servicePackage?.group || "—"}
                        </dd>
                      </div>
                    </dl>

                    {packageDesign.liveDemoUrl ? (
                      <a
                        href={packageDesign.liveDemoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex min-h-9 self-start items-center text-sm font-bold text-brand-700 transition-colors duration-150 motion-reduce:transition-none hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                      >
                        {packageDesign.liveDemoLabel || "Live Demo"} ↗
                      </a>
                    ) : null}

                    <div className="mt-auto pt-5">
                      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                        <Link
                          to={`/admin/package-designs/${packageDesign._id}/edit`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(packageDesign)}
                          disabled={actionDesignId !== ""}
                          className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${
                            packageDesign.isVisible
                              ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                              : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {isActionPending
                            ? "Updating..."
                            : packageDesign.isVisible
                              ? "Hide"
                              : "Show"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(packageDesign)}
                          disabled={actionDesignId !== ""}
                          className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${
                            packageDesign.isFeatured
                              ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                              : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          }`}
                        >
                          {isActionPending
                            ? "Updating..."
                            : packageDesign.isFeatured
                              ? "Make Standard"
                              : "Make Featured"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMakeDefault(packageDesign)}
                          disabled={
                            actionDesignId !== "" || packageDesign.isDefault
                          }
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-3 text-sm font-bold text-brand-700 transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {packageDesign.isDefault
                            ? "Default Design"
                            : isActionPending
                              ? "Updating..."
                              : "Make Default"}
                        </button>

                        <Link
                          to="/admin/service-packages"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-center text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                        >
                          Packages
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(packageDesign)}
                          disabled={actionDesignId !== "" || !canDeleteDesigns}
                          title={
                            canDeleteDesigns
                              ? "Permanently delete design"
                              : "Your role cannot permanently delete designs"
                          }
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-sm font-bold text-red-700 transition-colors duration-150 motion-reduce:transition-none hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isActionPending ? "Deleting..." : "Delete"}
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

function AdminPackageDesignsPage() {
  const location = useLocation();

  return <AdminPackageDesignsWorkspace key={location.search} />;
}

export default AdminPackageDesignsPage;
