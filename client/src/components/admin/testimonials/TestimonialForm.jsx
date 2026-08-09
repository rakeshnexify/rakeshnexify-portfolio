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
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const textareaClasses =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

function TestimonialFieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm font-medium text-red-600">{message}</p>;
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
          Client Identity
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Client and Company Details
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Add the client identity and optional professional or company context.
        </p>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="testimonial-client-name"
              className="text-sm font-semibold text-slate-700"
            >
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
            <label
              htmlFor="testimonial-client-role"
              className="text-sm font-semibold text-slate-700"
            >
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
            <label
              htmlFor="testimonial-company-name"
              className="text-sm font-semibold text-slate-700"
            >
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
            <label
              htmlFor="testimonial-company-website"
              className="text-sm font-semibold text-slate-700"
            >
              Company Website URL
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
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Testimonial Content
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Review and Rating
        </h2>

        <div className="mt-7 grid gap-6">
          <div>
            <label
              htmlFor="testimonial-review-text"
              className="text-sm font-semibold text-slate-700"
            >
              Review Text <span className="text-red-600">*</span>
            </label>

            <textarea
              id="testimonial-review-text"
              name="reviewText"
              value={formValues.reviewText}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={3000}
              rows={8}
              placeholder="Write the client's testimonial..."
              aria-invalid={Boolean(getFieldError("reviewText"))}
              className={textareaClasses}
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>Minimum 10 characters.</span>
              <span>{formValues.reviewText.length}/3000</span>
            </div>

            <TestimonialFieldError message={getFieldError("reviewText")} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="testimonial-rating"
                className="text-sm font-semibold text-slate-700"
              >
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

            <div>
              <label
                htmlFor="testimonial-related-project"
                className="text-sm font-semibold text-slate-700"
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

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Optional relationship to an existing portfolio Project.
              </p>

              <TestimonialFieldError
                message={getFieldError("relatedProject")}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Profile Media
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Client Image
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
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
            helpText="Paste an external profile image URL or choose an image/SVG from the Media Library. Media alt text fills the profile alt field only when it is currently empty."
            error={getFieldError("profileImageUrl")}
            disabled={isSubmitting}
            onUnauthorized={onMediaUnauthorized}
          />

          <div>
            <label
              htmlFor="testimonial-profile-image-alt"
              className="text-sm font-semibold text-slate-700"
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
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Publishing Controls
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Order and Visibility
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <label
              htmlFor="testimonial-order"
              className="text-sm font-semibold text-slate-700"
            >
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
                  Show this Testimonial on public pages and sections.
                </span>
              </span>
            </label>

            <TestimonialFieldError message={getFieldError("isVisible")} />

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
                  Featured Testimonial
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Prioritise this Testimonial in public presentation.
                </span>
              </span>
            </label>

            <TestimonialFieldError message={getFieldError("isFeatured")} />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/testimonials"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-7 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving Testimonial..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default TestimonialForm;
