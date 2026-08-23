import { useMemo, useState } from "react";

import useMediaPicker from "../../../hooks/useMediaPicker";
import MediaPickerModal from "../media/MediaPickerModal";

function cleanText(value) {
  return String(value ?? "").trim();
}

function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function normalizeInitialValues(initialValues = {}) {
  return {
    name: cleanText(initialValues.name),
    relationship: ["client", "partner"].includes(
      cleanText(initialValues.relationship).toLowerCase(),
    )
      ? cleanText(initialValues.relationship).toLowerCase()
      : "client",
    industry: cleanText(initialValues.industry),
    shortDescription: cleanText(initialValues.shortDescription),
    role: cleanText(initialValues.role),
    websiteUrl: cleanText(initialValues.websiteUrl),
    logoUrl: cleanText(initialValues.logoUrl),
    servicesText: Array.isArray(initialValues.services)
      ? initialValues.services.map(cleanText).filter(Boolean).join(", ")
      : "",
    relationshipStartDate: toDateInputValue(
      initialValues.relationshipStartDate,
    ),
    relationshipEndDate: toDateInputValue(initialValues.relationshipEndDate),
    order: Number.isFinite(Number(initialValues.order))
      ? String(Number(initialValues.order))
      : "0",
    isFeatured: Boolean(initialValues.isFeatured),
    isVisible: initialValues.isVisible !== false,
    status: cleanText(initialValues.status).toLowerCase() || "active",
  };
}

function getSafeHttpUrl(value) {
  const url = cleanText(value);

  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      parsedUrl.hostname &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return parsedUrl.toString();
    }
  } catch {
    return "";
  }

  return "";
}

function ClientPartnerForm({
  initialValues = {},
  onSubmit,
  submitLabel = "Save Client / Partner",
  mode = "create",
  accessToken = "",
  onMediaUnauthorized,
}) {
  const normalizedInitialValues = useMemo(
    () => normalizeInitialValues(initialValues),
    [initialValues],
  );

  const [values, setValues] = useState(normalizedInitialValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isMediaPickerOpen, openMediaPicker, closeMediaPicker } =
    useMediaPicker();

  function setField(name, value) {
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));

    setFieldErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });

    setSubmitError("");
  }

  function handleLogoMediaSelect(media) {
    const nextLogoUrl = cleanText(media?.url);

    if (!nextLogoUrl) {
      return;
    }

    setField("logoUrl", nextLogoUrl);
  }

  function validate() {
    const errors = {};
    const name = cleanText(values.name);
    const description = cleanText(values.shortDescription);
    const relationship = cleanText(values.relationship).toLowerCase();
    const order = Number(values.order);
    const websiteUrl = cleanText(values.websiteUrl);
    const startDate = values.relationshipStartDate;
    const endDate = values.relationshipEndDate;

    if (name.length < 2) {
      errors.name = "Company name must contain at least 2 characters.";
    }

    if (!["client", "partner"].includes(relationship)) {
      errors.relationship = "Select Client or Partner.";
    }

    if (description.length < 10) {
      errors.shortDescription =
        "Short description must contain at least 10 characters.";
    }

    if (description.length > 400) {
      errors.shortDescription =
        "Short description cannot exceed 400 characters.";
    }

    if (!Number.isFinite(order) || order < 0) {
      errors.order = "Menu/display order must be a non-negative number.";
    }

    if (websiteUrl && !getSafeHttpUrl(websiteUrl)) {
      errors.websiteUrl = "Use a valid http:// or https:// website URL.";
    }

    if (startDate && endDate && endDate < startDate) {
      errors.relationshipEndDate =
        "End date cannot be earlier than the start date.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting || !validate()) {
      return;
    }

    const relationship = cleanText(values.relationship).toLowerCase();
    const isVisible = Boolean(values.isVisible);
    const services = cleanText(values.servicesText)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const payload = {
      name: cleanText(values.name),
      relationship,
      industry: cleanText(values.industry),
      shortDescription: cleanText(values.shortDescription),
      role: cleanText(values.role),
      websiteUrl: cleanText(values.websiteUrl),
      logoUrl: cleanText(values.logoUrl),
      services,
      relationshipStartDate: values.relationshipStartDate || null,
      relationshipEndDate: values.relationshipEndDate || null,
      order: Number(values.order),
      isFeatured: Boolean(values.isFeatured),
      isVisible,
      status: isVisible
        ? "active"
        : values.status === "archived"
          ? "archived"
          : "inactive",
    };

    try {
      setIsSubmitting(true);
      setSubmitError("");
      await onSubmit(payload);
    } catch (error) {
      setFieldErrors(error?.fieldErrors || {});
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Client or partner could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldClassName =
    "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-950/60";

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"
      >
      <div className="grid gap-6">
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
            Relationship
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
            Public client / partner details
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            These fields control the public Clients & Partners section and
            listing page. Company Menu entries remain managed separately.
          </p>
        </section>

        {submitError && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {submitError}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Company name *
            <input
              type="text"
              value={values.name}
              onChange={(event) => setField("name", event.target.value)}
              maxLength={150}
              disabled={isSubmitting}
              className={fieldClassName}
              placeholder="UniQuick Mart"
              autoComplete="organization"
            />
            {fieldErrors.name && (
              <span className="mt-1 block text-xs font-medium text-red-600">
                {fieldErrors.name}
              </span>
            )}
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Relationship *
            <select
              value={values.relationship}
              onChange={(event) =>
                setField("relationship", event.target.value)
              }
              disabled={isSubmitting}
              className={fieldClassName}
            >
              <option value="client">Client</option>
              <option value="partner">Partner</option>
            </select>
            {fieldErrors.relationship && (
              <span className="mt-1 block text-xs font-medium text-red-600">
                {fieldErrors.relationship}
              </span>
            )}
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Industry / category
            <input
              type="text"
              value={values.industry}
              onChange={(event) => setField("industry", event.target.value)}
              maxLength={150}
              disabled={isSubmitting}
              className={fieldClassName}
              placeholder="E-Commerce"
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Collaboration / role
            <input
              type="text"
              value={values.role}
              onChange={(event) => setField("role", event.target.value)}
              maxLength={200}
              disabled={isSubmitting}
              className={fieldClassName}
              placeholder="Development, Design, Support"
            />
          </label>
        </div>

        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Short description *
          <textarea
            value={values.shortDescription}
            onChange={(event) =>
              setField("shortDescription", event.target.value)
            }
            maxLength={400}
            rows={4}
            disabled={isSubmitting}
            className={`${fieldClassName} min-h-28 resize-y`}
            placeholder="Describe the relationship, project or collaboration in a concise public-facing sentence."
          />
          <div className="mt-1 flex items-start justify-between gap-3">
            <span className="text-xs text-slate-400">
              Used on the public relationship card.
            </span>
            <span className="text-xs text-slate-400">
              {values.shortDescription.length}/400
            </span>
          </div>
          {fieldErrors.shortDescription && (
            <span className="mt-1 block text-xs font-medium text-red-600">
              {fieldErrors.shortDescription}
            </span>
          )}
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Website URL
            <input
              type="url"
              value={values.websiteUrl}
              onChange={(event) => setField("websiteUrl", event.target.value)}
              maxLength={500}
              disabled={isSubmitting}
              className={fieldClassName}
              placeholder="https://example.com"
              autoComplete="url"
            />
            {fieldErrors.websiteUrl && (
              <span className="mt-1 block text-xs font-medium text-red-600">
                {fieldErrors.websiteUrl}
              </span>
            )}
          </label>

          <div>
            <label
              htmlFor="client-partner-logo-url"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Logo URL
            </label>

            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <input
                id="client-partner-logo-url"
                type="text"
                value={values.logoUrl}
                onChange={(event) => setField("logoUrl", event.target.value)}
                maxLength={500}
                disabled={isSubmitting}
                className={fieldClassName}
                placeholder="/uploads/company-logo.png or https://..."
              />

              <button
                type="button"
                onClick={openMediaPicker}
                disabled={isSubmitting || !accessToken}
                className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Choose Media
              </button>
            </div>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Paste a logo URL or choose an image/SVG from the Media Library.
            </p>
          </div>
        </div>

        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Services / work areas
          <input
            type="text"
            value={values.servicesText}
            onChange={(event) => setField("servicesText", event.target.value)}
            disabled={isSubmitting}
            className={fieldClassName}
            placeholder="Web Development, UI/UX, Support"
          />
          <span className="mt-1 block text-xs text-slate-400">
            Separate multiple values with commas.
          </span>
        </label>

        <div className="grid gap-5 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Relationship start
            <input
              type="date"
              value={values.relationshipStartDate}
              onChange={(event) =>
                setField("relationshipStartDate", event.target.value)
              }
              disabled={isSubmitting}
              className={fieldClassName}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Relationship end
            <input
              type="date"
              value={values.relationshipEndDate}
              onChange={(event) =>
                setField("relationshipEndDate", event.target.value)
              }
              disabled={isSubmitting}
              className={fieldClassName}
            />
            {fieldErrors.relationshipEndDate && (
              <span className="mt-1 block text-xs font-medium text-red-600">
                {fieldErrors.relationshipEndDate}
              </span>
            )}
          </label>

          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Display order *
            <input
              type="number"
              min="0"
              step="1"
              value={values.order}
              onChange={(event) => setField("order", event.target.value)}
              disabled={isSubmitting}
              className={fieldClassName}
            />
            {fieldErrors.order && (
              <span className="mt-1 block text-xs font-medium text-red-600">
                {fieldErrors.order}
              </span>
            )}
          </label>
        </div>

        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <input
              type="checkbox"
              checked={values.isVisible}
              onChange={(event) => setField("isVisible", event.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              <span className="block text-sm font-bold text-slate-950 dark:text-white">
                Publicly visible
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                Show this relationship on the public Clients & Partners page.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <input
              type="checkbox"
              checked={values.isFeatured}
              onChange={(event) =>
                setField("isFeatured", event.target.checked)
              }
              disabled={isSubmitting}
              className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              <span className="block text-sm font-bold text-slate-950 dark:text-white">
                Prioritize on Home
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                Featured relationships are considered first for the six Home
                preview cards.
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            {mode === "edit"
              ? "Saving updates the existing Company record without breaking Team relationships."
              : "A shared Company record will be created for this client or partner."}
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
        </div>
      </form>

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        accessToken={accessToken}
        title="Choose Client / Partner Logo"
        allowedTypes={["image", "svg"]}
        selectedUrl={values.logoUrl}
        onSelect={handleLogoMediaSelect}
        onClose={closeMediaPicker}
        onUnauthorized={onMediaUnauthorized}
      />
    </>
  );
}

export default ClientPartnerForm;
