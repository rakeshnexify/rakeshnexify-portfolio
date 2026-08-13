import { useCallback, useEffect, useMemo, useState } from "react";

import { Link, useNavigate, useParams } from "react-router";

import TeamMemberForm from "../../components/admin/team/TeamMemberForm";
import useAdminAuth from "../../hooks/useAdminAuth";

import {
  createAdminTeamMember,
  fetchAdminTeamMemberById,
  updateAdminTeamMember,
} from "../../services/adminTeamMembersApi";

import { fetchAdminCompanies } from "../../services/adminCompaniesApi";
import { fetchAdminProjects } from "../../services/adminProjectsApi";
import { fetchAdminServices } from "../../services/adminServicesApi";

import {
  createTeamMemberFormFromData,
  defaultTeamMemberFormValues,
} from "../../utils/teamMemberForm";

function AdminTeamMemberEditorPage({ mode = "create" }) {
  const navigate = useNavigate();

  const { id: teamMemberId } = useParams();

  const { accessToken, logout } = useAdminAuth();

  const isEditMode = mode === "edit";

  const hasMissingTeamMemberId = isEditMode && !teamMemberId;

  const [teamMember, setTeamMember] = useState(null);

  const [projectOptions, setProjectOptions] = useState([]);

  const [companyOptions, setCompanyOptions] = useState([]);

  const [serviceOptions, setServiceOptions] = useState([]);

  const [isLoading, setIsLoading] = useState(
    !hasMissingTeamMemberId,
  );

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!accessToken || hasMissingTeamMemberId) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadEditorData() {
      try {
        const [
          teamMemberData,
          projectsResponse,
          companiesResponse,
          servicesResponse,
        ] = await Promise.all([
          isEditMode
            ? fetchAdminTeamMemberById(
                accessToken,
                teamMemberId,
                {
                  signal: controller.signal,
                },
              )
            : Promise.resolve(null),

          fetchAdminProjects(
            accessToken,
            {},
            {
              signal: controller.signal,
            },
          ),

          fetchAdminCompanies(
            accessToken,
            {},
            {
              signal: controller.signal,
            },
          ),

          fetchAdminServices(
            accessToken,
            {},
            {
              signal: controller.signal,
            },
          ),
        ]);

        setTeamMember(teamMemberData);

        setProjectOptions(projectsResponse.projects);

        setCompanyOptions(companiesResponse.companies);

        setServiceOptions(servicesResponse.services);

        setLoadError("");
      } catch (error) {
        if (
          controller.signal.aborted ||
          error?.name === "AbortError"
        ) {
          return;
        }

        if (error?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,

            state: {
              from: {
                pathname: isEditMode
                  ? `/admin/team/${teamMemberId}/edit`
                  : "/admin/team/new",
              },
            },
          });

          return;
        }

        console.error(
          "Admin Team member editor loading failed:",
          error,
        );

        setLoadError(
          error instanceof Error
            ? error.message
            : "Team member editor data could not be loaded.",
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
    hasMissingTeamMemberId,
    isEditMode,
    logout,
    navigate,
    teamMemberId,
  ]);

  const initialValues = useMemo(() => {
    if (!isEditMode) {
      return defaultTeamMemberFormValues;
    }

    return createTeamMemberFormFromData(teamMember || {});
  }, [isEditMode, teamMember]);

  const handleMediaUnauthorized = useCallback(() => {
    logout();

    navigate("/admin/login", {
      replace: true,

      state: {
        from: {
          pathname: isEditMode
            ? `/admin/team/${teamMemberId}/edit`
            : "/admin/team/new",
        },
      },
    });
  }, [isEditMode, logout, navigate, teamMemberId]);

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
            ? `/admin/team/${teamMemberId}/edit`
            : "/admin/team/new",
        },
      },
    });

    return true;
  }

  async function handleSubmit(teamMemberPayload) {
    try {
      if (isEditMode) {
        const response = await updateAdminTeamMember(
          accessToken,
          teamMemberId,
          teamMemberPayload,
        );

        navigate("/admin/team", {
          replace: true,

          state: {
            successMessage:
              response.message ||
              "Team member updated successfully.",
          },
        });

        return;
      }

      const response = await createAdminTeamMember(
        accessToken,
        teamMemberPayload,
      );

      navigate("/admin/team", {
        replace: true,

        state: {
          successMessage:
            response.message ||
            "Team member created successfully.",
        },
      });
    } catch (error) {
      const wasAuthenticationError =
        handleAuthenticationError(error);

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
            Loading Team member editor...
          </p>
        </div>
      </main>
    );
  }

  if (
    loadError ||
    (isEditMode && hasMissingTeamMemberId)
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
            !
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Team Member Error
          </p>

          <h1 className="mt-3 text-2xl font-bold text-slate-950">
            Team member editor could not be opened
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            {hasMissingTeamMemberId
              ? "Team member ID is required."
              : loadError}
          </p>

          <Link
            to="/admin/team"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Return to Team members
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/admin/team"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
        >
          <span aria-hidden="true">←</span>
          Back to Team members
        </Link>

        <div className="mt-6 rounded-3xl bg-slate-950 p-7 text-white sm:p-9">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
            Team Management
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            {isEditMode
              ? `Edit ${teamMember?.name || "Team Member"}`
              : "Add New Team Member"}
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            {isEditMode
              ? "Update the member profile, relationships, visibility, availability and SEO information."
              : "Create a complete Team member profile and connect it with related portfolio content."}
          </p>
        </div>

        <div className="mt-8">
          <TeamMemberForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            projectOptions={projectOptions}
            companyOptions={companyOptions}
            serviceOptions={serviceOptions}
            submitLabel={
              isEditMode
                ? "Update Team Member"
                : "Create Team Member"
            }
            accessToken={accessToken}
            onMediaUnauthorized={handleMediaUnauthorized}
          />
        </div>
      </section>
    </main>
  );
}

export default AdminTeamMemberEditorPage;
