import { useState } from "react";
import { Link } from "react-router";

import {
  createBrandPayload,
  createBrandSlug,
  createEmptyBrandStatistic,
  defaultBrandFormValues,
} from "../../../utils/brandForm";

const inputClasses =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100";

const textareaClasses =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100";

const brandTypeOptions = [
  {
    value: "personal",
    label: "Personal Brand",
  },
  {
    value: "creator",
    label: "Creator Brand",
  },
  {
    value: "business",
    label: "Business Brand",
  },
  {
    value: "product",
    label: "Product Brand",
  },
  {
    value: "media",
    label: "Media Brand",
  },
  {
    value: "education",
    label: "Education Brand",
  },
  {
    value: "community",
    label: "Community Brand",
  },
  {
    value: "other",
    label: "Other Brand",
  },
];

const statusOptions = [
  {
    value: "planned",
    label: "Planned",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
  {
    value: "archived",
    label: "Archived",
  },
];

const socialFields = [
  {
    name: "facebookUrl",
    key: "facebook",
    label: "Facebook URL",
    placeholder: "https://facebook.com/...",
  },
  {
    name: "instagramUrl",
    key: "instagram",
    label: "Instagram URL",
    placeholder: "https://instagram.com/...",
  },
  {
    name: "linkedinUrl",
    key: "linkedin",
    label: "LinkedIn URL",
    placeholder: "https://linkedin.com/...",
  },
  {
    name: "youtubeUrl",
    key: "youtube",
    label: "YouTube URL",
    placeholder: "https://youtube.com/@...",
  },
  {
    name: "tiktokUrl",
    key: "tiktok",
    label: "TikTok URL",
    placeholder: "https://tiktok.com/@...",
  },
  {
    name: "threadsUrl",
    key: "threads",
    label: "Threads URL",
    placeholder: "https://threads.net/@...",
  },
  {
    name: "xUrl",
    key: "x",
    label: "X URL",
    placeholder: "https://x.com/...",
  },
  {
    name: "githubUrl",
    key: "github",
    label: "GitHub URL",
    placeholder: "https://github.com/...",
  },
];

function validateBrandForm(formValues) {
  const errors = {};

  if (String(formValues.name || "").trim().length < 2) {
    errors.name = "Brand name must contain at least 2 characters.";
  }

  const finalSlug =
    createBrandSlug(formValues.slug) || createBrandSlug(formValues.name);

  if (finalSlug.length < 2) {
    errors.slug = "Brand slug must contain at least 2 characters.";
  }

  if (String(formValues.shortDescription || "").trim().length < 10) {
    errors.shortDescription =
      "Short description must contain at least 10 characters.";
  }

  const numericOrder = Number(formValues.order);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    errors.order = "Display order must be a non-negative number.";
  }

  const launchedYear = String(formValues.launchedYear || "").trim();

  if (launchedYear) {
    const numericLaunchedYear = Number(launchedYear);

    if (
      !Number.isInteger(numericLaunchedYear) ||
      numericLaunchedYear < 1800 ||
      numericLaunchedYear > 2200
    ) {
      errors.launchedYear = "Launch year must be between 1800 and 2200.";
    }
  }

  const statistics = Array.isArray(formValues.statistics)
    ? formValues.statistics
    : [];

  statistics.forEach((statistic, index) => {
    const label = String(statistic?.label || "").trim();

    const value = String(statistic?.value || "").trim();

    const hasStatisticData = Boolean(label || value);

    if (hasStatisticData && !label) {
      errors[`statistics.${index}.label`] = "Statistic label is required.";
    }

    if (hasStatisticData && !value) {
      errors[`statistics.${index}.value`] = "Statistic value is required.";
    }
  });

  return errors;
}

function BrandFieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm font-medium text-red-600">{message}</p>;
}

