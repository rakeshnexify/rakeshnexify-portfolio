import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router";

import SiteSettingsForm from "../../components/admin/site-settings/SiteSettingsForm";
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

function AdminSiteSettingsPage() {
  const navigate = useNavigate();

  const { accessToken, admin, logout } = useAdminAuth();

  const { refreshSettings } = useSiteSettings();

  const [settings, setSettings] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

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
    setSuccessMessage("");

    setRefreshKey((currentKey) => currentKey + 1);
  }

  async function handleSubmit(settingsData) {
    try {
      setSuccessMessage("");

      const response = await updateAdminSiteSettings(accessToken, settingsData);

      setSettings(response.settings);

      setSuccessMessage(
        response.message || "Site settings updated successfully.",
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
              pathname: "/admin/site-settings",
            },
          },
        });
      }

      throw requestError;
    }
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
                Site Settings
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-slate-500 md:inline">
              {admin?.name}
            </span>

            <Link
              to="/"
              target="_blank"
              rel="noreferrer"
              className="hidden min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 sm:inline-flex"
            >
              View Portfolio ↗
            </Link>

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
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
        >
          <span aria-hidden="true">←</span>
          Dashboard
        </Link>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
              Website Management
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Site Settings
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              Manage the website brand identity, owner profile, Hero and About
              content, contact information, SEO metadata, homepage sections and
              publication status.
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

        {successMessage && (
          <div
            role="status"
            className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
          >
            <p className="text-sm font-semibold leading-6 text-emerald-700">
              {successMessage}
            </p>

            <p className="mt-2 text-sm leading-6 text-emerald-700">
              Public portfolio settings have also been refreshed.
            </p>
          </div>
        )}

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
            <SiteSettingsForm
              key={settings.updatedAt || settings._id || "main-site-settings"}
              initialValues={settings}
              onSubmit={handleSubmit}
              submitLabel="Save Site Settings"
            />
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminSiteSettingsPage;
