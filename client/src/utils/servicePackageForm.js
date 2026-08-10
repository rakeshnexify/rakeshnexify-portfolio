const servicePackageGroups = Object.freeze([
  {
    value: "development",
    label: "Development Packages",
  },
  {
    value: "management",
    label: "Management Packages",
  },
]);

const pricingModes = Object.freeze([
  {
    value: "fixed",
    label: "Fixed price",
  },
  {
    value: "starting-from",
    label: "Starting from",
  },
  {
    value: "custom",
    label: "Custom / Contact us",
  },
]);

const billingCycles = Object.freeze([
  {
    value: "one-time",
    label: "One-time",
  },
  {
    value: "monthly",
    label: "Monthly",
  },
  {
    value: "yearly",
    label: "Yearly",
  },
  {
    value: "custom",
    label: "Custom",
  },
]);

function createEmptyFeature(order = 1) {
  return {
    key: "",
    label: "",
    value: "",
    included: true,
    order: String(order),
  };
}

const defaultServicePackageFormValues = {
  service: "",
  group: "development",
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  pricingMode: "fixed",
  price: "",
  currency: "NPR",
  priceLabel: "",
  billingCycle: "one-time",
  billingLabel: "",
  bestFor: "",
  deliveryLabel: "",
  supportLabel: "",
  revisionsLabel: "",
  features: [createEmptyFeature(1)],
  badge: "",
  ctaLabel: "Choose Package",
  whatsappEnabled: true,
  order: "0",
  isFeatured: false,
  isVisible: true,
};

function createServicePackageSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createFeatureKey(value) {
  return createServicePackageSlug(value);
}

function normalizeRelationId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
}

function createServicePackageFormValues(servicePackage = {}) {
  const sourceFeatures = Array.isArray(servicePackage.features)
    ? servicePackage.features
    : [];

  return {
    service: normalizeRelationId(servicePackage.service),
    group: servicePackage.group || "development",
    name: servicePackage.name || "",
    slug: servicePackage.slug || "",
    shortDescription: servicePackage.shortDescription || "",
    description: servicePackage.description || "",
    pricingMode: servicePackage.pricingMode || "fixed",
    price:
      servicePackage.price === null || servicePackage.price === undefined
        ? ""
        : String(servicePackage.price),
    currency: servicePackage.currency || "NPR",
    priceLabel: servicePackage.priceLabel || "",
    billingCycle: servicePackage.billingCycle || "one-time",
    billingLabel: servicePackage.billingLabel || "",
    bestFor: servicePackage.bestFor || "",
    deliveryLabel: servicePackage.deliveryLabel || "",
    supportLabel: servicePackage.supportLabel || "",
    revisionsLabel: servicePackage.revisionsLabel || "",
    features:
      sourceFeatures.length > 0
        ? sourceFeatures.map((feature, index) => ({
            key: feature?.key || "",
            label: feature?.label || "",
            value: feature?.value || "",
            included:
              typeof feature?.included === "boolean"
                ? feature.included
                : true,
            order: String(feature?.order ?? index + 1),
          }))
        : [createEmptyFeature(1)],
    badge: servicePackage.badge || "",
    ctaLabel: servicePackage.ctaLabel || "Choose Package",
    whatsappEnabled:
      typeof servicePackage.whatsappEnabled === "boolean"
        ? servicePackage.whatsappEnabled
        : true,
    order: String(servicePackage.order ?? 0),
    isFeatured: Boolean(servicePackage.isFeatured),
    isVisible:
      typeof servicePackage.isVisible === "boolean"
        ? servicePackage.isVisible
        : true,
  };
}

