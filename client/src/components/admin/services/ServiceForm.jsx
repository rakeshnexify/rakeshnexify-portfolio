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

  return <p className="mt-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">{message}</p>;
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
    <form onSubmit={handleSubmit} noValidate className="rnx-admin-service-form-v489 rnx-admin-service-form-balanced-v490 space-y-2">
      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 xl:col-span-2"
        >
          {submitError}
        </div>
      )}

            <div className="space-y-2 xl:columns-2 xl:gap-2 xl:space-y-0">
<section className="h-fit break-inside-avoid rounded-xl border border-slate-200 xl:mb-2 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <h2 className="text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">Basic Information</h2>

        <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
          Add the public title, URL slug and descriptions for this service.
        </p>

        <div className="mt-2 grid gap-2 lg:grid-cols-2">
          <div>
            <label
              htmlFor="service-title"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
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
              className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm"
            />

            <ServiceFieldError message={getFieldError("title")} />
          </div>

          <div>
            <label
              htmlFor="service-slug"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
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
              className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm"
            />

            <ServiceFieldError message={getFieldError("slug")} />
          </div>
        </div>

        <div className="mt-2">
          <label
            htmlFor="service-short-description"
            className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
          >
            Short description *
          </label>

          <textarea
            id="service-short-description"
            name="shortDescription"
            value={formValues.shortDescription}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={2}
            maxLength={300}
            placeholder="Briefly explain this service."
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm"
          />

          <div className="mt-0.5 flex items-start justify-between gap-2">
            <ServiceFieldError message={getFieldError("shortDescription")} />

            <span className="ml-auto text-[9px] text-slate-400 sm:text-[10px]">
              {formValues.shortDescription.length}
              /300
            </span>
          </div>
        </div>

        <div className="mt-2">
          <label
            htmlFor="service-description"
            className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
          >
            Full description
          </label>

          <textarea
            id="service-description"
            name="description"
            value={formValues.description}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={3}
            maxLength={5000}
            placeholder="Explain complete service details."
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm"
          />

          <ServiceFieldError message={getFieldError("description")} />
        </div>
      </section>

      <section className="h-fit break-inside-avoid rounded-xl border border-slate-200 xl:mb-2 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <h2 className="text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">
          Features and Technologies
        </h2>

        <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
          Enter one item per line or separate multiple items using commas.
        </p>

        <div className="mt-2 grid gap-2 lg:grid-cols-2">
          <div>
            <label
              htmlFor="service-features"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Service features
            </label>

            <textarea
              id="service-features"
              name="features"
              value={formValues.features}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={3}
              placeholder={"Responsive frontend\nREST API\nAdmin dashboard"}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm"
            />

            <ServiceFieldError message={getFieldError("features")} />
          </div>

          <div>
            <label
              htmlFor="service-technologies"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Technologies
            </label>

            <textarea
              id="service-technologies"
              name="technologies"
              value={formValues.technologies}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={3}
              placeholder={"MongoDB\nExpress.js\nReact\nNode.js"}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm"
            />

            <ServiceFieldError message={getFieldError("technologies")} />
          </div>
        </div>
      </section>

      <section className="h-fit break-inside-avoid rounded-xl border border-slate-200 xl:mb-2 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <h2 className="text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">Display Settings</h2>

        <div className="mt-2">
          <label
            htmlFor="service-order-url"
            className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
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
            className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm"
          />

          <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
            Add the matching Idomere Technologies service or order page.
            Leave this empty to hide the public Order Service button.
          </p>

          <ServiceFieldError message={getFieldError("orderUrl")} />
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div>
            <label
              htmlFor="service-order"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
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
              className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm"
            />

            <ServiceFieldError message={getFieldError("order")} />
          </div>

          <div>
            <label
              htmlFor="service-icon"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
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
              className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm"
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

      <details className="group h-fit break-inside-avoid rounded-xl border border-slate-200 xl:mb-2 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between px-3 text-[11px] font-bold text-slate-800 marker:hidden dark:text-slate-200">
          <span>SEO Settings</span>
          <span className="text-[9px] font-semibold text-slate-400">Advanced</span>
        </summary>
        <div className="border-t border-slate-200 p-2.5 dark:border-slate-800">

        <div className="mt-2 space-y-1.5">
          <div>
            <label
              htmlFor="service-seo-title"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
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
              className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm"
            />

            <ServiceFieldError
              message={getFieldError("seo.title", "seoTitle", "seo")}
            />
          </div>

          <div>
            <label
              htmlFor="service-seo-description"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              SEO description
            </label>

            <textarea
              id="service-seo-description"
              name="seoDescription"
              value={formValues.seoDescription}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={2}
              maxLength={180}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm"
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
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              SEO keywords
            </label>

            <textarea
              id="service-seo-keywords"
              name="seoKeywords"
              value={formValues.seoKeywords}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={2}
              placeholder="mern development, react developer"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm"
            />

            <ServiceFieldError
              message={getFieldError("seo.keywords", "seoKeywords", "seo")}
            />
          </div>
        </div>
        </div>
      </details>
      </div>

<div className="sticky bottom-2 z-20 flex flex-col-reverse gap-1.5 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:flex-row sm:items-center sm:justify-end xl:col-span-2">
        <Link
          to="/admin/services"
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-[11px] font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-4 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:px-5 sm:text-xs"
        >
          {isSubmitting ? "Saving service..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default ServiceForm;
