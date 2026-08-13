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

const statusClasses = {
  planning: "bg-violet-100 text-violet-700",
  "in-progress": "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  maintained: "bg-blue-100 text-blue-700",
  archived: "bg-slate-200 text-slate-700",
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
    if (
      !project?._id ||
      actionProjectId ||
      !project.caseStudy?.isPublished
    ) {
      return;
    }

    try {
      setActionProjectId(project._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminProject(accessToken, project._id, {
        caseStudy: {
          isFeatured: !Boolean(project.caseStudy?.isFeatured),
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

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
              Portfolio Management
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Projects
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Search and review all public, hidden, featured and archived
              portfolio projects stored in MongoDB.
            </p>
          </div>

          <Link
            to="/admin/projects/new"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Add New Project
          </Link>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-1">
              <label
                htmlFor="project-search"
                className="text-sm font-semibold text-slate-700"
              >
                Search projects
              </label>

              <input
                id="project-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Search title, slug, category or technology"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="project-category"
                className="text-sm font-semibold text-slate-700"
              >
                Category
              </label>

              <input
                id="project-category"
                name="category"
                type="text"
                value={formFilters.category}
                onChange={handleFilterChange}
                placeholder="E-commerce"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="project-type"
                className="text-sm font-semibold text-slate-700"
              >
                Project type
              </label>

              <select
                id="project-type"
                name="projectType"
                value={formFilters.projectType}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="">All types</option>

                <option value="personal">Personal</option>

                <option value="client">Client</option>

                <option value="company">Company</option>

                <option value="open-source">Open Source</option>

                <option value="practice">Practice</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="project-status"
                className="text-sm font-semibold text-slate-700"
              >
                Status
              </label>

              <select
                id="project-status"
                name="status"
                value={formFilters.status}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="">All statuses</option>

                <option value="planning">Planning</option>

                <option value="in-progress">In Development</option>

                <option value="completed">Completed</option>

                <option value="maintained">Active Project</option>

                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="project-visibility"
                className="text-sm font-semibold text-slate-700"
              >
                Visibility
              </label>

              <select
                id="project-visibility"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="all">All projects</option>

                <option value="visible">Visible</option>

                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="project-featured"
                className="text-sm font-semibold text-slate-700"
              >
                Featured
              </label>

              <select
                id="project-featured"
                name="featured"
                value={formFilters.featured}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="all">All projects</option>

                <option value="featured">Featured</option>

                <option value="standard">Standard</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="project-case-study-publication"
                className="text-sm font-semibold text-slate-700"
              >
                Case Study publication
              </label>

              <select
                id="project-case-study-publication"
                name="caseStudyPublished"
                value={formFilters.caseStudyPublished}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="all">All projects</option>

                <option value="published">Published Case Studies</option>

                <option value="not-published">Not published</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="project-case-study-featured"
                className="text-sm font-semibold text-slate-700"
              >
                Case Study featured
              </label>

              <select
                id="project-case-study-featured"
                name="caseStudyFeatured"
                value={formFilters.caseStudyFeatured}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="all">All projects</option>

                <option value="featured">Featured Case Studies</option>

                <option value="standard">Standard / not featured</option>
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
              ? "Loading projects..."
              : `${resultCount} project(s) found`}
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

        {successMessage && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
          >
            <p className="text-sm font-semibold leading-6 text-emerald-700">
              {successMessage}
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5"
          >
            <p className="text-sm font-semibold text-red-700">{error}</p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Try Again
            </button>
          </div>
        )}

        {isLoading && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && projects.length === 0 && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-950">
              No projects found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Try changing or clearing the current filters.
            </p>
          </div>
        )}

        {!isLoading && projects.length > 0 && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const technologies = Array.isArray(project.technologies)
                ? project.technologies
                : [];

              return (
                <article
                  key={project._id}
                  className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative min-h-44 overflow-hidden bg-slate-950">
                    {project.coverImageUrl ? (
                      <img
                        src={project.coverImageUrl}
                        alt={`${project.title} cover`}
                        loading="lazy"
                        className="absolute inset-0 size-full object-cover opacity-60"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-600/40 via-slate-950 to-cyan-500/20" />
                    )}

                    <div className="absolute inset-0 bg-slate-950/40" />

                    <div className="relative flex min-h-44 flex-col justify-between p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
                          {project.category || "Web Project"}
                        </span>

                        <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1.5 text-xs font-bold text-white">
                          Order {project.order ?? 0}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {project.isFeatured && (
                          <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white">
                            Featured
                          </span>
                        )}

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                            project.isVisible
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-600 text-white"
                          }`}
                        >
                          {project.isVisible ? "Visible" : "Hidden"}
                        </span>

                        {project.caseStudy?.isPublished && (
                          <span className="rounded-full bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950">
                            Case Study
                          </span>
                        )}

                        {project.caseStudy?.isPublished &&
                          project.caseStudy?.isFeatured && (
                            <span className="rounded-full bg-fuchsia-500 px-3 py-1.5 text-xs font-bold text-white">
                              Featured Case Study
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          statusClasses[project.status] ||
                          "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {statusLabels[project.status] ||
                          project.status ||
                          "Project"}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        {projectTypeLabels[project.projectType] ||
                          project.projectType ||
                          "Project"}
                      </span>
                    </div>

                    <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-950">
                      {project.title}
                    </h2>

                    <p className="mt-2 break-all text-xs font-semibold text-brand-600">
                      {project.slug}
                    </p>

                    <p className="mt-4 line-clamp-3 leading-7 text-slate-600">
                      {project.shortDescription}
                    </p>

                    {technologies.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {technologies.slice(0, 5).map((technology) => (
                          <span
                            key={`${project._id}-${technology}`}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
                          >
                            {technology}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                            Case Study
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {project.caseStudy?.isPublished
                              ? "Published"
                              : "Not published"}
                          </p>
                        </div>

                        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                          Order {project.caseStudy?.order ?? 0}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto border-t border-slate-100 pt-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                        <span>{technologies.length} Technologies</span>

                        <span>Updated {formatDate(project.updatedAt)}</span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <Link
                          to={`/admin/projects/${project._id}/edit`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
                        >
                          Edit
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(project)}
                          disabled={Boolean(actionProjectId)}
                          className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            project.isVisible
                              ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          {actionProjectId === project._id
                            ? "Updating..."
                            : project.isVisible
                              ? "Hide"
                              : "Show"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(project)}
                          disabled={Boolean(actionProjectId)}
                          className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            project.isFeatured
                              ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                              : "bg-amber-500 text-white hover:bg-amber-600"
                          }`}
                        >
                          {actionProjectId === project._id
                            ? "Updating..."
                            : project.isFeatured
                              ? "Make Standard"
                              : "Make Featured"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleCaseStudyPublication(project)
                          }
                          disabled={Boolean(actionProjectId)}
                          className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            project.caseStudy?.isPublished
                              ? "border border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
                              : "bg-cyan-600 text-white hover:bg-cyan-700"
                          }`}
                        >
                          {actionProjectId === project._id
                            ? "Updating..."
                            : project.caseStudy?.isPublished
                              ? "Unpublish Case Study"
                              : "Publish Case Study"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleCaseStudyFeatured(project)}
                          disabled={
                            Boolean(actionProjectId) ||
                            !project.caseStudy?.isPublished
                          }
                          title={
                            project.caseStudy?.isPublished
                              ? "Toggle Case Study featured state"
                              : "Publish this Project as a Case Study first"
                          }
                          className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            project.caseStudy?.isFeatured
                              ? "border border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100"
                              : "bg-fuchsia-600 text-white hover:bg-fuchsia-700"
                          }`}
                        >
                          {actionProjectId === project._id
                            ? "Updating..."
                            : project.caseStudy?.isFeatured
                              ? "Unfeature Case Study"
                              : "Feature Case Study"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProject(project)}
                          disabled={
                            Boolean(actionProjectId) ||
                            !["super-admin", "admin"].includes(admin?.role)
                          }
                          title={
                            ["super-admin", "admin"].includes(admin?.role)
                              ? "Permanently delete project"
                              : "Your role cannot permanently delete projects"
                          }
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionProjectId === project._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
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

export default AdminProjectsPage;
