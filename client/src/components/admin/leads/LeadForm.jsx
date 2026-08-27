import {
  commonCurrencyOptions,
  leadPriorityOptions,
  leadStatusOptions,
} from "../../../utils/leadForm";

const inputClassName =
  "mt-1 min-h-9 w-full rounded-lg border border-[#24364d] bg-[#091522] px-3 text-[11px] text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

const labelClassName =
  "text-[9px] font-bold uppercase tracking-[0.09em] text-slate-500";

const sectionClassName =
  "rounded-xl border border-[#1d2b3d] bg-[#0c1624] p-3 shadow-sm sm:p-3.5";

function FieldError({ id, message }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className="mt-1 text-[9px] font-semibold text-rose-300">
      {message}
    </p>
  );
}

function LeadForm({
  form,
  fieldErrors = {},
  isSubmitting = false,
  isEdit = false,
  serviceOptions = [],
  adminOptions = [],
  sourceContactMessage = null,
  onChange,
  onSubmit,
  onCancel,
}) {
  function handleChange(event) {
    const { name, value } = event.target;

    onChange?.(name, value);
  }

  function getDescribedBy(fieldName, helpId = "") {
    const ids = [];

    if (helpId) {
      ids.push(helpId);
    }

    if (fieldErrors[fieldName]) {
      ids.push(`lead-${fieldName}-error`);
    }

    return ids.length > 0 ? ids.join(" ") : undefined;
  }

  const isLost = form.status === "lost";
  const hasServiceOptions = serviceOptions.length > 0;
  const hasAdminOptions = adminOptions.length > 0;

  const advancedFields = [
    "lastContactedAt",
    "order",
    "serviceSlug",
    "serviceTitle",
    "lostReason",
  ];

  const advancedErrorCount = advancedFields.filter(
    (fieldName) => Boolean(fieldErrors[fieldName]),
  ).length;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      {sourceContactMessage ? (
        <section className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-blue-300">
              Contact Message Lead
            </span>

            <span className="max-w-full truncate text-[10px] text-slate-400">
              {sourceContactMessage.subject ||
                "Created from a Contact Message enquiry"}
            </span>
          </div>
        </section>
      ) : null}

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-blue-400">
              Lead
            </p>

            <h2 className="mt-0.5 text-sm font-bold text-slate-100">
              Contact & opportunity
            </h2>
          </div>

          <span className="text-[9px] text-slate-600">
            * required
          </span>
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className={labelClassName} htmlFor="lead-name">
              Lead name <span className="text-rose-400">*</span>
            </label>

            <input
              aria-describedby={getDescribedBy("name")}
              aria-invalid={Boolean(fieldErrors.name)}
              className={inputClassName}
              id="lead-name"
              maxLength={100}
              name="name"
              onChange={handleChange}
              required
              type="text"
              value={form.name}
            />

            <FieldError id="lead-name-error" message={fieldErrors.name} />
          </div>

          <div>
            <label className={labelClassName} htmlFor="lead-company">
              Company / Organization
            </label>

            <input
              aria-describedby={getDescribedBy("company")}
              aria-invalid={Boolean(fieldErrors.company)}
              className={inputClassName}
              id="lead-company"
              maxLength={160}
              name="company"
              onChange={handleChange}
              type="text"
              value={form.company}
            />

            <FieldError id="lead-company-error" message={fieldErrors.company} />
          </div>

          <div>
            <label className={labelClassName} htmlFor="lead-source">
              Source
            </label>

            <input
              aria-describedby={getDescribedBy("source")}
              aria-invalid={Boolean(fieldErrors.source)}
              className={inputClassName}
              id="lead-source"
              maxLength={100}
              name="source"
              onChange={handleChange}
              placeholder="manual"
              type="text"
              value={form.source}
            />

            <FieldError id="lead-source-error" message={fieldErrors.source} />
          </div>

          <div>
            <label className={labelClassName} htmlFor="lead-email">
              Email
            </label>

            <input
              aria-describedby={getDescribedBy("email")}
              aria-invalid={Boolean(fieldErrors.email)}
              autoComplete="email"
              className={inputClassName}
              id="lead-email"
              maxLength={150}
              name="email"
              onChange={handleChange}
              type="email"
              value={form.email}
            />

            <FieldError id="lead-email-error" message={fieldErrors.email} />
          </div>

          <div>
            <label className={labelClassName} htmlFor="lead-phone">
              Phone
            </label>

            <input
              aria-describedby={getDescribedBy("phone")}
              aria-invalid={Boolean(fieldErrors.phone)}
              autoComplete="tel"
              className={inputClassName}
              id="lead-phone"
              maxLength={30}
              name="phone"
              onChange={handleChange}
              type="tel"
              value={form.phone}
            />

            <FieldError id="lead-phone-error" message={fieldErrors.phone} />
          </div>

          <div>
            <label className={labelClassName} htmlFor="lead-subject">
              Opportunity subject <span className="text-rose-400">*</span>
            </label>

            <input
              aria-describedby={getDescribedBy("subject")}
              aria-invalid={Boolean(fieldErrors.subject)}
              className={inputClassName}
              id="lead-subject"
              maxLength={150}
              minLength={3}
              name="subject"
              onChange={handleChange}
              required
              type="text"
              value={form.subject}
            />

            <FieldError id="lead-subject-error" message={fieldErrors.subject} />
          </div>

          <div className="sm:col-span-2 xl:col-span-3">
            <div className="flex items-end justify-between gap-2">
              <label className={labelClassName} htmlFor="lead-requirementSummary">
                Requirement summary
              </label>

              <span className="text-[8px] tabular-nums text-slate-600">
                {form.requirementSummary.length}/5000
              </span>
            </div>

            <textarea
              aria-describedby={getDescribedBy("requirementSummary")}
              aria-invalid={Boolean(fieldErrors.requirementSummary)}
              className={`${inputClassName} min-h-20 resize-y py-2 leading-4`}
              id="lead-requirementSummary"
              maxLength={5000}
              name="requirementSummary"
              onChange={handleChange}
              rows={3}
              value={form.requirementSummary}
            />

            <FieldError
              id="lead-requirementSummary-error"
              message={fieldErrors.requirementSummary}
            />
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-blue-400">
            Pipeline
          </p>

          <h2 className="mt-0.5 text-sm font-bold text-slate-100">
            Status, owner, service & value
          </h2>
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div>
            <label className={labelClassName} htmlFor="lead-status">
              Status
            </label>

            <select
              aria-describedby={getDescribedBy("status")}
              aria-invalid={Boolean(fieldErrors.status)}
              className={inputClassName}
              id="lead-status"
              name="status"
              onChange={handleChange}
              value={form.status}
            >
              {leadStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <FieldError id="lead-status-error" message={fieldErrors.status} />
          </div>

          <div>
            <label className={labelClassName} htmlFor="lead-priority">
              Priority
            </label>

            <select
              aria-describedby={getDescribedBy("priority")}
              aria-invalid={Boolean(fieldErrors.priority)}
              className={inputClassName}
              id="lead-priority"
              name="priority"
              onChange={handleChange}
              value={form.priority}
            >
              {leadPriorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <FieldError
              id="lead-priority-error"
              message={fieldErrors.priority}
            />
          </div>

          <div>
            <label className={labelClassName} htmlFor="lead-assignedTo">
              Assigned Admin
            </label>

            {hasAdminOptions ? (
              <select
                aria-describedby={getDescribedBy("assignedTo")}
                aria-invalid={Boolean(fieldErrors.assignedTo)}
                className={inputClassName}
                id="lead-assignedTo"
                name="assignedTo"
                onChange={handleChange}
                value={form.assignedTo}
              >
                <option value="">Unassigned</option>

                {adminOptions.map((admin) => (
                  <option key={admin._id} value={admin._id}>
                    {admin.name || admin.email || admin._id}
                  </option>
                ))}
              </select>
            ) : (
              <input
                aria-describedby={getDescribedBy("assignedTo")}
                aria-invalid={Boolean(fieldErrors.assignedTo)}
                className={inputClassName}
                id="lead-assignedTo"
                name="assignedTo"
                onChange={handleChange}
                placeholder="Admin ObjectId or blank"
                type="text"
                value={form.assignedTo}
              />
            )}

            <FieldError
              id="lead-assignedTo-error"
              message={fieldErrors.assignedTo}
            />
          </div>

          <div>
            <label className={labelClassName} htmlFor="lead-service">
              Service
            </label>

            {hasServiceOptions ? (
              <select
                aria-describedby={getDescribedBy("service")}
                aria-invalid={Boolean(fieldErrors.service)}
                className={inputClassName}
                id="lead-service"
                name="service"
                onChange={handleChange}
                value={form.service}
              >
                <option value="">No linked Service</option>

                {serviceOptions.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.title || service.slug || service._id}
                  </option>
                ))}
              </select>
            ) : (
              <input
                aria-describedby={getDescribedBy("service")}
                aria-invalid={Boolean(fieldErrors.service)}
                className={inputClassName}
                id="lead-service"
                name="service"
                onChange={handleChange}
                placeholder="Service ObjectId or blank"
                type="text"
                value={form.service}
              />
            )}

            <FieldError id="lead-service-error" message={fieldErrors.service} />
          </div>

          <div>
            <label className={labelClassName} htmlFor="lead-estimatedValue">
              Estimated value
            </label>

            <input
              aria-describedby={getDescribedBy("estimatedValue")}
              aria-invalid={Boolean(fieldErrors.estimatedValue)}
              className={inputClassName}
              id="lead-estimatedValue"
              min="0"
              name="estimatedValue"
              onChange={handleChange}
              step="0.01"
              type="number"
              value={form.estimatedValue}
            />

            <FieldError
              id="lead-estimatedValue-error"
              message={fieldErrors.estimatedValue}
            />
          </div>

          <div>
            <label className={labelClassName} htmlFor="lead-currency">
              Currency
            </label>

            <input
              aria-describedby={getDescribedBy("currency")}
              aria-invalid={Boolean(fieldErrors.currency)}
              className={`${inputClassName} uppercase`}
              id="lead-currency"
              list="lead-currency-options"
              maxLength={3}
              name="currency"
              onChange={handleChange}
              type="text"
              value={form.currency}
            />

            <datalist id="lead-currency-options">
              {commonCurrencyOptions.map((currency) => (
                <option key={currency} value={currency} />
              ))}
            </datalist>

            <FieldError
              id="lead-currency-error"
              message={fieldErrors.currency}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className={labelClassName} htmlFor="lead-nextFollowUpAt">
              Next follow-up
            </label>

            <input
              aria-describedby={getDescribedBy("nextFollowUpAt")}
              aria-invalid={Boolean(fieldErrors.nextFollowUpAt)}
              className={inputClassName}
              id="lead-nextFollowUpAt"
              name="nextFollowUpAt"
              onChange={handleChange}
              type="datetime-local"
              value={form.nextFollowUpAt}
            />

            <FieldError
              id="lead-nextFollowUpAt-error"
              message={fieldErrors.nextFollowUpAt}
            />
          </div>
        </div>
      </section>

      <details
        className="rounded-xl border border-[#1d2b3d] bg-[#0a1422]"
        open={advancedErrorCount > 0 ? true : undefined}
      >
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-[10px] font-bold text-slate-400">
          <span>More CRM details</span>

          <span className="text-[8px] font-semibold text-slate-600">
            {advancedErrorCount > 0
              ? `${advancedErrorCount} field error${advancedErrorCount === 1 ? "" : "s"}`
              : "Optional / snapshots"}
          </span>
        </summary>

        <div className="grid gap-2.5 border-t border-[#1d2b3d] p-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClassName} htmlFor="lead-lastContactedAt">
              Last contacted
            </label>

            <input
              aria-describedby={getDescribedBy("lastContactedAt")}
              aria-invalid={Boolean(fieldErrors.lastContactedAt)}
              className={inputClassName}
              id="lead-lastContactedAt"
              name="lastContactedAt"
              onChange={handleChange}
              type="datetime-local"
              value={form.lastContactedAt}
            />

            <FieldError
              id="lead-lastContactedAt-error"
              message={fieldErrors.lastContactedAt}
            />
          </div>

          <div>
            <label className={labelClassName} htmlFor="lead-order">
              Order
            </label>

            <input
              aria-describedby={getDescribedBy("order")}
              aria-invalid={Boolean(fieldErrors.order)}
              className={inputClassName}
              id="lead-order"
              max="1000000"
              min="0"
              name="order"
              onChange={handleChange}
              step="1"
              type="number"
              value={form.order}
            />

            <FieldError id="lead-order-error" message={fieldErrors.order} />
          </div>

          <div>
            <label className={labelClassName} htmlFor="lead-serviceSlug">
              Service slug snapshot
            </label>

            <input
              aria-describedby={getDescribedBy("serviceSlug")}
              aria-invalid={Boolean(fieldErrors.serviceSlug)}
              className={inputClassName}
              id="lead-serviceSlug"
              maxLength={160}
              name="serviceSlug"
              onChange={handleChange}
              type="text"
              value={form.serviceSlug}
            />

            <FieldError
              id="lead-serviceSlug-error"
              message={fieldErrors.serviceSlug}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className={labelClassName} htmlFor="lead-serviceTitle">
              Service title snapshot
            </label>

            <input
              aria-describedby={getDescribedBy("serviceTitle")}
              aria-invalid={Boolean(fieldErrors.serviceTitle)}
              className={inputClassName}
              id="lead-serviceTitle"
              maxLength={150}
              name="serviceTitle"
              onChange={handleChange}
              type="text"
              value={form.serviceTitle}
            />

            <FieldError
              id="lead-serviceTitle-error"
              message={fieldErrors.serviceTitle}
            />
          </div>

          {isLost ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="flex items-end justify-between gap-2">
                <label className={labelClassName} htmlFor="lead-lostReason">
                  Lost reason
                </label>

                <span className="text-[8px] tabular-nums text-slate-600">
                  {form.lostReason.length}/1000
                </span>
              </div>

              <textarea
                aria-describedby={getDescribedBy("lostReason")}
                aria-invalid={Boolean(fieldErrors.lostReason)}
                className={`${inputClassName} min-h-16 resize-y py-2 leading-4`}
                id="lead-lostReason"
                maxLength={1000}
                name="lostReason"
                onChange={handleChange}
                rows={2}
                value={form.lostReason}
              />

              <FieldError
                id="lead-lostReason-error"
                message={fieldErrors.lostReason}
              />
            </div>
          ) : null}
        </div>
      </details>

      <div className="sticky bottom-2 z-20 flex items-center justify-end gap-2 rounded-xl border border-[#24364d] bg-[#0a1422]/95 p-2 shadow-xl backdrop-blur">
        <button
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#2a3c53] bg-[#101c2c] px-3 text-[10px] font-bold text-slate-300 transition hover:border-[#3a536f] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>

        <button
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-4 text-[10px] font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save Lead"
              : "Create Lead"}
        </button>
      </div>
    </form>
  );
}

export default LeadForm;