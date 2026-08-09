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
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const textareaClasses =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

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

  return <p className="mt-2 text-sm font-medium text-red-600">{message}</p>;
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
          Education Identity
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Institution and Qualification
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Add the institution, qualification, study field and public URL slug.
        </p>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="education-institution-name"
              className="text-sm font-semibold text-slate-700"
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

          <div>
            <label
              htmlFor="education-slug"
              className="text-sm font-semibold text-slate-700"
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

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Automatically generated until manually edited.
            </p>

            <EducationFieldError message={getFieldError("slug")} />
          </div>

          <div>
            <label
              htmlFor="education-degree"
              className="text-sm font-semibold text-slate-700"
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
              className="text-sm font-semibold text-slate-700"
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
              className="text-sm font-semibold text-slate-700"
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
              className="text-sm font-semibold text-slate-700"
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
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Timeline
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Study Dates and Result
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="education-start-date"
              className="text-sm font-semibold text-slate-700"
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
              className="text-sm font-semibold text-slate-700"
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
              className="text-sm font-semibold text-slate-700"
            >
              Grade, Score or Result
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

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                name="isCurrentlyStudying"
                type="checkbox"
                checked={formValues.isCurrentlyStudying}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="mt-1 size-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />

              <span>
                <span className="block font-semibold text-slate-800">
                  Currently Studying
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
          Education Description
        </h2>

        <div className="mt-7 grid gap-6">
          <div>
            <label
              htmlFor="education-short-description"
              className="text-sm font-semibold text-slate-700"
            >
              Short Description <span className="text-red-600">*</span>
            </label>

            <textarea
              id="education-short-description"
              name="shortDescription"
              value={formValues.shortDescription}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={5}
              maxLength={600}
              placeholder="Summarise the qualification, core subjects and professional value."
              aria-invalid={Boolean(getFieldError("shortDescription"))}
              className={textareaClasses}
            />

            <div className="mt-2 flex justify-between gap-4 text-xs text-slate-500">
              <span>Minimum 10 characters</span>
              <span>
                {String(formValues.shortDescription || "").length}/600
              </span>
            </div>

            <EducationFieldError
              message={getFieldError("shortDescription")}
            />
          </div>

          <div>
            <label
              htmlFor="education-description"
              className="text-sm font-semibold text-slate-700"
            >
              Detailed Description
            </label>

            <textarea
              id="education-description"
              name="description"
              value={formValues.description}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={9}
              maxLength={5000}
              placeholder="Add subjects, achievements, activities and other useful details."
              aria-invalid={Boolean(getFieldError("description"))}
              className={textareaClasses}
            />

            <div className="mt-2 text-right text-xs text-slate-500">
              {String(formValues.description || "").length}/5000
            </div>

            <EducationFieldError message={getFieldError("description")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Supporting Links
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Institution, Certificate and Logo
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="education-institution-url"
              className="text-sm font-semibold text-slate-700"
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
            helpText="Paste an external certificate URL or choose a PDF/image/SVG from the Media Library."
            error={getFieldError("certificateUrl")}
            disabled={isSubmitting}
            onUnauthorized={onMediaUnauthorized}
          />

          <div className="md:col-span-2">
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
              helpText="Paste an external logo URL or choose an image/SVG from the Media Library."
              error={getFieldError("logoUrl")}
              disabled={isSubmitting}
              onUnauthorized={onMediaUnauthorized}
            />

            {formValues.logoUrl && (
              <div className="mt-4 flex min-h-32 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <img
                  src={formValues.logoUrl}
                  alt="Institution logo preview"
                  className="max-h-24 max-w-full object-contain"
                />
              </div>
            )}
          </div>
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
              htmlFor="education-order"
              className="text-sm font-semibold text-slate-700"
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
                  Show this Education record on public pages and sections.
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
                  Featured Education
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
          to="/admin/education"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-7 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving Education..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default EducationForm;
