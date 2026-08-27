import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  deleteAdminTeamMember,
  fetchAdminTeamMembers,
  updateAdminTeamMember,
} from "../../services/adminTeamMembersApi";

const initialFilters = {
  search: "",
  professionalRole: "",
  status: "",
  availabilityStatus: "",
  visibility: "all",
  featured: "all",
};

const memberStatusLabels = {
  active: "Active",
  inactive: "Inactive",
  former: "Former Member",
  archived: "Archived",
};

const memberStatusStyles = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-amber-50 text-amber-700",
  former: "bg-slate-100 text-slate-700",
  archived: "bg-red-50 text-red-700",
};

const availabilityLabels = {
  available: "Available",
  limited: "Limited Availability",
  unavailable: "Unavailable",
  "on-leave": "On Leave",
};

const availabilityStyles = {
  available: "bg-emerald-50 text-emerald-700",
  limited: "bg-amber-50 text-amber-700",
  unavailable: "bg-red-50 text-red-700",
  "on-leave": "bg-blue-50 text-blue-700",
};



function createApiFilters(filters) {
  const apiFilters = {
    search: filters.search.trim(),
    professionalRole: filters.professionalRole.trim(),
    status: filters.status,
    availabilityStatus: filters.availabilityStatus,
  };

  if (filters.visibility === "visible") {
    apiFilters.isVisible = true;
  }

  if (filters.visibility === "hidden") {
    apiFilters.isVisible = false;
  }

  if (filters.featured === "featured") {
    apiFilters.isFeatured = true;
  }

  if (filters.featured === "standard") {
    apiFilters.isFeatured = false;
  }

  return apiFilters;
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "TM";
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function AdminTeamMembersPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { accessToken, admin, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({
    ...initialFilters,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    ...initialFilters,
  });

  const [teamMembers, setTeamMembers] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionTeamMemberId, setActionTeamMemberId] = useState("");

  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || location.state?.message || "",
  );

  useEffect(() => {
    if (!location.state?.successMessage && !location.state?.message) {
      return;
    }

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.state, navigate]);

  const apiFilters = useMemo(
    () => createApiFilters(appliedFilters),
    [appliedFilters],
  );

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadTeamMembers() {
      setIsLoading(true);

      try {
        const response = await fetchAdminTeamMembers(accessToken, apiFilters, {
          signal: controller.signal,
        });

        setTeamMembers(response.teamMembers);
        setResultCount(response.count);
        setError("");
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        if (requestError?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,
            state: {
              from: location.pathname,
              message: "Your Admin session expired. Please sign in again.",
            },
          });

          return;
        }

        setTeamMembers([]);
        setResultCount(0);

        setError(
          requestError?.message ||
            "Team members could not be loaded. Please try again.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadTeamMembers();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    apiFilters,
    location.pathname,
    logout,
    navigate,
    refreshKey,
  ]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function handleFilterSubmit(event) {
    event.preventDefault();

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    setAppliedFilters({
      ...formFilters,
    });
  }

  function handleClearFilters() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    setFormFilters({
      ...initialFilters,
    });

    setAppliedFilters({
      ...initialFilters,
    });
  }

  function handleRefresh() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    setRefreshKey((currentKey) => currentKey + 1);
  }

  function handleTeamMemberActionError(requestError) {
    if (requestError?.status === 401) {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: location.pathname,
          message: "Your Admin session expired. Please sign in again.",
        },
      });

      return;
    }

    if (requestError?.status === 403) {
      setError(
        requestError.message ||
          "Your Admin role cannot perform this Team action.",
      );

      return;
    }

    setError(
      requestError?.message || "The Team member action could not be completed.",
    );
  }

  async function handleToggleVisibility(teamMember) {
    if (!teamMember?._id || actionTeamMemberId) {
      return;
    }

    try {
      setActionTeamMemberId(teamMember._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminTeamMember(
        accessToken,
        teamMember._id,
        {
          isVisible: !teamMember.isVisible,
        },
      );

      setSuccessMessage(
        response.teamMember.isVisible
          ? `"${response.teamMember.name}" is now visible on the portfolio.`
          : `"${response.teamMember.name}" is now hidden from the portfolio.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleTeamMemberActionError(requestError);
    } finally {
      setActionTeamMemberId("");
    }
  }

  async function handleToggleFeatured(teamMember) {
    if (!teamMember?._id || actionTeamMemberId) {
      return;
    }

    try {
      setActionTeamMemberId(teamMember._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminTeamMember(
        accessToken,
        teamMember._id,
        {
          isFeatured: !teamMember.isFeatured,
        },
      );

      setSuccessMessage(
        response.teamMember.isFeatured
          ? `"${response.teamMember.name}" is now featured.`
          : `"${response.teamMember.name}" is now a standard Team member.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleTeamMemberActionError(requestError);
    } finally {
      setActionTeamMemberId("");
    }
  }

  async function handleDeleteTeamMember(teamMember) {
    if (!teamMember?._id || actionTeamMemberId) {
      return;
    }

    const isConfirmed = window.confirm(
      `Permanently delete "${teamMember.name}"?\n\nThis action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setActionTeamMemberId(teamMember._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminTeamMember(accessToken, teamMember._id);

      setSuccessMessage(
        `"${response.deletedTeamMember.name}" was permanently deleted.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleTeamMemberActionError(requestError);
    } finally {
      setActionTeamMemberId("");
    }
  }

  const canDeleteTeamMembers = ["super-admin", "admin"].includes(admin?.role);


  return (
    <main className="admin-catalog-page rnx-admin-team-compact-v467 min-h-screen">
      <section className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="admin-catalog-eyebrow text-[10px] font-bold uppercase tracking-[0.16em]">
              People
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Team Members</h1>
            <p className="mt-1 max-w-2xl text-xs leading-5">
              Manage Team profiles, roles, availability, visibility and display priority.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="admin-catalog-count-pill rounded-lg px-3 py-2 text-[11px] font-semibold">
              {isLoading ? "Loading..." : `${resultCount} Member${resultCount === 1 ? "" : "s"}`}
            </span>
            <Link
              className="admin-catalog-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
              to="/admin/team/new"
            >
              Add Team Member
            </Link>
          </div>
        </header>

        <form className="admin-catalog-toolbar mt-4 rounded-xl p-3" onSubmit={handleFilterSubmit}>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_180px_180px_auto]">
            <input
              className="admin-catalog-input !mt-0 !min-h-10 !rounded-lg w-full px-3 text-sm"
              id="team-member-search"
              name="search"
              onChange={handleFilterChange}
              placeholder="Search name, role, position, skill or tool..."
              type="search"
              value={formFilters.search}
              aria-label="Search Team members"
            />
            <select
              className="admin-catalog-input !mt-0 !min-h-10 !rounded-lg w-full px-3 text-sm"
              id="team-member-visibility"
              name="visibility"
              onChange={handleFilterChange}
              value={formFilters.visibility}
              aria-label="Public visibility"
            >
              <option value="all">All visibility</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
            <select
              className="admin-catalog-input !mt-0 !min-h-10 !rounded-lg w-full px-3 text-sm"
              id="team-member-status"
              name="status"
              onChange={handleFilterChange}
              value={formFilters.status}
              aria-label="Member status"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="former">Former Member</option>
              <option value="archived">Archived</option>
            </select>
            <div className="flex gap-2">
              <button
                className="admin-catalog-primary-button inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-xs font-bold"
                disabled={isLoading || Boolean(actionTeamMemberId)}
                type="submit"
              >
                Apply
              </button>
              <button
                className="admin-catalog-secondary-button inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold"
                disabled={isLoading || Boolean(actionTeamMemberId)}
                onClick={handleClearFilters}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          <details className="mt-2">
            <summary className="admin-catalog-secondary-button inline-flex min-h-8 cursor-pointer list-none items-center rounded-lg px-3 text-[11px] font-semibold [&::-webkit-details-marker]:hidden">
              More Filters
            </summary>
            <div className="mt-2 grid gap-2 border-t border-slate-200 pt-2 dark:border-slate-800 md:grid-cols-3">
              <input
                className="admin-catalog-input !mt-0 !min-h-9 !rounded-lg w-full px-3 text-xs"
                id="team-member-professional-role"
                name="professionalRole"
                onChange={handleFilterChange}
                placeholder="Professional role..."
                type="text"
                value={formFilters.professionalRole}
                aria-label="Professional role"
              />
              <select
                className="admin-catalog-input !mt-0 !min-h-9 !rounded-lg w-full px-3 text-xs"
                id="team-member-availability"
                name="availabilityStatus"
                onChange={handleFilterChange}
                value={formFilters.availabilityStatus}
                aria-label="Availability"
              >
                <option value="">All availability</option>
                <option value="available">Available</option>
                <option value="limited">Limited Availability</option>
                <option value="unavailable">Unavailable</option>
                <option value="on-leave">On Leave</option>
              </select>
              <select
                className="admin-catalog-input !mt-0 !min-h-9 !rounded-lg w-full px-3 text-xs"
                id="team-member-featured"
                name="featured"
                onChange={handleFilterChange}
                value={formFilters.featured}
                aria-label="Display type"
              >
                <option value="all">All display types</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </details>
        </form>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold">
            {isLoading ? "Loading Team members..." : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
          </p>
          <button
            className="admin-catalog-secondary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[11px] font-semibold"
            disabled={isLoading || Boolean(actionTeamMemberId)}
            onClick={handleRefresh}
            type="button"
          >
            Refresh
          </button>
        </div>

        <div aria-live="polite">
          {successMessage ? (
            <div className="admin-catalog-success mt-3 rounded-lg px-3 py-2 text-xs font-semibold" role="status">
              {successMessage}
            </div>
          ) : null}
          {error ? (
            <div className="admin-catalog-error mt-3 rounded-lg px-3 py-2 text-xs font-semibold" role="alert">
              {error}
              <button className="ml-2 font-bold underline underline-offset-2" onClick={handleRefresh} type="button">
                Try again
              </button>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="mt-3 space-y-2" role="status">
            <span className="sr-only">Loading Team members...</span>
            {[1, 2, 3, 4, 5].map((placeholder) => (
              <div className="admin-catalog-skeleton h-[92px] rounded-xl" key={placeholder} />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && teamMembers.length === 0 ? (
          <div className="admin-catalog-empty mt-3 rounded-xl px-5 py-9 text-center">
            <h2 className="text-base font-bold">No Team members found</h2>
            <p className="mt-1 text-xs">Change the filters or add a new Team member.</p>
          </div>
        ) : null}

        {!isLoading && teamMembers.length > 0 ? (
          <div className="mt-3 space-y-2">
            {teamMembers.map((teamMember) => {
              const skills = Array.isArray(teamMember.skills) ? teamMember.skills : [];
              const memberStatusLabel =
                memberStatusLabels[teamMember.status] || teamMember.status || "Team Member";
              const memberStatusStyle =
                memberStatusStyles[teamMember.status] ||
                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
              const availabilityLabel =
                availabilityLabels[teamMember.availabilityStatus] ||
                teamMember.availabilityStatus ||
                "Not specified";
              const availabilityStyle =
                availabilityStyles[teamMember.availabilityStatus] ||
                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
              const isActionPending = actionTeamMemberId === teamMember._id;

              return (
                <article className="admin-catalog-row min-w-0 rounded-xl" key={teamMember._id}>
                  <div className="grid min-w-0 gap-3 p-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                      <div className="flex h-full w-full items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300">
                        {getInitials(teamMember.name)}
                      </div>
                      {teamMember.profileImageUrl ? (
                        <img
                          alt={teamMember.profileImageAlt || `${teamMember.name} profile`}
                          className="relative -mt-12 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                          }}
                          src={teamMember.profileImageUrl}
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1">
                        <span className={`rounded-md px-2 py-1 text-[9px] font-bold ${memberStatusStyle}`}>
                          {memberStatusLabel}
                        </span>
                        <span className={`admin-catalog-badge rounded-md px-2 py-1 text-[9px] font-bold ${teamMember.isVisible ? "is-visible" : "is-hidden"}`}>
                          {teamMember.isVisible ? "Visible" : "Hidden"}
                        </span>
                        {teamMember.isFeatured ? (
                          <span className="admin-catalog-badge is-featured rounded-md px-2 py-1 text-[9px] font-bold">Featured</span>
                        ) : null}
                        <span className={`rounded-md px-2 py-1 text-[9px] font-bold ${availabilityStyle}`}>
                          {availabilityLabel}
                        </span>
                        <span className="admin-catalog-badge rounded-md px-2 py-1 text-[9px] font-bold">
                          Order {teamMember.order ?? 0}
                        </span>
                        <span className="admin-catalog-meta text-[9px]">
                          Updated {formatDate(teamMember.updatedAt)}
                        </span>
                      </div>

                      <div className="mt-1.5 flex min-w-0 flex-wrap items-baseline gap-x-2">
                        <h2 className="truncate text-sm font-bold">{teamMember.name}</h2>
                        <span className="admin-catalog-slug max-w-72 truncate text-[10px]">
                          {teamMember.professionalRole}
                          {teamMember.teamPosition ? ` / ${teamMember.teamPosition}` : ""}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-1 text-[10px] leading-4">
                        {teamMember.shortIntroduction || "No short introduction has been added."}
                      </p>

                      {skills.length > 0 ? (
                        <div className="mt-1.5 flex min-w-0 flex-wrap gap-1">
                          {skills.slice(0, 3).map((skill) => (
                            <span className="admin-catalog-tag rounded-md px-1.5 py-0.5 text-[9px]" key={`${teamMember._id}-${skill}`}>
                              {skill}
                            </span>
                          ))}
                          {skills.length > 3 ? (
                            <span className="admin-catalog-tag rounded-md px-1.5 py-0.5 text-[9px]">+{skills.length - 3}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-2">
                      <Link
                        className="admin-catalog-primary-button inline-flex min-h-8 items-center justify-center rounded-lg px-3 text-[10px] font-bold"
                        to={`/admin/team/${teamMember._id}/edit`}
                      >
                        Edit
                      </Link>
                      <details className="admin-catalog-actions relative">
                        <summary
                          aria-label={`More actions for ${teamMember.name}`}
                          className="admin-catalog-secondary-button inline-flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-base font-bold [&::-webkit-details-marker]:hidden"
                          title="More actions"
                        >
                          ...
                        </summary>
                        <div className="admin-catalog-action-menu absolute right-0 top-[calc(100%+0.4rem)] z-30 w-44 rounded-xl p-1.5">
                          <button className="admin-catalog-menu-action" disabled={Boolean(actionTeamMemberId)} onClick={() => handleToggleVisibility(teamMember)} type="button">
                            {isActionPending ? "Working..." : teamMember.isVisible ? "Hide from public" : "Show on public"}
                          </button>
                          <button className="admin-catalog-menu-action" disabled={Boolean(actionTeamMemberId)} onClick={() => handleToggleFeatured(teamMember)} type="button">
                            {isActionPending ? "Working..." : teamMember.isFeatured ? "Make standard" : "Make featured"}
                          </button>
                          <div className="admin-catalog-menu-divider my-1" />
                          <button
                            className="admin-catalog-menu-action is-danger"
                            disabled={Boolean(actionTeamMemberId) || !canDeleteTeamMembers}
                            onClick={() => handleDeleteTeamMember(teamMember)}
                            title={canDeleteTeamMembers ? "Permanently delete Team member" : "Your role cannot permanently delete Team members"}
                            type="button"
                          >
                            {isActionPending ? "Working..." : "Delete"}
                          </button>
                        </div>
                      </details>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default AdminTeamMembersPage;
