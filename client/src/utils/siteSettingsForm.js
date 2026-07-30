const defaultSections = [
  {
    key: "hero",
    label: "Hero",
    isVisible: true,
    order: 1,
  },
  {
    key: "about",
    label: "About",
    isVisible: true,
    order: 2,
  },
  {
    key: "services",
    label: "Services",
    isVisible: true,
    order: 3,
  },
  {
    key: "projects",
    label: "Projects",
    isVisible: true,
    order: 4,
  },
  {
    key: "companies",
    label: "Companies",
    isVisible: true,
    order: 5,
  },
  {
    key: "contact",
    label: "Contact",
    isVisible: true,
    order: 6,
  },
];

function cleanString(value) {
  return String(value ?? "").trim();
}

function createMultilineValue(value) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((item) => cleanString(item))
    .filter(Boolean)
    .join("\n");
}

function createArrayFromLines(value) {
  const uniqueValues = new Set();

  String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      uniqueValues.add(item);
    });

  return [...uniqueValues];
}

function createKeywordsValue(value) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((keyword) => cleanString(keyword))
    .filter(Boolean)
    .join(", ");
}

function createKeywordsArray(value) {
  const uniqueKeywords = new Set();

  String(value || "")
    .split(/[,\n]/)
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean)
    .forEach((keyword) => {
      uniqueKeywords.add(keyword);
    });

  return [...uniqueKeywords];
}

function normalizeSection(section, index) {
  const numericOrder = Number(section?.order);

  return {
    key: cleanString(section?.key).toLowerCase(),

    label: cleanString(section?.label),

    isVisible:
      typeof section?.isVisible === "boolean" ? section.isVisible : true,

    order:
      Number.isFinite(numericOrder) && numericOrder >= 0
        ? numericOrder
        : index + 1,
  };
}

function normalizeSections(sections) {
  const sourceSections =
    Array.isArray(sections) && sections.length > 0 ? sections : defaultSections;

  return sourceSections
    .map(normalizeSection)
    .filter((section) => section.key && section.label)
    .sort(
      (firstSection, secondSection) => firstSection.order - secondSection.order,
    );
}

function createSiteSettingsFormValues(settings = {}) {
  const brand = settings.brand || {};
  const owner = settings.owner || {};
  const hero = settings.hero || {};
  const about = settings.about || {};
  const contact = settings.contact || {};
  const seo = settings.seo || {};

  const primaryButton = hero.primaryButton || {
    label: hero.primaryAction?.label,
    url: hero.primaryAction?.href,
  };

  const secondaryButton = hero.secondaryButton || {
    label: hero.secondaryAction?.label,
    url: hero.secondaryAction?.href,
  };

  const aboutDescription =
    cleanString(about.description) ||
    (Array.isArray(about.paragraphs)
      ? about.paragraphs
          .map((paragraph) => cleanString(paragraph))
          .filter(Boolean)
          .join("\n\n")
      : "");

  return {
    brand: {
      name: cleanString(brand.name),
      shortName: cleanString(brand.shortName),
      tagline: cleanString(brand.tagline),
      logoUrl: cleanString(brand.logoUrl),
      faviconUrl: cleanString(brand.faviconUrl),
    },

    owner: {
      name: cleanString(owner.name),
      professionalTitle: cleanString(owner.professionalTitle),
      location: cleanString(owner.location),
      profileImageUrl: cleanString(owner.profileImageUrl),
      resumeUrl: cleanString(owner.resumeUrl),
    },

    hero: {
      eyebrow: cleanString(hero.eyebrow),
      heading: cleanString(hero.heading || hero.title),
      description: cleanString(hero.description),

      primaryButton: {
        label: cleanString(primaryButton?.label),
        url: cleanString(primaryButton?.url),
      },

      secondaryButton: {
        label: cleanString(secondaryButton?.label),
        url: cleanString(secondaryButton?.url),
      },
    },

    about: {
      heading: cleanString(about.heading || about.title),
      description: aboutDescription,
      highlightsText: createMultilineValue(about.highlights),
    },

    contact: {
      email: cleanString(contact.email).toLowerCase(),
      phone: cleanString(contact.phone),
      whatsapp: cleanString(contact.whatsapp),
      location: cleanString(contact.location),
      availability: cleanString(contact.availability),
    },

    seo: {
      title: cleanString(seo.title),
      description: cleanString(seo.description),
      keywordsText: createKeywordsValue(seo.keywords),
      ogImageUrl: cleanString(seo.ogImageUrl),
    },

    sections: normalizeSections(settings.sections),

    isPublished:
      typeof settings.isPublished === "boolean" ? settings.isPublished : true,
  };
}

function createSiteSettingsPayload(formValues = {}) {
  const values = createSiteSettingsFormValues(formValues);

  return {
    brand: {
      ...values.brand,
    },

    owner: {
      ...values.owner,
    },

    hero: {
      eyebrow: values.hero.eyebrow,
      heading: values.hero.heading,
      description: values.hero.description,

      primaryButton: {
        label: values.hero.primaryButton.label,
        url: values.hero.primaryButton.url,
      },

      secondaryButton: {
        label: values.hero.secondaryButton.label,
        url: values.hero.secondaryButton.url,
      },
    },

    about: {
      heading: values.about.heading,
      description: values.about.description,

      highlights: createArrayFromLines(formValues.about?.highlightsText),
    },

    contact: {
      ...values.contact,
    },

    seo: {
      title: values.seo.title,
      description: values.seo.description,

      keywords: createKeywordsArray(formValues.seo?.keywordsText),

      ogImageUrl: values.seo.ogImageUrl,
    },

    sections: normalizeSections(formValues.sections),

    isPublished: values.isPublished,
  };
}

export {
  createArrayFromLines,
  createKeywordsArray,
  createSiteSettingsFormValues,
  createSiteSettingsPayload,
  defaultSections,
};
