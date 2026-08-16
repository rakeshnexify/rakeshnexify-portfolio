import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  deleteAdminCompany,
  fetchAdminCompanies,
  updateAdminCompany,
} from "../../services/adminCompaniesApi";

const initialFilters = {
  search: "",
  industry: "",
  relationship: "",
  status: "",
  visibility: "all",
  featured: "all",
};

const relationshipLabels = {
  owned: "Owned Company",
  managed: "Managed Company",
  partner: "Business Partner",
  client: "Client Company",
  other: "Associated Company",
};

const statusLabels = {
  planned: "Planned",
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};

const statusClasses = {
  planned: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-700",
  archived: "bg-red-50 text-red-700",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 motion-reduce:transition-none";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.14em] text-slate-500";

function createApiFilters(filters) {
  const apiFilters = {
    search: filters.search.trim(),
    industry: filters.industry.trim(),
    relationship: filters.relationship,
    status: filters.status,
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

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function createInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "CO";
}

function AdminCompaniesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, admin, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({
    ...initialFilters,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    ...initialFilters,
  });

  const [companies, setCompanies] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionCompanyId, setActionCompanyId] = useState("");

  const [successMessage, setSuccessMessage] = useState(
    () => location.state?.successMessage || "",
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

    async function loadCompanies() {
      setIsLoading(true);

      try {
        const response = await fetchAdminCompanies(accessToken, apiFilters, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setCompanies(response.companies);
        setResultCount(response.count);
        setError("");
      } catch (requestError) {
        if (controller.signal.aborted || requestError?.name === "AbortError") {
          return;
        }

        if (requestError?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,
            state: {
              from: {
                pathname: "/admin/companies",
              },
            },
          });

          return;
        }

        console.error("Admin companies loading failed:", requestError);

        setCompanies([]);
        setResultCount(0);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Companies could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadCompanies();

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

  function handleCompanyActionError(requestError) {
    if (requestError?.status === 401) {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: {
            pathname: "/admin/companies",
          },
        },
      });

      return;
    }

    console.error("Admin company action failed:", requestError);

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Company action could not be completed.",
    );
  }

  async function handleToggleVisibility(company) {
    if (!company?._id || actionCompanyId) {
      return;
    }

    try {
      setActionCompanyId(company._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminCompany(accessToken, company._id, {
        isVisible: !company.isVisible,
      });

      setSuccessMessage(
        response.company.isVisible
          ? `"${response.company.name}" is now visible on the portfolio.`
          : `"${response.company.name}" is now hidden from the portfolio.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleCompanyActionError(requestError);
    } finally {
      setActionCompanyId("");
    }
  }

  async function handleToggleFeatured(company) {
    if (!company?._id || actionCompanyId) {
      return;
    }

    try {
      setActionCompanyId(company._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminCompany(accessToken, company._id, {
        isFeatured: !company.isFeatured,
      });

      setSuccessMessage(
        response.company.isFeatured
          ? `"${response.company.name}" is now featured.`
          : `"${response.company.name}" is now a standard company.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleCompanyActionError(requestError);
    } finally {
      setActionCompanyId("");
    }
  }

  async function handleDeleteCompany(company) {
    if (!company?._id || actionCompanyId) {
      return;
    }

    const isConfirmed = window.confirm(
      `Permanently delete "${company.name}"?\n\nThis action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setActionCompanyId(company._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminCompany(accessToken, company._id);

      setSuccessMessage(
        `"${response.deletedCompany.name}" was permanently deleted.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleCompanyActionError(requestError);
    } finally {
      setActionCompanyId("");
    }
  }

  const canDeleteCompanies = ["super-admin", "admin"].includes(admin?.role);

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Business Management
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Companies
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage company profiles, business relationships, operational
              status, publication visibility and featured priority.
            </p>
          </div>

          <Link
            to="/admin/companies/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Add Company
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="company-search" className={labelClassName}>
                Search
              </label>

              <input
                id="company-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Name, slug, industry or service"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="company-industry" className={labelClassName}>
                Industry
              </label>

              <input
                id="company-industry"
                name="industry"
                type="text"
                value={formFilters.industry}
                onChange={handleFilterChange}
                placeholder="E-commerce and Online Retail"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="company-relationship" className={labelClassName}>
                Relationship
              </label>

              <select
                id="company-relationship"
                name="relationship"
                value={formFilters.relationship}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="">All relationships</option>
                <option value="owned">Owned Company</option>
                <option value="managed">Managed Company</option>
                <option value="partner">Business Partner</option>
                <option value="client">Client Company</option>
                <option value="other">Associated Company</option>
              </select>
            </div>

            <div>
              <label htmlFor="company-status" className={labelClassName}>
                Status
              </label>

              <select
                id="company-status"
                name="status"
                value={formFilters.status}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="">All statuses</option>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label htmlFor="company-visibility" className={labelClassName}>
                Visibility
              </label>

              <select
                id="company-visibility"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All companies</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label htmlFor="company-featured" className={labelClassName}>
                Display type
              </label>

              <select
                id="company-featured"
                name="featured"
                value={formFilters.featured}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All companies</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              Clear
            </button>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {isLoading
                ? "Loading companies..."
                : `${resultCount} compan${resultCount === 1 ? "y" : "ies"}`}
            </p>

            {!isLoading && (
              <p className="mt-1 text-xs text-slate-500">
                Showing company profiles matching the applied filters.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            Refresh
          </button>
        </div>

        <div aria-live="polite">
          {successMessage && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700"
            >
              {successMessage}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <p className="font-medium leading-6">{error}</p>

              <button
                type="button"
                onClick={handleRefresh}
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <span className="sr-only">Loading companies...</span>

            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-[31rem] animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && companies.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-base font-bold text-slate-950">
              No companies found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Change the current filters or create the first Company.
            </p>
          </div>
        )}

        {!isLoading && companies.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => {
              const businessAreas = Array.isArray(company.businessAreas)
                ? company.businessAreas
                : [];

              const statusLabel =
                statusLabels[company.status] || company.status || "Company";

              const relationshipLabel =
                relationshipLabels[company.relationship] ||
                company.relationship ||
                "Company";

              const isActionPending = actionCompanyId === company._id;

              return (
                <article
                  key={company._id}
                  className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative h-36 overflow-hidden bg-slate-950">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600/35 via-slate-950 to-cyan-500/20" />

                    {company.coverImageUrl && (
                      <img
                        src={company.coverImageUrl}
                        alt={`${company.name} cover`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                        className="absolute inset-0 size-full object-cover opacity-50"
                      />
                    )}

                    <div className="absolute inset-0 bg-slate-950/35" />

                    <div className="relative flex h-full flex-col justify-between p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/15 bg-white/10 text-sm font-bold text-white">
                          <span>{createInitials(company.name)}</span>

                          {company.logoUrl && (
                            <img
                              src={company.logoUrl}
                              alt={`${company.name} logo`}
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.hidden = true;
                              }}
                              className="absolute inset-0 size-full bg-white object-contain p-1"
                            />
                          )}
                        </div>

                        <span className="rounded-lg border border-white/10 bg-slate-950/60 px-2.5 py-1 text-xs font-bold text-white">
                          Order {company.order ?? 0}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {company.isFeatured && (
                          <span className="rounded-lg bg-amber-300 px-2.5 py-1 text-xs font-bold text-slate-950">
                            Featured
                          </span>
                        )}

                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                            company.isVisible
                              ? "bg-emerald-400/90 text-slate-950"
                              : "bg-slate-700 text-slate-100"
                          }`}
                        >
                          {company.isVisible ? "Visible" : "Hidden"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          statusClasses[company.status] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {statusLabel}
                      </span>

                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {relationshipLabel}
                      </span>
                    </div>

                    <h2 className="mt-4 break-words text-lg font-bold text-slate-950">
                      {company.name}
                    </h2>

                    {company.legalName &&
                      company.legalName !== company.name && (
                        <p className="mt-1 break-words text-sm font-medium text-slate-500">
                          {company.legalName}
                        </p>
                      )}

                    <p className="mt-1 break-all text-xs font-semibold text-brand-600">
                      {company.slug}
                    </p>

                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      {company.industry || "Industry not specified"}
                    </p>

                    {company.shortDescription && (
                      <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-slate-600">
                        {company.shortDescription}
                      </p>
                    )}

                    <div className="mt-5">
                      <p className={labelClassName}>Business areas</p>

                      {businessAreas.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {businessAreas.slice(0, 5).map((area) => (
                            <span
                              key={`${company._id}-${area}`}
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                            >
                              {area}
                            </span>
                          ))}

                          {businessAreas.length > 5 && (
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              +{businessAreas.length - 5}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          No business areas added
                        </p>
                      )}
                    </div>

                    <dl className="mt-5 divide-y divide-slate-100 border-y border-slate-100 text-sm">
                      <div className="flex items-center justify-between gap-4 py-3">
                        <dt className="text-slate-500">Business areas</dt>

                        <dd className="font-semibold text-slate-800">
                          {businessAreas.length}
                        </dd>
                      </div>

                      <div className="flex items-center justify-between gap-4 py-3">
                        <dt className="text-slate-500">Updated</dt>

                        <dd className="text-right font-semibold text-slate-700">
                          {formatDate(company.updatedAt)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                      <Link
                        to={`/admin/companies/${company._id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(company)}
                        disabled={actionCompanyId !== ""}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                      >
                        {isActionPending
                          ? "Working..."
                          : company.isVisible
                            ? "Hide"
                            : "Show"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(company)}
                        disabled={actionCompanyId !== ""}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                      >
                        {isActionPending
                          ? "Working..."
                          : company.isFeatured
                            ? "Make Standard"
                            : "Make Featured"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCompany(company)}
                        disabled={
                          actionCompanyId !== "" || !canDeleteCompanies
                        }
                        title={
                          canDeleteCompanies
                            ? "Permanently delete company"
                            : "Your role cannot permanently delete companies"
                        }
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                      >
                        {isActionPending ? "Working..." : "Delete"}
                      </button>
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

export default AdminCompaniesPage;