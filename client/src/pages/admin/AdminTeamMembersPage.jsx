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

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 motion-reduce:transition-none";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.14em] text-slate-500";

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
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Team
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Team Members
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage Team profiles, professional roles, availability,
              publication state and featured priority.
            </p>
          </div>

          <Link
            to="/admin/team/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Add Team Member
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label
                htmlFor="team-member-search"
                className={labelClassName}
              >
                Search
              </label>

              <input
                id="team-member-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Name, role, position, skill or tool"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="team-member-professional-role"
                className={labelClassName}
              >
                Professional role
              </label>

              <input
                id="team-member-professional-role"
                name="professionalRole"
                type="text"
                value={formFilters.professionalRole}
                onChange={handleFilterChange}
                placeholder="MERN Stack Developer"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="team-member-status"
                className={labelClassName}
              >
                Member status
              </label>

              <select
                id="team-member-status"
                name="status"
                value={formFilters.status}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="former">Former Member</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="team-member-availability"
                className={labelClassName}
              >
                Availability
              </label>

              <select
                id="team-member-availability"
                name="availabilityStatus"
                value={formFilters.availabilityStatus}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="">All availability statuses</option>
                <option value="available">Available</option>
                <option value="limited">Limited Availability</option>
                <option value="unavailable">Unavailable</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="team-member-visibility"
                className={labelClassName}
              >
                Public visibility
              </label>

              <select
                id="team-member-visibility"
                name="visibility"
                value={formFilters.visibility}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All Team members</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="team-member-featured"
                className={labelClassName}
              >
                Display type
              </label>

              <select
                id="team-member-featured"
                name="featured"
                value={formFilters.featured}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="all">All Team members</option>
                <option value="featured">Featured</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              Clear
            </button>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {isLoading
                ? "Loading Team members..."
                : `${resultCount} Team member${resultCount === 1 ? "" : "s"}`}
            </p>

            {!isLoading && (
              <p className="mt-1 text-xs text-slate-500">
                Showing the records matching the applied filters.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            Refresh
          </button>
        </div>

        <div aria-live="polite">
          {successMessage && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700"
            >
              {successMessage}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            <span className="sr-only">Loading Team members...</span>

            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-[30rem] animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && teamMembers.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-base font-bold text-slate-950">
              No Team members found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Change the filters or create the first Team member.
            </p>
          </div>
        )}

        {!isLoading && teamMembers.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teamMembers.map((teamMember) => {
              const skills = Array.isArray(teamMember.skills)
                ? teamMember.skills
                : [];

              const memberStatusLabel =
                memberStatusLabels[teamMember.status] ||
                teamMember.status ||
                "Team Member";

              const memberStatusStyle =
                memberStatusStyles[teamMember.status] ||
                "bg-slate-100 text-slate-700";

              const availabilityLabel =
                availabilityLabels[teamMember.availabilityStatus] ||
                teamMember.availabilityStatus ||
                "Not specified";

              const availabilityStyle =
                availabilityStyles[teamMember.availabilityStatus] ||
                "bg-slate-100 text-slate-700";

              const isActionPending =
                actionTeamMemberId === teamMember._id;

              return (
                <article
                  key={teamMember._id}
                  className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-950 text-sm font-bold text-white">
                        <span>{getInitials(teamMember.name)}</span>

                        {teamMember.profileImageUrl && (
                          <img
                            src={teamMember.profileImageUrl}
                            alt={
                              teamMember.profileImageAlt ||
                              `${teamMember.name} profile`
                            }
                            className="absolute inset-0 size-full object-cover"
                            onError={(event) => {
                              event.currentTarget.hidden = true;
                            }}
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-bold text-slate-950">
                          {teamMember.name}
                        </h2>

                        <p className="mt-1 break-words text-sm font-semibold text-brand-700">
                          {teamMember.professionalRole}
                        </p>

                        {teamMember.teamPosition && (
                          <p className="mt-1 break-words text-sm text-slate-500">
                            {teamMember.teamPosition}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {teamMember.isFeatured && (
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          Featured
                        </span>
                      )}

                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          teamMember.isVisible
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {teamMember.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${memberStatusStyle}`}
                    >
                      {memberStatusLabel}
                    </span>

                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${availabilityStyle}`}
                    >
                      {availabilityLabel}
                    </span>

                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      Order {teamMember.order ?? 0}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-3 break-words text-sm leading-6 text-slate-600">
                    {teamMember.shortIntroduction ||
                      "No short introduction has been added."}
                  </p>

                  <div className="mt-5">
                    <p className={labelClassName}>Main skills</p>

                    {skills.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
                          >
                            {skill}
                          </span>
                        ))}

                        {skills.length > 5 && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            +{skills.length - 5}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        No skills added
                      </p>
                    )}
                  </div>

                  <dl className="mt-5 border-t border-slate-100 pt-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-slate-500">Updated</dt>

                      <dd className="font-semibold text-slate-700">
                        {formatDate(teamMember.updatedAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <Link
                      to={`/admin/team/${teamMember._id}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(teamMember)}
                      disabled={actionTeamMemberId !== ""}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending
                        ? "Working..."
                        : teamMember.isVisible
                          ? "Hide"
                          : "Show"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(teamMember)}
                      disabled={actionTeamMemberId !== ""}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending
                        ? "Working..."
                        : teamMember.isFeatured
                          ? "Make Standard"
                          : "Make Featured"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTeamMember(teamMember)}
                      disabled={
                        actionTeamMemberId !== "" || !canDeleteTeamMembers
                      }
                      title={
                        canDeleteTeamMembers
                          ? "Permanently delete Team member"
                          : "Your role cannot permanently delete Team members"
                      }
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending ? "Working..." : "Delete"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminTeamMembersPage;