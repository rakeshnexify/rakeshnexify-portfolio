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
  archived: "border-slate-300 bg-slate-100 text-slate-600",
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

  const handleUnauthorized = useCallback(
    () => {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: {
            pathname: "/admin/leads",
          },
        },
      });
    },
    [logout, navigate],
  );

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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
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

  function handleLogout() {
    logout();

    navigate("/admin/login", {
      replace: true,
    });
  }

  const canDeleteLeads = ["super-admin", "admin"].includes(admin?.role);

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
                Leads / CRM
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

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
            >
              <span aria-hidden="true">←</span>
              Dashboard
            </Link>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
              Opportunity Management
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Leads / CRM
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              Track qualified enquiries, sales opportunities, follow-ups,
              priority, pipeline progress and estimated value.
            </p>
          </div>

          <Link
            to="/admin/leads/new"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            + Add Lead
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {leadStatuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusCardClick(status)}
              className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                statusClasses[status]
              } ${
                appliedFilters.status === status
                  ? "ring-2 ring-brand-500 ring-offset-2"
                  : ""
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wide">
                {statusLabels[status]}
              </p>

              <p className="mt-3 text-2xl font-black">
                {statusCounts[status] || 0}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleFollowUpCardClick("overdue")}
            className={`rounded-2xl border border-red-200 bg-red-50 p-5 text-left text-red-800 transition hover:-translate-y-0.5 hover:shadow-md ${
              appliedFilters.followUp === "overdue"
                ? "ring-2 ring-red-500 ring-offset-2"
                : ""
            }`}
          >
            <p className="text-sm font-bold">Overdue follow-ups</p>

            <p className="mt-3 text-3xl font-black">
              {followUpCounts.overdue || 0}
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleFollowUpCardClick("today")}
            className={`rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left text-amber-800 transition hover:-translate-y-0.5 hover:shadow-md ${
              appliedFilters.followUp === "today"
                ? "ring-2 ring-amber-500 ring-offset-2"
                : ""
            }`}
          >
            <p className="text-sm font-bold">Follow-ups today</p>

            <p className="mt-3 text-3xl font-black">
              {followUpCounts.today || 0}
            </p>
          </button>
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="md:col-span-2">
              <label
                htmlFor="lead-search-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Search Leads
              </label>

              <input
                id="lead-search-filter"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Name, email, phone, company, subject or requirement"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="lead-status-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Status
              </label>

              <select
                id="lead-status-filter"
                name="status"
                value={formFilters.status}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
                className="text-sm font-semibold text-slate-700"
              >
                Priority
              </label>

              <select
                id="lead-priority-filter"
                name="priority"
                value={formFilters.priority}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
                className="text-sm font-semibold text-slate-700"
              >
                Follow-up
              </label>

              <select
                id="lead-followup-filter"
                name="followUp"
                value={formFilters.followUp}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
                className="text-sm font-semibold text-slate-700"
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
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="lead-service-filter"
                className="text-sm font-semibold text-slate-700"
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
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="lead-assigned-filter"
                className="text-sm font-semibold text-slate-700"
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
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="lead-sort-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Sort
              </label>

              <select
                id="lead-sort-filter"
                name="sort"
                value={formFilters.sort}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
                className="text-sm font-semibold text-slate-700"
              >
                Leads per page
              </label>

              <select
                id="lead-limit-filter"
                name="limit"
                value={formFilters.limit}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="10">10 Leads</option>
                <option value="20">20 Leads</option>
                <option value="50">50 Leads</option>
                <option value="100">100 Leads</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
            >
              Clear Filters
            </button>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-600">
              {isLoading ? "Loading Leads..." : `${count} Lead(s) shown`}
            </p>

            {!isLoading && (
              <p className="mt-1 text-xs text-slate-400">
                {total} matching result(s) · Page {page} of {totalPages}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        {successMessage && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
          >
            <p className="text-sm font-semibold leading-6 text-emerald-700">
              {successMessage}
            </p>
          </div>
        )}

        {(error || actionError) && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5"
          >
            <p className="text-sm font-semibold text-red-700">
              {actionError || error}
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Try Again
            </button>
          </div>
        )}

        {isLoading && (
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {[1, 2, 3, 4].map((placeholder) => (
              <div
                key={placeholder}
                className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && leads.length === 0 && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-950">
              No Leads found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Change the filters or create a new CRM Lead.
            </p>
          </div>
        )}

        {!isLoading && leads.length > 0 && (
          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {leads.map((lead) => {
              const isDeleteAction =
                actionKey === `delete-${lead._id}`;

              return (
                <article
                  key={lead._id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 font-black text-brand-700">
                        {createInitials(lead.name)}
                      </div>

                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-bold text-slate-950">
                          {lead.name}
                        </h2>

                        <p className="mt-1 break-words text-sm font-semibold text-brand-600">
                          {lead.subject}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${
                              statusClasses[lead.status] ||
                              "border-slate-200 bg-slate-100 text-slate-600"
                            }`}
                          >
                            {statusLabels[lead.status] ||
                              lead.status ||
                              "Lead"}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${
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
                      <p className="text-sm font-bold text-slate-800">
                        {formatMoney(
                          lead.estimatedValue,
                          lead.currency,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {lead.source || "manual"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Email
                      </p>

                      <p className="mt-2 break-all text-sm font-semibold text-slate-700">
                        {lead.email || "Not provided"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Phone
                      </p>

                      <p className="mt-2 break-all text-sm font-semibold text-slate-700">
                        {lead.phone || "Not provided"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Service
                      </p>

                      <p className="mt-2 break-words text-sm font-semibold text-slate-700">
                        {lead.serviceTitle ||
                          lead.serviceSlug ||
                          "Not linked"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Assigned to
                      </p>

                      <p className="mt-2 break-words text-sm font-semibold text-slate-700">
                        {lead.assignedTo?.name ||
                          lead.assignedTo?.email ||
                          "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Next follow-up
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {formatDateTime(lead.nextFollowUpAt)}
                    </p>
                  </div>

                  {lead.requirementSummary && (
                    <p className="mt-5 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                      {lead.requirementSummary}
                    </p>
                  )}

                  <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                    <Link
                      to={`/admin/leads/${lead._id}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-300 bg-brand-50 px-5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
                    >
                      View / Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteLead(lead)}
                      disabled={Boolean(actionKey) || !canDeleteLeads}
                      title={
                        canDeleteLeads
                          ? "Permanently delete Lead"
                          : "Your role cannot permanently delete Leads"
                      }
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-300 bg-white px-5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleteAction ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && !error && totalPages > 1 && (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row">
            <p className="text-sm font-semibold text-slate-600">
              Page {page} of {totalPages}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminLeadsPage;
