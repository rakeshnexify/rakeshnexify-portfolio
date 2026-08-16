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
  planning: "bg-violet-50 text-violet-700",
  "in-progress": "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  maintained: "bg-blue-50 text-blue-700",
  archived: "bg-slate-100 text-slate-600",
};

const projectTypeLabels = {
  personal: "Personal",
  client: "Client",
  company: "Company",
  "open-source": "Open Source",
  practice: "Practice",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition-colors duration-150 motion-reduce:transition-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.08em] text-slate-500";

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
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="uppercase tracking-[0.14em] text-brand-700">
                Content
              </span>

              <span aria-hidden="true" className="text-slate-300">
                /
              </span>

              <span className="text-slate-500">Portfolio management</span>
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Projects
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage portfolio Projects, public visibility, featured state and
              Case Study publication from one operational view.
            </p>
          </div>

          <Link
            to="/admin/projects/new"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Add Project
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-black text-slate-950">Filters</h2>

              <p className="mt-1 text-sm text-slate-500">
                Narrow Projects by content, workflow and Case Study state.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2">
              <label htmlFor="project-search" className={labelClassName}>
                Search
              </label>

              <input
                id="project-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Title, slug, category or technology"
                className={`${inputClassName} px-4 placeholder:text-slate-400`}
              />
            </div>

            <div>
              <label htmlFor="project-category" className={labelClassName}>
                Category
              </label>

              <input
                id="project-category"
                name="category"
                type="text"
                value={formFilters.category}
                onChange={handleFilterChange}
                placeholder="E-commerce"
                className={`${inputClassName} px-4 placeholder:text-slate-400`}
              />
            </div>

            <div>
              <label htmlFor="project-type" className={labelClassName}>
                Project type
              </label>

              <select
                id="project-type"
                name="projectType"
                value={formFilters.projectType}
                onChange={handleFilterChange}
                className={inputClassName}
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
              <label htmlFor="project-status" className={labelClassName}>
                Status
              </label>

              <select
                id="project-status"
                name="status"
                value={formFilters.status}
                onChange={handleFilterChange}
                className={inputClassName}
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
              <label htmlFor="project-visibility" className={labelClassName}>
                Visibility
              </label>

              <select
                id="project-visibility"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All Projects</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label htmlFor="project-featured" className={labelClassName}>
                Project featured
              </label>

              <select
                id="project-featured"
                name="featured"
                value={formFilters.featured}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All states</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="project-case-study-publication"
                className={labelClassName}
              >
                Case Study publication
              </label>

              <select
                id="project-case-study-publication"
                name="caseStudyPublished"
                value={formFilters.caseStudyPublished}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All Projects</option>
                <option value="published">Published</option>
                <option value="not-published">Not published</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="project-case-study-featured"
                className={labelClassName}
              >
                Case Study featured
              </label>

              <select
                id="project-case-study-featured"
                name="caseStudyFeatured"
                value={formFilters.caseStudyFeatured}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All states</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard / not featured</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-slate-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Clear
            </button>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-700">
              {isLoading
                ? "Loading Projects..."
                : `${resultCount} Project${resultCount === 1 ? "" : "s"}`}
            </p>

            {!isLoading ? (
              <p className="mt-0.5 text-xs text-slate-500">
                Matching the currently applied filters.
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading || actionProjectId !== ""}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div aria-live="polite">
          {successMessage ? (
            <div
              role="status"
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
            >
              <p className="text-sm font-semibold leading-6 text-emerald-800">
                {successMessage}
              </p>
            </div>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm font-semibold leading-6 text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-3 min-h-10 text-sm font-bold text-red-700 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-[32rem] animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && projects.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-base font-black text-slate-950">
              No Projects found
            </p>

            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Try changing the filters or add a new Project.
            </p>
          </div>
        ) : null}

        {!isLoading && projects.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const technologies = Array.isArray(project.technologies)
                ? project.technologies
                : [];

              const isActionPending = actionProjectId === project._id;

              return (
                <article
                  key={project._id}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative h-36 overflow-hidden bg-slate-900">
                    {project.coverImageUrl ? (
                      <img
                        src={project.coverImageUrl}
                        alt={`${project.title} cover`}
                        loading="lazy"
                        className="absolute inset-0 size-full object-cover opacity-65"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-600/35 via-slate-950 to-cyan-500/15" />
                    )}

                    <div className="absolute inset-0 bg-slate-950/35" />

                    <div className="relative flex h-full flex-col justify-between p-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-lg border border-white/10 bg-slate-950/50 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                          {project.category || "Project"}
                        </span>

                        <span className="rounded-lg border border-white/10 bg-slate-950/50 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                          Order {project.order ?? 0}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {project.isFeatured ? (
                          <span className="rounded-lg bg-amber-400 px-2.5 py-1 text-xs font-bold text-slate-950">
                            Featured
                          </span>
                        ) : null}

                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                            project.isVisible
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-600 text-white"
                          }`}
                        >
                          {project.isVisible ? "Visible" : "Hidden"}
                        </span>

                        {project.caseStudy?.isPublished ? (
                          <span className="rounded-lg bg-cyan-400 px-2.5 py-1 text-xs font-bold text-slate-950">
                            Case Study
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          statusClasses[project.status] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {statusLabels[project.status] ||
                          project.status ||
                          "Project"}
                      </span>

                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {projectTypeLabels[project.projectType] ||
                          project.projectType ||
                          "Project"}
                      </span>
                    </div>

                    <h2 className="mt-4 break-words text-lg font-black tracking-tight text-slate-950">
                      {project.title}
                    </h2>

                    <p className="mt-1.5 break-all text-xs font-semibold text-brand-700">
                      {project.slug}
                    </p>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {project.shortDescription}
                    </p>

                    {technologies.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {technologies.slice(0, 4).map((technology) => (
                          <span
                            key={`${project._id}-${technology}`}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"
                          >
                            {technology}
                          </span>
                        ))}

                        {technologies.length > 4 ? (
                          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500">
                            +{technologies.length - 4} more
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className={labelClassName}>Case Study</p>

                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {project.caseStudy?.isPublished
                              ? project.caseStudy?.isFeatured
                                ? "Published · Featured"
                                : "Published"
                              : "Not published"}
                          </p>
                        </div>

                        <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                          Order {project.caseStudy?.order ?? 0}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto pt-5">
                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                          <span>
                            {technologies.length} technolog
                            {technologies.length === 1 ? "y" : "ies"}
                          </span>

                          <span>Updated {formatDate(project.updatedAt)}</span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Link
                            to={`/admin/projects/${project._id}/edit`}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-3 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(project)}
                            disabled={actionProjectId !== ""}
                            className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${
                              project.isVisible
                                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                            }`}
                          >
                            {isActionPending
                              ? "Working..."
                              : project.isVisible
                                ? "Hide"
                                : "Show"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(project)}
                            disabled={actionProjectId !== ""}
                            className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${
                              project.isFeatured
                                ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                            }`}
                          >
                            {isActionPending
                              ? "Working..."
                              : project.isFeatured
                                ? "Make Standard"
                                : "Make Featured"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleCaseStudyPublication(project)
                            }
                            disabled={actionProjectId !== ""}
                            className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60 ${
                              project.caseStudy?.isPublished
                                ? "border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
                                : "border-cyan-600 bg-cyan-600 text-white hover:bg-cyan-700"
                            }`}
                          >
                            {isActionPending
                              ? "Working..."
                              : project.caseStudy?.isPublished
                                ? "Unpublish Case Study"
                                : "Publish Case Study"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleCaseStudyFeatured(project)
                            }
                            disabled={
                              actionProjectId !== "" ||
                              !project.caseStudy?.isPublished
                            }
                            title={
                              project.caseStudy?.isPublished
                                ? "Toggle Case Study featured state"
                                : "Publish this Project as a Case Study first"
                            }
                            className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors duration-150 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 ${
                              project.caseStudy?.isFeatured
                                ? "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {isActionPending
                              ? "Working..."
                              : project.caseStudy?.isFeatured
                                ? "Unfeature Case Study"
                                : "Feature Case Study"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project)}
                            disabled={
                              actionProjectId !== "" || !canDeleteProjects
                            }
                            title={
                              canDeleteProjects
                                ? "Permanently delete Project"
                                : "Your role cannot permanently delete Projects"
                            }
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-3 text-sm font-bold text-red-700 transition-colors duration-150 motion-reduce:transition-none hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isActionPending ? "Working..." : "Delete"}
                          </button>
                        </div>
                      </div>
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
