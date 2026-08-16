import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import { fetchAdminProjects } from "../../services/adminProjectsApi";
import {
  deleteAdminTestimonial,
  fetchAdminTestimonials,
  updateAdminTestimonial,
} from "../../services/adminTestimonialsApi";

const initialFilters = {
  search: "",
  rating: "",
  visibility: "all",
  featured: "all",
  relatedProject: "",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.14em] text-slate-500";

function createApiFilters(filters) {
  const apiFilters = {
    search: filters.search.trim(),
  };

  if (/^[1-5]$/.test(filters.rating)) {
    apiFilters.rating = filters.rating;
  }

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

  if (filters.relatedProject) {
    apiFilters.relatedProject = filters.relatedProject;
  }

  return apiFilters;
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

  return initials || "CL";
}

function getProjectLabel(project) {
  return (
    project?.title ||
    project?.name ||
    project?.slug ||
    project?._id ||
    "Untitled Project"
  );
}

function getRelatedProjectLabel(relatedProject) {
  if (!relatedProject) {
    return "No related Project";
  }

  if (typeof relatedProject === "string") {
    return relatedProject;
  }

  return getProjectLabel(relatedProject);
}

function AdminTestimonialsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, admin, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({ ...initialFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...initialFilters });
  const [testimonials, setTestimonials] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [projectOptions, setProjectOptions] = useState([]);
  const [projectOptionsError, setProjectOptionsError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionTestimonialId, setActionTestimonialId] = useState("");
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

    async function loadProjects() {
      try {
        const response = await fetchAdminProjects(
          accessToken,
          {},
          {
            signal: controller.signal,
          },
        );

        setProjectOptions(response.projects);
        setProjectOptionsError("");
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
                pathname: "/admin/testimonials",
              },
            },
          });

          return;
        }

        console.error(
          "Admin Testimonial Project options loading failed:",
          requestError,
        );

        setProjectOptions([]);

        setProjectOptionsError(
          requestError instanceof Error
            ? requestError.message
            : "Related Project options could not be loaded.",
        );
      }
    }

    loadProjects();

    return () => {
      controller.abort();
    };
  }, [accessToken, logout, navigate]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadTestimonials() {
      setIsLoading(true);

      try {
        const response = await fetchAdminTestimonials(
          accessToken,
          apiFilters,
          {
            signal: controller.signal,
          },
        );

        setTestimonials(response.testimonials);
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
                pathname: "/admin/testimonials",
              },
            },
          });

          return;
        }

        console.error("Admin Testimonials loading failed:", requestError);

        setTestimonials([]);
        setResultCount(0);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Testimonials could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadTestimonials();

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

    if (isLoading || actionTestimonialId) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setAppliedFilters({ ...formFilters });
  }

  function handleClearFilters() {
    if (isLoading || actionTestimonialId) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setFormFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
  }

  function handleRefresh() {
    if (isLoading || actionTestimonialId) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setRefreshKey((currentKey) => currentKey + 1);
  }

  function handleTestimonialActionError(requestError) {
    if (requestError?.status === 401) {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: {
            pathname: "/admin/testimonials",
          },
        },
      });

      return;
    }

    if (requestError?.status === 403) {
      setError(
        requestError.message ||
          "Your Admin role cannot perform this Testimonial action.",
      );

      return;
    }

    console.error("Admin Testimonial action failed:", requestError);

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Testimonial action could not be completed.",
    );
  }

  async function handleToggleVisibility(testimonial) {
    if (!testimonial?._id || actionTestimonialId || isLoading) {
      return;
    }

    try {
      setActionTestimonialId(testimonial._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminTestimonial(
        accessToken,
        testimonial._id,
        {
          isVisible: !testimonial.isVisible,
        },
      );

      setSuccessMessage(
        response.testimonial.isVisible
          ? `"${response.testimonial.clientName}" is now visible on the portfolio.`
          : `"${response.testimonial.clientName}" is now hidden from the portfolio.`,
      );

      setIsLoading(true);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleTestimonialActionError(requestError);
    } finally {
      setActionTestimonialId("");
    }
  }

  async function handleToggleFeatured(testimonial) {
    if (!testimonial?._id || actionTestimonialId || isLoading) {
      return;
    }

    try {
      setActionTestimonialId(testimonial._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminTestimonial(
        accessToken,
        testimonial._id,
        {
          isFeatured: !testimonial.isFeatured,
        },
      );

      setSuccessMessage(
        response.testimonial.isFeatured
          ? `"${response.testimonial.clientName}" is now featured.`
          : `"${response.testimonial.clientName}" is now a standard Testimonial.`,
      );

      setIsLoading(true);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleTestimonialActionError(requestError);
    } finally {
      setActionTestimonialId("");
    }
  }

  async function handleDeleteTestimonial(testimonial) {
    if (!testimonial?._id || actionTestimonialId || isLoading) {
      return;
    }

    const isConfirmed = window.confirm(
      `Permanently delete the Testimonial from "${testimonial.clientName}"?\n\nThis action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setActionTestimonialId(testimonial._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminTestimonial(
        accessToken,
        testimonial._id,
      );

      setSuccessMessage(
        `"${response.deletedTestimonial.clientName}" Testimonial was permanently deleted.`,
      );

      setIsLoading(true);
      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleTestimonialActionError(requestError);
    } finally {
      setActionTestimonialId("");
    }
  }

  const canDeleteTestimonials = ["super-admin", "admin"].includes(admin?.role);

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Social Proof
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Testimonials
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage client reviews, ratings, profile media, related Projects,
              publication state and display priority.
            </p>
          </div>

          <Link
            to="/admin/testimonials/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Add Testimonial
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label htmlFor="testimonial-search" className={labelClassName}>
                Search
              </label>

              <input
                id="testimonial-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Client, company or review"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="testimonial-rating-filter"
                className={labelClassName}
              >
                Rating
              </label>

              <select
                id="testimonial-rating-filter"
                name="rating"
                value={formFilters.rating}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="">All ratings</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="testimonial-visibility-filter"
                className={labelClassName}
              >
                Visibility
              </label>

              <select
                id="testimonial-visibility-filter"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All visibility</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="testimonial-featured-filter"
                className={labelClassName}
              >
                Display type
              </label>

              <select
                id="testimonial-featured-filter"
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
                htmlFor="testimonial-project-filter"
                className={labelClassName}
              >
                Related Project
              </label>

              <select
                id="testimonial-project-filter"
                name="relatedProject"
                value={formFilters.relatedProject}
                onChange={handleFilterChange}
                disabled={Boolean(projectOptionsError)}
                className={inputClassName}
              >
                <option value="">All Projects</option>

                {projectOptions.map((project) => (
                  <option key={project._id} value={project._id}>
                    {getProjectLabel(project)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={isLoading || Boolean(actionTestimonialId)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              Clear
            </button>

            <button
              type="submit"
              disabled={isLoading || Boolean(actionTestimonialId)}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            >
              Apply Filters
            </button>
          </div>

          {projectOptionsError && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
            >
              Related Project filter unavailable: {projectOptionsError}
            </div>
          )}
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {isLoading
                ? "Loading Testimonials..."
                : `${resultCount} Testimonial${resultCount === 1 ? "" : "s"}`}
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
            disabled={isLoading || Boolean(actionTestimonialId)}
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
            <span className="sr-only">Loading Testimonials...</span>

            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-[28rem] animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && testimonials.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-brand-50 text-xl text-brand-600">
              ★
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-950">
              No Testimonials found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Change the filters or create the first Testimonial.
            </p>
          </div>
        )}

        {!isLoading && testimonials.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {testimonials.map((testimonial) => {
              const isActionPending =
                actionTestimonialId === testimonial._id;

              return (
                <article
                  key={testimonial._id}
                  className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-100 text-sm font-bold text-brand-700">
                        <span>{createInitials(testimonial.clientName)}</span>

                        {testimonial.profileImageUrl && (
                          <img
                            src={testimonial.profileImageUrl}
                            alt={
                              testimonial.profileImageAlt ||
                              `${testimonial.clientName} profile`
                            }
                            className="absolute inset-0 size-full object-cover"
                            onError={(event) => {
                              event.currentTarget.hidden = true;
                            }}
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-bold text-slate-950">
                          {testimonial.clientName}
                        </h2>

                        {(testimonial.clientRole ||
                          testimonial.companyName) && (
                          <p className="mt-1 break-words text-sm text-slate-500">
                            {[
                              testimonial.clientRole,
                              testimonial.companyName,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {testimonial.isFeatured && (
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          Featured
                        </span>
                      )}

                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          testimonial.isVisible
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {testimonial.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>

                  <p
                    className="mt-4 text-sm tracking-[0.08em] text-amber-500"
                    aria-label={`${testimonial.rating} out of 5 stars`}
                  >
                    {"★".repeat(testimonial.rating)}
                    <span aria-hidden="true" className="text-slate-200">
                      {"★".repeat(5 - testimonial.rating)}
                    </span>
                  </p>

                  <p className="mt-4 line-clamp-5 break-words text-sm leading-6 text-slate-600">
                    “{testimonial.reviewText}”
                  </p>

                  <dl className="mt-5 divide-y divide-slate-100 border-y border-slate-100 text-sm">
                    <div className="flex items-start justify-between gap-4 py-3">
                      <dt className="text-slate-500">Related Project</dt>

                      <dd className="max-w-[65%] break-words text-right font-semibold text-slate-800">
                        {getRelatedProjectLabel(testimonial.relatedProject)}
                      </dd>
                    </div>

                    <div className="flex items-start justify-between gap-4 py-3">
                      <dt className="text-slate-500">Display order</dt>

                      <dd className="font-semibold text-slate-800">
                        {testimonial.order ?? 0}
                      </dd>
                    </div>

                    <div className="flex items-start justify-between gap-4 py-3">
                      <dt className="text-slate-500">Updated</dt>

                      <dd className="font-semibold text-slate-700">
                        {formatUpdatedDate(testimonial.updatedAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <Link
                      to={`/admin/testimonials/${testimonial._id}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(testimonial)}
                      disabled={isLoading || Boolean(actionTestimonialId)}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending
                        ? "Working..."
                        : testimonial.isVisible
                          ? "Hide"
                          : "Show"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(testimonial)}
                      disabled={isLoading || Boolean(actionTestimonialId)}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending
                        ? "Working..."
                        : testimonial.isFeatured
                          ? "Make Standard"
                          : "Make Featured"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTestimonial(testimonial)}
                      disabled={
                        isLoading ||
                        Boolean(actionTestimonialId) ||
                        !canDeleteTestimonials
                      }
                      title={
                        canDeleteTestimonials
                          ? "Permanently delete Testimonial"
                          : "Your role cannot permanently delete Testimonials"
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

export default AdminTestimonialsPage;