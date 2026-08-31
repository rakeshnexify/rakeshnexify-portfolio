import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";

import SiteSettingsForm from "../../components/admin/site-settings/SiteSettingsForm";
import {
  getSiteSettingsPage,
  siteSettingsPageDefinitions,
} from "../../config/siteSettingsPages";
import useAdminAuth from "../../hooks/useAdminAuth";
import useSiteSettings from "../../hooks/useSiteSettings";

import {
  fetchAdminSiteSettings,
  updateAdminSiteSettings,
} from "../../services/adminSiteSettingsApi";

function formatDateTime(value) {
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function AdminSiteSettingsEditorPage() {
  const navigate = useNavigate();

  const { pageKey = "" } = useParams();

  const pageDefinition = getSiteSettingsPage(pageKey);

  const { accessToken, logout } = useAdminAuth();

  const { refreshSettings } = useSiteSettings();

  const [settings, setSettings] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const currentPagePath = pageDefinition?.path || "/admin/site-settings";

  const handleMediaUnauthorized = useCallback(() => {
    logout();

    navigate("/admin/login", {
      replace: true,

      state: {
        from: {
          pathname: currentPagePath,
        },
      },
    });
  }, [currentPagePath, logout, navigate]);

  useEffect(() => {
    if (!accessToken || !pageDefinition) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadSiteSettings() {
      try {
        const loadedSettings = await fetchAdminSiteSettings(accessToken, {
          signal: controller.signal,
        });

        setSettings(loadedSettings);

        setLoadError("");
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
                pathname: currentPagePath,
              },
            },
          });

          return;
        }

        console.error(`${pageDefinition.title} loading failed:`, requestError);

        setSettings(null);

        setLoadError(
          requestError instanceof Error
            ? requestError.message
            : "Site settings could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadSiteSettings();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    currentPagePath,
    logout,
    navigate,
    pageDefinition,
    refreshKey,
  ]);

  if (!pageDefinition) {
    return <Navigate to="/admin/site-settings" replace />;
  }

  function handleRetry() {
    setIsLoading(true);

    setLoadError("");

    setSuccessMessage("");

    setRefreshKey((currentKey) => currentKey + 1);
  }

  async function handleSubmit(settingsData) {
    try {
      setSuccessMessage("");

      const response = await updateAdminSiteSettings(accessToken, settingsData);

      setSettings(response.settings);

      setSuccessMessage(
        response.message || `${pageDefinition.title} updated successfully.`,
      );

      await refreshSettings();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (requestError) {
      if (requestError?.status === 401) {
        logout();

        navigate("/admin/login", {
          replace: true,

          state: {
            from: {
              pathname: currentPagePath,
            },
          },
        });
      }

      throw requestError;
    }
  }

  return (
    <main className="rnx-admin-site-settings-editor-v482 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3.5 sm:px-6 sm:py-4 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/admin/site-settings"
            className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <span aria-hidden="true">
              &larr;
            </span>

            All Site Settings
          </Link>

          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <header className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-600 dark:text-brand-300">
                Website Management
              </p>

              <h1 className="mt-0.5 break-words text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[22px]">
                {pageDefinition.title}
              </h1>

              <p className="mt-0.5 max-w-3xl break-words text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">
                {pageDefinition.description}
              </p>
            </header>

            {settings && (
              <aside
                aria-label={`${pageDefinition.title} status`}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Last updated
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold text-slate-700">
                    {formatDateTime(settings.updatedAt)}
                  </p>

                  <span
                    className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-bold ${
                      settings.isPublished
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {settings.isPublished ? "Published" : "Unpublished"}
                  </span>
                </div>
              </aside>
            )}
          </div>


          <nav
            aria-label="Site Settings categories"
            className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1"
          >
            {siteSettingsPageDefinitions.map((page) => {
              const isActive = page.key === pageDefinition.key;

              return (
                <Link
                  key={page.key}
                  to={page.path}
                  className={`inline-flex min-h-8 shrink-0 items-center rounded-lg border px-2.5 text-[10px] font-semibold transition ${
                    isActive
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  {page.shortTitle}
                </Link>
              );
            })}
          </nav>

          {successMessage && (
            <div
              role="status"
              className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4"
            >
              <p className="text-sm font-semibold leading-6 text-emerald-700">
                {successMessage}
              </p>

              <p className="mt-1 text-sm leading-6 text-emerald-700">
                Public portfolio settings have also been refreshed.
              </p>
            </div>
          )}

          {isLoading && (
            <div
              role="status"
              aria-live="polite"
              className="mt-2.5 space-y-2"
            >
              <span className="sr-only">
                Loading {pageDefinition.title}...
              </span>

              {[1, 2].map((placeholder) => (
                <div
                  key={placeholder}
                  className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none"
                />
              ))}
            </div>
          )}

          {!isLoading && loadError && (
            <div
              role="alert"
              className="mt-6 max-w-2xl rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                Settings Error
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-950">
                {pageDefinition.title} could not be loaded
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {loadError}
              </p>

              <button
                type="button"
                onClick={handleRetry}
                className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !loadError && settings && (
            <div className="mt-2.5">
              <SiteSettingsForm
                key={`${settings.updatedAt || settings._id || "main"}-${pageDefinition.key}`}
                initialValues={settings}
                activePageKey={pageDefinition.key}
                cancelPath="/admin/site-settings"
                cancelLabel="Back to Settings"
                onSubmit={handleSubmit}
                submitLabel={`Save ${pageDefinition.shortTitle}`}
                accessToken={accessToken}
                onMediaUnauthorized={handleMediaUnauthorized}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default AdminSiteSettingsEditorPage;
