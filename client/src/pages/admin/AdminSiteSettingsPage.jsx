import { useEffect, useState } from "react";

import { useNavigate } from "react-router";

import SiteSettingsOverview from "../../components/admin/site-settings/SiteSettingsOverview";
import useAdminAuth from "../../hooks/useAdminAuth";

import { fetchAdminSiteSettings } from "../../services/adminSiteSettingsApi";

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

function AdminSiteSettingsPage() {
  const navigate = useNavigate();

  const { accessToken, logout } = useAdminAuth();

  const [settings, setSettings] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!accessToken) {
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
                pathname: "/admin/site-settings",
              },
            },
          });

          return;
        }

        console.error("Admin site settings loading failed:", requestError);

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
  }, [accessToken, logout, navigate, refreshKey]);

  function handleRetry() {
    setIsLoading(true);
    setLoadError("");

    setRefreshKey((currentKey) => currentKey + 1);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
              Website Management
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Site Settings
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              Open a settings category to manage only the website fields you
              need. All categories remain connected to the same dynamic Site
              Settings database record.
            </p>
          </div>

          {settings && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Last updated
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                {formatDateTime(settings.updatedAt)}
              </p>

              <span
                className={`mt-3 inline-flex rounded-lg px-3 py-1.5 text-xs font-bold ${
                  settings.isPublished
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {settings.isPublished ? "Published" : "Unpublished"}
              </span>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="mt-8 space-y-6">
            {[1, 2, 3, 4].map((placeholder) => (
              <div
                key={placeholder}
                className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {!isLoading && loadError && (
          <div
            role="alert"
            className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-7"
          >
            <h2 className="text-lg font-bold text-red-800">
              Site settings could not be loaded
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-700">{loadError}</p>

            <button
              type="button"
              onClick={handleRetry}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-red-300 bg-white px-5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !loadError && settings && (
          <div className="mt-8">
            <SiteSettingsOverview />
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminSiteSettingsPage;
