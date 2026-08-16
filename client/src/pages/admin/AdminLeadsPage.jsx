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
  new: "border-blue-200 bg-blue-50 text-blue-700",
  qualified: "border-violet-200 bg-violet-50 text-violet-700",
  contacted: "border-cyan-200 bg-cyan-50 text-cyan-700",
  proposal: "border-amber-200 bg-amber-50 text-amber-700",
  negotiation: "border-orange-200 bg-orange-50 text-orange-700",
  won: "border-emerald-200 bg-emerald-50 text-emerald-700",
  lost: "border-red-200 bg-red-50 text-red-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const priorityClasses = {
  low: "border-slate-200 bg-slate-50 text-slate-600",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  urgent: "border-red-200 bg-red-50 text-red-700",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition-colors duration-150 motion-reduce:transition-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.08em] text-slate-500";

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
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="uppercase tracking-[0.14em] text-brand-700">
                CRM
              </span>

              <span aria-hidden="true" className="text-slate-300">
                /
              </span>

              <span className="text-slate-500">
                Opportunity management
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Leads / CRM
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Manage qualified enquiries, sales opportunities, follow-ups,
              priority, pipeline progress and estimated value.
            </p>
          </div>

          <Link
            to="/admin/leads/new"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            Add Lead
          </Link>
        </header>

        <section
          aria-labelledby="lead-status-overview-heading"
          className="mt-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="lead-status-overview-heading"
                className="text-base font-black text-slate-950"
              >
                Pipeline status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a status to filter the Lead list immediately.
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
            {leadStatuses.map((status) => {
              const isSelected = appliedFilters.status === status;

              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleStatusCardClick(status)}
                  className={`rounded-xl border p-3 text-left transition-colors duration-150 motion-reduce:transition-none ${
                    statusClasses[status]
                  } ${
                    isSelected
                      ? "ring-2 ring-brand-500 ring-offset-2"
                      : "hover:border-slate-300"
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em]">
                    {statusLabels[status]}
                  </p>

                  <p className="mt-2 text-xl font-black">
                    {statusCounts[status] || 0}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="lead-followup-overview-heading"
          className="mt-4"
        >
          <h2
            id="lead-followup-overview-heading"
            className="sr-only"
          >
            Follow-up overview
          </h2>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={appliedFilters.followUp === "overdue"}
              onClick={() => handleFollowUpCardClick("overdue")}
              className={`flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-red-800 transition-colors duration-150 motion-reduce:transition-none hover:bg-red-100 ${
                appliedFilters.followUp === "overdue"
                  ? "ring-2 ring-red-500 ring-offset-2"
                  : ""
              }`}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em]">
                  Overdue follow-ups
                </p>

                <p className="mt-1 text-xs text-red-700">
                  Past scheduled follow-up time
                </p>
              </div>

              <span className="text-2xl font-black">
                {followUpCounts.overdue || 0}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={appliedFilters.followUp === "today"}
              onClick={() => handleFollowUpCardClick("today")}
              className={`flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-amber-800 transition-colors duration-150 motion-reduce:transition-none hover:bg-amber-100 ${
                appliedFilters.followUp === "today"
                  ? "ring-2 ring-amber-500 ring-offset-2"
                  : ""
              }`}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em]">
                  Follow-ups today
                </p>

                <p className="mt-1 text-xs text-amber-700">
                  Scheduled for the current day
                </p>
              </div>

              <span className="text-2xl font-black">
                {followUpCounts.today || 0}
              </span>
            </button>
          </div>
        </section>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div>
            <h2 className="text-base font-black text-slate-950">
              Filters
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Refine the CRM list by Lead attributes, ownership and follow-up.
            </p>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2">
              <label
                htmlFor="lead-search-filter"
                className={labelClassName}
              >
                Search
              </label>

              <input
                id="lead-search-filter"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Name, email, phone, company, subject or requirement"
                className={`${inputClassName} px-4 placeholder:text-slate-400`}
              />
            </div>

            <div>
              <label
                htmlFor="lead-status-filter"
                className={labelClassName}
              >
                Status
              </label>

              <select
                id="lead-status-filter"
                name="status"
                value={formFilters.status}
                onChange={handleFilterChange}
                className={inputClassName}
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
              <label
                htmlFor="lead-priority-filter"
                className={labelClassName}
              >
                Priority
              </label>

              <select
                id="lead-priority-filter"
                name="priority"
                value={formFilters.priority}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="">All priorities</option>

                {leadPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priorityLabels[priority]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="lead-followup-filter"
                className={labelClassName}
              >
                Follow-up
              </label>

              <select
                id="lead-followup-filter"
                name="followUp"
                value={formFilters.followUp}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="">All follow-ups</option>
                <option value="overdue">Overdue</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="none">No follow-up scheduled</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="lead-source-filter"
                className={labelClassName}
              >
                Source
              </label>

              <input
                id="lead-source-filter"
                name="source"
                type="text"
                value={formFilters.source}
                onChange={handleFilterChange}
                placeholder="manual"
                className={`${inputClassName} px-4 placeholder:text-slate-400`}
              />
            </div>

            <div>
              <label
                htmlFor="lead-service-filter"
                className={labelClassName}
              >
                Service
              </label>

              <input
                id="lead-service-filter"
                name="service"
                type="text"
                value={formFilters.service}
                onChange={handleFilterChange}
                placeholder="Frontend Development"
                className={`${inputClassName} px-4 placeholder:text-slate-400`}
              />
            </div>

            <div>
              <label
                htmlFor="lead-assigned-filter"
                className={labelClassName}
              >
                Assigned Admin ID
              </label>

              <input
                id="lead-assigned-filter"
                name="assignedTo"
                type="text"
                value={formFilters.assignedTo}
                onChange={handleFilterChange}
                placeholder="ObjectId"
                className={`${inputClassName} px-4 placeholder:text-slate-400`}
              />
            </div>

            <div>
              <label
                htmlFor="lead-sort-filter"
                className={labelClassName}
              >
                Sort
              </label>

              <select
                id="lead-sort-filter"
                name="sort"
                value={formFilters.sort}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="followup">Next follow-up</option>
                <option value="value-high">Highest value</option>
                <option value="value-low">Lowest value</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="lead-limit-filter"
                className={labelClassName}
              >
                Leads per page
              </label>

              <select
                id="lead-limit-filter"
                name="limit"
                value={formFilters.limit}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="10">10 Leads</option>
                <option value="20">20 Leads</option>
                <option value="50">50 Leads</option>
                <option value="100">100 Leads</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-slate-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Clear
            </button>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-700">
              {isLoading
                ? "Loading Leads..."
                : `${count} Lead${count === 1 ? "" : "s"} shown`}
            </p>

            {!isLoading ? (
              <p className="mt-0.5 text-xs text-slate-500">
                {total} matching result{total === 1 ? "" : "s"} · Page{" "}
                {page} of {totalPages}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading || actionKey !== ""}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div aria-live="polite">
          {successMessage ? (
            <div
              role="status"
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
            >
              <p className="text-sm font-semibold leading-6 text-emerald-800">
                {successMessage}
              </p>
            </div>
          ) : null}
        </div>

        {error || actionError ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm font-semibold leading-6 text-red-700">
              {actionError || error}
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-3 min-h-10 text-sm font-bold text-red-700 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {[1, 2, 3, 4].map((placeholder) => (
              <div
                key={placeholder}
                className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && leads.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-base font-black text-slate-950">
              No Leads found
            </p>

            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Change the filters or create a new CRM Lead.
            </p>
          </div>
        ) : null}

        {!isLoading && leads.length > 0 ? (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {leads.map((lead) => {
              const isDeleteAction = actionKey === `delete-${lead._id}`;

              return (
                <article
                  key={lead._id}
                  className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-black text-brand-700">
                        {createInitials(lead.name)}
                      </div>

                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-black tracking-tight text-slate-950">
                          {lead.name}
                        </h2>

                        <p className="mt-1 break-words text-sm font-semibold text-brand-700">
                          {lead.subject}
                        </p>

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          <span
                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                              statusClasses[lead.status] ||
                              "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                          >
                            {statusLabels[lead.status] ||
                              lead.status ||
                              "Lead"}
                          </span>

                          <span
                            className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                              priorityClasses[lead.priority] ||
                              "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                          >
                            {priorityLabels[lead.priority] ||
                              lead.priority ||
                              "Priority"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 sm:text-right">
                      <p className="text-sm font-black text-slate-900">
                        {formatMoney(
                          lead.estimatedValue,
                          lead.currency,
                        )}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        Source: {lead.source || "manual"}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-x-5 gap-y-4 border-y border-slate-100 py-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className={labelClassName}>Email</dt>

                      <dd className="mt-1.5 break-all text-sm font-semibold text-slate-700">
                        {lead.email || "Not provided"}
                      </dd>
                    </div>

                    <div className="min-w-0">
                      <dt className={labelClassName}>Phone</dt>

                      <dd className="mt-1.5 break-all text-sm font-semibold text-slate-700">
                        {lead.phone || "Not provided"}
                      </dd>
                    </div>

                    <div className="min-w-0">
                      <dt className={labelClassName}>Service</dt>

                      <dd className="mt-1.5 break-words text-sm font-semibold text-slate-700">
                        {lead.serviceTitle ||
                          lead.serviceSlug ||
                          "Not linked"}
                      </dd>
                    </div>

                    <div className="min-w-0">
                      <dt className={labelClassName}>Assigned to</dt>

                      <dd className="mt-1.5 break-words text-sm font-semibold text-slate-700">
                        {lead.assignedTo?.name ||
                          lead.assignedTo?.email ||
                          "Unassigned"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
                    <div>
                      <p className={labelClassName}>Next follow-up</p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {formatDateTime(lead.nextFollowUpAt)}
                      </p>
                    </div>
                  </div>

                  {lead.requirementSummary ? (
                    <div className="mt-4">
                      <p className={labelClassName}>Requirement summary</p>

                      <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                        {lead.requirementSummary}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-auto pt-5">
                    <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                      <Link
                        to={`/admin/leads/${lead._id}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                      >
                        View / Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteLead(lead)}
                        disabled={actionKey !== "" || !canDeleteLeads}
                        title={
                          canDeleteLeads
                            ? "Permanently delete Lead"
                            : "Your role cannot permanently delete Leads"
                        }
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition-colors duration-150 motion-reduce:transition-none hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleteAction ? "Deleting..." : "Delete"}
                      </button>
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
            className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-bold text-slate-700">
                Page {page} of {totalPages}
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                {total} matching Lead{total === 1 ? "" : "s"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </nav>
        ) : null}
      </section>
    </main>
  );
}

export default AdminLeadsPage;
