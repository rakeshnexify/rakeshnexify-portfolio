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

function AdminEducationEditorPage({
  mode = "create",
}) {
  const navigate = useNavigate();

  const {
    id: educationId,
  } = useParams();

  const {
    accessToken,
    logout,
  } = useAdminAuth();

  const isEditMode =
    mode === "edit";

  const hasMissingEducationId =
    isEditMode &&
    !educationId;

  const [
    education,
    setEducation,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    isEditMode &&
      !hasMissingEducationId,
  );

  const [
    loadError,
    setLoadError,
  ] = useState("");

  useEffect(() => {
    if (
      !isEditMode ||
      !educationId ||
      !accessToken
    ) {
      return undefined;
    }

    const controller =
      new AbortController();

    async function loadEducation() {
      try {
        setIsLoading(true);
        setLoadError("");

        const educationData =
          await fetchAdminEducationById(
            accessToken,
            educationId,
            {
              signal:
                controller.signal,
            },
          );

        setEducation(
          educationData,
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
                  pathname: `/admin/education/${educationId}/edit`,
                },
              },
            },
          );

          return;
        }

        console.error(
          "Admin Education loading failed:",
          error,
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Education record could not be loaded.",
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    loadEducation();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    educationId,
    isEditMode,
    logout,
    navigate,
  ]);

  const initialValues =
    useMemo(() => {
      if (!isEditMode) {
        return defaultEducationFormValues;
      }

      return createEducationFormValues(
        education || {},
      );
    }, [
      education,
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
                ? `/admin/education/${educationId}/edit`
                : "/admin/education/new",
            },
          },
        },
      );
    }, [
      educationId,
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
              ? `/admin/education/${educationId}/edit`
              : "/admin/education/new",
          },
        },
      },
    );

    return true;
  }

  async function handleSubmit(
    educationPayload,
  ) {
    try {
      if (isEditMode) {
        const response =
          await updateAdminEducation(
            accessToken,
            educationId,
            educationPayload,
          );

        navigate(
          "/admin/education",
          {
            replace: true,
            state: {
              successMessage:
                response.message ||
                "Education record updated successfully.",
            },
          },
        );

        return;
      }

      const response =
        await createAdminEducation(
          accessToken,
          educationPayload,
        );

      navigate(
        "/admin/education",
        {
          replace: true,
          state: {
            successMessage:
              response.message ||
              "Education record created successfully.",
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
      <main className="rnx-admin-education-editor-v476 min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-6xl space-y-2"
          >
            <span className="sr-only">
              Loading Education editor...
            </span>

            <div className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />

            <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (
    loadError ||
    hasMissingEducationId
  ) {
    return (
      <main className="rnx-admin-education-editor-v476 min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/60 dark:bg-slate-900 sm:p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 dark:text-red-300">
              Education Error
            </p>

            <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Education editor could not be opened
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {hasMissingEducationId
                ? "Education ID is required."
                : loadError}
            </p>

            <Link
              to="/admin/education"
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              &larr; Return to Education
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rnx-admin-education-editor-v476 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3.5 sm:px-6 sm:py-4 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/admin/education"
            className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <span aria-hidden="true">
              &larr;
            </span>

            Education
          </Link>

          <header className="mt-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-600 dark:text-brand-300">
              {isEditMode
                ? "Update Education"
                : "Create Education"}
            </p>

            <h1 className="mt-0.5 break-words text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[22px]">
              {isEditMode
                ? `Edit ${
                    education?.degree ||
                    "Education"
                  }`
                : "Add New Education"}
            </h1>

            <p className="mt-0.5 max-w-3xl text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs sm:leading-5">
              {isEditMode
                ? "Update the institution, qualification, study timeline, content, links and publication controls."
                : "Create a professional Education timeline record managed dynamically through the Admin CMS."}
            </p>
          </header>

          <div className="mt-2">
            <EducationForm
              key={
                isEditMode
                  ? education?._id
                  : "new-education"
              }
              initialValues={
                initialValues
              }
              onSubmit={
                handleSubmit
              }
              submitLabel={
                isEditMode
                  ? "Update Education"
                  : "Create Education"
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

export default AdminEducationEditorPage;
