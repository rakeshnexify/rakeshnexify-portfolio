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
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="status"
            aria-live="polite"
            className="mx-auto max-w-5xl space-y-4"
          >
            <span className="sr-only">
              Loading Team member editor...
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
    (isEditMode && hasMissingTeamMemberId)
  ) {
    return (
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div
            role="alert"
            className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
              Team Member Error
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Team member editor could not be opened
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasMissingTeamMemberId
                ? "Team member ID is required."
                : loadError}
            </p>

            <Link
              to="/admin/team"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              &larr; Return to Team members
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
            to="/admin/team"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            <span aria-hidden="true">
              &larr;
            </span>

            Team Management
          </Link>

          <header className="mt-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Team Management
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {isEditMode
                ? `Edit ${teamMember?.name || "Team Member"}`
                : "Add New Team Member"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {isEditMode
                ? "Update the member profile, relationships, visibility, availability and SEO information."
                : "Create a complete Team member profile and connect it with related portfolio content."}
            </p>
          </header>

          <div className="mt-6">
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
        </div>
      </section>
    </main>
  );
}

export default AdminTeamMemberEditorPage;
