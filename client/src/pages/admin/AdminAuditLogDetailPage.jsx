import { useCallback } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import useAdminAuditLog from "../../hooks/useAdminAuditLog";
import useAdminAuth from "../../hooks/useAdminAuth";

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
      dateStyle: "full",
      timeStyle: "medium",
    },
  ).format(date);
}

function formatAuditValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map(formatAuditValue)
      .join(", ");
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
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

function DetailCard({
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-lg font-bold text-slate-950">
          {title}
        </h2>

        {description ? (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        {children}
      </div>
    </section>
  );
}

function DetailField({
  label,
  value,
  mono = false,
}) {
  return (
    <div className="min-w-0 border-b border-slate-100 py-3 first:pt-0 last:border-b-0 last:pb-0">
      <dt className={labelClassName}>
        {label}
      </dt>

      <dd
        className={`mt-1.5 break-words text-sm font-semibold leading-6 text-slate-800 ${
          mono
            ? "font-mono text-xs"
            : ""
        }`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

function AdminAuditLogDetailPage() {
  const {
    id = "",
  } = useParams();

  const {
    admin,
    accessToken,
    logout,
  } = useAdminAuth();

  const navigate = useNavigate();
  const location = useLocation();

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

  const {
    auditLog,
    isLoading,
    error,
    isNotFound,
    isForbidden,
    refresh,
  } = useAdminAuditLog({
    accessToken,
    auditLogId: id,
    onUnauthorized:
      handleUnauthorized,
    enabled: Boolean(
      accessToken &&
        isSuperAdmin &&
        id,
    ),
  });

  if (!isSuperAdmin) {
    return (
      <main className="min-h-screen bg-slate-100">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="max-w-3xl rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
              Restricted Module
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Audit Log Details
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

  const changedFields =
    Array.isArray(
      auditLog?.changedFields,
    )
      ? auditLog.changedFields
      : [];

  const changes =
    auditLog?.changes &&
    typeof auditLog.changes ===
      "object" &&
    !Array.isArray(
      auditLog.changes,
    )
      ? auditLog.changes
      : {};

  const metadata =
    auditLog?.metadata &&
    typeof auditLog.metadata ===
      "object" &&
    !Array.isArray(
      auditLog.metadata,
    )
      ? auditLog.metadata
      : {};

  const request =
    auditLog?.request &&
    typeof auditLog.request ===
      "object" &&
    !Array.isArray(
      auditLog.request,
    )
      ? auditLog.request
      : {};

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              to="/admin/audit-logs"
              className="inline-flex min-h-10 items-center text-sm font-bold text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              ← Audit Logs
            </Link>

            <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
              Read-only Event Record
            </p>

            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Audit Log Details
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review the sanitized, immutable event record captured
              by the Admin audit system.
            </p>
          </div>

          {!error ? (
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
          ) : null}
        </header>

        {isLoading &&
        !auditLog ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 space-y-4"
          >
            <span className="sr-only">
              Loading Audit Log...
            </span>

            <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />

              <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />
            </div>

            <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none" />
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700"
          >
            <p className="font-bold text-red-900">
              {isNotFound
                ? "Audit Log record not found."
                : isForbidden
                  ? "Audit Log access is restricted."
                  : "Unable to load Audit Log."}
            </p>

            <p className="mt-1">
              {error.message}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/admin/audit-logs"
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                Back to Audit Logs
              </Link>

              {!isNotFound &&
              !isForbidden ? (
                <button
                  type="button"
                  onClick={refresh}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
                >
                  Try Again
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {auditLog &&
        !error ? (
          <div className="mt-6 grid gap-5">
            <section
              aria-labelledby="audit-event-summary-heading"
              className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex min-h-7 items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${getActionBadgeClass(
                        auditLog.action,
                      )}`}
                    >
                      {formatLabel(
                        auditLog.action,
                      ) ||
                        "Unknown action"}
                    </span>

                    <span
                      className={`inline-flex min-h-7 items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${getOutcomeBadgeClass(
                        auditLog.outcome,
                      )}`}
                    >
                      {formatLabel(
                        auditLog.outcome,
                      ) ||
                        "Unknown outcome"}
                    </span>
                  </div>

                  <h2
                    id="audit-event-summary-heading"
                    className="mt-4 break-words text-xl font-bold sm:text-2xl"
                  >
                    {normalizeText(
                      auditLog.resourceLabel,
                    ) ||
                      normalizeText(
                        auditLog.resourceSlug,
                      ) ||
                      formatLabel(
                        auditLog.resourceType,
                      ) ||
                      "Audit event"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Recorded{" "}
                    {formatDateTime(
                      auditLog.createdAt,
                    )}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border border-slate-700 bg-slate-900 p-4 lg:min-w-72 lg:max-w-md">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    Audit Log ID
                  </p>

                  <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-200">
                    {auditLog._id}
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <DetailCard title="Actor">
                <dl className="divide-y divide-slate-100">
                  <DetailField
                    label="Actor Type"
                    value={
                      formatLabel(
                        auditLog.actorType,
                      ) || "—"
                    }
                  />

                  <DetailField
                    label="Role Snapshot"
                    value={
                      formatLabel(
                        auditLog.actorRoleSnapshot,
                      ) || "—"
                    }
                  />

                  <DetailField
                    label="Name Snapshot"
                    value={
                      auditLog.actorNameSnapshot ||
                      "—"
                    }
                  />

                  <DetailField
                    label="Email Snapshot"
                    value={
                      auditLog.actorEmailSnapshot ||
                      "—"
                    }
                  />

                  <DetailField
                    label="Admin ID"
                    value={
                      auditLog.actorAdminId ||
                      "—"
                    }
                    mono
                  />
                </dl>
              </DetailCard>

              <DetailCard title="Event Classification">
                <dl className="divide-y divide-slate-100">
                  <DetailField
                    label="Category"
                    value={
                      formatLabel(
                        auditLog.category,
                      ) || "—"
                    }
                  />

                  <DetailField
                    label="Action"
                    value={
                      formatLabel(
                        auditLog.action,
                      ) || "—"
                    }
                  />

                  <DetailField
                    label="Outcome"
                    value={
                      formatLabel(
                        auditLog.outcome,
                      ) || "—"
                    }
                  />

                  <DetailField
                    label="Recorded"
                    value={formatDateTime(
                      auditLog.createdAt,
                    )}
                  />
                </dl>
              </DetailCard>
            </div>

            <DetailCard
              title="Resource"
              description="Resource identity captured at the time of the event."
            >
              <dl className="grid gap-x-5 sm:grid-cols-2 lg:grid-cols-4">
                <DetailField
                  label="Resource Type"
                  value={
                    formatLabel(
                      auditLog.resourceType,
                    ) || "—"
                  }
                />

                <DetailField
                  label="Label"
                  value={
                    auditLog.resourceLabel ||
                    "—"
                  }
                />

                <DetailField
                  label="Slug"
                  value={
                    auditLog.resourceSlug ||
                    "—"
                  }
                />

                <DetailField
                  label="Resource ID"
                  value={
                    auditLog.resourceId ||
                    "—"
                  }
                  mono
                />
              </dl>
            </DetailCard>

            <DetailCard
              title="Changed Fields"
              description="Only safe changed-field values included in the sanitized Audit record are shown here."
            >
              {changedFields.length ===
              0 ? (
                <p className="text-sm leading-6 text-slate-500">
                  No safe changed-field values were recorded for
                  this event.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {changedFields.map(
                    (fieldName) => {
                      const changeValue =
                        changes[
                          fieldName
                        ];

                      const hasFromTo =
                        changeValue &&
                        typeof changeValue ===
                          "object" &&
                        !Array.isArray(
                          changeValue,
                        ) &&
                        (
                          Object.prototype.hasOwnProperty.call(
                            changeValue,
                            "from",
                          ) ||
                          Object.prototype.hasOwnProperty.call(
                            changeValue,
                            "to",
                          )
                        );

                      return (
                        <div
                          key={
                            fieldName
                          }
                          className="py-4 first:pt-0 last:pb-0"
                        >
                          <p className={labelClassName}>
                            {formatLabel(
                              fieldName,
                            )}
                          </p>

                          {hasFromTo ? (
                            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                                  From
                                </dt>

                                <dd className="mt-1.5 break-words text-sm font-semibold leading-6 text-slate-800">
                                  {formatAuditValue(
                                    changeValue.from,
                                  )}
                                </dd>
                              </div>

                              <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                                <dt className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                                  To
                                </dt>

                                <dd className="mt-1.5 break-words text-sm font-semibold leading-6 text-slate-800">
                                  {formatAuditValue(
                                    changeValue.to,
                                  )}
                                </dd>
                              </div>
                            </dl>
                          ) : (
                            <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-800">
                              {formatAuditValue(
                                changeValue,
                              )}
                            </p>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </DetailCard>

            <DetailCard
              title="Safe Metadata"
              description="Only metadata already sanitized and allowlisted by the Audit API is rendered."
            >
              {Object.keys(
                metadata,
              ).length === 0 ? (
                <p className="text-sm leading-6 text-slate-500">
                  No additional safe metadata was recorded.
                </p>
              ) : (
                <dl className="grid gap-x-5 sm:grid-cols-2">
                  {Object.entries(
                    metadata,
                  ).map(
                    ([
                      fieldName,
                      fieldValue,
                    ]) => (
                      <DetailField
                        key={
                          fieldName
                        }
                        label={formatLabel(
                          fieldName,
                        )}
                        value={formatAuditValue(
                          fieldValue,
                        )}
                      />
                    ),
                  )}
                </dl>
              )}
            </DetailCard>

            <DetailCard
              title="Request Context"
              description="Sanitized request context associated with the recorded event."
            >
              <dl className="grid gap-x-5 sm:grid-cols-2">
                <DetailField
                  label="HTTP Method"
                  value={
                    request.method ||
                    auditLog.httpMethod ||
                    "—"
                  }
                />

                <DetailField
                  label="Route Path"
                  value={
                    request.path ||
                    auditLog.routePath ||
                    "—"
                  }
                  mono
                />

                <DetailField
                  label="IP Address"
                  value={
                    request.ip ||
                    auditLog.ip ||
                    "—"
                  }
                  mono
                />

                <DetailField
                  label="User Agent"
                  value={
                    request.userAgent ||
                    auditLog.userAgent ||
                    "—"
                  }
                />
              </dl>
            </DetailCard>

            <div>
              <Link
                to="/admin/audit-logs"
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                ← Back to Audit Logs
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default AdminAuditLogDetailPage;