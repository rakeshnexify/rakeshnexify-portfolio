import { useMemo, useState } from "react";
import { Link } from "react-router";

import {
  billingCycles,
  createEmptyFeature,
  createFeatureKey,
  createServicePackagePayload,
  createServicePackageSlug,
  pricingModes,
  servicePackageGroups,
  validateServicePackageForm,
} from "../../../utils/servicePackageForm";

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-0.5 text-[10px] font-medium text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

function ServicePackageForm({
  initialValues,
  services,
  servicesLoading = false,
  onSubmit,
  submitLabel = "Save Package",
}) {
  const [formValues, setFormValues] = useState(initialValues);
  const [localErrors, setLocalErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(
    Boolean(initialValues.slug),
  );

  const sortedServices = useMemo(
    () =>
      [...(Array.isArray(services) ? services : [])].sort((left, right) => {
        const orderDifference =
          Number(left?.order || 0) - Number(right?.order || 0);

        if (orderDifference !== 0) {
          return orderDifference;
        }

        return String(left?.title || "").localeCompare(
          String(right?.title || ""),
        );
      }),
    [services],
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
      const nextErrors = { ...currentErrors };

      fieldNames.forEach((fieldName) => {
        delete nextErrors[fieldName];
      });

      return nextErrors;
    });

    setServerErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      fieldNames.forEach((fieldName) => {
        delete nextErrors[fieldName];
      });

      return nextErrors;
    });
  }

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setFormValues((currentValues) => {
      const nextValues = {
        ...currentValues,
        [name]: nextValue,
      };

      if (name === "name" && !isSlugManuallyEdited) {
        nextValues.slug = createServicePackageSlug(value);
      }

      if (
        name === "pricingMode" &&
        value === "custom" &&
        currentValues.price === "0"
      ) {
        nextValues.price = "";
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
        createServicePackageSlug(currentValues.slug) ||
        createServicePackageSlug(currentValues.name),
    }));
  }

  function handleFeatureChange(index, fieldName, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      features: currentValues.features.map((feature, featureIndex) => {
        if (featureIndex !== index) {
          return feature;
        }

        const nextFeature = {
          ...feature,
          [fieldName]: value,
        };

        if (fieldName === "label" && !feature.key.trim()) {
          nextFeature.key = createFeatureKey(value);
        }

        return nextFeature;
      }),
    }));

    clearFieldErrors(
      `features.${index}.${fieldName}`,
      "features",
    );

    setSubmitError("");
  }

  function handleAddFeature() {
    setFormValues((currentValues) => ({
      ...currentValues,
      features: [
        ...currentValues.features,
        createEmptyFeature(currentValues.features.length + 1),
      ],
    }));
  }

  function handleRemoveFeature(index) {
    setFormValues((currentValues) => {
      const remainingFeatures = currentValues.features.filter(
        (_, featureIndex) => featureIndex !== index,
      );

      return {
        ...currentValues,
        features:
          remainingFeatures.length > 0
            ? remainingFeatures.map((feature, featureIndex) => ({
                ...feature,
                order: String(featureIndex + 1),
              }))
            : [createEmptyFeature(1)],
      };
    });

    setLocalErrors({});
    setServerErrors({});
    setSubmitError("");
  }

  function handleMoveFeature(index, direction) {
    setFormValues((currentValues) => {
      const targetIndex = index + direction;

      if (
        targetIndex < 0 ||
        targetIndex >= currentValues.features.length
      ) {
        return currentValues;
      }

      const nextFeatures = [...currentValues.features];
      const [feature] = nextFeatures.splice(index, 1);

      nextFeatures.splice(targetIndex, 0, feature);

      return {
        ...currentValues,
        features: nextFeatures.map((item, featureIndex) => ({
          ...item,
          order: String(featureIndex + 1),
        })),
      };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateServicePackageForm(formValues);

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

      await onSubmit(createServicePackagePayload(formValues));
    } catch (error) {
      setServerErrors(error?.fieldErrors || {});

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Service Package could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rnx-admin-service-package-form-v489 rnx-admin-service-package-form-balanced-v490 space-y-2">
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
          Package Identity
        </h2>

        <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
          Connect this package to an existing Service and define the package
          group and public identity.
        </p>

        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div>
            <label
              htmlFor="service-package-service"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Parent Service *
            </label>

            <select
              id="service-package-service"
              name="service"
              value={formValues.service}
              onChange={handleInputChange}
              disabled={isSubmitting || servicesLoading}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            >
              <option value="">
                {servicesLoading ? "Loading services..." : "Choose a Service"}
              </option>

              {sortedServices.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.title}
                  {service.isVisible === false ? " — Hidden" : ""}
                </option>
              ))}
            </select>

            <FieldError message={getFieldError("service")} />
          </div>

          <div>
            <label
              htmlFor="service-package-group"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Package group *
            </label>

            <select
              id="service-package-group"
              name="group"
              value={formValues.group}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            >
              {servicePackageGroups.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>

            <FieldError message={getFieldError("group")} />
          </div>

          <div>
            <label
              htmlFor="service-package-name"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Package name *
            </label>

            <input
              id="service-package-name"
              name="name"
              value={formValues.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Professional"
              className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm"
            />

            <FieldError message={getFieldError("name")} />
          </div>

          <div>
            <label
              htmlFor="service-package-slug"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Package slug
            </label>

            <input
              id="service-package-slug"
              name="slug"
              value={formValues.slug}
              onChange={handleInputChange}
              onBlur={handleSlugBlur}
              disabled={isSubmitting}
              placeholder="professional"
              className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm"
            />

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Slug uniqueness is scoped to the selected Service and package
              group.
            </p>

            <FieldError message={getFieldError("slug")} />
          </div>
        </div>

        <div className="mt-2">
          <label
            htmlFor="service-package-short-description"
            className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
          >
            Short description *
          </label>

          <textarea
            id="service-package-short-description"
            name="shortDescription"
            value={formValues.shortDescription}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={2}
            placeholder="Explain the main value of this package."
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm"
          />

          <FieldError message={getFieldError("shortDescription")} />
        </div>

        <div className="mt-2">
          <label
            htmlFor="service-package-description"
            className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
          >
            Full description
          </label>

          <textarea
            id="service-package-description"
            name="description"
            value={formValues.description}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={2}
            placeholder="Add complete package details, scope and expectations."
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:px-3 sm:py-2 sm:text-sm"
          />

          <FieldError message={getFieldError("description")} />
        </div>
      </section>

      <section className="h-fit break-inside-avoid rounded-xl border border-slate-200 xl:mb-2 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <h2 className="text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">
          Pricing and Billing
        </h2>

        <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 dark:text-slate-400 sm:text-[10px]">
          Configure development, recurring management or custom pricing
          without creating a separate pricing domain.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label
              htmlFor="service-package-pricing-mode"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Pricing mode *
            </label>

            <select
              id="service-package-pricing-mode"
              name="pricingMode"
              value={formValues.pricingMode}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            >
              {pricingModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>

            <FieldError message={getFieldError("pricingMode")} />
          </div>

          <div>
            <label
              htmlFor="service-package-price"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Price {formValues.pricingMode === "custom" ? "(optional)" : "*"}
            </label>

            <input
              id="service-package-price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formValues.price}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="25000"
              className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm"
            />

            <FieldError message={getFieldError("price")} />
          </div>

          <div>
            <label
              htmlFor="service-package-currency"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Currency *
            </label>

            <input
              id="service-package-currency"
              name="currency"
              value={formValues.currency}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="NPR"
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 uppercase text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            />

            <FieldError message={getFieldError("currency")} />
          </div>

          <div>
            <label
              htmlFor="service-package-price-label"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Price label
            </label>

            <input
              id="service-package-price-label"
              name="priceLabel"
              value={formValues.priceLabel}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Starting package"
              className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm"
            />

            <FieldError message={getFieldError("priceLabel")} />
          </div>

          <div>
            <label
              htmlFor="service-package-billing-cycle"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Billing cycle *
            </label>

            <select
              id="service-package-billing-cycle"
              name="billingCycle"
              value={formValues.billingCycle}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            >
              {billingCycles.map((cycle) => (
                <option key={cycle.value} value={cycle.value}>
                  {cycle.label}
                </option>
              ))}
            </select>

            <FieldError message={getFieldError("billingCycle")} />
          </div>

          <div>
            <label
              htmlFor="service-package-billing-label"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Billing label
            </label>

            <input
              id="service-package-billing-label"
              name="billingLabel"
              value={formValues.billingLabel}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Per month / One-time payment"
              className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm"
            />

            <FieldError message={getFieldError("billingLabel")} />
          </div>
        </div>
      </section>

      <section className="h-fit break-inside-avoid rounded-xl border border-slate-200 xl:mb-2 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">
              Comparison Features
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Use consistent feature keys across packages so the public pricing
              table can align rows correctly.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddFeature}
            disabled={isSubmitting}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            + Add Feature
          </button>
        </div>

        <FieldError message={getFieldError("features")} />

        <div className="mt-6 space-y-4">
          {formValues.features.map((feature, index) => (
            <div
              key={`service-package-feature-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-700">
                  Feature {index + 1}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMoveFeature(index, -1)}
                    disabled={isSubmitting || index === 0}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↑ Up
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveFeature(index, 1)}
                    disabled={
                      isSubmitting ||
                      index === formValues.features.length - 1
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↓ Down
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(index)}
                    disabled={isSubmitting}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[0.8fr_1.1fr_1.1fr_0.45fr]">
                <div>
                  <label
                    htmlFor={`feature-key-${index}`}
                    className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 sm:text-[10px]"
                  >
                    Key
                  </label>

                  <input
                    id={`feature-key-${index}`}
                    value={feature.key}
                    onChange={(event) =>
                      handleFeatureChange(index, "key", event.target.value)
                    }
                    disabled={isSubmitting}
                    placeholder="admin-panel"
                    className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 sm:min-h-10 sm:text-sm"
                  />

                  <FieldError
                    message={getFieldError(`features.${index}.key`)}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`feature-label-${index}`}
                    className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 sm:text-[10px]"
                  >
                    Label
                  </label>

                  <input
                    id={`feature-label-${index}`}
                    value={feature.label}
                    onChange={(event) =>
                      handleFeatureChange(index, "label", event.target.value)
                    }
                    disabled={isSubmitting}
                    placeholder="Admin Panel"
                    className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 sm:min-h-10 sm:text-sm"
                  />

                  <FieldError
                    message={getFieldError(`features.${index}.label`)}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`feature-value-${index}`}
                    className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 sm:text-[10px]"
                  >
                    Value
                  </label>

                  <input
                    id={`feature-value-${index}`}
                    value={feature.value}
                    onChange={(event) =>
                      handleFeatureChange(index, "value", event.target.value)
                    }
                    disabled={isSubmitting}
                    placeholder="Advanced / Basic / 5 pages"
                    className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 sm:min-h-10 sm:text-sm"
                  />

                  <FieldError
                    message={getFieldError(`features.${index}.value`)}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`feature-order-${index}`}
                    className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 sm:text-[10px]"
                  >
                    Order
                  </label>

                  <input
                    id={`feature-order-${index}`}
                    type="number"
                    min="0"
                    step="1"
                    value={feature.order}
                    onChange={(event) =>
                      handleFeatureChange(index, "order", event.target.value)
                    }
                    disabled={isSubmitting}
                    className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 sm:min-h-10 sm:text-sm"
                  />

                  <FieldError
                    message={getFieldError(`features.${index}.order`)}
                  />
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={feature.included}
                  onChange={(event) =>
                    handleFeatureChange(
                      index,
                      "included",
                      event.target.checked,
                    )
                  }
                  disabled={isSubmitting}
                  className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />

                Included in this package
              </label>

              <FieldError
                message={getFieldError(`features.${index}.included`)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="h-fit break-inside-avoid rounded-xl border border-slate-200 xl:mb-2 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <h2 className="text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">
          Delivery and Customer Fit
        </h2>

        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {[
            ["bestFor", "Best for", "Small businesses and growing brands"],
            ["deliveryLabel", "Delivery label", "10-15 days"],
            ["supportLabel", "Support label", "30 days support"],
            ["revisionsLabel", "Revisions label", "3 revisions"],
            ["badge", "Badge", "Most Popular"],
            ["ctaLabel", "CTA label", "Choose Package"],
          ].map(([name, label, placeholder]) => (
            <div key={name}>
              <label
                htmlFor={`service-package-${name}`}
                className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
              >
                {label}
              </label>

              <input
                id={`service-package-${name}`}
                name={name}
                value={formValues[name]}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder={placeholder}
                className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm"
              />

              <FieldError message={getFieldError(name)} />
            </div>
          ))}
        </div>
      </section>

      <section className="h-fit break-inside-avoid rounded-xl border border-slate-200 xl:mb-2 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-3">
        <h2 className="text-[12px] font-bold text-slate-950 dark:text-white sm:text-[13px]">
          Publication Controls
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-[0.6fr_1fr]">
          <div>
            <label
              htmlFor="service-package-order"
              className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 sm:text-[11px]"
            >
              Display order
            </label>

            <input
              id="service-package-order"
              name="order"
              type="number"
              min="0"
              step="1"
              value={formValues.order}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-1 min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-[13px] text-slate-950 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/60 dark:disabled:bg-slate-900 sm:min-h-10 sm:px-3 sm:text-sm"
            />

            <FieldError message={getFieldError("order")} />
          </div>

          <div className="grid gap-1.5 sm:grid-cols-3">
            {[
              [
                "isVisible",
                "Visible",
                "Allow this package to appear publicly when its parent Service is visible.",
              ],
              [
                "isFeatured",
                "Featured",
                "Prioritize this package in comparison ordering and presentation.",
              ],
              [
                "whatsappEnabled",
                "WhatsApp CTA",
                "Allow the later WhatsApp booking flow to use this package.",
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
      </section>
      </div>

<div className="sticky bottom-2 z-20 flex flex-col-reverse gap-1.5 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:flex-row sm:items-center sm:justify-end xl:col-span-2">
        <Link
          to="/admin/service-packages"
          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-[11px] font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting || servicesLoading}
          className="inline-flex min-h-9 items-center justify-center rounded-lg bg-brand-600 px-4 text-[11px] font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10 sm:px-5 sm:text-xs"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default ServicePackageForm;
