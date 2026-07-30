function createEmptyBrandStatistic() {
  return {
    label: "",
    value: "",
  };
}

function createEmptyBrandForm() {
  return {
    name: "",
    slug: "",
    tagline: "",
    shortDescription: "",
    description: "",
    category: "",

    brandType: "creator",
    status: "active",
    launchedYear: "",
    role: "",

    websiteUrl: "",
    logoUrl: "",
    coverImageUrl: "",

    focusAreas: "",
    platforms: "",
    highlights: "",
    statistics: [],

    facebookUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
    tiktokUrl: "",
    threadsUrl: "",
    xUrl: "",
    githubUrl: "",

    order: "0",
    isFeatured: false,
    isVisible: true,

    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    seoOgImageUrl: "",
  };
}

const defaultBrandFormValues = createEmptyBrandForm();

function createBrandSlug(value) {
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

function createBrandStatisticFormValue(statistic = {}) {
  return {
    label: statistic.label || "",
    value: statistic.value || "",
  };
}

function createBrandFormFromData(brand = {}) {
  const socialLinks = brand.socialLinks || {};

  const seo = brand.seo || {};

  return {
    name: brand.name || "",

    slug: brand.slug || "",

    tagline: brand.tagline || "",

    shortDescription: brand.shortDescription || "",

    description: brand.description || "",

    category: brand.category || "",

    brandType: brand.brandType || "creator",

    status: brand.status || "active",

    launchedYear:
      brand.launchedYear === null || brand.launchedYear === undefined
        ? ""
        : String(brand.launchedYear),

    role: brand.role || "",

    websiteUrl: brand.websiteUrl || "",

    logoUrl: brand.logoUrl || "",

    coverImageUrl: brand.coverImageUrl || "",

    focusAreas: listToText(brand.focusAreas),

    platforms: listToText(brand.platforms),

    highlights: listToText(brand.highlights),

    statistics: Array.isArray(brand.statistics)
      ? brand.statistics.map(createBrandStatisticFormValue)
      : [],

    facebookUrl: socialLinks.facebook || "",

    instagramUrl: socialLinks.instagram || "",

    linkedinUrl: socialLinks.linkedin || "",

    youtubeUrl: socialLinks.youtube || "",

    tiktokUrl: socialLinks.tiktok || "",

    threadsUrl: socialLinks.threads || "",

    xUrl: socialLinks.x || "",

    githubUrl: socialLinks.github || "",

    order: String(brand.order ?? 0),

    isFeatured: Boolean(brand.isFeatured),

    isVisible: typeof brand.isVisible === "boolean" ? brand.isVisible : true,

    seoTitle: seo.title || "",

    seoDescription: seo.description || "",

    seoKeywords: listToText(seo.keywords),

    seoOgImageUrl: seo.ogImageUrl || "",
  };
}

function createStatisticsPayload(statistics = []) {
  if (!Array.isArray(statistics)) {
    return [];
  }

  return statistics
    .filter((statistic) => {
      const label = String(statistic?.label || "").trim();

      const value = String(statistic?.value || "").trim();

      return Boolean(label || value);
    })
    .map((statistic) => ({
      label: String(statistic.label || "").trim(),

      value: String(statistic.value || "").trim(),
    }));
}

function createBrandPayload(formValues) {
  const name = String(formValues.name || "").trim();

  const launchedYearValue = String(formValues.launchedYear || "").trim();

  return {
    name,

    slug: createBrandSlug(formValues.slug) || createBrandSlug(name),

    tagline: String(formValues.tagline || "").trim(),

    shortDescription: String(formValues.shortDescription || "").trim(),

    description: String(formValues.description || "").trim(),

    category: String(formValues.category || "").trim(),

    brandType: formValues.brandType || "creator",

    status: formValues.status || "active",

    launchedYear: launchedYearValue ? Number(launchedYearValue) : null,

    role: String(formValues.role || "").trim(),

    websiteUrl: String(formValues.websiteUrl || "").trim(),

    logoUrl: String(formValues.logoUrl || "").trim(),

    coverImageUrl: String(formValues.coverImageUrl || "").trim(),

    focusAreas: textToList(formValues.focusAreas),

    platforms: textToList(formValues.platforms),

    highlights: textToList(formValues.highlights),

    statistics: createStatisticsPayload(formValues.statistics),

    socialLinks: {
      facebook: String(formValues.facebookUrl || "").trim(),

      instagram: String(formValues.instagramUrl || "").trim(),

      linkedin: String(formValues.linkedinUrl || "").trim(),

      youtube: String(formValues.youtubeUrl || "").trim(),

      tiktok: String(formValues.tiktokUrl || "").trim(),

      threads: String(formValues.threadsUrl || "").trim(),

      x: String(formValues.xUrl || "").trim(),

      github: String(formValues.githubUrl || "").trim(),
    },

    order: Number(formValues.order || 0),

    isFeatured: Boolean(formValues.isFeatured),

    isVisible: Boolean(formValues.isVisible),

    seo: {
      title: String(formValues.seoTitle || "").trim(),

      description: String(formValues.seoDescription || "").trim(),

      keywords: textToList(formValues.seoKeywords),

      ogImageUrl: String(formValues.seoOgImageUrl || "").trim(),
    },
  };
}

export {
  createBrandFormFromData,
  createBrandPayload,
  createBrandSlug,
  createEmptyBrandForm,
  createEmptyBrandStatistic,
  defaultBrandFormValues,
};
