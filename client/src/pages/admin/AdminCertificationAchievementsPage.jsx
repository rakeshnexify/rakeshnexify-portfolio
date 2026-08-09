import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  CERTIFICATION_ACHIEVEMENT_TYPES,
  deleteAdminCertificationAchievement,
  fetchAdminCertificationAchievements,
  updateAdminCertificationAchievement,
} from "../../services/adminCertificationAchievementsApi";
import { certificationAchievementTypeLabels } from "../../utils/certificationAchievementForm";

const initialFilters = {
  search: "",
  type: "",
  visibility: "all",
  featured: "all",
  expiration: "all",
};

const typeStyles = {
  certification: "bg-blue-100 text-blue-700",
  license: "bg-violet-100 text-violet-700",
  award: "bg-amber-100 text-amber-800",
  achievement: "bg-emerald-100 text-emerald-700",
};

function createApiFilters(filters) {
  const apiFilters = {
    search: filters.search.trim(),
    type: filters.type,
    expiration: filters.expiration,
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

function formatDateOnly(value) {
  if (!value) {
    return "Not available";
  }

  const cleanValue = String(value).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    return "Not available";
  }

  const date = new Date(`${cleanValue}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatUpdatedDate(value) {
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

function createInitials(value) {
  const initials = String(value || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "CA";
}

function getEvidenceKind(mediaUrl) {
  if (!mediaUrl) {
    return "none";
  }

  try {
    const url = new URL(mediaUrl);
    const pathname = url.pathname.toLowerCase();

    if (
      /\.(?:jpe?g|png|webp|avif|gif|svg)$/.test(pathname)
    ) {
      return "image";
    }

    if (/\.pdf$/.test(pathname)) {
      return "document";
    }

    return "link";
  } catch {
    return "link";
  }
}

function CertificationAchievementEvidencePreview({
  mediaUrl,
  mediaAlt,
  title,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const evidenceKind = getEvidenceKind(mediaUrl);

  if (!mediaUrl) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
          Evidence
        </p>

        <p className="mt-2 text-sm font-semibold text-slate-500">
          No evidence media added
        </p>
      </div>
    );
  }

  if (evidenceKind === "image" && !imageFailed) {
    return (
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <div className="aspect-[16/10] overflow-hidden bg-slate-100">
          <img
            src={mediaUrl}
            alt={mediaAlt || `${title} evidence`}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Evidence Preview
          </span>

          <a
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-brand-600 transition hover:text-brand-700"
          >
            Open Media
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        Evidence
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-700">
        {evidenceKind === "document"
          ? "PDF / document evidence attached"
          : imageFailed
            ? "Image preview unavailable"
            : "External evidence attached"}
      </p>

      <a
        href={mediaUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg bg-white px-3 text-sm font-semibold text-brand-600 ring-1 ring-slate-200 transition hover:bg-brand-50"
      >
        View Evidence
      </a>
    </div>
  );
}

function AdminCertificationAchievementsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, admin, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({ ...initialFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...initialFilters });
  const [achievements, setAchievements] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionAchievementId, setActionAchievementId] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || "",
  );

  useEffect(() => {
    const routeMessage = location.state?.successMessage || "";

    if (!routeMessage) {
      return;
    }

    setSuccessMessage(routeMessage);

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

    async function loadAchievements() {
      setIsLoading(true);

      try {
        const response = await fetchAdminCertificationAchievements(
          accessToken,
          apiFilters,
          { signal: controller.signal },
        );

        if (controller.signal.aborted) {
          return;
        }

        setAchievements(response.achievements);
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
                pathname: "/admin/achievements",
              },
            },
          });

          return;
        }

        console.error(
          "Admin Certifications & Achievements loading failed:",
          requestError,
        );

        setAchievements([]);
        setResultCount(0);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Certifications & Achievements could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadAchievements();

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
    setAppliedFilters({ ...formFilters });
  }

  function handleClearFilters() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setFormFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
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
            pathname: "/admin/achievements",
          },
        },
      });

      return;
    }

    if (requestError?.status === 403) {
      setError(
        requestError.message ||
          "Your Admin role cannot perform this Certification / Achievement action.",
      );
      return;
    }

    console.error(
      "Admin Certification / Achievement action failed:",
      requestError,
    );

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Certification / Achievement action could not be completed.",
    );
  }

  function updateCollection(updatedAchievement, filterField) {
    const shouldRemoveFromCurrentView =
      typeof apiFilters[filterField] === "boolean" &&
      updatedAchievement[filterField] !== apiFilters[filterField];

    setAchievements((currentRecords) =>
      shouldRemoveFromCurrentView
        ? currentRecords.filter(
            (record) => record._id !== updatedAchievement._id,
          )
        : currentRecords.map((record) =>
            record._id === updatedAchievement._id
              ? updatedAchievement
              : record,
          ),
    );

    if (shouldRemoveFromCurrentView) {
      setResultCount((currentCount) => Math.max(0, currentCount - 1));
    }
  }

  async function handleToggleVisibility(achievement) {
    if (!achievement?._id || actionAchievementId) {
      return;
    }

    try {
      setActionAchievementId(achievement._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminCertificationAchievement(
        accessToken,
        achievement._id,
        { isVisible: !achievement.isVisible },
      );

      setSuccessMessage(
        response.achievement.isVisible
          ? `"${response.achievement.title}" is now visible.`
          : `"${response.achievement.title}" is now hidden.`,
      );

      updateCollection(response.achievement, "isVisible");
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionAchievementId("");
    }
  }

  async function handleToggleFeatured(achievement) {
    if (!achievement?._id || actionAchievementId) {
      return;
    }

    try {
      setActionAchievementId(achievement._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminCertificationAchievement(
        accessToken,
        achievement._id,
        { isFeatured: !achievement.isFeatured },
      );

      setSuccessMessage(
        response.achievement.isFeatured
          ? `"${response.achievement.title}" is now featured.`
          : `"${response.achievement.title}" is now a standard record.`,
      );

      updateCollection(response.achievement, "isFeatured");
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionAchievementId("");
    }
  }

  async function handleDelete(achievement) {
    if (!achievement?._id || actionAchievementId) {
      return;
    }

    const isConfirmed = window.confirm(
      `Permanently delete "${achievement.title}"?\n\nThis action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setActionAchievementId(achievement._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminCertificationAchievement(
        accessToken,
        achievement._id,
      );

      setSuccessMessage(
        `"${response.deletedAchievement.title}" was permanently deleted.`,
      );

      setAchievements((currentRecords) =>
        currentRecords.filter(
          (record) => record._id !== achievement._id,
        ),
      );

      setResultCount((currentCount) => Math.max(0, currentCount - 1));
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionAchievementId("");
    }
  }

  const canDeleteAchievements = ["super-admin", "admin"].includes(admin?.role);

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          to="/admin/dashboard"
          className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-600 transition hover:text-brand-700"
        >
          ← Back to Admin Dashboard
        </Link>

        <div className="mt-6 flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
              Credentials & Recognition
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Certifications & Achievements
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Manage independent certifications, licenses, awards and
              achievements while keeping Education certificates and
              Experience achievement bullets in their original domains.
            </p>
          </div>

          <Link
            to="/admin/achievements/new"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Add New Record
          </Link>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label
                htmlFor="achievement-search"
                className="text-sm font-semibold text-slate-700"
              >
                Search
              </label>

              <input
                id="achievement-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Title, issuer, credential ID"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="achievement-type-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Type
              </label>

              <select
                id="achievement-type-filter"
                name="type"
                value={formFilters.type}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="">All types</option>

                {CERTIFICATION_ACHIEVEMENT_TYPES.map((recordType) => (
                  <option key={recordType} value={recordType}>
                    {certificationAchievementTypeLabels[recordType] ||
                      recordType}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="achievement-visibility-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Visibility
              </label>

              <select
                id="achievement-visibility-filter"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="all">All records</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="achievement-featured-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Display Type
              </label>

              <select
                id="achievement-featured-filter"
                name="featured"
                value={formFilters.featured}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="all">All records</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="achievement-expiration-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Expiration
              </label>

              <select
                id="achievement-expiration-filter"
                name="expiration"
                value={formFilters.expiration}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="all">All records</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
            >
              Clear Filters
            </button>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-600">
            {isLoading
              ? "Loading records..."
              : `${resultCount} Certification / Achievement record(s) found`}
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        <div aria-live="polite">
          {successMessage && (
            <div
              role="status"
              className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700"
            >
              {successMessage}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        {isLoading && (
          <div
            className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Loading Certifications and Achievements"
          >
            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-[31rem] animate-pulse rounded-3xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && achievements.length === 0 && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-950">
              No Certification / Achievement records found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Create the first record or change the current filters.
            </p>
          </div>
        )}

        {!isLoading && achievements.length > 0 && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {achievements.map((achievement) => {
              const typeLabel =
                certificationAchievementTypeLabels[achievement.type] ||
                achievement.type ||
                "Achievement";

              const typeStyle =
                typeStyles[achievement.type] || typeStyles.achievement;

              const isActionPending =
                actionAchievementId === achievement._id;

              return (
                <article
                  key={achievement._id}
                  className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative overflow-hidden bg-slate-950 px-6 py-7 text-white">
                    <div className="absolute -right-10 -top-10 size-32 rounded-full bg-brand-600/20 blur-3xl" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div className="grid size-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-lg font-black">
                        {createInitials(achievement.title)}
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        {achievement.isFeatured && (
                          <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950">
                            Featured
                          </span>
                        )}

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            achievement.isVisible
                              ? "bg-emerald-400/20 text-emerald-200"
                              : "bg-white/10 text-slate-300"
                          }`}
                        >
                          {achievement.isVisible ? "Visible" : "Hidden"}
                        </span>
                      </div>
                    </div>

                    <p className="relative mt-6 break-words text-sm font-semibold text-brand-300">
                      {achievement.issuerName || "Independent achievement"}
                    </p>

                    <h2 className="relative mt-2 break-words text-xl font-black">
                      {achievement.title}
                    </h2>

                    <p className="relative mt-2 text-sm text-slate-400">
                      Issued {formatDateOnly(achievement.issueDate)}
                    </p>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${typeStyle}`}
                      >
                        {typeLabel}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        Order {achievement.order ?? 0}
                      </span>

                      {achievement.doesNotExpire && (
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">
                          No Expiration
                        </span>
                      )}
                    </div>

                    {!achievement.doesNotExpire &&
                      achievement.expirationDate && (
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                            Expiration
                          </p>

                          <p className="mt-2 font-bold text-slate-800">
                            {formatDateOnly(achievement.expirationDate)}
                          </p>
                        </div>
                      )}

                    <p className="mt-5 line-clamp-4 text-sm leading-7 text-slate-600">
                      {achievement.shortDescription}
                    </p>

                    {achievement.credentialId && (
                      <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                          Credential ID
                        </p>

                        <p className="mt-2 break-all text-sm font-semibold text-slate-700">
                          {achievement.credentialId}
                        </p>
                      </div>
                    )}

                    <CertificationAchievementEvidencePreview
                      mediaUrl={achievement.mediaUrl}
                      mediaAlt={achievement.mediaAlt}
                      title={achievement.title}
                    />

                    <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                          Evidence
                        </dt>
                        <dd className="mt-1 font-semibold text-slate-700">
                          {achievement.mediaUrl ? "Attached" : "None"}
                        </dd>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-3">
                        <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                          Updated
                        </dt>
                        <dd className="mt-1 font-semibold text-slate-700">
                          {formatUpdatedDate(achievement.updatedAt)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                      <Link
                        to={`/admin/achievements/${achievement._id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(achievement)}
                        disabled={Boolean(actionAchievementId)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActionPending
                          ? "Working..."
                          : achievement.isVisible
                            ? "Hide"
                            : "Show"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(achievement)}
                        disabled={Boolean(actionAchievementId)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActionPending
                          ? "Working..."
                          : achievement.isFeatured
                            ? "Unfeature"
                            : "Feature"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(achievement)}
                        disabled={
                          Boolean(actionAchievementId) ||
                          !canDeleteAchievements
                        }
                        title={
                          canDeleteAchievements
                            ? "Permanently delete Certification / Achievement"
                            : "Your role cannot permanently delete these records"
                        }
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>
    </main>
  );
}

export default AdminCertificationAchievementsPage;
