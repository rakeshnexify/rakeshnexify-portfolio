import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import CertificationAchievementForm from "../../components/admin/certification-achievements/CertificationAchievementForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import { fetchAdminEducation } from "../../services/adminEducationApi";
import { fetchAdminExperience } from "../../services/adminExperienceApi";
import {
  createAdminCertificationAchievement,
  fetchAdminCertificationAchievementById,
  updateAdminCertificationAchievement,
} from "../../services/adminCertificationAchievementsApi";
import {
  createCertificationAchievementFormValues,
  defaultCertificationAchievementFormValues,
} from "../../utils/certificationAchievementForm";

function AdminCertificationAchievementEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id: achievementId } = useParams();
  const { accessToken, logout } = useAdminAuth();

  const isEditMode = mode === "edit";
  const hasMissingAchievementId = isEditMode && !achievementId;

  const [achievement, setAchievement] = useState(null);
  const [educationOptions, setEducationOptions] = useState([]);
  const [experienceOptions, setExperienceOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(!hasMissingAchievementId);
  const [loadError, setLoadError] = useState("");

  const redirectToLogin = useCallback(
    (pathname) => {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: {
            pathname,
          },
        },
      });
    },
    [logout, navigate],
  );

  const editorPath = isEditMode
    ? `/admin/achievements/${achievementId}/edit`
    : "/admin/achievements/new";

  const handleMediaUnauthorized = useCallback(() => {
    redirectToLogin(editorPath);
  }, [editorPath, redirectToLogin]);

  useEffect(() => {
    if (!accessToken || hasMissingAchievementId) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadEditorData() {
      try {
        setIsLoading(true);
        setLoadError("");

        const achievementRequest =
          isEditMode && achievementId
            ? fetchAdminCertificationAchievementById(
                accessToken,
                achievementId,
                { signal: controller.signal },
              )
            : Promise.resolve(null);

        const [achievementData, educationResponse, experienceResponse] =
          await Promise.all([
            achievementRequest,
            fetchAdminEducation(
              accessToken,
              {},
              { signal: controller.signal },
            ),
            fetchAdminExperience(
              accessToken,
              {},
              { signal: controller.signal },
            ),
          ]);

        if (controller.signal.aborted) {
          return;
        }

        setAchievement(achievementData);
        setEducationOptions(educationResponse.educationRecords || []);
        setExperienceOptions(experienceResponse.experienceRecords || []);
      } catch (error) {
        if (controller.signal.aborted || error?.name === "AbortError") {
          return;
        }

        if (error?.status === 401) {
          redirectToLogin(editorPath);
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
        if (!controller.signal.aborted) {
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

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return defaultCertificationAchievementFormValues;
    }

    return createCertificationAchievementFormValues(achievement || {});
  }, [achievement, isEditMode]);

  function handleAuthenticationError(error) {
    if (error?.status !== 401) {
      return false;
    }

    redirectToLogin(editorPath);
    return true;
  }

  async function handleSubmit(achievementPayload) {
    try {
      if (isEditMode) {
        const response = await updateAdminCertificationAchievement(
          accessToken,
          achievementId,
          achievementPayload,
        );

        navigate("/admin/achievements", {
          replace: true,
          state: {
            successMessage:
              response.message ||
              "Certification / Achievement updated successfully.",
          },
        });

        return;
      }

      const response = await createAdminCertificationAchievement(
        accessToken,
        achievementPayload,
      );

      navigate("/admin/achievements", {
        replace: true,
        state: {
          successMessage:
            response.message ||
            "Certification / Achievement created successfully.",
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
            Loading Certifications & Achievements editor...
          </p>
        </div>
      </main>
    );
  }

  if (loadError || hasMissingAchievementId) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
            !
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Editor Error
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Certification / Achievement editor could not be opened
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            {hasMissingAchievementId
              ? "Certification / Achievement ID is required."
              : loadError}
          </p>

          <Link
            to="/admin/achievements"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Return to Certifications & Achievements
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/achievements"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
        >
          <span aria-hidden="true">←</span>
          Back to Certifications & Achievements
        </Link>

        <div className="mt-6 rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
            Credentials & Recognition
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {isEditMode
              ? `Edit ${achievement?.title || "Record"}`
              : "Add Certification / Achievement"}
          </h1>

          <p className="mt-4 max-w-3xl leading-7 text-slate-400">
            {isEditMode
              ? "Update credential identity, dates, evidence, optional Education or Experience relation, and publishing controls."
              : "Create an independently publishable certification, license, award or achievement without duplicating existing Education or Experience records."}
          </p>
        </div>

        <div className="mt-8">
          <CertificationAchievementForm
            key={isEditMode ? achievement?._id : "new-achievement"}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={
              isEditMode ? "Update Record" : "Create Record"
            }
            accessToken={accessToken}
            educationOptions={educationOptions}
            experienceOptions={experienceOptions}
            onMediaUnauthorized={handleMediaUnauthorized}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminCertificationAchievementEditorPage;
