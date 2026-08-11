import {
  useMemo,
  useState,
} from "react";

const PRIORITY_OPTIONS = [
  {
    value: "low",
    label: "Low",
  },
  {
    value: "medium",
    label: "Medium",
  },
  {
    value: "high",
    label: "High",
  },
  {
    value: "urgent",
    label: "Urgent",
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
  return `appointment-convert-${fieldName}-error`;
}

function ConvertAppointmentToLeadForm({
  appointment,
  admin,
  canConvert = false,
  isSubmitting = false,
  fieldErrors = {},
  formStatus = null,
  onSubmit,
}) {
  const [values, setValues] = useState({
    priority: "medium",
    estimatedValue: "",
    currency: "USD",
    assignedTo: "",
    nextFollowUpAt: "",
  });

  const assignmentOptions = useMemo(
    () =>
      createAssignmentOptions(
        appointment,
        admin,
      ),
    [appointment, admin],
  );

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (
      !canConvert ||
      isSubmitting ||
      typeof onSubmit !== "function"
    ) {
      return;
    }

    const payload = {
      priority: values.priority,
      currency:
        normalizeText(
          values.currency,
        ).toUpperCase(),
    };

    if (values.estimatedValue !== "") {
      payload.estimatedValue =
        normalizeText(
          values.estimatedValue,
        );
    }

    if (values.assignedTo) {
      payload.assignedTo =
        values.assignedTo;
    }

    if (values.nextFollowUpAt) {
      payload.nextFollowUpAt =
        values.nextFollowUpAt;
    }

    onSubmit(payload);
  }

  return (
    <section
      aria-labelledby="appointment-convert-heading"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
          CRM conversion
        </p>

        <h2
          id="appointment-convert-heading"
          className="mt-2 text-xl font-black text-slate-950"
        >
          Convert to Lead
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Create a CRM Lead from this
          consultation request. Project details
          and the additional message will be
          preserved in the Lead.
        </p>
      </div>

      {!canConvert ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Your Admin role does not allow Lead
          conversion.
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 space-y-5"
      >
        <div>
          <label
            htmlFor="appointment-convert-priority"
            className={labelClassName}
          >
            Lead priority
          </label>

          <select
            id="appointment-convert-priority"
            name="priority"
            value={values.priority}
            onChange={handleChange}
            disabled={
              !canConvert || isSubmitting
            }
            aria-invalid={Boolean(
              fieldErrors.priority,
            )}
            aria-describedby={
              fieldErrors.priority
                ? getErrorId("priority")
                : undefined
            }
            className={inputClassName}
          >
            {PRIORITY_OPTIONS.map(
              (priority) => (
                <option
                  key={priority.value}
                  value={priority.value}
                >
                  {priority.label}
                </option>
              ),
            )}
          </select>

          {fieldErrors.priority ? (
            <p
              id={getErrorId("priority")}
              className={errorClassName}
            >
              {fieldErrors.priority}
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="appointment-convert-estimatedValue"
              className={labelClassName}
            >
              Estimated value
            </label>

            <input
              id="appointment-convert-estimatedValue"
              name="estimatedValue"
              type="text"
              inputMode="decimal"
              value={
                values.estimatedValue
              }
              onChange={handleChange}
              disabled={
                !canConvert ||
                isSubmitting
              }
              placeholder="1500"
              aria-invalid={Boolean(
                fieldErrors.estimatedValue,
              )}
              aria-describedby={
                fieldErrors.estimatedValue
                  ? getErrorId(
                      "estimatedValue",
                    )
                  : "appointment-convert-estimatedValue-help"
              }
              className={inputClassName}
            />

            <p
              id="appointment-convert-estimatedValue-help"
              className="mt-2 text-xs leading-5 text-slate-500"
            >
              Optional non-negative decimal
              amount.
            </p>

            {fieldErrors.estimatedValue ? (
              <p
                id={getErrorId(
                  "estimatedValue",
                )}
                className={errorClassName}
              >
                {
                  fieldErrors.estimatedValue
                }
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="appointment-convert-currency"
              className={labelClassName}
            >
              Currency
            </label>

            <input
              id="appointment-convert-currency"
              name="currency"
              type="text"
              maxLength={3}
              value={values.currency}
              onChange={handleChange}
              disabled={
                !canConvert ||
                isSubmitting
              }
              spellCheck="false"
              autoCapitalize="characters"
              aria-invalid={Boolean(
                fieldErrors.currency,
              )}
              aria-describedby={
                fieldErrors.currency
                  ? getErrorId("currency")
                  : "appointment-convert-currency-help"
              }
              className={inputClassName}
            />

            <p
              id="appointment-convert-currency-help"
              className="mt-2 text-xs leading-5 text-slate-500"
            >
              Three-letter code such as USD or
              NPR.
            </p>

            {fieldErrors.currency ? (
              <p
                id={getErrorId("currency")}
                className={errorClassName}
              >
                {fieldErrors.currency}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <label
            htmlFor="appointment-convert-assignedTo"
            className={labelClassName}
          >
            Lead owner
          </label>

          <select
            id="appointment-convert-assignedTo"
            name="assignedTo"
            value={values.assignedTo}
            onChange={handleChange}
            disabled={
              !canConvert || isSubmitting
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
              Use default / unassigned
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
            htmlFor="appointment-convert-nextFollowUpAt"
            className={labelClassName}
          >
            Next follow-up
          </label>

          <input
            id="appointment-convert-nextFollowUpAt"
            name="nextFollowUpAt"
            type="date"
            value={values.nextFollowUpAt}
            onChange={handleChange}
            disabled={
              !canConvert || isSubmitting
            }
            aria-invalid={Boolean(
              fieldErrors.nextFollowUpAt,
            )}
            aria-describedby={
              fieldErrors.nextFollowUpAt
                ? getErrorId(
                    "nextFollowUpAt",
                  )
                : "appointment-convert-nextFollowUpAt-help"
            }
            className={inputClassName}
          />

          <p
            id="appointment-convert-nextFollowUpAt-help"
            className="mt-2 text-xs leading-5 text-slate-500"
          >
            Optional CRM follow-up date.
          </p>

          {fieldErrors.nextFollowUpAt ? (
            <p
              id={getErrorId(
                "nextFollowUpAt",
              )}
              className={errorClassName}
            >
              {fieldErrors.nextFollowUpAt}
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

        {canConvert ? (
          <>
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
              Conversion is explicit and
              creates a CRM Lead linked to this
              Appointment. The same Appointment
              cannot be converted twice.
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting
                ? "Converting..."
                : "Convert to Lead"}
            </button>
          </>
        ) : null}
      </form>
    </section>
  );
}

export default ConvertAppointmentToLeadForm;