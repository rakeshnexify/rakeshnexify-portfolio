import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import AppointmentStatusBadge from "../../components/admin/appointments/AppointmentStatusBadge";
import AppointmentUpdateForm from "../../components/admin/appointments/AppointmentUpdateForm";
import ConvertAppointmentToLeadForm from "../../components/admin/appointments/ConvertAppointmentToLeadForm";
import useAdminAuth from "../../hooks/useAdminAuth";
import {
  convertAdminAppointmentToLead,
  deleteAdminAppointment,
  fetchAdminAppointmentById,
  updateAdminAppointment,
} from "../../services/adminAppointmentsApi";

const UPDATE_ROLES = [
  "super-admin",
  "admin",
  "editor",
];

const DELETE_ROLES = [
  "super-admin",
  "admin",
];

function normalizeText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeFieldErrors(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return Object.entries(value).reduce(
    (errors, [fieldName, message]) => {
      if (
        typeof message === "string" &&
        message.trim()
      ) {
        errors[fieldName] =
          message.trim();
      }

      return errors;
    },
    {},
  );
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPreferredDate(value) {
  if (!value) {
    return "—";
  }

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (!match) {
    return String(value);
  }

  const [, year, month, day] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  );

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function formatMeetingType(value) {
  if (value === "video-call") {
    return "Video call";
  }

  if (value === "phone-call") {
    return "Phone call";
  }

  return value || "—";
}

function getAdminLabel(value) {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return "—";
  }

  return (
    normalizeText(value.name) ||
    normalizeText(value.email) ||
    "Admin"
  );
}

function getServiceTitle(appointment) {
  return (
    normalizeText(
      appointment?.serviceTitle,
    ) ||
    normalizeText(
      appointment?.service?.title,
    ) ||
    "Service not specified"
  );
}

function getPackageName(appointment) {
  return (
    normalizeText(
      appointment?.servicePackageName,
    ) ||
    normalizeText(
      appointment?.servicePackage?.name,
    ) ||
    "No package selected"
  );
}

function getLeadId(lead) {
  if (!lead) {
    return "";
  }

  if (typeof lead === "string") {
    return lead.trim();
  }

  if (typeof lead === "object") {
    return normalizeText(
      lead._id || lead.id,
    );
  }

  return "";
}

function DetailRow({
  label,
  value,
  children,
}) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      {children || (
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || "—"}
        </p>
      )}
    </div>
  );
}

