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

  if (filters.visibility === "visible") apiFilters.isVisible = true;
  if (filters.visibility === "hidden") apiFilters.isVisible = false;
  if (filters.defaultState === "default") apiFilters.isDefault = true;
  if (filters.defaultState === "standard") apiFilters.isDefault = false;
  if (filters.featured === "featured") apiFilters.isFeatured = true;
  if (filters.featured === "standard") apiFilters.isFeatured = false;

  return apiFilters;
}

function AdminPackageDesignsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, logout, admin } = useAdminAuth();

  const initialFilters = useMemo(
    () => createInitialFilters(location.search),
    [location.search],
  );

  const [formFilters, setFormFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
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
    setFormFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    if (!location.state?.successMessage) return;

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    if (!accessToken) return undefined;

    const controller = new AbortController();

    async function loadFilterOptions() {
      try {
        setFiltersLoading(true);

        const [servicesResponse, packagesResponse] = await Promise.all([
          fetchAdminServices(accessToken, {}, { signal: controller.signal }),
          fetchAdminServicePackages(accessToken, {}, { signal: controller.signal }),
        ]);

        setServices(servicesResponse.services);
        setServicePackages(packagesResponse.servicePackages);
      } catch (requestError) {
        if (requestError?.name === "AbortError") return;

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
        if (!controller.signal.aborted) setFiltersLoading(false);
      }
    }

    loadFilterOptions();

    return () => controller.abort();
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
    if (!accessToken) return undefined;

    const controller = new AbortController();

    async function loadPackageDesigns() {
      try {
        const response = await fetchAdminPackageDesigns(
          accessToken,
          apiFilters,
          { signal: controller.signal },
        );

        setPackageDesigns(response.packageDesigns);
        setResultCount(response.count);
        setError("");
      } catch (requestError) {
        if (requestError?.name === "AbortError") return;

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
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadPackageDesigns();

    return () => controller.abort();
  }, [accessToken, apiFilters, location.search, logout, navigate, refreshKey]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFormFilters((currentFilters) => {
      const nextFilters = { ...currentFilters, [name]: value };

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
    setAppliedFilters(formFilters);
  }

  function handleClearFilters() {
    const cleared = createInitialFilters("");

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setFormFilters(cleared);
    setAppliedFilters(cleared);
    navigate("/admin/package-designs", { replace: true, state: null });
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
    if (!packageDesign?._id || actionDesignId) return;

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
      { isVisible: !packageDesign.isVisible },
      (updatedDesign) =>
        updatedDesign.isVisible
          ? `"${updatedDesign.name}" is now visible.`
          : `"${updatedDesign.name}" is now hidden.`,
    );
  }

  function handleToggleFeatured(packageDesign) {
    return updateQuickState(
      packageDesign,
      { isFeatured: !packageDesign.isFeatured },
      (updatedDesign) =>
        updatedDesign.isFeatured
          ? `"${updatedDesign.name}" is now featured.`
          : `"${updatedDesign.name}" is now standard.`,
    );
  }

  function handleMakeDefault(packageDesign) {
    if (packageDesign.isDefault) return;

    return updateQuickState(
      packageDesign,
      { isDefault: true },
      (updatedDesign) =>
        `"${updatedDesign.name}" is now the default design for its package.`,
    );
  }

  async function handleDelete(packageDesign) {
    if (!packageDesign?._id || actionDesignId) return;

    const confirmed = window.confirm(
      `Permanently delete "${packageDesign.name}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

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

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
              Design Management
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Package Designs
            </h1>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              Manage selectable website designs, thumbnails, device screenshots,
              live demos, default choice, featured state and public visibility.
            </p>
          </div>

          <Link
            to="/admin/package-designs/new"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Add New Design
          </Link>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:grid-cols-[1fr_0.75fr_0.9fr_0.55fr_0.55fr_0.55fr_0.55fr_auto]"
        >
          <div>
            <label htmlFor="package-design-search" className="text-sm font-semibold text-slate-700">
              Search
            </label>
            <input
              id="package-design-search"
              name="search"
              type="search"
              value={formFilters.search}
              onChange={handleFilterChange}
              placeholder="Name, slug or description"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <div>
            <label htmlFor="package-design-service-filter" className="text-sm font-semibold text-slate-700">
              Service
            </label>
            <select
              id="package-design-service-filter"
              name="service"
              value={formFilters.service}
              onChange={handleFilterChange}
              disabled={filtersLoading}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            >
              <option value="">All Services</option>
              {services.map((service) => (
                <option key={service._id} value={service._id}>{service.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="package-design-package-filter" className="text-sm font-semibold text-slate-700">
              Package
            </label>
            <select
              id="package-design-package-filter"
              name="servicePackage"
              value={formFilters.servicePackage}
              onChange={handleFilterChange}
              disabled={filtersLoading}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            >
              <option value="">All Packages</option>
              {filteredPackageOptions.map((servicePackage) => (
                <option key={servicePackage._id} value={servicePackage._id}>
                  {getPackageDesignPackageLabel(servicePackage)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="package-design-group-filter" className="text-sm font-semibold text-slate-700">
              Group
            </label>
            <select
              id="package-design-group-filter"
              name="group"
              value={formFilters.group}
              onChange={handleFilterChange}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            >
              <option value="">All</option>
              <option value="development">Development</option>
              <option value="management">Management</option>
            </select>
          </div>

          <div>
            <label htmlFor="package-design-visibility-filter" className="text-sm font-semibold text-slate-700">
              Visibility
            </label>
            <select
              id="package-design-visibility-filter"
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
            <label htmlFor="package-design-default-filter" className="text-sm font-semibold text-slate-700">
              Default
            </label>
            <select
              id="package-design-default-filter"
              name="defaultState"
              value={formFilters.defaultState}
              onChange={handleFilterChange}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            >
              <option value="all">All</option>
              <option value="default">Default</option>
              <option value="standard">Non-default</option>
            </select>
          </div>

          <div>
            <label htmlFor="package-design-featured-filter" className="text-sm font-semibold text-slate-700">
              Type
            </label>
            <select
              id="package-design-featured-filter"
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
            <button type="submit" className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700">
              Apply
            </button>
            <button type="button" onClick={handleClearFilters} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600">
              Clear
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-600">
            {isLoading ? "Loading Package Designs..." : `${resultCount} design(s) found`}
          </p>
          <button type="button" onClick={handleRefresh} disabled={isLoading} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60">
            Refresh
          </button>
        </div>

        {successMessage && (
          <div role="status" className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-medium leading-6 text-emerald-700">
            {successMessage}
          </div>
        )}

        {error && (
          <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div key={placeholder} className="h-[34rem] animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        )}

        {!isLoading && !error && packageDesigns.length === 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-950">No Package Designs found</p>
            <p className="mt-2 text-sm text-slate-500">Create a design or change the current filters.</p>
          </div>
        )}

        {!isLoading && packageDesigns.length > 0 && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {packageDesigns.map((packageDesign) => {
              const servicePackage = packageDesign.servicePackage;
              const serviceTitle = servicePackage?.service?.title || "Service";
              const packageName = servicePackage?.name || "Service Package";

              return (
                <article key={packageDesign._id} className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="relative aspect-[16/9] bg-slate-100">
                    {packageDesign.thumbnailUrl ? (
                      <img
                        src={packageDesign.thumbnailUrl}
                        alt={packageDesign.thumbnailAlt || `${packageDesign.name} preview`}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="grid size-full place-items-center p-6 text-center text-sm font-semibold text-slate-400">
                        No thumbnail
                      </div>
                    )}

                    <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                      {packageDesign.isDefault && (
                        <span className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-bold text-white shadow">Default</span>
                      )}
                      {packageDesign.isFeatured && (
                        <span className="rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-bold text-slate-950 shadow">Featured</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className={`rounded-lg px-3 py-1.5 text-xs font-bold ${packageDesign.isVisible ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {packageDesign.isVisible ? "Visible" : "Hidden"}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">Order {packageDesign.order}</span>
                    </div>

                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{serviceTitle}</p>
                    <p className="mt-1 text-sm font-semibold text-brand-600">{packageName}</p>
                    <h2 className="mt-3 break-words text-xl font-bold text-slate-950">{packageDesign.name}</h2>
                    <p className="mt-1 break-all text-xs font-semibold text-slate-400">{packageDesign.slug}</p>
                    <p className="mt-4 line-clamp-3 leading-7 text-slate-600">{packageDesign.shortDescription}</p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-400">Screenshots</p>
                        <p className="mt-1 font-bold text-slate-700">{Array.isArray(packageDesign.screenshots) ? packageDesign.screenshots.length : 0}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-400">Group</p>
                        <p className="mt-1 font-bold capitalize text-slate-700">{servicePackage?.group || "—"}</p>
                      </div>
                    </div>

                    {packageDesign.liveDemoUrl && (
                      <a href={packageDesign.liveDemoUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex self-start text-sm font-semibold text-brand-600 transition hover:text-brand-700">
                        {packageDesign.liveDemoLabel || "Live Demo"} ↗
                      </a>
                    )}

                    <div className="mt-auto border-t border-slate-100 pt-5">
                      <div className="grid grid-cols-2 gap-3">
                        <Link to={`/admin/package-designs/${packageDesign._id}/edit`} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700">
                          Edit
                        </Link>
                        <button type="button" onClick={() => handleToggleVisibility(packageDesign)} disabled={Boolean(actionDesignId)} className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${packageDesign.isVisible ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
                          {actionDesignId === packageDesign._id ? "Updating..." : packageDesign.isVisible ? "Hide" : "Show"}
                        </button>
                        <button type="button" onClick={() => handleToggleFeatured(packageDesign)} disabled={Boolean(actionDesignId)} className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${packageDesign.isFeatured ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50" : "bg-amber-500 text-white hover:bg-amber-600"}`}>
                          {actionDesignId === packageDesign._id ? "Updating..." : packageDesign.isFeatured ? "Make Standard" : "Make Featured"}
                        </button>
                        <button type="button" onClick={() => handleMakeDefault(packageDesign)} disabled={Boolean(actionDesignId) || packageDesign.isDefault} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50">
                          {packageDesign.isDefault ? "Default Design" : actionDesignId === packageDesign._id ? "Updating..." : "Make Default"}
                        </button>
                        <Link to="/admin/service-packages" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-center text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600">
                          Packages
                        </Link>
                        <button type="button" onClick={() => handleDelete(packageDesign)} disabled={Boolean(actionDesignId) || !["super-admin", "admin"].includes(admin?.role)} title={["super-admin", "admin"].includes(admin?.role) ? "Permanently delete design" : "Your role cannot permanently delete designs"} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">
                          {actionDesignId === packageDesign._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
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

export default AdminPackageDesignsPage;
