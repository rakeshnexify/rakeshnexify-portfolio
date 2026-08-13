import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  deleteAdminExperience,
  fetchAdminExperience,
  updateAdminExperience,
} from "../../services/adminExperienceApi";

const initialFilters = {
  search: "",
  employmentType: "",
  visibility: "all",
  featured: "all",
  workStatus: "all",
};

const employmentTypeLabels = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  freelance: "Freelance",
  contract: "Contract",
  internship: "Internship",
  "self-employed": "Self-employed",
  founder: "Founder",
  volunteer: "Volunteer",
  other: "Other",
};

const employmentTypeStyles = {
  "full-time": "bg-indigo-100 text-indigo-700",
  "part-time": "bg-violet-100 text-violet-700",
  freelance: "bg-cyan-100 text-cyan-700",
  contract: "bg-blue-100 text-blue-700",
  internship: "bg-orange-100 text-orange-700",
  "self-employed": "bg-emerald-100 text-emerald-700",
  founder: "bg-amber-100 text-amber-800",
  volunteer: "bg-pink-100 text-pink-700",
  other: "bg-slate-100 text-slate-700",
};

const locationTypeLabels = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

function createApiFilters(filters) {
  const apiFilters = {
    search: filters.search.trim(),
    employmentType: filters.employmentType,
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

  if (filters.workStatus === "current") {
    apiFilters.isCurrent = true;
  }

  if (filters.workStatus === "completed") {
    apiFilters.isCurrent = false;
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

  return initials || "EX";
}

function AdminExperiencePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, admin, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({ ...initialFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...initialFilters });
  const [experienceRecords, setExperienceRecords] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionExperienceId, setActionExperienceId] = useState("");
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

    async function loadExperience() {
      setIsLoading(true);

      try {
        const response = await fetchAdminExperience(
          accessToken,
          apiFilters,
          {
            signal: controller.signal,
          },
        );

        setExperienceRecords(response.experienceRecords);
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
                pathname: "/admin/experience",
              },
            },
          });

          return;
        }

        console.error("Admin Experience loading failed:", requestError);

        setExperienceRecords([]);
        setResultCount(0);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Experience records could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadExperience();

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

  function handleExperienceActionError(requestError) {
    if (requestError?.status === 401) {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: {
            pathname: "/admin/experience",
          },
        },
      });

      return;
    }

    if (requestError?.status === 403) {
      setError(
        requestError.message ||
          "Your Admin role cannot perform this Experience action.",
      );

      return;
    }

    console.error("Admin Experience action failed:", requestError);

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Experience action could not be completed.",
    );
  }

  function updateExperienceCollection(updatedExperience, filterField) {
    const shouldRemoveFromCurrentView =
      typeof apiFilters[filterField] === "boolean" &&
      updatedExperience[filterField] !== apiFilters[filterField];

    setExperienceRecords((currentRecords) =>
      shouldRemoveFromCurrentView
        ? currentRecords.filter(
            (currentRecord) => currentRecord._id !== updatedExperience._id,
          )
        : currentRecords.map((currentRecord) =>
            currentRecord._id === updatedExperience._id
              ? updatedExperience
              : currentRecord,
          ),
    );

    if (shouldRemoveFromCurrentView) {
      setResultCount((currentCount) => Math.max(0, currentCount - 1));
    }
  }

  async function handleToggleVisibility(experience) {
    if (!experience?._id || actionExperienceId) {
      return;
    }

    try {
      setActionExperienceId(experience._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminExperience(
        accessToken,
        experience._id,
        {
          isVisible: !experience.isVisible,
        },
      );

      setSuccessMessage(
        response.experience.isVisible
          ? `"${response.experience.jobTitle}" is now visible on the portfolio.`
          : `"${response.experience.jobTitle}" is now hidden from the portfolio.`,
      );

      updateExperienceCollection(response.experience, "isVisible");
    } catch (requestError) {
      handleExperienceActionError(requestError);
    } finally {
      setActionExperienceId("");
    }
  }

  async function handleToggleFeatured(experience) {
    if (!experience?._id || actionExperienceId) {
      return;
    }

    try {
      setActionExperienceId(experience._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminExperience(
        accessToken,
        experience._id,
        {
          isFeatured: !experience.isFeatured,
        },
      );

      setSuccessMessage(
        response.experience.isFeatured
          ? `"${response.experience.jobTitle}" is now featured.`
          : `"${response.experience.jobTitle}" is now a standard Experience record.`,
      );

      updateExperienceCollection(response.experience, "isFeatured");
    } catch (requestError) {
      handleExperienceActionError(requestError);
    } finally {
      setActionExperienceId("");
    }
  }

  async function handleDeleteExperience(experience) {
    if (!experience?._id || actionExperienceId) {
      return;
    }

    const isConfirmed = window.confirm(
      `Permanently delete "${experience.jobTitle}" from "${experience.organizationName}"?\n\nThis action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setActionExperienceId(experience._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminExperience(
        accessToken,
        experience._id,
      );

      setSuccessMessage(
        `"${response.deletedExperience.jobTitle}" was permanently deleted.`,
      );

      setExperienceRecords((currentRecords) =>
        currentRecords.filter(
          (currentRecord) => currentRecord._id !== experience._id,
        ),
      );

      setResultCount((currentCount) => Math.max(0, currentCount - 1));
    } catch (requestError) {
      handleExperienceActionError(requestError);
    } finally {
      setActionExperienceId("");
    }
  }

  const canDeleteExperience = ["super-admin", "admin"].includes(admin?.role);

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
              Experience Management
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Manage Experience
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Create and manage organizations, professional roles, employment
              timelines, responsibilities, achievements, expertise, display
              order and publishing controls.
            </p>
          </div>

          <Link
            to="/admin/experience/new"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Add New Experience
          </Link>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label
                htmlFor="experience-search"
                className="text-sm font-semibold text-slate-700"
              >
                Search
              </label>

              <input
                id="experience-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Organization, role or skill"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="experience-type-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Employment Type
              </label>

              <select
                id="experience-type-filter"
                name="employmentType"
                value={formFilters.employmentType}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="">All types</option>

                {Object.entries(employmentTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="experience-visibility-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Visibility
              </label>

              <select
                id="experience-visibility-filter"
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
                htmlFor="experience-featured-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Display Type
              </label>

              <select
                id="experience-featured-filter"
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
                htmlFor="experience-status-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Work Status
              </label>

              <select
                id="experience-status-filter"
                name="workStatus"
                value={formFilters.workStatus}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="all">All statuses</option>
                <option value="current">Current positions</option>
                <option value="completed">Completed positions</option>
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
              ? "Loading Experience..."
              : `${resultCount} Experience record(s) found`}
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
            aria-label="Loading Experience records"
          >
            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-[35rem] animate-pulse rounded-3xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && experienceRecords.length === 0 && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-950">
              No Experience records found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Create the first Experience record or change the current filters.
            </p>
          </div>
        )}

        {!isLoading && experienceRecords.length > 0 && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {experienceRecords.map((experience) => {
              const employmentTypeLabel =
                employmentTypeLabels[experience.employmentType] ||
                experience.employmentType ||
                "Other";

              const employmentTypeStyle =
                employmentTypeStyles[experience.employmentType] ||
                employmentTypeStyles.other;

              const isActionPending =
                actionExperienceId === experience._id;

              const timelineEnd = experience.isCurrent
                ? "Present"
                : formatDate(experience.endDate);

              return (
                <article
                  key={experience._id}
                  className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative overflow-hidden bg-slate-950 px-6 py-7 text-white">
                    <div className="absolute -right-10 -top-10 size-32 rounded-full bg-brand-600/20 blur-3xl" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-lg font-black">
                        <span>{createInitials(experience.organizationName)}</span>

                        {experience.organizationLogoUrl && (
                          <img
                            src={experience.organizationLogoUrl}
                            alt=""
                            className="absolute inset-0 size-full bg-white object-contain p-2"
                            onError={(event) => {
                              event.currentTarget.hidden = true;
                            }}
                          />
                        )}
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        {experience.isFeatured && (
                          <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950">
                            Featured
                          </span>
                        )}

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            experience.isVisible
                              ? "bg-emerald-400/20 text-emerald-200"
                              : "bg-white/10 text-slate-300"
                          }`}
                        >
                          {experience.isVisible ? "Visible" : "Hidden"}
                        </span>
                      </div>
                    </div>

                    <p className="relative mt-6 break-words text-sm font-semibold text-brand-300">
                      {experience.organizationName}
                    </p>

                    <h2 className="relative mt-2 break-words text-xl font-black">
                      {experience.jobTitle}
                    </h2>

                    <p className="relative mt-2 break-words text-sm text-slate-400">
                      {formatDate(experience.startDate)} — {timelineEnd}
                    </p>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${employmentTypeStyle}`}
                      >
                        {employmentTypeLabel}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        Order {experience.order ?? 0}
                      </span>

                      {experience.isCurrent && (
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">
                          Current Position
                        </span>
                      )}
                    </div>

                    {(experience.location || experience.locationType) && (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                          Work Location
                        </p>

                        {experience.location && (
                          <p className="mt-2 font-bold text-slate-800">
                            {experience.location}
                          </p>
                        )}

                        {experience.locationType && (
                          <p className="mt-1 text-sm font-semibold text-brand-700">
                            {locationTypeLabels[experience.locationType] ||
                              experience.locationType}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="mt-5 line-clamp-4 text-sm leading-7 text-slate-600">
                      {experience.shortDescription}
                    </p>

                    {Array.isArray(experience.skills) &&
                      experience.skills.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {experience.skills.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
                            >
                              {skill}
                            </span>
                          ))}

                          {experience.skills.length > 5 && (
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              +{experience.skills.length - 5}
                            </span>
                          )}
                        </div>
                      )}

                    <dl className="mt-5 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-400">Updated</dt>

                        <dd className="font-semibold text-slate-700">
                          {formatUpdatedDate(experience.updatedAt)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                      <Link
                        to={`/admin/experience/${experience._id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(experience)}
                        disabled={Boolean(actionExperienceId)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActionPending
                          ? "Working..."
                          : experience.isVisible
                            ? "Hide"
                            : "Show"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(experience)}
                        disabled={Boolean(actionExperienceId)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActionPending
                          ? "Working..."
                          : experience.isFeatured
                            ? "Unfeature"
                            : "Feature"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteExperience(experience)}
                        disabled={
                          Boolean(actionExperienceId) ||
                          !canDeleteExperience
                        }
                        title={
                          canDeleteExperience
                            ? "Permanently delete Experience record"
                            : "Your role cannot permanently delete Experience records"
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

export default AdminExperiencePage;
