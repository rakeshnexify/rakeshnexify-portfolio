import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  deleteAdminEducation,
  fetchAdminEducation,
  updateAdminEducation,
} from "../../services/adminEducationApi";

const initialFilters = {
  search: "",
  educationType: "",
  visibility: "all",
  featured: "all",
  studyStatus: "all",
};

const educationTypeLabels = {
  school: "School",
  college: "College",
  university: "University",
  course: "Course",
  training: "Training",
  certification: "Certification",
  other: "Other",
};

const educationTypeStyles = {
  school: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  college: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  university: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
  course: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
  training: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  certification: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  other: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const inputClassName =
  "mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 sm:min-h-10 sm:px-3 sm:text-sm";

const labelClassName =
  "text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 sm:text-[11px]";

function createApiFilters(filters) {
  const apiFilters = {
    search: filters.search.trim(),
    educationType: filters.educationType,
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

  if (filters.studyStatus === "current") {
    apiFilters.isCurrentlyStudying = true;
  }

  if (filters.studyStatus === "completed") {
    apiFilters.isCurrentlyStudying = false;
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

  return initials || "ED";
}

function AdminEducationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, admin, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({ ...initialFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...initialFilters });
  const [educationRecords, setEducationRecords] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionEducationId, setActionEducationId] = useState("");
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

    async function loadEducation() {
      setIsLoading(true);

      try {
        const response = await fetchAdminEducation(accessToken, apiFilters, {
          signal: controller.signal,
        });

        setEducationRecords(response.educationRecords);
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
                pathname: "/admin/education",
              },
            },
          });

          return;
        }

        console.error("Admin Education loading failed:", requestError);

        setEducationRecords([]);
        setResultCount(0);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Education records could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadEducation();

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

  function handleEducationActionError(requestError) {
    if (requestError?.status === 401) {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: {
            pathname: "/admin/education",
          },
        },
      });

      return;
    }

    if (requestError?.status === 403) {
      setError(
        requestError.message ||
          "Your Admin role cannot perform this Education action.",
      );

      return;
    }

    console.error("Admin Education action failed:", requestError);

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Education action could not be completed.",
    );
  }

  function updateEducationCollection(updatedEducation, filterField) {
    const shouldRemoveFromCurrentView =
      typeof apiFilters[filterField] === "boolean" &&
      updatedEducation[filterField] !== apiFilters[filterField];

    setEducationRecords((currentRecords) =>
      shouldRemoveFromCurrentView
        ? currentRecords.filter(
            (currentRecord) => currentRecord._id !== updatedEducation._id,
          )
        : currentRecords.map((currentRecord) =>
            currentRecord._id === updatedEducation._id
              ? updatedEducation
              : currentRecord,
          ),
    );

    if (shouldRemoveFromCurrentView) {
      setResultCount((currentCount) => Math.max(0, currentCount - 1));
    }
  }

  async function handleToggleVisibility(education) {
    if (!education?._id || actionEducationId) {
      return;
    }

    try {
      setActionEducationId(education._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminEducation(accessToken, education._id, {
        isVisible: !education.isVisible,
      });

      setSuccessMessage(
        response.education.isVisible
          ? `"${response.education.degree}" is now visible on the portfolio.`
          : `"${response.education.degree}" is now hidden from the portfolio.`,
      );

      updateEducationCollection(response.education, "isVisible");
    } catch (requestError) {
      handleEducationActionError(requestError);
    } finally {
      setActionEducationId("");
    }
  }

  async function handleToggleFeatured(education) {
    if (!education?._id || actionEducationId) {
      return;
    }

    try {
      setActionEducationId(education._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminEducation(accessToken, education._id, {
        isFeatured: !education.isFeatured,
      });

      setSuccessMessage(
        response.education.isFeatured
          ? `"${response.education.degree}" is now featured.`
          : `"${response.education.degree}" is now a standard Education record.`,
      );

      updateEducationCollection(response.education, "isFeatured");
    } catch (requestError) {
      handleEducationActionError(requestError);
    } finally {
      setActionEducationId("");
    }
  }

  async function handleDeleteEducation(education) {
    if (!education?._id || actionEducationId) {
      return;
    }

    const isConfirmed = window.confirm(
      `Permanently delete "${education.degree}" from "${education.institutionName}"?\n\nThis action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setActionEducationId(education._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminEducation(accessToken, education._id);

      setSuccessMessage(
        `"${response.deletedEducation.degree}" was permanently deleted.`,
      );

      setEducationRecords((currentRecords) =>
        currentRecords.filter(
          (currentRecord) => currentRecord._id !== education._id,
        ),
      );

      setResultCount((currentCount) => Math.max(0, currentCount - 1));
    } catch (requestError) {
      handleEducationActionError(requestError);
    } finally {
      setActionEducationId("");
    }
  }

  const canDeleteEducation = ["super-admin", "admin"].includes(admin?.role);

  return (
    <main className="rnx-admin-education-compact-v476 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3.5 sm:px-6 sm:py-4 lg:px-8">
        <header className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-600 dark:text-brand-300">
              Career
            </p>

            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[22px]">
              Education
            </h1>

            <p className="mt-0.5 max-w-2xl text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">
              Manage qualifications, timelines and public display.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              {isLoading ? "..." : resultCount} total
            </span>

            <Link
              to="/admin/education/new"
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-3.5 text-xs font-semibold text-white transition hover:bg-brand-700 sm:min-h-10 sm:px-4"
            >
              Add Education
            </Link>
          </div>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label htmlFor="education-search" className={labelClassName}>
                Search
              </label>

              <input
                id="education-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Institution, degree or field"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="education-type-filter" className={labelClassName}>
                Education Type
              </label>

              <select
                id="education-type-filter"
                name="educationType"
                value={formFilters.educationType}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="">All types</option>

                {Object.entries(educationTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <details className="group mt-2 rounded-lg border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/50">
            <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 px-2.5 text-[10px] font-semibold text-slate-600 marker:hidden dark:text-slate-300 sm:text-[11px]">
              <span>More Filters</span>

              <span
                aria-hidden="true"
                className="text-slate-400 transition group-open:rotate-180"
              >
                &#9662;
              </span>
            </summary>

            <div className="grid gap-2 border-t border-slate-200 p-2.5 dark:border-slate-800 sm:grid-cols-3">
              <div>
                <label htmlFor="education-visibility-filter" className={labelClassName}>
                  Visibility
                </label>

                <select
                  id="education-visibility-filter"
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
                <label htmlFor="education-featured-filter" className={labelClassName}>
                  Display Type
                </label>

                <select
                  id="education-featured-filter"
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
                <label htmlFor="education-status-filter" className={labelClassName}>
                  Study Status
                </label>

                <select
                  id="education-status-filter"
                  name="studyStatus"
                  value={formFilters.studyStatus}
                  onChange={handleFilterChange}
                  className={inputClassName}
                >
                  <option value="all">All statuses</option>
                  <option value="current">Currently studying</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </details>

          <div className="mt-2 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            >
              Clear
            </button>

            <button
              type="submit"
              className="inline-flex min-h-8 items-center justify-center rounded-lg bg-brand-600 px-3 text-[11px] font-semibold text-white transition hover:bg-brand-700"
            >
              Apply
            </button>
          </div>
        </form>

        <div className="mt-2.5 flex items-center justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 sm:text-xs">
            {isLoading
              ? "Loading Education..."
              : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            Refresh
          </button>
        </div>

        <div aria-live="polite">
          {successMessage && (
            <div
              role="status"
              className="mt-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              {successMessage}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              {error}
            </div>
          )}
        </div>

        {isLoading && (
          <div role="status" aria-live="polite" className="mt-2.5 space-y-1.5">
            <span className="sr-only">Loading Education records...</span>

            {[1, 2, 3, 4].map((placeholder) => (
              <div
                key={placeholder}
                className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && educationRecords.length === 0 && (
          <div className="mt-2.5 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-7 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-bold text-slate-950 dark:text-white">
              No Education records found
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Change the filters or create the first record.
            </p>
          </div>
        )}

        {!isLoading && educationRecords.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            {educationRecords.map((education) => {
              const educationTypeLabel =
                educationTypeLabels[education.educationType] ||
                education.educationType ||
                "Other";

              const educationTypeStyle =
                educationTypeStyles[education.educationType] ||
                educationTypeStyles.other;

              const isActionPending = actionEducationId === education._id;

              return (
                <article
                  key={education._id}
                  className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-[10px] font-bold text-white dark:border-slate-700 sm:size-10">
                      <span>{createInitials(education.institutionName)}</span>

                      {education.logoUrl && (
                        <img
                          src={education.logoUrl}
                          alt=""
                          className="absolute inset-0 size-full bg-white object-contain p-1"
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                          }}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1">
                            <h2 className="break-words text-[13px] font-bold text-slate-950 dark:text-white sm:text-sm">
                              {education.degree}
                            </h2>

                            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold sm:text-[10px] ${educationTypeStyle}`}>
                              {educationTypeLabel}
                            </span>

                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold sm:text-[10px] ${
                                education.isVisible
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {education.isVisible ? "Visible" : "Hidden"}
                            </span>

                            {education.isFeatured && (
                              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 sm:text-[10px]">
                                Featured
                              </span>
                            )}

                            {education.isCurrentlyStudying && (
                              <span className="rounded-md bg-cyan-50 px-1.5 py-0.5 text-[9px] font-bold text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300 sm:text-[10px]">
                                Current
                              </span>
                            )}

                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:text-[10px]">
                              #{education.order ?? 0}
                            </span>
                          </div>

                          <p className="mt-0.5 truncate text-[10px] font-semibold text-brand-700 dark:text-brand-300 sm:text-[11px]">
                            {education.institutionName}
                            {education.fieldOfStudy ? ` / ${education.fieldOfStudy}` : ""}
                          </p>

                          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[9px] text-slate-500 dark:text-slate-400 sm:text-[10px]">
                            <span>
                              {formatDate(education.startDate)} -{" "}
                              {education.isCurrentlyStudying
                                ? "Present"
                                : formatDate(education.endDate)}
                            </span>

                            {education.grade && (
                              <>
                                <span aria-hidden="true">/</span>
                                <span>{education.grade}</span>
                              </>
                            )}

                            {education.location && (
                              <>
                                <span aria-hidden="true">/</span>
                                <span>{education.location}</span>
                              </>
                            )}

                            <span aria-hidden="true">/</span>
                            <span>Updated {formatUpdatedDate(education.updatedAt)}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-end gap-1 self-end sm:self-start">
                          <Link
                            to={`/admin/education/${education._id}/edit`}
                            className="inline-flex min-h-8 items-center justify-center rounded-lg bg-brand-600 px-2.5 text-[10px] font-semibold text-white transition hover:bg-brand-700"
                          >
                            Edit
                          </Link>

                          <details className="group relative">
                            <summary
                              className="grid size-8 cursor-pointer list-none place-items-center rounded-lg border border-slate-300 bg-white text-base font-bold leading-none text-slate-600 marker:hidden transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                              aria-label={`More actions for ${education.degree}`}
                            >
                              <span aria-hidden="true">&#8942;</span>
                            </summary>

                            <div className="absolute right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-950">
                              <button
                                type="button"
                                onClick={() => handleToggleVisibility(education)}
                                disabled={actionEducationId !== ""}
                                className="flex min-h-8 w-full items-center rounded-md px-2.5 text-left text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {isActionPending
                                  ? "Working..."
                                  : education.isVisible
                                    ? "Hide from public"
                                    : "Show publicly"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleFeatured(education)}
                                disabled={actionEducationId !== ""}
                                className="flex min-h-8 w-full items-center rounded-md px-2.5 text-left text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {isActionPending
                                  ? "Working..."
                                  : education.isFeatured
                                    ? "Make standard"
                                    : "Make featured"}
                              </button>

                              {canDeleteEducation && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEducation(education)}
                                  disabled={actionEducationId !== ""}
                                  className="flex min-h-8 w-full items-center rounded-md px-2.5 text-left text-[11px] font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/50"
                                >
                                  {isActionPending ? "Working..." : "Delete"}
                                </button>
                              )}
                            </div>
                          </details>
                        </div>
                      </div>
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

export default AdminEducationPage;
