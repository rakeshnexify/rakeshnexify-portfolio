import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  fetchAdminCompanies,
  updateAdminCompany,
} from "../../services/adminCompaniesApi";

function cleanText(value) {
  return String(value ?? "").trim();
}

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    if (code <= 31 || code === 127) {
      return true;
    }
  }

  return false;
}

function getSafeWebsiteUrl(value) {
  const url = cleanText(value);

  if (!url || containsControlCharacters(url)) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      parsedUrl.hostname &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return parsedUrl.toString();
    }
  } catch {
    return "";
  }

  return "";
}

function getSafeMediaUrl(value) {
  const url = cleanText(value);

  if (!url || containsControlCharacters(url)) {
    return "";
  }

  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
    return url;
  }

  return getSafeWebsiteUrl(url);
}

function sortRelationships(firstCompany, secondCompany) {
  const featuredDifference =
    Number(Boolean(secondCompany?.isFeatured)) -
    Number(Boolean(firstCompany?.isFeatured));

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  const orderDifference =
    Number(firstCompany?.order || 0) - Number(secondCompany?.order || 0);

  if (orderDifference !== 0) {
    return orderDifference;
  }

  return cleanText(firstCompany?.name).localeCompare(
    cleanText(secondCompany?.name),
    undefined,
    { sensitivity: "base" },
  );
}

function isClientPartner(company) {
  return ["client", "partner"].includes(
    cleanText(company?.relationship).toLowerCase(),
  );
}

