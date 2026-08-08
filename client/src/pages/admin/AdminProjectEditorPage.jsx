import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useParams } from "react-router";

import ProjectForm from "../../components/admin/projects/ProjectForm";
import useAdminAuth from "../../hooks/useAdminAuth";

import {
  createAdminProject,
  fetchAdminProjectById,
  updateAdminProject,
} from "../../services/adminProjectsApi";

import {
  createProjectFormValues,
  defaultProjectFormValues,
} from "../../utils/projectForm";

function AdminProjectEditorPage({ mode = "create" }) {
  const navigate = useNavigate();

  const { id: projectId } = useParams();

  const { accessToken, admin, logout } = useAdminAuth();

  const isEditMode = mode === "edit";

  const hasMissingProjectId = isEditMode && !projectId;

  const [project, setProject] = useState(null);

  const [isLoading, setIsLoading] = useState(
    isEditMode && !hasMissingProjectId,
  );

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isEditMode || !projectId || !accessToken) {
      return undefined;
    }

    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadProject() {
      try {
        const projectData = await fetchAdminProjectById(
          accessToken,
          projectId,
          {
            signal: controller.signal,
          },
        );

        setProject(projectData);
        setLoadError("");
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        if (error?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,
            state: {
              from: {
                pathname: `/admin/projects/${projectId}/edit`,
              },
            },
          });

          return;
        }

        console.error("Admin project loading failed:", error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Project could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      controller.abort();
    };
  }, [accessToken, isEditMode, logout, navigate, projectId]);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return defaultProjectFormValues;
    }

    return createProjectFormValues(project || {});
  }, [isEditMode, project]);

  function handleAuthenticationError(error) {
    if (error?.status !== 401) {
      return false;
    }

    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: isEditMode
            ? `/admin/projects/${projectId}/edit`
            : "/admin/projects/new",
        },
      },
    });

    return true;
  }

  function handleMediaUnauthorized() {
    handleAuthenticationError({
      status: 401,
    });
  }

  async function handleSubmit(projectPayload) {
    try {
      if (isEditMode) {
        const response = await updateAdminProject(
          accessToken,
          projectId,
          projectPayload,
        );

        navigate("/admin/projects", {
          replace: true,
          state: {
            successMessage: response.message || "Project updated successfully.",
          },
        });

        return;
      }

      const response = await createAdminProject(accessToken, projectPayload);

      navigate("/admin/projects", {
        replace: true,
        state: {
          successMessage: response.message || "Project created successfully.",
        },
      });
    } catch (error) {
      const wasAuthenticationError = handleAuthenticationError(error);

      if (!wasAuthenticationError) {
        throw error;
      }
    }
  }

  function handleLogout() {
    logout();

    navigate("/admin/login", {
      replace: true,
    });
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />

          <p className="mt-5 text-sm font-semibold text-slate-600">
            Loading project details...
          </p>
        </div>
      </main>
    );
  }

  if (isEditMode && (loadError || hasMissingProjectId)) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
            !
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Project Error
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Project could not be opened
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            {hasMissingProjectId ? "Project ID is required." : loadError}
          </p>

          <Link
            to="/admin/projects"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Return to projects
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <Link
            to="/admin/dashboard"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-600 font-extrabold text-white">
              RN
            </div>

            <div className="min-w-0">
              <p className="truncate font-extrabold text-slate-950">
                RakeshNexify
              </p>

              <p className="truncate text-xs font-medium text-slate-500">
                Project Editor
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-slate-500 md:inline">
              {admin?.name}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/projects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
        >
          <span aria-hidden="true">←</span>
          Projects Management
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
            {isEditMode ? "Update Project" : "Create Project"}
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {isEditMode
              ? `Edit ${project?.title || "project"}`
              : "Add a new project"}
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            {isEditMode
              ? "Update project content, screenshots, technologies, links, case-study details, visibility and SEO information."
              : "Create a complete portfolio project with project details, technologies, screenshots, links and case-study content."}
          </p>
        </div>

        <div className="mt-8">
          <ProjectForm
            key={isEditMode ? project?._id : "new-project"}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={isEditMode ? "Update Project" : "Create Project"}
            accessToken={accessToken}
            onMediaUnauthorized={handleMediaUnauthorized}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminProjectEditorPage;
