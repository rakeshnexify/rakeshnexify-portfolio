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
      <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 lg:px-8">
          <div role="status" aria-live="polite" className="mx-auto max-w-6xl space-y-2">
            <span className="sr-only">Loading Certifications & Achievements editor...</span>
            <div className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
            <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (loadError || hasMissingAchievementId) {
    return (
      <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 lg:px-8">
          <div role="alert" className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/60 dark:bg-slate-900 sm:p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 dark:text-red-300">
              Editor Error
            </p>
            <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Certification / Achievement editor could not be opened
            </h1>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {hasMissingAchievementId
                ? "Certification / Achievement ID is required."
                : loadError}
            </p>
            <Link
              to="/admin/achievements"
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              &larr; Return to Certifications & Achievements
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rnx-admin-certification-achievement-editor-v480 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3.5 sm:px-6 sm:py-4 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/admin/achievements"
            className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <span aria-hidden="true">&larr;</span>
            Certifications & Achievements
          </Link>

          <header className="mt-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-600 dark:text-brand-300">
              Credentials & Recognition
            </p>
            <h1 className="mt-0.5 break-words text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[22px]">
              {isEditMode
                ? `Edit ${achievement?.title || "Record"}`
                : "Add Certification / Achievement"}
            </h1>
            <p className="mt-0.5 max-w-3xl text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">
              {isEditMode
                ? "Update credential details, evidence, relations and public display."
                : "Create a professional credential, award or achievement record."}
            </p>
          </header>

          <div className="mt-2">
            <CertificationAchievementForm
              key={isEditMode ? achievement?._id : "new-achievement"}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              submitLabel={isEditMode ? "Update Record" : "Create Record"}
              accessToken={accessToken}
              educationOptions={educationOptions}
              experienceOptions={experienceOptions}
              onMediaUnauthorized={handleMediaUnauthorized}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminCertificationAchievementEditorPage;
