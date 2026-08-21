import { useState } from "react";
import { Link } from "react-router";

import MediaField from "../media/MediaField";

import {
  createServicePayload,
  createServiceSlug,
  defaultServiceFormValues,
} from "../../../utils/serviceForm";

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const characterCode = text.charCodeAt(index);

    if (characterCode <= 31 || characterCode === 127) {
      return true;
    }
  }

  return false;
}

function isSafeExternalServiceUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return true;
  }

  if (containsControlCharacters(url)) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    return (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    );
  } catch {
    return false;
  }
}

function validateServiceForm(formValues) {
  const errors = {};

  if (formValues.title.trim().length < 2) {
    errors.title = "Service title must contain at least 2 characters.";
  }

  const finalSlug =
    createServiceSlug(formValues.slug) || createServiceSlug(formValues.title);

  if (finalSlug.length < 2) {
    errors.slug = "Service slug must contain at least 2 characters.";
  }

  if (formValues.shortDescription.trim().length < 10) {
    errors.shortDescription =
      "Short description must contain at least 10 characters.";
  }

  if (!isSafeExternalServiceUrl(formValues.orderUrl)) {
    errors.orderUrl =
      "Use a complete http:// or https:// service URL without login credentials.";
  }

  const numericOrder = Number(formValues.order);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    errors.order = "Display order must be a non-negative number.";
  }

  return errors;
}

function ServiceFieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm font-medium text-red-600">{message}</p>;
}

function ServiceForm({
  initialValues = defaultServiceFormValues,
  onSubmit,
  submitLabel = "Save Service",
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
        updatedValues.slug = createServiceSlug(value);
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

    setSubmitError("");
  }

  function handleSlugBlur() {
    setFormValues((currentValues) => ({
      ...currentValues,
      slug:
        createServiceSlug(currentValues.slug) ||
        createServiceSlug(currentValues.title),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateServiceForm(formValues);

    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      setSubmitError("");
      return;
    }

    try {
      setIsSubmitting(true);
      setLocalErrors({});
      setServerErrors({});
      setSubmitError("");

      await onSubmit(createServicePayload(formValues));
    } catch (error) {
      setServerErrors(error?.fieldErrors || {});

      setSubmitError(
        error instanceof Error ? error.message : "Service could not be saved.",
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
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700"
        >
          {submitError}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Basic Information</h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Add the public title, URL slug and descriptions for this service.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div>
            <label
              htmlFor="service-title"
              className="text-sm font-semibold text-slate-700"
            >
              Service title *
            </label>

            <input
              id="service-title"
              name="title"
              type="text"
              value={formValues.title}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="MERN Stack Development"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ServiceFieldError message={getFieldError("title")} />
          </div>

          <div>
            <label
              htmlFor="service-slug"
              className="text-sm font-semibold text-slate-700"
            >
              URL slug *
            </label>

            <input
              id="service-slug"
              name="slug"
              type="text"
              value={formValues.slug}
              onChange={handleInputChange}
              onBlur={handleSlugBlur}
              disabled={isSubmitting}
              placeholder="mern-stack-development"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ServiceFieldError message={getFieldError("slug")} />
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="service-short-description"
            className="text-sm font-semibold text-slate-700"
          >
            Short description *
          </label>

          <textarea
            id="service-short-description"
            name="shortDescription"
            value={formValues.shortDescription}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={3}
            maxLength={300}
            placeholder="Briefly explain this service."
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
          />

          <div className="mt-2 flex items-start justify-between gap-4">
            <ServiceFieldError message={getFieldError("shortDescription")} />

            <span className="ml-auto text-xs text-slate-400">
              {formValues.shortDescription.length}
              /300
            </span>
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="service-description"
            className="text-sm font-semibold text-slate-700"
          >
            Full description
          </label>

          <textarea
            id="service-description"
            name="description"
            value={formValues.description}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={7}
            maxLength={5000}
            placeholder="Explain complete service details."
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
          />

          <ServiceFieldError message={getFieldError("description")} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">
          Features and Technologies
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter one item per line or separate multiple items using commas.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div>
            <label
              htmlFor="service-features"
              className="text-sm font-semibold text-slate-700"
            >
              Service features
            </label>

            <textarea
              id="service-features"
              name="features"
              value={formValues.features}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={7}
              placeholder={"Responsive frontend\nREST API\nAdmin dashboard"}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ServiceFieldError message={getFieldError("features")} />
          </div>

          <div>
            <label
              htmlFor="service-technologies"
              className="text-sm font-semibold text-slate-700"
            >
              Technologies
            </label>

            <textarea
              id="service-technologies"
              name="technologies"
              value={formValues.technologies}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={7}
              placeholder={"MongoDB\nExpress.js\nReact\nNode.js"}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ServiceFieldError message={getFieldError("technologies")} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Display Settings</h2>

        <div className="mt-6">
          <label
            htmlFor="service-order-url"
            className="text-sm font-semibold text-slate-700"
          >
            Idomere service/order URL
          </label>

          <input
            id="service-order-url"
            name="orderUrl"
            type="url"
            value={formValues.orderUrl}
            onChange={handleInputChange}
            disabled={isSubmitting}
            maxLength={500}
            placeholder="https://idomere.com/..."
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
          />

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Add the matching Idomere Technologies service or order page.
            Leave this empty to hide the public Order Service button.
          </p>

          <ServiceFieldError message={getFieldError("orderUrl")} />
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div>
            <label
              htmlFor="service-order"
              className="text-sm font-semibold text-slate-700"
            >
              Display order
            </label>

            <input
              id="service-order"
              name="order"
              type="number"
              min="0"
              step="1"
              value={formValues.order}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ServiceFieldError message={getFieldError("order")} />
          </div>

          <div>
            <label
              htmlFor="service-icon"
              className="text-sm font-semibold text-slate-700"
            >
              Icon name
            </label>

            <input
              id="service-icon"
              name="icon"
              type="text"
              value={formValues.icon}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="code"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />
          </div>

          <MediaField
            id="service-icon-url"
            name="iconUrl"
            label="Icon image URL"
            value={formValues.iconUrl}
            onChange={handleInputChange}
            accessToken={accessToken}
            allowedTypes={["image", "svg"]}
            pickerTitle="Choose Service Icon"
            placeholder="https://..."
            helpText="Paste an external icon URL or choose an image/SVG from the Media Library."
            error={getFieldError("iconUrl")}
            disabled={isSubmitting}
            onUnauthorized={onMediaUnauthorized}
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                Public visitors can see this service.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
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
                Featured service
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Highlight this service on the website.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">SEO Settings</h2>

        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="service-seo-title"
              className="text-sm font-semibold text-slate-700"
            >
              SEO title
            </label>

            <input
              id="service-seo-title"
              name="seoTitle"
              type="text"
              value={formValues.seoTitle}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={70}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ServiceFieldError
              message={getFieldError("seo.title", "seoTitle", "seo")}
            />
          </div>

          <div>
            <label
              htmlFor="service-seo-description"
              className="text-sm font-semibold text-slate-700"
            >
              SEO description
            </label>

            <textarea
              id="service-seo-description"
              name="seoDescription"
              value={formValues.seoDescription}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={3}
              maxLength={180}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ServiceFieldError
              message={getFieldError(
                "seo.description",
                "seoDescription",
                "seo",
              )}
            />
          </div>

          <div>
            <label
              htmlFor="service-seo-keywords"
              className="text-sm font-semibold text-slate-700"
            >
              SEO keywords
            </label>

            <textarea
              id="service-seo-keywords"
              name="seoKeywords"
              value={formValues.seoKeywords}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={3}
              placeholder="mern development, react developer"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <ServiceFieldError
              message={getFieldError("seo.keywords", "seoKeywords", "seo")}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/services"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Saving service..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default ServiceForm;
