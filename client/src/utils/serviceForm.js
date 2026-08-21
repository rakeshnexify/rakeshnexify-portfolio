const defaultServiceFormValues = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  icon: "",
  iconUrl: "",
  orderUrl: "",
  features: "",
  technologies: "",
  order: "0",
  isFeatured: false,
  isVisible: true,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
};

function createServiceSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function listToText(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function textToList(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createServiceFormValues(service = {}) {
  return {
    title: service.title || "",
    slug: service.slug || "",
    shortDescription: service.shortDescription || "",
    description: service.description || "",
    icon: service.icon || "",
    iconUrl: service.iconUrl || "",
    orderUrl: service.orderUrl || "",
    features: listToText(service.features),
    technologies: listToText(service.technologies),
    order: String(service.order ?? 0),
    isFeatured: Boolean(service.isFeatured),
    isVisible:
      typeof service.isVisible === "boolean" ? service.isVisible : true,
    seoTitle: service.seo?.title || "",
    seoDescription: service.seo?.description || "",
    seoKeywords: listToText(service.seo?.keywords),
  };
}

function createServicePayload(formValues) {
  return {
    title: formValues.title.trim(),
    slug:
      createServiceSlug(formValues.slug) || createServiceSlug(formValues.title),
    shortDescription: formValues.shortDescription.trim(),
    description: formValues.description.trim(),
    icon: formValues.icon.trim(),
    iconUrl: formValues.iconUrl.trim(),
    orderUrl: formValues.orderUrl.trim(),
    features: textToList(formValues.features),
    technologies: textToList(formValues.technologies),
    order: Number(formValues.order || 0),
    isFeatured: Boolean(formValues.isFeatured),
    isVisible: Boolean(formValues.isVisible),
    seo: {
      title: formValues.seoTitle.trim(),
      description: formValues.seoDescription.trim(),
      keywords: textToList(formValues.seoKeywords),
    },
  };
}

export {
  createServiceFormValues,
  createServicePayload,
  createServiceSlug,
  defaultServiceFormValues,
};
