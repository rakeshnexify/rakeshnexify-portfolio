import {
  useMemo,
  useState,
} from "react";

const STATUS_OPTIONS = [
  {
    value: "requested",
    label: "Requested",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
  {
    value: "declined",
    label: "Declined",
  },
  {
    value: "no-show",
    label: "No-show",
  },
];

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.08em] text-slate-500";

const errorClassName =
  "mt-2 text-sm leading-6 text-red-600";

function normalizeText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getRecordId(record) {
  if (!record) {
    return "";
  }

  if (typeof record === "string") {
    return record.trim();
  }

  if (typeof record === "object") {
    return normalizeText(
      record._id || record.id,
    );
  }

  return "";
}

function getAdminLabel(admin) {
  if (!admin || typeof admin !== "object") {
    return "";
  }

  return (
    normalizeText(admin.name) ||
    normalizeText(admin.email) ||
    "Admin"
  );
}

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part) =>
    String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function createInitialValues(appointment) {
  return {
    status:
      normalizeText(appointment?.status) ||
      "requested",
    assignedTo: getRecordId(
      appointment?.assignedTo,
    ),
    scheduledAt: toDateTimeLocal(
      appointment?.scheduledAt,
    ),
    adminNote:
      typeof appointment?.adminNote ===
      "string"
        ? appointment.adminNote
        : "",
    cancellationReason:
      typeof appointment?.cancellationReason ===
      "string"
        ? appointment.cancellationReason
        : "",
  };
}

function createAssignmentOptions(
  appointment,
  admin,
) {
  const options = [];
  const seen = new Set();

  function addOption(record) {
    const id = getRecordId(record);

    if (!id || seen.has(id)) {
      return;
    }

    seen.add(id);

    options.push({
      id,
      label: getAdminLabel(record),
    });
  }

  addOption(appointment?.assignedTo);
  addOption(admin);

  return options;
}

function getErrorId(fieldName) {
  return `appointment-update-${fieldName}-error`;
}

