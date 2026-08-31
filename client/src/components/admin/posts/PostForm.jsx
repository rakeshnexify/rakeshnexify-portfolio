import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import MediaField from "../media/MediaField";

import {
  createPostPayload,
  createPostSlug,
  defaultPostFormValues,
  postTypes,
  validatePostFormValues,
} from "../../../utils/postForm";

const inputClasses =
  "mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm";

const textareaClasses =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm";

function PostFieldError({ message }) {
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

function getProjectId(project) {
  if (typeof project === "string") {
    return project;
  }

  return String(project?._id || project?.id || "");
}

function PostForm({
  initialValues = defaultPostFormValues,
  onSubmit,
  submitLabel = "Save Post",
  projectOptions = [],
  areProjectsLoading = false,
  onSubmittingChange,
  accessToken = "",
  onMediaUnauthorized,
}) {
  const [formValues, setFormValues] = useState(initialValues);
  const [localErrors, setLocalErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMountedRef = useRef(true);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(
    Boolean(initialValues.slug),
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const missingSelectedProjectIds = useMemo(() => {
    const availableProjectIds = new Set(
      projectOptions.map(getProjectId).filter(Boolean),
    );

    return (Array.isArray(formValues.relatedProjects)
      ? formValues.relatedProjects
      : []
    ).filter(
      (projectId) =>
        typeof projectId === "string" &&
        projectId &&
        !availableProjectIds.has(projectId),
    );
  }, [formValues.relatedProjects, projectOptions]);

  function findError(errors, fieldName) {
    if (errors[fieldName]) {
      return errors[fieldName];
    }

    const nestedField = Object.keys(errors).find((key) =>
      key.startsWith(`${fieldName}.`),
    );

    return nestedField ? errors[nestedField] : "";
  }

  function getFieldError(...fieldNames) {
    for (const fieldName of fieldNames) {
      const localError = findError(localErrors, fieldName);

      if (localError) {
        return localError;
      }

      const serverError = findError(serverErrors, fieldName);

      if (serverError) {
        return serverError;
      }
    }

    return "";
  }

  function clearFieldErrors(...fieldNames) {
    function clearErrors(currentErrors) {
      const updatedErrors = { ...currentErrors };

      Object.keys(updatedErrors).forEach((key) => {
        if (
          fieldNames.some(
            (fieldName) =>
              key === fieldName || key.startsWith(`${fieldName}.`),
          )
        ) {
          delete updatedErrors[key];
        }
      });

      return updatedErrors;
    }

    setLocalErrors(clearErrors);
    setServerErrors(clearErrors);
  }

  function handleInputChange(event, selectedMedia = null) {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;
    const selectedMediaAltText = String(selectedMedia?.altText || "").trim();
    const shouldPopulateFeaturedImageAlt =
      name === "featuredImageUrl" &&
      Boolean(selectedMediaAltText) &&
      !String(formValues.featuredImageAlt || "").trim();

    setFormValues((currentValues) => {
      if (name.startsWith("seo.")) {
        const seoField = name.slice(4);

        return {
          ...currentValues,
          seo: {
            ...currentValues.seo,
            [seoField]: nextValue,
          },
        };
      }

      const updatedValues = {
        ...currentValues,
        [name]: nextValue,
      };

      if (name === "title" && !isSlugManuallyEdited) {
        updatedValues.slug = createPostSlug(value);
      }

      if (shouldPopulateFeaturedImageAlt) {
        updatedValues.featuredImageAlt = selectedMediaAltText;
      }

      return updatedValues;
    });

    if (name === "slug") {
      setIsSlugManuallyEdited(Boolean(value.trim()));
    }

    clearFieldErrors(
      name,
      ...(shouldPopulateFeaturedImageAlt ? ["featuredImageAlt"] : []),
    );

    if (name.startsWith("seo.")) {
      clearFieldErrors("seo", name);
    }

    setSubmitError("");
  }

  function handleRelatedProjectsChange(event) {
    const selectedValues = Array.from(event.target.options)
      .filter((option) => option.selected)
      .map((option) => option.value);

    setFormValues((currentValues) => ({
      ...currentValues,
      relatedProjects: selectedValues,
    }));

    clearFieldErrors("relatedProjects");
    setSubmitError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validatePostFormValues(formValues);

    setLocalErrors(validationErrors);
    setServerErrors({});
    setSubmitError("");

    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0];

      document.getElementsByName(firstErrorField)[0]?.focus();

      return;
    }

    try {
      setIsSubmitting(true);
      onSubmittingChange?.(true);

      const payload = createPostPayload(formValues);

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
        error instanceof Error ? error.message : "Post could not be saved.",
      );
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
        onSubmittingChange?.(false);
      }
    }
  }

  const labelClasses =
    "text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]";

  const seoHasError = Boolean(
    getFieldError("seo.title", "seo") ||
      getFieldError("seo.description", "seo") ||
      getFieldError("seo.keywords", "seo") ||
      getFieldError("seo.ogImageUrl", "seo"),
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="rnx-admin-post-form-v494 space-y-2">
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
            Article Content
          </p>

          <h2 className="mt-0.5 text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">
            Identity, Summary and Article Body
          </h2>
        </div>

        <div className="mt-2 grid gap-x-3 gap-y-2 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="post-type" className={labelClasses}>
              Post Type <span className="text-red-600">*</span>
            </label>

            <select
              id="post-type"
              name="type"
              value={formValues.type}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("type"))}
              className={inputClasses}
            >
              {postTypes.map((postType) => (
                <option key={postType} value={postType}>
                  {postType === "blog" ? "Blog" : "News"}
                </option>
              ))}
            </select>

            <PostFieldError message={getFieldError("type")} />
          </div>

          <div>
            <label htmlFor="post-author-name" className={labelClasses}>
              Author <span className="text-red-600">*</span>
            </label>

            <input
              id="post-author-name"
              name="authorName"
              type="text"
              value={formValues.authorName}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={150}
              placeholder="Author display name"
              aria-invalid={Boolean(getFieldError("authorName"))}
              className={inputClasses}
            />

            <PostFieldError message={getFieldError("authorName")} />
          </div>

          <div>
            <label htmlFor="post-category" className={labelClasses}>
              Category
            </label>

            <input
              id="post-category"
              name="category"
              type="text"
              value={formValues.category}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={120}
              placeholder="Development, Business, Update..."
              aria-invalid={Boolean(getFieldError("category"))}
              className={inputClasses}
            />

            <PostFieldError message={getFieldError("category")} />
          </div>

          <div>
            <label htmlFor="post-slug" className={labelClasses}>
              URL Slug
            </label>

            <input
              id="post-slug"
              name="slug"
              type="text"
              value={formValues.slug}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={200}
              placeholder="article-url-slug"
              aria-invalid={Boolean(getFieldError("slug"))}
              className={inputClasses}
            />

            <p className="mt-0.5 text-[8px] leading-3 text-slate-500 dark:text-slate-400 sm:text-[9px]">
              Auto-generated until manually edited.
            </p>

            <PostFieldError message={getFieldError("slug")} />
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <label htmlFor="post-title" className={labelClasses}>
              Title <span className="text-red-600">*</span>
            </label>

            <input
              id="post-title"
              name="title"
              type="text"
              value={formValues.title}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={180}
              placeholder="Enter article title"
              aria-invalid={Boolean(getFieldError("title"))}
              className={inputClasses}
            />

            <PostFieldError message={getFieldError("title")} />
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <label htmlFor="post-excerpt" className={labelClasses}>
              Excerpt <span className="text-red-600">*</span>
            </label>

            <textarea
              id="post-excerpt"
              name="excerpt"
              value={formValues.excerpt}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              rows={2}
              placeholder="Concise summary for cards and listing pages."
              aria-invalid={Boolean(getFieldError("excerpt"))}
              className={textareaClasses}
            />

            <div className="mt-0.5 flex items-center justify-between gap-2 text-[8px] text-slate-400 sm:text-[9px]">
              <span>Minimum 10 characters.</span>
              <span>{formValues.excerpt.length}/500</span>
            </div>

            <PostFieldError message={getFieldError("excerpt")} />
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <label htmlFor="post-content" className={labelClasses}>
              Article Content <span className="text-red-600">*</span>
            </label>

            <textarea
              id="post-content"
              name="content"
              value={formValues.content}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={50000}
              rows={10}
              placeholder="Write the complete article content..."
              aria-invalid={Boolean(getFieldError("content"))}
              className={textareaClasses}
            />

            <div className="mt-0.5 flex items-center justify-between gap-2 text-[8px] text-slate-400 sm:text-[9px]">
              <span>Plain article content. Minimum 20 characters.</span>
              <span>{formValues.content.length}/50000</span>
            </div>

            <PostFieldError message={getFieldError("content")} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-300 sm:text-[10px]">
            Media & Publishing
          </p>

          <h2 className="mt-0.5 text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">
            Featured Media, Metadata, Relations and Visibility
          </h2>
        </div>

        <div className="mt-2 grid gap-2 xl:grid-cols-2 xl:items-start">
          <div className="space-y-2">
            <MediaField
              id="post-featured-image-url"
              name="featuredImageUrl"
              label="Featured Image URL"
              value={formValues.featuredImageUrl}
              onChange={handleInputChange}
              accessToken={accessToken}
              allowedTypes={["image", "svg"]}
              pickerTitle="Choose Featured Image"
              placeholder="https://example.com/article.jpg"
              helpText="Paste a URL or choose an image/SVG from Media Library."
              error={getFieldError("featuredImageUrl")}
              disabled={isSubmitting}
              onUnauthorized={onMediaUnauthorized}
            />

            <div>
              <label htmlFor="post-featured-image-alt" className={labelClasses}>
                Featured Image Alt Text
              </label>

              <input
                id="post-featured-image-alt"
                name="featuredImageAlt"
                type="text"
                value={formValues.featuredImageAlt}
                onChange={handleInputChange}
                disabled={isSubmitting}
                maxLength={220}
                placeholder="Describe the article image"
                aria-invalid={Boolean(getFieldError("featuredImageAlt"))}
                className={inputClasses}
              />

              <PostFieldError message={getFieldError("featuredImageAlt")} />
            </div>

            {formValues.featuredImageUrl && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-950/60">
                <img
                  key={formValues.featuredImageUrl}
                  src={formValues.featuredImageUrl}
                  alt={
                    formValues.featuredImageAlt ||
                    `${formValues.title || "Post"} preview`
                  }
                  className="max-h-28 w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label htmlFor="post-tags" className={labelClasses}>
                Tags
              </label>

              <textarea
                id="post-tags"
                name="tags"
                value={formValues.tags}
                onChange={handleInputChange}
                disabled={isSubmitting}
                rows={2}
                placeholder="mern, react, portfolio"
                aria-invalid={Boolean(getFieldError("tags"))}
                className={textareaClasses}
              />

              <PostFieldError message={getFieldError("tags")} />
            </div>

            <div>
              <label htmlFor="post-related-projects" className={labelClasses}>
                Related Projects
              </label>

              <select
                id="post-related-projects"
                name="relatedProjects"
                multiple
                value={formValues.relatedProjects}
                onChange={handleRelatedProjectsChange}
                disabled={isSubmitting || areProjectsLoading}
                aria-invalid={Boolean(getFieldError("relatedProjects"))}
                className={`${inputClasses} min-h-20 py-1.5 sm:min-h-24`}
              >
                {missingSelectedProjectIds.map((projectId) => (
                  <option key={projectId} value={projectId}>
                    Current Project ({projectId})
                  </option>
                ))}

                {projectOptions.map((project) => {
                  const projectId = getProjectId(project);

                  return (
                    <option key={projectId} value={projectId}>
                      {getProjectLabel(project)}
                    </option>
                  );
                })}
              </select>

              <p className="mt-0.5 text-[8px] leading-3 text-slate-500 dark:text-slate-400 sm:text-[9px]">
                {areProjectsLoading
                  ? "Loading Projects..."
                  : "Ctrl/Cmd selects multiple Projects."}
              </p>

              <PostFieldError message={getFieldError("relatedProjects")} />
            </div>

            <div>
              <label htmlFor="post-published-at" className={labelClasses}>
                Published Date / Time
              </label>

              <input
                id="post-published-at"
                name="publishedAt"
                type="datetime-local"
                value={formValues.publishedAt}
                onChange={handleInputChange}
                disabled={isSubmitting}
                aria-invalid={Boolean(getFieldError("publishedAt"))}
                className={inputClasses}
              />

              <PostFieldError message={getFieldError("publishedAt")} />
            </div>

            <div>
              <label htmlFor="post-reading-time" className={labelClasses}>
                Reading Time <span className="text-red-600">*</span>
              </label>

              <input
                id="post-reading-time"
                name="readingTime"
                type="number"
                min="1"
                step="1"
                value={formValues.readingTime}
                onChange={handleInputChange}
                disabled={isSubmitting}
                aria-invalid={Boolean(getFieldError("readingTime"))}
                className={inputClasses}
              />

              <PostFieldError message={getFieldError("readingTime")} />
            </div>

            <div>
              <label htmlFor="post-order" className={labelClasses}>
                Display Order <span className="text-red-600">*</span>
              </label>

              <input
                id="post-order"
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

              <PostFieldError message={getFieldError("order")} />
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
                    Prioritize listing.
                  </span>
                </span>
              </label>
            </div>

            <PostFieldError message={getFieldError("isVisible")} />
            <PostFieldError message={getFieldError("isFeatured")} />

            <details
              className="group sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-950/50"
              open={seoHasError}
            >
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 px-2.5 text-[10px] font-semibold text-slate-600 marker:hidden dark:text-slate-300">
                <span>SEO Settings</span>
                <span className="text-[9px] font-semibold text-slate-400">
                  Advanced
                </span>
              </summary>

              <div className="grid gap-2 border-t border-slate-200 p-2.5 dark:border-slate-700 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label htmlFor="post-seo-title" className={labelClasses}>
                    SEO Title
                  </label>

                  <input
                    id="post-seo-title"
                    name="seo.title"
                    type="text"
                    value={formValues.seo.title}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    maxLength={70}
                    placeholder="Optional custom search title"
                    aria-invalid={Boolean(getFieldError("seo.title", "seo"))}
                    className={inputClasses}
                  />

                  <div className="mt-0.5 text-right text-[8px] text-slate-400 sm:text-[9px]">
                    {formValues.seo.title.length}/70
                  </div>

                  <PostFieldError message={getFieldError("seo.title", "seo")} />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="post-seo-description" className={labelClasses}>
                    SEO Description
                  </label>

                  <textarea
                    id="post-seo-description"
                    name="seo.description"
                    value={formValues.seo.description}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    maxLength={180}
                    rows={2}
                    placeholder="Optional search and social description"
                    aria-invalid={Boolean(getFieldError("seo.description", "seo"))}
                    className={textareaClasses}
                  />

                  <div className="mt-0.5 text-right text-[8px] text-slate-400 sm:text-[9px]">
                    {formValues.seo.description.length}/180
                  </div>

                  <PostFieldError message={getFieldError("seo.description", "seo")} />
                </div>

                <div>
                  <label htmlFor="post-seo-keywords" className={labelClasses}>
                    SEO Keywords
                  </label>

                  <textarea
                    id="post-seo-keywords"
                    name="seo.keywords"
                    value={formValues.seo.keywords}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    rows={2}
                    placeholder="mern developer, portfolio"
                    aria-invalid={Boolean(getFieldError("seo.keywords", "seo"))}
                    className={textareaClasses}
                  />

                  <PostFieldError message={getFieldError("seo.keywords", "seo")} />
                </div>

                <MediaField
                  id="post-seo-og-image"
                  name="seo.ogImageUrl"
                  label="Open Graph Image URL"
                  value={formValues.seo.ogImageUrl}
                  onChange={handleInputChange}
                  accessToken={accessToken}
                  allowedTypes={["image", "svg"]}
                  pickerTitle="Choose Open Graph Image"
                  placeholder="https://example.com/social-image.jpg"
                  helpText="Paste a URL or choose an image/SVG from Media Library."
                  error={getFieldError("seo.ogImageUrl", "seo")}
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
          to="/admin/posts"
          onClick={(event) => {
            if (isSubmitting) {
              event.preventDefault();
            }
          }}
          aria-disabled={isSubmitting}
          tabIndex={isSubmitting ? -1 : undefined}
          className={`inline-flex min-h-9 items-center justify-center rounded-lg border px-4 text-[11px] font-semibold transition ${
            isSubmitting
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-60 dark:border-slate-800 dark:bg-slate-900"
              : "border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
          }`}
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

export default PostForm;
