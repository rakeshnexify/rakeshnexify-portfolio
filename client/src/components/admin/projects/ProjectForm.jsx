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

  return <p className="mt-2 text-sm font-medium text-red-600">{message}</p>;
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {submitError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium leading-6 text-red-700"
        >
          {submitError}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Basic Information</h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Add the public project name, URL slug and complete description.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div>
            <label
              htmlFor="project-title"
              className="text-sm font-semibold text-slate-700"
            >
              Project title *
            </label>

            <input
              id="project-title"
              name="title"
              type="text"
              value={formValues.title}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="MERN E-commerce Store"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ProjectFieldError message={getFieldError("title")} />
          </div>

          <div>
            <label
              htmlFor="project-slug"
              className="text-sm font-semibold text-slate-700"
            >
              URL slug *
            </label>

            <input
              id="project-slug"
              name="slug"
              type="text"
              value={formValues.slug}
              onChange={handleInputChange}
              onBlur={handleSlugBlur}
              disabled={isSubmitting}
              placeholder="mern-ecommerce-store"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ProjectFieldError message={getFieldError("slug")} />
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="project-short-description"
            className="text-sm font-semibold text-slate-700"
          >
            Short description *
          </label>

          <textarea
            id="project-short-description"
            name="shortDescription"
            value={formValues.shortDescription}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={3}
            maxLength={350}
            placeholder="Write a short description for project cards."
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
          />

          <div className="mt-2 flex items-start justify-between gap-4">
            <ProjectFieldError message={getFieldError("shortDescription")} />

            <span className="ml-auto text-xs text-slate-400">
              {formValues.shortDescription.length}
              /350
            </span>
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="project-description"
            className="text-sm font-semibold text-slate-700"
          >
            Full description
          </label>

          <textarea
            id="project-description"
            name="description"
            value={formValues.description}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={8}
            maxLength={10000}
            placeholder="Explain the project purpose, workflow and important details."
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
          />

          <ProjectFieldError message={getFieldError("description")} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Project Details</h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="project-category"
              className="text-sm font-semibold text-slate-700"
            >
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
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="project-type"
              className="text-sm font-semibold text-slate-700"
            >
              Project type
            </label>

            <select
              id="project-type"
              name="projectType"
              value={formValues.projectType}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
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
            <label
              htmlFor="project-client"
              className="text-sm font-semibold text-slate-700"
            >
              Client or company
            </label>

            <input
              id="project-client"
              name="clientName"
              type="text"
              value={formValues.clientName}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="UniQuick Mart Pvt. Ltd."
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="project-role"
              className="text-sm font-semibold text-slate-700"
            >
              Your role
            </label>

            <input
              id="project-role"
              name="role"
              type="text"
              value={formValues.role}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Full-Stack Developer"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="project-status"
              className="text-sm font-semibold text-slate-700"
            >
              Project status
            </label>

            <select
              id="project-status"
              name="status"
              value={formValues.status}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
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
            <label
              htmlFor="project-order"
              className="text-sm font-semibold text-slate-700"
            >
              Display order
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
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ProjectFieldError message={getFieldError("order")} />
          </div>

          <div>
            <label
              htmlFor="project-started-at"
              className="text-sm font-semibold text-slate-700"
            >
              Start date
            </label>

            <input
              id="project-started-at"
              name="startedAt"
              type="date"
              value={formValues.startedAt}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ProjectFieldError message={getFieldError("startedAt")} />
          </div>

          <div>
            <label
              htmlFor="project-completed-at"
              className="text-sm font-semibold text-slate-700"
            >
              Completion date
            </label>

            <input
              id="project-completed-at"
              name="completedAt"
              type="date"
              value={formValues.completedAt}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ProjectFieldError message={getFieldError("completedAt")} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <input
              name="isVisible"
              type="checkbox"
              checked={formValues.isVisible}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-1 size-4 accent-brand-600"
            />

            <span>
              <span className="block text-sm font-bold text-slate-900">
                Visible on portfolio
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Visitors can view the project card and case-study page.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <input
              name="isFeatured"
              type="checkbox"
              checked={formValues.isFeatured}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-1 size-4 accent-brand-600"
            />

            <span>
              <span className="block text-sm font-bold text-slate-900">
                Featured project
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Highlight this project before standard projects.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">
          Technologies and Content
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter one item per line or separate items using commas.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div>
            <label
              htmlFor="project-technologies"
              className="text-sm font-semibold text-slate-700"
            >
              Technologies
            </label>

            <textarea
              id="project-technologies"
              name="technologies"
              value={formValues.technologies}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={7}
              placeholder={"MongoDB\nExpress.js\nReact\nNode.js"}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="project-features"
              className="text-sm font-semibold text-slate-700"
            >
              Project features
            </label>

            <textarea
              id="project-features"
              name="features"
              value={formValues.features}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={7}
              placeholder={
                "Authentication\nAdmin dashboard\nResponsive interface"
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="project-challenges"
              className="text-sm font-semibold text-slate-700"
            >
              Challenges
            </label>

            <textarea
              id="project-challenges"
              name="challenges"
              value={formValues.challenges}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={6}
              placeholder="Describe important development challenges."
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="project-solutions"
              className="text-sm font-semibold text-slate-700"
            >
              Solutions
            </label>

            <textarea
              id="project-solutions"
              name="solutions"
              value={formValues.solutions}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={6}
              placeholder="Explain how each challenge was solved."
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Project Media</h2>

        <div className="mt-6">
          <MediaField
            id="project-cover-image"
            name="coverImageUrl"
            label="Cover image URL"
            value={formValues.coverImageUrl}
            onChange={handleInputChange}
            accessToken={accessToken}
            allowedTypes={["image", "svg"]}
            pickerTitle="Choose Project Cover"
            placeholder="https://..."
            helpText="Paste an external URL or choose an existing image/SVG from the Media Library."
            error={getFieldError("coverImageUrl")}
            disabled={isSubmitting}
            onUnauthorized={onMediaUnauthorized}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-950">Project Screenshots</h3>

            <p className="mt-1 text-sm text-slate-500">
              Add multiple screenshot URLs for the case-study gallery.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddImage}
            disabled={isSubmitting}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            + Add Screenshot
          </button>
        </div>

        {formValues.images.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No project screenshots added.
          </div>
        )}

        <div className="mt-5 space-y-5">
          {formValues.images.map((image, index) => (
            <div
              key={`project-image-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-bold text-slate-900">
                  Screenshot {index + 1}
                </h4>

                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  disabled={isSubmitting}
                  className="text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <MediaField
                    id={`project-image-${index}-url`}
                    name={`images.${index}.url`}
                    label="Screenshot URL *"
                    value={image.url}
                    onChange={(event, selectedMedia) => {
                      handleImageChange(index, "url", event.target.value);

                      if (selectedMedia?.altText && !image.alt.trim()) {
                        handleImageChange(index, "alt", selectedMedia.altText);
                      }
                    }}
                    accessToken={accessToken}
                    allowedTypes={["image", "svg"]}
                    pickerTitle={`Choose Screenshot ${index + 1}`}
                    placeholder="https://..."
                    helpText="Paste an external URL or select an image/SVG from Media."
                    error={getFieldError(`images.${index}.url`, "images")}
                    disabled={isSubmitting}
                    onUnauthorized={onMediaUnauthorized}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Alternative text
                  </label>

                  <input
                    type="text"
                    value={image.alt}
                    onChange={(event) =>
                      handleImageChange(index, "alt", event.target.value)
                    }
                    disabled={isSubmitting}
                    placeholder="Homepage screenshot"
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Display order
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={image.order}
                    onChange={(event) =>
                      handleImageChange(index, "order", event.target.value)
                    }
                    disabled={isSubmitting}
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
                  />

                  <ProjectFieldError
                    message={getFieldError(`images.${index}.order`)}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Caption
                  </label>

                  <textarea
                    value={image.caption}
                    onChange={(event) =>
                      handleImageChange(index, "caption", event.target.value)
                    }
                    disabled={isSubmitting}
                    rows={2}
                    placeholder="Optional screenshot caption."
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Project Results
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add measurable outcomes or important achievements.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddResult}
            disabled={isSubmitting}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            + Add Result
          </button>
        </div>

        {formValues.results.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No project results added.
          </div>
        )}

        <div className="mt-5 space-y-4">
          {formValues.results.map((result, index) => (
            <div
              key={`project-result-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-slate-900">Result {index + 1}</h3>

                <button
                  type="button"
                  onClick={() => handleRemoveResult(index)}
                  disabled={isSubmitting}
                  className="text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Label
                  </label>

                  <input
                    type="text"
                    value={result.label}
                    onChange={(event) =>
                      handleResultChange(index, "label", event.target.value)
                    }
                    disabled={isSubmitting}
                    placeholder="Performance"
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
                  />

                  <ProjectFieldError
                    message={getFieldError(`results.${index}.label`, "results")}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Value
                  </label>

                  <input
                    type="text"
                    value={result.value}
                    onChange={(event) =>
                      handleResultChange(index, "value", event.target.value)
                    }
                    disabled={isSubmitting}
                    placeholder="90+ score"
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
                  />

                  <ProjectFieldError
                    message={getFieldError(`results.${index}.value`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Project Links</h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="project-live-url"
              className="text-sm font-semibold text-slate-700"
            >
              Live project URL
            </label>

            <input
              id="project-live-url"
              name="liveUrl"
              type="url"
              value={formValues.liveUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://..."
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="project-source-url"
              className="text-sm font-semibold text-slate-700"
            >
              Source code URL
            </label>

            <input
              id="project-source-url"
              name="sourceCodeUrl"
              type="url"
              value={formValues.sourceCodeUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://github.com/..."
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="project-case-study-url"
              className="text-sm font-semibold text-slate-700"
            >
              External case-study URL
            </label>

            <input
              id="project-case-study-url"
              name="caseStudyUrl"
              type="url"
              value={formValues.caseStudyUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://..."
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />
          </div>

          <div>
            <MediaField
              id="project-video-url"
              name="videoUrl"
              label="Project video URL"
              value={formValues.videoUrl}
              onChange={handleInputChange}
              accessToken={accessToken}
              allowedTypes={["video"]}
              pickerTitle="Choose Project Video"
              placeholder="https://youtube.com/... or Media URL"
              helpText="YouTube/external URL can still be entered manually, or choose an uploaded MP4/WebM asset."
              error={getFieldError("links.videoUrl", "videoUrl", "links")}
              disabled={isSubmitting}
              onUnauthorized={onMediaUnauthorized}
            />
          </div>
        </div>

        <ProjectFieldError message={getFieldError("links")} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">SEO Settings</h2>

        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="project-seo-title"
              className="text-sm font-semibold text-slate-700"
            >
              SEO title
            </label>

            <input
              id="project-seo-title"
              name="seoTitle"
              type="text"
              value={formValues.seoTitle}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={70}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ProjectFieldError
              message={getFieldError("seo.title", "seoTitle", "seo")}
            />
          </div>

          <div>
            <label
              htmlFor="project-seo-description"
              className="text-sm font-semibold text-slate-700"
            >
              SEO description
            </label>

            <textarea
              id="project-seo-description"
              name="seoDescription"
              value={formValues.seoDescription}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={3}
              maxLength={180}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
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
            <label
              htmlFor="project-seo-keywords"
              className="text-sm font-semibold text-slate-700"
            >
              SEO keywords
            </label>

            <textarea
              id="project-seo-keywords"
              name="seoKeywords"
              value={formValues.seoKeywords}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={3}
              placeholder="mern project, react portfolio"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ProjectFieldError
              message={getFieldError("seo.keywords", "seoKeywords", "seo")}
            />
          </div>

          <div>
            <MediaField
              id="project-seo-image"
              name="seoOgImageUrl"
              label="Social sharing image URL"
              value={formValues.seoOgImageUrl}
              onChange={handleInputChange}
              accessToken={accessToken}
              allowedTypes={["image", "svg"]}
              pickerTitle="Choose Social Sharing Image"
              placeholder="https://..."
              helpText="Paste an external URL or reuse an image from the Media Library."
              error={getFieldError("seo.ogImageUrl", "seoOgImageUrl", "seo")}
              disabled={isSubmitting}
              onUnauthorized={onMediaUnauthorized}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/projects"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Saving project..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default ProjectForm;
