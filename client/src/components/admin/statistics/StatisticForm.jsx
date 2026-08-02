import { useState } from "react";
import { Link } from "react-router";

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

  return <p className="mt-2 text-sm font-medium text-red-600">{message}</p>;
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {submitError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700"
        >
          {submitError}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Basic Information</h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Add the statistic label, unique key and value displayed on the
          portfolio.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div>
            <label
              htmlFor="statistic-label"
              className="text-sm font-semibold text-slate-700"
            >
              Statistic label *
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
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <StatisticFieldError message={getFieldError("label")} />
          </div>

          <div>
            <label
              htmlFor="statistic-key"
              className="text-sm font-semibold text-slate-700"
            >
              Unique key *
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
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <StatisticFieldError message={getFieldError("key")} />
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-[0.35fr_1fr_0.35fr]">
          <div>
            <label
              htmlFor="statistic-prefix"
              className="text-sm font-semibold text-slate-700"
            >
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
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <StatisticFieldError message={getFieldError("prefix")} />
          </div>

          <div>
            <label
              htmlFor="statistic-value"
              className="text-sm font-semibold text-slate-700"
            >
              Value *
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
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <StatisticFieldError message={getFieldError("value")} />
          </div>

          <div>
            <label
              htmlFor="statistic-suffix"
              className="text-sm font-semibold text-slate-700"
            >
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
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <StatisticFieldError message={getFieldError("suffix")} />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
            Value Preview
          </p>

          <p className="mt-3 break-words text-4xl font-extrabold tracking-tight text-slate-950">
            {createPreviewValue(formValues)}
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-600">
            {formValues.label.trim() || "Statistic label"}
          </p>
        </div>

        <div className="mt-5">
          <label
            htmlFor="statistic-description"
            className="text-sm font-semibold text-slate-700"
          >
            Description
          </label>

          <textarea
            id="statistic-description"
            name="description"
            value={formValues.description}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={4}
            maxLength={300}
            placeholder="Briefly explain what this statistic represents."
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
          />

          <div className="mt-2 flex items-start justify-between gap-4">
            <StatisticFieldError message={getFieldError("description")} />

            <span className="ml-auto text-xs text-slate-400">
              {formValues.description.length}
              /300
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Display Settings</h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Control the icon, display order, visibility and featured status.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div>
            <label
              htmlFor="statistic-order"
              className="text-sm font-semibold text-slate-700"
            >
              Display order
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
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <StatisticFieldError message={getFieldError("order")} />
          </div>

          <div>
            <label
              htmlFor="statistic-icon"
              className="text-sm font-semibold text-slate-700"
            >
              Icon name
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
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <StatisticFieldError message={getFieldError("icon")} />
          </div>

          <div>
            <label
              htmlFor="statistic-icon-url"
              className="text-sm font-semibold text-slate-700"
            >
              Icon image URL
            </label>

            <input
              id="statistic-icon-url"
              name="iconUrl"
              type="url"
              value={formValues.iconUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://..."
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <StatisticFieldError message={getFieldError("iconUrl")} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input
              name="isVisible"
              type="checkbox"
              checked={formValues.isVisible}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-1 size-4 accent-brand-600"
            />

            <span>
              <span className="block text-sm font-bold text-slate-900">
                Visible on portfolio
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Public visitors can see this statistic.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input
              name="isFeatured"
              type="checkbox"
              checked={formValues.isFeatured}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-1 size-4 accent-brand-600"
            />

            <span>
              <span className="block text-sm font-bold text-slate-900">
                Featured statistic
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Display this statistic with stronger visual emphasis.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/statistics"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Saving statistic..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default StatisticForm;
