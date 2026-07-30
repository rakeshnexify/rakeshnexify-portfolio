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

const defaultPlatformGroups = {
  socialPlatforms: [
    {
      name: "YouTube",
      username: "RakeshNexify",
      url: "",
      isVisible: true,
      order: 1,
    },
    {
      name: "LinkedIn",
      username: "Rakesh Pandit",
      url: "",
      isVisible: true,
      order: 2,
    },
    {
      name: "Instagram",
      username: "RakeshNexify",
      url: "",
      isVisible: true,
      order: 3,
    },
    {
      name: "Facebook",
      username: "RakeshNexify",
      url: "",
      isVisible: true,
      order: 4,
    },
    {
      name: "Threads",
      username: "RakeshNexify",
      url: "",
      isVisible: true,
      order: 5,
    },
    {
      name: "TikTok",
      username: "RakeshNexify",
      url: "",
      isVisible: true,
      order: 6,
    },
  ],

  developerPlatforms: [
    {
      name: "GitHub",
      username: "Rakesh-Pandit-Developer",
      url: "",
      isVisible: true,
      order: 1,
    },
    {
      name: "GitLab",
      username: "",
      url: "",
      isVisible: true,
      order: 2,
    },
    {
      name: "StackBlitz",
      username: "",
      url: "",
      isVisible: true,
      order: 3,
    },
    {
      name: "CodePen",
      username: "",
      url: "",
      isVisible: true,
      order: 4,
    },
  ],

  freelancerPlatforms: [
    {
      name: "Upwork",
      username: "",
      url: "",
      isVisible: true,
      order: 1,
    },
    {
      name: "Fiverr",
      username: "",
      url: "",
      isVisible: true,
      order: 2,
    },
    {
      name: "Freelancer",
      username: "",
      url: "",
      isVisible: true,
      order: 3,
    },
    {
      name: "PeoplePerHour",
      username: "",
      url: "",
      isVisible: true,
      order: 4,
    },
    {
      name: "Contra",
      username: "",
      url: "",
      isVisible: true,
      order: 5,
    },
  ],
};

function cleanString(value) {
  return String(value ?? "").trim();
}

function createMultilineValue(value) {
  if (typeof value === "string") {
    return value;
  }

  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((item) => cleanString(item))
    .filter(Boolean)
    .join("\n");
}

function createArrayFromLines(value) {
  const items = String(value ?? "")
    .split(/\r?\n/)
    .map((item) => cleanString(item))
    .filter(Boolean);

  return [...new Set(items)];
}

function createKeywordsValue(value) {
  if (typeof value === "string") {
    return value;
  }

  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((item) => cleanString(item))
    .filter(Boolean)
    .join(", ");
}

function createKeywordsArray(value) {
  const keywords = String(value ?? "")
    .split(/[\n,]+/)
    .map((keyword) => cleanString(keyword).toLowerCase())
    .filter(Boolean);

  return [...new Set(keywords)];
}

function normalizeSection(section, index) {
  const numericOrder = Number(section?.order);

  return {
    key: cleanString(section?.key).toLowerCase(),
    label: cleanString(section?.label),

    isVisible: section?.isVisible !== false,

    order:
      Number.isFinite(numericOrder) && numericOrder >= 0
        ? numericOrder
        : index + 1,
  };
}

function normalizeSections(value) {
  const source =
    Array.isArray(value) && value.length > 0 ? value : defaultSections;

  return source
    .map((section, index) => normalizeSection(section, index))
    .filter((section) => section.key)
    .sort(
      (firstSection, secondSection) => firstSection.order - secondSection.order,
    );
}

function createEmptyPlatform(order = 1) {
  return {
    name: "",
    username: "",
    url: "",
    isVisible: true,
    order,
  };
}

function normalizePlatform(platform, index) {
  const numericOrder = Number(platform?.order);

  return {
    name: cleanString(platform?.name),
    username: cleanString(platform?.username),
    url: cleanString(platform?.url),

    isVisible: platform?.isVisible !== false,

    order:
      Number.isFinite(numericOrder) && numericOrder >= 0
        ? numericOrder
        : index + 1,
  };
}

function normalizePlatforms(value, fallbackPlatforms = []) {
  const source = Array.isArray(value) ? value : fallbackPlatforms;

  return source
    .map((platform, index) => normalizePlatform(platform, index))
    .sort(
      (firstPlatform, secondPlatform) =>
        firstPlatform.order - secondPlatform.order,
    );
}

