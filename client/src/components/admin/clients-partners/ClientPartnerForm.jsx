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

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rnx-admin-clients-compact-v456 rnx-admin-client-partner-mobile-v461 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {submitError && (
          <div
            role="alert"
            className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {submitError}
          </div>
        )}

        <div className="p-3 sm:p-5">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5 dark:border-slate-800 sm:gap-3 sm:pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                Public relationship profile
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Core information shown on Clients & Partners.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              * Required
            </span>
          </div>

          <div className="mt-3 grid gap-x-4 gap-y-2.5 sm:mt-4 sm:grid-cols-2 sm:gap-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Company name *
              <input
                type="text"
                value={values.name}
                onChange={(event) => setField("name", event.target.value)}
                maxLength={150}
                disabled={isSubmitting}
                className="mt-1.5 min-h-9 sm:min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-950/60"
                placeholder="UniQuick Mart"
                autoComplete="organization"
              />
              {fieldErrors.name && (
                <span className="mt-1 block text-[11px] font-medium text-red-600">
                  {fieldErrors.name}
                </span>
              )}
            </label>

            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Relationship *
              <select
                value={values.relationship}
                onChange={(event) =>
                  setField("relationship", event.target.value)
                }
                disabled={isSubmitting}
                className="mt-1.5 min-h-9 sm:min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-950/60"
              >
                <option value="client">Client</option>
                <option value="partner">Partner</option>
              </select>
              {fieldErrors.relationship && (
                <span className="mt-1 block text-[11px] font-medium text-red-600">
                  {fieldErrors.relationship}
                </span>
              )}
            </label>

            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Industry / category
              <input
                type="text"
                value={values.industry}
                onChange={(event) => setField("industry", event.target.value)}
                maxLength={150}
                disabled={isSubmitting}
                className="mt-1.5 min-h-9 sm:min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-950/60"
                placeholder="E-Commerce"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Collaboration / role
              <input
                type="text"
                value={values.role}
                onChange={(event) => setField("role", event.target.value)}
                maxLength={200}
                disabled={isSubmitting}
                className="mt-1.5 min-h-9 sm:min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-950/60"
                placeholder="Development, Design, Support"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
              Short description *
              <textarea
                value={values.shortDescription}
                onChange={(event) =>
                  setField("shortDescription", event.target.value)
                }
                maxLength={400}
                rows={2}
                disabled={isSubmitting}
                className="mt-1.5 min-h-9 sm:min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-950/60 min-h-16 resize-y leading-5 sm:min-h-20"
                placeholder="Concise public-facing relationship description."
              />
              <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-slate-400">
                <span>Shown on the public relationship card.</span>
                <span>{values.shortDescription.length}/400</span>
              </div>
              {fieldErrors.shortDescription && (
                <span className="mt-1 block text-[11px] font-medium text-red-600">
                  {fieldErrors.shortDescription}
                </span>
              )}
            </label>
          </div>

          <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800 sm:mt-4 sm:pt-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Links & media
            </h3>

            <div className="mt-3 grid gap-x-4 gap-y-3 lg:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Website URL
                <input
                  type="url"
                  value={values.websiteUrl}
                  onChange={(event) => setField("websiteUrl", event.target.value)}
                  maxLength={500}
                  disabled={isSubmitting}
                  className="mt-1.5 min-h-9 sm:min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-950/60"
                  placeholder="https://example.com"
                  autoComplete="url"
                />
                {fieldErrors.websiteUrl && (
                  <span className="mt-1 block text-[11px] font-medium text-red-600">
                    {fieldErrors.websiteUrl}
                  </span>
                )}
              </label>

              <div>
                <label
                  htmlFor="client-partner-logo-url"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Logo
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="client-partner-logo-url"
                    type="text"
                    value={values.logoUrl}
                    onChange={(event) => setField("logoUrl", event.target.value)}
                    maxLength={500}
                    disabled={isSubmitting}
                    className="min-h-9 sm:min-h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60"
                    placeholder="Logo URL"
                  />
                  <button
                    type="button"
                    onClick={openMediaPicker}
                    disabled={isSubmitting || !accessToken}
                    className="inline-flex min-h-9 sm:min-h-10 shrink-0 items-center justify-center rounded-lg border border-brand-500 bg-brand-600 px-3 text-xs font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Choose
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  URL or image/SVG from Media Library.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800 sm:mt-4 sm:pt-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Relationship settings
            </h3>

            <div className="mt-3 grid gap-x-4 gap-y-3 lg:grid-cols-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 lg:col-span-2">
                Services / work areas
                <input
                  type="text"
                  value={values.servicesText}
                  onChange={(event) => setField("servicesText", event.target.value)}
                  disabled={isSubmitting}
                  className="mt-1.5 min-h-9 sm:min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-950/60"
                  placeholder="Web Development, UI/UX, Support"
                />
                <span className="mt-1 block text-[10px] text-slate-400">
                  Comma separated.
                </span>
              </label>

              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Start date
                <input
                  type="date"
                  value={values.relationshipStartDate}
                  onChange={(event) =>
                    setField("relationshipStartDate", event.target.value)
                  }
                  disabled={isSubmitting}
                  className="mt-1.5 min-h-9 sm:min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-950/60"
                />
              </label>

              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                End date
                <input
                  type="date"
                  value={values.relationshipEndDate}
                  onChange={(event) =>
                    setField("relationshipEndDate", event.target.value)
                  }
                  disabled={isSubmitting}
                  className="mt-1.5 min-h-9 sm:min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-950/60"
                />
                {fieldErrors.relationshipEndDate && (
                  <span className="mt-1 block text-[11px] font-medium text-red-600">
                    {fieldErrors.relationshipEndDate}
                  </span>
                )}
              </label>

              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 lg:max-w-[180px]">
                Display order *
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={values.order}
                  onChange={(event) => setField("order", event.target.value)}
                  disabled={isSubmitting}
                  className="mt-1.5 min-h-9 sm:min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-brand-400 dark:focus:ring-brand-950/60"
                />
                {fieldErrors.order && (
                  <span className="mt-1 block text-[11px] font-medium text-red-600">
                    {fieldErrors.order}
                  </span>
                )}
              </label>
            </div>
          </div>

          <div className="mt-3 grid gap-1.5 border-t border-slate-200 pt-3 dark:border-slate-800 sm:mt-4 sm:grid-cols-2 sm:gap-2 sm:pt-4">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-950/60 sm:gap-3 sm:px-3 sm:py-2.5">
              <input
                type="checkbox"
                checked={values.isVisible}
                onChange={(event) => setField("isVisible", event.target.checked)}
                disabled={isSubmitting}
                className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  Publicly visible
                </span>
                <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">
                  Show on Clients & Partners.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-950/60 sm:gap-3 sm:px-3 sm:py-2.5">
              <input
                type="checkbox"
                checked={values.isFeatured}
                onChange={(event) =>
                  setField("isFeatured", event.target.checked)
                }
                disabled={isSubmitting}
                className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-900 dark:text-white">
                  Home priority
                </span>
                <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">
                  Prioritize in Home preview.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3">
          <p className="text-[10px] leading-4 text-slate-400">
            {mode === "edit"
              ? "Updates the existing shared Company record."
              : "Creates a shared Company record for this relationship."}
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 px-4 text-xs font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
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
