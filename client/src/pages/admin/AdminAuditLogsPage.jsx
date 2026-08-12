import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import useAdminAuditLogs from "../../hooks/useAdminAuditLogs";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLES,
  AUDIT_CATEGORIES,
  AUDIT_OUTCOMES,
  AUDIT_RESOURCE_TYPES,
} from "../../services/adminAuditLogsApi";

const PAGE_LIMIT = 20;

const DEFAULT_FILTERS = {
  search: "",
  actorAdminId: "",
  actorRole: "",
  category: "",
  action: "",
  resourceType: "",
  resourceId: "",
  outcome: "",
  dateFrom: "",
  dateTo: "",
};

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.08em] text-slate-500";

function normalizeText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function formatLabel(value = "") {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "medium",
    },
  ).format(date);
}

function createUtcStartOfDay(value) {
  const cleanValue = normalizeText(value);

  if (!cleanValue) {
    return "";
  }

  return `${cleanValue}T00:00:00.000Z`;
}

function createUtcEndOfDay(value) {
  const cleanValue = normalizeText(value);

  if (!cleanValue) {
    return "";
  }

  return `${cleanValue}T23:59:59.999Z`;
}

function getActorLabel(auditLog) {
  if (
    auditLog?.actorType === "anonymous"
  ) {
    return "Anonymous";
  }

  if (
    auditLog?.actorType === "system"
  ) {
    return "System";
  }

  return (
    normalizeText(
      auditLog?.actorNameSnapshot,
    ) ||
    normalizeText(
      auditLog?.actorEmailSnapshot,
    ) ||
    "Admin"
  );
}

function getResourceLabel(auditLog) {
  return (
    normalizeText(
      auditLog?.resourceLabel,
    ) ||
    normalizeText(
      auditLog?.resourceSlug,
    ) ||
    normalizeText(
      auditLog?.resourceId,
    ) ||
    "—"
  );
}

function getActionBadgeClass(action) {
  switch (action) {
    case "create":
    case "upload":
    case "publish":
    case "login-success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "delete":
    case "unpublish":
    case "login-failed":
    case "account-lock":
      return "border-red-200 bg-red-50 text-red-700";

    case "status-change":
    case "assignment-change":
    case "convert":
    case "note-added":
    case "unsubscribe":
      return "border-amber-200 bg-amber-50 text-amber-800";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getOutcomeBadgeClass(outcome) {
  if (outcome === "success") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (outcome === "failure") {
    return "bg-red-100 text-red-800";
  }

  if (outcome === "denied") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-slate-100 text-slate-700";
}

function AuditSummaryBadges({
  auditLog,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-bold ${getActionBadgeClass(
          auditLog.action,
        )}`}
      >
        {formatLabel(auditLog.action) ||
          "Unknown action"}
      </span>

      <span
        className={`inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-bold ${getOutcomeBadgeClass(
          auditLog.outcome,
        )}`}
      >
        {formatLabel(auditLog.outcome) ||
          "Unknown outcome"}
      </span>
    </div>
  );
}

function AdminAuditLogsPage() {
  const {
    admin,
    accessToken,
    logout,
  } = useAdminAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [draftFilters, setDraftFilters] =
    useState(DEFAULT_FILTERS);

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);

  const isSuperAdmin =
    admin?.role === "super-admin";

  const handleUnauthorized =
    useCallback(() => {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: {
            pathname:
              location.pathname,
          },
        },
      });
    }, [
      location.pathname,
      logout,
      navigate,
    ]);

  const listFilters = useMemo(
    () => ({
      ...appliedFilters,
      dateFrom:
        createUtcStartOfDay(
          appliedFilters.dateFrom,
        ),
      dateTo:
        createUtcEndOfDay(
          appliedFilters.dateTo,
        ),
      page,
      limit: PAGE_LIMIT,
    }),
    [
      appliedFilters,
      page,
    ],
  );

  const {
    auditLogs,
    total,
    pages,
    isLoading,
    error,
    isForbidden,
    refresh,
  } = useAdminAuditLogs({
    accessToken,
    filters: listFilters,
    onUnauthorized:
      handleUnauthorized,
    enabled: Boolean(
      accessToken && isSuperAdmin,
    ),
  });

  function handleFilterChange(event) {
    const {
      name,
      value,
    } = event.target;

    setDraftFilters(
      (currentFilters) => ({
        ...currentFilters,
        [name]: value,
      }),
    );
  }

  function handleApplyFilters(event) {
    event.preventDefault();

    setAppliedFilters(
      Object.fromEntries(
        Object.entries(
          draftFilters,
        ).map(
          ([
            fieldName,
            fieldValue,
          ]) => [
            fieldName,
            normalizeText(fieldValue),
          ],
        ),
      ),
    );

    setPage(1);
  }

  function handleClearFilters() {
    setDraftFilters(
      DEFAULT_FILTERS,
    );
    setAppliedFilters(
      DEFAULT_FILTERS,
    );
    setPage(1);
  }

  const hasActiveFilters =
    Object.values(
      appliedFilters,
    ).some(Boolean);

  const safePages = Math.max(
    1,
    Number(pages) || 1,
  );

  const safePage = Math.min(
    Math.max(
      1,
      Number(page) || 1,
    ),
    safePages,
  );

  if (!isSuperAdmin) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <Link
            to="/admin"
            className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            ← Admin Dashboard
          </Link>

          <section className="mt-6 rounded-3xl border border-amber-200 bg-white p-7 shadow-sm sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
              Restricted module
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Admin Activity / Audit Log
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Audit records contain
              security and administrative
              history. This module is
              available to the Super Admin
              role only.
            </p>

            <Link
              to="/admin/dashboard"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              Return to Dashboard
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              to="/admin"
              className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              ← Admin Dashboard
            </Link>

            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
              Security & administration
            </p>

            <h1 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Admin Activity / Audit Log
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Review immutable Admin
              activity, authentication,
              workflow, content,
              configuration and Media
              events. Audit records are
              read-only.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        <section
          aria-labelledby="audit-log-filters-heading"
          className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="audit-log-filters-heading"
                className="text-lg font-black text-slate-950"
              >
                Filter Audit Logs
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Narrow records by actor,
                classification, resource,
                outcome or UTC date range.
              </p>
            </div>

            {hasActiveFilters ? (
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
                Filters applied
              </p>
            ) : null}
          </div>

          <form
            onSubmit={handleApplyFilters}
            className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <div className="md:col-span-2">
              <label
                htmlFor="audit-search"
                className={labelClassName}
              >
                Search
              </label>

              <input
                id="audit-search"
                name="search"
                type="search"
                value={
                  draftFilters.search
                }
                onChange={
                  handleFilterChange
                }
                placeholder="Actor or resource identity..."
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="audit-actor-role"
                className={labelClassName}
              >
                Actor role
              </label>

              <select
                id="audit-actor-role"
                name="actorRole"
                value={
                  draftFilters.actorRole
                }
                onChange={
                  handleFilterChange
                }
                className={inputClassName}
              >
                <option value="">
                  All roles
                </option>

                {AUDIT_ACTOR_ROLES.map(
                  (role) => (
                    <option
                      key={role}
                      value={role}
                    >
                      {formatLabel(role)}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="audit-category"
                className={labelClassName}
              >
                Category
              </label>

              <select
                id="audit-category"
                name="category"
                value={
                  draftFilters.category
                }
                onChange={
                  handleFilterChange
                }
                className={inputClassName}
              >
                <option value="">
                  All categories
                </option>

                {AUDIT_CATEGORIES.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {formatLabel(
                        category,
                      )}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="audit-action"
                className={labelClassName}
              >
                Action
              </label>

              <select
                id="audit-action"
                name="action"
                value={
                  draftFilters.action
                }
                onChange={
                  handleFilterChange
                }
                className={inputClassName}
              >
                <option value="">
                  All actions
                </option>

                {AUDIT_ACTIONS.map(
                  (action) => (
                    <option
                      key={action}
                      value={action}
                    >
                      {formatLabel(action)}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="audit-resource-type"
                className={labelClassName}
              >
                Resource type
              </label>

              <select
                id="audit-resource-type"
                name="resourceType"
                value={
                  draftFilters.resourceType
                }
                onChange={
                  handleFilterChange
                }
                className={inputClassName}
              >
                <option value="">
                  All resources
                </option>

                {AUDIT_RESOURCE_TYPES.map(
                  (resourceType) => (
                    <option
                      key={
                        resourceType
                      }
                      value={
                        resourceType
                      }
                    >
                      {formatLabel(
                        resourceType,
                      )}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="audit-outcome"
                className={labelClassName}
              >
                Outcome
              </label>

              <select
                id="audit-outcome"
                name="outcome"
                value={
                  draftFilters.outcome
                }
                onChange={
                  handleFilterChange
                }
                className={inputClassName}
              >
                <option value="">
                  All outcomes
                </option>

                {AUDIT_OUTCOMES.map(
                  (outcome) => (
                    <option
                      key={outcome}
                      value={outcome}
                    >
                      {formatLabel(
                        outcome,
                      )}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="audit-actor-admin-id"
                className={labelClassName}
              >
                Actor Admin ID
              </label>

              <input
                id="audit-actor-admin-id"
                name="actorAdminId"
                type="text"
                value={
                  draftFilters.actorAdminId
                }
                onChange={
                  handleFilterChange
                }
                placeholder="Optional ObjectId"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="audit-resource-id"
                className={labelClassName}
              >
                Resource ID
              </label>

              <input
                id="audit-resource-id"
                name="resourceId"
                type="text"
                value={
                  draftFilters.resourceId
                }
                onChange={
                  handleFilterChange
                }
                placeholder="Optional ObjectId"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="audit-date-from"
                className={labelClassName}
              >
                Date from
              </label>

              <input
                id="audit-date-from"
                name="dateFrom"
                type="date"
                value={
                  draftFilters.dateFrom
                }
                onChange={
                  handleFilterChange
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="audit-date-to"
                className={labelClassName}
              >
                Date to
              </label>

              <input
                id="audit-date-to"
                name="dateTo"
                type="date"
                value={
                  draftFilters.dateTo
                }
                onChange={
                  handleFilterChange
                }
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col gap-3 md:col-span-2 md:flex-row xl:col-span-4">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
              >
                Apply filters
              </button>

              <button
                type="button"
                onClick={
                  handleClearFilters
                }
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section
          aria-labelledby="audit-log-results-heading"
          className="mt-8"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="audit-log-results-heading"
                className="text-xl font-black text-slate-950"
              >
                Activity records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isLoading
                  ? "Loading Audit Logs..."
                  : `${total} record${
                      total === 1
                        ? ""
                        : "s"
                    } found`}
              </p>
            </div>

            <p className="text-sm font-semibold text-slate-500">
              Read-only · Super Admin
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700"
            >
              <p className="font-bold">
                {isForbidden
                  ? "Audit Log access is restricted."
                  : "Unable to load Audit Logs."}
              </p>

              <p className="mt-1">
                {error.message}
              </p>

              {!isForbidden ? (
                <button
                  type="button"
                  onClick={refresh}
                  className="mt-3 min-h-10 font-bold underline underline-offset-4"
                >
                  Try again
                </button>
              ) : null}
            </div>
          ) : null}

          {!error &&
          !isLoading &&
          auditLogs.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="text-lg font-black text-slate-900">
                No Audit Logs found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {hasActiveFilters
                  ? "Try clearing or changing the current filters."
                  : "Recorded Admin activity will appear here."}
              </p>
            </div>
          ) : null}

          {isLoading &&
          auditLogs.length === 0 ? (
            <div
              role="status"
              className="mt-5 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500"
            >
              Loading Audit Logs...
            </div>
          ) : null}

          {auditLogs.length > 0 ? (
            <>
              <div className="mt-5 grid gap-4 lg:hidden">
                {auditLogs.map(
                  (auditLog) => (
                    <article
                      key={
                        auditLog._id
                      }
                      className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <AuditSummaryBadges
                        auditLog={
                          auditLog
                        }
                      />

                      <h3 className="mt-4 break-words text-lg font-black text-slate-950">
                        {getResourceLabel(
                          auditLog,
                        )}
                      </h3>

                      <dl className="mt-4 grid gap-3 text-sm">
                        <div>
                          <dt className={labelClassName}>
                            Resource
                          </dt>
                          <dd className="mt-1 break-words font-semibold text-slate-800">
                            {formatLabel(
                              auditLog.resourceType,
                            ) || "—"}
                          </dd>
                        </div>

                        <div>
                          <dt className={labelClassName}>
                            Actor
                          </dt>
                          <dd className="mt-1 break-words font-semibold text-slate-800">
                            {getActorLabel(
                              auditLog,
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt className={labelClassName}>
                            Category
                          </dt>
                          <dd className="mt-1 break-words font-semibold text-slate-800">
                            {formatLabel(
                              auditLog.category,
                            ) || "—"}
                          </dd>
                        </div>

                        <div>
                          <dt className={labelClassName}>
                            Recorded
                          </dt>
                          <dd className="mt-1 break-words font-semibold text-slate-800">
                            {formatDateTime(
                              auditLog.createdAt,
                            )}
                          </dd>
                        </div>
                      </dl>

                      <Link
                        to={`/admin/audit-logs/${auditLog._id}`}
                        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
                      >
                        View details
                      </Link>
                    </article>
                  ),
                )}
              </div>

              <div className="mt-5 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        {[
                          "Time",
                          "Action",
                          "Actor",
                          "Resource",
                          "Category",
                          "Outcome",
                          "",
                        ].map(
                          (heading) => (
                            <th
                              key={
                                heading ||
                                "actions"
                              }
                              scope="col"
                              className="px-5 py-4 text-left text-xs font-black uppercase tracking-[0.08em] text-slate-500"
                            >
                              {heading}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map(
                        (auditLog) => (
                          <tr
                            key={
                              auditLog._id
                            }
                            className="align-top"
                          >
                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                              {formatDateTime(
                                auditLog.createdAt,
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <AuditSummaryBadges
                                auditLog={
                                  auditLog
                                }
                              />
                            </td>

                            <td className="max-w-52 px-5 py-4">
                              <p className="break-words text-sm font-bold text-slate-900">
                                {getActorLabel(
                                  auditLog,
                                )}
                              </p>

                              {auditLog.actorRoleSnapshot ? (
                                <p className="mt-1 text-xs text-slate-500">
                                  {formatLabel(
                                    auditLog.actorRoleSnapshot,
                                  )}
                                </p>
                              ) : null}
                            </td>

                            <td className="max-w-64 px-5 py-4">
                              <p className="break-words text-sm font-bold text-slate-900">
                                {getResourceLabel(
                                  auditLog,
                                )}
                              </p>

                              <p className="mt-1 break-words text-xs text-slate-500">
                                {formatLabel(
                                  auditLog.resourceType,
                                ) || "—"}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                              {formatLabel(
                                auditLog.category,
                              ) || "—"}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getOutcomeBadgeClass(
                                  auditLog.outcome,
                                )}`}
                              >
                                {formatLabel(
                                  auditLog.outcome,
                                ) || "—"}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <Link
                                to={`/admin/audit-logs/${auditLog._id}`}
                                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
                              >
                                Details
                              </Link>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}

          {!error &&
          safePages > 1 ? (
            <nav
              aria-label="Audit Log pagination"
              className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-center text-sm font-semibold text-slate-600 sm:text-left">
                Page {safePage} of{" "}
                {safePages}
              </p>

              <div className="grid grid-cols-2 gap-3 sm:flex">
                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (
                        currentPage,
                      ) =>
                        Math.max(
                          1,
                          currentPage -
                            1,
                        ),
                    )
                  }
                  disabled={
                    isLoading ||
                    safePage <= 1
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (
                        currentPage,
                      ) =>
                        Math.min(
                          safePages,
                          currentPage +
                            1,
                        ),
                    )
                  }
                  disabled={
                    isLoading ||
                    safePage >=
                      safePages
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default AdminAuditLogsPage;
