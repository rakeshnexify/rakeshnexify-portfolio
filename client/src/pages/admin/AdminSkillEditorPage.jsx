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

import SkillForm from "../../components/admin/skills/SkillForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  createAdminSkill,
  fetchAdminSkillById,
  updateAdminSkill,
} from "../../services/adminSkillsApi";
import {
  createSkillFormValues,
  defaultSkillFormValues,
} from "../../utils/skillForm";

function AdminSkillEditorPage({
  mode = "create",
}) {
  const navigate = useNavigate();

  const {
    id: skillId,
  } = useParams();

  const {
    accessToken,
    logout,
  } = useAdminAuth();

  const isEditMode =
    mode === "edit";

  const hasMissingSkillId =
    isEditMode &&
    !skillId;

  const [
    skill,
    setSkill,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    isEditMode &&
      !hasMissingSkillId,
  );

  const [
    loadError,
    setLoadError,
  ] = useState("");

  useEffect(() => {
    if (
      !isEditMode ||
      !skillId ||
      !accessToken
    ) {
      return undefined;
    }

    const controller =
      new AbortController();

    async function loadSkill() {
      try {
        setIsLoading(true);
        setLoadError("");

        const skillData =
          await fetchAdminSkillById(
            accessToken,
            skillId,
            {
              signal:
                controller.signal,
            },
          );

        setSkill(skillData);
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
                  pathname: `/admin/skills/${skillId}/edit`,
                },
              },
            },
          );

          return;
        }

        console.error(
          "Admin Skill loading failed:",
          error,
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Skill could not be loaded.",
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    }

    loadSkill();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    isEditMode,
    logout,
    navigate,
    skillId,
  ]);

  const initialValues =
    useMemo(() => {
      if (!isEditMode) {
        return defaultSkillFormValues;
      }

      return createSkillFormValues(
        skill || {},
      );
    }, [
      isEditMode,
      skill,
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
                ? `/admin/skills/${skillId}/edit`
                : "/admin/skills/new",
            },
          },
        },
      );
    }, [
      isEditMode,
      logout,
      navigate,
      skillId,
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
              ? `/admin/skills/${skillId}/edit`
              : "/admin/skills/new",
          },
        },
      },
    );

    return true;
  }

  async function handleSubmit(
    skillPayload,
  ) {
    try {
      if (isEditMode) {
        const response =
          await updateAdminSkill(
            accessToken,
            skillId,
            skillPayload,
          );

        navigate(
          "/admin/skills",
          {
            replace: true,
            state: {
              successMessage:
                response.message ||
                "Skill updated successfully.",
            },
          },
        );

        return;
      }

      const response =
        await createAdminSkill(
          accessToken,
          skillPayload,
        );

      navigate(
        "/admin/skills",
        {
          replace: true,
          state: {
            successMessage:
              response.message ||
              "Skill created successfully.",
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
        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-6xl space-y-2"
          >
            <span className="sr-only">Loading Skill editor...</span>

            <div className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
            <div className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none" />
          </div>
        </section>
      </main>
    );
  }

  if (loadError || hasMissingSkillId) {
    return (
      <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/60 dark:bg-slate-900 sm:p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-600 dark:text-red-300">
              Skill Error
            </p>

            <h1 className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
              Skill editor could not be opened
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {hasMissingSkillId ? "Skill ID is required." : loadError}
            </p>

            <Link
              to="/admin/skills"
              className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-brand-700 dark:hover:text-brand-300"
            >
              <span aria-hidden="true">&larr;</span>
              <span className="ml-1.5">Return to Skills</span>
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="rnx-admin-skill-editor-v473 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-3.5 sm:px-6 sm:py-4 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/admin/skills"
            className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300"
          >
            <span aria-hidden="true">&larr;</span>
            Skills
          </Link>

          <header className="mt-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-600 dark:text-brand-300">
              {isEditMode ? "Edit Skill" : "New Skill"}
            </p>

            <h1 className="mt-0.5 break-words text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[22px]">
              {isEditMode ? `Edit ${skill?.name || "Skill"}` : "Add Skill"}
            </h1>

            <p className="mt-0.5 max-w-3xl text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs sm:leading-5">
              {isEditMode
                ? "Update skill details, experience, visual identity and publishing controls."
                : "Create a reusable portfolio skill with compact CMS controls."}
            </p>
          </header>

          <div className="mt-2.5">
            <SkillForm
              key={isEditMode ? skill?._id : "new-skill"}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              submitLabel={isEditMode ? "Update Skill" : "Create Skill"}
              accessToken={accessToken}
              onMediaUnauthorized={handleMediaUnauthorized}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminSkillEditorPage;