function AppointmentUpdateFormFields({
  appointment,
  admin,
  canUpdate = false,
  isSubmitting = false,
  fieldErrors = {},
  formStatus = null,
  onSubmit,
}) {
  const [values, setValues] = useState(() =>
    createInitialValues(appointment),
  );

  const assignmentOptions = useMemo(
    () =>
      createAssignmentOptions(
        appointment,
        admin,
      ),
    [appointment, admin],
  );

  const requiresSchedule = [
    "confirmed",
    "completed",
    "no-show",
  ].includes(values.status);

  const scheduleDisabled = [
    "requested",
    "declined",
  ].includes(values.status);

  const requiresCancellationReason = [
    "cancelled",
    "declined",
  ].includes(values.status);

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    if (name === "status") {
      setValues((currentValues) => {
        const nextValues = {
          ...currentValues,
          status: value,
        };

        if (
          value === "requested" ||
          value === "declined"
        ) {
          nextValues.scheduledAt = "";
        }

        if (
          value !== "cancelled" &&
          value !== "declined"
        ) {
          nextValues.cancellationReason =
            "";
        }

        return nextValues;
      });

      return;
    }

    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (
      !canUpdate ||
      isSubmitting ||
      typeof onSubmit !== "function"
    ) {
      return;
    }

    const payload = {
      status: values.status,
      assignedTo: values.assignedTo || null,
      scheduledAt:
        scheduleDisabled ||
        !values.scheduledAt
          ? null
          : new Date(
              values.scheduledAt,
            ).toISOString(),
      adminNote: values.adminNote.trim(),
      cancellationReason:
        requiresCancellationReason
          ? values.cancellationReason.trim()
          : "",
    };

    onSubmit(payload);
  }

  return (
    <section
      aria-labelledby="appointment-workflow-heading"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
          Admin workflow
        </p>

        <h2
          id="appointment-workflow-heading"
          className="mt-2 text-xl font-black text-slate-950"
        >
          Manage Appointment
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Update lifecycle status, confirmed
          schedule, ownership and private
          Admin notes.
        </p>
      </div>

      {!canUpdate ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Your Admin role has read-only access
          to this consultation request.
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 space-y-5"
      >
        <div>
          <label
            htmlFor="appointment-update-status"
            className={labelClassName}
          >
            Status
          </label>

          <select
            id="appointment-update-status"
            name="status"
            value={values.status}
            onChange={handleChange}
            disabled={
              !canUpdate || isSubmitting
            }
            aria-invalid={Boolean(
              fieldErrors.status,
            )}
            aria-describedby={
              fieldErrors.status
                ? getErrorId("status")
                : undefined
            }
            className={inputClassName}
          >
            {STATUS_OPTIONS.map((status) => (
              <option
                key={status.value}
                value={status.value}
              >
                {status.label}
              </option>
            ))}
          </select>

          {fieldErrors.status ? (
            <p
              id={getErrorId("status")}
              className={errorClassName}
            >
              {fieldErrors.status}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="appointment-update-assignedTo"
            className={labelClassName}
          >
            Assigned Admin
          </label>

          <select
            id="appointment-update-assignedTo"
            name="assignedTo"
            value={values.assignedTo}
            onChange={handleChange}
            disabled={
              !canUpdate || isSubmitting
            }
            aria-invalid={Boolean(
              fieldErrors.assignedTo,
            )}
            aria-describedby={
              fieldErrors.assignedTo
                ? getErrorId("assignedTo")
                : undefined
            }
            className={inputClassName}
          >
            <option value="">
              Unassigned
            </option>

            {assignmentOptions.map(
              (option) => (
                <option
                  key={option.id}
                  value={option.id}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Assignment choices currently
            include the existing assignee and
            your Admin account.
          </p>

          {fieldErrors.assignedTo ? (
            <p
              id={getErrorId(
                "assignedTo",
              )}
              className={errorClassName}
            >
              {fieldErrors.assignedTo}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="appointment-update-scheduledAt"
            className={labelClassName}
          >
            Confirmed schedule
            {requiresSchedule ? (
              <span
                className="text-red-600"
                aria-hidden="true"
              >
                {" "}
                *
              </span>
            ) : null}
          </label>

          <input
            id="appointment-update-scheduledAt"
            name="scheduledAt"
            type="datetime-local"
            value={values.scheduledAt}
            onChange={handleChange}
            required={requiresSchedule}
            disabled={
              !canUpdate ||
              isSubmitting ||
              scheduleDisabled
            }
            aria-invalid={Boolean(
              fieldErrors.scheduledAt,
            )}
            aria-describedby={
              fieldErrors.scheduledAt
                ? getErrorId("scheduledAt")
                : "appointment-update-scheduledAt-help"
            }
            className={inputClassName}
          />

          <p
            id="appointment-update-scheduledAt-help"
            className="mt-2 text-xs leading-5 text-slate-500"
          >
            {scheduleDisabled
              ? "A schedule is not used for requested or declined Appointments."
              : requiresSchedule
                ? "This status requires a confirmed schedule. The value is shown in your browser's local time."
                : "Optional unless the selected status requires a confirmed schedule."}
          </p>

          {fieldErrors.scheduledAt ? (
            <p
              id={getErrorId(
                "scheduledAt",
              )}
              className={errorClassName}
            >
              {fieldErrors.scheduledAt}
            </p>
          ) : null}
        </div>

        {requiresCancellationReason ? (
          <div>
            <label
              htmlFor="appointment-update-cancellationReason"
              className={labelClassName}
            >
              {values.status === "declined"
                ? "Decline reason"
                : "Cancellation reason"}{" "}
              <span
                className="text-red-600"
                aria-hidden="true"
              >
                *
              </span>
            </label>

            <textarea
              id="appointment-update-cancellationReason"
              name="cancellationReason"
              rows={4}
              value={
                values.cancellationReason
              }
              onChange={handleChange}
              required
              disabled={
                !canUpdate ||
                isSubmitting
              }
              aria-invalid={Boolean(
                fieldErrors.cancellationReason,
              )}
              aria-describedby={
                fieldErrors.cancellationReason
                  ? getErrorId(
                      "cancellationReason",
                    )
                  : undefined
              }
              className={`${inputClassName} min-h-28 resize-y`}
            />

            {fieldErrors.cancellationReason ? (
              <p
                id={getErrorId(
                  "cancellationReason",
                )}
                className={errorClassName}
              >
                {
                  fieldErrors.cancellationReason
                }
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label
            htmlFor="appointment-update-adminNote"
            className={labelClassName}
          >
            Private Admin note
          </label>

          <textarea
            id="appointment-update-adminNote"
            name="adminNote"
            rows={5}
            value={values.adminNote}
            onChange={handleChange}
            disabled={
              !canUpdate || isSubmitting
            }
            aria-invalid={Boolean(
              fieldErrors.adminNote,
            )}
            aria-describedby={
              fieldErrors.adminNote
                ? getErrorId("adminNote")
                : undefined
            }
            className={`${inputClassName} min-h-32 resize-y`}
          />

          {fieldErrors.adminNote ? (
            <p
              id={getErrorId("adminNote")}
              className={errorClassName}
            >
              {fieldErrors.adminNote}
            </p>
          ) : null}
        </div>

        {formStatus?.message ? (
          <p
            role={
              formStatus.type === "error"
                ? "alert"
                : "status"
            }
            aria-live={
              formStatus.type === "error"
                ? "assertive"
                : "polite"
            }
            className={`rounded-xl border p-4 text-sm leading-6 ${
              formStatus.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {formStatus.message}
          </p>
        ) : null}

        {canUpdate ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting
              ? "Saving..."
              : "Save Appointment"}
          </button>
        ) : null}
      </form>
    </section>
  );
}

function AppointmentUpdateForm(props) {
  const appointmentKey = [
    getRecordId(props.appointment),
    JSON.stringify(
      createInitialValues(props.appointment),
    ),
  ].join("|");

  return (
    <AppointmentUpdateFormFields
      key={appointmentKey}
      {...props}
    />
  );
}

export default AppointmentUpdateForm;