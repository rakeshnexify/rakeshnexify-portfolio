import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  fetchAdminCompanies,
  updateAdminCompany,
} from "../../services/adminCompaniesApi";

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
  const url = String(value || "").trim();

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

function sortMenuCompanies(firstCompany, secondCompany) {
  const firstOrder = Number(firstCompany?.order);
  const secondOrder = Number(secondCompany?.order);
  const safeFirstOrder = Number.isFinite(firstOrder) ? firstOrder : 0;
  const safeSecondOrder = Number.isFinite(secondOrder) ? secondOrder : 0;

  if (safeFirstOrder !== safeSecondOrder) {
    return safeFirstOrder - safeSecondOrder;
  }

  return String(firstCompany?.name || "").localeCompare(
    String(secondCompany?.name || ""),
    undefined,
    { sensitivity: "base" },
  );
}

function isCompanyMenuCandidate(company) {
  return ["owned", "managed"].includes(
    String(company?.relationship || "")
      .trim()
      .toLowerCase(),
  );
}

function isCompanyInPublicMenu(company) {
  return (
    company?.isFeatured === true &&
    company?.isVisible !== false &&
    String(company?.status || "")
      .trim()
      .toLowerCase() === "active" &&
    Boolean(getSafeWebsiteUrl(company?.websiteUrl))
  );
}

function AdminCompaniesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, logout } = useAdminAuth();

  const [companies, setCompanies] = useState([]);
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

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadCompanies() {
      setIsLoading(true);

      try {
        const response = await fetchAdminCompanies(accessToken, {}, {
          signal: controller.signal,
        });

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
            state: { from: { pathname: "/admin/companies" } },
          });
          return;
        }

        console.error("Company submenu loading failed:", requestError);
        setCompanies([]);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Company submenu items could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadCompanies();
    return () => controller.abort();
  }, [accessToken, logout, navigate, refreshKey]);

  const menuCompanies = useMemo(
    () => companies.filter(isCompanyMenuCandidate).sort(sortMenuCompanies),
    [companies],
  );

  const visibleMenuCount = useMemo(
    () => menuCompanies.filter(isCompanyInPublicMenu).length,
    [menuCompanies],
  );

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
        state: { from: { pathname: "/admin/companies" } },
      });
      return;
    }

    console.error("Company submenu action failed:", requestError);
    setError(
      requestError instanceof Error
        ? requestError.message
        : "Company submenu action could not be completed.",
    );
  }

  async function handleToggleMenu(company) {
    if (!company?._id || actionCompanyId) {
      return;
    }

    const currentlyInMenu = isCompanyInPublicMenu(company);
    const websiteUrl = getSafeWebsiteUrl(company.websiteUrl);

    if (!currentlyInMenu && !websiteUrl) {
      setError(
        `"${company.name}" needs a valid Website URL before it can appear in the Companies submenu.`,
      );
      return;
    }

    try {
      setActionCompanyId(company._id);
      setError("");
      setSuccessMessage("");

      const payload = currentlyInMenu
        ? { isFeatured: false }
        : { isFeatured: true, isVisible: true, status: "active" };

      const response = await updateAdminCompany(
        accessToken,
        company._id,
        payload,
      );

      setSuccessMessage(
        currentlyInMenu
          ? `"${response.company.name}" was removed from the Companies submenu.`
          : `"${response.company.name}" is now visible in the Companies submenu.`,
      );
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionCompanyId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
                Navigation
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                Company Submenu
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Manage only the company links shown under the public Companies
                menu. Company profile filters, business details and public
                company pages are no longer part of this Admin area.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/admin/site-settings/navigation"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                Edit Companies Menu
              </Link>
              <Link
                to="/admin/companies/new"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                Add Submenu Company
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/70">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Saved links
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                {menuCompanies.length}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/70">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Live in submenu
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {visibleMenuCount}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/70">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Parent menu
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950 dark:text-white">
                Site Settings → Navigation
              </p>
            </div>
          </div>
        </header>

        {successMessage && (
          <div role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            {successMessage}
          </div>
        )}

        {error && (
          <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-950 dark:text-white">
                Submenu companies
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Order controls placement. Remove only hides the link from the
                menu; it does not destroy Company data used elsewhere.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-500 px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-brand-300 dark:hover:bg-brand-950/30"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="grid min-h-60 place-items-center p-8">
              <div className="text-center">
                <div className="mx-auto size-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600 motion-reduce:animate-none dark:border-slate-700" />
                <p className="mt-4 text-sm font-semibold text-slate-500">
                  Loading submenu links...
                </p>
              </div>
            </div>
          ) : menuCompanies.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-lg font-bold text-slate-950 dark:text-white">
                No company submenu links yet
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Add a company name and website URL. It can then appear directly
                inside the public Companies dropdown.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {menuCompanies.map((company) => {
                const websiteUrl = getSafeWebsiteUrl(company.websiteUrl);
                const isInMenu = isCompanyInPublicMenu(company);
                const isBusy = actionCompanyId === company._id;

                return (
                  <article key={company._id} className="grid gap-4 px-5 py-5 lg:grid-cols-[5rem_minmax(0,1fr)_auto] lg:items-center">
                    <div>
                      <span className="inline-flex min-w-14 items-center justify-center rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        #{Number.isFinite(Number(company.order)) ? Number(company.order) : 0}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-slate-950 dark:text-white">
                          {company.name}
                        </h3>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${isInMenu ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                          {isInMenu ? "In menu" : "Removed"}
                        </span>
                      </div>

                      {websiteUrl ? (
                        <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">
                          {websiteUrl}
                        </a>
                      ) : (
                        <p className="mt-1 text-sm font-medium text-amber-600">
                          Website URL required
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {websiteUrl && (
                        <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-3.5 text-xs font-bold text-slate-700 transition hover:border-brand-500 hover:text-brand-700 dark:border-slate-700 dark:text-slate-200">
                          Open Website
                        </a>
                      )}
                      <Link to={`/admin/companies/${company._id}/edit`} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-500 px-3.5 text-xs font-bold text-brand-700 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-950/30">
                        Edit
                      </Link>
                      <button type="button" onClick={() => handleToggleMenu(company)} disabled={isBusy} className={`inline-flex min-h-10 items-center justify-center rounded-xl px-3.5 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${isInMenu ? "bg-slate-700 hover:bg-slate-800" : "bg-brand-600 hover:bg-brand-700"}`}>
                        {isBusy ? "Saving..." : isInMenu ? "Remove from Menu" : "Add to Menu"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default AdminCompaniesPage;
