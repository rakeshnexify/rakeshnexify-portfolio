import { useState } from "react";
import { Link } from "react-router";

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
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const textareaClasses =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

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

  return <p className="mt-2 text-sm font-medium text-red-600">{message}</p>;
}

function ExperienceForm({
  initialValues = defaultExperienceFormValues,
  onSubmit,
  submitLabel = "Save Experience",
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
          Experience Identity
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Organization and Professional Role
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Add the organization, role, employment type, location and public URL
          slug.
        </p>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="experience-organization-name"
              className="text-sm font-semibold text-slate-700"
            >
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

            <ExperienceFieldError
              message={getFieldError("organizationName")}
            />
          </div>

          <div>
            <label
              htmlFor="experience-slug"
              className="text-sm font-semibold text-slate-700"
            >
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

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Automatically generated until manually edited.
            </p>

            <ExperienceFieldError message={getFieldError("slug")} />
          </div>

          <div>
            <label
              htmlFor="experience-job-title"
              className="text-sm font-semibold text-slate-700"
            >
              Job Title / Professional Role{" "}
              <span className="text-red-600">*</span>
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
            <label
              htmlFor="experience-employment-type"
              className="text-sm font-semibold text-slate-700"
            >
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
            <label
              htmlFor="experience-location"
              className="text-sm font-semibold text-slate-700"
            >
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
            <label
              htmlFor="experience-location-type"
              className="text-sm font-semibold text-slate-700"
            >
              Location Type
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
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Timeline
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Employment Dates
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="experience-start-date"
              className="text-sm font-semibold text-slate-700"
            >
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
            <label
              htmlFor="experience-end-date"
              className="text-sm font-semibold text-slate-700"
            >
              End Date{" "}
              {!formValues.isCurrent && (
                <span className="text-red-600">*</span>
              )}
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

          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                name="isCurrent"
                type="checkbox"
                checked={formValues.isCurrent}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="mt-1 size-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />

              <span>
                <span className="block font-semibold text-slate-800">
                  Current Position
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  End date will remain empty and the public timeline will show
                  “Present”.
                </span>
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Public Content
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Experience Description
        </h2>

        <div className="mt-7 grid gap-6">
          <div>
            <label
              htmlFor="experience-short-description"
              className="text-sm font-semibold text-slate-700"
            >
              Short Description <span className="text-red-600">*</span>
            </label>

            <textarea
              id="experience-short-description"
              name="shortDescription"
              value={formValues.shortDescription}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={5}
              maxLength={600}
              placeholder="Summarise the role, responsibilities and professional impact."
              aria-invalid={Boolean(getFieldError("shortDescription"))}
              className={textareaClasses}
            />

            <div className="mt-2 flex justify-between gap-4 text-xs text-slate-500">
              <span>Minimum 10 characters</span>

              <span>
                {String(formValues.shortDescription || "").length}/600
              </span>
            </div>

            <ExperienceFieldError
              message={getFieldError("shortDescription")}
            />
          </div>

          <div>
            <label
              htmlFor="experience-description"
              className="text-sm font-semibold text-slate-700"
            >
              Detailed Description
            </label>

            <textarea
              id="experience-description"
              name="description"
              value={formValues.description}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={9}
              maxLength={5000}
              placeholder="Add detailed professional background, scope of work and useful context."
              aria-invalid={Boolean(getFieldError("description"))}
              className={textareaClasses}
            />

            <div className="mt-2 text-right text-xs text-slate-500">
              {String(formValues.description || "").length}/5000
            </div>

            <ExperienceFieldError message={getFieldError("description")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Work Details
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Responsibilities and Achievements
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter one item per line. Comma-separated items are also supported.
        </p>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="experience-responsibilities"
              className="text-sm font-semibold text-slate-700"
            >
              Responsibilities
            </label>

            <textarea
              id="experience-responsibilities"
              name="responsibilities"
              value={formValues.responsibilities}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={9}
              placeholder={`Build responsive MERN applications
Design reusable frontend components
Maintain secure REST APIs`}
              aria-invalid={Boolean(getFieldError("responsibilities"))}
              className={textareaClasses}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Maximum 30 items and 300 characters per item.
            </p>

            <ExperienceFieldError
              message={getFieldError("responsibilities")}
            />
          </div>

          <div>
            <label
              htmlFor="experience-achievements"
              className="text-sm font-semibold text-slate-700"
            >
              Achievements
            </label>

            <textarea
              id="experience-achievements"
              name="achievements"
              value={formValues.achievements}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={9}
              placeholder={`Delivered production-ready portfolio modules
Improved API validation and security
Automated reusable development workflows`}
              aria-invalid={Boolean(getFieldError("achievements"))}
              className={textareaClasses}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Maximum 30 items and 300 characters per item.
            </p>

            <ExperienceFieldError message={getFieldError("achievements")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Expertise
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Skills and Tools
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter one skill or tool per line. Duplicate values are removed
          automatically.
        </p>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="experience-skills"
              className="text-sm font-semibold text-slate-700"
            >
              Skills
            </label>

            <textarea
              id="experience-skills"
              name="skills"
              value={formValues.skills}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={8}
              placeholder={`JavaScript
React
Node.js
MongoDB`}
              aria-invalid={Boolean(getFieldError("skills"))}
              className={textareaClasses}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Maximum 50 items and 100 characters per item.
            </p>

            <ExperienceFieldError message={getFieldError("skills")} />
          </div>

          <div>
            <label
              htmlFor="experience-tools"
              className="text-sm font-semibold text-slate-700"
            >
              Tools and Technologies
            </label>

            <textarea
              id="experience-tools"
              name="tools"
              value={formValues.tools}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={8}
              placeholder={`VS Code
Git
GitHub
Postman`}
              aria-invalid={Boolean(getFieldError("tools"))}
              className={textareaClasses}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Maximum 50 items and 100 characters per item.
            </p>

            <ExperienceFieldError message={getFieldError("tools")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Organization Links
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Website and Logo
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="experience-website-url"
              className="text-sm font-semibold text-slate-700"
            >
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
              aria-invalid={Boolean(
                getFieldError("organizationWebsiteUrl"),
              )}
              className={inputClasses}
            />

            <ExperienceFieldError
              message={getFieldError("organizationWebsiteUrl")}
            />
          </div>

          <div>
            <label
              htmlFor="experience-logo-url"
              className="text-sm font-semibold text-slate-700"
            >
              Organization Logo URL
            </label>

            <input
              id="experience-logo-url"
              name="organizationLogoUrl"
              type="url"
              value={formValues.organizationLogoUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://example.com/logo.png"
              aria-invalid={Boolean(getFieldError("organizationLogoUrl"))}
              className={inputClasses}
            />

            <ExperienceFieldError
              message={getFieldError("organizationLogoUrl")}
            />
          </div>

          {formValues.organizationLogoUrl && (
            <div className="md:col-span-2">
              <p className="text-sm font-semibold text-slate-700">
                Logo Preview
              </p>

              <div className="mt-3 flex min-h-32 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <img
                  src={formValues.organizationLogoUrl}
                  alt="Organization logo preview"
                  className="max-h-24 max-w-full object-contain"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              </div>
            </div>
          )}
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
              htmlFor="experience-order"
              className="text-sm font-semibold text-slate-700"
            >
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
                  Show this Experience record on public pages and sections.
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
                  Featured Experience
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Prioritise this record on the homepage and public timeline.
                </span>
              </span>
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/experience"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-7 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving Experience..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default ExperienceForm;