function createInitials(name) {
  const initials = cleanText(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "CP";
}

function AdminClientsPartnersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, logout } = useAdminAuth();

  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionCompanyId, setActionCompanyId] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    () => location.state?.successMessage || "",
  );

  useEffect(() => {
    if (!location.state?.successMessage) {
      return;
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadRelationships() {
      setIsLoading(true);

      try {
        const response = await fetchAdminCompanies(
          accessToken,
          {},
          { signal: controller.signal },
        );

        if (controller.signal.aborted) {
          return;
        }

        setCompanies(response.companies);
        setError("");
      } catch (requestError) {
        if (controller.signal.aborted || requestError?.name === "AbortError") {
          return;
        }

        if (requestError?.status === 401) {
          logout();
          navigate("/admin/login", {
            replace: true,
            state: { from: { pathname: "/admin/clients-partners" } },
          });
          return;
        }

        console.error("Clients & Partners loading failed:", requestError);
        setCompanies([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Clients & Partners could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadRelationships();

    return () => controller.abort();
  }, [accessToken, logout, navigate, refreshKey]);

  const relationships = useMemo(
    () => companies.filter(isClientPartner).sort(sortRelationships),
    [companies],
  );

  const filteredRelationships = useMemo(() => {
    const normalizedSearch = cleanText(searchQuery).toLowerCase();

    return relationships.filter((company) => {
      const relationship = cleanText(company?.relationship).toLowerCase();

      if (
        relationshipFilter !== "all" &&
        relationship !== relationshipFilter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        company?.name,
        company?.industry,
        company?.shortDescription,
        company?.role,
        ...(Array.isArray(company?.services) ? company.services : []),
      ]
        .map(cleanText)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [relationshipFilter, relationships, searchQuery]);

  const clientCount = relationships.filter(
    (company) => cleanText(company?.relationship).toLowerCase() === "client",
  ).length;

  const partnerCount = relationships.filter(
    (company) => cleanText(company?.relationship).toLowerCase() === "partner",
  ).length;

  const liveCount = relationships.filter(
    (company) =>
      company?.isVisible !== false &&
      cleanText(company?.status).toLowerCase() === "active",
  ).length;

  function handleRefresh() {
    setError("");
    setSuccessMessage("");
    setRefreshKey((currentKey) => currentKey + 1);
  }

  function handleActionError(requestError) {
    if (requestError?.status === 401) {
      logout();
      navigate("/admin/login", {
        replace: true,
        state: { from: { pathname: "/admin/clients-partners" } },
      });
      return;
    }

    console.error("Clients & Partners action failed:", requestError);
    setError(
      requestError instanceof Error
        ? requestError.message
        : "Clients & Partners action could not be completed.",
    );
  }

  async function updateRelationship(company, payload, successMessageFactory) {
    if (!company?._id || actionCompanyId) {
      return;
    }

    try {
      setActionCompanyId(company._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminCompany(
        accessToken,
        company._id,
        payload,
      );

      setSuccessMessage(successMessageFactory(response.company));
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionCompanyId("");
    }
  }

  function handleToggleVisibility(company) {
    const isCurrentlyLive =
      company?.isVisible !== false &&
      cleanText(company?.status).toLowerCase() === "active";

    updateRelationship(
      company,
      isCurrentlyLive
        ? { isVisible: false, status: "inactive" }
        : { isVisible: true, status: "active" },
      (updatedCompany) =>
        isCurrentlyLive
          ? `"${updatedCompany.name}" is hidden from the public Clients & Partners page.`
          : `"${updatedCompany.name}" is now published on Clients & Partners.`,
    );
  }

  function handleToggleHomePriority(company) {
    const isFeatured = company?.isFeatured === true;

    updateRelationship(
      company,
      { isFeatured: !isFeatured },
      (updatedCompany) =>
        isFeatured
          ? `"${updatedCompany.name}" no longer has Home preview priority.`
          : `"${updatedCompany.name}" now has Home preview priority.`,
    );
  }

  function handleArchive(company) {
    const isArchived = cleanText(company?.status).toLowerCase() === "archived";

    updateRelationship(
      company,
      isArchived
        ? { status: "active", isVisible: true }
        : { status: "archived", isVisible: false, isFeatured: false },
      (updatedCompany) =>
        isArchived
          ? `"${updatedCompany.name}" was restored and published.`
          : `"${updatedCompany.name}" was archived without deleting the shared Company record.`,
    );
  }

  return (
    <main className="rnx-admin-screenshot-light-page rnx-admin-clients-standard-v458 rnx-admin-clients-mobile-v460 rnx-admin-clients-services-mobile-v462 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1560px] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">
              Relationships
            </p>
            <h1 className="mt-1 text-[22px] font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              Clients & Partners
            </h1>
            <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs sm:leading-5">
              Manage public relationships, visibility, Home priority and display order.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:min-h-9 sm:text-[11px]"
              title={`${relationships.length} total / ${clientCount} clients / ${partnerCount} partners / ${liveCount} public`}
            >
              {relationships.length} {relationships.length === 1 ? "Relationship" : "Relationships"}
            </span>

            <a
              href="/clients-partners"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-brand-500 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:inline-flex"
            >
              View Public
            </a>

            <Link
              to="/admin/clients-partners/new"
              className="inline-flex min-h-8 items-center justify-center rounded-lg bg-brand-600 px-3 text-[10px] font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:min-h-9 sm:px-3.5 sm:text-xs"
            >
              Add Client / Partner
            </Link>
          </div>
        </header>

        {successMessage && (
          <div
            role="status"
            className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {successMessage}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <section className="mt-4 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <label className="min-w-0">
              <span className="sr-only">Search clients and partners</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search company, industry, role or description..."
                className="min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 sm:min-h-10"
              />
            </label>

            <label className="min-w-0">
              <span className="sr-only">Relationship type</span>
              <select
                value={relationshipFilter}
                onChange={(event) => setRelationshipFilter(event.target.value)}
                className="min-h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 sm:min-h-10"
              >
                <option value="all">All relationships</option>
                <option value="client">Clients</option>
                <option value="partner">Partners</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setRelationshipFilter("all");
                setSearchQuery("");
              }}
              disabled={relationshipFilter === "all" && !searchQuery}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-white sm:min-h-10"
            >
              Clear
            </button>
          </div>
        </section>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-[11px]">
            {filteredRelationships.length} {filteredRelationships.length === 1 ? "result" : "results"}
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-brand-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {isLoading ? (
          <div className="mt-3 grid min-h-36 place-items-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-center">
              <div className="mx-auto size-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600 motion-reduce:animate-none dark:border-slate-700" />
              <p className="mt-3 text-xs font-semibold text-slate-500">
                Loading Clients & Partners...
              </p>
            </div>
          </div>
        ) : relationships.length === 0 ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-base font-bold text-slate-950 dark:text-white">
              No clients or partners yet
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Add the first public relationship.
            </p>
            <Link
              to="/admin/clients-partners/new"
              className="mt-4 inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-4 text-xs font-semibold text-white"
            >
              Add Client / Partner
            </Link>
          </div>
        ) : filteredRelationships.length === 0 ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-base font-bold text-slate-950 dark:text-white">
              No matching relationships
            </p>
            <button
              type="button"
              onClick={() => {
                setRelationshipFilter("all");
                setSearchQuery("");
              }}
              className="mt-3 inline-flex min-h-8 items-center justify-center rounded-lg border border-brand-400 px-3 text-xs font-semibold text-brand-700 dark:text-brand-300"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {filteredRelationships.map((company) => {
              const relationship = cleanText(company?.relationship).toLowerCase();
              const status = cleanText(company?.status).toLowerCase();
              const isPublic =
                company?.isVisible !== false && status === "active";
              const isArchived = status === "archived";
              const isFeatured = company?.isFeatured === true;
              const isBusy = actionCompanyId === company?._id;
              const websiteUrl = getSafeWebsiteUrl(company?.websiteUrl);
              const logoUrl = getSafeMediaUrl(company?.logoUrl);
              const name = cleanText(company?.name) || "Company";
              const industry = cleanText(company?.industry);
              const role = cleanText(company?.role);
              const services = Array.isArray(company?.services)
                ? company.services.map(cleanText).filter(Boolean)
                : [];

              return (
                <article
                  key={company?._id}
                  className="rnx-admin-clients-actions-center-v500 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:p-4"
                >
                  <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
                    {logoUrl ? (
                      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950 sm:size-12 sm:p-1.5">
                        <img
                          src={logoUrl}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-brand-100 bg-brand-50 text-[11px] font-black text-brand-700 dark:border-brand-900/60 dark:bg-brand-950/40 dark:text-brand-300 sm:size-12 sm:text-xs">
                        {createInitials(name)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <span
                          className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold sm:text-[10px] ${
                            relationship === "partner"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300"
                              : "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-900/70 dark:bg-brand-950/30 dark:text-brand-300"
                          }`}
                        >
                          {relationship === "partner" ? "Partner" : "Client"}
                        </span>

                        <span
                          className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold sm:text-[10px] ${
                            isPublic
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300"
                              : isArchived
                                ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300"
                                : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {isPublic ? "Visible" : isArchived ? "Archived" : "Hidden"}
                        </span>

                        {isFeatured && (
                          <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300 sm:text-[10px]">
                            Home priority
                          </span>
                        )}

                        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:text-[10px]">
                          Order {Number(company?.order || 0)}
                        </span>
                      </div>

                      <div className="mt-1.5 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <h2 className="max-w-full truncate text-[13px] font-bold text-slate-950 dark:text-white sm:text-sm">
                          {name}
                        </h2>

                        {(industry || role) && (
                          <span className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-[11px]">
                            {[industry, role].filter(Boolean).join(" / ")}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs sm:leading-5">
                        {cleanText(company?.shortDescription) ||
                          "No public description set."}
                      </p>

                      {services.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {services.slice(0, 3).map((service) => (
                            <span
                              key={service}
                              className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {service}
                            </span>
                          ))}
                          {services.length > 3 && (
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              +{services.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-end gap-1.5 sm:mt-0 sm:self-center">
                    <Link
                      to={`/admin/clients-partners/${company._id}/edit`}
                      className="inline-flex min-h-8 items-center justify-center rounded-lg bg-brand-600 px-3 text-[10px] font-bold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:text-[11px]"
                    >
                      Edit
                    </Link>

                    <details className="relative">
                      <summary
                        className="inline-flex min-h-8 min-w-8 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-sm font-black leading-none text-slate-600 shadow-sm transition hover:border-slate-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-white [&::-webkit-details-marker]:hidden"
                        aria-label={`More actions for ${name}`}
                        title="More actions"
                      >
                        ...
                      </summary>

                      <div className="absolute right-0 z-30 mt-1.5 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                        {websiteUrl && (
                          <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-h-8 w-full items-center rounded-md px-2.5 text-left text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            Open website
                          </a>
                        )}

                        {!isArchived && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(company)}
                              disabled={isBusy}
                              className="flex min-h-8 w-full items-center rounded-md px-2.5 text-left text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                              {isBusy
                                ? "Saving..."
                                : isPublic
                                  ? "Hide from public"
                                  : "Publish"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleHomePriority(company)}
                              disabled={isBusy}
                              className="flex min-h-8 w-full items-center rounded-md px-2.5 text-left text-[11px] font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-violet-300 dark:hover:bg-violet-950/30"
                            >
                              {isBusy
                                ? "Saving..."
                                : isFeatured
                                  ? "Remove Home priority"
                                  : "Set Home priority"}
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => handleArchive(company)}
                          disabled={isBusy}
                          className={`flex min-h-8 w-full items-center rounded-md px-2.5 text-left text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            isArchived
                              ? "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                              : "text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
                          }`}
                        >
                          {isBusy ? "Saving..." : isArchived ? "Restore" : "Archive"}
                        </button>
                      </div>
                    </details>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-2 text-[9px] leading-4 text-slate-400 dark:text-slate-500 sm:text-[10px]">
          Company Menu links remain separate. Archive keeps the shared Company record.
        </p>
      </section>
    </main>
  );
}

export default AdminClientsPartnersPage;
