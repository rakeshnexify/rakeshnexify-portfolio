import { useState } from "react";
import { Link } from "react-router";

import MediaField from "../media/MediaField";

import {
  createStatisticKey,
  createStatisticPayload,
  defaultStatisticFormValues,
} from "../../../utils/statisticForm";

function validateStatisticForm(formValues) {
  const errors = {};

  if (formValues.label.trim().length < 2) {
    errors.label = "Statistic label must contain at least 2 characters.";
  }

  const finalKey =
    createStatisticKey(formValues.key) || createStatisticKey(formValues.label);

  if (finalKey.length < 2) {
    errors.key = "Statistic key must contain at least 2 characters.";
  }

  if (!formValues.value.trim()) {
    errors.value = "Statistic value is required.";
  } else if (formValues.value.trim().length > 50) {
    errors.value = "Statistic value cannot exceed 50 characters.";
  }

  if (formValues.prefix.trim().length > 20) {
    errors.prefix = "Prefix cannot exceed 20 characters.";
  }

  if (formValues.suffix.trim().length > 20) {
    errors.suffix = "Suffix cannot exceed 20 characters.";
  }

  if (formValues.description.trim().length > 300) {
    errors.description = "Description cannot exceed 300 characters.";
  }

  if (formValues.url.trim().length > 1000) {
    errors.url = "Statistic URL cannot exceed 1000 characters.";
  }

  const numericOrder = Number(formValues.order);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    errors.order = "Display order must be a non-negative number.";
  }

  return errors;
}

function StatisticFieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">{message}</p>;
}

function createPreviewValue(formValues) {
  const prefix = String(formValues.prefix || "").trim();
  const value = String(formValues.value || "").trim() || "0";
  const suffix = String(formValues.suffix || "").trim();

  return `${prefix}${value}${suffix}`;
}

