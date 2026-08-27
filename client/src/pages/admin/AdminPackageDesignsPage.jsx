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
    <main className="admin-catalog-page min-h-screen">
      <section className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="admin-catalog-eyebrow text-[10px] font-bold uppercase tracking-[0.16em]">
              Services & Sales
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Package Designs
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-5">
              Manage selectable designs, previews, defaults and public state.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="admin-catalog-count-pill rounded-lg px-3 py-2 text-[11px] font-semibold">
              {isLoading
                ? "Loading..."
                : `${resultCount} Design${resultCount === 1 ? "" : "s"}`}
            </span>

            <Link
              className="admin-catalog-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
              to="/admin/package-designs/new"
            >
              Add Design
            </Link>
          </div>
        </header>

        <form
          className="admin-catalog-toolbar mt-4 rounded-xl p-3"
          onSubmit={handleFilterSubmit}
        >
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.3fr)_180px_190px_150px_auto]">
            <div>
              <label
                className={`${labelClassName} sr-only`}
                htmlFor="package-design-search"
              >
                Search
              </label>

              <input
                className={`${inputClassName} admin-catalog-input !mt-0 !min-h-10 !rounded-lg`}
                id="package-design-search"
                name="search"
                onChange={handleFilterChange}
                placeholder="Search design..."
                type="search"
                value={formFilters.search}
              />
            </div>

            <div>
              <label
                className={`${labelClassName} sr-only`}
                htmlFor="package-design-service-filter"
              >
                Service
              </label>

              <select
                className={`${inputClassName} admin-catalog-input !mt-0 !min-h-10 !rounded-lg`}
                disabled={filtersLoading}
                id="package-design-service-filter"
                name="service"
                onChange={handleFilterChange}
                value={formFilters.service}
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
                className={`${labelClassName} sr-only`}
                htmlFor="package-design-package-filter"
              >
                Package
              </label>

              <select
                className={`${inputClassName} admin-catalog-input !mt-0 !min-h-10 !rounded-lg`}
                disabled={filtersLoading}
                id="package-design-package-filter"
                name="servicePackage"
                onChange={handleFilterChange}
                value={formFilters.servicePackage}
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
                className={`${labelClassName} sr-only`}
                htmlFor="package-design-visibility-filter"
              >
                Visibility
              </label>

              <select
                className={`${inputClassName} admin-catalog-input !mt-0 !min-h-10 !rounded-lg`}
                id="package-design-visibility-filter"
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
                disabled={isLoading || Boolean(actionDesignId)}
                type="submit"
              >
                Apply
              </button>

              <button
                className="admin-catalog-secondary-button inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold"
                disabled={isLoading || Boolean(actionDesignId)}
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

            <div className="grid gap-3 border-t px-3 py-3 md:grid-cols-3">
              <div>
                <label
                  className={`${labelClassName} !text-[10px]`}
                  htmlFor="package-design-group-filter"
                >
                  Group
                </label>

                <select
                  className={`${inputClassName} admin-catalog-input !mt-1.5 !min-h-10 !rounded-lg`}
                  id="package-design-group-filter"
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
                  className={`${labelClassName} !text-[10px]`}
                  htmlFor="package-design-default-filter"
                >
                  Default
                </label>

                <select
                  className={`${inputClassName} admin-catalog-input !mt-1.5 !min-h-10 !rounded-lg`}
                  id="package-design-default-filter"
                  name="defaultState"
                  onChange={handleFilterChange}
                  value={formFilters.defaultState}
                >
                  <option value="all">All states</option>
                  <option value="default">Default</option>
                  <option value="standard">Non-default</option>
                </select>
              </div>

              <div>
                <label
                  className={`${labelClassName} !text-[10px]`}
                  htmlFor="package-design-featured-filter"
                >
                  Featured
                </label>

                <select
                  className={`${inputClassName} admin-catalog-input !mt-1.5 !min-h-10 !rounded-lg`}
                  id="package-design-featured-filter"
                  name="featured"
                  onChange={handleFilterChange}
                  value={formFilters.featured}
                >
                  <option value="all">All states</option>
                  <option value="featured">Featured</option>
                  <option value="standard">Standard</option>
                </select>
              </div>
            </div>
          </details>
        </form>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold">
            {isLoading
              ? "Loading Package Designs..."
              : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
          </p>

          <button
            className="admin-catalog-secondary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[11px] font-semibold"
            disabled={isLoading || Boolean(actionDesignId)}
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
            <span className="sr-only">Loading Package Designs...</span>

            {[1, 2, 3, 4, 5].map((placeholder) => (
              <div
                className="admin-catalog-skeleton h-[96px] rounded-xl"
                key={placeholder}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && packageDesigns.length === 0 ? (
          <div className="admin-catalog-empty mt-3 rounded-xl px-5 py-9 text-center">
            <h2 className="text-base font-bold">No Package Designs found</h2>

            <p className="mt-1 text-xs">
              Change the filters or create a new design.
            </p>
          </div>
        ) : null}

        {!isLoading && packageDesigns.length > 0 ? (
          <div className="mt-3 space-y-2">
            {packageDesigns.map((packageDesign) => {
              const servicePackage = packageDesign.servicePackage;
              const serviceTitle = servicePackage?.service?.title || "Service";
              const packageName = servicePackage?.name || "Service Package";
              const screenshotCount = Array.isArray(packageDesign.screenshots)
                ? packageDesign.screenshots.length
                : 0;

              const isActionPending =
                actionDesignId === packageDesign._id;

              return (
                <article
                  className="admin-catalog-row min-w-0 rounded-xl"
                  key={packageDesign._id}
                >
                  <div className="grid min-w-0 grid-cols-[82px_minmax(0,1fr)] gap-3 p-3 md:grid-cols-[86px_minmax(0,1fr)_auto] md:items-center">
                    <div className="admin-catalog-thumb relative h-[62px] overflow-hidden rounded-lg">
                      {packageDesign.thumbnailUrl ? (
                        <img
                          alt={
                            packageDesign.thumbnailAlt ||
                            `${packageDesign.name} preview`
                          }
                          className="size-full object-cover"
                          loading="lazy"
                          src={packageDesign.thumbnailUrl}
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-[9px] font-semibold">
                          No preview
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span
                          className={`admin-catalog-badge rounded-md px-2 py-1 text-[9px] font-bold ${
                            packageDesign.isVisible ? "is-visible" : "is-hidden"
                          }`}
                        >
                          {packageDesign.isVisible ? "Visible" : "Hidden"}
                        </span>

                        {packageDesign.isDefault ? (
                          <span className="admin-catalog-badge is-default rounded-md px-2 py-1 text-[9px] font-bold">
                            Default
                          </span>
                        ) : null}

                        {packageDesign.isFeatured ? (
                          <span className="admin-catalog-badge is-featured rounded-md px-2 py-1 text-[9px] font-bold">
                            Featured
                          </span>
                        ) : null}

                        <span className="admin-catalog-meta max-w-64 truncate text-[9px]">
                          {serviceTitle} · {packageName}
                        </span>
                      </div>

                      <div className="mt-1.5 flex min-w-0 flex-wrap items-baseline gap-x-2">
                        <h2 className="truncate text-sm font-bold">
                          {packageDesign.name}
                        </h2>

                        <span className="admin-catalog-slug max-w-48 truncate text-[10px]">
                          {packageDesign.slug}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                        <span>{screenshotCount} screenshots</span>
                        <span className="capitalize">
                          {servicePackage?.group || "No group"}
                        </span>
                        <span>Order {packageDesign.order ?? 0}</span>

                        {packageDesign.liveDemoUrl ? (
                          <a
                            className="admin-catalog-live-link font-semibold"
                            href={packageDesign.liveDemoUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {packageDesign.liveDemoLabel || "Live Demo"} ↗
                          </a>
                        ) : null}
                      </div>

                      <p className="mt-1 line-clamp-1 text-[10px] leading-4">
                        {packageDesign.shortDescription}
                      </p>
                    </div>

                    <div className="col-span-2 flex shrink-0 items-center justify-end gap-2 md:col-span-1">
                      <Link
                        className="admin-catalog-primary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[10px] font-bold"
                        to={`/admin/package-designs/${packageDesign._id}/edit`}
                      >
                        Edit
                      </Link>

                      <details className="admin-catalog-actions relative">
                        <summary
                          aria-label={`More actions for ${packageDesign.name}`}
                          className="admin-catalog-secondary-button inline-flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-base font-bold"
                          title="More actions"
                        >
                          …
                        </summary>

                        <div className="admin-catalog-action-menu absolute right-0 top-[calc(100%+0.4rem)] z-30 w-48 rounded-xl p-1.5">
                          <button
                            className="admin-catalog-menu-action"
                            disabled={actionDesignId !== ""}
                            onClick={() =>
                              handleToggleVisibility(packageDesign)
                            }
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : packageDesign.isVisible
                                ? "Hide from public"
                                : "Show on public"}
                          </button>

                          <button
                            className="admin-catalog-menu-action"
                            disabled={actionDesignId !== ""}
                            onClick={() =>
                              handleToggleFeatured(packageDesign)
                            }
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : packageDesign.isFeatured
                                ? "Make standard"
                                : "Make featured"}
                          </button>

                          <button
                            className="admin-catalog-menu-action"
                            disabled={
                              actionDesignId !== "" ||
                              packageDesign.isDefault
                            }
                            onClick={() =>
                              handleMakeDefault(packageDesign)
                            }
                            type="button"
                          >
                            {packageDesign.isDefault
                              ? "Default design"
                              : isActionPending
                                ? "Working..."
                                : "Make default"}
                          </button>

                          <Link
                            className="admin-catalog-menu-action"
                            to="/admin/service-packages"
                          >
                            Service Packages
                          </Link>

                          <div className="admin-catalog-menu-divider my-1" />

                          <button
                            className="admin-catalog-menu-action is-danger"
                            disabled={
                              actionDesignId !== "" || !canDeleteDesigns
                            }
                            onClick={() => handleDelete(packageDesign)}
                            title={
                              canDeleteDesigns
                                ? "Permanently delete design"
                                : "Your role cannot permanently delete designs"
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

function AdminPackageDesignsPage() {
  const location = useLocation();

  return <AdminPackageDesignsWorkspace key={location.search} />;
}

export default AdminPackageDesignsPage;