function createSiteSettingsFormValues(settings = {}) {
  const brand = settings?.brand || {};
  const owner = settings?.owner || {};
  const hero = settings?.hero || {};
  const about = settings?.about || {};
  const contact = settings?.contact || {};
  const seo = settings?.seo || {};

  const primaryButton = hero.primaryButton || hero.primaryAction || {};

  const secondaryButton = hero.secondaryButton || hero.secondaryAction || {};

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

      heading: cleanString(hero.heading) || cleanString(hero.title),

      description: cleanString(hero.description),

      primaryButton: {
        label: cleanString(primaryButton.label),

        url: cleanString(primaryButton.url) || cleanString(primaryButton.href),
      },

      secondaryButton: {
        label: cleanString(secondaryButton.label),

        url:
          cleanString(secondaryButton.url) || cleanString(secondaryButton.href),
      },
    },

    about: {
      heading: cleanString(about.heading) || cleanString(about.title),

      description: aboutDescription,

      highlightsText:
        typeof about.highlightsText === "string"
          ? about.highlightsText
          : createMultilineValue(about.highlights),
    },

    contact: {
      email: cleanString(contact.email),
      phone: cleanString(contact.phone),
      whatsapp: cleanString(contact.whatsapp),
      location: cleanString(contact.location),
      availability: cleanString(contact.availability),
    },

    seo: {
      title: cleanString(seo.title),
      description: cleanString(seo.description),

      keywordsText:
        typeof seo.keywordsText === "string"
          ? seo.keywordsText
          : createKeywordsValue(seo.keywords),

      ogImageUrl: cleanString(seo.ogImageUrl),
    },

    socialPlatforms: normalizePlatforms(
      settings?.socialPlatforms,
      defaultPlatformGroups.socialPlatforms,
    ),

    developerPlatforms: normalizePlatforms(
      settings?.developerPlatforms,
      defaultPlatformGroups.developerPlatforms,
    ),

    freelancerPlatforms: normalizePlatforms(
      settings?.freelancerPlatforms,
      defaultPlatformGroups.freelancerPlatforms,
    ),

    sections: normalizeSections(settings?.sections),

    isPublished: settings?.isPublished !== false,
  };
}

function createPlatformPayload(platforms) {
  return normalizePlatforms(platforms, []).map((platform, index) => ({
    name: cleanString(platform.name),
    username: cleanString(platform.username),
    url: cleanString(platform.url),
    isVisible: platform.isVisible !== false,
    order: index + 1,
  }));
}

function createSiteSettingsPayload(formValues = {}) {
  const values = createSiteSettingsFormValues(formValues);

  return {
    brand: {
      name: values.brand.name,
      shortName: values.brand.shortName,
      tagline: values.brand.tagline,
      logoUrl: values.brand.logoUrl,
      faviconUrl: values.brand.faviconUrl,
    },

    owner: {
      name: values.owner.name,
      professionalTitle: values.owner.professionalTitle,
      location: values.owner.location,
      profileImageUrl: values.owner.profileImageUrl,
      resumeUrl: values.owner.resumeUrl,
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

      highlights: createArrayFromLines(values.about.highlightsText),
    },

    contact: {
      email: values.contact.email,
      phone: values.contact.phone,
      whatsapp: values.contact.whatsapp,
      location: values.contact.location,
      availability: values.contact.availability,
    },

    seo: {
      title: values.seo.title,
      description: values.seo.description,

      keywords: createKeywordsArray(values.seo.keywordsText),

      ogImageUrl: values.seo.ogImageUrl,
    },

    socialPlatforms: createPlatformPayload(values.socialPlatforms),

    developerPlatforms: createPlatformPayload(values.developerPlatforms),

    freelancerPlatforms: createPlatformPayload(values.freelancerPlatforms),

    sections: normalizeSections(values.sections).map((section, index) => ({
      key: section.key,
      label: section.label,
      isVisible: section.isVisible,
      order: index + 1,
    })),

    isPublished: values.isPublished,
  };
}

export {
  createArrayFromLines,
  createEmptyPlatform,
  createKeywordsArray,
  createSiteSettingsFormValues,
  createSiteSettingsPayload,
  defaultPlatformGroups,
  defaultSections,
  normalizePlatforms,
};
