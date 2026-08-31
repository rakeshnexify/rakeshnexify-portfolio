import { useState } from "react";
import { Link } from "react-router";
import MediaField from "../media/MediaField";

import {
  createEmptyProjectImage,
  createEmptyProjectResult,
  createProjectPayload,
  createProjectSlug,
  defaultProjectFormValues,
} from "../../../utils/projectForm";

function validateProjectForm(formValues) {
  const errors = {};

  if (formValues.title.trim().length < 2) {
    errors.title = "Project title must contain at least 2 characters.";
  }

  const finalSlug =
    createProjectSlug(formValues.slug) || createProjectSlug(formValues.title);

  if (finalSlug.length < 2) {
    errors.slug = "Project slug must contain at least 2 characters.";
  }

  if (formValues.shortDescription.trim().length < 10) {
    errors.shortDescription =
      "Short description must contain at least 10 characters.";
  }

  const numericOrder = Number(formValues.order);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    errors.order = "Display order must be a non-negative number.";
  }

  const numericCaseStudyOrder = Number(formValues.caseStudyOrder);

  if (!Number.isFinite(numericCaseStudyOrder) || numericCaseStudyOrder < 0) {
    errors["caseStudy.order"] =
      "Case study display order must be a non-negative number.";
  }

  if (
    formValues.startedAt &&
    formValues.completedAt &&
    new Date(formValues.completedAt) < new Date(formValues.startedAt)
  ) {
    errors.completedAt = "Completion date cannot be before the start date.";
  }

  formValues.images.forEach((image, index) => {
    const hasImageData = Boolean(
      image.url.trim() || image.alt.trim() || image.caption.trim(),
    );

    if (hasImageData && !image.url.trim()) {
      errors[`images.${index}.url`] = "Screenshot URL is required.";
    }

    const imageOrder = Number(image.order);

    if (!Number.isFinite(imageOrder) || imageOrder < 0) {
      errors[`images.${index}.order`] =
        "Screenshot order must be non-negative.";
    }
  });

  formValues.results.forEach((result, index) => {
    const hasResultData = Boolean(result.label.trim() || result.value.trim());

    if (hasResultData && !result.label.trim()) {
      errors[`results.${index}.label`] = "Result label is required.";
    }

    if (hasResultData && !result.value.trim()) {
      errors[`results.${index}.value`] = "Result value is required.";
    }
  });

  return errors;
}

function ProjectFieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">{message}</p>;
}

