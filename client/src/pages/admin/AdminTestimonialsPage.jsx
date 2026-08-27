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
    <main className="admin-testimonials-compact-page min-h-screen">
      <section className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="admin-testimonials-eyebrow text-[10px] font-bold uppercase tracking-[0.16em]">
              Social Proof
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Testimonials
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-5">
              Manage client reviews, ratings, visibility and featured priority.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="admin-testimonials-count-pill rounded-lg px-3 py-2 text-[11px] font-semibold">
              {isLoading
                ? "Loading..."
                : `${resultCount} Testimonial${resultCount === 1 ? "" : "s"}`}
            </span>

            <Link
              className="admin-testimonials-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
              to="/admin/testimonials/new"
            >
              Add Testimonial
            </Link>
          </div>
        </header>

        <form
          className="admin-testimonials-toolbar mt-4 rounded-xl p-3"
          onSubmit={handleFilterSubmit}
        >
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(250px,1.5fr)_150px_150px_auto]">
            <div>
              <label className="sr-only" htmlFor="testimonial-search">
                Search Testimonials
              </label>

              <input
                className={`${inputClassName} admin-testimonials-input !mt-0 !min-h-10 !rounded-lg`}
                id="testimonial-search"
                name="search"
                onChange={handleFilterChange}
                placeholder="Search client, company or review..."
                type="search"
                value={formFilters.search}
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="testimonial-rating-filter">
                Rating
              </label>

              <select
                className={`${inputClassName} admin-testimonials-input !mt-0 !min-h-10 !rounded-lg`}
                id="testimonial-rating-filter"
                name="rating"
                onChange={handleFilterChange}
                value={formFilters.rating}
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
              <label className="sr-only" htmlFor="testimonial-visibility-filter">
                Visibility
              </label>

              <select
                className={`${inputClassName} admin-testimonials-input !mt-0 !min-h-10 !rounded-lg`}
                id="testimonial-visibility-filter"
                name="visibility"
                onChange={handleFilterChange}
                value={formFilters.visibility}
              >
                <option value="all">All visibility</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                className="admin-testimonials-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
                disabled={isLoading || Boolean(actionTestimonialId)}
                type="submit"
              >
                Apply
              </button>

              <button
                aria-label="Clear Testimonial filters"
                className="admin-testimonials-secondary-button inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold"
                disabled={isLoading || Boolean(actionTestimonialId)}
                onClick={handleClearFilters}
                title="Clear filters"
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          <details className="admin-testimonials-more mt-2 rounded-lg">
            <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold">
              More Filters
            </summary>

            <div className="grid gap-3 border-t px-3 py-3 md:grid-cols-2">
              <div>
                <label
                  className={`${labelClassName} !text-[10px]`}
                  htmlFor="testimonial-featured-filter"
                >
                  Featured
                </label>

                <select
                  className={`${inputClassName} admin-testimonials-input !mt-1.5 !min-h-10 !rounded-lg`}
                  id="testimonial-featured-filter"
                  name="featured"
                  onChange={handleFilterChange}
                  value={formFilters.featured}
                >
                  <option value="all">All records</option>
                  <option value="featured">Featured</option>
                  <option value="standard">Standard</option>
                </select>
              </div>

              <div>
                <label
                  className={`${labelClassName} !text-[10px]`}
                  htmlFor="testimonial-project-filter"
                >
                  Related Project
                </label>

                <select
                  className={`${inputClassName} admin-testimonials-input !mt-1.5 !min-h-10 !rounded-lg`}
                  disabled={Boolean(projectOptionsError)}
                  id="testimonial-project-filter"
                  name="relatedProject"
                  onChange={handleFilterChange}
                  value={formFilters.relatedProject}
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
          </details>

          {projectOptionsError ? (
            <div
              className="admin-testimonials-warning mt-2 rounded-lg px-3 py-2 text-[11px] font-semibold"
              role="status"
            >
              Related Project filter unavailable: {projectOptionsError}
            </div>
          ) : null}
        </form>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold">
            {isLoading
              ? "Loading Testimonials..."
              : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
          </p>

          <button
            className="admin-testimonials-secondary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[11px] font-semibold"
            disabled={isLoading || Boolean(actionTestimonialId)}
            onClick={handleRefresh}
            type="button"
          >
            Refresh
          </button>
        </div>

        <div aria-live="polite">
          {successMessage ? (
            <div
              className="admin-testimonials-success mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
              role="status"
            >
              {successMessage}
            </div>
          ) : null}

          {error ? (
            <div
              className="admin-testimonials-error mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
              role="alert"
            >
              {error}
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div
            aria-live="polite"
            className="mt-3 space-y-2"
            role="status"
          >
            <span className="sr-only">Loading Testimonials...</span>

            {[1, 2, 3, 4, 5].map((placeholder) => (
              <div
                className="admin-testimonials-skeleton h-[94px] rounded-xl motion-reduce:animate-none"
                key={placeholder}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && testimonials.length === 0 ? (
          <div className="admin-testimonials-empty mt-3 rounded-xl px-5 py-9 text-center">
            <h2 className="text-base font-bold">No Testimonials found</h2>

            <p className="mt-1 text-xs">
              Change the filters or create the first Testimonial.
            </p>
          </div>
        ) : null}

        {!isLoading && testimonials.length > 0 ? (
          <div className="mt-3 space-y-2">
            {testimonials.map((testimonial) => {
              const isActionPending =
                actionTestimonialId === testimonial._id;

              return (
                <article
                  className="admin-testimonials-row min-w-0 rounded-xl"
                  key={testimonial._id}
                >
                  <div className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)] gap-3 p-3 md:grid-cols-[44px_minmax(0,1fr)_auto] md:items-center">
                    <div className="admin-testimonials-avatar relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl text-[11px] font-bold">
                      <span>{createInitials(testimonial.clientName)}</span>

                      {testimonial.profileImageUrl ? (
                        <img
                          alt={
                            testimonial.profileImageAlt ||
                            `${testimonial.clientName} profile`
                          }
                          className="absolute inset-0 size-full object-cover"
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                          }}
                          src={testimonial.profileImageUrl}
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <h2 className="mr-1 truncate text-sm font-bold">
                          {testimonial.clientName}
                        </h2>

                        <span
                          className={`admin-testimonials-badge rounded-md px-2 py-1 text-[9px] font-bold ${
                            testimonial.isVisible ? "is-visible" : "is-hidden"
                          }`}
                        >
                          {testimonial.isVisible ? "Visible" : "Hidden"}
                        </span>

                        {testimonial.isFeatured ? (
                          <span className="admin-testimonials-badge is-featured rounded-md px-2 py-1 text-[9px] font-bold">
                            Featured
                          </span>
                        ) : null}
                      </div>

                      {(testimonial.clientRole || testimonial.companyName) ? (
                        <p className="mt-0.5 truncate text-[10px]">
                          {[testimonial.clientRole, testimonial.companyName]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      ) : null}

                      <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
                        <span
                          aria-label={`${testimonial.rating} out of 5 stars`}
                          className="admin-testimonials-rating tracking-[0.08em]"
                        >
                          {"★".repeat(testimonial.rating)}
                          <span aria-hidden="true">
                            {"★".repeat(5 - testimonial.rating)}
                          </span>
                        </span>

                        <span className="max-w-56 truncate">
                          {getRelatedProjectLabel(testimonial.relatedProject)}
                        </span>

                        <span>Order {testimonial.order ?? 0}</span>

                        <span>
                          Updated {formatUpdatedDate(testimonial.updatedAt)}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-1 text-[10px] leading-4">
                        “{testimonial.reviewText}”
                      </p>
                    </div>

                    <div className="col-span-2 flex shrink-0 items-center justify-end gap-2 md:col-span-1">
                      <Link
                        className="admin-testimonials-primary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[10px] font-bold"
                        to={`/admin/testimonials/${testimonial._id}/edit`}
                      >
                        Edit
                      </Link>

                      <details className="admin-testimonials-actions relative">
                        <summary
                          aria-label={`More actions for ${testimonial.clientName}`}
                          className="admin-testimonials-secondary-button inline-flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-base font-bold"
                          title="More actions"
                        >
                          …
                        </summary>

                        <div className="admin-testimonials-action-menu absolute right-0 top-[calc(100%+0.4rem)] z-30 w-44 rounded-xl p-1.5">
                          <button
                            className="admin-testimonials-menu-action"
                            disabled={isLoading || Boolean(actionTestimonialId)}
                            onClick={() => handleToggleVisibility(testimonial)}
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : testimonial.isVisible
                                ? "Hide from public"
                                : "Show on public"}
                          </button>

                          <button
                            className="admin-testimonials-menu-action"
                            disabled={isLoading || Boolean(actionTestimonialId)}
                            onClick={() => handleToggleFeatured(testimonial)}
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : testimonial.isFeatured
                                ? "Make standard"
                                : "Make featured"}
                          </button>

                          <div className="admin-testimonials-menu-divider my-1" />

                          <button
                            className="admin-testimonials-menu-action is-danger"
                            disabled={
                              isLoading ||
                              Boolean(actionTestimonialId) ||
                              !canDeleteTestimonials
                            }
                            onClick={() => handleDeleteTestimonial(testimonial)}
                            title={
                              canDeleteTestimonials
                                ? "Permanently delete Testimonial"
                                : "Your role cannot permanently delete Testimonials"
                            }
                            type="button"
                          >
                            {isActionPending ? "Working..." : "Delete"}
                          </button>
                        </div>
                      </details>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default AdminTestimonialsPage;