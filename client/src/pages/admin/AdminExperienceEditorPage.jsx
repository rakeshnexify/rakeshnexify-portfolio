import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

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

function AdminExperienceEditorPage({
  mode = "create",
}) {
  const navigate = useNavigate();

  const {
    id: experienceId,
  } = useParams();

  const {
    accessToken,
    logout,
  } = useAdminAuth();

  const isEditMode =
    mode === "edit";

  const hasMissingExperienceId =
    isEditMode &&
    !experienceId;

  const [
    experience,
    setExperience,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    isEditMode &&
      !hasMissingExperienceId,
  );

  const [
    loadError,
    setLoadError,
  ] = useState("");

  useEffect(() => {
    if (
      !isEditMode ||
      !experienceId ||
      !accessToken
    ) {
      return undefined;
    }

    const controller =
      new AbortController();

    async function loadExperience() {
      try {
        setIsLoading(true);
        setLoadError("");

        const experienceData =
          await fetchAdminExperienceById(
            accessToken,
            experienceId,
            {
              signal:
                controller.signal,
            },
          );

        setExperience(
          experienceData,
        );
      } catch (error) {
        if (
          controller.signal.aborted ||
          error?.name ===
            "AbortError"
        ) {
          return;
        }

        if (error?.status === 401) {
          logout();

          navigate(
            "/admin/login",
            {
              replace: true,
              state: {
                from: {
                  pathname: `/admin/experience/${experienceId}/edit`,
                },
              },
            },
          );

          return;
        }

        console.error(
          "Admin Experience loading failed:",
          error,
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Experience record could not be loaded.",
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    loadExperience();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    experienceId,
    isEditMode,
    logout,
    navigate,
  ]);

  const initialValues =
    useMemo(() => {
      if (!isEditMode) {
        return defaultExperienceFormValues;
      }

      return createExperienceFormValues(
        experience || {},
      );
    }, [
      experience,
      isEditMode,
    ]);

  const handleMediaUnauthorized =
    useCallback(() => {
      logout();

      navigate(
        "/admin/login",
        {
          replace: true,
          state: {
            from: {
              pathname: isEditMode
                ? `/admin/experience/${experienceId}/edit`
                : "/admin/experience/new",
            },
          },
        },
      );
    }, [
      experienceId,
      isEditMode,
      logout,
      navigate,
    ]);

  function handleAuthenticationError(
    error,
  ) {
    if (error?.status !== 401) {
      return false;
    }

    logout();

    navigate(
      "/admin/login",
      {
        replace: true,
        state: {
          from: {
            pathname: isEditMode
              ? `/admin/experience/${experienceId}/edit`
              : "/admin/experience/new",
          },
        },
      },
    );

    return true;
  }

  async function handleSubmit(
    experiencePayload,
  ) {
    try {
      if (isEditMode) {
        const response =
          await updateAdminExperience(
            accessToken,
            experienceId,
            experiencePayload,
          );

        navigate(
          "/admin/experience",
          {
            replace: true,
            state: {
              successMessage:
                response.message ||
                "Experience record updated successfully.",
            },
          },
        );

        return;
      }

      const response =
        await createAdminExperience(
          accessToken,
          experiencePayload,
        );

      navigate(
        "/admin/experience",
        {
          replace: true,
          state: {
            successMessage:
              response.message ||
              "Experience record created successfully.",
          },
        },
      );
    } catch (error) {
      const wasAuthenticationError =
        handleAuthenticationError(
          error,
        );

      if (
        !wasAuthenticationError
      ) {
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
            <span className="sr-only">Loading Experience editor...</span>
            <div className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
            <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (loadError || hasMissingExperienceId) {
    return (
      <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/60 dark:bg-slate-900 sm:p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 dark:text-red-300">
              Experience Error
            </p>

            <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Experience editor could not be opened
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {hasMissingExperienceId
                ? "Experience ID is required."
                : loadError}
            </p>

            <Link
              to="/admin/experience"
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <span aria-hidden="true">&larr;</span>
              <span className="ml-1.5">Return to Experience</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rnx-admin-experience-editor-v478 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3.5 sm:px-6 sm:py-4 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/admin/experience"
            className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <span aria-hidden="true">&larr;</span>
            Experience
          </Link>

          <header className="mt-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-600 dark:text-brand-300">
              {isEditMode ? "Edit Experience" : "New Experience"}
            </p>

            <h1 className="mt-0.5 break-words text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[22px]">
              {isEditMode
                ? `Edit ${experience?.jobTitle || "Experience"}`
                : "Add Experience"}
            </h1>

            <p className="mt-0.5 max-w-3xl text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">
              {isEditMode
                ? "Update role, timeline, work details and public display."
                : "Create a professional Experience timeline record."}
            </p>
          </header>

          <div className="mt-2">
            <ExperienceForm
              key={isEditMode ? experience?._id : "new-experience"}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              submitLabel={isEditMode ? "Update Experience" : "Create Experience"}
              accessToken={accessToken}
              onMediaUnauthorized={handleMediaUnauthorized}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminExperienceEditorPage;
