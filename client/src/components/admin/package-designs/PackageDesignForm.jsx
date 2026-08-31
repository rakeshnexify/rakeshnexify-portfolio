import { useMemo, useState } from "react";
import { Link } from "react-router";

import MediaField from "../media/MediaField";

import {
  PACKAGE_DESIGN_MAX_SCREENSHOTS,
  createEmptyPackageDesignScreenshot,
  createPackageDesignPayload,
  createPackageDesignSlug,
  getPackageDesignPackageLabel,
  packageDesignDevices,
  validatePackageDesignForm,
} from "../../../utils/packageDesignForm";

const inputClasses =
  "mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm";

const textareaClasses =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm";

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">{message}</p>;
}

function PackageDesignForm({
  initialValues,
  servicePackages = [],
  onSubmit,
  submitLabel = "Save Package Design",
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

  const sortedServicePackages = useMemo(
    () =>
      [...servicePackages].sort((left, right) =>
        getPackageDesignPackageLabel(left).localeCompare(
          getPackageDesignPackageLabel(right),
        ),
      ),
    [servicePackages],
  );

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
      const nextErrors = { ...currentErrors };

      Object.keys(nextErrors).forEach((key) => {
        if (
          fieldNames.some(
            (fieldName) =>
              key === fieldName || key.startsWith(`${fieldName}.`),
          )
        ) {
          delete nextErrors[key];
        }
      });

      return nextErrors;
    }

    setLocalErrors(clearErrors);
    setServerErrors(clearErrors);
  }

  function handleInputChange(event, selectedMedia = null) {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setFormValues((currentValues) => {
      const nextValues = {
        ...currentValues,
        [name]: nextValue,
      };

      if (name === "name" && !isSlugManuallyEdited) {
        nextValues.slug = createPackageDesignSlug(value);
      }

      if (
        name === "thumbnailUrl" &&
        String(selectedMedia?.altText || "").trim() &&
        !String(currentValues.thumbnailAlt || "").trim()
      ) {
        nextValues.thumbnailAlt = String(selectedMedia.altText).trim();
      }

      return nextValues;
    });

    if (name === "slug") {
      setIsSlugManuallyEdited(Boolean(value.trim()));
    }

    clearFieldErrors(name);
    setSubmitError("");
  }

  function handleSlugBlur() {
    setFormValues((currentValues) => ({
      ...currentValues,
      slug:
        createPackageDesignSlug(currentValues.slug) ||
        createPackageDesignSlug(currentValues.name),
    }));
  }

  function handleScreenshotChange(index, fieldName, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      screenshots: currentValues.screenshots.map((screenshot, itemIndex) =>
        itemIndex === index
          ? {
              ...screenshot,
              [fieldName]: value,
            }
          : screenshot,
      ),
    }));

    clearFieldErrors(`screenshots.${index}.${fieldName}`, "screenshots");
    setSubmitError("");
  }

  function handleScreenshotUrlChange(index, nextUrl, selectedMedia = null) {
    setFormValues((currentValues) => ({
      ...currentValues,
      screenshots: currentValues.screenshots.map((screenshot, itemIndex) => {
        if (itemIndex !== index) {
          return screenshot;
        }

        const nextScreenshot = {
          ...screenshot,
          url: nextUrl,
        };

        if (
          String(selectedMedia?.altText || "").trim() &&
          !String(screenshot.alt || "").trim()
        ) {
          nextScreenshot.alt = String(selectedMedia.altText).trim();
        }

        return nextScreenshot;
      }),
    }));

    clearFieldErrors(`screenshots.${index}.url`, "screenshots");
    setSubmitError("");
  }

  function handleAddScreenshot() {
    if (formValues.screenshots.length >= PACKAGE_DESIGN_MAX_SCREENSHOTS) {
      setLocalErrors((currentErrors) => ({
        ...currentErrors,
        screenshots: `A design can contain at most ${PACKAGE_DESIGN_MAX_SCREENSHOTS} screenshots.`,
      }));

      return;
    }

    setFormValues((currentValues) => ({
      ...currentValues,
      screenshots: [
        ...currentValues.screenshots,
        createEmptyPackageDesignScreenshot(currentValues.screenshots.length),
      ],
    }));

    clearFieldErrors("screenshots");
  }

  function handleRemoveScreenshot(index) {
    setFormValues((currentValues) => {
      const nextScreenshots = currentValues.screenshots.filter(
        (_, itemIndex) => itemIndex !== index,
      );

      return {
        ...currentValues,
        screenshots:
          nextScreenshots.length > 0
            ? nextScreenshots.map((screenshot, itemIndex) => ({
                ...screenshot,
                order: String(itemIndex),
              }))
            : [createEmptyPackageDesignScreenshot(0)],
      };
    });

    setLocalErrors({});
    setServerErrors({});
    setSubmitError("");
  }

  function handleMoveScreenshot(index, direction) {
    setFormValues((currentValues) => {
      const targetIndex = index + direction;

      if (
        targetIndex < 0 ||
        targetIndex >= currentValues.screenshots.length
      ) {
        return currentValues;
      }

      const nextScreenshots = [...currentValues.screenshots];
      const [screenshot] = nextScreenshots.splice(index, 1);

      nextScreenshots.splice(targetIndex, 0, screenshot);

      return {
        ...currentValues,
        screenshots: nextScreenshots.map((item, itemIndex) => ({
          ...item,
          order: String(itemIndex),
        })),
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validatePackageDesignForm(formValues);

    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      setServerErrors({});
      setSubmitError("");
      return;
    }

    try {
      setIsSubmitting(true);
      setLocalErrors({});
      setServerErrors({});
      setSubmitError("");

      await onSubmit(createPackageDesignPayload(formValues));
    } catch (error) {
      setServerErrors(error?.fieldErrors || {});
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Package Design could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rnx-admin-package-design-form-v489 rnx-admin-package-design-form-balanced-v490 space-y-2">
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
        <h2 className="text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">
          Package and Design Identity
        </h2>

        <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
          A design belongs to one existing Service Package. Service context is
          derived from that package automatically.
        </p>

        <div className="mt-2">
          <label
            htmlFor="package-design-service-package"
            className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
          >
            Service Package *
          </label>

          <select
            id="package-design-service-package"
            name="servicePackage"
            value={formValues.servicePackage}
            onChange={handleInputChange}
            disabled={isSubmitting}
            className={inputClasses}
          >
            <option value="">Choose a Service Package</option>

            {sortedServicePackages.map((servicePackage) => (
              <option key={servicePackage._id} value={servicePackage._id}>
                {getPackageDesignPackageLabel(servicePackage)}
                {servicePackage.isVisible === false ? " — Hidden" : ""}
              </option>
            ))}
          </select>

          <FieldError message={getFieldError("servicePackage")} />

          {sortedServicePackages.length === 0 && (
            <p className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] leading-4 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
              No Service Packages are available yet. Create a Service Package
              first, then return to this editor.
            </p>
          )}
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div>
            <label
              htmlFor="package-design-name"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Design name *
            </label>

            <input
              id="package-design-name"
              name="name"
              value={formValues.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={140}
              placeholder="Modern Store"
              className={inputClasses}
            />

            <FieldError message={getFieldError("name")} />
          </div>

          <div>
            <label
              htmlFor="package-design-slug"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Design slug *
            </label>

            <input
              id="package-design-slug"
              name="slug"
              value={formValues.slug}
              onChange={handleInputChange}
              onBlur={handleSlugBlur}
              disabled={isSubmitting}
              maxLength={160}
              placeholder="modern-store"
              className={inputClasses}
            />

            <FieldError message={getFieldError("slug")} />
          </div>
        </div>

        <div className="mt-2">
          <label
            htmlFor="package-design-short-description"
            className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
          >
            Short description *
          </label>

          <textarea
            id="package-design-short-description"
            name="shortDescription"
            value={formValues.shortDescription}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={2}
            maxLength={500}
            placeholder="Briefly explain this design and who it suits."
            className={textareaClasses}
          />

          <div className="mt-0.5 flex items-start justify-between gap-2">
            <FieldError message={getFieldError("shortDescription")} />
            <span className="ml-auto text-[9px] text-slate-400 sm:text-[10px]">
              {formValues.shortDescription.length}/500
            </span>
          </div>
        </div>

        <div className="mt-2">
          <label
            htmlFor="package-design-description"
            className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
          >
            Full description
          </label>

          <textarea
            id="package-design-description"
            name="description"
            value={formValues.description}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={2}
            maxLength={5000}
            placeholder="Add complete visual style, layout and design notes."
            className={textareaClasses}
          />

          <FieldError message={getFieldError("description")} />
        </div>
      </section>

      <section className="h-fit break-inside-avoid rounded-xl border border-slate-200 xl:mb-2 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <h2 className="text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">Thumbnail</h2>

        <div className="mt-2 grid gap-2 lg:grid-cols-2">
          <MediaField
            id="package-design-thumbnail-url"
            name="thumbnailUrl"
            label="Thumbnail URL"
            value={formValues.thumbnailUrl}
            onChange={handleInputChange}
            accessToken={accessToken}
            allowedTypes={["image", "svg"]}
            pickerTitle="Choose Package Design Thumbnail"
            placeholder="https://..."
            helpText="Paste an external URL or choose an image/SVG from Media. Selected Media alt text fills the alt field only when it is blank."
            error={getFieldError("thumbnailUrl")}
            disabled={isSubmitting}
            onUnauthorized={onMediaUnauthorized}
          />

          <div>
            <label
              htmlFor="package-design-thumbnail-alt"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Thumbnail alt text
            </label>

            <input
              id="package-design-thumbnail-alt"
              name="thumbnailAlt"
              value={formValues.thumbnailAlt}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={220}
              placeholder="Modern ecommerce website design preview"
              className={inputClasses}
            />

            <FieldError message={getFieldError("thumbnailAlt")} />
          </div>
        </div>

        {formValues.thumbnailUrl && (
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60">
            <img
              src={formValues.thumbnailUrl}
              alt={formValues.thumbnailAlt || "Package Design thumbnail preview"}
              className="h-24 w-full object-cover sm:h-28"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}
      </section>

      <section className="h-fit break-inside-avoid rounded-xl border border-slate-200 xl:mb-2 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">Screenshots</h2>
            <p className="mt-0.5 max-w-3xl text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
              Add desktop, tablet and mobile previews. Screenshot URLs must be
              unique within this design.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddScreenshot}
            disabled={
              isSubmitting ||
              formValues.screenshots.length >= PACKAGE_DESIGN_MAX_SCREENSHOTS
            }
            className="inline-flex min-h-8 items-center justify-center rounded-lg border border-brand-200 bg-brand-50 px-2.5 text-[10px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300"
          >
            + Add Screenshot
          </button>
        </div>

        <FieldError message={getFieldError("screenshots")} />

        <div className="mt-2 space-y-1.5">
          {formValues.screenshots.map((screenshot, index) => (
            <article
              key={screenshot.clientKey}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Screenshot {index + 1}
                  </p>
                  <p className="mt-1 text-xs capitalize text-slate-400">
                    {screenshot.device} preview
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMoveScreenshot(index, -1)}
                    disabled={isSubmitting || index === 0}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↑ Up
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveScreenshot(index, 1)}
                    disabled={
                      isSubmitting || index === formValues.screenshots.length - 1
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↓ Down
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveScreenshot(index)}
                    disabled={isSubmitting}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <MediaField
                  id={`package-design-screenshot-url-${index}`}
                  name={`screenshot-url-${index}`}
                  label="Screenshot URL"
                  value={screenshot.url}
                  onChange={(event, selectedMedia) =>
                    handleScreenshotUrlChange(
                      index,
                      event.target.value,
                      selectedMedia,
                    )
                  }
                  accessToken={accessToken}
                  allowedTypes={["image", "svg"]}
                  pickerTitle={`Choose Screenshot ${index + 1}`}
                  placeholder="https://..."
                  helpText="Paste an external image URL or choose compatible Media."
                  error={getFieldError(`screenshots.${index}.url`)}
                  disabled={isSubmitting}
                  onUnauthorized={onMediaUnauthorized}
                />

                <div>
                  <label
                    htmlFor={`package-design-screenshot-alt-${index}`}
                    className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
                  >
                    Alt text
                  </label>
                  <input
                    id={`package-design-screenshot-alt-${index}`}
                    value={screenshot.alt}
                    onChange={(event) =>
                      handleScreenshotChange(index, "alt", event.target.value)
                    }
                    disabled={isSubmitting}
                    maxLength={220}
                    placeholder="Desktop homepage preview"
                    className={inputClasses}
                  />
                  <FieldError
                    message={getFieldError(`screenshots.${index}.alt`)}
                  />
                </div>
              </div>

              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <div>
                  <label
                    htmlFor={`package-design-screenshot-device-${index}`}
                    className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
                  >
                    Device
                  </label>
                  <select
                    id={`package-design-screenshot-device-${index}`}
                    value={screenshot.device}
                    onChange={(event) =>
                      handleScreenshotChange(
                        index,
                        "device",
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                    className={inputClasses}
                  >
                    {packageDesignDevices.map((device) => (
                      <option key={device.value} value={device.value}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    message={getFieldError(`screenshots.${index}.device`)}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`package-design-screenshot-order-${index}`}
                    className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
                  >
                    Order
                  </label>
                  <input
                    id={`package-design-screenshot-order-${index}`}
                    type="number"
                    min="0"
                    max="1000000"
                    step="1"
                    value={screenshot.order}
                    onChange={(event) =>
                      handleScreenshotChange(
                        index,
                        "order",
                        event.target.value,
                      )
                    }
                    disabled={isSubmitting}
                    className={inputClasses}
                  />
                  <FieldError
                    message={getFieldError(`screenshots.${index}.order`)}
                  />
                </div>
              </div>

              {screenshot.url && (
                <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <img
                    src={screenshot.url}
                    alt={screenshot.alt || `Screenshot ${index + 1} preview`}
                    className="max-h-72 w-full object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="h-fit break-inside-avoid rounded-xl border border-slate-200 xl:mb-2 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <h2 className="text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">Live Demo</h2>
        <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
          Live Demo is a normal website URL, so it stays a standard HTTP/HTTPS
          field rather than a Media asset.
        </p>

        <div className="mt-2 grid gap-2 lg:grid-cols-2">
          <div>
            <label
              htmlFor="package-design-live-demo-url"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Live demo URL
            </label>
            <input
              id="package-design-live-demo-url"
              name="liveDemoUrl"
              type="url"
              value={formValues.liveDemoUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://demo.example.com"
              className={inputClasses}
            />
            <FieldError message={getFieldError("liveDemoUrl")} />
          </div>

          <div>
            <label
              htmlFor="package-design-live-demo-label"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Live demo label
            </label>
            <input
              id="package-design-live-demo-label"
              name="liveDemoLabel"
              value={formValues.liveDemoLabel}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={80}
              placeholder="Live Demo"
              className={inputClasses}
            />
            <FieldError message={getFieldError("liveDemoLabel")} />
          </div>
        </div>

        {formValues.liveDemoUrl && (
          <a
            href={formValues.liveDemoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
          >
            Open Current Demo ↗
          </a>
        )}
      </section>

      <section className="h-fit break-inside-avoid rounded-xl border border-slate-200 xl:mb-2 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <h2 className="text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">
          Publication Controls
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-[0.55fr_1fr]">
          <div>
            <label
              htmlFor="package-design-order"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Display order
            </label>
            <input
              id="package-design-order"
              name="order"
              type="number"
              min="0"
              max="1000000"
              step="1"
              value={formValues.order}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={inputClasses}
            />
            <FieldError message={getFieldError("order")} />
          </div>

          <div className="grid gap-1.5 sm:grid-cols-3">
            {[
              [
                "isDefault",
                "Default Design",
                "Prefer this design first for the selected Service Package.",
              ],
              [
                "isFeatured",
                "Featured",
                "Highlight this design ahead of standard designs.",
              ],
              [
                "isVisible",
                "Visible",
                "Allow public visitors to see this design when its parents are visible.",
              ],
            ].map(([name, label, description]) => (
              <label
                key={name}
                className="flex cursor-pointer gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950/60"
              >
                <input
                  name={name}
                  type="checkbox"
                  checked={Boolean(formValues[name])}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="mt-1 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="block text-[10px] font-bold text-slate-800 dark:text-slate-200 sm:text-[11px]">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-[8px] leading-3 text-slate-500 dark:text-slate-400 sm:text-[9px]">
                    {description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <FieldError message={getFieldError("isDefault")} />
      </section>
      </div>

<div className="sticky bottom-2 z-20 flex flex-col-reverse gap-1.5 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:flex-row sm:items-center sm:justify-end xl:col-span-2">
        <Link
          to="/admin/package-designs"
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-[11px] font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting || sortedServicePackages.length === 0}
          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-4 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:px-5 sm:text-xs"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default PackageDesignForm;