function BrandForm({
  initialValues = defaultBrandFormValues,

  onSubmit,

  submitLabel = "Save Brand",
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

      if (name === "name" && !isSlugManuallyEdited) {
        updatedValues.slug = createBrandSlug(value);
      }

      return updatedValues;
    });

    if (name === "slug") {
      setIsSlugManuallyEdited(Boolean(value.trim()));
    }

    clearFieldErrors(name);

    const socialFieldMap = {
      facebookUrl: "socialLinks.facebook",

      instagramUrl: "socialLinks.instagram",

      linkedinUrl: "socialLinks.linkedin",

      youtubeUrl: "socialLinks.youtube",

      tiktokUrl: "socialLinks.tiktok",

      threadsUrl: "socialLinks.threads",

      xUrl: "socialLinks.x",

      githubUrl: "socialLinks.github",
    };

    if (socialFieldMap[name]) {
      clearFieldErrors("socialLinks", socialFieldMap[name]);
    }

    const seoFieldMap = {
      seoTitle: "seo.title",

      seoDescription: "seo.description",

      seoKeywords: "seo.keywords",

      seoOgImageUrl: "seo.ogImageUrl",
    };

    if (seoFieldMap[name]) {
      clearFieldErrors("seo", seoFieldMap[name]);
    }

    setSubmitError("");
  }

  function handleSlugBlur() {
    setFormValues((currentValues) => ({
      ...currentValues,

      slug:
        createBrandSlug(currentValues.slug) ||
        createBrandSlug(currentValues.name),
    }));
  }

  function handleStatisticChange(index, fieldName, value) {
    setFormValues((currentValues) => ({
      ...currentValues,

      statistics: currentValues.statistics.map((statistic, statisticIndex) =>
        statisticIndex === index
          ? {
              ...statistic,
              [fieldName]: value,
            }
          : statistic,
      ),
    }));

    clearFieldErrors("statistics", `statistics.${index}.${fieldName}`);

    setSubmitError("");
  }

  function handleAddStatistic() {
    setFormValues((currentValues) => ({
      ...currentValues,

      statistics: [...currentValues.statistics, createEmptyBrandStatistic()],
    }));
  }

  function handleRemoveStatistic(index) {
    setFormValues((currentValues) => ({
      ...currentValues,

      statistics: currentValues.statistics.filter(
        (_statistic, statisticIndex) => statisticIndex !== index,
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

    const validationErrors = validateBrandForm(formValues);

    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);

      setServerErrors({});

      setSubmitError("Please correct the highlighted brand fields.");

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

      await onSubmit(createBrandPayload(formValues));
    } catch (error) {
      setServerErrors(error?.fieldErrors || {});

      setSubmitError(
        error instanceof Error ? error.message : "Brand could not be saved.",
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
          Add the brand name, public URL and complete brand description.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div>
            <label
              htmlFor="brand-name"
              className="text-sm font-semibold text-slate-700"
            >
              Brand name *
            </label>

            <input
              id="brand-name"
              name="name"
              type="text"
              value={formValues.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={150}
              placeholder="RakeshNexify"
              className={inputClasses}
            />

            <BrandFieldError message={getFieldError("name")} />
          </div>

          <div>
            <label
              htmlFor="brand-slug"
              className="text-sm font-semibold text-slate-700"
            >
              URL slug *
            </label>

            <input
              id="brand-slug"
              name="slug"
              type="text"
              value={formValues.slug}
              onChange={handleInputChange}
              onBlur={handleSlugBlur}
              disabled={isSubmitting}
              maxLength={160}
              placeholder="rakeshnexify"
              className={inputClasses}
            />

            <BrandFieldError message={getFieldError("slug")} />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="brand-tagline"
              className="text-sm font-semibold text-slate-700"
            >
              Brand tagline
            </label>

            <input
              id="brand-tagline"
              name="tagline"
              type="text"
              value={formValues.tagline}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={250}
              placeholder="Developer · Creator · Entrepreneur"
              className={inputClasses}
            />

            <BrandFieldError message={getFieldError("tagline")} />
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="brand-short-description"
            className="text-sm font-semibold text-slate-700"
          >
            Short description *
          </label>

          <textarea
            id="brand-short-description"
            name="shortDescription"
            value={formValues.shortDescription}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={3}
            maxLength={350}
            placeholder="Write a short description for the brand card."
            className={textareaClasses}
          />

          <div className="mt-2 flex items-start justify-between gap-4">
            <BrandFieldError message={getFieldError("shortDescription")} />

            <span className="ml-auto text-xs text-slate-400">
              {formValues.shortDescription.length}
              /350
            </span>
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="brand-description"
            className="text-sm font-semibold text-slate-700"
          >
            Full description
          </label>

          <textarea
            id="brand-description"
            name="description"
            value={formValues.description}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={8}
            maxLength={10000}
            placeholder="Explain the brand, its purpose, audience, content and long-term goals."
            className={textareaClasses}
          />

          <BrandFieldError message={getFieldError("description")} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Brand Details</h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="brand-category"
              className="text-sm font-semibold text-slate-700"
            >
              Category
            </label>

            <input
              id="brand-category"
              name="category"
              type="text"
              value={formValues.category}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={150}
              placeholder="Personal and Creator Brand"
              className={inputClasses}
            />

            <BrandFieldError message={getFieldError("category")} />
          </div>

          <div>
            <label
              htmlFor="brand-type"
              className="text-sm font-semibold text-slate-700"
            >
              Brand type
            </label>

            <select
              id="brand-type"
              name="brandType"
              value={formValues.brandType}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={inputClasses}
            >
              {brandTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <BrandFieldError
              message={getFieldError("brandType", "brand type")}
            />
          </div>

          <div>
            <label
              htmlFor="brand-status"
              className="text-sm font-semibold text-slate-700"
            >
              Brand status
            </label>

            <select
              id="brand-status"
              name="status"
              value={formValues.status}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={inputClasses}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <BrandFieldError
              message={getFieldError("status", "brand status")}
            />
          </div>

          <div>
            <label
              htmlFor="brand-launched-year"
              className="text-sm font-semibold text-slate-700"
            >
              Launch year
            </label>

            <input
              id="brand-launched-year"
              name="launchedYear"
              type="number"
              min="1800"
              max="2200"
              step="1"
              value={formValues.launchedYear}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="2026"
              className={inputClasses}
            />

            <BrandFieldError message={getFieldError("launchedYear")} />
          </div>

          <div>
            <label
              htmlFor="brand-role"
              className="text-sm font-semibold text-slate-700"
            >
              Your role
            </label>

            <input
              id="brand-role"
              name="role"
              type="text"
              value={formValues.role}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={200}
              placeholder="Founder, Developer and Content Creator"
              className={inputClasses}
            />

            <BrandFieldError message={getFieldError("role")} />
          </div>

          <div>
            <label
              htmlFor="brand-order"
              className="text-sm font-semibold text-slate-700"
            >
              Display order
            </label>

            <input
              id="brand-order"
              name="order"
              type="number"
              min="0"
              step="1"
              value={formValues.order}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={inputClasses}
            />

            <BrandFieldError message={getFieldError("order")} />
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
                Visitors can view the brand card and brand profile page.
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
                Featured brand
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Display this brand before standard brands.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Website and Media</h2>

        <div className="mt-6 grid gap-5">
          <div>
            <label
              htmlFor="brand-website"
              className="text-sm font-semibold text-slate-700"
            >
              Official website URL
            </label>

            <input
              id="brand-website"
              name="websiteUrl"
              type="url"
              value={formValues.websiteUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://example.com"
              className={inputClasses}
            />

            <BrandFieldError message={getFieldError("websiteUrl")} />
          </div>

          <div>
            <label
              htmlFor="brand-logo"
              className="text-sm font-semibold text-slate-700"
            >
              Brand logo URL
            </label>

            <input
              id="brand-logo"
              name="logoUrl"
              type="url"
              value={formValues.logoUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://..."
              className={inputClasses}
            />

            <BrandFieldError message={getFieldError("logoUrl")} />
          </div>

          <div>
            <label
              htmlFor="brand-cover-image"
              className="text-sm font-semibold text-slate-700"
            >
              Cover image URL
            </label>

            <input
              id="brand-cover-image"
              name="coverImageUrl"
              type="url"
              value={formValues.coverImageUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://..."
              className={inputClasses}
            />

            <BrandFieldError message={getFieldError("coverImageUrl")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Brand Content</h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter one item per line or separate multiple items using commas.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div>
            <label
              htmlFor="brand-focus-areas"
              className="text-sm font-semibold text-slate-700"
            >
              Focus areas
            </label>

            <textarea
              id="brand-focus-areas"
              name="focusAreas"
              value={formValues.focusAreas}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={7}
              placeholder={
                "Web Development\nCoding Education\nTechnology Content"
              }
              className={textareaClasses}
            />

            <BrandFieldError message={getFieldError("focusAreas")} />
          </div>

          <div>
            <label
              htmlFor="brand-platforms"
              className="text-sm font-semibold text-slate-700"
            >
              Platforms
            </label>

            <textarea
              id="brand-platforms"
              name="platforms"
              value={formValues.platforms}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={7}
              placeholder={"Website\nYouTube\nLinkedIn\nInstagram"}
              className={textareaClasses}
            />

            <BrandFieldError message={getFieldError("platforms")} />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="brand-highlights"
              className="text-sm font-semibold text-slate-700"
            >
              Brand highlights
            </label>

            <textarea
              id="brand-highlights"
              name="highlights"
              value={formValues.highlights}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={6}
              placeholder={
                "Official developer brand\nCoding and technology content\nProfessional service presence"
              }
              className={textareaClasses}
            />

            <BrandFieldError message={getFieldError("highlights")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Brand Statistics
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add verified brand numbers or important achievements.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddStatistic}
            disabled={isSubmitting}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            + Add Statistic
          </button>
        </div>

        {formValues.statistics.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No brand statistics added.
          </div>
        )}

        <div className="mt-5 space-y-4">
          {formValues.statistics.map((statistic, index) => (
            <div
              key={`brand-statistic-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-slate-900">
                  Statistic {index + 1}
                </h3>

                <button
                  type="button"
                  onClick={() => handleRemoveStatistic(index)}
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
                    value={statistic.label}
                    onChange={(event) =>
                      handleStatisticChange(index, "label", event.target.value)
                    }
                    disabled={isSubmitting}
                    placeholder="Followers"
                    className={inputClasses}
                  />

                  <BrandFieldError
                    message={getFieldError(
                      `statistics.${index}.label`,
                      "statistics",
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Value
                  </label>

                  <input
                    type="text"
                    value={statistic.value}
                    onChange={(event) =>
                      handleStatisticChange(index, "value", event.target.value)
                    }
                    disabled={isSubmitting}
                    placeholder="10K+"
                    className={inputClasses}
                  />

                  <BrandFieldError
                    message={getFieldError(`statistics.${index}.value`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Social Links</h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {socialFields.map((field) => (
            <div key={field.name}>
              <label
                htmlFor={`brand-${field.key}`}
                className="text-sm font-semibold text-slate-700"
              >
                {field.label}
              </label>

              <input
                id={`brand-${field.key}`}
                name={field.name}
                type="url"
                value={formValues[field.name]}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder={field.placeholder}
                className={inputClasses}
              />

              <BrandFieldError
                message={getFieldError(
                  `socialLinks.${field.key}`,
                  field.name,
                  "socialLinks",
                )}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">SEO Settings</h2>

        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="brand-seo-title"
              className="text-sm font-semibold text-slate-700"
            >
              SEO title
            </label>

            <input
              id="brand-seo-title"
              name="seoTitle"
              type="text"
              value={formValues.seoTitle}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={70}
              className={inputClasses}
            />

            <BrandFieldError
              message={getFieldError("seo.title", "seoTitle", "seo")}
            />
          </div>

          <div>
            <label
              htmlFor="brand-seo-description"
              className="text-sm font-semibold text-slate-700"
            >
              SEO description
            </label>

            <textarea
              id="brand-seo-description"
              name="seoDescription"
              value={formValues.seoDescription}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={3}
              maxLength={180}
              className={textareaClasses}
            />

            <BrandFieldError
              message={getFieldError(
                "seo.description",
                "seoDescription",
                "seo",
              )}
            />
          </div>

          <div>
            <label
              htmlFor="brand-seo-keywords"
              className="text-sm font-semibold text-slate-700"
            >
              SEO keywords
            </label>

            <textarea
              id="brand-seo-keywords"
              name="seoKeywords"
              value={formValues.seoKeywords}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={3}
              placeholder="brand name, creator brand, technology content"
              className={textareaClasses}
            />

            <BrandFieldError
              message={getFieldError("seo.keywords", "seoKeywords", "seo")}
            />
          </div>

          <div>
            <label
              htmlFor="brand-seo-image"
              className="text-sm font-semibold text-slate-700"
            >
              Social sharing image URL
            </label>

            <input
              id="brand-seo-image"
              name="seoOgImageUrl"
              type="url"
              value={formValues.seoOgImageUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://..."
              className={inputClasses}
            />

            <BrandFieldError
              message={getFieldError("seo.ogImageUrl", "seoOgImageUrl", "seo")}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/brands"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Saving brand..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default BrandForm;
