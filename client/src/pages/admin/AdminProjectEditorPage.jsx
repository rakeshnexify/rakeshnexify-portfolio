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

  const { accessToken, logout } = useAdminAuth();

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

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 lg:px-8">
          <div role="status" aria-live="polite" className="mx-auto max-w-6xl space-y-2">
            <span className="sr-only">Loading project details...</span>
            <div className="h-14 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
            <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (isEditMode && (loadError || hasMissingProjectId)) {
    return (
      <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/60 dark:bg-slate-900 sm:p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 dark:text-red-300">
              Project Error
            </p>

            <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Project could not be opened
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {hasMissingProjectId ? "Project ID is required." : loadError}
            </p>

            <Link
              to="/admin/projects"
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <span aria-hidden="true">&larr;</span>
              <span className="ml-1.5">Return to Projects</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rnx-admin-project-editor-v492 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link
            to="/admin/projects"
            className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <span aria-hidden="true">&larr;</span>
            Projects
          </Link>

          <header className="mt-0.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300 sm:text-[10px]">
              {isEditMode ? "Edit Project" : "Create Project"}
            </p>

            <h1 className="mt-0.5 break-words text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {isEditMode
                ? `Edit ${project?.title || "Project"}`
                : "Add Project"}
            </h1>

            <p className="mt-0.5 max-w-3xl text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-[11px]">
              {isEditMode
                ? "Update project details, content, media, links and publishing."
                : "Create project details, content, media, links and publishing in one compact editor."}
            </p>
          </header>

          <div className="mt-2">
            <ProjectForm
              key={isEditMode ? project?._id : "new-project"}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              submitLabel={isEditMode ? "Update Project" : "Create Project"}
              accessToken={accessToken}
              onMediaUnauthorized={handleMediaUnauthorized}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminProjectEditorPage;
