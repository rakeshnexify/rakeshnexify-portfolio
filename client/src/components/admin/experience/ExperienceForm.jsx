import { useState } from "react";
import { Link } from "react-router";

import MediaField from "../media/MediaField";

import {
  createExperienceDefaultSlug,
  createExperiencePayload,
  createExperienceSlug,
  defaultExperienceFormValues,
  employmentTypes,
  locationTypes,
  validateExperienceFormValues,
} from "../../../utils/experienceForm";

const inputClasses =
  "mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm";

const textareaClasses =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm";

const employmentTypeLabels = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  freelance: "Freelance",
  contract: "Contract",
  internship: "Internship",
  "self-employed": "Self-employed",
  founder: "Founder",
  volunteer: "Volunteer",
  other: "Other",
};

const locationTypeLabels = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

function ExperienceFieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">{message}</p>;
}

function ExperienceForm({
  initialValues = defaultExperienceFormValues,
  onSubmit,
  submitLabel = "Save Experience",
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

      if (name === "isCurrent" && checked) {
        updatedValues.endDate = "";
      }

      if (
        ["organizationName", "jobTitle", "startDate"].includes(name) &&
        !isSlugManuallyEdited
      ) {
        updatedValues.slug = createExperienceDefaultSlug(updatedValues);
      }

      return updatedValues;
    });

    if (name === "slug") {
      setIsSlugManuallyEdited(Boolean(value.trim()));
    }

    clearFieldErrors(name);

    if (name === "isCurrent") {
      clearFieldErrors("endDate");
    }

    setSubmitError("");
  }

  function handleSlugBlur() {
    setFormValues((currentValues) => ({
      ...currentValues,
      slug:
        createExperienceSlug(currentValues.slug) ||
        createExperienceDefaultSlug(currentValues),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateExperienceFormValues(formValues);

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

      await onSubmit(createExperiencePayload(formValues));
    } catch (error) {
      const fieldErrors =
        error?.fieldErrors && typeof error.fieldErrors === "object"
          ? error.fieldErrors
          : {};

      setServerErrors(fieldErrors);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Experience record could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rnx-admin-experience-form-v478 space-y-2"
    >
      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {submitError}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
            Role and Timeline
          </p>

          <h2 className="mt-0.5 text-[13px] font-bold text-slate-950 dark:text-white sm:text-sm">
            Organization, Role and Employment Dates
          </h2>
        </div>

        <div className="mt-2 grid gap-x-3 gap-y-2 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label htmlFor="experience-organization-name" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
              Organization Name <span className="text-red-600">*</span>
            </label>

            <input
              id="experience-organization-name"
              name="organizationName"
              type="text"
              value={formValues.organizationName}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={180}
              placeholder="RakeshNexify"
              aria-invalid={Boolean(getFieldError("organizationName"))}
              className={inputClasses}
            />

            <ExperienceFieldError message={getFieldError("organizationName")} />
          </div>

          <div className="xl:col-span-2">
            <label htmlFor="experience-slug" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
              URL Slug <span className="text-red-600">*</span>
            </label>

            <input
              id="experience-slug"
              name="slug"
              type="text"
              value={formValues.slug}
              onChange={handleInputChange}
              onBlur={handleSlugBlur}
              disabled={isSubmitting}
              maxLength={220}
              placeholder="rakeshnexify-mern-developer-2026-01-01"
              aria-invalid={Boolean(getFieldError("slug"))}
              className={inputClasses}
            />

            <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
              Auto-generated until manually edited.
            </p>

            <ExperienceFieldError message={getFieldError("slug")} />
          </div>

          <div className="xl:col-span-2">
            <label htmlFor="experience-job-title" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
              Job Title / Professional Role <span className="text-red-600">*</span>
            </label>

            <input
              id="experience-job-title"
              name="jobTitle"
              type="text"
              value={formValues.jobTitle}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={180}
              placeholder="MERN Stack Developer"
              aria-invalid={Boolean(getFieldError("jobTitle"))}
              className={inputClasses}
            />

            <ExperienceFieldError message={getFieldError("jobTitle")} />
          </div>

          <div>
            <label htmlFor="experience-employment-type" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
              Employment Type <span className="text-red-600">*</span>
            </label>

            <select
              id="experience-employment-type"
              name="employmentType"
              value={formValues.employmentType}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("employmentType"))}
              className={inputClasses}
            >
              {employmentTypes.map((employmentType) => (
                <option key={employmentType} value={employmentType}>
                  {employmentTypeLabels[employmentType] || employmentType}
                </option>
              ))}
            </select>

            <ExperienceFieldError message={getFieldError("employmentType")} />
          </div>

          <div>
            <label htmlFor="experience-location-type" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
              Work Mode
            </label>

            <select
              id="experience-location-type"
              name="locationType"
              value={formValues.locationType}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("locationType"))}
              className={inputClasses}
            >
              <option value="">Not specified</option>

              {locationTypes.map((locationType) => (
                <option key={locationType} value={locationType}>
                  {locationTypeLabels[locationType] || locationType}
                </option>
              ))}
            </select>

            <ExperienceFieldError message={getFieldError("locationType")} />
          </div>

          <div>
            <label htmlFor="experience-location" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
              Location
            </label>

            <input
              id="experience-location"
              name="location"
              type="text"
              value={formValues.location}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={180}
              placeholder="Kathmandu, Nepal"
              aria-invalid={Boolean(getFieldError("location"))}
              className={inputClasses}
            />

            <ExperienceFieldError message={getFieldError("location")} />
          </div>

          <div>
            <label htmlFor="experience-start-date" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
              Start Date <span className="text-red-600">*</span>
            </label>

            <input
              id="experience-start-date"
              name="startDate"
              type="date"
              value={formValues.startDate}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("startDate"))}
              className={inputClasses}
            />

            <ExperienceFieldError message={getFieldError("startDate")} />
          </div>

          <div>
            <label htmlFor="experience-end-date" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
              End Date {!formValues.isCurrent && <span className="text-red-600">*</span>}
            </label>

            <input
              id="experience-end-date"
              name="endDate"
              type="date"
              value={formValues.endDate}
              onChange={handleInputChange}
              disabled={isSubmitting || formValues.isCurrent}
              aria-invalid={Boolean(getFieldError("endDate"))}
              className={inputClasses}
            />

            <ExperienceFieldError message={getFieldError("endDate")} />
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950/60 md:col-span-2 xl:col-span-1">
            <input
              name="isCurrent"
              type="checkbox"
              checked={formValues.isCurrent}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900"
            />

            <span className="min-w-0">
              <span className="block text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                Current Position
              </span>

              <span className="mt-0.5 block text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
                End date stays empty; public timeline shows Present.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300">
            Content and Publishing
          </p>

          <h2 className="mt-0.5 text-[13px] font-bold text-slate-950 dark:text-white sm:text-sm">
            Work Details, Expertise, Media and Visibility
          </h2>
        </div>

        <div className="mt-2 grid gap-2 xl:grid-cols-2 xl:items-start">
          <div className="space-y-2">
            <div>
              <label htmlFor="experience-short-description" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
                Short Description <span className="text-red-600">*</span>
              </label>

              <textarea
                id="experience-short-description"
                name="shortDescription"
                value={formValues.shortDescription}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={2}
                maxLength={600}
                placeholder="Summarise the role, responsibilities and professional impact."
                aria-invalid={Boolean(getFieldError("shortDescription"))}
                className={textareaClasses}
              />

              <div className="mt-0.5 flex justify-between gap-3 text-[9px] text-slate-500 dark:text-slate-400 sm:text-[10px]">
                <span>Minimum 10 characters</span>
                <span>{String(formValues.shortDescription || "").length}/600</span>
              </div>

              <ExperienceFieldError message={getFieldError("shortDescription")} />
            </div>

            <div>
              <label htmlFor="experience-description" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
                Detailed Description
              </label>

              <textarea
                id="experience-description"
                name="description"
                value={formValues.description}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={3}
                maxLength={5000}
                placeholder="Professional background, scope of work and useful context."
                aria-invalid={Boolean(getFieldError("description"))}
                className={textareaClasses}
              />

              <div className="mt-0.5 text-right text-[9px] text-slate-500 dark:text-slate-400 sm:text-[10px]">
                {String(formValues.description || "").length}/5000
              </div>

              <ExperienceFieldError message={getFieldError("description")} />
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <label htmlFor="experience-responsibilities" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
                  Responsibilities
                </label>

                <textarea
                  id="experience-responsibilities"
                  name="responsibilities"
                  value={formValues.responsibilities}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={3}
                  placeholder={"Build responsive applications\nMaintain secure APIs"}
                  aria-invalid={Boolean(getFieldError("responsibilities"))}
                  className={textareaClasses}
                />

                <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
                  Up to 30 items.
                </p>

                <ExperienceFieldError message={getFieldError("responsibilities")} />
              </div>

              <div>
                <label htmlFor="experience-achievements" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
                  Achievements
                </label>

                <textarea
                  id="experience-achievements"
                  name="achievements"
                  value={formValues.achievements}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={3}
                  placeholder={"Delivered production modules\nImproved workflows"}
                  aria-invalid={Boolean(getFieldError("achievements"))}
                  className={textareaClasses}
                />

                <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
                  Up to 30 items.
                </p>

                <ExperienceFieldError message={getFieldError("achievements")} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <label htmlFor="experience-skills" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
                  Skills
                </label>

                <textarea
                  id="experience-skills"
                  name="skills"
                  value={formValues.skills}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={2}
                  placeholder={"JavaScript\nReact\nNode.js"}
                  aria-invalid={Boolean(getFieldError("skills"))}
                  className={textareaClasses}
                />

                <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
                  Up to 50 items.
                </p>

                <ExperienceFieldError message={getFieldError("skills")} />
              </div>

              <div>
                <label htmlFor="experience-tools" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
                  Tools and Technologies
                </label>

                <textarea
                  id="experience-tools"
                  name="tools"
                  value={formValues.tools}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={2}
                  placeholder={"VS Code\nGit\nPostman"}
                  aria-invalid={Boolean(getFieldError("tools"))}
                  className={textareaClasses}
                />

                <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
                  Up to 50 items.
                </p>

                <ExperienceFieldError message={getFieldError("tools")} />
              </div>
            </div>

            <div>
              <label htmlFor="experience-website-url" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
                Organization Website URL
              </label>

              <input
                id="experience-website-url"
                name="organizationWebsiteUrl"
                type="url"
                value={formValues.organizationWebsiteUrl}
                onChange={handleInputChange}
                disabled={isSubmitting}
                maxLength={500}
                placeholder="https://example.com"
                aria-invalid={Boolean(getFieldError("organizationWebsiteUrl"))}
                className={inputClasses}
              />

              <ExperienceFieldError message={getFieldError("organizationWebsiteUrl")} />
            </div>

            <div>
              <MediaField
                id="experience-logo-url"
                name="organizationLogoUrl"
                label="Organization Logo URL"
                value={formValues.organizationLogoUrl}
                onChange={handleInputChange}
                accessToken={accessToken}
                allowedTypes={["image", "svg"]}
                pickerTitle="Choose Organization Logo"
                placeholder="https://example.com/logo.png"
                helpText="Paste a URL or choose from Media Library."
                error={getFieldError("organizationLogoUrl")}
                disabled={isSubmitting}
                onUnauthorized={onMediaUnauthorized}
              />

              {formValues.organizationLogoUrl && (
                <div className="mt-1 flex h-10 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950/60">
                  <img
                    src={formValues.organizationLogoUrl}
                    alt="Organization logo preview"
                    className="max-h-8 max-w-full object-contain"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <div>
            <label htmlFor="experience-order" className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]">
              Display Order
            </label>

            <input
              id="experience-order"
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

            <ExperienceFieldError message={getFieldError("order")} />
          </div>

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
                Publicly Visible
              </span>

              <span className="mt-0.5 block text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
                Show on public Experience pages.
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
                Featured Experience
              </span>

              <span className="mt-0.5 block text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
                Prioritise in featured displays.
              </span>
            </span>
          </label>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/experience"
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-[11px] font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-4 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:px-5 sm:text-xs"
        >
          {isSubmitting ? "Saving Experience..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default ExperienceForm;
