import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import EducationForm from "../../components/admin/education/EducationForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  createAdminEducation,
  fetchAdminEducationById,
  updateAdminEducation,
} from "../../services/adminEducationApi";
import {
  createEducationFormValues,
  defaultEducationFormValues,
} from "../../utils/educationForm";

function AdminEducationEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id: educationId } = useParams();
  const { accessToken, logout } = useAdminAuth();

  const isEditMode = mode === "edit";
  const hasMissingEducationId = isEditMode && !educationId;

  const [education, setEducation] = useState(null);
  const [isLoading, setIsLoading] = useState(
    isEditMode && !hasMissingEducationId,
  );
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isEditMode || !educationId || !accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadEducation() {
      try {
        setIsLoading(true);
        setLoadError("");

        const educationData = await fetchAdminEducationById(
          accessToken,
          educationId,
          {
            signal: controller.signal,
          },
        );

        setEducation(educationData);
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
                pathname: `/admin/education/${educationId}/edit`,
              },
            },
          });

          return;
        }

        console.error("Admin Education loading failed:", error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Education record could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadEducation();

    return () => {
      controller.abort();
    };
  }, [accessToken, educationId, isEditMode, logout, navigate]);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return defaultEducationFormValues;
    }

    return createEducationFormValues(education || {});
  }, [education, isEditMode]);

  const handleMediaUnauthorized = useCallback(() => {
    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: isEditMode
            ? `/admin/education/${educationId}/edit`
            : "/admin/education/new",
        },
      },
    });
  }, [educationId, isEditMode, logout, navigate]);

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
            ? `/admin/education/${educationId}/edit`
            : "/admin/education/new",
        },
      },
    });

    return true;
  }

  async function handleSubmit(educationPayload) {
    try {
      if (isEditMode) {
        const response = await updateAdminEducation(
          accessToken,
          educationId,
          educationPayload,
        );

        navigate("/admin/education", {
          replace: true,
          state: {
            successMessage:
              response.message || "Education record updated successfully.",
          },
        });

        return;
      }

      const response = await createAdminEducation(
        accessToken,
        educationPayload,
      );

      navigate("/admin/education", {
        replace: true,
        state: {
          successMessage:
            response.message || "Education record created successfully.",
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
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />

          <p className="mt-5 text-sm font-semibold text-slate-600">
            Loading Education editor...
          </p>
        </div>
      </main>
    );
  }

  if (loadError || hasMissingEducationId) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
            !
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Education Error
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Education editor could not be opened
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            {hasMissingEducationId
              ? "Education ID is required."
              : loadError}
          </p>

          <Link
            to="/admin/education"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Return to Education
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/education"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
        >
          <span aria-hidden="true">←</span>
          Back to Education
        </Link>

        <div className="mt-6 rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
            Education Management
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {isEditMode
              ? `Edit ${education?.degree || "Education"}`
              : "Add New Education"}
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            {isEditMode
              ? "Update the institution, qualification, study timeline, content, links and publishing controls."
              : "Create a professional Education timeline record that can be managed dynamically from the Admin Panel."}
          </p>
        </div>

        <div className="mt-8">
          <EducationForm
            key={isEditMode ? education?._id : "new-education"}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={
              isEditMode ? "Update Education" : "Create Education"
            }
            accessToken={accessToken}
            onMediaUnauthorized={handleMediaUnauthorized}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminEducationEditorPage;