function StatisticForm({
  initialValues = defaultStatisticFormValues,
  onSubmit,
  submitLabel = "Save Statistic",
  accessToken = "",
  onMediaUnauthorized,
}) {
  const [formValues, setFormValues] = useState(initialValues);
  const [localErrors, setLocalErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(
    Boolean(initialValues.key),
  );

  function getFieldError(...fieldNames) {
    for (const fieldName of fieldNames) {
      if (localErrors[fieldName]) {
        return localErrors[fieldName];
      }

      if (serverErrors[fieldName]) {
        return serverErrors[fieldName];
      }
    }

    return "";
  }

  function clearFieldErrors(...fieldNames) {
    setLocalErrors((currentErrors) => {
      const updatedErrors = {
        ...currentErrors,
      };

      fieldNames.forEach((fieldName) => {
        delete updatedErrors[fieldName];
      });

      return updatedErrors;
    });

    setServerErrors((currentErrors) => {
      const updatedErrors = {
        ...currentErrors,
      };

      fieldNames.forEach((fieldName) => {
        delete updatedErrors[fieldName];
      });

      return updatedErrors;
    });
  }

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setFormValues((currentValues) => {
      const updatedValues = {
        ...currentValues,
        [name]: nextValue,
      };

      if (name === "label" && !isKeyManuallyEdited) {
        updatedValues.key = createStatisticKey(value);
      }

      return updatedValues;
    });

    if (name === "key") {
      setIsKeyManuallyEdited(Boolean(value.trim()));
    }

    clearFieldErrors(name);
    setSubmitError("");
  }

  function handleKeyBlur() {
    setFormValues((currentValues) => ({
      ...currentValues,
      key:
        createStatisticKey(currentValues.key) ||
        createStatisticKey(currentValues.label),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateStatisticForm(formValues);

    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      setSubmitError("");
      return;
    }

    try {
      setIsSubmitting(true);
      setLocalErrors({});
      setServerErrors({});
      setSubmitError("");

      await onSubmit(createStatisticPayload(formValues));
    } catch (error) {
      setServerErrors(error?.fieldErrors || {});

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Statistic could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClasses =
    "mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm";

  const labelClasses =
    "text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rnx-admin-statistic-form-v486 space-y-2"
    >
      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {submitError}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
            Metric Details
          </p>

          <h2 className="mt-0.5 text-[13px] font-bold text-slate-950 dark:text-white sm:text-sm">
            Label, Value and Description
          </h2>
        </div>

        <div className="mt-2 grid gap-2 xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start">
          <div className="grid gap-x-3 gap-y-2 md:grid-cols-2">
            <div>
              <label htmlFor="statistic-label" className={labelClasses}>
                Statistic Label <span className="text-red-600">*</span>
              </label>

              <input
                id="statistic-label"
                name="label"
                type="text"
                value={formValues.label}
                onChange={handleInputChange}
                disabled={isSubmitting}
                maxLength={120}
                placeholder="Projects Completed"
                className={inputClasses}
              />

              <StatisticFieldError message={getFieldError("label")} />
            </div>

            <div>
              <label htmlFor="statistic-key" className={labelClasses}>
                Unique Key <span className="text-red-600">*</span>
              </label>

              <input
                id="statistic-key"
                name="key"
                type="text"
                value={formValues.key}
                onChange={handleInputChange}
                onBlur={handleKeyBlur}
                disabled={isSubmitting}
                maxLength={100}
                placeholder="projects-completed"
                className={inputClasses}
              />

              <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
                Auto-generated from the label until manually edited.
              </p>

              <StatisticFieldError message={getFieldError("key")} />
            </div>

            <div className="grid gap-2 md:col-span-2 md:grid-cols-[0.45fr_1fr_0.45fr]">
              <div>
                <label htmlFor="statistic-prefix" className={labelClasses}>
                  Prefix
                </label>

                <input
                  id="statistic-prefix"
                  name="prefix"
                  type="text"
                  value={formValues.prefix}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  maxLength={20}
                  placeholder="$"
                  className={inputClasses}
                />

                <StatisticFieldError message={getFieldError("prefix")} />
              </div>

              <div>
                <label htmlFor="statistic-value" className={labelClasses}>
                  Value <span className="text-red-600">*</span>
                </label>

                <input
                  id="statistic-value"
                  name="value"
                  type="text"
                  value={formValues.value}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  maxLength={50}
                  placeholder="25"
                  className={inputClasses}
                />

                <StatisticFieldError message={getFieldError("value")} />
              </div>

              <div>
                <label htmlFor="statistic-suffix" className={labelClasses}>
                  Suffix
                </label>

                <input
                  id="statistic-suffix"
                  name="suffix"
                  type="text"
                  value={formValues.suffix}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  maxLength={20}
                  placeholder="+"
                  className={inputClasses}
                />

                <StatisticFieldError message={getFieldError("suffix")} />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="statistic-description" className={labelClasses}>
                Description
              </label>

              <textarea
                id="statistic-description"
                name="description"
                value={formValues.description}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={2}
                maxLength={300}
                placeholder="Briefly explain what this statistic represents."
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm"
              />

              <div className="mt-0.5 flex items-start justify-between gap-2">
                <StatisticFieldError message={getFieldError("description")} />

                <span className="ml-auto shrink-0 text-[9px] text-slate-400 sm:text-[10px]">
                  {formValues.description.length}/300
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-brand-100 bg-brand-50/70 p-2.5 dark:border-brand-900/60 dark:bg-brand-950/30">
            <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-brand-600 dark:text-brand-300">
              Live Preview
            </p>

            <p className="mt-1 break-words text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {createPreviewValue(formValues)}
            </p>

            <p className="mt-0.5 line-clamp-2 text-[10px] font-semibold text-slate-600 dark:text-slate-300 sm:text-[11px]">
              {formValues.label.trim() || "Statistic label"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
            Display & Publishing
          </p>

          <h2 className="mt-0.5 text-[13px] font-bold text-slate-950 dark:text-white sm:text-sm">
            Icon, Accent, Link and Visibility
          </h2>
        </div>

        <div className="mt-2 grid gap-2 xl:grid-cols-2 xl:items-start">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <label htmlFor="statistic-order" className={labelClasses}>
                Display Order
              </label>

              <input
                id="statistic-order"
                name="order"
                type="number"
                min="0"
                step="1"
                value={formValues.order}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className={inputClasses}
              />

              <StatisticFieldError message={getFieldError("order")} />
            </div>

            <div>
              <label htmlFor="statistic-accent" className={labelClasses}>
                Card Accent
              </label>

              <select
                id="statistic-accent"
                name="accent"
                value={formValues.accent}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className={inputClasses}
              >
                <option value="violet">Violet</option>
                <option value="blue">Blue</option>
                <option value="cyan">Cyan</option>
                <option value="orange">Orange</option>
                <option value="pink">Pink</option>
                <option value="emerald">Emerald</option>
              </select>

              <StatisticFieldError message={getFieldError("accent")} />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="statistic-icon" className={labelClasses}>
                Icon Name
              </label>

              <input
                id="statistic-icon"
                name="icon"
                type="text"
                value={formValues.icon}
                onChange={handleInputChange}
                disabled={isSubmitting}
                maxLength={100}
                placeholder="briefcase"
                className={inputClasses}
              />

              <StatisticFieldError message={getFieldError("icon")} />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="statistic-url" className={labelClasses}>
                Optional Card Link
              </label>

              <input
                id="statistic-url"
                name="url"
                type="text"
                value={formValues.url}
                onChange={handleInputChange}
                disabled={isSubmitting}
                maxLength={1000}
                placeholder="/projects, #contact or example.com"
                className={inputClasses}
              />

              <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
                Internal path, section link, full URL or bare domain.
              </p>

              <StatisticFieldError message={getFieldError("url")} />
            </div>
          </div>

          <div className="space-y-2">
            <MediaField
              id="statistic-icon-url"
              name="iconUrl"
              label="Icon Image URL"
              value={formValues.iconUrl}
              onChange={handleInputChange}
              accessToken={accessToken}
              allowedTypes={["image", "svg"]}
              pickerTitle="Choose Statistic Icon"
              placeholder="https://..."
              helpText="Paste a URL or choose an image/SVG from Media Library."
              error={getFieldError("iconUrl")}
              disabled={isSubmitting}
              onUnauthorized={onMediaUnauthorized}
            />

            <div className="grid gap-2 sm:grid-cols-3">
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950/60">
                <input
                  name="openInNewTab"
                  type="checkbox"
                  checked={formValues.openInNewTab}
                  onChange={handleInputChange}
                  disabled={isSubmitting || !formValues.url.trim()}
                  className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900"
                />

                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                    New Tab
                  </span>
                  <span className="mt-0.5 block text-[9px] leading-3.5 text-slate-500 dark:text-slate-400">
                    For external links.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950/60">
                <input
                  name="isVisible"
                  type="checkbox"
                  checked={formValues.isVisible}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900"
                />

                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                    Visible
                  </span>
                  <span className="mt-0.5 block text-[9px] leading-3.5 text-slate-500 dark:text-slate-400">
                    Show publicly.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950/60">
                <input
                  name="isFeatured"
                  type="checkbox"
                  checked={formValues.isFeatured}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900"
                />

                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                    Featured
                  </span>
                  <span className="mt-0.5 block text-[9px] leading-3.5 text-slate-500 dark:text-slate-400">
                    Strong emphasis.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/statistics"
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-[11px] font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-4 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:px-5 sm:text-xs"
        >
          {isSubmitting ? "Saving Statistic..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default StatisticForm;
