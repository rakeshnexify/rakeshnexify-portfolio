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
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="max-w-5xl space-y-4"
          >
            <span className="sr-only">
              Loading Experience editor...
            </span>

            <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />

            <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (
    loadError ||
    hasMissingExperienceId
  ) {
    return (
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="alert"
            className="max-w-2xl rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
              Experience Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Experience editor could not be opened
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasMissingExperienceId
                ? "Experience ID is required."
                : loadError}
            </p>

            <Link
              to="/admin/experience"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              &larr; Return to Experience
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
            to="/admin/experience"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span aria-hidden="true">
              &larr;
            </span>

            Experience Management
          </Link>

          <header className="mt-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              {isEditMode
                ? "Update Experience"
                : "Create Experience"}
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isEditMode
                ? `Edit ${
                    experience?.jobTitle ||
                    "Experience"
                  }`
                : "Add New Experience"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isEditMode
                ? "Update the organization, role, employment timeline, responsibilities, achievements, expertise, links and publication controls."
                : "Create a professional Experience timeline record managed dynamically through the Admin CMS."}
            </p>
          </header>

          <div className="mt-6">
            <ExperienceForm
              key={
                isEditMode
                  ? experience?._id
                  : "new-experience"
              }
              initialValues={
                initialValues
              }
              onSubmit={
                handleSubmit
              }
              submitLabel={
                isEditMode
                  ? "Update Experience"
                  : "Create Experience"
              }
              accessToken={
                accessToken
              }
              onMediaUnauthorized={
                handleMediaUnauthorized
              }
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminExperienceEditorPage;
