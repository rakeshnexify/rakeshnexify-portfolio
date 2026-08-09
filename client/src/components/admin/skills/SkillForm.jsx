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
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const textareaClasses =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

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

  return <p className="mt-2 text-sm font-medium text-red-600">{message}</p>;
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
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {submitError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
        >
          {submitError}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Skill Identity
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Basic Information
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Add the public name, URL slug, category and description for this
          skill.
        </p>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="skill-name"
              className="text-sm font-semibold text-slate-700"
            >
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
            <label
              htmlFor="skill-slug"
              className="text-sm font-semibold text-slate-700"
            >
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

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Automatically generated from the name until manually edited.
            </p>

            <SkillFieldError message={getFieldError("slug")} />
          </div>

          <div>
            <label
              htmlFor="skill-short-name"
              className="text-sm font-semibold text-slate-700"
            >
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
            <label
              htmlFor="skill-category"
              className="text-sm font-semibold text-slate-700"
            >
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

          <div className="md:col-span-2">
            <label
              htmlFor="skill-description"
              className="text-sm font-semibold text-slate-700"
            >
              Description <span className="text-red-600">*</span>
            </label>

            <textarea
              id="skill-description"
              name="description"
              value={formValues.description}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={6}
              maxLength={500}
              placeholder="Explain how this skill is used in your professional work."
              aria-invalid={Boolean(getFieldError("description"))}
              className={textareaClasses}
            />

            <div className="mt-2 flex justify-between gap-4 text-xs text-slate-500">
              <span>Minimum 10 characters</span>
              <span>{String(formValues.description || "").length}/500</span>
            </div>

            <SkillFieldError message={getFieldError("description")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Experience
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Proficiency and Experience
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="skill-proficiency-level"
              className="text-sm font-semibold text-slate-700"
            >
              Proficiency Level <span className="text-red-600">*</span>
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
              <option value="">Select proficiency level</option>

              {skillProficiencyLevels.map((level) => (
                <option key={level} value={level}>
                  {proficiencyLabels[level] || level}
                </option>
              ))}
            </select>

            <SkillFieldError message={getFieldError("proficiencyLevel")} />
          </div>

          <div>
            <label
              htmlFor="skill-years-of-experience"
              className="text-sm font-semibold text-slate-700"
            >
              Years of Experience
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

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Optional. Decimal values such as 2.5 are supported.
            </p>

            <SkillFieldError message={getFieldError("yearsOfExperience")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Visual Identity
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Icon Settings
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="skill-icon"
              className="text-sm font-semibold text-slate-700"
            >
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
            helpText="Paste an external icon URL or choose an image/SVG from the Media Library."
            error={getFieldError("iconUrl")}
            disabled={isSubmitting}
            onUnauthorized={onMediaUnauthorized}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Publishing Controls
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Display Order and Visibility
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="skill-order"
              className="text-sm font-semibold text-slate-700"
            >
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

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                name="isVisible"
                type="checkbox"
                checked={formValues.isVisible}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="mt-1 size-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />

              <span>
                <span className="block font-semibold text-slate-800">
                  Publicly Visible
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Show this skill on public Skills pages and sections.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                name="isFeatured"
                type="checkbox"
                checked={formValues.isFeatured}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="mt-1 size-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />

              <span>
                <span className="block font-semibold text-slate-800">
                  Featured Skill
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Prioritise this skill in featured displays.
                </span>
              </span>
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/skills"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-7 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving Skill..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default SkillForm;
