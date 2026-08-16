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
  school: "bg-blue-50 text-blue-700",
  college: "bg-violet-50 text-violet-700",
  university: "bg-indigo-50 text-indigo-700",
  course: "bg-cyan-50 text-cyan-700",
  training: "bg-orange-50 text-orange-700",
  certification: "bg-emerald-50 text-emerald-700",
  other: "bg-slate-100 text-slate-700",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 motion-reduce:transition-none";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.14em] text-slate-500";

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
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Career
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Education
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage qualifications, institutions, study timelines, publishing
              state and display priority.
            </p>
          </div>

          <Link
            to="/admin/education/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Add Education
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              <label
                htmlFor="education-type-filter"
                className={labelClassName}
              >
                Education type
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

            <div>
              <label
                htmlFor="education-visibility-filter"
                className={labelClassName}
              >
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
              <label
                htmlFor="education-featured-filter"
                className={labelClassName}
              >
                Display type
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
              <label
                htmlFor="education-status-filter"
                className={labelClassName}
              >
                Study status
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
                ? "Loading Education..."
                : `${resultCount} Education record${resultCount === 1 ? "" : "s"}`}
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
            <span className="sr-only">Loading Education records...</span>

            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-[30rem] animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && educationRecords.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-base font-bold text-slate-950">
              No Education records found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Change the filters or create the first Education record.
            </p>
          </div>
        )}

        {!isLoading && educationRecords.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {educationRecords.map((education) => {
              const educationTypeLabel =
                educationTypeLabels[education.educationType] ||
                education.educationType ||
                "Other";

              const educationTypeStyle =
                educationTypeStyles[education.educationType] ||
                educationTypeStyles.other;

              const isActionPending = actionEducationId === education._id;

              const timelineEnd = education.isCurrentlyStudying
                ? "Present"
                : formatDate(education.endDate);

              return (
                <article
                  key={education._id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-950 text-sm font-bold text-white">
                        <span>
                          {createInitials(education.institutionName)}
                        </span>

                        {education.logoUrl && (
                          <img
                            src={education.logoUrl}
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
                          {education.institutionName}
                        </p>

                        <h2 className="mt-1 break-words text-lg font-bold text-slate-950">
                          {education.degree}
                        </h2>

                        {education.fieldOfStudy && (
                          <p className="mt-1 break-words text-sm text-slate-500">
                            {education.fieldOfStudy}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {education.isFeatured && (
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          Featured
                        </span>
                      )}

                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          education.isVisible
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {education.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${educationTypeStyle}`}
                    >
                      {educationTypeLabel}
                    </span>

                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      Order {education.order ?? 0}
                    </span>

                    {education.isCurrentlyStudying && (
                      <span className="rounded-lg bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">
                        Currently Studying
                      </span>
                    )}
                  </div>

                  <dl className="mt-5 divide-y divide-slate-100 border-y border-slate-100 text-sm">
                    <div className="flex items-start justify-between gap-4 py-3">
                      <dt className="text-slate-500">Study timeline</dt>

                      <dd className="text-right font-semibold text-slate-800">
                        {formatDate(education.startDate)} — {timelineEnd}
                      </dd>
                    </div>

                    {education.grade && (
                      <div className="flex items-start justify-between gap-4 py-3">
                        <dt className="text-slate-500">Grade</dt>

                        <dd className="text-right font-semibold text-slate-800">
                          {education.grade}
                        </dd>
                      </div>
                    )}

                    {education.location && (
                      <div className="flex items-start justify-between gap-4 py-3">
                        <dt className="text-slate-500">Location</dt>

                        <dd className="max-w-[65%] break-words text-right font-semibold text-slate-800">
                          {education.location}
                        </dd>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4 py-3">
                      <dt className="text-slate-500">Updated</dt>

                      <dd className="text-right font-semibold text-slate-700">
                        {formatUpdatedDate(education.updatedAt)}
                      </dd>
                    </div>
                  </dl>

                  {education.shortDescription && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {education.shortDescription}
                    </p>
                  )}

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <Link
                      to={`/admin/education/${education._id}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(education)}
                      disabled={actionEducationId !== ""}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending
                        ? "Working..."
                        : education.isVisible
                          ? "Hide"
                          : "Show"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(education)}
                      disabled={actionEducationId !== ""}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending
                        ? "Working..."
                        : education.isFeatured
                          ? "Make Standard"
                          : "Make Featured"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEducation(education)}
                      disabled={
                        actionEducationId !== "" || !canDeleteEducation
                      }
                      title={
                        canDeleteEducation
                          ? "Permanently delete Education record"
                          : "Your role cannot permanently delete Education records"
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

export default AdminEducationPage;