import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import ExperienceForm from "../../components/admin/experience/ExperienceForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  createAdminExperience,
  fetchAdminExperienceById,
  updateAdminExperience,
} from "../../services/adminExperienceApi";
import {
  createExperienceFormValues,
  defaultExperienceFormValues,
} from "../../utils/experienceForm";

function AdminExperienceEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id: experienceId } = useParams();
  const { accessToken, logout } = useAdminAuth();

  const isEditMode = mode === "edit";
  const hasMissingExperienceId = isEditMode && !experienceId;

  const [experience, setExperience] = useState(null);
  const [isLoading, setIsLoading] = useState(
    isEditMode && !hasMissingExperienceId,
  );
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isEditMode || !experienceId || !accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadExperience() {
      try {
        setIsLoading(true);
        setLoadError("");

        const experienceData = await fetchAdminExperienceById(
          accessToken,
          experienceId,
          {
            signal: controller.signal,
          },
        );

        setExperience(experienceData);
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
                pathname: `/admin/experience/${experienceId}/edit`,
              },
            },
          });

          return;
        }

        console.error("Admin Experience loading failed:", error);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Experience record could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadExperience();

    return () => {
      controller.abort();
    };
  }, [accessToken, experienceId, isEditMode, logout, navigate]);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return defaultExperienceFormValues;
    }

    return createExperienceFormValues(experience || {});
  }, [experience, isEditMode]);

  const handleMediaUnauthorized = useCallback(() => {
    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: isEditMode
            ? `/admin/experience/${experienceId}/edit`
            : "/admin/experience/new",
        },
      },
    });
  }, [experienceId, isEditMode, logout, navigate]);

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
            ? `/admin/experience/${experienceId}/edit`
            : "/admin/experience/new",
        },
      },
    });

    return true;
  }

  async function handleSubmit(experiencePayload) {
    try {
      if (isEditMode) {
        const response = await updateAdminExperience(
          accessToken,
          experienceId,
          experiencePayload,
        );

        navigate("/admin/experience", {
          replace: true,
          state: {
            successMessage:
              response.message || "Experience record updated successfully.",
          },
        });

        return;
      }

      const response = await createAdminExperience(
        accessToken,
        experiencePayload,
      );

      navigate("/admin/experience", {
        replace: true,
        state: {
          successMessage:
            response.message || "Experience record created successfully.",
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
            Loading Experience editor...
          </p>
        </div>
      </main>
    );
  }

  if (loadError || hasMissingExperienceId) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
            !
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Experience Error
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Experience editor could not be opened
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            {hasMissingExperienceId
              ? "Experience ID is required."
              : loadError}
          </p>

          <Link
            to="/admin/experience"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Return to Experience
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/experience"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
        >
          <span aria-hidden="true">←</span>
          Back to Experience
        </Link>

        <div className="mt-6 rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
            Experience Management
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {isEditMode
              ? `Edit ${experience?.jobTitle || "Experience"}`
              : "Add New Experience"}
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            {isEditMode
              ? "Update the organization, role, employment timeline, responsibilities, achievements, expertise, links and publishing controls."
              : "Create a professional Experience timeline record that can be managed dynamically from the Admin Panel."}
          </p>
        </div>

        <div className="mt-8">
          <ExperienceForm
            key={isEditMode ? experience?._id : "new-experience"}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={
              isEditMode ? "Update Experience" : "Create Experience"
            }
            accessToken={accessToken}
            onMediaUnauthorized={handleMediaUnauthorized}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminExperienceEditorPage;
