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
              Testimonials Management
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Manage Testimonials
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Manage client reviews, star ratings, profile media, related
              Projects, display order, featured status and public visibility.
            </p>
          </div>

          <Link
            to="/admin/testimonials/new"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Add New Testimonial
          </Link>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label
                htmlFor="testimonial-search"
                className="text-sm font-semibold text-slate-700"
              >
                Search
              </label>

              <input
                id="testimonial-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Client, company or review"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="testimonial-rating-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Rating
              </label>

              <select
                id="testimonial-rating-filter"
                name="rating"
                value={formFilters.rating}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
                className="text-sm font-semibold text-slate-700"
              >
                Visibility
              </label>

              <select
                id="testimonial-visibility-filter"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="all">All visibility</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="testimonial-featured-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Featured
              </label>

              <select
                id="testimonial-featured-filter"
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
                htmlFor="testimonial-project-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Related Project
              </label>

              <select
                id="testimonial-project-filter"
                name="relatedProject"
                value={formFilters.relatedProject}
                onChange={handleFilterChange}
                disabled={Boolean(projectOptionsError)}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100"
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

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isLoading || Boolean(actionTestimonialId)}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply Filters
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              disabled={isLoading || Boolean(actionTestimonialId)}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear Filters
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || Boolean(actionTestimonialId)}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {projectOptionsError && (
            <p className="mt-4 text-sm font-medium text-amber-700">
              Related Project filter unavailable: {projectOptionsError}
            </p>
          )}
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600">
            {isLoading
              ? "Loading Testimonials..."
              : `${resultCount} Testimonial${resultCount === 1 ? "" : "s"} found`}
          </p>
        </div>

        {successMessage && (
          <div
            role="status"
            className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700"
          >
            {successMessage}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 grid min-h-64 place-items-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto size-11 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
              <p className="mt-4 text-sm font-semibold text-slate-600">
                Loading Testimonials...
              </p>
            </div>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl text-brand-600">
              ★
            </div>

            <h2 className="mt-5 text-2xl font-bold text-slate-950">
              No Testimonials found
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
              Create your first Testimonial or clear the current filters.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {testimonials.map((testimonial) => {
              const isActionPending =
                actionTestimonialId === testimonial._id;

              return (
                <article
                  key={testimonial._id}
                  className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex items-start gap-4 border-b border-slate-100 p-6">
                    <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-100 font-black text-brand-700">
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
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-lg font-bold text-slate-950">
                          {testimonial.clientName}
                        </h2>

                        {testimonial.isFeatured && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                            Featured
                          </span>
                        )}
                      </div>

                      {(testimonial.clientRole || testimonial.companyName) && (
                        <p className="mt-1 break-words text-sm text-slate-500">
                          {[testimonial.clientRole, testimonial.companyName]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}

                      <p
                        className="mt-2 text-sm tracking-[0.08em] text-amber-500"
                        aria-label={`${testimonial.rating} out of 5 stars`}
                      >
                        {"★".repeat(testimonial.rating)}
                        <span className="text-slate-200">
                          {"★".repeat(5 - testimonial.rating)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <p className="line-clamp-5 break-words leading-7 text-slate-600">
                      “{testimonial.reviewText}”
                    </p>

                    <dl className="mt-6 grid gap-3 text-sm">
                      <div className="flex items-start justify-between gap-4">
                        <dt className="font-semibold text-slate-500">
                          Visibility
                        </dt>
                        <dd
                          className={
                            testimonial.isVisible
                              ? "font-semibold text-emerald-700"
                              : "font-semibold text-slate-500"
                          }
                        >
                          {testimonial.isVisible ? "Visible" : "Hidden"}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <dt className="font-semibold text-slate-500">
                          Related Project
                        </dt>
                        <dd className="max-w-[65%] break-words text-right font-semibold text-slate-700">
                          {getRelatedProjectLabel(
                            testimonial.relatedProject,
                          )}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <dt className="font-semibold text-slate-500">
                          Order
                        </dt>
                        <dd className="font-semibold text-slate-700">
                          {testimonial.order ?? 0}
                        </dd>
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <dt className="font-semibold text-slate-500">
                          Updated
                        </dt>
                        <dd className="font-semibold text-slate-700">
                          {formatUpdatedDate(testimonial.updatedAt)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                      <Link
                        to={`/admin/testimonials/${testimonial._id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleVisibility(testimonial)
                        }
                        disabled={
                          isLoading || Boolean(actionTestimonialId)
                        }
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActionPending
                          ? "Working..."
                          : testimonial.isVisible
                            ? "Hide"
                            : "Show"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleFeatured(testimonial)
                        }
                        disabled={
                          isLoading || Boolean(actionTestimonialId)
                        }
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isActionPending
                          ? "Working..."
                          : testimonial.isFeatured
                            ? "Unfeature"
                            : "Feature"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteTestimonial(testimonial)
                        }
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

export default AdminTestimonialsPage;
