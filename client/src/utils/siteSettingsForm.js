import {
  homepageSectionDefinitions,
  mergeHomepageSections,
} from "../config/homepageSections";

const defaultSections = homepageSectionDefinitions.map((section) => ({
  ...section,
}));

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

const defaultFooterLegalLinks = [
  {
    label: "Privacy Policy",
    url: "#privacy",
    isVisible: true,
    order: 1,
  },
  {
    label: "Terms",
    url: "#terms",
    isVisible: true,
    order: 2,
  },
];

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

function normalizeButton(button = {}) {
  return {
    label: cleanString(button?.label),

    url: cleanString(button?.url) || cleanString(button?.href),
  };
}

function normalizeListingSection(section = {}) {
  return {
    eyebrow: cleanString(section?.eyebrow),

    heading: cleanString(section?.heading) || cleanString(section?.title),

    description: cleanString(section?.description),

    ctaButton: normalizeButton(section?.ctaButton || section?.action || {}),
  };
}

function normalizeContactSection(section = {}) {
  return {
    eyebrow: cleanString(section?.eyebrow),

    heading: cleanString(section?.heading) || cleanString(section?.title),

    description: cleanString(section?.description),

    enquiryEyebrow: cleanString(section?.enquiryEyebrow),

    enquiryHeading: cleanString(section?.enquiryHeading),

    enquiryDescription: cleanString(section?.enquiryDescription),
  };
}

function normalizeSection(section, index) {
  const numericOrder = Number(section?.order);

  const normalizedOrder =
    Number.isFinite(numericOrder) && numericOrder >= 0
      ? numericOrder
      : index + 1;

  const numericNavigationOrder = Number(section?.navigationOrder);

  return {
    key: cleanString(section?.key).toLowerCase(),

    label: cleanString(section?.label),

    /*
     * Homepage section visibility.
     */
    isVisible: section?.isVisible !== false,

    /*
     * Desktop aur mobile Navbar visibility.
     */
    isNavigationVisible: section?.isNavigationVisible !== false,

    /*
     * Dedicated public page accessibility.
     */
    isPageVisible: section?.isPageVisible !== false,

    /*
     * Homepage section order.
     */
    order: normalizedOrder,

    /*
     * Navbar ka independent order.
     * Purane records mein field na hone par
     * homepage order fallback rahega.
     */
    navigationOrder:
      Number.isFinite(numericNavigationOrder) && numericNavigationOrder >= 0
        ? numericNavigationOrder
        : normalizedOrder,
  };
}

