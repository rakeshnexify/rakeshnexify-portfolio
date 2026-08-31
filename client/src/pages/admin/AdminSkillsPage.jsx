import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import {
  deleteAdminSkill,
  fetchAdminSkills,
  updateAdminSkill,
} from "../../services/adminSkillsApi";

const initialFilters = {
  search: "",
  category: "",
  proficiencyLevel: "",
  visibility: "all",
  featured: "all",
};

const proficiencyLabels = {
  familiar: "Familiar",
  proficient: "Proficient",
  advanced: "Advanced",
  expert: "Expert",
};

const proficiencyStyles = {
  familiar:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  proficient:
    "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  advanced:
    "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  expert:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
};

const inputClassName =
  "mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 sm:min-h-10 sm:px-3 sm:text-sm";

const labelClassName =
  "text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 sm:text-[11px]";

function createApiFilters(filters) {
  const apiFilters = {
    search: filters.search.trim(),
    category: filters.category.trim(),
    proficiencyLevel: filters.proficiencyLevel,
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

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatExperience(value) {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "Not specified";
  }

  return `${numericValue} year${numericValue === 1 ? "" : "s"}`;
}

function AdminSkillsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, admin, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({ ...initialFilters });
  const [appliedFilters, setAppliedFilters] = useState({ ...initialFilters });
  const [skills, setSkills] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionSkillId, setActionSkillId] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || "",
  );

  useEffect(() => {
    if (!location.state?.successMessage) {
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

    async function loadSkills() {
      setIsLoading(true);

      try {
        const response = await fetchAdminSkills(accessToken, apiFilters, {
          signal: controller.signal,
        });

        setSkills(response.skills);
        setResultCount(response.count);
        setError("");
      } catch (requestError) {
        if (controller.signal.aborted || requestError?.name === "AbortError") {
          return;
        }

        if (requestError?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,
            state: {
              from: {
                pathname: "/admin/skills",
              },
            },
          });

          return;
        }

        console.error("Admin Skills loading failed:", requestError);

        setSkills([]);
        setResultCount(0);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Skills could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadSkills();

    return () => {
      controller.abort();
    };
  }, [accessToken, apiFilters, logout, navigate, refreshKey]);

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
    setAppliedFilters({ ...formFilters });
  }

  function handleClearFilters() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setFormFilters({ ...initialFilters });
    setAppliedFilters({ ...initialFilters });
  }

  function handleRefresh() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setRefreshKey((currentKey) => currentKey + 1);
  }

  function handleSkillActionError(requestError) {
    if (requestError?.status === 401) {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: {
            pathname: "/admin/skills",
          },
        },
      });

      return;
    }

    if (requestError?.status === 403) {
      setError(
        requestError.message ||
          "Your Admin role cannot perform this Skill action.",
      );

      return;
    }

    console.error("Admin Skill action failed:", requestError);

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Skill action could not be completed.",
    );
  }

  async function handleToggleVisibility(skill) {
    if (!skill?._id || actionSkillId) {
      return;
    }

    try {
      setActionSkillId(skill._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminSkill(accessToken, skill._id, {
        isVisible: !skill.isVisible,
      });

      setSuccessMessage(
        response.skill.isVisible
          ? `"${response.skill.name}" is now visible on the portfolio.`
          : `"${response.skill.name}" is now hidden from the portfolio.`,
      );

      const shouldRemoveFromCurrentView =
        typeof apiFilters.isVisible === "boolean" &&
        response.skill.isVisible !== apiFilters.isVisible;

      setSkills((currentSkills) =>
        shouldRemoveFromCurrentView
          ? currentSkills.filter(
              (currentSkill) => currentSkill._id !== skill._id,
            )
          : currentSkills.map((currentSkill) =>
              currentSkill._id === skill._id
                ? response.skill
                : currentSkill,
            ),
      );

      if (shouldRemoveFromCurrentView) {
        setResultCount((currentCount) => Math.max(0, currentCount - 1));
      }
    } catch (requestError) {
      handleSkillActionError(requestError);
    } finally {
      setActionSkillId("");
    }
  }

  async function handleToggleFeatured(skill) {
    if (!skill?._id || actionSkillId) {
      return;
    }

    try {
      setActionSkillId(skill._id);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminSkill(accessToken, skill._id, {
        isFeatured: !skill.isFeatured,
      });

      setSuccessMessage(
        response.skill.isFeatured
          ? `"${response.skill.name}" is now featured.`
          : `"${response.skill.name}" is now a standard Skill.`,
      );

      const shouldRemoveFromCurrentView =
        typeof apiFilters.isFeatured === "boolean" &&
        response.skill.isFeatured !== apiFilters.isFeatured;

      setSkills((currentSkills) =>
        shouldRemoveFromCurrentView
          ? currentSkills.filter(
              (currentSkill) => currentSkill._id !== skill._id,
            )
          : currentSkills.map((currentSkill) =>
              currentSkill._id === skill._id
                ? response.skill
                : currentSkill,
            ),
      );

      if (shouldRemoveFromCurrentView) {
        setResultCount((currentCount) => Math.max(0, currentCount - 1));
      }
    } catch (requestError) {
      handleSkillActionError(requestError);
    } finally {
      setActionSkillId("");
    }
  }

  async function handleDeleteSkill(skill) {
    if (!skill?._id || actionSkillId) {
      return;
    }

    const isConfirmed = window.confirm(
      `Permanently delete "${skill.name}"?\n\nThis action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setActionSkillId(skill._id);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminSkill(accessToken, skill._id);

      setSuccessMessage(
        `"${response.deletedSkill.name}" was permanently deleted.`,
      );

      setSkills((currentSkills) =>
        currentSkills.filter(
          (currentSkill) => currentSkill._id !== skill._id,
        ),
      );

      setResultCount((currentCount) => Math.max(0, currentCount - 1));
    } catch (requestError) {
      handleSkillActionError(requestError);
    } finally {
      setActionSkillId("");
    }
  }

  const canDeleteSkills = ["super-admin", "admin"].includes(admin?.role);

  return (
    <main className="rnx-admin-skills-compact-v473 min-h-screen bg-slate-100 dark:bg-slate-950">
      <section className="mx-auto w-full max-w-[1440px] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300">
              Skills
            </p>

            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
              Skills
            </h1>

            <p className="mt-0.5 max-w-2xl text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs sm:leading-5">
              Manage skill expertise, experience, visibility and display order.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              {isLoading ? "..." : resultCount} total
            </span>

            <Link
              to="/admin/skills/new"
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-3.5 text-xs font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 sm:min-h-10 sm:px-4 sm:text-sm"
            >
              Add Skill
            </Link>
          </div>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3"
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div>
              <label htmlFor="skill-search" className={labelClassName}>
                Search
              </label>

              <input
                id="skill-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Name, slug or description"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="skill-category-filter" className={labelClassName}>
                Category
              </label>

              <input
                id="skill-category-filter"
                name="category"
                type="text"
                value={formFilters.category}
                onChange={handleFilterChange}
                placeholder="Frontend Development"
                className={inputClassName}
              />
            </div>
          </div>

          <details className="group mt-2 rounded-lg border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/50">
            <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 px-2.5 text-[11px] font-semibold text-slate-600 marker:hidden dark:text-slate-300">
              <span>More Filters</span>

              <span
                aria-hidden="true"
                className="text-slate-400 transition group-open:rotate-180"
              >
                &#9662;
              </span>
            </summary>

            <div className="grid gap-2 border-t border-slate-200 p-2.5 dark:border-slate-800 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="skill-proficiency-filter"
                  className={labelClassName}
                >
                  Proficiency
                </label>

                <select
                  id="skill-proficiency-filter"
                  name="proficiencyLevel"
                  value={formFilters.proficiencyLevel}
                  onChange={handleFilterChange}
                  className={inputClassName}
                >
                  <option value="">All levels</option>
                  <option value="familiar">Familiar</option>
                  <option value="proficient">Proficient</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="skill-visibility-filter"
                  className={labelClassName}
                >
                  Visibility
                </label>

                <select
                  id="skill-visibility-filter"
                  name="visibility"
                  value={formFilters.visibility}
                  onChange={handleFilterChange}
                  className={inputClassName}
                >
                  <option value="all">All Skills</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="skill-featured-filter"
                  className={labelClassName}
                >
                  Display Type
                </label>

                <select
                  id="skill-featured-filter"
                  name="featured"
                  value={formFilters.featured}
                  onChange={handleFilterChange}
                  className={inputClassName}
                >
                  <option value="all">All types</option>
                  <option value="featured">Featured</option>
                  <option value="standard">Standard</option>
                </select>
              </div>
            </div>
          </details>

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
            >
              Clear
            </button>

            <button
              type="submit"
              className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-3.5 text-xs font-semibold text-white transition hover:bg-brand-700"
            >
              Apply
            </button>
          </div>
        </form>

        <div className="mt-3 flex items-center justify-between gap-3 border-b border-slate-200 pb-2.5 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isLoading
              ? "Loading Skills..."
              : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex min-h-8 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
          >
            Refresh
          </button>
        </div>

        <div aria-live="polite">
          {successMessage && (
            <div
              role="status"
              className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              {successMessage}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              {error}
            </div>
          )}
        </div>

        {isLoading && (
          <div role="status" aria-live="polite" className="mt-3 space-y-2">
            <span className="sr-only">Loading Skills...</span>

            {[1, 2, 3, 4, 5].map((placeholder) => (
              <div
                key={placeholder}
                className="h-20 animate-pulse rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 motion-reduce:animate-none"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && skills.length === 0 && (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-bold text-slate-950 dark:text-white">
              No Skills found
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Change the filters or create the first Skill.
            </p>
          </div>
        )}

        {!isLoading && skills.length > 0 && (
          <div className="mt-3 space-y-2">
            {skills.map((skill) => {
              const proficiencyLabel =
                proficiencyLabels[skill.proficiencyLevel] ||
                skill.proficiencyLevel ||
                "Not specified";

              const proficiencyStyle =
                proficiencyStyles[skill.proficiencyLevel] ||
                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

              const isActionPending = actionSkillId === skill._id;

              return (
                <article
                  key={skill._id}
                  className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-xs font-bold text-white dark:border-slate-700 sm:size-11">
                      {skill.iconUrl ? (
                        <img
                          src={skill.iconUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                          }}
                        />
                      ) : (
                        skill.shortName || skill.name?.charAt(0) || "S"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h2 className="truncate text-sm font-bold text-slate-950 dark:text-white sm:text-[15px]">
                              {skill.name}
                            </h2>

                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${proficiencyStyle}`}>
                              {proficiencyLabel}
                            </span>

                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                skill.isVisible
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {skill.isVisible ? "Visible" : "Hidden"}
                            </span>

                            {skill.isFeatured && (
                              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                Featured
                              </span>
                            )}

                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              #{skill.order ?? 0}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400 sm:text-[11px]">
                            <span className="font-semibold text-brand-700 dark:text-brand-300">
                              {skill.category}
                            </span>

                            <span aria-hidden="true">/</span>
                            <span>{formatExperience(skill.yearsOfExperience)}</span>

                            {skill.proficiencyPercent !== null &&
                              skill.proficiencyPercent !== undefined && (
                                <>
                                  <span aria-hidden="true">/</span>
                                  <span>{skill.proficiencyPercent}%</span>
                                </>
                              )}

                            <span aria-hidden="true">/</span>
                            <span>Updated {formatDate(skill.updatedAt)}</span>
                          </div>

                          {skill.description && (
                            <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">
                              {skill.description}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center justify-end gap-1.5 self-end sm:self-start">
                          <Link
                            to={`/admin/skills/${skill._id}/edit`}
                            className="inline-flex min-h-8 items-center justify-center rounded-lg bg-brand-600 px-3 text-[11px] font-semibold text-white transition hover:bg-brand-700"
                          >
                            Edit
                          </Link>

                          <details className="group relative">
                            <summary
                              className="grid size-8 cursor-pointer list-none place-items-center rounded-lg border border-slate-300 bg-white text-base font-bold leading-none text-slate-600 marker:hidden transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
                              aria-label={`More actions for ${skill.name}`}
                            >
                              <span aria-hidden="true">&#8942;</span>
                            </summary>

                            <div className="absolute right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-950">
                              <button
                                type="button"
                                onClick={() => handleToggleVisibility(skill)}
                                disabled={actionSkillId !== ""}
                                className="flex min-h-8 w-full items-center rounded-md px-2.5 text-left text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {isActionPending
                                  ? "Working..."
                                  : skill.isVisible
                                    ? "Hide from public"
                                    : "Show publicly"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleFeatured(skill)}
                                disabled={actionSkillId !== ""}
                                className="flex min-h-8 w-full items-center rounded-md px-2.5 text-left text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {isActionPending
                                  ? "Working..."
                                  : skill.isFeatured
                                    ? "Make standard"
                                    : "Make featured"}
                              </button>

                              {canDeleteSkills && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSkill(skill)}
                                  disabled={actionSkillId !== ""}
                                  className="flex min-h-8 w-full items-center rounded-md px-2.5 text-left text-[11px] font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/50"
                                >
                                  {isActionPending ? "Working..." : "Delete"}
                                </button>
                              )}
                            </div>
                          </details>
                        </div>
                      </div>
                    </div>
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

export default AdminSkillsPage;
