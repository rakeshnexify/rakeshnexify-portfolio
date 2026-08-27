import { useCallback, useMemo, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import useAdminLeads from "../../hooks/useAdminLeads";

import {
  deleteAdminLead,
  leadPriorities,
  leadStatuses,
} from "../../services/adminLeadsApi";

const initialFilters = {
  search: "",
  status: "",
  priority: "",
  source: "",
  service: "",
  assignedTo: "",
  followUp: "",
  sort: "newest",
  limit: "20",
  page: 1,
};

const statusLabels = {
  new: "New",
  qualified: "Qualified",
  contacted: "Contacted",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
  archived: "Archived",
};

const statusClasses = {
  new: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  qualified: "border-violet-500/25 bg-violet-500/10 text-violet-300",
  contacted: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
  proposal: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  negotiation: "border-orange-500/25 bg-orange-500/10 text-orange-300",
  won: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  lost: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  archived: "border-slate-600 bg-slate-800 text-slate-400",
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const priorityClasses = {
  low: "border-slate-600 bg-slate-800 text-slate-400",
  medium: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  high: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  urgent: "border-rose-500/25 bg-rose-500/10 text-rose-300",
};

const inputClassName =
  "mt-1.5 min-h-10 w-full rounded-lg border border-[#223147] bg-[#0a1422] px-3 text-xs text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

const labelClassName =
  "text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500";

function createApiFilters(filters) {
  return {
    search: filters.search.trim(),
    status: filters.status,
    priority: filters.priority,
    source: filters.source.trim(),
    service: filters.service.trim(),
    assignedTo: filters.assignedTo.trim(),
    followUp: filters.followUp,
    sort: filters.sort,
    limit: Number(filters.limit) || 20,
    page: Number(filters.page) || 1,
  };
}

function formatDateTime(value) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(value, currency = "USD") {
  if (value === null || value === undefined || value === "") {
    return "Not estimated";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not estimated";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "USD"} ${amount}`;
  }
}

function createInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "LD";
}

function AdminLeadsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { accessToken, admin, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({
    ...initialFilters,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    ...initialFilters,
  });

  const [actionKey, setActionKey] = useState("");
  const [actionError, setActionError] = useState("");

  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || "",
  );

  const apiFilters = useMemo(
    () => createApiFilters(appliedFilters),
    [appliedFilters],
  );

  const handleUnauthorized = useCallback(() => {
    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: "/admin/leads",
        },
      },
    });
  }, [logout, navigate]);

  const {
    leads,
    count,
    total,
    page,
    totalPages,
    statusCounts,
    followUpCounts,
    isLoading,
    error,
    refresh,
  } = useAdminLeads({
    accessToken,
    filters: apiFilters,
    onUnauthorized: handleUnauthorized,
  });

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function handleFilterSubmit(event) {
    event.preventDefault();

    setActionError("");
    setSuccessMessage("");

    setAppliedFilters({
      ...formFilters,
      page: 1,
    });

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      page: 1,
    }));
  }

  function handleClearFilters() {
    setActionError("");
    setSuccessMessage("");

    setFormFilters({
      ...initialFilters,
    });

    setAppliedFilters({
      ...initialFilters,
    });
  }

  function handleStatusCardClick(status) {
    const nextStatus = appliedFilters.status === status ? "" : status;

    setActionError("");
    setSuccessMessage("");

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      status: nextStatus,
      page: 1,
    }));

    setAppliedFilters((currentFilters) => ({
      ...currentFilters,
      status: nextStatus,
      page: 1,
    }));
  }

  function handleFollowUpCardClick(followUp) {
    const nextFollowUp =
      appliedFilters.followUp === followUp ? "" : followUp;

    setActionError("");
    setSuccessMessage("");

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      followUp: nextFollowUp,
      page: 1,
    }));

    setAppliedFilters((currentFilters) => ({
      ...currentFilters,
      followUp: nextFollowUp,
      page: 1,
    }));
  }

  function handlePageChange(nextPage) {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === page
    ) {
      return;
    }

    setActionError("");
    setSuccessMessage("");

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      page: nextPage,
    }));

    setAppliedFilters((currentFilters) => ({
      ...currentFilters,
      page: nextPage,
    }));

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  async function handleDeleteLead(lead) {
    if (!lead?._id || actionKey) {
      return;
    }

    const isConfirmed = window.confirm(
      `Permanently delete the Lead "${lead.name}"?\n\nSubject: ${lead.subject}\n\nThis action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    const currentActionKey = `delete-${lead._id}`;

    try {
      setActionKey(currentActionKey);
      setActionError("");
      setSuccessMessage("");

      const response = await deleteAdminLead(
        accessToken,
        lead._id,
      );

      setSuccessMessage(
        response.message ||
          `Lead "${response.deletedLead?.name || lead.name}" was deleted.`,
      );

      refresh();
    } catch (requestError) {
      if (requestError?.status === 401) {
        handleUnauthorized();

        return;
      }

      console.error("Admin Lead deletion failed:", requestError);

      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Lead could not be deleted.",
      );
    } finally {
      setActionKey("");
    }
  }

  function handleRefresh() {
    setActionError("");
    setSuccessMessage("");
    refresh();
  }

  const canDeleteLeads = ["super-admin", "admin"].includes(admin?.role);

  return (
    <main className="min-h-screen bg-[#08111e] text-slate-200">
      <section className="mx-auto w-full max-w-[1640px] px-3 py-4 sm:px-5 lg:px-6">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-400">
              CRM
            </p>

            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">
              Leads / CRM
            </h1>

            <p className="mt-0.5 hidden max-w-2xl text-[11px] leading-4 text-slate-400 sm:block">
              Manage pipeline, priority, follow-ups, ownership and opportunity value.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <span className="hidden rounded-md border border-[#1d2b3d] bg-[#0c1624] px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 sm:inline-flex">
              {total} total
            </span>

            <button
              className="inline-flex min-h-8 items-center justify-center rounded-md border border-[#27384e] bg-[#101c2c] px-2 text-[9px] font-semibold text-slate-300 transition hover:border-[#38506d] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-2.5 sm:text-[10px]"
              disabled={isLoading || actionKey !== ""}
              onClick={handleRefresh}
              type="button"
            >
              {isLoading ? "..." : "Refresh"}
            </button>

            <Link
              className="inline-flex min-h-8 items-center justify-center rounded-md border border-blue-500 bg-blue-600 px-2.5 text-[9px] font-bold text-white transition hover:bg-blue-500 sm:px-3 sm:text-[10px]"
              to="/admin/leads/new"
            >
              Add Lead
            </Link>
          </div>
        </header>

        <section
          aria-label="Lead pipeline quick filters"
          className="mt-2 flex flex-nowrap gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-1.5 sm:overflow-visible sm:pb-0"
        >
          {leadStatuses.map((status) => {
            const isSelected = appliedFilters.status === status;

            return (
              <button
                aria-pressed={isSelected}
                className={`inline-flex min-h-7 flex-none items-center gap-1 rounded-md border px-2 text-[9px] font-bold transition ${
                  isSelected
                    ? "border-blue-500/50 bg-blue-500/15 text-blue-200"
                    : statusClasses[status]
                }`}
                key={status}
                onClick={() => handleStatusCardClick(status)}
                type="button"
              >
                <span>{statusLabels[status]}</span>

                <span className="rnx-admin-status-count rounded px-1.5 py-0.5 tabular-nums">
                  {statusCounts[status] || 0}
                </span>
              </button>
            );
          })}

          <span
            aria-hidden="true"
            className="mx-0.5 h-7 w-px flex-none bg-[#26364b]"
          />

          <button
            aria-pressed={appliedFilters.followUp === "overdue"}
            className={`inline-flex min-h-7 flex-none items-center gap-1 rounded-md border px-2 text-[9px] font-bold transition ${
              appliedFilters.followUp === "overdue"
                ? "border-rose-500/50 bg-rose-500/15 text-rose-200"
                : "border-rose-500/25 bg-rose-500/10 text-rose-300"
            }`}
            onClick={() => handleFollowUpCardClick("overdue")}
            type="button"
          >
            <span>Overdue</span>

            <span className="rnx-admin-status-count rounded px-1.5 py-0.5 tabular-nums">
              {followUpCounts.overdue || 0}
            </span>
          </button>

          <button
            aria-pressed={appliedFilters.followUp === "today"}
            className={`inline-flex min-h-7 flex-none items-center gap-1 rounded-md border px-2 text-[9px] font-bold transition ${
              appliedFilters.followUp === "today"
                ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                : "border-amber-500/25 bg-amber-500/10 text-amber-300"
            }`}
            onClick={() => handleFollowUpCardClick("today")}
            type="button"
          >
            <span>Today</span>

            <span className="rnx-admin-status-count rounded px-1.5 py-0.5 tabular-nums">
              {followUpCounts.today || 0}
            </span>
          </button>
        </section>

        <form
          className="mt-2 rounded-lg border border-[#1d2b3d] bg-[#0c1624] p-2 sm:mt-3 sm:p-2.5"
          onSubmit={handleFilterSubmit}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-1.5 sm:grid-cols-4 sm:gap-2 xl:grid-cols-[minmax(280px,1.7fr)_165px_150px_125px_auto]">
            <div className="col-span-3 sm:col-span-2 xl:col-span-1">
              <label className="sr-only" htmlFor="lead-search-filter">
                Search
              </label>

              <input
                className={`${inputClassName} !mt-0`}
                id="lead-search-filter"
                name="search"
                onChange={handleFilterChange}
                placeholder="Search name, contact, company, subject or requirement..."
                type="search"
                value={formFilters.search}
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="lead-status-filter">
                Status
              </label>

              <select
                className={`${inputClassName} !mt-0`}
                id="lead-status-filter"
                name="status"
                onChange={handleFilterChange}
                value={formFilters.status}
              >
                <option value="">All statuses</option>

                {leadStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="sr-only" htmlFor="lead-priority-filter">
                Priority
              </label>

              <select
                className={`${inputClassName} !mt-0`}
                id="lead-priority-filter"
                name="priority"
                onChange={handleFilterChange}
                value={formFilters.priority}
              >
                <option value="">All priorities</option>

                {leadPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityLabels[priority]}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:block">
              <label className="sr-only" htmlFor="lead-limit-filter">
                Leads per page
              </label>

              <select
                className={`${inputClassName} !mt-0`}
                id="lead-limit-filter"
                name="limit"
                onChange={handleFilterChange}
                value={formFilters.limit}
              >
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
            </div>

            <div className="flex gap-1">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-2.5 text-[9px] font-bold text-white transition hover:bg-blue-500 sm:px-3.5 sm:text-[10px]"
                type="submit"
              >
                Apply
              </button>

              <button
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#27384e] bg-[#101c2c] px-2 text-[9px] font-semibold text-slate-300 transition hover:border-[#38506d] hover:text-white sm:px-3 sm:text-[10px]"
                onClick={handleClearFilters}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          <details className="mt-1.5 rounded-md border border-[#1d2b3d] bg-[#0a1422]">
            <summary className="cursor-pointer list-none px-2.5 py-1.5 text-[9px] font-semibold text-slate-500">
              More Filters
            </summary>

            <div className="grid gap-2 border-t border-[#1d2b3d] px-2.5 py-2.5 sm:grid-cols-2 xl:grid-cols-5">
              <div className="sm:hidden">
                <label
                  className={labelClassName}
                  htmlFor="lead-limit-filter-mobile"
                >
                  Per Page
                </label>

                <select
                  className={inputClassName}
                  id="lead-limit-filter-mobile"
                  name="limit"
                  onChange={handleFilterChange}
                  value={formFilters.limit}
                >
                  <option value="10">10 / page</option>
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                  <option value="100">100 / page</option>
                </select>
              </div>

              <div>
                <label
                  className={labelClassName}
                  htmlFor="lead-followup-filter"
                >
                  Follow-up
                </label>

                <select
                  className={inputClassName}
                  id="lead-followup-filter"
                  name="followUp"
                  onChange={handleFilterChange}
                  value={formFilters.followUp}
                >
                  <option value="">All follow-ups</option>
                  <option value="overdue">Overdue</option>
                  <option value="today">Today</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="none">Not scheduled</option>
                </select>
              </div>

              <div>
                <label
                  className={labelClassName}
                  htmlFor="lead-service-filter"
                >
                  Service
                </label>

                <input
                  className={inputClassName}
                  id="lead-service-filter"
                  name="service"
                  onChange={handleFilterChange}
                  placeholder="Service"
                  type="text"
                  value={formFilters.service}
                />
              </div>

              <div>
                <label
                  className={labelClassName}
                  htmlFor="lead-source-filter"
                >
                  Source
                </label>

                <input
                  className={inputClassName}
                  id="lead-source-filter"
                  name="source"
                  onChange={handleFilterChange}
                  placeholder="manual"
                  type="text"
                  value={formFilters.source}
                />
              </div>

              <div>
                <label
                  className={labelClassName}
                  htmlFor="lead-assigned-filter"
                >
                  Assigned Admin ID
                </label>

                <input
                  className={inputClassName}
                  id="lead-assigned-filter"
                  name="assignedTo"
                  onChange={handleFilterChange}
                  placeholder="ObjectId"
                  type="text"
                  value={formFilters.assignedTo}
                />
              </div>

              <div>
                <label
                  className={labelClassName}
                  htmlFor="lead-sort-filter"
                >
                  Sort
                </label>

                <select
                  className={inputClassName}
                  id="lead-sort-filter"
                  name="sort"
                  onChange={handleFilterChange}
                  value={formFilters.sort}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="followup">Next follow-up</option>
                  <option value="value-high">Highest value</option>
                  <option value="value-low">Lowest value</option>
                </select>
              </div>
            </div>
          </details>
        </form>

        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 sm:mt-2">
          <p className="text-[9px] font-semibold text-slate-500">
            {isLoading
              ? "Loading Leads..."
              : `${count} shown · ${total} matching · ${page}/${totalPages}`}
          </p>

          {(appliedFilters.status || appliedFilters.followUp) ? (
            <span className="text-[9px] font-semibold text-blue-300">
              CRM filters active
            </span>
          ) : null}
        </div>

        <div aria-live="polite">
          {successMessage ? (
            <div
              className="mt-2 rounded-md border border-emerald-500/20 bg-emerald-950/20 px-2.5 py-2 text-[10px] font-semibold text-emerald-300"
              role="status"
            >
              {successMessage}
            </div>
          ) : null}
        </div>

        {error || actionError ? (
          <div
            className="mt-2 rounded-md border border-rose-500/20 bg-rose-950/20 px-2.5 py-2 text-[10px] text-rose-300"
            role="alert"
          >
            {actionError || error}

            <button
              className="ml-2 font-bold underline underline-offset-2"
              onClick={handleRefresh}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div
            aria-live="polite"
            className="mt-2 space-y-1.5"
            role="status"
          >
            <span className="sr-only">Loading Leads...</span>

            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                className="h-[74px] animate-pulse rounded-lg border border-[#1d2b3d] bg-[#0c1624] motion-reduce:animate-none"
                key={placeholder}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && leads.length === 0 ? (
          <div className="mt-2 rounded-lg border border-dashed border-[#26384f] bg-[#0a1422] px-4 py-7 text-center">
            <p className="text-sm font-bold text-slate-100">
              No Leads found
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Change the filters or add a new CRM Lead.
            </p>
          </div>
        ) : null}

        {!isLoading && leads.length > 0 ? (
          <div className="mt-2 grid gap-1.5 xl:grid-cols-2">
            {leads.map((lead) => {
              const isDeleteAction = actionKey === `delete-${lead._id}`;

              return (
                <article
                  className="min-w-0 rounded-lg border border-[#1d2b3d] bg-[#0c1624] transition hover:border-[#2c405b] h-full"
                  key={lead._id}
                >
                  <div className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)] gap-2 px-2.5 py-2 sm:grid-cols-[34px_minmax(0,1fr)_auto] sm:items-center">
                    <div className="grid size-[34px] shrink-0 place-items-center rounded-md border border-[#26384f] bg-[#132238] text-[9px] font-bold text-blue-200">
                      {createInitials(lead.name)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[8px] font-bold ${
                            statusClasses[lead.status] ||
                            "border-slate-600 bg-slate-800 text-slate-400"
                          }`}
                        >
                          {statusLabels[lead.status] ||
                            lead.status ||
                            "Lead"}
                        </span>

                        <span
                          className={`rounded border px-1.5 py-0.5 text-[8px] font-bold ${
                            priorityClasses[lead.priority] ||
                            "border-slate-600 bg-slate-800 text-slate-400"
                          }`}
                        >
                          {priorityLabels[lead.priority] ||
                            lead.priority ||
                            "Priority"}
                        </span>

                        <h2 className="max-w-56 truncate text-[11px] font-bold text-slate-100 sm:max-w-80">
                          {lead.name}
                        </h2>

                        <span className="max-w-72 truncate text-[9px] font-semibold text-blue-200">
                          {lead.subject}
                        </span>
                      </div>

                      <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[8px] text-slate-500">
                        <span className="max-w-44 truncate">
                          {lead.email || "No email"}
                        </span>

                        <span className="max-w-32 truncate">
                          {lead.phone || "No phone"}
                        </span>

                        <span className="max-w-40 truncate">
                          {lead.serviceTitle ||
                            lead.serviceSlug ||
                            "No service"}
                        </span>

                        <span className="hidden max-w-40 truncate sm:inline">
                          {lead.assignedTo?.name ||
                            lead.assignedTo?.email ||
                            "Unassigned"}
                        </span>

                        <span className="font-semibold text-slate-300">
                          {formatMoney(
                            lead.estimatedValue,
                            lead.currency,
                          )}
                        </span>

                        <span>
                          Follow-up {formatDateTime(lead.nextFollowUpAt)}
                        </span>

                        <span className="hidden sm:inline">
                          {lead.source || "manual"}
                        </span>
                      </div>

                      {lead.requirementSummary ? (
                        <p className="mt-0.5 hidden line-clamp-1 text-[9px] leading-3.5 text-slate-400 sm:block">
                          {lead.requirementSummary}
                        </p>
                      ) : null}
                    </div>

                    <div className="col-span-2 flex shrink-0 items-center justify-end gap-1.5 sm:col-span-1">
                      <Link
                        className="inline-flex min-h-8 items-center justify-center rounded-md border border-blue-500 bg-blue-600 px-2.5 text-[9px] font-bold text-white transition hover:bg-blue-500"
                        to={`/admin/leads/${lead._id}/edit`}
                      >
                        View / Edit
                      </Link>

                      <details className="relative">
                        <summary
                          aria-label={`More actions for ${lead.name}`}
                          className="inline-flex size-8 cursor-pointer list-none items-center justify-center rounded-md border border-[#27384e] bg-[#101c2c] text-sm font-bold text-slate-300 transition hover:border-[#38506d] hover:text-white"
                          title="More actions"
                        >
                          …
                        </summary>

                        <div className="absolute right-0 top-[calc(100%+0.35rem)] z-30 w-40 rounded-lg border border-[#27384e] bg-[#0d1725] p-1.5 shadow-2xl">
                          <button
                            className="rnx-admin-delete-action flex min-h-8 w-full items-center rounded-md px-2 text-left text-[9px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={actionKey !== "" || !canDeleteLeads}
                            onClick={() => handleDeleteLead(lead)}
                            title={
                              canDeleteLeads
                                ? "Permanently delete Lead"
                                : "Your role cannot permanently delete Leads"
                            }
                            type="button"
                          >
                            {isDeleteAction ? "Deleting..." : "Delete Lead"}
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

        {!isLoading && !error && totalPages > 1 ? (
          <nav
            aria-label="Lead pagination"
            className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-[#1d2b3d] bg-[#0c1624] p-2"
          >
            <button
              className="inline-flex min-h-8 items-center justify-center rounded-md border border-[#27384e] bg-[#101c2c] px-2.5 text-[9px] font-semibold text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              type="button"
            >
              Previous
            </button>

            <span className="text-[9px] font-semibold text-slate-500">
              {page} / {totalPages} · {total} matching
            </span>

            <button
              className="inline-flex min-h-8 items-center justify-center rounded-md border border-blue-500 bg-blue-600 px-2.5 text-[9px] font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              type="button"
            >
              Next
            </button>
          </nav>
        ) : null}
      </section>
    </main>
  );
}

export default AdminLeadsPage;
