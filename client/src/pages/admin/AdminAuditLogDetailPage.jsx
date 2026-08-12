import {
  useCallback,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import useAdminAuditLog from "../../hooks/useAdminAuditLog";
import useAdminAuth from "../../hooks/useAdminAuth";

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

  if (
    typeof value === "boolean"
  ) {
    return value ? "True" : "False";
  }

  if (
    typeof value === "number"
  ) {
    return String(value);
  }

  if (
    typeof value === "string"
  ) {
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

function DetailCard({
  title,
  children,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-black text-slate-950">
        {title}
      </h2>

      <div className="mt-5">
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
    <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
      <dt className={labelClassName}>
        {label}
      </dt>

      <dd
        className={`mt-2 break-words text-sm font-semibold text-slate-900 ${
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
              Audit Log details
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
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              to="/admin/audit-logs"
              className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              ← Audit Logs
            </Link>

            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
              Read-only event record
            </p>

            <h1 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Audit Log details
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Review the sanitized,
              immutable record for this
              administrative event.
            </p>
          </div>

          {!error ? (
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
          ) : null}
        </div>

        {isLoading &&
        !auditLog ? (
          <div
            role="status"
            className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500"
          >
            Loading Audit Log...
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-sm leading-6 text-red-700"
          >
            <p className="font-black">
              {isNotFound
                ? "Audit Log record not found."
                : isForbidden
                  ? "Audit Log access is restricted."
                  : "Unable to load Audit Log."}
            </p>

            <p className="mt-1">
              {error.message}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/admin/audit-logs"
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white"
              >
                Back to Audit Logs
              </Link>

              {!isNotFound &&
              !isForbidden ? (
                <button
                  type="button"
                  onClick={refresh}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-300 bg-white px-4 text-sm font-bold text-red-700"
                >
                  Try again
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {auditLog &&
        !error ? (
          <div className="mt-8 grid gap-6">
            <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-bold ${getActionBadgeClass(
                        auditLog.action,
                      )}`}
                    >
                      {formatLabel(
                        auditLog.action,
                      ) ||
                        "Unknown action"}
                    </span>

                    <span
                      className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-bold ${getOutcomeBadgeClass(
                        auditLog.outcome,
                      )}`}
                    >
                      {formatLabel(
                        auditLog.outcome,
                      ) ||
                        "Unknown outcome"}
                    </span>
                  </div>

                  <h2 className="mt-4 break-words text-2xl font-black sm:text-3xl">
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

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Recorded{" "}
                    {formatDateTime(
                      auditLog.createdAt,
                    )}
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-slate-700 bg-slate-900 p-4 lg:min-w-72">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    Audit Log ID
                  </p>

                  <p className="mt-2 break-all font-mono text-xs text-slate-200">
                    {auditLog._id}
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <DetailCard title="Actor">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailField
                    label="Actor type"
                    value={
                      formatLabel(
                        auditLog.actorType,
                      ) || "—"
                    }
                  />

                  <DetailField
                    label="Role snapshot"
                    value={
                      formatLabel(
                        auditLog.actorRoleSnapshot,
                      ) || "—"
                    }
                  />

                  <DetailField
                    label="Name snapshot"
                    value={
                      auditLog.actorNameSnapshot ||
                      "—"
                    }
                  />

                  <DetailField
                    label="Email snapshot"
                    value={
                      auditLog.actorEmailSnapshot ||
                      "—"
                    }
                  />

                  <div className="sm:col-span-2">
                    <DetailField
                      label="Admin ID"
                      value={
                        auditLog.actorAdminId ||
                        "—"
                      }
                      mono
                    />
                  </div>
                </dl>
              </DetailCard>

              <DetailCard title="Event classification">
                <dl className="grid gap-4 sm:grid-cols-2">
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

            <DetailCard title="Resource">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailField
                  label="Resource type"
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

            <DetailCard title="Changed fields">
              {changedFields.length ===
              0 ? (
                <p className="text-sm leading-6 text-slate-500">
                  No safe changed-field
                  values were recorded for
                  this event.
                </p>
              ) : (
                <div className="grid gap-4">
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
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <p className={labelClassName}>
                            {formatLabel(
                              fieldName,
                            )}
                          </p>

                          {hasFromTo ? (
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl bg-white p-3">
                                <p className="text-xs font-bold text-slate-400">
                                  From
                                </p>
                                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                                  {formatAuditValue(
                                    changeValue.from,
                                  )}
                                </p>
                              </div>

                              <div className="rounded-xl bg-white p-3">
                                <p className="text-xs font-bold text-slate-400">
                                  To
                                </p>
                                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                                  {formatAuditValue(
                                    changeValue.to,
                                  )}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-2 break-words text-sm font-semibold text-slate-800">
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

            <DetailCard title="Safe metadata">
              {Object.keys(
                metadata,
              ).length === 0 ? (
                <p className="text-sm leading-6 text-slate-500">
                  No additional safe
                  metadata was recorded.
                </p>
              ) : (
                <dl className="grid gap-4 sm:grid-cols-2">
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

            <DetailCard title="Request context">
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailField
                  label="HTTP method"
                  value={
                    request.method ||
                    auditLog.httpMethod ||
                    "—"
                  }
                />

                <DetailField
                  label="Route path"
                  value={
                    request.path ||
                    auditLog.routePath ||
                    "—"
                  }
                  mono
                />

                <DetailField
                  label="IP address"
                  value={
                    request.ip ||
                    auditLog.ip ||
                    "—"
                  }
                  mono
                />

                <DetailField
                  label="User agent"
                  value={
                    request.userAgent ||
                    auditLog.userAgent ||
                    "—"
                  }
                />
              </dl>
            </DetailCard>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/admin/audit-logs"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
              >
                ← Back to Audit Logs
              </Link>

              <Link
                to="/admin/dashboard"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400"
              >
                Admin Dashboard
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default AdminAuditLogDetailPage;
