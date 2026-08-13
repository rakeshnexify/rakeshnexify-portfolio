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
  school: "bg-blue-100 text-blue-700",
  college: "bg-violet-100 text-violet-700",
  university: "bg-indigo-100 text-indigo-700",
  course: "bg-cyan-100 text-cyan-700",
  training: "bg-orange-100 text-orange-700",
  certification: "bg-emerald-100 text-emerald-700",
  other: "bg-slate-100 text-slate-700",
};

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

    async function loadEducation() {
      setIsLoading(true);

      try {
        const response = await fetchAdminEducation(
          accessToken,
          apiFilters,
          {
            signal: controller.signal,
          },
        );

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

      const response = await updateAdminEducation(
        accessToken,
        education._id,
        {
          isVisible: !education.isVisible,
        },
      );

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

      const response = await updateAdminEducation(
        accessToken,
        education._id,
        {
          isFeatured: !education.isFeatured,
        },
      );

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

      const response = await deleteAdminEducation(
        accessToken,
        education._id,
      );

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
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
              Education Management
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Manage Education
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Create and manage institutions, qualifications, study timelines,
              grades, supporting links, display order and publishing controls.
            </p>
          </div>

          <Link
            to="/admin/education/new"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Add New Education
          </Link>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label
                htmlFor="education-search"
                className="text-sm font-semibold text-slate-700"
              >
                Search
              </label>

              <input
                id="education-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Institution, degree or field"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="education-type-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Education Type
              </label>

              <select
                id="education-type-filter"
                name="educationType"
                value={formFilters.educationType}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
                className="text-sm font-semibold text-slate-700"
              >
                Visibility
              </label>

              <select
                id="education-visibility-filter"
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
                htmlFor="education-featured-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Display Type
              </label>

              <select
                id="education-featured-filter"
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
                htmlFor="education-status-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Study Status
              </label>

              <select
                id="education-status-filter"
                name="studyStatus"
                value={formFilters.studyStatus}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="all">All statuses</option>
                <option value="current">Currently studying</option>
                <option value="completed">Completed</option>
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
              ? "Loading Education..."
              : `${resultCount} Education record(s) found`}
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
            aria-label="Loading Education records"
          >
            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-[34rem] animate-pulse rounded-3xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && educationRecords.length === 0 && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-950">
              No Education records found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Create the first Education record or change the current filters.
            </p>
          </div>
        )}

        {!isLoading && educationRecords.length > 0 && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {educationRecords.map((education) => {
              const educationTypeLabel =
                educationTypeLabels[education.educationType] ||
                education.educationType ||
                "Other";

              const educationTypeStyle =
                educationTypeStyles[education.educationType] ||
                educationTypeStyles.other;

              const isActionPending =
                actionEducationId === education._id;

              const timelineEnd = education.isCurrentlyStudying
                ? "Present"
                : formatDate(education.endDate);

              return (
                <article
                  key={education._id}
                  className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative overflow-hidden bg-slate-950 px-6 py-7 text-white">
                    <div className="absolute -right-10 -top-10 size-32 rounded-full bg-brand-600/20 blur-3xl" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-lg font-black">
                        <span>{createInitials(education.institutionName)}</span>

                        {education.logoUrl && (
                          <img
                            src={education.logoUrl}
                            alt=""
                            className="absolute inset-0 size-full bg-white object-contain p-2"
                            onError={(event) => {
                              event.currentTarget.hidden = true;
                            }}
                          />
                        )}
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        {education.isFeatured && (
                          <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-950">
                            Featured
                          </span>
                        )}

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            education.isVisible
                              ? "bg-emerald-400/20 text-emerald-200"
                              : "bg-white/10 text-slate-300"
                          }`}
                        >
                          {education.isVisible ? "Visible" : "Hidden"}
                        </span>
                      </div>
                    </div>

                    <p className="relative mt-6 break-words text-sm font-semibold text-brand-300">
                      {education.institutionName}
                    </p>

                    <h2 className="relative mt-2 break-words text-xl font-black">
                      {education.degree}
                    </h2>

                    <p className="relative mt-2 break-words text-sm text-slate-400">
                      {education.fieldOfStudy}
                    </p>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${educationTypeStyle}`}
                      >
                        {educationTypeLabel}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        Order {education.order ?? 0}
                      </span>

                      {education.isCurrentlyStudying && (
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">
                          Currently Studying
                        </span>
                      )}
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                        Study Timeline
                      </p>

                      <p className="mt-2 font-bold text-slate-800">
                        {formatDate(education.startDate)} — {timelineEnd}
                      </p>

                      {education.grade && (
                        <p className="mt-2 text-sm font-semibold text-brand-700">
                          {education.grade}
                        </p>
                      )}

                      {education.location && (
                        <p className="mt-2 text-sm text-slate-500">
                          {education.location}
                        </p>
                      )}
                    </div>

                    <p className="mt-5 line-clamp-4 text-sm leading-7 text-slate-600">
                      {education.shortDescription}
                    </p>

                    <dl className="mt-5 border-t border-slate-100 pt-4 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-400">Updated</dt>

                        <dd className="font-semibold text-slate-700">
                          {formatUpdatedDate(education.updatedAt)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                      <Link
                        to={`/admin/education/${education._id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(education)}
                        disabled={Boolean(actionEducationId)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                        disabled={Boolean(actionEducationId)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActionPending
                          ? "Working..."
                          : education.isFeatured
                            ? "Unfeature"
                            : "Feature"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEducation(education)}
                        disabled={
                          Boolean(actionEducationId) ||
                          !canDeleteEducation
                        }
                        title={
                          canDeleteEducation
                            ? "Permanently delete Education record"
                            : "Your role cannot permanently delete Education records"
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

export default AdminEducationPage;