function normalizeSections(value) {
  return mergeHomepageSections(value)
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

function createEmptyLegalLink(order = 1) {
  return {
    label: "",
    url: "",
    isVisible: true,
    order,
  };
}

function normalizeLegalLink(link, index) {
  const numericOrder = Number(link?.order);

  return {
    label: cleanString(link?.label),

    url: cleanString(link?.url) || cleanString(link?.href),

    isVisible: link?.isVisible !== false,

    order:
      Number.isFinite(numericOrder) && numericOrder >= 0
        ? numericOrder
        : index + 1,
  };
}

function normalizeLegalLinks(value, fallbackLinks = defaultFooterLegalLinks) {
  const source = Array.isArray(value) ? value : fallbackLinks;

  return source
    .map((link, index) => normalizeLegalLink(link, index))
    .sort((firstLink, secondLink) => firstLink.order - secondLink.order);
}

function normalizeFooter(footer = {}) {
  return {
    introduction: cleanString(footer?.introduction),

    quickLinksHeading: cleanString(footer?.quickLinksHeading) || "Quick Links",

    servicesHeading: cleanString(footer?.servicesHeading) || "Services",

    platformsHeading: cleanString(footer?.platformsHeading) || "Platforms",

    platformNote:
      cleanString(footer?.platformNote) ||
      "Profiles without official URLs remain disabled.",

    projectButton: {
      label:
        cleanString(footer?.projectButton?.label) || "Start a project with me",

      url:
        cleanString(footer?.projectButton?.url) ||
        cleanString(footer?.projectButton?.href) ||
        "#contact",
    },

    legalLinks: normalizeLegalLinks(footer?.legalLinks),

    copyrightText: cleanString(footer?.copyrightText) || "All rights reserved.",
  };
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

      primaryButton: normalizeButton(primaryButton),

      secondaryButton: normalizeButton(secondaryButton),
    },

    about: {
      heading: cleanString(about.heading) || cleanString(about.title),

      description: aboutDescription,

      highlightsText:
        typeof about.highlightsText === "string"
          ? about.highlightsText
          : createMultilineValue(about.highlights),
    },

    statisticsSection: normalizeListingSection(settings?.statisticsSection),

    skillsSection: normalizeListingSection(settings?.skillsSection),

    servicesSection: normalizeListingSection(settings?.servicesSection),

    projectsSection: normalizeListingSection(settings?.projectsSection),

    educationSection: normalizeListingSection(settings?.educationSection),

    experienceSection: normalizeListingSection(settings?.experienceSection),

    achievementsSection: normalizeListingSection(settings?.achievementsSection),

    teamSection: normalizeListingSection(settings?.teamSection),

    companiesSection: normalizeListingSection(settings?.companiesSection),

    testimonialsSection: normalizeListingSection(
      settings?.testimonialsSection,
    ),

    faqSection: normalizeListingSection(settings?.faqSection),

    postsSection: normalizeListingSection(settings?.postsSection),

    contactSection: normalizeContactSection(settings?.contactSection),

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

    footer: normalizeFooter(settings?.footer),

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

function createLegalLinksPayload(legalLinks) {
  return normalizeLegalLinks(legalLinks, []).map((link, index) => ({
    label: cleanString(link.label),

    url: cleanString(link.url),

    isVisible: link.isVisible !== false,

    order: index + 1,
  }));
}

function createListingSectionPayload(section) {
  const normalizedSection = normalizeListingSection(section);

  return {
    eyebrow: normalizedSection.eyebrow,
    heading: normalizedSection.heading,
    description: normalizedSection.description,

    ctaButton: {
      label: normalizedSection.ctaButton.label,

      url: normalizedSection.ctaButton.url,
    },
  };
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

    statisticsSection: createListingSectionPayload(values.statisticsSection),

    skillsSection: createListingSectionPayload(values.skillsSection),

    servicesSection: createListingSectionPayload(values.servicesSection),

    projectsSection: createListingSectionPayload(values.projectsSection),

    educationSection: createListingSectionPayload(values.educationSection),

    experienceSection: createListingSectionPayload(values.experienceSection),

    achievementsSection: createListingSectionPayload(values.achievementsSection),

    teamSection: createListingSectionPayload(values.teamSection),

    companiesSection: createListingSectionPayload(values.companiesSection),

    testimonialsSection: createListingSectionPayload(
      values.testimonialsSection,
    ),

    faqSection: createListingSectionPayload(values.faqSection),

    postsSection: createListingSectionPayload(values.postsSection),

    contactSection: {
      eyebrow: values.contactSection.eyebrow,

      heading: values.contactSection.heading,

      description: values.contactSection.description,

      enquiryEyebrow: values.contactSection.enquiryEyebrow,

      enquiryHeading: values.contactSection.enquiryHeading,

      enquiryDescription: values.contactSection.enquiryDescription,
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

    footer: {
      introduction: values.footer.introduction,

      quickLinksHeading: values.footer.quickLinksHeading,

      servicesHeading: values.footer.servicesHeading,

      platformsHeading: values.footer.platformsHeading,

      platformNote: values.footer.platformNote,

      projectButton: {
        label: values.footer.projectButton.label,

        url: values.footer.projectButton.url,
      },

      legalLinks: createLegalLinksPayload(values.footer.legalLinks),

      copyrightText: values.footer.copyrightText,
    },

    socialPlatforms: createPlatformPayload(values.socialPlatforms),

    developerPlatforms: createPlatformPayload(values.developerPlatforms),

    freelancerPlatforms: createPlatformPayload(values.freelancerPlatforms),

    sections: normalizeSections(values.sections).map((section, index) => ({
      key: section.key,

      label: section.label,

      /*
       * Homepage section visibility.
       */
      isVisible: section.isVisible,

      /*
       * Navbar menu visibility.
       */
      isNavigationVisible: section.isNavigationVisible,

      /*
       * Dedicated page accessibility.
       */
      isPageVisible: section.isPageVisible,

      /*
       * Current array order homepage section
       * order ke roop mein save hoga.
       */
      order: index + 1,

      /*
       * Navbar order homepage order se
       * independently preserve hoga.
       */
      navigationOrder: section.navigationOrder,
    })),

    isPublished: values.isPublished,
  };
}

export {
  createArrayFromLines,
  createEmptyLegalLink,
  createEmptyPlatform,
  createKeywordsArray,
  createSiteSettingsFormValues,
  createSiteSettingsPayload,
  defaultFooterLegalLinks,
  defaultPlatformGroups,
  defaultSections,
  normalizeLegalLinks,
  normalizePlatforms,
};
