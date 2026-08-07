import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import {
  createPostPayload,
  createPostSlug,
  defaultPostFormValues,
  postTypes,
  validatePostFormValues,
} from "../../../utils/postForm";

const inputClasses =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const textareaClasses =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

function PostFieldError({ message }) {
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

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

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

      return updatedValues;
    });

    if (name === "slug") {
      setIsSlugManuallyEdited(Boolean(value.trim()));
    }

    clearFieldErrors(name);

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
          Article Identity
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Blog / News Basics
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Both Blog and News use the same Post record. The Post type controls
          which public route will display the article.
        </p>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="post-type"
              className="text-sm font-semibold text-slate-700"
            >
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
            <label
              htmlFor="post-author-name"
              className="text-sm font-semibold text-slate-700"
            >
              Author Name <span className="text-red-600">*</span>
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

          <div className="md:col-span-2">
            <label
              htmlFor="post-title"
              className="text-sm font-semibold text-slate-700"
            >
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

          <div>
            <label
              htmlFor="post-slug"
              className="text-sm font-semibold text-slate-700"
            >
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

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Generated from the title until manually edited. A blank slug is
              also valid here; the backend can generate it during creation.
            </p>

            <PostFieldError message={getFieldError("slug")} />
          </div>

          <div>
            <label
              htmlFor="post-category"
              className="text-sm font-semibold text-slate-700"
            >
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

          <div className="md:col-span-2">
            <label
              htmlFor="post-excerpt"
              className="text-sm font-semibold text-slate-700"
            >
              Excerpt <span className="text-red-600">*</span>
            </label>

            <textarea
              id="post-excerpt"
              name="excerpt"
              value={formValues.excerpt}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              rows={4}
              placeholder="Write a concise summary for cards and listing pages."
              aria-invalid={Boolean(getFieldError("excerpt"))}
              className={textareaClasses}
            />

            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
              <span>Minimum 10 characters.</span>
              <span>{formValues.excerpt.length}/500</span>
            </div>

            <PostFieldError message={getFieldError("excerpt")} />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="post-content"
              className="text-sm font-semibold text-slate-700"
            >
              Article Content <span className="text-red-600">*</span>
            </label>

            <textarea
              id="post-content"
              name="content"
              value={formValues.content}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={50000}
              rows={18}
              placeholder="Write the complete article content..."
              aria-invalid={Boolean(getFieldError("content"))}
              className={textareaClasses}
            />

            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
              <span>Plain article content. Minimum 20 characters.</span>
              <span>{formValues.content.length}/50000</span>
            </div>

            <PostFieldError message={getFieldError("content")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Featured Media
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Article Image
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="post-featured-image-url"
              className="text-sm font-semibold text-slate-700"
            >
              Featured Image URL
            </label>

            <input
              id="post-featured-image-url"
              name="featuredImageUrl"
              type="url"
              value={formValues.featuredImageUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://example.com/article.jpg"
              aria-invalid={Boolean(getFieldError("featuredImageUrl"))}
              className={inputClasses}
            />

            <PostFieldError message={getFieldError("featuredImageUrl")} />
          </div>

          <div>
            <label
              htmlFor="post-featured-image-alt"
              className="text-sm font-semibold text-slate-700"
            >
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
            <div className="md:col-span-2">
              <p className="text-sm font-semibold text-slate-700">
                Image Preview
              </p>

              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img
                  key={formValues.featuredImageUrl}
                  src={formValues.featuredImageUrl}
                  alt={
                    formValues.featuredImageAlt ||
                    `${formValues.title || "Post"} preview`
                  }
                  className="max-h-80 w-full object-cover"
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
          Classification & Publishing
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Tags, Date and Reading Time
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="post-tags"
              className="text-sm font-semibold text-slate-700"
            >
              Tags
            </label>

            <textarea
              id="post-tags"
              name="tags"
              value={formValues.tags}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={5}
              placeholder={`mern
react
portfolio`}
              aria-invalid={Boolean(getFieldError("tags"))}
              className={textareaClasses}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Enter comma-separated values or one tag per line.
            </p>

            <PostFieldError message={getFieldError("tags")} />
          </div>

          <div>
            <label
              htmlFor="post-related-projects"
              className="text-sm font-semibold text-slate-700"
            >
              Related Projects
            </label>

            <select
              id="post-related-projects"
              name="relatedProjects"
              multiple
              size={6}
              value={formValues.relatedProjects}
              onChange={handleRelatedProjectsChange}
              disabled={isSubmitting || areProjectsLoading}
              aria-invalid={Boolean(getFieldError("relatedProjects"))}
              className={`${inputClasses} min-h-40 py-2`}
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

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {areProjectsLoading
                ? "Loading Projects..."
                : "Use Ctrl/Cmd to select multiple related Projects."}
            </p>

            <PostFieldError message={getFieldError("relatedProjects")} />
          </div>

          <div>
            <label
              htmlFor="post-published-at"
              className="text-sm font-semibold text-slate-700"
            >
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

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Optional metadata. Public visibility is controlled separately.
            </p>

            <PostFieldError message={getFieldError("publishedAt")} />
          </div>

          <div>
            <label
              htmlFor="post-reading-time"
              className="text-sm font-semibold text-slate-700"
            >
              Reading Time (minutes) <span className="text-red-600">*</span>
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
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Search Metadata
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Post SEO
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="post-seo-title"
              className="text-sm font-semibold text-slate-700"
            >
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

            <div className="mt-2 text-right text-xs text-slate-500">
              {formValues.seo.title.length}/70
            </div>

            <PostFieldError message={getFieldError("seo.title", "seo")} />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="post-seo-description"
              className="text-sm font-semibold text-slate-700"
            >
              SEO Description
            </label>

            <textarea
              id="post-seo-description"
              name="seo.description"
              value={formValues.seo.description}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={180}
              rows={4}
              placeholder="Optional search and social description"
              aria-invalid={Boolean(
                getFieldError("seo.description", "seo"),
              )}
              className={textareaClasses}
            />

            <div className="mt-2 text-right text-xs text-slate-500">
              {formValues.seo.description.length}/180
            </div>

            <PostFieldError
              message={getFieldError("seo.description", "seo")}
            />
          </div>

          <div>
            <label
              htmlFor="post-seo-keywords"
              className="text-sm font-semibold text-slate-700"
            >
              SEO Keywords
            </label>

            <textarea
              id="post-seo-keywords"
              name="seo.keywords"
              value={formValues.seo.keywords}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={5}
              placeholder={`mern developer
portfolio
web development`}
              aria-invalid={Boolean(
                getFieldError("seo.keywords", "seo"),
              )}
              className={textareaClasses}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Comma-separated values or one keyword per line.
            </p>

            <PostFieldError message={getFieldError("seo.keywords", "seo")} />
          </div>

          <div>
            <label
              htmlFor="post-seo-og-image"
              className="text-sm font-semibold text-slate-700"
            >
              Open Graph Image URL
            </label>

            <input
              id="post-seo-og-image"
              name="seo.ogImageUrl"
              type="url"
              value={formValues.seo.ogImageUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://example.com/social-image.jpg"
              aria-invalid={Boolean(
                getFieldError("seo.ogImageUrl", "seo"),
              )}
              className={inputClasses}
            />

            <PostFieldError
              message={getFieldError("seo.ogImageUrl", "seo")}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Publishing Controls
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Order, Featured and Visibility
        </h2>

        <div className="mt-7 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div>
            <label
              htmlFor="post-order"
              className="text-sm font-semibold text-slate-700"
            >
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
                  Allow this Post to appear in public Blog or News views.
                </span>
              </span>
            </label>

            <PostFieldError message={getFieldError("isVisible")} />

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
                  Featured Post
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Prioritise this Post in listing and homepage presentation.
                </span>
              </span>
            </label>

            <PostFieldError message={getFieldError("isFeatured")} />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/posts"
          onClick={(event) => {
            if (isSubmitting) {
              event.preventDefault();
            }
          }}
          aria-disabled={isSubmitting}
          tabIndex={isSubmitting ? -1 : undefined}
          className={`inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold transition ${
            isSubmitting
              ? "cursor-not-allowed text-slate-400 opacity-60"
              : "text-slate-700 hover:border-brand-300 hover:text-brand-600"
          }`}
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-7 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving Post..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default PostForm;
