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
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-5xl space-y-4"
          >
            <span className="sr-only">
              Loading Testimonial editor...
            </span>

            <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />

            <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (loadError || hasMissingTestimonialId) {
    return (
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
              Testimonial Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Testimonial editor could not be opened
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasMissingTestimonialId
                ? "Testimonial ID is required."
                : loadError}
            </p>

            <Link
              to="/admin/testimonials"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              &larr; Return to Testimonials
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            to="/admin/testimonials"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span aria-hidden="true">
              &larr;
            </span>

            Testimonials Management
          </Link>

          <header className="mt-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Testimonials Management
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isEditMode
                ? `Edit ${testimonial?.clientName || "Testimonial"}`
                : "Add New Testimonial"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isEditMode
                ? "Update the client identity, review, rating, related Project, profile media and publishing controls."
                : "Create a professional client Testimonial that can be managed dynamically from the Admin Panel."}
            </p>
          </header>

          <div className="mt-6">
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
