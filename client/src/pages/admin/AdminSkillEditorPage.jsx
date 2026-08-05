import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

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

function AdminSkillEditorPage({ mode = "create" }) {
  const navigate = useNavigate();
  const { id: skillId } = useParams();
  const { accessToken, admin, logout } = useAdminAuth();

  const isEditMode = mode === "edit";
  const hasMissingSkillId = isEditMode && !skillId;

  const [skill, setSkill] = useState(null);
  const [isLoading, setIsLoading] = useState(
    isEditMode && !hasMissingSkillId,
  );
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!isEditMode || !skillId || !accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadSkill() {
      try {
        setIsLoading(true);
        setLoadError("");

        const skillData = await fetchAdminSkillById(accessToken, skillId, {
          signal: controller.signal,
        });

        setSkill(skillData);
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
                pathname: `/admin/skills/${skillId}/edit`,
              },
            },
          });

          return;
        }

        console.error("Admin Skill loading failed:", error);

        setLoadError(
          error instanceof Error ? error.message : "Skill could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadSkill();

    return () => {
      controller.abort();
    };
  }, [accessToken, isEditMode, logout, navigate, skillId]);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return defaultSkillFormValues;
    }

    return createSkillFormValues(skill || {});
  }, [isEditMode, skill]);

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
            ? `/admin/skills/${skillId}/edit`
            : "/admin/skills/new",
        },
      },
    });

    return true;
  }

  async function handleSubmit(skillPayload) {
    try {
      if (isEditMode) {
        const response = await updateAdminSkill(
          accessToken,
          skillId,
          skillPayload,
        );

        navigate("/admin/skills", {
          replace: true,
          state: {
            successMessage:
              response.message || "Skill updated successfully.",
          },
        });

        return;
      }

      const response = await createAdminSkill(accessToken, skillPayload);

      navigate("/admin/skills", {
        replace: true,
        state: {
          successMessage: response.message || "Skill created successfully.",
        },
      });
    } catch (error) {
      const wasAuthenticationError = handleAuthenticationError(error);

      if (!wasAuthenticationError) {
        throw error;
      }
    }
  }

  function handleLogout() {
    logout();

    navigate("/admin/login", {
      replace: true,
    });
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="text-center">
          <div className="mx-auto size-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />

          <p className="mt-5 text-sm font-semibold text-slate-600">
            Loading Skill editor...
          </p>
        </div>
      </main>
    );
  }

  if (loadError || hasMissingSkillId) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
            !
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Skill Error
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Skill editor could not be opened
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            {hasMissingSkillId ? "Skill ID is required." : loadError}
          </p>

          <Link
            to="/admin/skills"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Return to Skills
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <Link
            to="/admin/dashboard"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-600 font-extrabold text-white">
              RN
            </div>

            <div className="min-w-0">
              <p className="truncate font-extrabold text-slate-950">
                RakeshNexify
              </p>

              <p className="truncate text-xs font-medium text-slate-500">
                Skill Editor
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-slate-500 md:inline">
              {admin?.name}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/skills"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
        >
          <span aria-hidden="true">←</span>
          Back to Skills
        </Link>

        <div className="mt-6 rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
            Skills Management
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {isEditMode
              ? `Edit ${skill?.name || "Skill"}`
              : "Add New Skill"}
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            {isEditMode
              ? "Update the Skill content, proficiency, experience, display order and publishing controls."
              : "Create a reusable Skill that can be managed from the Admin Panel and displayed dynamically on the portfolio."}
          </p>
        </div>

        <div className="mt-8">
          <SkillForm
            key={isEditMode ? skill?._id : "new-skill"}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={isEditMode ? "Update Skill" : "Create Skill"}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminSkillEditorPage;
