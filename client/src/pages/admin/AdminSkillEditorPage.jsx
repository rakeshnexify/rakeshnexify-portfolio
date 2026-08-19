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
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="max-w-5xl space-y-4"
          >
            <span className="sr-only">
              Loading Skill editor...
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
    hasMissingSkillId
  ) {
    return (
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="alert"
            className="max-w-2xl rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
              Skill Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Skill editor could not be opened
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasMissingSkillId
                ? "Skill ID is required."
                : loadError}
            </p>

            <Link
              to="/admin/skills"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              â† Return to Skills
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="max-w-5xl">
          <Link
            to="/admin/skills"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span aria-hidden="true">&larr;</span>

            Skills Management
          </Link>

          <header className="mt-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              {isEditMode
                ? "Update Skill"
                : "Create Skill"}
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isEditMode
                ? `Edit ${
                    skill?.name ||
                    "Skill"
                  }`
                : "Add a New Skill"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isEditMode
                ? "Update the Skill content, proficiency, experience, display order and publication controls."
                : "Create a reusable Skill that can be managed through the Admin CMS and published on the portfolio."}
            </p>
          </header>

          <div className="mt-6">
            <SkillForm
              key={
                isEditMode
                  ? skill?._id
                  : "new-skill"
              }
              initialValues={
                initialValues
              }
              onSubmit={
                handleSubmit
              }
              submitLabel={
                isEditMode
                  ? "Update Skill"
                  : "Create Skill"
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

export default AdminSkillEditorPage;
