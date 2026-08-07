import { useEffect, useMemo, useState } from "react";
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
  const { accessToken, admin, logout } = useAdminAuth();

  const isEditMode = mode === "edit";
  const hasMissingTestimonialId = isEditMode && !testimonialId;

  const [testimonial, setTestimonial] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(!hasMissingTestimonialId);
  const [areProjectsLoading, setAreProjectsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!accessToken || hasMissingTestimonialId) {
      if (hasMissingTestimonialId) {
        setAreProjectsLoading(false);
      }

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
            Loading Testimonial editor...
          </p>
        </div>
      </main>
    );
  }

  if (loadError || hasMissingTestimonialId) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
            !
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Testimonial Error
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Testimonial editor could not be opened
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            {hasMissingTestimonialId
              ? "Testimonial ID is required."
              : loadError}
          </p>

          <Link
            to="/admin/testimonials"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Return to Testimonials
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
                Testimonial Editor
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
          to="/admin/testimonials"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
        >
          <span aria-hidden="true">←</span>
          Back to Testimonials
        </Link>

        <div className="mt-6 rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
            Testimonials Management
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {isEditMode
              ? `Edit ${testimonial?.clientName || "Testimonial"}`
              : "Add New Testimonial"}
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            {isEditMode
              ? "Update the client identity, review, rating, related Project, profile media and publishing controls."
              : "Create a professional client Testimonial that can be managed dynamically from the Admin Panel."}
          </p>
        </div>

        <div className="mt-8">
          <TestimonialForm
            key={isEditMode ? testimonial?._id : "new-testimonial"}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={
              isEditMode ? "Update Testimonial" : "Create Testimonial"
            }
            projectOptions={projectOptions}
            areProjectsLoading={areProjectsLoading}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminTestimonialEditorPage;
