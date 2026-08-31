import { useMemo, useState } from "react";
import { Link } from "react-router";

import MediaField from "../media/MediaField";

import {
  createTestimonialPayload,
  defaultTestimonialFormValues,
  testimonialRatings,
  validateTestimonialFormValues,
} from "../../../utils/testimonialForm";

const inputClasses =
  "mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm";

const textareaClasses =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm";

function TestimonialFieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">{message}</p>;
}

function getProjectLabel(project) {
  return (
    project?.title ||
    project?.name ||
    project?.slug ||
    project?._id ||
    "Untitled Project"
  );
}

function TestimonialForm({
  initialValues = defaultTestimonialFormValues,
  onSubmit,
  submitLabel = "Save Testimonial",
  projectOptions = [],
  areProjectsLoading = false,
  accessToken = "",
  onMediaUnauthorized,
}) {
  const [formValues, setFormValues] = useState(initialValues);
  const [localErrors, setLocalErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSelectedProjectOption = useMemo(
    () =>
      !formValues.relatedProject ||
      projectOptions.some(
        (project) => String(project?._id || "") === formValues.relatedProject,
      ),
    [formValues.relatedProject, projectOptions],
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

  function handleInputChange(event, selectedMedia = null) {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    const shouldPopulateProfileImageAlt =
      name === "profileImageUrl" &&
      Boolean(String(selectedMedia?.altText || "").trim()) &&
      !String(formValues.profileImageAlt || "").trim();

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: nextValue,
      ...(shouldPopulateProfileImageAlt
        ? {
            profileImageAlt: String(selectedMedia.altText).trim(),
          }
        : {}),
    }));

    clearFieldErrors(
      name,
      ...(shouldPopulateProfileImageAlt ? ["profileImageAlt"] : []),
    );
    setSubmitError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateTestimonialFormValues(formValues);

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

      const payload = createTestimonialPayload(formValues);

      await onSubmit(payload);
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
          : "Testimonial could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const labelClasses =
    "text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rnx-admin-testimonial-form-v497 space-y-2"
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
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300 sm:text-[10px]">
            Testimonial Details
          </p>

          <h2 className="mt-0.5 text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">
            Client Identity, Review and Rating
          </h2>
        </div>

        <div className="mt-2 grid gap-x-3 gap-y-2 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="testimonial-client-name" className={labelClasses}>
              Client Name <span className="text-red-600">*</span>
            </label>

            <input
              id="testimonial-client-name"
              name="clientName"
              type="text"
              value={formValues.clientName}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={150}
              placeholder="Client full name"
              aria-invalid={Boolean(getFieldError("clientName"))}
              className={inputClasses}
            />

            <TestimonialFieldError message={getFieldError("clientName")} />
          </div>

          <div>
            <label htmlFor="testimonial-client-role" className={labelClasses}>
              Client Role
            </label>

            <input
              id="testimonial-client-role"
              name="clientRole"
              type="text"
              value={formValues.clientRole}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={150}
              placeholder="Founder, Manager, Developer..."
              aria-invalid={Boolean(getFieldError("clientRole"))}
              className={inputClasses}
            />

            <TestimonialFieldError message={getFieldError("clientRole")} />
          </div>

          <div>
            <label htmlFor="testimonial-company-name" className={labelClasses}>
              Company Name
            </label>

            <input
              id="testimonial-company-name"
              name="companyName"
              type="text"
              value={formValues.companyName}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={180}
              placeholder="Company or organization"
              aria-invalid={Boolean(getFieldError("companyName"))}
              className={inputClasses}
            />

            <TestimonialFieldError message={getFieldError("companyName")} />
          </div>

          <div>
            <label htmlFor="testimonial-rating" className={labelClasses}>
              Rating <span className="text-red-600">*</span>
            </label>

            <select
              id="testimonial-rating"
              name="rating"
              value={formValues.rating}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("rating"))}
              className={inputClasses}
            >
              {testimonialRatings.map((rating) => (
                <option key={rating} value={String(rating)}>
                  {rating} {rating === 1 ? "star" : "stars"}
                </option>
              ))}
            </select>

            <TestimonialFieldError message={getFieldError("rating")} />
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <label htmlFor="testimonial-review-text" className={labelClasses}>
              Review Text <span className="text-red-600">*</span>
            </label>

            <textarea
              id="testimonial-review-text"
              name="reviewText"
              value={formValues.reviewText}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={3000}
              rows={4}
              placeholder="Write the client's testimonial..."
              aria-invalid={Boolean(getFieldError("reviewText"))}
              className={textareaClasses}
            />

            <div className="mt-0.5 flex items-center justify-between gap-2 text-[8px] text-slate-400 sm:text-[9px]">
              <span>Minimum 10 characters.</span>
              <span>{formValues.reviewText.length}/3000</span>
            </div>

            <TestimonialFieldError message={getFieldError("reviewText")} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300 sm:text-[10px]">
            Media & Publishing
          </p>

          <h2 className="mt-0.5 text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">
            Profile Image, Relations and Visibility
          </h2>
        </div>

        <div className="mt-2 grid gap-2 xl:grid-cols-2 xl:items-start">
          <div className="space-y-2">
            <MediaField
              id="testimonial-profile-image"
              name="profileImageUrl"
              label="Profile Image URL"
              value={formValues.profileImageUrl}
              onChange={handleInputChange}
              accessToken={accessToken}
              allowedTypes={["image", "svg"]}
              pickerTitle="Choose Client Profile Image"
              placeholder="https://example.com/client.jpg"
              helpText="Paste a URL or choose an image/SVG from Media Library."
              error={getFieldError("profileImageUrl")}
              disabled={isSubmitting}
              onUnauthorized={onMediaUnauthorized}
            />

            <div>
              <label
                htmlFor="testimonial-profile-image-alt"
                className={labelClasses}
              >
                Profile Image Alt Text
              </label>

              <input
                id="testimonial-profile-image-alt"
                name="profileImageAlt"
                type="text"
                value={formValues.profileImageAlt}
                onChange={handleInputChange}
                disabled={isSubmitting}
                maxLength={200}
                placeholder="Portrait of client"
                aria-invalid={Boolean(getFieldError("profileImageAlt"))}
                className={inputClasses}
              />

              <TestimonialFieldError
                message={getFieldError("profileImageAlt")}
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label
                htmlFor="testimonial-company-website"
                className={labelClasses}
              >
                Company Website
              </label>

              <input
                id="testimonial-company-website"
                name="companyWebsiteUrl"
                type="url"
                value={formValues.companyWebsiteUrl}
                onChange={handleInputChange}
                disabled={isSubmitting}
                maxLength={500}
                placeholder="https://example.com"
                aria-invalid={Boolean(getFieldError("companyWebsiteUrl"))}
                className={inputClasses}
              />

              <TestimonialFieldError
                message={getFieldError("companyWebsiteUrl")}
              />
            </div>

            <div>
              <label
                htmlFor="testimonial-related-project"
                className={labelClasses}
              >
                Related Project
              </label>

              <select
                id="testimonial-related-project"
                name="relatedProject"
                value={formValues.relatedProject}
                onChange={handleInputChange}
                disabled={isSubmitting || areProjectsLoading}
                aria-invalid={Boolean(getFieldError("relatedProject"))}
                className={inputClasses}
              >
                <option value="">
                  {areProjectsLoading
                    ? "Loading Projects..."
                    : "No related Project"}
                </option>

                {!hasSelectedProjectOption && formValues.relatedProject && (
                  <option value={formValues.relatedProject}>
                    Current related Project
                  </option>
                )}

                {projectOptions.map((project) => (
                  <option key={project._id} value={project._id}>
                    {getProjectLabel(project)}
                  </option>
                ))}
              </select>

              <TestimonialFieldError
                message={getFieldError("relatedProject")}
              />
            </div>

            <div>
              <label htmlFor="testimonial-order" className={labelClasses}>
                Display Order <span className="text-red-600">*</span>
              </label>

              <input
                id="testimonial-order"
                name="order"
                type="number"
                min="0"
                step="any"
                value={formValues.order}
                onChange={handleInputChange}
                disabled={isSubmitting}
                aria-invalid={Boolean(getFieldError("order"))}
                className={inputClasses}
              />

              <TestimonialFieldError message={getFieldError("order")} />
            </div>

            <div className="grid gap-1.5 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950/60">
                <input
                  name="isVisible"
                  type="checkbox"
                  checked={formValues.isVisible}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 dark:border-slate-600 dark:bg-slate-900"
                />

                <span>
                  <span className="block text-[10px] font-semibold text-slate-800 dark:text-slate-200">
                    Visible
                  </span>

                  <span className="mt-0.5 block text-[8px] leading-3 text-slate-500 dark:text-slate-400">
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

                <span>
                  <span className="block text-[10px] font-semibold text-slate-800 dark:text-slate-200">
                    Featured
                  </span>

                  <span className="mt-0.5 block text-[8px] leading-3 text-slate-500 dark:text-slate-400">
                    Prioritize it.
                  </span>
                </span>
              </label>

              <TestimonialFieldError message={getFieldError("isVisible")} />
              <TestimonialFieldError message={getFieldError("isFeatured")} />
            </div>
          </div>
        </div>
      </section>

      <div className="sticky bottom-2 z-20 flex flex-col-reverse gap-1.5 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/testimonials"
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-[11px] font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-4 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:px-5 sm:text-xs"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default TestimonialForm;
