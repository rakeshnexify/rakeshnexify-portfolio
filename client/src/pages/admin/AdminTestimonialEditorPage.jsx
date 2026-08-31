import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import TestimonialForm from "../../components/admin/testimonials/TestimonialForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import { fetchAdminProjects } from "../../services/adminProjectsApi";
import {
  createAdminTestimonial,
  fetchAdminTestimonialById,
  updateAdminTestimonial,
} from "../../services/adminTestimonialsApi";
import {
  createTestimonialFormValues,
  defaultTestimonialFormValues,
} from "../../utils/testimonialForm";

function AdminTestimonialEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id: testimonialId } = useParams();
  const { accessToken, logout } = useAdminAuth();

  const isEditMode = mode === "edit";
  const hasMissingTestimonialId = isEditMode && !testimonialId;

  const [testimonial, setTestimonial] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(!hasMissingTestimonialId);
  const [areProjectsLoading, setAreProjectsLoading] = useState(!hasMissingTestimonialId);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!accessToken || hasMissingTestimonialId) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadEditorData() {
      try {
        setLoadError("");
        setAreProjectsLoading(true);

        if (isEditMode) {
          setIsLoading(true);
        }

        const [testimonialData, projectsResponse] = await Promise.all([
          isEditMode
            ? fetchAdminTestimonialById(accessToken, testimonialId, {
                signal: controller.signal,
              })
            : Promise.resolve(null),
          fetchAdminProjects(
            accessToken,
            {},
            {
              signal: controller.signal,
            },
          ),
        ]);

        setTestimonial(testimonialData);
        setProjectOptions(projectsResponse.projects);
      } catch (error) {
        if (controller.signal.aborted || error?.name === "AbortError") {
          return;
        }

        if (error?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,
            state: {
              from: {
                pathname: isEditMode
                  ? `/admin/testimonials/${testimonialId}/edit`
                  : "/admin/testimonials/new",
              },
            },
          });

          return;
        }

        console.error("Admin Testimonial editor loading failed:", error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Testimonial editor data could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setAreProjectsLoading(false);
        }
      }
    }

    loadEditorData();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    hasMissingTestimonialId,
    isEditMode,
    logout,
    navigate,
    testimonialId,
  ]);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return defaultTestimonialFormValues;
    }

    return createTestimonialFormValues(testimonial || {});
  }, [isEditMode, testimonial]);

  const handleMediaUnauthorized = useCallback(() => {
    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: isEditMode
            ? `/admin/testimonials/${testimonialId}/edit`
            : "/admin/testimonials/new",
        },
      },
    });
  }, [isEditMode, logout, navigate, testimonialId]);

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
            ? `/admin/testimonials/${testimonialId}/edit`
            : "/admin/testimonials/new",
        },
      },
    });

    return true;
  }

  async function handleSubmit(testimonialPayload) {
    try {
      if (isEditMode) {
        const response = await updateAdminTestimonial(
          accessToken,
          testimonialId,
          testimonialPayload,
        );

        navigate("/admin/testimonials", {
          replace: true,
          state: {
            successMessage:
              response.message || "Testimonial updated successfully.",
          },
        });

        return;
      }

      const response = await createAdminTestimonial(
        accessToken,
        testimonialPayload,
      );

      navigate("/admin/testimonials", {
        replace: true,
        state: {
          successMessage:
            response.message || "Testimonial created successfully.",
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
          <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-6xl space-y-2"
          >
            <span className="sr-only">Loading Testimonial editor...</span>

            <div className="h-14 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
            <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (loadError || hasMissingTestimonialId) {
    return (
      <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/60 dark:bg-slate-900 sm:p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 dark:text-red-300">
              Testimonial Error
            </p>

            <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Testimonial editor could not be opened
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {hasMissingTestimonialId
                ? "Testimonial ID is required."
                : loadError}
            </p>

            <Link
              to="/admin/testimonials"
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              &larr; Return to Testimonials
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rnx-admin-testimonial-editor-v497 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/admin/testimonials"
            className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <span aria-hidden="true">&larr;</span>
            Testimonials
          </Link>

          <header className="mt-0.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300 sm:text-[10px]">
              {isEditMode ? "Edit Testimonial" : "Create Testimonial"}
            </p>

            <h1 className="mt-0.5 break-words text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              {isEditMode
                ? `Edit ${testimonial?.clientName || "Testimonial"}`
                : "Add Testimonial"}
            </h1>

            <p className="mt-0.5 max-w-3xl text-[10px] leading-4 text-slate-500 dark:text-slate-400 sm:text-[11px]">
              {isEditMode
                ? "Update client details, review, media and publishing."
                : "Create client feedback in one compact editor."}
            </p>
          </header>

          <div className="mt-2">
            <TestimonialForm
              key={isEditMode ? testimonial?._id : "new-testimonial"}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              submitLabel={
                isEditMode ? "Update Testimonial" : "Create Testimonial"
              }
              projectOptions={projectOptions}
              areProjectsLoading={areProjectsLoading}
              accessToken={accessToken}
              onMediaUnauthorized={handleMediaUnauthorized}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminTestimonialEditorPage;
