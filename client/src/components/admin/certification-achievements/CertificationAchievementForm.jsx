import { useMemo, useState } from "react";
import { Link } from "react-router";

import MediaField from "../media/MediaField";
import {
  certificationAchievementTypeLabels,
  certificationAchievementTypes,
  createCertificationAchievementDefaultSlug,
  createCertificationAchievementPayload,
  createCertificationAchievementSlug,
  defaultCertificationAchievementFormValues,
  issuerRequiredTypes,
  validateCertificationAchievementFormValues,
} from "../../../utils/certificationAchievementForm";

const inputClasses =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

function CertificationAchievementFieldError({ id, message }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="mt-2 text-sm font-semibold text-red-600">
      {message}
    </p>
  );
}

function createEducationOptionLabel(record) {
  if (!record) {
    return "Education record";
  }

  return [record.degree, record.fieldOfStudy, record.institutionName]
    .filter(Boolean)
    .join(" — ");
}

function createExperienceOptionLabel(record) {
  if (!record) {
    return "Experience record";
  }

  return [record.jobTitle, record.organizationName]
    .filter(Boolean)
    .join(" — ");
}

function CertificationAchievementForm({
  initialValues = defaultCertificationAchievementFormValues,
  onSubmit,
  submitLabel = "Save Record",
  accessToken = "",
  educationOptions = [],
  experienceOptions = [],
  onMediaUnauthorized,
}) {
  const [formValues, setFormValues] = useState(() => ({
    ...defaultCertificationAchievementFormValues,
    ...initialValues,
  }));
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(
    Boolean(initialValues.slug),
  );
  const [localErrors, setLocalErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issuerIsRequired = issuerRequiredTypes.has(formValues.type);

  const sortedEducationOptions = useMemo(
    () =>
      [...educationOptions].sort((left, right) =>
        createEducationOptionLabel(left).localeCompare(
          createEducationOptionLabel(right),
        ),
      ),
    [educationOptions],
  );

  const sortedExperienceOptions = useMemo(
    () =>
      [...experienceOptions].sort((left, right) =>
        createExperienceOptionLabel(left).localeCompare(
          createExperienceOptionLabel(right),
        ),
      ),
    [experienceOptions],
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

  function getErrorId(fieldName) {
    return `certification-achievement-${fieldName}-error`;
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

  function handleInputChange(event, selectedMedia = null) {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setFormValues((currentValues) => {
      const updatedValues = {
        ...currentValues,
        [name]: nextValue,
      };

      if (name === "doesNotExpire" && checked) {
        updatedValues.expirationDate = "";
      }

      if (
        ["title", "issuerName", "issueDate"].includes(name) &&
        !isSlugManuallyEdited
      ) {
        updatedValues.slug =
          createCertificationAchievementDefaultSlug(updatedValues);
      }

      if (
        name === "mediaUrl" &&
        selectedMedia?.altText &&
        !String(currentValues.mediaAlt || "").trim()
      ) {
        updatedValues.mediaAlt = selectedMedia.altText;
      }

      return updatedValues;
    });

    if (name === "slug") {
      setIsSlugManuallyEdited(Boolean(value.trim()));
    }

    clearFieldErrors(name);

    if (name === "doesNotExpire") {
      clearFieldErrors("expirationDate");
    }

    if (name === "mediaUrl" && selectedMedia?.altText) {
      clearFieldErrors("mediaAlt");
    }

    setSubmitError("");
  }

  function handleSlugBlur() {
    setFormValues((currentValues) => ({
      ...currentValues,
      slug:
        createCertificationAchievementSlug(currentValues.slug) ||
        createCertificationAchievementDefaultSlug(currentValues),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors =
      validateCertificationAchievementFormValues(formValues);

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
      await onSubmit(createCertificationAchievementPayload(formValues));
    } catch (error) {
      const fieldErrors =
        error?.fieldErrors &&
        typeof error.fieldErrors === "object" &&
        !Array.isArray(error.fieldErrors)
          ? error.fieldErrors
          : {};

      setServerErrors(fieldErrors);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Certification / Achievement could not be saved.",
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
          Record Identity
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Certification, License, Award or Achievement
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Create an independently publishable professional credential or
          achievement without duplicating Education or Experience content.
        </p>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="certification-achievement-type"
              className="text-sm font-semibold text-slate-700"
            >
              Type <span className="text-red-600">*</span>
            </label>

            <select
              id="certification-achievement-type"
              name="type"
              value={formValues.type}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("type"))}
              aria-describedby={
                getFieldError("type") ? getErrorId("type") : undefined
              }
              className={inputClasses}
            >
              {certificationAchievementTypes.map((recordType) => (
                <option key={recordType} value={recordType}>
                  {certificationAchievementTypeLabels[recordType] ||
                    recordType}
                </option>
              ))}
            </select>

            <CertificationAchievementFieldError
              id={getErrorId("type")}
              message={getFieldError("type")}
            />
          </div>

          <div>
            <label
              htmlFor="certification-achievement-title"
              className="text-sm font-semibold text-slate-700"
            >
              Title <span className="text-red-600">*</span>
            </label>

            <input
              id="certification-achievement-title"
              name="title"
              type="text"
              value={formValues.title}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="MongoDB Associate Developer"
              aria-invalid={Boolean(getFieldError("title"))}
              aria-describedby={
                getFieldError("title") ? getErrorId("title") : undefined
              }
              className={inputClasses}
            />

            <CertificationAchievementFieldError
              id={getErrorId("title")}
              message={getFieldError("title")}
            />
          </div>

          <div>
            <label
              htmlFor="certification-achievement-issuer"
              className="text-sm font-semibold text-slate-700"
            >
              Issuer / Organization{" "}
              {issuerIsRequired && <span className="text-red-600">*</span>}
            </label>

            <input
              id="certification-achievement-issuer"
              name="issuerName"
              type="text"
              value={formValues.issuerName}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="MongoDB"
              aria-invalid={Boolean(getFieldError("issuerName"))}
              aria-describedby={
                getFieldError("issuerName")
                  ? getErrorId("issuerName")
                  : undefined
              }
              className={inputClasses}
            />

            <CertificationAchievementFieldError
              id={getErrorId("issuerName")}
              message={getFieldError("issuerName")}
            />
          </div>

          <div>
            <label
              htmlFor="certification-achievement-slug"
              className="text-sm font-semibold text-slate-700"
            >
              URL Slug <span className="text-red-600">*</span>
            </label>

            <input
              id="certification-achievement-slug"
              name="slug"
              type="text"
              value={formValues.slug}
              onChange={handleInputChange}
              onBlur={handleSlugBlur}
              disabled={isSubmitting}
              placeholder="mongodb-associate-developer-mongodb-2026-08-09"
              aria-invalid={Boolean(getFieldError("slug"))}
              aria-describedby={
                getFieldError("slug") ? getErrorId("slug") : undefined
              }
              className={inputClasses}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Automatically generated from title, issuer and issue date until
              manually edited.
            </p>

            <CertificationAchievementFieldError
              id={getErrorId("slug")}
              message={getFieldError("slug")}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Timeline
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Issue and Expiration Dates
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="certification-achievement-issue-date"
              className="text-sm font-semibold text-slate-700"
            >
              Issue Date <span className="text-red-600">*</span>
            </label>

            <input
              id="certification-achievement-issue-date"
              name="issueDate"
              type="date"
              value={formValues.issueDate}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("issueDate"))}
              aria-describedby={
                getFieldError("issueDate")
                  ? getErrorId("issueDate")
                  : undefined
              }
              className={inputClasses}
            />

            <CertificationAchievementFieldError
              id={getErrorId("issueDate")}
              message={getFieldError("issueDate")}
            />
          </div>

          <div>
            <label
              htmlFor="certification-achievement-expiration-date"
              className="text-sm font-semibold text-slate-700"
            >
              Expiration Date
            </label>

            <input
              id="certification-achievement-expiration-date"
              name="expirationDate"
              type="date"
              value={formValues.expirationDate}
              onChange={handleInputChange}
              disabled={isSubmitting || formValues.doesNotExpire}
              aria-invalid={Boolean(getFieldError("expirationDate"))}
              aria-describedby={
                getFieldError("expirationDate")
                  ? getErrorId("expirationDate")
                  : undefined
              }
              className={inputClasses}
            />

            <CertificationAchievementFieldError
              id={getErrorId("expirationDate")}
              message={getFieldError("expirationDate")}
            />
          </div>

          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                name="doesNotExpire"
                type="checkbox"
                checked={formValues.doesNotExpire}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="mt-1 size-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />

              <span>
                <span className="block font-semibold text-slate-800">
                  This credential does not expire
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Expiration date will be cleared when this option is enabled.
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
          Description and Credential Details
        </h2>

        <div className="mt-7 space-y-6">
          <div>
            <label
              htmlFor="certification-achievement-short-description"
              className="text-sm font-semibold text-slate-700"
            >
              Short Description <span className="text-red-600">*</span>
            </label>

            <textarea
              id="certification-achievement-short-description"
              name="shortDescription"
              rows="4"
              value={formValues.shortDescription}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Briefly explain what this credential or achievement validates."
              aria-invalid={Boolean(getFieldError("shortDescription"))}
              aria-describedby={
                getFieldError("shortDescription")
                  ? getErrorId("shortDescription")
                  : undefined
              }
              className={`${inputClasses} py-3`}
            />

            <CertificationAchievementFieldError
              id={getErrorId("shortDescription")}
              message={getFieldError("shortDescription")}
            />
          </div>

          <div>
            <label
              htmlFor="certification-achievement-description"
              className="text-sm font-semibold text-slate-700"
            >
              Full Description
            </label>

            <textarea
              id="certification-achievement-description"
              name="description"
              rows="7"
              value={formValues.description}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Add useful context, scope, skills demonstrated or why this achievement matters."
              aria-invalid={Boolean(getFieldError("description"))}
              aria-describedby={
                getFieldError("description")
                  ? getErrorId("description")
                  : undefined
              }
              className={`${inputClasses} py-3`}
            />

            <CertificationAchievementFieldError
              id={getErrorId("description")}
              message={getFieldError("description")}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="certification-achievement-credential-id"
                className="text-sm font-semibold text-slate-700"
              >
                Credential ID
              </label>

              <input
                id="certification-achievement-credential-id"
                name="credentialId"
                type="text"
                value={formValues.credentialId}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="ABC-123456"
                aria-invalid={Boolean(getFieldError("credentialId"))}
                aria-describedby={
                  getFieldError("credentialId")
                    ? getErrorId("credentialId")
                    : undefined
                }
                className={inputClasses}
              />

              <CertificationAchievementFieldError
                id={getErrorId("credentialId")}
                message={getFieldError("credentialId")}
              />
            </div>

            <div>
              <label
                htmlFor="certification-achievement-verification-url"
                className="text-sm font-semibold text-slate-700"
              >
                Verification URL
              </label>

              <input
                id="certification-achievement-verification-url"
                name="verificationUrl"
                type="url"
                value={formValues.verificationUrl}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="https://issuer.example/verify/ABC-123456"
                aria-invalid={Boolean(getFieldError("verificationUrl"))}
                aria-describedby={
                  getFieldError("verificationUrl")
                    ? getErrorId("verificationUrl")
                    : undefined
                }
                className={inputClasses}
              />

              <CertificationAchievementFieldError
                id={getErrorId("verificationUrl")}
                message={getFieldError("verificationUrl")}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Evidence Media
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Certificate, Badge or Award Evidence
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Use the Media Library or keep a manual external URL. PDFs remain
          links rather than inline images.
        </p>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <MediaField
            id="certification-achievement-media-url"
            name="mediaUrl"
            label="Media URL"
            value={formValues.mediaUrl}
            onChange={handleInputChange}
            accessToken={accessToken}
            allowedTypes={["document", "image", "svg"]}
            pickerTitle="Choose Certification / Achievement Media"
            placeholder="https://..."
            helpText="Compatible Media Library types: document, image and SVG."
            error={getFieldError("mediaUrl")}
            disabled={isSubmitting}
            onUnauthorized={onMediaUnauthorized}
          />

          <div>
            <label
              htmlFor="certification-achievement-media-alt"
              className="text-sm font-semibold text-slate-700"
            >
              Media Alt Text
            </label>

            <input
              id="certification-achievement-media-alt"
              name="mediaAlt"
              type="text"
              value={formValues.mediaAlt}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="MongoDB Associate Developer certificate"
              aria-invalid={Boolean(getFieldError("mediaAlt"))}
              aria-describedby={
                getFieldError("mediaAlt")
                  ? getErrorId("mediaAlt")
                  : undefined
              }
              className={inputClasses}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Media Library alt text fills this only when the field is blank.
            </p>

            <CertificationAchievementFieldError
              id={getErrorId("mediaAlt")}
              message={getFieldError("mediaAlt")}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Optional Relations
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Link Existing Education or Experience
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Relations provide context only. They do not copy or synchronize
          Education certificates or Experience achievement bullets.
        </p>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="certification-achievement-related-education"
              className="text-sm font-semibold text-slate-700"
            >
              Related Education
            </label>

            <select
              id="certification-achievement-related-education"
              name="relatedEducation"
              value={formValues.relatedEducation}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("relatedEducation"))}
              aria-describedby={
                getFieldError("relatedEducation")
                  ? getErrorId("relatedEducation")
                  : undefined
              }
              className={inputClasses}
            >
              <option value="">No related Education record</option>

              {sortedEducationOptions.map((education) => (
                <option key={education._id} value={education._id}>
                  {createEducationOptionLabel(education)}
                </option>
              ))}
            </select>

            <CertificationAchievementFieldError
              id={getErrorId("relatedEducation")}
              message={getFieldError("relatedEducation")}
            />
          </div>

          <div>
            <label
              htmlFor="certification-achievement-related-experience"
              className="text-sm font-semibold text-slate-700"
            >
              Related Experience
            </label>

            <select
              id="certification-achievement-related-experience"
              name="relatedExperience"
              value={formValues.relatedExperience}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("relatedExperience"))}
              aria-describedby={
                getFieldError("relatedExperience")
                  ? getErrorId("relatedExperience")
                  : undefined
              }
              className={inputClasses}
            >
              <option value="">No related Experience record</option>

              {sortedExperienceOptions.map((experience) => (
                <option key={experience._id} value={experience._id}>
                  {createExperienceOptionLabel(experience)}
                </option>
              ))}
            </select>

            <CertificationAchievementFieldError
              id={getErrorId("relatedExperience")}
              message={getFieldError("relatedExperience")}
            />
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
              htmlFor="certification-achievement-order"
              className="text-sm font-semibold text-slate-700"
            >
              Display Order
            </label>

            <input
              id="certification-achievement-order"
              name="order"
              type="number"
              min="0"
              max="1000000"
              step="1"
              value={formValues.order}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("order"))}
              aria-describedby={
                getFieldError("order") ? getErrorId("order") : undefined
              }
              className={inputClasses}
            />

            <CertificationAchievementFieldError
              id={getErrorId("order")}
              message={getFieldError("order")}
            />
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
                  Include this record in the public Certifications &
                  Achievements experience.
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
                  Featured Record
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Prioritize this record in the future homepage preview.
                </span>
              </span>
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/achievements"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-7 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default CertificationAchievementForm;
