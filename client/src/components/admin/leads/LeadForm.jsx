import {
  commonCurrencyOptions,
  leadPriorityOptions,
  leadStatusOptions,
} from "../../../utils/leadForm";

function FieldError({ id, message }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className="mt-2 text-sm font-semibold text-red-600">
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

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {sourceContactMessage && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
            Contact Message Lead
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-800">
            This Lead was created from the enquiry
            {sourceContactMessage.subject
              ? ` “${sourceContactMessage.subject}”`
              : ""}
            . The original Contact Message remains separate from the CRM Lead.
          </p>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
            Lead Information
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Contact and opportunity details
          </h2>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="lead-name"
              className="text-sm font-semibold text-slate-700"
            >
              Lead name <span className="text-red-600">*</span>
            </label>

            <input
              id="lead-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              maxLength={100}
              required
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={getDescribedBy("name")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />

            <FieldError id="lead-name-error" message={fieldErrors.name} />
          </div>

          <div>
            <label
              htmlFor="lead-company"
              className="text-sm font-semibold text-slate-700"
            >
              Company / Organization
            </label>

            <input
              id="lead-company"
              name="company"
              type="text"
              value={form.company}
              onChange={handleChange}
              maxLength={160}
              aria-invalid={Boolean(fieldErrors.company)}
              aria-describedby={getDescribedBy("company")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />

            <FieldError id="lead-company-error" message={fieldErrors.company} />
          </div>

          <div>
            <label
              htmlFor="lead-email"
              className="text-sm font-semibold text-slate-700"
            >
              Email
            </label>

            <input
              id="lead-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              maxLength={150}
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={getDescribedBy("email")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />

            <FieldError id="lead-email-error" message={fieldErrors.email} />
          </div>

          <div>
            <label
              htmlFor="lead-phone"
              className="text-sm font-semibold text-slate-700"
            >
              Phone
            </label>

            <input
              id="lead-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              maxLength={30}
              autoComplete="tel"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={getDescribedBy("phone")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />

            <FieldError id="lead-phone-error" message={fieldErrors.phone} />
          </div>

          <div>
            <label
              htmlFor="lead-source"
              className="text-sm font-semibold text-slate-700"
            >
              Lead source
            </label>

            <input
              id="lead-source"
              name="source"
              type="text"
              value={form.source}
              onChange={handleChange}
              maxLength={100}
              placeholder="manual"
              aria-invalid={Boolean(fieldErrors.source)}
              aria-describedby={getDescribedBy("source")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />

            <FieldError id="lead-source-error" message={fieldErrors.source} />
          </div>

          <div>
            <label
              htmlFor="lead-subject"
              className="text-sm font-semibold text-slate-700"
            >
              Opportunity subject <span className="text-red-600">*</span>
            </label>

            <input
              id="lead-subject"
              name="subject"
              type="text"
              value={form.subject}
              onChange={handleChange}
              minLength={3}
              maxLength={150}
              required
              aria-invalid={Boolean(fieldErrors.subject)}
              aria-describedby={getDescribedBy("subject")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />

            <FieldError id="lead-subject-error" message={fieldErrors.subject} />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="lead-requirementSummary"
              className="text-sm font-semibold text-slate-700"
            >
              Requirement summary
            </label>

            <textarea
              id="lead-requirementSummary"
              name="requirementSummary"
              value={form.requirementSummary}
              onChange={handleChange}
              rows={7}
              maxLength={5000}
              aria-invalid={Boolean(fieldErrors.requirementSummary)}
              aria-describedby={getDescribedBy(
                "requirementSummary",
                "lead-requirementSummary-help",
              )}
              className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p
                id="lead-requirementSummary-help"
                className="text-xs text-slate-400"
              >
                Project requirement, scope, budget context or other useful CRM
                details.
              </p>

              <span className="text-xs text-slate-400">
                {form.requirementSummary.length}/5000
              </span>
            </div>

            <FieldError
              id="lead-requirementSummary-error"
              message={fieldErrors.requirementSummary}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
            Pipeline
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Status, priority and assignment
          </h2>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label
              htmlFor="lead-status"
              className="text-sm font-semibold text-slate-700"
            >
              Status
            </label>

            <select
              id="lead-status"
              name="status"
              value={form.status}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.status)}
              aria-describedby={getDescribedBy("status")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
            <label
              htmlFor="lead-priority"
              className="text-sm font-semibold text-slate-700"
            >
              Priority
            </label>

            <select
              id="lead-priority"
              name="priority"
              value={form.priority}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.priority)}
              aria-describedby={getDescribedBy("priority")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
            <label
              htmlFor="lead-assignedTo"
              className="text-sm font-semibold text-slate-700"
            >
              Assigned Admin
            </label>

            {hasAdminOptions ? (
              <select
                id="lead-assignedTo"
                name="assignedTo"
                value={form.assignedTo}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.assignedTo)}
                aria-describedby={getDescribedBy("assignedTo")}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
                id="lead-assignedTo"
                name="assignedTo"
                type="text"
                value={form.assignedTo}
                onChange={handleChange}
                placeholder="Admin ObjectId or leave blank"
                aria-invalid={Boolean(fieldErrors.assignedTo)}
                aria-describedby={getDescribedBy(
                  "assignedTo",
                  "lead-assignedTo-help",
                )}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            )}

            {!hasAdminOptions && (
              <p
                id="lead-assignedTo-help"
                className="mt-2 text-xs text-slate-400"
              >
                Admin selector data is not available yet. Leave blank to keep
                this Lead unassigned.
              </p>
            )}

            <FieldError
              id="lead-assignedTo-error"
              message={fieldErrors.assignedTo}
            />
          </div>

          <div>
            <label
              htmlFor="lead-nextFollowUpAt"
              className="text-sm font-semibold text-slate-700"
            >
              Next follow-up
            </label>

            <input
              id="lead-nextFollowUpAt"
              name="nextFollowUpAt"
              type="datetime-local"
              value={form.nextFollowUpAt}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.nextFollowUpAt)}
              aria-describedby={getDescribedBy("nextFollowUpAt")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />

            <FieldError
              id="lead-nextFollowUpAt-error"
              message={fieldErrors.nextFollowUpAt}
            />
          </div>

          <div>
            <label
              htmlFor="lead-lastContactedAt"
              className="text-sm font-semibold text-slate-700"
            >
              Last contacted
            </label>

            <input
              id="lead-lastContactedAt"
              name="lastContactedAt"
              type="datetime-local"
              value={form.lastContactedAt}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.lastContactedAt)}
              aria-describedby={getDescribedBy("lastContactedAt")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />

            <FieldError
              id="lead-lastContactedAt-error"
              message={fieldErrors.lastContactedAt}
            />
          </div>

          <div>
            <label
              htmlFor="lead-order"
              className="text-sm font-semibold text-slate-700"
            >
              Order
            </label>

            <input
              id="lead-order"
              name="order"
              type="number"
              min="0"
              max="1000000"
              step="1"
              value={form.order}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.order)}
              aria-describedby={getDescribedBy("order")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />

            <FieldError id="lead-order-error" message={fieldErrors.order} />
          </div>

          {isLost && (
            <div className="md:col-span-2 xl:col-span-3">
              <label
                htmlFor="lead-lostReason"
                className="text-sm font-semibold text-slate-700"
              >
                Lost reason
              </label>

              <textarea
                id="lead-lostReason"
                name="lostReason"
                value={form.lostReason}
                onChange={handleChange}
                rows={4}
                maxLength={1000}
                aria-invalid={Boolean(fieldErrors.lostReason)}
                aria-describedby={getDescribedBy(
                  "lostReason",
                  "lead-lostReason-help",
                )}
                className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p id="lead-lostReason-help" className="text-xs text-slate-400">
                  Optional reason why this opportunity was lost.
                </p>

                <span className="text-xs text-slate-400">
                  {form.lostReason.length}/1000
                </span>
              </div>

              <FieldError
                id="lead-lostReason-error"
                message={fieldErrors.lostReason}
              />
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
            Service and Value
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Opportunity classification
          </h2>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label
              htmlFor="lead-service"
              className="text-sm font-semibold text-slate-700"
            >
              Service
            </label>

            {hasServiceOptions ? (
              <select
                id="lead-service"
                name="service"
                value={form.service}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.service)}
                aria-describedby={getDescribedBy("service")}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
                id="lead-service"
                name="service"
                type="text"
                value={form.service}
                onChange={handleChange}
                placeholder="Service ObjectId or leave blank"
                aria-invalid={Boolean(fieldErrors.service)}
                aria-describedby={getDescribedBy(
                  "service",
                  "lead-service-help",
                )}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            )}

            {!hasServiceOptions && (
              <p id="lead-service-help" className="mt-2 text-xs text-slate-400">
                Service selector data is not available yet. Leave blank when
                no Service relation is required.
              </p>
            )}

            <FieldError id="lead-service-error" message={fieldErrors.service} />
          </div>

          <div>
            <label
              htmlFor="lead-serviceSlug"
              className="text-sm font-semibold text-slate-700"
            >
              Service slug snapshot
            </label>

            <input
              id="lead-serviceSlug"
              name="serviceSlug"
              type="text"
              value={form.serviceSlug}
              onChange={handleChange}
              maxLength={160}
              aria-invalid={Boolean(fieldErrors.serviceSlug)}
              aria-describedby={getDescribedBy("serviceSlug")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />

            <FieldError
              id="lead-serviceSlug-error"
              message={fieldErrors.serviceSlug}
            />
          </div>

          <div>
            <label
              htmlFor="lead-serviceTitle"
              className="text-sm font-semibold text-slate-700"
            >
              Service title snapshot
            </label>

            <input
              id="lead-serviceTitle"
              name="serviceTitle"
              type="text"
              value={form.serviceTitle}
              onChange={handleChange}
              maxLength={150}
              aria-invalid={Boolean(fieldErrors.serviceTitle)}
              aria-describedby={getDescribedBy("serviceTitle")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />

            <FieldError
              id="lead-serviceTitle-error"
              message={fieldErrors.serviceTitle}
            />
          </div>

          <div>
            <label
              htmlFor="lead-estimatedValue"
              className="text-sm font-semibold text-slate-700"
            >
              Estimated value
            </label>

            <input
              id="lead-estimatedValue"
              name="estimatedValue"
              type="number"
              min="0"
              step="0.01"
              value={form.estimatedValue}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.estimatedValue)}
              aria-describedby={getDescribedBy("estimatedValue")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
            />

            <FieldError
              id="lead-estimatedValue-error"
              message={fieldErrors.estimatedValue}
            />
          </div>

          <div>
            <label
              htmlFor="lead-currency"
              className="text-sm font-semibold text-slate-700"
            >
              Currency
            </label>

            <input
              id="lead-currency"
              name="currency"
              type="text"
              value={form.currency}
              onChange={handleChange}
              list="lead-currency-options"
              maxLength={3}
              aria-invalid={Boolean(fieldErrors.currency)}
              aria-describedby={getDescribedBy("currency")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm uppercase text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-7 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? isEdit
              ? "Saving Lead..."
              : "Creating Lead..."
            : isEdit
              ? "Save Lead"
              : "Create Lead"}
        </button>
      </div>
    </form>
  );
}

export default LeadForm;
