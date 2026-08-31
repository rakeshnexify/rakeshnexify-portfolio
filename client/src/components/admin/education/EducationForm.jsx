import { useState } from "react";
import { Link } from "react-router";

import MediaField from "../media/MediaField";

import {
  createEducationDefaultSlug,
  createEducationPayload,
  createEducationSlug,
  defaultEducationFormValues,
  educationTypes,
  validateEducationFormValues,
} from "../../../utils/educationForm";

const inputClasses =
  "mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm";

const textareaClasses =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm";

const educationTypeLabels = {
  school: "School",
  college: "College",
  university: "University",
  course: "Course",
  training: "Training",
  certification: "Certification",
  other: "Other",
};

function EducationFieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">{message}</p>;
}

function EducationForm({
  initialValues = defaultEducationFormValues,
  onSubmit,
  submitLabel = "Save Education",
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

      if (name === "isCurrentlyStudying" && checked) {
        updatedValues.endDate = "";
      }

      if (
        ["institutionName", "degree", "fieldOfStudy", "startDate"].includes(
          name,
        ) &&
        !isSlugManuallyEdited
      ) {
        updatedValues.slug = createEducationDefaultSlug(updatedValues);
      }

      return updatedValues;
    });

    if (name === "slug") {
      setIsSlugManuallyEdited(Boolean(value.trim()));
    }

    clearFieldErrors(name);

    if (name === "isCurrentlyStudying") {
      clearFieldErrors("endDate");
    }

    setSubmitError("");
  }

  function handleSlugBlur() {
    setFormValues((currentValues) => ({
      ...currentValues,
      slug:
        createEducationSlug(currentValues.slug) ||
        createEducationDefaultSlug(currentValues),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateEducationFormValues(formValues);

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

      await onSubmit(createEducationPayload(formValues));
    } catch (error) {
      const fieldErrors =
        error?.fieldErrors && typeof error.fieldErrors === "object"
          ? error.fieldErrors
          : {};

      setServerErrors(fieldErrors);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Education record could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rnx-admin-education-form-v476 space-y-2"
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
            Education Details
          </p>

          <h2 className="mt-0.5 text-[13px] font-bold text-slate-950 dark:text-white sm:text-sm">
            Qualification and Timeline
          </h2>
        </div>

        <div className="mt-2 grid gap-x-3 gap-y-2 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label
              htmlFor="education-institution-name"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Institution Name <span className="text-red-600">*</span>
            </label>

            <input
              id="education-institution-name"
              name="institutionName"
              type="text"
              value={formValues.institutionName}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={180}
              placeholder="Tribhuvan University"
              aria-invalid={Boolean(getFieldError("institutionName"))}
              className={inputClasses}
            />

            <EducationFieldError message={getFieldError("institutionName")} />
          </div>

          <div className="xl:col-span-2">
            <label
              htmlFor="education-slug"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              URL Slug <span className="text-red-600">*</span>
            </label>

            <input
              id="education-slug"
              name="slug"
              type="text"
              value={formValues.slug}
              onChange={handleInputChange}
              onBlur={handleSlugBlur}
              disabled={isSubmitting}
              maxLength={220}
              placeholder="tribhuvan-university-bachelor-computer-science-2022"
              aria-invalid={Boolean(getFieldError("slug"))}
              className={inputClasses}
            />

            <EducationFieldError message={getFieldError("slug")} />
          </div>

          <div className="xl:col-span-2">
            <label
              htmlFor="education-degree"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Degree or Qualification <span className="text-red-600">*</span>
            </label>

            <input
              id="education-degree"
              name="degree"
              type="text"
              value={formValues.degree}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={180}
              placeholder="Bachelor of Computer Applications"
              aria-invalid={Boolean(getFieldError("degree"))}
              className={inputClasses}
            />

            <EducationFieldError message={getFieldError("degree")} />
          </div>

          <div>
            <label
              htmlFor="education-field-of-study"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Field of Study <span className="text-red-600">*</span>
            </label>

            <input
              id="education-field-of-study"
              name="fieldOfStudy"
              type="text"
              value={formValues.fieldOfStudy}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={180}
              placeholder="Computer Science"
              aria-invalid={Boolean(getFieldError("fieldOfStudy"))}
              className={inputClasses}
            />

            <EducationFieldError message={getFieldError("fieldOfStudy")} />
          </div>

          <div>
            <label
              htmlFor="education-type"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Education Type <span className="text-red-600">*</span>
            </label>

            <select
              id="education-type"
              name="educationType"
              value={formValues.educationType}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("educationType"))}
              className={inputClasses}
            >
              {educationTypes.map((educationType) => (
                <option key={educationType} value={educationType}>
                  {educationTypeLabels[educationType] || educationType}
                </option>
              ))}
            </select>

            <EducationFieldError message={getFieldError("educationType")} />
          </div>

          <div>
            <label
              htmlFor="education-location"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Location
            </label>

            <input
              id="education-location"
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

            <EducationFieldError message={getFieldError("location")} />
          </div>

          <div>
            <label
              htmlFor="education-start-date"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Start Date <span className="text-red-600">*</span>
            </label>

            <input
              id="education-start-date"
              name="startDate"
              type="date"
              value={formValues.startDate}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("startDate"))}
              className={inputClasses}
            />

            <EducationFieldError message={getFieldError("startDate")} />
          </div>

          <div>
            <label
              htmlFor="education-end-date"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              End Date
            </label>

            <input
              id="education-end-date"
              name="endDate"
              type="date"
              value={formValues.endDate}
              onChange={handleInputChange}
              disabled={isSubmitting || formValues.isCurrentlyStudying}
              aria-invalid={Boolean(getFieldError("endDate"))}
              className={inputClasses}
            />

            <EducationFieldError message={getFieldError("endDate")} />
          </div>

          <div>
            <label
              htmlFor="education-grade"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Grade / Result
            </label>

            <input
              id="education-grade"
              name="grade"
              type="text"
              value={formValues.grade}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={100}
              placeholder="First Division, 3.6 GPA or 82%"
              aria-invalid={Boolean(getFieldError("grade"))}
              className={inputClasses}
            />

            <EducationFieldError message={getFieldError("grade")} />
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950/60 md:col-span-2 xl:col-span-1">
            <input
              name="isCurrentlyStudying"
              type="checkbox"
              checked={formValues.isCurrentlyStudying}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900"
            />

            <span className="min-w-0">
              <span className="block text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                Currently Studying
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
            Public Content, Media and Visibility
          </h2>
        </div>

        <div className="mt-2 grid gap-2 xl:grid-cols-2 xl:items-start">
          <div className="space-y-2">
            <div>
              <label
                htmlFor="education-short-description"
                className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
              >
                Short Description
              </label>

              <textarea
                id="education-short-description"
                name="shortDescription"
                value={formValues.shortDescription}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={2}
                maxLength={600}
                placeholder="Summarise the qualification and professional value."
                aria-invalid={Boolean(getFieldError("shortDescription"))}
                className={textareaClasses}
              />

              <div className="mt-0.5 flex justify-between gap-3 text-[9px] text-slate-500 dark:text-slate-400 sm:text-[10px]">
                <span>Optional</span>
                <span>{String(formValues.shortDescription || "").length}/600</span>
              </div>

              <EducationFieldError message={getFieldError("shortDescription")} />
            </div>

            <div>
              <label
                htmlFor="education-description"
                className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
              >
                Detailed Description
              </label>

              <textarea
                id="education-description"
                name="description"
                value={formValues.description}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={3}
                maxLength={5000}
                placeholder="Subjects, achievements, activities and useful details."
                aria-invalid={Boolean(getFieldError("description"))}
                className={textareaClasses}
              />

              <div className="mt-0.5 text-right text-[9px] text-slate-500 dark:text-slate-400 sm:text-[10px]">
                {String(formValues.description || "").length}/5000
              </div>

              <EducationFieldError message={getFieldError("description")} />
            </div>

            <div>
              <label
                htmlFor="education-institution-url"
                className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
              >
                Institution Website URL
              </label>

              <input
                id="education-institution-url"
                name="institutionUrl"
                type="url"
                value={formValues.institutionUrl}
                onChange={handleInputChange}
                disabled={isSubmitting}
                maxLength={500}
                placeholder="https://example.edu"
                aria-invalid={Boolean(getFieldError("institutionUrl"))}
                className={inputClasses}
              />

              <EducationFieldError message={getFieldError("institutionUrl")} />
            </div>
          </div>

          <div className="space-y-2">
            <MediaField
              id="education-certificate-url"
              name="certificateUrl"
              label="Certificate URL"
              value={formValues.certificateUrl}
              onChange={handleInputChange}
              accessToken={accessToken}
              allowedTypes={["document", "image", "svg"]}
              pickerTitle="Choose Education Certificate"
              placeholder="https://example.com/certificate"
              helpText="Paste a URL or choose from Media Library."
              error={getFieldError("certificateUrl")}
              disabled={isSubmitting}
              onUnauthorized={onMediaUnauthorized}
            />

            <div>
              <MediaField
                id="education-logo-url"
                name="logoUrl"
                label="Institution Logo URL"
                value={formValues.logoUrl}
                onChange={handleInputChange}
                accessToken={accessToken}
                allowedTypes={["image", "svg"]}
                pickerTitle="Choose Institution Logo"
                placeholder="https://example.edu/logo.png"
                helpText="Paste a URL or choose from Media Library."
                error={getFieldError("logoUrl")}
                disabled={isSubmitting}
                onUnauthorized={onMediaUnauthorized}
              />

              {formValues.logoUrl && (
                <div className="mt-1 flex h-10 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950/60">
                  <img
                    src={formValues.logoUrl}
                    alt="Institution logo preview"
                    className="max-h-8 max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <div>
            <label
              htmlFor="education-order"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Display Order
            </label>

            <input
              id="education-order"
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

            <EducationFieldError message={getFieldError("order")} />
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
                Show on public Education pages.
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
                Featured Education
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
          to="/admin/education"
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-[11px] font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-4 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:px-5 sm:text-xs"
        >
          {isSubmitting ? "Saving Education..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default EducationForm;