function AdminAppointmentDetailPage() {
  const { id = "" } = useParams();

  const {
    admin,
    accessToken,
    logout,
  } = useAdminAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [appointment, setAppointment] =
    useState(null);

  const [linkedLead, setLinkedLead] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [refreshKey, setRefreshKey] =
    useState(0);

  const [
    isUpdating,
    setIsUpdating,
  ] = useState(false);

  const [
    updateFieldErrors,
    setUpdateFieldErrors,
  ] = useState({});

  const [
    updateStatus,
    setUpdateStatus,
  ] = useState(null);

  const [
    isConverting,
    setIsConverting,
  ] = useState(false);

  const [
    conversionFieldErrors,
    setConversionFieldErrors,
  ] = useState({});

  const [
    conversionStatus,
    setConversionStatus,
  ] = useState(null);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

  const role = normalizeText(
    admin?.role,
  ).toLowerCase();

  const canUpdate =
    UPDATE_ROLES.includes(role);

  const canConvert = canUpdate;

  const canDelete =
    DELETE_ROLES.includes(role);

  const handleUnauthorized = useCallback(
    () => {
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
    },
    [
      location.pathname,
      logout,
      navigate,
    ],
  );

  useEffect(() => {
    if (!accessToken || !id) {
      return undefined;
    }

    const controller =
      new AbortController();

    async function loadAppointment() {
      try {
        setIsLoading(true);
        setLoadError("");

        const result =
          await fetchAdminAppointmentById(
            accessToken,
            id,
            {
              signal:
                controller.signal,
            },
          );

        if (controller.signal.aborted) {
          return;
        }

        setAppointment(result);
        setLinkedLead(
          result?.linkedLead || null,
        );
      } catch (error) {
        if (
          controller.signal.aborted ||
          error?.name === "AbortError"
        ) {
          return;
        }

        if (error?.status === 401) {
          handleUnauthorized();

          return;
        }

        setAppointment(null);
        setLinkedLead(null);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load the consultation request.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadAppointment();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    handleUnauthorized,
    id,
    refreshKey,
  ]);

  async function handleUpdate(payload) {
    if (
      !canUpdate ||
      !appointment ||
      isUpdating
    ) {
      return;
    }

    setIsUpdating(true);
    setUpdateFieldErrors({});
    setUpdateStatus(null);

    try {
      const result =
        await updateAdminAppointment(
          accessToken,
          appointment._id,
          payload,
        );

      setAppointment(
        (currentAppointment) => ({
          ...currentAppointment,
          ...result.appointment,
        }),
      );

      setUpdateStatus({
        type: "success",
        message: result.message,
      });
    } catch (error) {
      if (error?.status === 401) {
        handleUnauthorized();

        return;
      }

      setUpdateFieldErrors(
        normalizeFieldErrors(
          error?.fieldErrors,
        ),
      );

      setUpdateStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to update the Appointment.",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleConvert(payload) {
    if (
      !canConvert ||
      !appointment ||
      linkedLead ||
      isConverting
    ) {
      return;
    }

    setIsConverting(true);
    setConversionFieldErrors({});
    setConversionStatus(null);

    try {
      const result =
        await convertAdminAppointmentToLead(
          accessToken,
          appointment._id,
          payload,
        );

      setLinkedLead(result.lead);

      setConversionStatus({
        type: "success",
        message: result.message,
      });
    } catch (error) {
      if (error?.status === 401) {
        handleUnauthorized();

        return;
      }

      setConversionFieldErrors(
        normalizeFieldErrors(
          error?.fieldErrors,
        ),
      );

      setConversionStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to convert this Appointment to a Lead.",
      });

      if (error?.status === 409) {
        setRefreshKey(
          (currentKey) =>
            currentKey + 1,
        );
      }
    } finally {
      setIsConverting(false);
    }
  }

  async function handleDelete() {
    if (
      !canDelete ||
      !appointment ||
      isDeleting
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete consultation request from "${appointment.name || "this requester"}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deleteAdminAppointment(
        accessToken,
        appointment._id,
      );

      navigate("/admin/appointments", {
        replace: true,
      });
    } catch (error) {
      if (error?.status === 401) {
        handleUnauthorized();

        return;
      }

      setDeleteError(
        error instanceof Error
          ? error.message
          : "Unable to delete the Appointment.",
      );

      if (error?.status === 409) {
        setRefreshKey(
          (currentKey) =>
            currentKey + 1,
        );
      }
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading && !appointment) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
        <div
          role="status"
          className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500"
        >
          Loading consultation request...
        </div>
      </main>
    );
  }

  if (!appointment) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/admin/appointments"
            className="inline-flex min-h-10 items-center text-sm font-bold text-brand-700"
          >
            ← Consultation requests
          </Link>

          <div
            role="alert"
            className="mt-5 rounded-3xl border border-red-200 bg-red-50 p-7 text-red-700"
          >
            <h1 className="text-xl font-black">
              Unable to open Appointment
            </h1>

            <p className="mt-2 text-sm leading-6">
              {loadError ||
                "The consultation request could not be loaded."}
            </p>

            <button
              type="button"
              onClick={() =>
                setRefreshKey(
                  (currentKey) =>
                    currentKey + 1,
                )
              }
              className="mt-4 min-h-10 font-bold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const leadId = getLeadId(linkedLead);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              to="/admin/appointments"
              className="inline-flex min-h-10 items-center text-sm font-bold text-brand-700 hover:text-brand-800"
            >
              ← Consultation requests
            </Link>

            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
              Appointment detail
            </p>

            <h1 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {appointment.name ||
                "Consultation request"}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <AppointmentStatusBadge
                status={appointment.status}
              />

              <span className="text-sm font-semibold text-slate-500">
                Submitted{" "}
                {formatDateTime(
                  appointment.createdAt,
                )}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setRefreshKey(
                (currentKey) =>
                  currentKey + 1,
              )
            }
            disabled={isLoading}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {loadError ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"
          >
            {loadError}
          </div>
        ) : null}

        <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.72fr)] xl:items-start">
          <div className="min-w-0 space-y-6">
            <section
              aria-labelledby="appointment-requester-heading"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2
                id="appointment-requester-heading"
                className="text-xl font-black text-slate-950"
              >
                Requester
              </h2>

              <div className="mt-3">
                <DetailRow
                  label="Name"
                  value={appointment.name}
                />

                <DetailRow label="Email">
                  {appointment.email ? (
                    <a
                      href={`mailto:${appointment.email}`}
                      className="mt-1 inline-block break-all text-sm font-bold text-brand-700 hover:text-brand-800"
                    >
                      {appointment.email}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      —
                    </p>
                  )}
                </DetailRow>

                <DetailRow label="Phone">
                  {appointment.phone ? (
                    <a
                      href={`tel:${appointment.phone}`}
                      className="mt-1 inline-block text-sm font-bold text-brand-700 hover:text-brand-800"
                    >
                      {appointment.phone}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      —
                    </p>
                  )}
                </DetailRow>

                <DetailRow
                  label="Company"
                  value={
                    appointment.companyName ||
                    "Not specified"
                  }
                />
              </div>
            </section>

            <section
              aria-labelledby="appointment-context-heading"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2
                id="appointment-context-heading"
                className="text-xl font-black text-slate-950"
              >
                Consultation context
              </h2>

              <div className="mt-3">
                <DetailRow
                  label="Service"
                  value={getServiceTitle(
                    appointment,
                  )}
                />

                <DetailRow
                  label="Package"
                  value={getPackageName(
                    appointment,
                  )}
                />

                <DetailRow
                  label="Meeting type"
                  value={formatMeetingType(
                    appointment.meetingType,
                  )}
                />

                <DetailRow
                  label="Assigned Admin"
                  value={
                    appointment.assignedTo
                      ? getAdminLabel(
                          appointment.assignedTo,
                        )
                      : "Unassigned"
                  }
                />
              </div>
            </section>

            <section
              aria-labelledby="appointment-preferred-heading"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2
                id="appointment-preferred-heading"
                className="text-xl font-black text-slate-950"
              >
                Preferred consultation
              </h2>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                This is the requester&apos;s
                preferred schedule, not the
                confirmed Appointment time.
              </p>

              <div className="mt-3">
                <DetailRow
                  label="Preferred date"
                  value={formatPreferredDate(
                    appointment.preferredDate,
                  )}
                />

                <DetailRow
                  label="Preferred time"
                  value={
                    appointment.preferredTime
                  }
                />

                <DetailRow
                  label="Timezone"
                  value={appointment.timezone}
                />

                <DetailRow
                  label="Confirmed schedule"
                  value={formatDateTime(
                    appointment.scheduledAt,
                  )}
                />
              </div>
            </section>

            <section
              aria-labelledby="appointment-project-heading"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2
                id="appointment-project-heading"
                className="text-xl font-black text-slate-950"
              >
                Project details
              </h2>

              <div className="mt-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Project summary
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {appointment.projectSummary ||
                    "—"}
                </p>
              </div>

              <div className="mt-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Additional message
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {appointment.message ||
                    "No additional message."}
                </p>
              </div>
            </section>

            <section
              aria-labelledby="appointment-audit-heading"
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2
                id="appointment-audit-heading"
                className="text-xl font-black text-slate-950"
              >
                Audit
              </h2>

              <div className="mt-3">
                <DetailRow
                  label="Created"
                  value={formatDateTime(
                    appointment.createdAt,
                  )}
                />

                <DetailRow
                  label="Last updated"
                  value={formatDateTime(
                    appointment.updatedAt,
                  )}
                />

                <DetailRow
                  label="Status updated"
                  value={formatDateTime(
                    appointment.statusUpdatedAt,
                  )}
                />

                <DetailRow
                  label="Status updated by"
                  value={
                    appointment.statusUpdatedBy
                      ? getAdminLabel(
                          appointment.statusUpdatedBy,
                        )
                      : "—"
                  }
                />
              </div>
            </section>
          </div>

          <div className="min-w-0 space-y-6">
            <AppointmentUpdateForm
              appointment={appointment}
              admin={admin}
              canUpdate={canUpdate}
              isSubmitting={isUpdating}
              fieldErrors={
                updateFieldErrors
              }
              formStatus={updateStatus}
              onSubmit={handleUpdate}
            />

            {linkedLead ? (
              <section
                aria-labelledby="appointment-linked-lead-heading"
                className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-6"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                  CRM conversion
                </p>

                <h2
                  id="appointment-linked-lead-heading"
                  className="mt-2 text-xl font-black text-emerald-950"
                >
                  Linked Lead
                </h2>

                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  This Appointment has already
                  been converted to a CRM Lead.
                </p>

                <dl className="mt-5 rounded-2xl border border-emerald-200 bg-white p-4">
                  <DetailRow
                    label="Lead"
                    value={
                      linkedLead.name ||
                      appointment.name
                    }
                  />

                  <DetailRow
                    label="Subject"
                    value={
                      linkedLead.subject ||
                      "—"
                    }
                  />

                  <DetailRow
                    label="Status"
                    value={
                      linkedLead.status ||
                      "—"
                    }
                  />

                  <DetailRow
                    label="Priority"
                    value={
                      linkedLead.priority ||
                      "—"
                    }
                  />

                  <DetailRow
                    label="Created"
                    value={formatDateTime(
                      linkedLead.createdAt,
                    )}
                  />
                </dl>

                {leadId ? (
                  <Link
                    to={`/admin/leads/${leadId}/edit`}
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-800"
                  >
                    Open linked Lead
                  </Link>
                ) : null}
              </section>
            ) : (
              <ConvertAppointmentToLeadForm
                appointment={appointment}
                admin={admin}
                canConvert={canConvert}
                isSubmitting={isConverting}
                fieldErrors={
                  conversionFieldErrors
                }
                formStatus={
                  conversionStatus
                }
                onSubmit={handleConvert}
              />
            )}

            {canDelete ? (
              <section
                aria-labelledby="appointment-delete-heading"
                className="rounded-3xl border border-red-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-600">
                  Destructive action
                </p>

                <h2
                  id="appointment-delete-heading"
                  className="mt-2 text-xl font-black text-slate-950"
                >
                  Permanently delete
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This permanently removes the
                  Appointment. Converted
                  Appointments are protected by
                  the backend and cannot be
                  deleted while their linked
                  Lead exists.
                </p>

                {deleteError ? (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
                  >
                    {deleteError}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting
                    ? "Deleting..."
                    : "Delete Appointment"}
                </button>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminAppointmentDetailPage;