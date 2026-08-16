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
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 motion-reduce:transition-none";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.12em] text-slate-500";

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
  if (auditLog?.actorType === "anonymous") {
    return "Anonymous";
  }

  if (auditLog?.actorType === "system") {
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
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (outcome === "failure") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (outcome === "denied") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function ActionBadge({ action }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${getActionBadgeClass(
        action,
      )}`}
    >
      {formatLabel(action) || "Unknown action"}
    </span>
  );
}

function OutcomeBadge({ outcome }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${getOutcomeBadgeClass(
        outcome,
      )}`}
    >
      {formatLabel(outcome) || "Unknown outcome"}
    </span>
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

  const [
    draftFilters,
    setDraftFilters,
  ] = useState(DEFAULT_FILTERS);

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
      accessToken &&
        isSuperAdmin,
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
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="max-w-3xl rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              Restricted Module
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Admin Activity / Audit Log
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Audit records contain security and administrative
              history. This read-only module is available to the
              Super Admin role only.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Security & Administration
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Admin Activity / Audit Log
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review immutable authentication, security, workflow,
              content, configuration and Media events recorded by
              the Admin audit system.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            {isLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </header>

        <section
          aria-labelledby="audit-log-filters-heading"
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="audit-log-filters-heading"
                className="text-lg font-bold text-slate-950"
              >
                Filter Audit Logs
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Narrow the read-only history by actor,
                classification, resource, outcome or UTC date
                range.
              </p>
            </div>

            {hasActiveFilters ? (
              <span className="w-fit rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                Filters applied
              </span>
            ) : null}
          </div>

          <form
            onSubmit={handleApplyFilters}
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
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
                Actor Role
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
                Resource Type
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
                      key={resourceType}
                      value={resourceType}
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
                Date From
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
                Date To
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
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                Apply Filters
              </button>

              <button
                type="button"
                onClick={
                  handleClearFilters
                }
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section
          aria-labelledby="audit-log-results-heading"
          className="mt-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="audit-log-results-heading"
                className="text-lg font-bold text-slate-950"
              >
                Activity Records
              </h2>

              <p
                aria-live="polite"
                className="mt-1 text-sm text-slate-500"
              >
                {isLoading
                  ? "Loading Audit Logs..."
                  : `${total} record${
                      total === 1
                        ? ""
                        : "s"
                    } found`}
              </p>
            </div>

            <span className="w-fit rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
              Read-only · Super Admin
            </span>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              <p className="font-bold text-red-900">
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
                  className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
                >
                  Try Again
                </button>
              ) : null}
            </div>
          ) : null}

          {!error &&
          !isLoading &&
          auditLogs.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <h3 className="text-base font-bold text-slate-900">
                No Audit Logs found
              </h3>

              <p className="mx-auto mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
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
              aria-live="polite"
              className="mt-4 space-y-3"
            >
              <span className="sr-only">
                Loading Audit Logs...
              </span>

              {[1, 2, 3].map(
                (placeholder) => (
                  <div
                    key={placeholder}
                    className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
                  />
                ),
              )}
            </div>
          ) : null}

          {auditLogs.length > 0 ? (
            <>
              <div className="mt-4 grid gap-3 lg:hidden">
                {auditLogs.map(
                  (auditLog) => (
                    <article
                      key={
                        auditLog._id
                      }
                      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <ActionBadge
                          action={
                            auditLog.action
                          }
                        />

                        <OutcomeBadge
                          outcome={
                            auditLog.outcome
                          }
                        />
                      </div>

                      <h3 className="mt-3 break-words text-base font-bold text-slate-950">
                        {getResourceLabel(
                          auditLog,
                        )}
                      </h3>

                      <dl className="mt-4 divide-y divide-slate-100 text-sm">
                        <div className="py-2.5 first:pt-0">
                          <dt className={labelClassName}>
                            Resource
                          </dt>

                          <dd className="mt-1 break-words font-semibold text-slate-800">
                            {formatLabel(
                              auditLog.resourceType,
                            ) || "—"}
                          </dd>
                        </div>

                        <div className="py-2.5">
                          <dt className={labelClassName}>
                            Actor
                          </dt>

                          <dd className="mt-1 break-words font-semibold text-slate-800">
                            {getActorLabel(
                              auditLog,
                            )}
                          </dd>

                          {auditLog.actorRoleSnapshot ? (
                            <dd className="mt-0.5 text-xs text-slate-500">
                              {formatLabel(
                                auditLog.actorRoleSnapshot,
                              )}
                            </dd>
                          ) : null}
                        </div>

                        <div className="py-2.5">
                          <dt className={labelClassName}>
                            Category
                          </dt>

                          <dd className="mt-1 break-words font-semibold text-slate-800">
                            {formatLabel(
                              auditLog.category,
                            ) || "—"}
                          </dd>
                        </div>

                        <div className="py-2.5 last:pb-0">
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
                        className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                      >
                        View Details
                      </Link>
                    </article>
                  ),
                )}
              </div>

              <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.1em] text-slate-500"
                        >
                          Time
                        </th>

                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.1em] text-slate-500"
                        >
                          Action
                        </th>

                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.1em] text-slate-500"
                        >
                          Actor
                        </th>

                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.1em] text-slate-500"
                        >
                          Resource
                        </th>

                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.1em] text-slate-500"
                        >
                          Category
                        </th>

                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.1em] text-slate-500"
                        >
                          Outcome
                        </th>

                        <th
                          scope="col"
                          className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.1em] text-slate-500"
                        >
                          <span className="sr-only">
                            Actions
                          </span>
                        </th>
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
                            <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-slate-600">
                              {formatDateTime(
                                auditLog.createdAt,
                              )}
                            </td>

                            <td className="px-4 py-3.5">
                              <ActionBadge
                                action={
                                  auditLog.action
                                }
                              />
                            </td>

                            <td className="max-w-56 px-4 py-3.5">
                              <p className="break-words text-sm font-semibold text-slate-900">
                                {getActorLabel(
                                  auditLog,
                                )}
                              </p>

                              {auditLog.actorRoleSnapshot ? (
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {formatLabel(
                                    auditLog.actorRoleSnapshot,
                                  )}
                                </p>
                              ) : null}
                            </td>

                            <td className="max-w-72 px-4 py-3.5">
                              <p className="break-words text-sm font-semibold text-slate-900">
                                {getResourceLabel(
                                  auditLog,
                                )}
                              </p>

                              <p className="mt-0.5 break-words text-xs text-slate-500">
                                {formatLabel(
                                  auditLog.resourceType,
                                ) || "—"}
                              </p>
                            </td>

                            <td className="px-4 py-3.5 text-sm font-medium text-slate-700">
                              {formatLabel(
                                auditLog.category,
                              ) || "—"}
                            </td>

                            <td className="px-4 py-3.5">
                              <OutcomeBadge
                                outcome={
                                  auditLog.outcome
                                }
                              />
                            </td>

                            <td className="px-4 py-3.5 text-right">
                              <Link
                                to={`/admin/audit-logs/${auditLog._id}`}
                                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
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
              className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
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
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
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
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                >
                  Next
                </button>
              </div>
            </nav>
          ) : null}
        </section>
      </section>
    </main>
  );
}

export default AdminAuditLogsPage;