function isNonNegativeNumber(value) {
  if (String(value).trim() === "") {
    return false;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue >= 0;
}

function isWholeNumber(value) {
  if (String(value).trim() === "") {
    return false;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue >= 0;
}

function validateServicePackageForm(formValues) {
  const errors = {};

  if (!String(formValues.service || "").trim()) {
    errors.service = "Choose the parent Service.";
  }

  if (!["development", "management"].includes(formValues.group)) {
    errors.group = "Choose a valid package group.";
  }

  if (!String(formValues.name || "").trim()) {
    errors.name = "Package name is required.";
  }

  if (!String(formValues.shortDescription || "").trim()) {
    errors.shortDescription = "Short description is required.";
  }

  if (!["fixed", "starting-from", "custom"].includes(formValues.pricingMode)) {
    errors.pricingMode = "Choose a valid pricing mode.";
  }

  if (
    formValues.pricingMode !== "custom" &&
    !isNonNegativeNumber(formValues.price)
  ) {
    errors.price = "Enter a valid non-negative package price.";
  }

  if (
    formValues.pricingMode === "custom" &&
    String(formValues.price || "").trim() &&
    !isNonNegativeNumber(formValues.price)
  ) {
    errors.price = "Price must be a valid non-negative number when provided.";
  }

  if (!String(formValues.currency || "").trim()) {
    errors.currency = "Currency is required.";
  }

  if (
    !["one-time", "monthly", "yearly", "custom"].includes(
      formValues.billingCycle,
    )
  ) {
    errors.billingCycle = "Choose a valid billing cycle.";
  }

  if (!isWholeNumber(formValues.order)) {
    errors.order = "Display order must be a non-negative whole number.";
  }

  const features = Array.isArray(formValues.features)
    ? formValues.features
    : [];

  features.forEach((feature, index) => {
    const hasAnyValue =
      String(feature?.key || "").trim() ||
      String(feature?.label || "").trim() ||
      String(feature?.value || "").trim();

    if (!hasAnyValue) {
      return;
    }

    if (!String(feature?.label || "").trim()) {
      errors[`features.${index}.label`] = "Feature label is required.";
    }

    if (!isWholeNumber(feature?.order ?? "")) {
      errors[`features.${index}.order`] =
        "Feature order must be a non-negative whole number.";
    }
  });

  return errors;
}

function createServicePackagePayload(formValues) {
  const features = (Array.isArray(formValues.features)
    ? formValues.features
    : []
  )
    .filter((feature) => {
      return (
        String(feature?.key || "").trim() ||
        String(feature?.label || "").trim() ||
        String(feature?.value || "").trim()
      );
    })
    .map((feature, index) => ({
      key:
        createFeatureKey(feature.key) ||
        createFeatureKey(feature.label) ||
        `feature-${index + 1}`,
      label: String(feature.label || "").trim(),
      value: String(feature.value || "").trim(),
      included: Boolean(feature.included),
      order: Number(feature.order || index + 1),
    }));

  return {
    service: String(formValues.service || "").trim(),
    group: formValues.group,
    name: String(formValues.name || "").trim(),
    slug:
      createServicePackageSlug(formValues.slug) ||
      createServicePackageSlug(formValues.name),
    shortDescription: String(formValues.shortDescription || "").trim(),
    description: String(formValues.description || "").trim(),
    pricingMode: formValues.pricingMode,
    price:
      String(formValues.price || "").trim() === ""
        ? null
        : Number(formValues.price),
    currency: String(formValues.currency || "")
      .trim()
      .toUpperCase(),
    priceLabel: String(formValues.priceLabel || "").trim(),
    billingCycle: formValues.billingCycle,
    billingLabel: String(formValues.billingLabel || "").trim(),
    bestFor: String(formValues.bestFor || "").trim(),
    deliveryLabel: String(formValues.deliveryLabel || "").trim(),
    supportLabel: String(formValues.supportLabel || "").trim(),
    revisionsLabel: String(formValues.revisionsLabel || "").trim(),
    features,
    badge: String(formValues.badge || "").trim(),
    ctaLabel: String(formValues.ctaLabel || "").trim(),
    whatsappEnabled: Boolean(formValues.whatsappEnabled),
    order: Number(formValues.order || 0),
    isFeatured: Boolean(formValues.isFeatured),
    isVisible: Boolean(formValues.isVisible),
  };
}

export {
  billingCycles,
  createEmptyFeature,
  createFeatureKey,
  createServicePackageFormValues,
  createServicePackagePayload,
  createServicePackageSlug,
  defaultServicePackageFormValues,
  pricingModes,
  servicePackageGroups,
  validateServicePackageForm,
};
