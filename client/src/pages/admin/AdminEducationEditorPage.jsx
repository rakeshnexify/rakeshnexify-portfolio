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
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="max-w-5xl space-y-4"
          >
            <span className="sr-only">
              Loading Education editor...
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
    hasMissingEducationId
  ) {
    return (
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="alert"
            className="max-w-2xl rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
              Education Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Education editor could not be opened
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasMissingEducationId
                ? "Education ID is required."
                : loadError}
            </p>

            <Link
              to="/admin/education"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              &larr; Return to Education
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
            to="/admin/education"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span aria-hidden="true">
              &larr;
            </span>

            Education Management
          </Link>

          <header className="mt-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              {isEditMode
                ? "Update Education"
                : "Create Education"}
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isEditMode
                ? `Edit ${
                    education?.degree ||
                    "Education"
                  }`
                : "Add New Education"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isEditMode
                ? "Update the institution, qualification, study timeline, content, links and publication controls."
                : "Create a professional Education timeline record managed dynamically through the Admin CMS."}
            </p>
          </header>

          <div className="mt-6">
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
