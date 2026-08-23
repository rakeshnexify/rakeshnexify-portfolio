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
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
                Relationships
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                Clients & Partners
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Manage the public client and partner cards, logos, relationship
                dates, collaboration details, display order and Home preview
                priority. Company Menu links remain separate.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/clients-partners"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                View Public Page
              </a>

              <Link
                to="/admin/clients-partners/new"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                Add Client / Partner
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Total", relationships.length, "text-slate-950 dark:text-white"],
              ["Clients", clientCount, "text-brand-600"],
              ["Partners", partnerCount, "text-emerald-600"],
              ["Public", liveCount, "text-violet-600"],
            ].map(([label, value, valueClass]) => (
              <div
                key={label}
                className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/70"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  {label}
                </p>
                <p className={`mt-1 text-2xl font-bold ${valueClass}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </header>

        {successMessage && (
          <div
            role="status"
            className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {successMessage}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {error}
          </div>
        )}

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                ["all", "All"],
                ["client", "Clients"],
                ["partner", "Partners"],
              ].map(([key, label]) => {
                const isActive = relationshipFilter === key;

                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setRelationshipFilter(key)}
                    className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
                      isActive
                        ? "bg-brand-600 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:border-brand-500 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600 transition hover:border-brand-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300"
              >
                Refresh
              </button>
            </div>

            <label className="w-full lg:max-w-sm">
              <span className="sr-only">Search clients and partners</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search clients & partners..."
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60"
              />
            </label>
          </div>

          {isLoading ? (
            <div className="grid min-h-64 place-items-center p-8">
              <div className="text-center">
                <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600 motion-reduce:animate-none dark:border-slate-700" />
                <p className="mt-4 text-sm font-semibold text-slate-500">
                  Loading Clients & Partners...
                </p>
              </div>
            </div>
          ) : relationships.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-lg font-bold text-slate-950 dark:text-white">
                No clients or partners yet
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Add your first client or business partner. It will use the
                shared Company data model while staying separate from the
                Companies navigation menu.
              </p>
              <Link
                to="/admin/clients-partners/new"
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white"
              >
                Add Client / Partner
              </Link>
            </div>
          ) : filteredRelationships.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-lg font-bold text-slate-950 dark:text-white">
                No matching relationships
              </p>
              <button
                type="button"
                onClick={() => {
                  setRelationshipFilter("all");
                  setSearchQuery("");
                }}
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-400 px-4 text-sm font-semibold text-brand-700 dark:text-brand-300"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
              {filteredRelationships.map((company) => {
                const relationship = cleanText(
                  company?.relationship,
                ).toLowerCase();
                const status = cleanText(company?.status).toLowerCase();
                const isPublic =
                  company?.isVisible !== false && status === "active";
                const isArchived = status === "archived";
                const isFeatured = company?.isFeatured === true;
                const isBusy = actionCompanyId === company?._id;
                const websiteUrl = getSafeWebsiteUrl(company?.websiteUrl);
                const logoUrl = getSafeMediaUrl(company?.logoUrl);
                const name = cleanText(company?.name) || "Company";

                return (
                  <article
                    key={company?._id}
                    className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:p-5"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      {logoUrl ? (
                        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
                          <img
                            src={logoUrl}
                            alt=""
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-50 text-base font-black text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                          {createInitials(name)}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="break-words text-base font-bold text-slate-950 dark:text-white">
                            {name}
                          </h2>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              relationship === "partner"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                : "bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                            }`}
                          >
                            {relationship === "partner" ? "Partner" : "Client"}
                          </span>

                          {isFeatured && (
                            <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                              Home priority
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm font-medium text-brand-600 dark:text-brand-300">
                          {cleanText(company?.industry) || "No industry set"}
                        </p>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {cleanText(company?.shortDescription) ||
                            "No public description set."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          isPublic
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : isArchived
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {isPublic ? "Public" : isArchived ? "Archived" : "Hidden"}
                      </span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Order #{Number(company?.order || 0)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {websiteUrl && (
                        <a
                          href={websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-3.5 text-xs font-bold text-slate-700 transition hover:border-brand-500 hover:text-brand-700 dark:border-slate-700 dark:text-slate-200"
                        >
                          Open Website
                        </a>
                      )}

                      <Link
                        to={`/admin/clients-partners/${company._id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-500 px-3.5 text-xs font-bold text-brand-700 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/30"
                      >
                        Edit
                      </Link>

                      {!isArchived && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(company)}
                            disabled={isBusy}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-700 px-3.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy
                              ? "Saving..."
                              : isPublic
                                ? "Hide"
                                : "Publish"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleHomePriority(company)}
                            disabled={isBusy}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-violet-600 px-3.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isFeatured
                              ? "Remove Home Priority"
                              : "Prioritize on Home"}
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => handleArchive(company)}
                        disabled={isBusy}
                        className={`inline-flex min-h-10 items-center justify-center rounded-xl px-3.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          isArchived
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                        }`}
                      >
                        {isBusy
                          ? "Saving..."
                          : isArchived
                            ? "Restore & Publish"
                            : "Archive"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Archive hides a relationship without permanently deleting the shared
          Company record, protecting Team and other references.
        </p>
      </section>
    </main>
  );
}

export default AdminClientsPartnersPage;
