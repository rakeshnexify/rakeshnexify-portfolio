import { useEffect, useMemo, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  deleteAdminProject,
  fetchAdminProjects,
  updateAdminProject,
} from "../../services/adminProjectsApi";

const initialFilters = {
  search: "",
  category: "",
  projectType: "",
  status: "",
  visibility: "all",
  featured: "all",
  caseStudyPublished: "all",
  caseStudyFeatured: "all",
};

const statusLabels = {
  planning: "Planning",
  "in-progress": "In Development",
  completed: "Completed",
  maintained: "Active Project",
  archived: "Archived",
};

const projectTypeLabels = {
  personal: "Personal",
  client: "Client",
  company: "Company",
  "open-source": "Open Source",
  practice: "Practice",
};

function createApiFilters(filters) {
  const apiFilters = {
    search: filters.search.trim(),
    category: filters.category.trim(),
    projectType: filters.projectType,
    status: filters.status,
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

  if (filters.caseStudyPublished === "published") {
    apiFilters.caseStudyPublished = true;
  }

  if (filters.caseStudyPublished === "not-published") {
    apiFilters.caseStudyPublished = false;
  }

  if (filters.caseStudyFeatured === "featured") {
    apiFilters.caseStudyFeatured = true;
  }

  if (filters.caseStudyFeatured === "standard") {
    apiFilters.caseStudyFeatured = false;
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
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function AdminProjectsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { accessToken, admin, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({
    ...initialFilters,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    ...initialFilters,
  });

  const [projects, setProjects] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionProjectId, setActionProjectId] = useState("");

  const [successMessage, setSuccessMessage] = useState(
    () => location.state?.successMessage || "",
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
        const response = await fetchAdminProjects(accessToken, apiFilters, {
          signal: controller.signal,
        });

        setProjects(response.projects);
        setResultCount(response.count);
        setError("");
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
                pathname: "/admin/projects",
              },
            },
          });

          return;
        }

        console.error("Admin projects loading failed:", requestError);

        setProjects([]);
        setResultCount(0);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Projects could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProjects();

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

    setAppliedFilters({
      ...formFilters,
    });
  }

  function handleClearFilters() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    setFormFilters({
      ...initialFilters,
    });

    setAppliedFilters({
      ...initialFilters,
    });
  }

  function handleRefresh() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    setRefreshKey((currentKey) => currentKey + 1);
  }

  function handleProjectActionError(requestError) {
    if (requestError?.status === 401) {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: {
            pathname: "/admin/projects",
          },
        },
      });

      return;
    }

    console.error("Admin project action failed:", requestError);

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Project action could not be completed.",
    );
  }

  async function handleToggleVisibility(project) {
    if (!project?._id || actionProjectId) {
      return;
    }

    try {
      setActionProjectId(project._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminProject(accessToken, project._id, {
        isVisible: !project.isVisible,
      });

      setSuccessMessage(
        response.project.isVisible
          ? `"${response.project.title}" is now visible on the portfolio.`
          : `"${response.project.title}" is now hidden from the portfolio.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleProjectActionError(requestError);
    } finally {
      setActionProjectId("");
    }
  }

  async function handleToggleFeatured(project) {
    if (!project?._id || actionProjectId) {
      return;
    }

    try {
      setActionProjectId(project._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminProject(accessToken, project._id, {
        isFeatured: !project.isFeatured,
      });

      setSuccessMessage(
        response.project.isFeatured
          ? `"${response.project.title}" is now featured.`
          : `"${response.project.title}" is now a standard project.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleProjectActionError(requestError);
    } finally {
      setActionProjectId("");
    }
  }

  async function handleToggleCaseStudyPublication(project) {
    if (!project?._id || actionProjectId) {
      return;
    }

    const isPublished = Boolean(project.caseStudy?.isPublished);

    const caseStudyPayload = isPublished
      ? {
          isPublished: false,
          isFeatured: false,
        }
      : {
          isPublished: true,
        };

    try {
      setActionProjectId(project._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminProject(accessToken, project._id, {
        caseStudy: caseStudyPayload,
      });

      setSuccessMessage(
        response.project.caseStudy?.isPublished
          ? `"${response.project.title}" is now published as a Case Study.`
          : `"${response.project.title}" was removed from Case Studies.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleProjectActionError(requestError);
    } finally {
      setActionProjectId("");
    }
  }

  async function handleToggleCaseStudyFeatured(project) {
    if (!project?._id || actionProjectId || !project.caseStudy?.isPublished) {
      return;
    }

    try {
      setActionProjectId(project._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminProject(accessToken, project._id, {
        caseStudy: {
          isFeatured: !project.caseStudy?.isFeatured,
        },
      });

      setSuccessMessage(
        response.project.caseStudy?.isFeatured
          ? `"${response.project.title}" is now a featured Case Study.`
          : `"${response.project.title}" is now a standard Case Study.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleProjectActionError(requestError);
    } finally {
      setActionProjectId("");
    }
  }

  async function handleDeleteProject(project) {
    if (!project?._id || actionProjectId) {
      return;
    }

    const isConfirmed = window.confirm(
      `Permanently delete "${project.title}"?\n\nThis action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setActionProjectId(project._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminProject(accessToken, project._id);

      setSuccessMessage(
        `"${response.deletedProject.title}" was permanently deleted.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleProjectActionError(requestError);
    } finally {
      setActionProjectId("");
    }
  }

  const canDeleteProjects = ["super-admin", "admin"].includes(admin?.role);

  return (
    <main className="admin-projects-page min-h-screen">
      <section className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="admin-projects-eyebrow text-[10px] font-bold uppercase tracking-[0.16em]">
              Content
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              Projects
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-5">
              Manage portfolio visibility, featured state and Case Studies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="admin-projects-count-pill rounded-lg px-3 py-2 text-[11px] font-semibold">
              {isLoading
                ? "Loading..."
                : `${resultCount} Project${resultCount === 1 ? "" : "s"}`}
            </span>

            <Link
              to="/admin/projects/new"
              className="admin-projects-primary-button inline-flex min-h-9 items-center justify-center rounded-lg px-4 text-xs font-bold"
            >
              Add Project
            </Link>
          </div>
        </header>

        <form
          className="admin-projects-toolbar mt-4 rounded-xl p-3"
          onSubmit={handleFilterSubmit}
        >
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.4fr)_160px_170px_auto]">
            <label className="sr-only" htmlFor="project-search">
              Search Projects
            </label>

            <input
              className="admin-projects-input min-h-10 rounded-lg px-3 text-sm outline-none"
              id="project-search"
              name="search"
              onChange={handleFilterChange}
              placeholder="Search title, slug, category or technology..."
              type="search"
              value={formFilters.search}
            />

            <label className="sr-only" htmlFor="project-type">
              Project Type
            </label>

            <select
              className="admin-projects-input min-h-10 rounded-lg px-3 text-xs font-semibold outline-none"
              id="project-type"
              name="projectType"
              onChange={handleFilterChange}
              value={formFilters.projectType}
            >
              <option value="">All Types</option>
              <option value="personal">Personal</option>
              <option value="client">Client</option>
              <option value="company">Company</option>
              <option value="open-source">Open Source</option>
              <option value="practice">Practice</option>
            </select>

            <label className="sr-only" htmlFor="project-status">
              Project Status
            </label>

            <select
              className="admin-projects-input min-h-10 rounded-lg px-3 text-xs font-semibold outline-none"
              id="project-status"
              name="status"
              onChange={handleFilterChange}
              value={formFilters.status}
            >
              <option value="">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="in-progress">In Development</option>
              <option value="completed">Completed</option>
              <option value="maintained">Active Project</option>
              <option value="archived">Archived</option>
            </select>

            <div className="flex gap-2">
              <button
                className="admin-projects-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
                type="submit"
              >
                Apply
              </button>

              <button
                aria-label="Clear Project filters"
                className="admin-projects-secondary-button inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold"
                onClick={handleClearFilters}
                title="Clear filters"
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          <details className="admin-projects-advanced mt-2 rounded-lg">
            <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold">
              More Filters
            </summary>

            <div className="grid gap-2 border-t px-3 py-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <label className="grid gap-1 text-[10px] font-semibold">
                Category
                <input
                  className="admin-projects-input min-h-9 rounded-lg px-3 text-xs outline-none"
                  id="project-category"
                  name="category"
                  onChange={handleFilterChange}
                  placeholder="E-commerce"
                  type="text"
                  value={formFilters.category}
                />
              </label>

              <label className="grid gap-1 text-[10px] font-semibold">
                Visibility
                <select
                  className="admin-projects-input min-h-9 rounded-lg px-3 text-xs outline-none"
                  id="project-visibility"
                  name="visibility"
                  onChange={handleFilterChange}
                  value={formFilters.visibility}
                >
                  <option value="all">All Projects</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </label>

              <label className="grid gap-1 text-[10px] font-semibold">
                Featured
                <select
                  className="admin-projects-input min-h-9 rounded-lg px-3 text-xs outline-none"
                  id="project-featured"
                  name="featured"
                  onChange={handleFilterChange}
                  value={formFilters.featured}
                >
                  <option value="all">All States</option>
                  <option value="featured">Featured</option>
                  <option value="standard">Standard</option>
                </select>
              </label>

              <label className="grid gap-1 text-[10px] font-semibold">
                Case Study
                <select
                  className="admin-projects-input min-h-9 rounded-lg px-3 text-xs outline-none"
                  id="project-case-study-publication"
                  name="caseStudyPublished"
                  onChange={handleFilterChange}
                  value={formFilters.caseStudyPublished}
                >
                  <option value="all">All Projects</option>
                  <option value="published">Published</option>
                  <option value="not-published">Not Published</option>
                </select>
              </label>

              <label className="grid gap-1 text-[10px] font-semibold">
                Case Study Featured
                <select
                  className="admin-projects-input min-h-9 rounded-lg px-3 text-xs outline-none"
                  id="project-case-study-featured"
                  name="caseStudyFeatured"
                  onChange={handleFilterChange}
                  value={formFilters.caseStudyFeatured}
                >
                  <option value="all">All States</option>
                  <option value="featured">Featured</option>
                  <option value="standard">Standard / Not Featured</option>
                </select>
              </label>
            </div>
          </details>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold">
            {isLoading
              ? "Loading Projects..."
              : `${resultCount} matching Project${resultCount === 1 ? "" : "s"}`}
          </p>

          <button
            className="admin-projects-secondary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[11px] font-semibold"
            disabled={isLoading || actionProjectId !== ""}
            onClick={handleRefresh}
            type="button"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div aria-live="polite">
          {successMessage ? (
            <div
              className="admin-projects-success mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
              role="status"
            >
              {successMessage}
            </div>
          ) : null}
        </div>

        {error ? (
          <div
            className="admin-projects-error mt-3 rounded-lg px-3 py-2 text-xs font-semibold"
            role="alert"
          >
            <span>{error}</span>

            <button
              className="ml-2 font-bold underline underline-offset-4"
              onClick={handleRefresh}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-3 space-y-2.5">
            {[1, 2, 3, 4, 5].map((placeholder) => (
              <div
                className="admin-projects-skeleton h-[104px] animate-pulse rounded-xl motion-reduce:animate-none"
                key={placeholder}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && projects.length === 0 ? (
          <div className="admin-projects-empty mt-3 rounded-xl px-5 py-10 text-center">
            <h2 className="text-base font-bold">No Projects found</h2>

            <p className="mt-1 text-xs">
              Change the filters or add a new Project.
            </p>
          </div>
        ) : null}

        {!isLoading && projects.length > 0 ? (
          <div className="mt-3 space-y-2.5">
            {projects.map((project) => {
              const technologies = Array.isArray(project.technologies)
                ? project.technologies
                : [];

              const isActionPending = actionProjectId === project._id;

              return (
                <article
                  className="admin-projects-row rounded-xl"
                  key={project._id}
                >
                  <div className="grid min-w-0 gap-3 p-3 md:grid-cols-[88px_minmax(0,1fr)_auto] md:items-center">
                    <div className="admin-projects-thumb relative h-16 overflow-hidden rounded-lg md:h-[66px]">
                      {project.coverImageUrl ? (
                        <img
                          alt={`${project.title} cover`}
                          className="absolute inset-0 size-full object-cover"
                          loading="lazy"
                          src={project.coverImageUrl}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/35 via-slate-950 to-cyan-500/15" />
                      )}

                      <span className="admin-projects-order absolute bottom-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold">
                        #{project.order ?? 0}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <h2 className="mr-1 min-w-0 truncate text-sm font-bold">
                          {project.title}
                        </h2>

                        <span
                          className="admin-projects-badge rounded-md px-2 py-1 text-[9px] font-bold"
                          data-status={project.status || "unknown"}
                        >
                          {statusLabels[project.status] ||
                            project.status ||
                            "Project"}
                        </span>

                        <span className="admin-projects-badge rounded-md px-2 py-1 text-[9px] font-bold">
                          {projectTypeLabels[project.projectType] ||
                            project.projectType ||
                            "Project"}
                        </span>

                        {project.isFeatured ? (
                          <span className="admin-projects-badge is-featured rounded-md px-2 py-1 text-[9px] font-bold">
                            Featured
                          </span>
                        ) : null}

                        <span
                          className={`admin-projects-badge rounded-md px-2 py-1 text-[9px] font-bold ${
                            project.isVisible ? "is-visible" : "is-hidden"
                          }`}
                        >
                          {project.isVisible ? "Visible" : "Hidden"}
                        </span>

                        {project.caseStudy?.isPublished ? (
                          <span className="admin-projects-badge is-case-study rounded-md px-2 py-1 text-[9px] font-bold">
                            {project.caseStudy?.isFeatured
                              ? "Case Study · Featured"
                              : "Case Study"}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 truncate text-[10px] font-semibold">
                        {project.category || "Project"} · /{project.slug}
                      </p>

                      <p className="mt-1 line-clamp-1 text-[11px] leading-5">
                        {project.shortDescription}
                      </p>

                      <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5 text-[9px]">
                        {technologies.slice(0, 3).map((technology) => (
                          <span
                            className="admin-projects-tech rounded-md px-1.5 py-1 font-semibold"
                            key={`${project._id}-${technology}`}
                          >
                            {technology}
                          </span>
                        ))}

                        {technologies.length > 3 ? (
                          <span className="admin-projects-tech rounded-md px-1.5 py-1 font-semibold">
                            +{technologies.length - 3}
                          </span>
                        ) : null}

                        <span className="ml-auto hidden text-slate-500 lg:inline">
                          Updated {formatDate(project.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 md:justify-end">
                      <Link
                        className="admin-projects-primary-button inline-flex min-h-9 items-center justify-center rounded-lg px-4 text-xs font-bold"
                        to={`/admin/projects/${project._id}/edit`}
                      >
                        Edit
                      </Link>

                      <details className="admin-projects-actions relative">
                        <summary
                          aria-label={`More actions for ${project.title}`}
                          className="admin-projects-secondary-button inline-flex size-9 cursor-pointer list-none items-center justify-center rounded-lg text-base font-bold"
                          title="More actions"
                        >
                          ⋯
                        </summary>

                        <div className="admin-projects-action-menu absolute right-0 top-[calc(100%+0.4rem)] z-30 w-52 rounded-xl p-2">
                          <button
                            className="admin-projects-menu-action"
                            disabled={actionProjectId !== ""}
                            onClick={() => handleToggleVisibility(project)}
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : project.isVisible
                                ? "Hide Project"
                                : "Show Project"}
                          </button>

                          <button
                            className="admin-projects-menu-action"
                            disabled={actionProjectId !== ""}
                            onClick={() => handleToggleFeatured(project)}
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : project.isFeatured
                                ? "Make Standard"
                                : "Make Featured"}
                          </button>

                          <button
                            className="admin-projects-menu-action"
                            disabled={actionProjectId !== ""}
                            onClick={() =>
                              handleToggleCaseStudyPublication(project)
                            }
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : project.caseStudy?.isPublished
                                ? "Unpublish Case Study"
                                : "Publish Case Study"}
                          </button>

                          <button
                            className="admin-projects-menu-action"
                            disabled={
                              actionProjectId !== "" ||
                              !project.caseStudy?.isPublished
                            }
                            onClick={() =>
                              handleToggleCaseStudyFeatured(project)
                            }
                            title={
                              project.caseStudy?.isPublished
                                ? "Toggle Case Study featured state"
                                : "Publish this Project as a Case Study first"
                            }
                            type="button"
                          >
                            {isActionPending
                              ? "Working..."
                              : project.caseStudy?.isFeatured
                                ? "Unfeature Case Study"
                                : "Feature Case Study"}
                          </button>

                          <div className="admin-projects-menu-divider my-1" />

                          <button
                            className="admin-projects-menu-action is-danger"
                            disabled={
                              actionProjectId !== "" || !canDeleteProjects
                            }
                            onClick={() => handleDeleteProject(project)}
                            title={
                              canDeleteProjects
                                ? "Permanently delete Project"
                                : "Your role cannot permanently delete Projects"
                            }
                            type="button"
                          >
                            {isActionPending ? "Working..." : "Delete Project"}
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

export default AdminProjectsPage;