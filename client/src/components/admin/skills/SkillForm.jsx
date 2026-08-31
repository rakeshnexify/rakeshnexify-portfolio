import { useState } from "react";
import { Link } from "react-router";

import MediaField from "../media/MediaField";

import {
  createSkillPayload,
  createSkillSlug,
  defaultSkillFormValues,
  skillProficiencyLevels,
  validateSkillFormValues,
} from "../../../utils/skillForm";

const inputClasses =
  "mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm";

const textareaClasses =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm";

const labelClasses =
  "text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]";

const sectionClasses =
  "rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3";

const proficiencyLabels = {
  familiar: "Familiar",
  proficient: "Proficient",
  advanced: "Advanced",
  expert: "Expert",
};

function SkillFieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">{message}</p>;
}

function SkillForm({
  initialValues = defaultSkillFormValues,
  onSubmit,
  submitLabel = "Save Skill",
  accessToken = "",
  onMediaUnauthorized,
}) {
  const [formValues, setFormValues] = useState(initialValues);
  const [localErrors, setLocalErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(
    Boolean(initialValues.slug),
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
      const updatedErrors = { ...currentErrors };

      fieldNames.forEach((fieldName) => {
        delete updatedErrors[fieldName];
      });

      return updatedErrors;
    });

    setServerErrors((currentErrors) => {
      const updatedErrors = { ...currentErrors };

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

      if (name === "name" && !isSlugManuallyEdited) {
        updatedValues.slug = createSkillSlug(value);
      }

      return updatedValues;
    });

    if (name === "slug") {
      setIsSlugManuallyEdited(Boolean(value.trim()));
    }

    clearFieldErrors(name);
    setSubmitError("");
  }

  function handleSlugBlur() {
    setFormValues((currentValues) => ({
      ...currentValues,
      slug:
        createSkillSlug(currentValues.slug) ||
        createSkillSlug(currentValues.name),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateSkillFormValues(formValues);

    setLocalErrors(validationErrors);
    setServerErrors({});
    setSubmitError("");

    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0];

      document.querySelector(`[name="${firstErrorField}"]`)?.focus();
      return;
    }

    try {
      setIsSubmitting(true);

      await onSubmit(createSkillPayload(formValues));
    } catch (error) {
      const fieldErrors =
        error?.fieldErrors && typeof error.fieldErrors === "object"
          ? error.fieldErrors
          : {};

      setServerErrors(fieldErrors);
      setSubmitError(
        error instanceof Error ? error.message : "Skill could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rnx-admin-skill-form-v473 space-y-2"
    >
      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {submitError}
        </div>
      )}

      <section className={sectionClasses}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
            Skill Details
          </p>

          <h2 className="mt-0.5 text-[13px] font-bold text-slate-950 dark:text-white sm:text-sm">
            Basic Information
          </h2>

          <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
            Core public identity, category and short description.
          </p>
        </div>

        <div className="mt-2 grid gap-x-3 gap-y-2 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="skill-name" className={labelClasses}>
              Skill Name <span className="text-red-600">*</span>
            </label>

            <input
              id="skill-name"
              name="name"
              type="text"
              value={formValues.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={120}
              placeholder="JavaScript"
              aria-invalid={Boolean(getFieldError("name"))}
              className={inputClasses}
            />

            <SkillFieldError message={getFieldError("name")} />
          </div>

          <div>
            <label htmlFor="skill-slug" className={labelClasses}>
              URL Slug <span className="text-red-600">*</span>
            </label>

            <input
              id="skill-slug"
              name="slug"
              type="text"
              value={formValues.slug}
              onChange={handleInputChange}
              onBlur={handleSlugBlur}
              disabled={isSubmitting}
              maxLength={150}
              placeholder="javascript"
              aria-invalid={Boolean(getFieldError("slug"))}
              className={inputClasses}
            />

            <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
              Auto-generated until manually edited.
            </p>

            <SkillFieldError message={getFieldError("slug")} />
          </div>

          <div>
            <label htmlFor="skill-short-name" className={labelClasses}>
              Short Name
            </label>

            <input
              id="skill-short-name"
              name="shortName"
              type="text"
              value={formValues.shortName}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={50}
              placeholder="JS"
              aria-invalid={Boolean(getFieldError("shortName"))}
              className={inputClasses}
            />

            <SkillFieldError message={getFieldError("shortName")} />
          </div>

          <div>
            <label htmlFor="skill-category" className={labelClasses}>
              Category <span className="text-red-600">*</span>
            </label>

            <input
              id="skill-category"
              name="category"
              type="text"
              value={formValues.category}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={100}
              placeholder="Frontend Development"
              aria-invalid={Boolean(getFieldError("category"))}
              className={inputClasses}
            />

            <SkillFieldError message={getFieldError("category")} />
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <label htmlFor="skill-description" className={labelClasses}>
              Description
              <span className="ml-1 font-normal text-slate-400">(Optional)</span>
            </label>

            <textarea
              id="skill-description"
              name="description"
              value={formValues.description}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={2}
              maxLength={500}
              placeholder="Explain how this skill is used in your professional work."
              aria-invalid={Boolean(getFieldError("description"))}
              className={textareaClasses}
            />

            <div className="mt-0.5 flex justify-between gap-3 text-[10px] text-slate-500 dark:text-slate-400">
              <span>Maximum 500 characters</span>
              <span>{String(formValues.description || "").length}/500</span>
            </div>

            <SkillFieldError message={getFieldError("description")} />
          </div>
        </div>
      </section>

      <section className={sectionClasses}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
            Skill Settings
          </p>

          <h2 className="mt-0.5 text-[13px] font-bold text-slate-950 dark:text-white sm:text-sm">
            Experience, Icon and Publishing
          </h2>

          <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
            Keep proficiency, visual identity and public state in one place.
          </p>
        </div>

        <div className="mt-2 grid gap-x-3 gap-y-2 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="skill-proficiency-level" className={labelClasses}>
              Proficiency <span className="text-red-600">*</span>
            </label>

            <select
              id="skill-proficiency-level"
              name="proficiencyLevel"
              value={formValues.proficiencyLevel}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("proficiencyLevel"))}
              className={inputClasses}
            >
              <option value="">Select level</option>

              {skillProficiencyLevels.map((level) => (
                <option key={level} value={level}>
                  {proficiencyLabels[level] || level}
                </option>
              ))}
            </select>

            <SkillFieldError message={getFieldError("proficiencyLevel")} />
          </div>

          <div>
            <label htmlFor="skill-proficiency-percent" className={labelClasses}>
              Proficiency %
            </label>

            <input
              id="skill-proficiency-percent"
              name="proficiencyPercent"
              type="number"
              min="0"
              max="100"
              step="1"
              value={formValues.proficiencyPercent}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="90"
              aria-invalid={Boolean(getFieldError("proficiencyPercent"))}
              className={inputClasses}
            />

            <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
              Optional, 0 to 100.
            </p>

            <SkillFieldError message={getFieldError("proficiencyPercent")} />
          </div>

          <div>
            <label htmlFor="skill-years-of-experience" className={labelClasses}>
              Experience Years
            </label>

            <input
              id="skill-years-of-experience"
              name="yearsOfExperience"
              type="number"
              min="0"
              max="60"
              step="0.1"
              value={formValues.yearsOfExperience}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="3.5"
              aria-invalid={Boolean(getFieldError("yearsOfExperience"))}
              className={inputClasses}
            />

            <p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
              Decimal values supported.
            </p>

            <SkillFieldError message={getFieldError("yearsOfExperience")} />
          </div>

          <div>
            <label htmlFor="skill-order" className={labelClasses}>
              Display Order
            </label>

            <input
              id="skill-order"
              name="order"
              type="number"
              min="0"
              step="1"
              value={formValues.order}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("order"))}
              className={inputClasses}
            />

            <SkillFieldError message={getFieldError("order")} />
          </div>

          <div>
            <label htmlFor="skill-icon" className={labelClasses}>
              Icon Name
            </label>

            <input
              id="skill-icon"
              name="icon"
              type="text"
              value={formValues.icon}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={100}
              placeholder="javascript"
              aria-invalid={Boolean(getFieldError("icon"))}
              className={inputClasses}
            />

            <SkillFieldError message={getFieldError("icon")} />
          </div>

          <div className="md:col-span-1 xl:col-span-3">
            <MediaField
              id="skill-icon-url"
              name="iconUrl"
              label="Icon Image URL"
              value={formValues.iconUrl}
              onChange={handleInputChange}
              accessToken={accessToken}
              allowedTypes={["image", "svg"]}
              pickerTitle="Choose Skill Icon"
              placeholder="https://example.com/javascript.svg"
              helpText="Paste a URL or choose an image/SVG from Media Library."
              error={getFieldError("iconUrl")}
              disabled={isSubmitting}
              onUnauthorized={onMediaUnauthorized}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950/60 md:col-span-1 xl:col-span-2">
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
                Publicly Visible
              </span>

              <span className="mt-0.5 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                Show on public Skills pages and sections.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950/60 md:col-span-1 xl:col-span-2">
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
                Featured Skill
              </span>

              <span className="mt-0.5 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                Prioritise this skill in featured displays.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-1.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/skills"
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-[11px] font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-brand-700 dark:hover:text-brand-300"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-4 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:px-5 sm:text-xs"
        >
          {isSubmitting ? "Saving Skill..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default SkillForm;
