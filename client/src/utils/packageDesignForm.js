const PACKAGE_DESIGN_MAX_ORDER = 1_000_000;
const PACKAGE_DESIGN_MAX_SCREENSHOTS = 24;

const packageDesignDevices = Object.freeze([
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
]);

function createClientKey() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `package-design-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createEmptyPackageDesignScreenshot(order = 0) {
  return {
    clientKey: createClientKey(),
    url: "",
    alt: "",
    device: "desktop",
    order: String(order),
  };
}

const defaultPackageDesignFormValues = {
  servicePackage: "",
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  thumbnailUrl: "",
  thumbnailAlt: "",
  screenshots: [createEmptyPackageDesignScreenshot(0)],
  liveDemoUrl: "",
  liveDemoLabel: "Live Demo",
  order: "0",
  isDefault: false,
  isFeatured: false,
  isVisible: true,
};

function createPackageDesignSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function createPackageDesignFormValues(packageDesign = {}) {
  const sourceScreenshots = Array.isArray(packageDesign.screenshots)
    ? packageDesign.screenshots
    : [];

  return {
    servicePackage: normalizeRelationId(packageDesign.servicePackage),
    name: packageDesign.name || "",
    slug: packageDesign.slug || "",
    shortDescription: packageDesign.shortDescription || "",
    description: packageDesign.description || "",
    thumbnailUrl: packageDesign.thumbnailUrl || "",
    thumbnailAlt: packageDesign.thumbnailAlt || "",
    screenshots:
      sourceScreenshots.length > 0
        ? sourceScreenshots.map((screenshot, index) => ({
            clientKey: createClientKey(),
            url: screenshot?.url || "",
            alt: screenshot?.alt || "",
            device: screenshot?.device || "desktop",
            order: String(screenshot?.order ?? index),
          }))
        : [createEmptyPackageDesignScreenshot(0)],
    liveDemoUrl: packageDesign.liveDemoUrl || "",
    liveDemoLabel: packageDesign.liveDemoLabel || "Live Demo",
    order: String(packageDesign.order ?? 0),
    isDefault: Boolean(packageDesign.isDefault),
    isFeatured: Boolean(packageDesign.isFeatured),
    isVisible:
      typeof packageDesign.isVisible === "boolean"
        ? packageDesign.isVisible
        : true,
  };
}

function isSafeHttpUrl(value, { allowBlank = true } = {}) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) {
    return allowBlank;
  }

  try {
    const parsedUrl = new URL(cleanValue);

    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

function isValidOrder(value) {
  if (String(value).trim() === "") {
    return false;
  }

  const numberValue = Number(value);

  return (
    Number.isSafeInteger(numberValue) &&
    numberValue >= 0 &&
    numberValue <= PACKAGE_DESIGN_MAX_ORDER
  );
}

function validatePackageDesignForm(formValues) {
  const errors = {};

  if (!String(formValues.servicePackage || "").trim()) {
    errors.servicePackage = "Choose the parent Service Package.";
  }

  const name = String(formValues.name || "").trim();

  if (name.length < 2) {
    errors.name = "Design name must contain at least 2 characters.";
  }

  const finalSlug =
    createPackageDesignSlug(formValues.slug) || createPackageDesignSlug(name);

  if (finalSlug.length < 2) {
    errors.slug = "Design slug must contain at least 2 characters.";
  }

  if (String(formValues.shortDescription || "").trim().length < 10) {
    errors.shortDescription =
      "Short description must contain at least 10 characters.";
  }

  if (!isSafeHttpUrl(formValues.thumbnailUrl)) {
    errors.thumbnailUrl = "Thumbnail URL must use http or https.";
  }

  if (!isSafeHttpUrl(formValues.liveDemoUrl)) {
    errors.liveDemoUrl = "Live demo URL must use http or https.";
  }

  if (!isValidOrder(formValues.order)) {
    errors.order =
      `Display order must be a whole number from 0 to ${PACKAGE_DESIGN_MAX_ORDER}.`;
  }

  const screenshots = Array.isArray(formValues.screenshots)
    ? formValues.screenshots
    : [];

  if (screenshots.length > PACKAGE_DESIGN_MAX_SCREENSHOTS) {
    errors.screenshots =
      `A design can contain at most ${PACKAGE_DESIGN_MAX_SCREENSHOTS} screenshots.`;
  }

  const seenUrls = new Set();

  screenshots.forEach((screenshot, index) => {
    const url = String(screenshot?.url || "").trim();
    const alt = String(screenshot?.alt || "").trim();
    const orderText = String(screenshot?.order ?? "").trim();
    const hasAnyData = Boolean(url || alt);

    if (!hasAnyData) {
      return;
    }

    if (!url) {
      errors[`screenshots.${index}.url`] = "Screenshot URL is required.";
    } else if (!isSafeHttpUrl(url, { allowBlank: false })) {
      errors[`screenshots.${index}.url`] =
        "Screenshot URL must use http or https.";
    } else {
      const normalizedUrl = url.toLowerCase();

      if (seenUrls.has(normalizedUrl)) {
        errors[`screenshots.${index}.url`] =
          "Screenshot URLs must be unique within this design.";
      }

      seenUrls.add(normalizedUrl);
    }

    if (
      !packageDesignDevices.some(
        (device) => device.value === screenshot?.device,
      )
    ) {
      errors[`screenshots.${index}.device`] =
        "Choose a valid screenshot device.";
    }

    if (!orderText || !isValidOrder(screenshot?.order)) {
      errors[`screenshots.${index}.order`] =
        `Screenshot order must be from 0 to ${PACKAGE_DESIGN_MAX_ORDER}.`;
    }
  });

  return errors;
}

function createPackageDesignPayload(formValues) {
  const screenshots = (Array.isArray(formValues.screenshots)
    ? formValues.screenshots
    : []
  )
    .filter((screenshot) => String(screenshot?.url || "").trim())
    .map((screenshot, index) => ({
      url: String(screenshot.url || "").trim(),
      alt: String(screenshot.alt || "").trim(),
      device: screenshot.device || "desktop",
      order: Number(screenshot.order ?? index),
    }));

  return {
    servicePackage: String(formValues.servicePackage || "").trim(),
    name: String(formValues.name || "").trim(),
    slug:
      createPackageDesignSlug(formValues.slug) ||
      createPackageDesignSlug(formValues.name),
    shortDescription: String(formValues.shortDescription || "").trim(),
    description: String(formValues.description || "").trim(),
    thumbnailUrl: String(formValues.thumbnailUrl || "").trim(),
    thumbnailAlt: String(formValues.thumbnailAlt || "").trim(),
    screenshots,
    liveDemoUrl: String(formValues.liveDemoUrl || "").trim(),
    liveDemoLabel: String(formValues.liveDemoLabel || "").trim(),
    order: Number(formValues.order || 0),
    isDefault: Boolean(formValues.isDefault),
    isFeatured: Boolean(formValues.isFeatured),
    isVisible: Boolean(formValues.isVisible),
  };
}

function getPackageDesignPackageLabel(servicePackage) {
  if (!servicePackage) {
    return "Unknown Service Package";
  }

  const serviceTitle =
    typeof servicePackage.service === "object"
      ? servicePackage.service?.title
      : "";

  const groupLabel =
    servicePackage.group === "management" ? "Management" : "Development";

  return [
    serviceTitle,
    groupLabel,
    servicePackage.name || servicePackage.slug || "Package",
  ]
    .filter(Boolean)
    .join(" — ");
}

export {
  PACKAGE_DESIGN_MAX_SCREENSHOTS,
  createEmptyPackageDesignScreenshot,
  createPackageDesignFormValues,
  createPackageDesignPayload,
  createPackageDesignSlug,
  defaultPackageDesignFormValues,
  getPackageDesignPackageLabel,
  packageDesignDevices,
  validatePackageDesignForm,
};
