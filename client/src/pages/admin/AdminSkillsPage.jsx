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
  familiar: "bg-slate-100 text-slate-700",
  proficient: "bg-blue-50 text-blue-700",
  advanced: "bg-violet-50 text-violet-700",
  expert: "bg-emerald-50 text-emerald-700",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 motion-reduce:transition-none";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.14em] text-slate-500";

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
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Content
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Skills
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage professional skills, proficiency, experience, publishing
              state and display priority.
            </p>
          </div>

          <Link
            to="/admin/skills/new"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Add Skill
          </Link>
        </header>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              <label
                htmlFor="skill-category-filter"
                className={labelClassName}
              >
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
                Display type
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
                ? "Loading Skills..."
                : `${resultCount} Skill${resultCount === 1 ? "" : "s"}`}
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
            <span className="sr-only">Loading Skills...</span>

            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                key={placeholder}
                className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && skills.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-base font-bold text-slate-950">
              No Skills found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Change the filters or create the first Skill.
            </p>
          </div>
        )}

        {!isLoading && skills.length > 0 && (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill) => {
              const proficiencyLabel =
                proficiencyLabels[skill.proficiencyLevel] ||
                skill.proficiencyLevel ||
                "Not specified";

              const proficiencyStyle =
                proficiencyStyles[skill.proficiencyLevel] ||
                "bg-slate-100 text-slate-700";

              const isActionPending = actionSkillId === skill._id;

              return (
                <article
                  key={skill._id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      Order {skill.order ?? 0}
                    </span>

                    <div className="flex flex-wrap justify-end gap-2">
                      {skill.isFeatured && (
                        <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                          Featured
                        </span>
                      )}

                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                          skill.isVisible
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {skill.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-start gap-3">
                    <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-950 text-base font-bold text-white">
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

                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-bold text-slate-950">
                        {skill.name}
                      </h2>

                      <p className="mt-1 break-all text-xs font-semibold text-brand-700">
                        {skill.slug}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                      {skill.category}
                    </span>

                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${proficiencyStyle}`}
                    >
                      {proficiencyLabel}
                    </span>
                  </div>

                  {skill.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {skill.description}
                    </p>
                  )}

                  <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-sm">
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Experience
                      </dt>

                      <dd className="mt-1 font-semibold text-slate-700">
                        {formatExperience(skill.yearsOfExperience)}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                        Updated
                      </dt>

                      <dd className="mt-1 font-semibold text-slate-700">
                        {formatDate(skill.updatedAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <Link
                      to={`/admin/skills/${skill._id}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleVisibility(skill)}
                      disabled={actionSkillId !== ""}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending
                        ? "Working..."
                        : skill.isVisible
                          ? "Hide"
                          : "Show"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(skill)}
                      disabled={actionSkillId !== ""}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                    >
                      {isActionPending
                        ? "Working..."
                        : skill.isFeatured
                          ? "Make Standard"
                          : "Make Featured"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(skill)}
                      disabled={actionSkillId !== "" || !canDeleteSkills}
                      title={
                        canDeleteSkills
                          ? "Permanently delete Skill"
                          : "Your role cannot permanently delete Skills"
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

export default AdminSkillsPage;