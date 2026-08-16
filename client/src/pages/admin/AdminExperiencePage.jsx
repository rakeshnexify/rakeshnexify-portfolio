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
  "full-time": "bg-indigo-50 text-indigo-700",
  "part-time": "bg-violet-50 text-violet-700",
  freelance: "bg-cyan-50 text-cyan-700",
  contract: "bg-blue-50 text-blue-700",
  internship: "bg-orange-50 text-orange-700",
  "self-employed": "bg-emerald-50 text-emerald-700",
  founder: "bg-amber-50 text-amber-800",
  volunteer: "bg-pink-50 text-pink-700",
  other: "bg-slate-100 text-slate-700",
};

const locationTypeLabels = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 motion-reduce:transition-none";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.14em] text-slate-500";

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

    async function loadExperience() {
      setIsLoading(true);

      try {
        const response = await fetchAdminExperience(accessToken, apiFilters, {
          signal: controller.signal,
        });

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
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Career
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Experience
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage professional roles, organizations, work timelines,
              publishing state and display priority.
            </p>
          </div>

          <Link
            to="/admin/experience/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Add Experience
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label htmlFor="experience-search" className={labelClassName}>
                Search
              </label>

              <input
                id="experience-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Organization, role or skill"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="experience-type-filter"
                className={labelClassName}
              >
                Employment type
              </label>

              <select
                id="experience-type-filter"
                name="employmentType"
                value={formFilters.employmentType}
                onChange={handleFilterChange}
                className={inputClassName}
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
                className={labelClassName}
              >
                Visibility
              </label>

              <select
                id="experience-visibility-filter"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All records</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="experience-featured-filter"
                className={labelClassName}
              >
                Display type
              </label>

              <select
                id="experience-featured-filter"
                name="featured"
                value={formFilters.featured}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All records</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="experience-status-filter"
                className={labelClassName}
              >
                Work status
              </label>

              <select
                id="experience-status-filter"
                name="workStatus"
                value={formFilters.workStatus}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All statuses</option>
                <option value="current">Current positions</option>
                <option value="completed">Completed positions</option>
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
                ? "Loading Experience..."
                : `${resultCount} Experience record${resultCount === 1 ? "" : "s"}`}
            </p>

            {!isLoading && (
              <p className="mt-1 text-xs text-slate-500">
                Showing the records matching the applied filters.
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
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <span className="sr-only">Loading Experience records...</span>

            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-[31rem] animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && experienceRecords.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-base font-bold text-slate-950">
              No Experience records found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Change the filters or create the first Experience record.
            </p>
          </div>
        )}

        {!isLoading && experienceRecords.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {experienceRecords.map((experience) => {
              const employmentTypeLabel =
                employmentTypeLabels[experience.employmentType] ||
                experience.employmentType ||
                "Other";

              const employmentTypeStyle =
                employmentTypeStyles[experience.employmentType] ||
                employmentTypeStyles.other;

              const isActionPending = actionExperienceId === experience._id;

              const timelineEnd = experience.isCurrent
                ? "Present"
                : formatDate(experience.endDate);

              return (
                <article
                  key={experience._id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-950 text-sm font-bold text-white">
                        <span>
                          {createInitials(experience.organizationName)}
                        </span>

                        {experience.organizationLogoUrl && (
                          <img
                            src={experience.organizationLogoUrl}
                            alt=""
                            className="absolute inset-0 size-full bg-white object-contain p-1.5"
                            onError={(event) => {
                              event.currentTarget.hidden = true;
                            }}
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-brand-700">
                          {experience.organizationName}
                        </p>

                        <h2 className="mt-1 break-words text-lg font-bold text-slate-950">
                          {experience.jobTitle}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(experience.startDate)} — {timelineEnd}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {experience.isFeatured && (
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          Featured
                        </span>
                      )}

                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          experience.isVisible
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {experience.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${employmentTypeStyle}`}
                    >
                      {employmentTypeLabel}
                    </span>

                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      Order {experience.order ?? 0}
                    </span>

                    {experience.isCurrent && (
                      <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">
                        Current Position
                      </span>
                    )}
                  </div>

                  {(experience.location || experience.locationType) && (
                    <dl className="mt-5 divide-y divide-slate-100 border-y border-slate-100 text-sm">
                      {experience.location && (
                        <div className="flex items-start justify-between gap-4 py-3">
                          <dt className="text-slate-500">Location</dt>

                          <dd className="max-w-[65%] break-words text-right font-semibold text-slate-800">
                            {experience.location}
                          </dd>
                        </div>
                      )}

                      {experience.locationType && (
                        <div className="flex items-start justify-between gap-4 py-3">
                          <dt className="text-slate-500">Work mode</dt>

                          <dd className="text-right font-semibold text-slate-800">
                            {locationTypeLabels[experience.locationType] ||
                              experience.locationType}
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}

                  {experience.shortDescription && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {experience.shortDescription}
                    </p>
                  )}

                  {Array.isArray(experience.skills) &&
                    experience.skills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
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
                      <dt className="text-slate-500">Updated</dt>

                      <dd className="text-right font-semibold text-slate-700">
                        {formatUpdatedDate(experience.updatedAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <Link
                      to={`/admin/experience/${experience._id}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(experience)}
                      disabled={actionExperienceId !== ""}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
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
                      disabled={actionExperienceId !== ""}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending
                        ? "Working..."
                        : experience.isFeatured
                          ? "Make Standard"
                          : "Make Featured"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteExperience(experience)}
                      disabled={
                        actionExperienceId !== "" || !canDeleteExperience
                      }
                      title={
                        canDeleteExperience
                          ? "Permanently delete Experience record"
                          : "Your role cannot permanently delete Experience records"
                      }
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending ? "Working..." : "Delete"}
                    </button>
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

export default AdminExperiencePage;