function ProjectForm({
  initialValues = defaultProjectFormValues,
  onSubmit,
  submitLabel = "Save Project",
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

      if (name === "title" && !isSlugManuallyEdited) {
        updatedValues.slug = createProjectSlug(value);
      }

      if (name === "caseStudyIsPublished" && !checked) {
        updatedValues.caseStudyIsFeatured = false;
      }

      return updatedValues;
    });

    if (name === "slug") {
      setIsSlugManuallyEdited(Boolean(value.trim()));
    }

    clearFieldErrors(name);

    if (name.startsWith("seo")) {
      clearFieldErrors("seo");
    }

    if (
      ["liveUrl", "sourceCodeUrl", "caseStudyUrl", "videoUrl"].includes(name)
    ) {
      clearFieldErrors("links", `links.${name}`);
    }

    if (
      [
        "caseStudyIsPublished",
        "caseStudyIsFeatured",
        "caseStudyOrder",
      ].includes(name)
    ) {
      const caseStudyFieldMap = {
        caseStudyIsPublished: "caseStudy.isPublished",
        caseStudyIsFeatured: "caseStudy.isFeatured",
        caseStudyOrder: "caseStudy.order",
      };

      clearFieldErrors("caseStudy", caseStudyFieldMap[name]);
    }

    setSubmitError("");
  }

  function handleSlugBlur() {
    setFormValues((currentValues) => ({
      ...currentValues,
      slug:
        createProjectSlug(currentValues.slug) ||
        createProjectSlug(currentValues.title),
    }));
  }

  function handleImageChange(index, fieldName, value) {
    setFormValues((currentValues) => ({
      ...currentValues,

      images: currentValues.images.map((image, imageIndex) =>
        imageIndex === index
          ? {
              ...image,
              [fieldName]: value,
            }
          : image,
      ),
    }));

    clearFieldErrors("images", `images.${index}.${fieldName}`);

    setSubmitError("");
  }

  function handleAddImage() {
    setFormValues((currentValues) => ({
      ...currentValues,

      images: [
        ...currentValues.images,

        {
          ...createEmptyProjectImage(),

          order: String(currentValues.images.length),
        },
      ],
    }));
  }

  function handleRemoveImage(index) {
    setFormValues((currentValues) => ({
      ...currentValues,

      images: currentValues.images.filter(
        (_image, imageIndex) => imageIndex !== index,
      ),
    }));

    setLocalErrors({});
    setServerErrors({});
    setSubmitError("");
  }

  function handleResultChange(index, fieldName, value) {
    setFormValues((currentValues) => ({
      ...currentValues,

      results: currentValues.results.map((result, resultIndex) =>
        resultIndex === index
          ? {
              ...result,
              [fieldName]: value,
            }
          : result,
      ),
    }));

    clearFieldErrors("results", `results.${index}.${fieldName}`);

    setSubmitError("");
  }

  function handleAddResult() {
    setFormValues((currentValues) => ({
      ...currentValues,

      results: [...currentValues.results, createEmptyProjectResult()],
    }));
  }

  function handleRemoveResult(index) {
    setFormValues((currentValues) => ({
      ...currentValues,

      results: currentValues.results.filter(
        (_result, resultIndex) => resultIndex !== index,
      ),
    }));

    setLocalErrors({});
    setServerErrors({});
    setSubmitError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateProjectForm(formValues);

    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);

      setServerErrors({});

      setSubmitError("Please correct the highlighted project fields.");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setIsSubmitting(true);
      setLocalErrors({});
      setServerErrors({});
      setSubmitError("");

      await onSubmit(createProjectPayload(formValues));
    } catch (error) {
      setServerErrors(error?.fieldErrors || {});

      setSubmitError(
        error instanceof Error ? error.message : "Project could not be saved.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClasses =
    "mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm";

  const textareaClasses =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm";

  const labelClasses =
    "text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]";

  const allErrorKeys = [
    ...Object.keys(localErrors),
    ...Object.keys(serverErrors),
  ];

  const hasImageErrors = allErrorKeys.some(
    (fieldName) => fieldName === "images" || fieldName.startsWith("images."),
  );

  const hasResultErrors = allErrorKeys.some(
    (fieldName) => fieldName === "results" || fieldName.startsWith("results."),
  );

  const hasCaseStudyErrors = allErrorKeys.some(
    (fieldName) =>
      fieldName === "caseStudy" ||
      fieldName === "caseStudyOrder" ||
      fieldName.startsWith("caseStudy."),
  );

  const hasSeoErrors = allErrorKeys.some(
    (fieldName) => fieldName === "seo" || fieldName.startsWith("seo"),
  );

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rnx-admin-project-form-v492 space-y-2"
    >
      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {submitError}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300 sm:text-[10px]">
            Project Details
          </p>

          <h2 className="mt-0.5 text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">
            Identity, Timeline and Public Display
          </h2>
        </div>

        <div className="mt-2 grid gap-2 xl:grid-cols-2 xl:items-start">
          <div className="grid gap-x-3 gap-y-2 md:grid-cols-2">
            <div>
              <label htmlFor="project-title" className={labelClasses}>
                Project Title *
              </label>
              <input
                id="project-title"
                name="title"
                type="text"
                value={formValues.title}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="UniQuick Mart"
                className={inputClasses}
              />
              <ProjectFieldError message={getFieldError("title")} />
            </div>

            <div>
              <label htmlFor="project-slug" className={labelClasses}>
                URL Slug *
              </label>
              <input
                id="project-slug"
                name="slug"
                type="text"
                value={formValues.slug}
                onChange={handleInputChange}
                onBlur={handleSlugBlur}
                disabled={isSubmitting}
                placeholder="uniquick-mart"
                className={inputClasses}
              />
              <ProjectFieldError message={getFieldError("slug")} />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="project-short-description" className={labelClasses}>
                Short Description *
              </label>
              <textarea
                id="project-short-description"
                name="shortDescription"
                value={formValues.shortDescription}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={2}
                maxLength={300}
                placeholder="Briefly explain the project and its value."
                className={textareaClasses}
              />
              <div className="mt-0.5 flex items-start justify-between gap-2">
                <ProjectFieldError message={getFieldError("shortDescription")} />
                <span className="ml-auto shrink-0 text-[9px] text-slate-400 sm:text-[10px]">
                  {formValues.shortDescription.length}/300
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="project-description" className={labelClasses}>
                Full Description
              </label>
              <textarea
                id="project-description"
                name="description"
                value={formValues.description}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={3}
                placeholder="Add complete project context, scope and implementation details."
                className={textareaClasses}
              />
            </div>
          </div>

          <div className="grid gap-x-3 gap-y-2 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="project-category" className={labelClasses}>
                Category
              </label>
              <input
                id="project-category"
                name="category"
                type="text"
                value={formValues.category}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="E-commerce"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="project-type" className={labelClasses}>
                Project Type
              </label>
              <select
                id="project-type"
                name="projectType"
                value={formValues.projectType}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className={inputClasses}
              >
                <option value="personal">Personal</option>
                <option value="client">Client</option>
                <option value="company">Company</option>
                <option value="open-source">Open Source</option>
                <option value="practice">Practice</option>
              </select>
              <ProjectFieldError
                message={getFieldError("projectType", "project type")}
              />
            </div>

            <div>
              <label htmlFor="project-status" className={labelClasses}>
                Status
              </label>
              <select
                id="project-status"
                name="status"
                value={formValues.status}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className={inputClasses}
              >
                <option value="planning">Planning</option>
                <option value="in-progress">In Development</option>
                <option value="completed">Completed</option>
                <option value="maintained">Active Project</option>
                <option value="archived">Archived</option>
              </select>
              <ProjectFieldError
                message={getFieldError("status", "project status")}
              />
            </div>

            <div>
              <label htmlFor="project-client" className={labelClasses}>
                Client / Company
              </label>
              <input
                id="project-client"
                name="clientName"
                type="text"
                value={formValues.clientName}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="UniQuick Mart Pvt. Ltd."
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="project-role" className={labelClasses}>
                Your Role
              </label>
              <input
                id="project-role"
                name="role"
                type="text"
                value={formValues.role}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="Full-Stack Developer"
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="project-order" className={labelClasses}>
                Display Order
              </label>
              <input
                id="project-order"
                name="order"
                type="number"
                min="0"
                step="1"
                value={formValues.order}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className={inputClasses}
              />
              <ProjectFieldError message={getFieldError("order")} />
            </div>

            <div>
              <label htmlFor="project-started-at" className={labelClasses}>
                Start Date
              </label>
              <input
                id="project-started-at"
                name="startedAt"
                type="date"
                value={formValues.startedAt}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className={inputClasses}
              />
              <ProjectFieldError message={getFieldError("startedAt")} />
            </div>

            <div>
              <label htmlFor="project-completed-at" className={labelClasses}>
                Completion Date
              </label>
              <input
                id="project-completed-at"
                name="completedAt"
                type="date"
                value={formValues.completedAt}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className={inputClasses}
              />
              <ProjectFieldError message={getFieldError("completedAt")} />
            </div>

            <div className="grid gap-1.5 sm:col-span-2 sm:grid-cols-2 xl:col-span-3">
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
                  <span className="block text-[10px] font-semibold text-slate-800 dark:text-slate-200 sm:text-[11px]">
                    Visible
                  </span>
                  <span className="mt-0.5 block text-[8px] leading-3 text-slate-500 dark:text-slate-400 sm:text-[9px]">
                    Show project publicly.
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
                  <span className="block text-[10px] font-semibold text-slate-800 dark:text-slate-200 sm:text-[11px]">
                    Featured
                  </span>
                  <span className="mt-0.5 block text-[8px] leading-3 text-slate-500 dark:text-slate-400 sm:text-[9px]">
                    Prioritize this project.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300 sm:text-[10px]">
            Content, Media & Publishing
          </p>

          <h2 className="mt-0.5 text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">
            Technologies, Gallery, Results, Links and Advanced Controls
          </h2>
        </div>

        <div className="mt-2 grid gap-2 xl:grid-cols-2 xl:items-start">
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label htmlFor="project-technologies" className={labelClasses}>
                  Technologies
                </label>
                <textarea
                  id="project-technologies"
                  name="technologies"
                  value={formValues.technologies}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={3}
                  placeholder={"MongoDB\nExpress.js\nReact\nNode.js"}
                  className={textareaClasses}
                />
              </div>

              <div>
                <label htmlFor="project-features" className={labelClasses}>
                  Features
                </label>
                <textarea
                  id="project-features"
                  name="features"
                  value={formValues.features}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={3}
                  placeholder={"Authentication\nAdmin dashboard\nResponsive interface"}
                  className={textareaClasses}
                />
              </div>

              <div>
                <label htmlFor="project-challenges" className={labelClasses}>
                  Challenges
                </label>
                <textarea
                  id="project-challenges"
                  name="challenges"
                  value={formValues.challenges}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={2}
                  placeholder="Important development challenges."
                  className={textareaClasses}
                />
              </div>

              <div>
                <label htmlFor="project-solutions" className={labelClasses}>
                  Solutions
                </label>
                <textarea
                  id="project-solutions"
                  name="solutions"
                  value={formValues.solutions}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={2}
                  placeholder="How the challenges were solved."
                  className={textareaClasses}
                />
              </div>
            </div>

            <details
              className="group rounded-lg border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/50"
              open={hasResultErrors ? true : undefined}
            >
              <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 px-2.5 text-[10px] font-semibold text-slate-700 marker:hidden dark:text-slate-200 sm:text-[11px]">
                <span>Project Results ({formValues.results.length})</span>
                <span className="text-[9px] font-semibold text-slate-400">
                  Manage
                </span>
              </summary>

              <div className="border-t border-slate-200 p-2.5 dark:border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] leading-3.5 text-slate-500 dark:text-slate-400">
                    Add measurable outcomes or achievements.
                  </p>

                  <button
                    type="button"
                    onClick={handleAddResult}
                    disabled={isSubmitting}
                    className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 px-2.5 text-[9px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-50 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300"
                  >
                    + Result
                  </button>
                </div>

                {formValues.results.length === 0 ? (
                  <p className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-center text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No results added.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {formValues.results.map((result, index) => (
                      <div
                        key={`project-result-${index}`}
                        className="grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
                      >
                        <div>
                          <label className={labelClasses}>Label</label>
                          <input
                            type="text"
                            value={result.label}
                            onChange={(event) =>
                              handleResultChange(index, "label", event.target.value)
                            }
                            disabled={isSubmitting}
                            placeholder="Performance"
                            className={inputClasses}
                          />
                          <ProjectFieldError
                            message={getFieldError(
                              `results.${index}.label`,
                              "results",
                            )}
                          />
                        </div>

                        <div>
                          <label className={labelClasses}>Value</label>
                          <input
                            type="text"
                            value={result.value}
                            onChange={(event) =>
                              handleResultChange(index, "value", event.target.value)
                            }
                            disabled={isSubmitting}
                            placeholder="90+ score"
                            className={inputClasses}
                          />
                          <ProjectFieldError
                            message={getFieldError(`results.${index}.value`)}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveResult(index)}
                          disabled={isSubmitting}
                          className="mt-1 inline-flex min-h-8 items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 text-[9px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:bg-slate-950 dark:text-red-300 sm:mt-5"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <ProjectFieldError message={getFieldError("results")} />
              </div>
            </details>
          </div>

          <div className="space-y-2">
            <MediaField
              id="project-cover-image"
              name="coverImageUrl"
              label="Cover Image URL"
              value={formValues.coverImageUrl}
              onChange={handleInputChange}
              accessToken={accessToken}
              allowedTypes={["image", "svg"]}
              pickerTitle="Choose Project Cover"
              placeholder="https://..."
              helpText="Paste a URL or choose an image/SVG from Media Library."
              error={getFieldError("coverImageUrl")}
              disabled={isSubmitting}
              onUnauthorized={onMediaUnauthorized}
            />

            <details
              className="group rounded-lg border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/50"
              open={hasImageErrors ? true : undefined}
            >
              <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 px-2.5 text-[10px] font-semibold text-slate-700 marker:hidden dark:text-slate-200 sm:text-[11px]">
                <span>Screenshots ({formValues.images.length})</span>
                <span className="text-[9px] font-semibold text-slate-400">
                  Manage
                </span>
              </summary>

              <div className="border-t border-slate-200 p-2.5 dark:border-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] leading-3.5 text-slate-500 dark:text-slate-400">
                    Gallery images for the project and case study.
                  </p>

                  <button
                    type="button"
                    onClick={handleAddImage}
                    disabled={isSubmitting}
                    className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 px-2.5 text-[9px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-50 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300"
                  >
                    + Screenshot
                  </button>
                </div>

                {formValues.images.length === 0 ? (
                  <p className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-center text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No screenshots added.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {formValues.images.map((image, index) => (
                      <details
                        key={`project-image-${index}`}
                        className="group/item rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                        open={
                          getFieldError(`images.${index}.url`) ||
                          getFieldError(`images.${index}.order`)
                            ? true
                            : undefined
                        }
                      >
                        <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 px-2 marker:hidden">
                          <span className="truncate text-[9px] font-semibold text-slate-700 dark:text-slate-200 sm:text-[10px]">
                            Screenshot {index + 1}
                            {image.alt ? ` - ${image.alt}` : ""}
                          </span>
                          <span className="text-[8px] font-semibold text-slate-400">
                            Edit
                          </span>
                        </summary>

                        <div className="grid gap-2 border-t border-slate-200 p-2 dark:border-slate-700 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <MediaField
                              id={`project-image-${index}-url`}
                              name={`images.${index}.url`}
                              label="Screenshot URL *"
                              value={image.url}
                              onChange={(event, selectedMedia) => {
                                handleImageChange(
                                  index,
                                  "url",
                                  event.target.value,
                                );

                                if (selectedMedia?.altText && !image.alt.trim()) {
                                  handleImageChange(
                                    index,
                                    "alt",
                                    selectedMedia.altText,
                                  );
                                }
                              }}
                              accessToken={accessToken}
                              allowedTypes={["image", "svg"]}
                              pickerTitle={`Choose Screenshot ${index + 1}`}
                              placeholder="https://..."
                              helpText="Paste a URL or choose compatible Media."
                              error={getFieldError(
                                `images.${index}.url`,
                                "images",
                              )}
                              disabled={isSubmitting}
                              onUnauthorized={onMediaUnauthorized}
                            />
                          </div>

                          <div>
                            <label className={labelClasses}>
                              Alternative Text
                            </label>
                            <input
                              type="text"
                              value={image.alt}
                              onChange={(event) =>
                                handleImageChange(
                                  index,
                                  "alt",
                                  event.target.value,
                                )
                              }
                              disabled={isSubmitting}
                              placeholder="Homepage screenshot"
                              className={inputClasses}
                            />
                          </div>

                          <div>
                            <label className={labelClasses}>Display Order</label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={image.order}
                              onChange={(event) =>
                                handleImageChange(
                                  index,
                                  "order",
                                  event.target.value,
                                )
                              }
                              disabled={isSubmitting}
                              className={inputClasses}
                            />
                            <ProjectFieldError
                              message={getFieldError(`images.${index}.order`)}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className={labelClasses}>Caption</label>
                            <textarea
                              value={image.caption}
                              onChange={(event) =>
                                handleImageChange(
                                  index,
                                  "caption",
                                  event.target.value,
                                )
                              }
                              disabled={isSubmitting}
                              rows={2}
                              placeholder="Optional screenshot caption."
                              className={textareaClasses}
                            />
                          </div>

                          <div className="sm:col-span-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              disabled={isSubmitting}
                              className="inline-flex min-h-8 items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 text-[9px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:bg-slate-950 dark:text-red-300"
                            >
                              Remove Screenshot
                            </button>
                          </div>
                        </div>
                      </details>
                    ))}
                  </div>
                )}

                <ProjectFieldError message={getFieldError("images")} />
              </div>
            </details>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label htmlFor="project-live-url" className={labelClasses}>
                  Live Project URL
                </label>
                <input
                  id="project-live-url"
                  name="liveUrl"
                  type="url"
                  value={formValues.liveUrl}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  placeholder="https://..."
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="project-source-url" className={labelClasses}>
                  Source Code URL
                </label>
                <input
                  id="project-source-url"
                  name="sourceCodeUrl"
                  type="url"
                  value={formValues.sourceCodeUrl}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  placeholder="https://github.com/..."
                  className={inputClasses}
                />
              </div>

              <div>
                <label htmlFor="project-case-study-url" className={labelClasses}>
                  External Case Study URL
                </label>
                <input
                  id="project-case-study-url"
                  name="caseStudyUrl"
                  type="url"
                  value={formValues.caseStudyUrl}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  placeholder="https://..."
                  className={inputClasses}
                />
              </div>

              <MediaField
                id="project-video-url"
                name="videoUrl"
                label="Project Video URL"
                value={formValues.videoUrl}
                onChange={handleInputChange}
                accessToken={accessToken}
                allowedTypes={["video"]}
                pickerTitle="Choose Project Video"
                placeholder="https://youtube.com/... or Media URL"
                helpText="Enter an external URL or choose uploaded video Media."
                error={getFieldError("links.videoUrl", "videoUrl", "links")}
                disabled={isSubmitting}
                onUnauthorized={onMediaUnauthorized}
              />
            </div>

            <ProjectFieldError message={getFieldError("links")} />

            <details
              className="group rounded-lg border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/50"
              open={hasCaseStudyErrors ? true : undefined}
            >
              <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 px-2.5 text-[10px] font-semibold text-slate-700 marker:hidden dark:text-slate-200 sm:text-[11px]">
                <span>Case Study Publishing</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[8px] font-bold ${
                    formValues.caseStudyIsPublished
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {formValues.caseStudyIsPublished ? "Published" : "Off"}
                </span>
              </summary>

              <div className="grid gap-1.5 border-t border-slate-200 p-2.5 dark:border-slate-700 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                  <input
                    name="caseStudyIsPublished"
                    type="checkbox"
                    checked={formValues.caseStudyIsPublished}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    <span className="block text-[10px] font-semibold text-slate-800 dark:text-slate-200">
                      Publish as Case Study
                    </span>
                    <span className="mt-0.5 block text-[8px] leading-3 text-slate-500 dark:text-slate-400">
                      Include in Case Studies.
                    </span>
                  </span>
                </label>

                <label
                  className={`flex items-start gap-2 rounded-lg border p-2 ${
                    formValues.caseStudyIsPublished
                      ? "cursor-pointer border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                      : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60 dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <input
                    name="caseStudyIsFeatured"
                    type="checkbox"
                    checked={formValues.caseStudyIsFeatured}
                    onChange={handleInputChange}
                    disabled={isSubmitting || !formValues.caseStudyIsPublished}
                    className="mt-0.5 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    <span className="block text-[10px] font-semibold text-slate-800 dark:text-slate-200">
                      Featured Case Study
                    </span>
                    <span className="mt-0.5 block text-[8px] leading-3 text-slate-500 dark:text-slate-400">
                      Prioritize among Case Studies.
                    </span>
                  </span>
                </label>

                <div className="sm:col-span-2 sm:max-w-48">
                  <label htmlFor="project-case-study-order" className={labelClasses}>
                    Case Study Order
                  </label>
                  <input
                    id="project-case-study-order"
                    name="caseStudyOrder"
                    type="number"
                    min="0"
                    step="1"
                    value={formValues.caseStudyOrder}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={inputClasses}
                  />
                  <ProjectFieldError
                    message={getFieldError(
                      "caseStudy.order",
                      "caseStudyOrder",
                      "caseStudy",
                    )}
                  />
                </div>

                <div className="sm:col-span-2">
                  <ProjectFieldError message={getFieldError("caseStudy")} />
                </div>
              </div>
            </details>

            <details
              className="group rounded-lg border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/50"
              open={hasSeoErrors ? true : undefined}
            >
              <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 px-2.5 text-[10px] font-semibold text-slate-700 marker:hidden dark:text-slate-200 sm:text-[11px]">
                <span>SEO Settings</span>
                <span className="text-[9px] font-semibold text-slate-400">
                  Advanced
                </span>
              </summary>

              <div className="grid gap-2 border-t border-slate-200 p-2.5 dark:border-slate-700">
                <div>
                  <label htmlFor="project-seo-title" className={labelClasses}>
                    SEO Title
                  </label>
                  <input
                    id="project-seo-title"
                    name="seoTitle"
                    type="text"
                    value={formValues.seoTitle}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    maxLength={70}
                    className={inputClasses}
                  />
                  <ProjectFieldError
                    message={getFieldError("seo.title", "seoTitle", "seo")}
                  />
                </div>

                <div>
                  <label htmlFor="project-seo-description" className={labelClasses}>
                    SEO Description
                  </label>
                  <textarea
                    id="project-seo-description"
                    name="seoDescription"
                    value={formValues.seoDescription}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    rows={2}
                    maxLength={180}
                    className={textareaClasses}
                  />
                  <ProjectFieldError
                    message={getFieldError(
                      "seo.description",
                      "seoDescription",
                      "seo",
                    )}
                  />
                </div>

                <div>
                  <label htmlFor="project-seo-keywords" className={labelClasses}>
                    SEO Keywords
                  </label>
                  <textarea
                    id="project-seo-keywords"
                    name="seoKeywords"
                    value={formValues.seoKeywords}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    rows={2}
                    placeholder="mern project, react portfolio"
                    className={textareaClasses}
                  />
                  <ProjectFieldError
                    message={getFieldError(
                      "seo.keywords",
                      "seoKeywords",
                      "seo",
                    )}
                  />
                </div>

                <MediaField
                  id="project-seo-image"
                  name="seoOgImageUrl"
                  label="Social Sharing Image URL"
                  value={formValues.seoOgImageUrl}
                  onChange={handleInputChange}
                  accessToken={accessToken}
                  allowedTypes={["image", "svg"]}
                  pickerTitle="Choose Social Sharing Image"
                  placeholder="https://..."
                  helpText="Paste a URL or reuse an image from Media Library."
                  error={getFieldError(
                    "seo.ogImageUrl",
                    "seoOgImageUrl",
                    "seo",
                  )}
                  disabled={isSubmitting}
                  onUnauthorized={onMediaUnauthorized}
                />
              </div>
            </details>
          </div>
        </div>
      </section>

      <div className="sticky bottom-2 z-20 flex flex-col-reverse gap-1.5 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/projects"
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

export default ProjectForm;
