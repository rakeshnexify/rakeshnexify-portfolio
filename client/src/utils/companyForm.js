function createEmptyCompanyStatistic() {
  return {
    label: "",
    value: "",
  };
}

function createEmptyCompanyForm() {
  return {
    name: "",
    slug: "",
    legalName: "",
    tagline: "",
    shortDescription: "",
    description: "",
    industry: "",

    relationship: "owned",
    status: "active",
    foundedYear: "",
    role: "",

    websiteUrl: "",
    logoUrl: "",
    coverImageUrl: "",

    businessAreas: "",
    services: "",
    highlights: "",
    statistics: [],

    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    contactCity: "",
    contactCountry: "",

    facebookUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
    xUrl: "",

    order: "0",
    isFeatured: false,
    isVisible: true,

    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    seoOgImageUrl: "",
  };
}

const defaultCompanyFormValues = createEmptyCompanyForm();

function createCompanySlug(value) {
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

function createCompanyStatisticFormValue(statistic = {}) {
  return {
    label: statistic.label || "",
    value: statistic.value || "",
  };
}

function createCompanyFormFromData(company = {}) {
  const contact = company.contact || {};

  const socialLinks = company.socialLinks || {};

  const seo = company.seo || {};

  return {
    name: company.name || "",

    slug: company.slug || "",

    legalName: company.legalName || "",

    tagline: company.tagline || "",

    shortDescription: company.shortDescription || "",

    description: company.description || "",

    industry: company.industry || "",

    relationship: company.relationship || "owned",

    status: company.status || "active",

    foundedYear:
      company.foundedYear === null || company.foundedYear === undefined
        ? ""
        : String(company.foundedYear),

    role: company.role || "",

    websiteUrl: company.websiteUrl || "",

    logoUrl: company.logoUrl || "",

    coverImageUrl: company.coverImageUrl || "",

    businessAreas: listToText(company.businessAreas),

    services: listToText(company.services),

    highlights: listToText(company.highlights),

    statistics: Array.isArray(company.statistics)
      ? company.statistics.map(createCompanyStatisticFormValue)
      : [],

    contactEmail: contact.email || "",

    contactPhone: contact.phone || "",

    contactAddress: contact.address || "",

    contactCity: contact.city || "",

    contactCountry: contact.country || "",

    facebookUrl: socialLinks.facebook || "",

    instagramUrl: socialLinks.instagram || "",

    linkedinUrl: socialLinks.linkedin || "",

    youtubeUrl: socialLinks.youtube || "",

    xUrl: socialLinks.x || "",

    order: String(company.order ?? 0),

    isFeatured: Boolean(company.isFeatured),

    isVisible:
      typeof company.isVisible === "boolean" ? company.isVisible : true,

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

function createCompanyPayload(formValues) {
  const name = String(formValues.name || "").trim();

  const foundedYearValue = String(formValues.foundedYear || "").trim();

  return {
    name,

    slug: createCompanySlug(formValues.slug) || createCompanySlug(name),

    legalName: String(formValues.legalName || "").trim(),

    tagline: String(formValues.tagline || "").trim(),

    shortDescription: String(formValues.shortDescription || "").trim(),

    description: String(formValues.description || "").trim(),

    industry: String(formValues.industry || "").trim(),

    relationship: formValues.relationship || "owned",

    status: formValues.status || "active",

    foundedYear: foundedYearValue ? Number(foundedYearValue) : null,

    role: String(formValues.role || "").trim(),

    websiteUrl: String(formValues.websiteUrl || "").trim(),

    logoUrl: String(formValues.logoUrl || "").trim(),

    coverImageUrl: String(formValues.coverImageUrl || "").trim(),

    businessAreas: textToList(formValues.businessAreas),

    services: textToList(formValues.services),

    highlights: textToList(formValues.highlights),

    statistics: createStatisticsPayload(formValues.statistics),

    contact: {
      email: String(formValues.contactEmail || "").trim(),

      phone: String(formValues.contactPhone || "").trim(),

      address: String(formValues.contactAddress || "").trim(),

      city: String(formValues.contactCity || "").trim(),

      country: String(formValues.contactCountry || "").trim(),
    },

    socialLinks: {
      facebook: String(formValues.facebookUrl || "").trim(),

      instagram: String(formValues.instagramUrl || "").trim(),

      linkedin: String(formValues.linkedinUrl || "").trim(),

      youtube: String(formValues.youtubeUrl || "").trim(),

      x: String(formValues.xUrl || "").trim(),
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
  createCompanyFormFromData,
  createCompanyPayload,
  createCompanySlug,
  createEmptyCompanyForm,
  createEmptyCompanyStatistic,
  defaultCompanyFormValues,
};
