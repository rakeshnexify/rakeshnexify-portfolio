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

import CertificationAchievementForm from "../../components/admin/certification-achievements/CertificationAchievementForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  createAdminCertificationAchievement,
  fetchAdminCertificationAchievementById,
  updateAdminCertificationAchievement,
} from "../../services/adminCertificationAchievementsApi";
import { fetchAdminEducation } from "../../services/adminEducationApi";
import { fetchAdminExperience } from "../../services/adminExperienceApi";
import {
  createCertificationAchievementFormValues,
  defaultCertificationAchievementFormValues,
} from "../../utils/certificationAchievementForm";

function AdminCertificationAchievementEditorPage({
  mode = "create",
}) {
  const navigate = useNavigate();

  const {
    id: achievementId,
  } = useParams();

  const {
    accessToken,
    logout,
  } = useAdminAuth();

  const isEditMode =
    mode === "edit";

  const hasMissingAchievementId =
    isEditMode &&
    !achievementId;

  const [
    achievement,
    setAchievement,
  ] = useState(null);

  const [
    educationOptions,
    setEducationOptions,
  ] = useState([]);

  const [
    experienceOptions,
    setExperienceOptions,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    !hasMissingAchievementId,
  );

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const redirectToLogin =
    useCallback(
      (pathname) => {
        logout();

        navigate(
          "/admin/login",
          {
            replace: true,
            state: {
              from: {
                pathname,
              },
            },
          },
        );
      },
      [
        logout,
        navigate,
      ],
    );

  const editorPath =
    isEditMode
      ? `/admin/achievements/${achievementId}/edit`
      : "/admin/achievements/new";

  const handleMediaUnauthorized =
    useCallback(() => {
      redirectToLogin(
        editorPath,
      );
    }, [
      editorPath,
      redirectToLogin,
    ]);

  useEffect(() => {
    if (
      !accessToken ||
      hasMissingAchievementId
    ) {
      return undefined;
    }

    const controller =
      new AbortController();

    async function loadEditorData() {
      try {
        setIsLoading(true);
        setLoadError("");

        const achievementRequest =
          isEditMode &&
          achievementId
            ? fetchAdminCertificationAchievementById(
                accessToken,
                achievementId,
                {
                  signal:
                    controller.signal,
                },
              )
            : Promise.resolve(
                null,
              );

        const [
          achievementData,
          educationResponse,
          experienceResponse,
        ] = await Promise.all([
          achievementRequest,
          fetchAdminEducation(
            accessToken,
            {},
            {
              signal:
                controller.signal,
            },
          ),
          fetchAdminExperience(
            accessToken,
            {},
            {
              signal:
                controller.signal,
            },
          ),
        ]);

        if (
          controller.signal.aborted
        ) {
          return;
        }

        setAchievement(
          achievementData,
        );

        setEducationOptions(
          educationResponse.educationRecords ||
            [],
        );

        setExperienceOptions(
          experienceResponse.experienceRecords ||
            [],
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
          redirectToLogin(
            editorPath,
          );

          return;
        }

        console.error(
          "Admin Certification / Achievement editor loading failed:",
          error,
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Certification / Achievement editor data could not be loaded.",
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    loadEditorData();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    achievementId,
    editorPath,
    hasMissingAchievementId,
    isEditMode,
    redirectToLogin,
  ]);

  const initialValues =
    useMemo(() => {
      if (!isEditMode) {
        return defaultCertificationAchievementFormValues;
      }

      return createCertificationAchievementFormValues(
        achievement || {},
      );
    }, [
      achievement,
      isEditMode,
    ]);

  function handleAuthenticationError(
    error,
  ) {
    if (error?.status !== 401) {
      return false;
    }

    redirectToLogin(
      editorPath,
    );

    return true;
  }

  async function handleSubmit(
    achievementPayload,
  ) {
    try {
      if (isEditMode) {
        const response =
          await updateAdminCertificationAchievement(
            accessToken,
            achievementId,
            achievementPayload,
          );

        navigate(
          "/admin/achievements",
          {
            replace: true,
            state: {
              successMessage:
                response.message ||
                "Certification / Achievement updated successfully.",
            },
          },
        );

        return;
      }

      const response =
        await createAdminCertificationAchievement(
          accessToken,
          achievementPayload,
        );

      navigate(
        "/admin/achievements",
        {
          replace: true,
          state: {
            successMessage:
              response.message ||
              "Certification / Achievement created successfully.",
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
              Loading Certifications & Achievements editor...
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
    hasMissingAchievementId
  ) {
    return (
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="alert"
            className="max-w-2xl rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
              Editor Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Certification / Achievement editor could not be opened
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasMissingAchievementId
                ? "Certification / Achievement ID is required."
                : loadError}
            </p>

            <Link
              to="/admin/achievements"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              &larr; Return to Certifications & Achievements
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
            to="/admin/achievements"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span aria-hidden="true">
              &larr;
            </span>

            Certifications & Achievements Management
          </Link>

          <header className="mt-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Credentials & Recognition
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isEditMode
                ? `Edit ${
                    achievement?.title ||
                    "Record"
                  }`
                : "Add Certification / Achievement"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isEditMode
                ? "Update credential identity, dates, evidence, optional Education or Experience relation, and publication controls."
                : "Create an independently publishable certification, license, award or achievement without duplicating Education or Experience records."}
            </p>
          </header>

          <div className="mt-6">
            <CertificationAchievementForm
              key={
                isEditMode
                  ? achievement?._id
                  : "new-achievement"
              }
              initialValues={
                initialValues
              }
              onSubmit={
                handleSubmit
              }
              submitLabel={
                isEditMode
                  ? "Update Record"
                  : "Create Record"
              }
              accessToken={
                accessToken
              }
              educationOptions={
                educationOptions
              }
              experienceOptions={
                experienceOptions
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

export default AdminCertificationAchievementEditorPage;
