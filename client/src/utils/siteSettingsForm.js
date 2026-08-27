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

    heading: cleanString(section?.heading),

    description: cleanString(section?.description),

    ctaButton: {
      label: cleanString(section?.ctaButton?.label),
      url: cleanString(section?.ctaButton?.url),
    },
  };
}

function normalizeTestimonialsTrustedClients(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenNames = new Set();

  return value
    .map((client, index) => {
      const name = cleanString(client?.name);
      const normalizedName = name.toLowerCase();

      if (!name || seenNames.has(normalizedName)) {
        return null;
      }

      seenNames.add(normalizedName);

      return {
        name,
        logoUrl: cleanString(client?.logoUrl),
        logoAlt: cleanString(client?.logoAlt),
        isVisible: client?.isVisible !== false,
        order: index + 1,
      };
    })
    .filter(Boolean);
}

function normalizeTestimonialsSection(section = {}) {
  return {
    ...normalizeListingSection(section),
    trustedHeading: cleanString(section?.trustedHeading),
    trustedDescription: cleanString(section?.trustedDescription),
    trustedClients: normalizeTestimonialsTrustedClients(
      section?.trustedClients,
    ),
  };
}

function getContactContentValue(section, fieldName, fallbackValue) {
  if (section?.[fieldName] === undefined || section?.[fieldName] === null) {
    return fallbackValue;
  }

  return cleanString(section[fieldName]);
}

function normalizeContactSection(section = {}) {
  return {
    eyebrow: cleanString(section?.eyebrow),

    heading: cleanString(section?.heading),

    description: cleanString(section?.description),

    showServicesOnContactPage:
      section?.showServicesOnContactPage !== false,

    showFaqOnContactPage:
      section?.showFaqOnContactPage !== false,

    showTestimonialsOnContactPage:
      section?.showTestimonialsOnContactPage !== false,

    enquiryEyebrow: cleanString(section?.enquiryEyebrow),

    enquiryHeading: cleanString(section?.enquiryHeading),

    enquiryDescription: cleanString(section?.enquiryDescription),

    formHeading: getContactContentValue(
      section,
      "formHeading",
      "Send a Message",
    ),

    formDescription: getContactContentValue(
      section,
      "formDescription",
      "Share the project details and I will get back to you.",
    ),

    socialHeading: getContactContentValue(
      section,
      "socialHeading",
      "Connect With Me",
    ),

    socialDescription: getContactContentValue(
      section,
      "socialDescription",
      "Find me on social media.",
    ),

    freelancerHeading: getContactContentValue(
      section,
      "freelancerHeading",
      "Freelancer Profiles",
    ),

    freelancerDescription: getContactContentValue(
      section,
      "freelancerDescription",
      "Hire me on trusted platforms.",
    ),

    submitLabel: getContactContentValue(
      section,
      "submitLabel",
      "Send Message",
    ),

    privacyNote: getContactContentValue(
      section,
      "privacyNote",
      "Your information is safe and secure. I respect your privacy.",
    ),
  };
}

function normalizeSection(section, index) {
  const numericOrder = Number(section?.order);

  const normalizedOrder =
    Number.isFinite(numericOrder) && numericOrder >= 0
      ? numericOrder
      : index + 1;

  const numericNavigationOrder = Number(section?.navigationOrder);

  const numericFooterNavigationOrder = Number(
    section?.footerNavigationOrder,
  );

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
     * Footer Quick Links visibility.
     */
    isFooterNavigationVisible: section?.isFooterNavigationVisible !== false,

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

    /*
     * Footer Quick Links ka independent order.
     * Client registry merge legacy records ke liye
     * canonical Footer default supply karta hai.
     */
    footerNavigationOrder:
      Number.isFinite(numericFooterNavigationOrder) &&
      numericFooterNavigationOrder >= 0
        ? numericFooterNavigationOrder
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

function unifyBlogNewsSections(value) {
  const sections = normalizeSections(value);
  const blogSection = sections.find((section) => section.key === "blog");
  const newsSection = sections.find((section) => section.key === "news");

  if (!blogSection || !newsSection) {
    return sections;
  }

  const blogLabel = cleanString(blogSection.label) || "Blog";
  const newsLabel = cleanString(newsSection.label) || "News";

  const combinedLabel =
    blogLabel === newsLabel
      ? blogLabel
      : /blog.*news|news.*blog/i.test(blogLabel)
        ? blogLabel
        : /blog.*news|news.*blog/i.test(newsLabel)
          ? newsLabel
          : `${blogLabel} & ${newsLabel}`;

  return sections.map((section) => {
    if (section.key === "blog") {
      return {
        ...section,
        label: combinedLabel,
      };
    }

    if (section.key === "news") {
      return {
        ...section,
        label: combinedLabel,
        isNavigationVisible: false,
        isFooterNavigationVisible: false,
        isPageVisible: false,
        navigationOrder: blogSection.navigationOrder,
        footerNavigationOrder: blogSection.footerNavigationOrder,
      };
    }

    return section;
  });
}

function createEmptyHeroQuickLink(order = 1) {
  return {
    label: "",
    url: "",
    iconUrl: "",
    openInNewTab: false,
    isVisible: true,
    order,
  };
}

function normalizeHeroQuickLink(item, index) {
  const numericOrder = Number(item?.order);

  return {
    label: cleanString(item?.label),
    url: cleanString(item?.url),
    iconUrl: cleanString(item?.iconUrl),
    openInNewTab: item?.openInNewTab === true,
    isVisible: item?.isVisible !== false,
    order:
      Number.isFinite(numericOrder) && numericOrder >= 0
        ? numericOrder
        : index + 1,
  };
}

function normalizeHeroQuickLinks(value) {
  const source = Array.isArray(value) ? value : [];

  return source
    .map((item, index) => normalizeHeroQuickLink(item, index))
    .sort(
      (firstItem, secondItem) =>
        firstItem.order - secondItem.order,
    );
}

function createEmptyAboutWorkItem(order = 1) {
  return {
    type: "",
    title: "",
    url: "",
    openInNewTab: false,
    isVisible: true,
    order,
  };
}

function normalizeAboutWorkItem(item, index) {
  const numericOrder = Number(item?.order);

  return {
    type: cleanString(item?.type),
    title: cleanString(item?.title),
    url: cleanString(item?.url),
    openInNewTab: item?.openInNewTab === true,
    isVisible: item?.isVisible !== false,
    order:
      Number.isFinite(numericOrder) && numericOrder >= 0
        ? numericOrder
        : index + 1,
  };
}

function normalizeAboutWorkItems(value) {
  const source = Array.isArray(value) ? value : [];

  return source
    .map((item, index) => normalizeAboutWorkItem(item, index))
    .sort(
      (firstItem, secondItem) =>
        firstItem.order - secondItem.order,
    );
}

function createEmptyAboutIdentityRole(order = 1) {
  return {
    label: "",
    isVisible: true,
    order,
  };
}

function normalizeAboutIdentityRole(role, index) {
  const numericOrder = Number(role?.order);

  return {
    label: cleanString(role?.label),
    isVisible: role?.isVisible !== false,
    order:
      Number.isFinite(numericOrder) && numericOrder >= 0
        ? numericOrder
        : index + 1,
  };
}

function normalizeAboutIdentityRoles(value) {
  const source = Array.isArray(value) ? value : [];

  return source
    .map((role, index) => normalizeAboutIdentityRole(role, index))
    .sort(
      (firstRole, secondRole) =>
        firstRole.order - secondRole.order,
    );
}

function createEmptyTestimonialTrustedClient(order = 1) {
  return {
    name: "",
    logoUrl: "",
    logoAlt: "",
    isVisible: true,
    order,
  };
}

function createEmptyPlatform(order = 1) {
  return {
    name: "",
    username: "",
    url: "",
    iconUrl: "",
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

    iconUrl: cleanString(platform?.iconUrl),

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
      coverImageUrl: cleanString(hero.coverImageUrl),

      eyebrow: cleanString(hero.eyebrow),

      heading: cleanString(hero.heading) || cleanString(hero.title),

      description: cleanString(hero.description),

      primaryButton: normalizeButton(primaryButton),

      secondaryButton: normalizeButton(secondaryButton),

      quickLinks: normalizeHeroQuickLinks(hero.quickLinks),
    },

    about: {
      eyebrow: cleanString(about.eyebrow),

      heading: cleanString(about.heading) || cleanString(about.title),

      description: aboutDescription,

      identityRoles: normalizeAboutIdentityRoles(about.identityRoles),

      workItems: normalizeAboutWorkItems(about.workItems),
    },

    statisticsSection: normalizeListingSection(settings?.statisticsSection),

    skillsSection: normalizeListingSection(settings?.skillsSection),

    servicesSection: normalizeListingSection(settings?.servicesSection),

    projectsSection: normalizeListingSection(settings?.projectsSection),

    caseStudiesSection: normalizeListingSection(settings?.caseStudiesSection),

    educationSection: normalizeListingSection(settings?.educationSection),

    experienceSection: normalizeListingSection(settings?.experienceSection),

    achievementsSection: normalizeListingSection(settings?.achievementsSection),

    teamSection: normalizeListingSection(settings?.teamSection),

    companiesSection: normalizeListingSection(settings?.companiesSection),

    clientsPartnersSection: normalizeListingSection(
      settings?.clientsPartnersSection,
    ),

    testimonialsSection: normalizeTestimonialsSection(
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

    iconUrl: cleanString(platform.iconUrl),

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

function createHeroQuickLinksPayload(items) {
  return normalizeHeroQuickLinks(items).map((item, index) => ({
    label: item.label,
    url: item.url,
    iconUrl: item.iconUrl,
    openInNewTab: item.openInNewTab === true,
    isVisible: item.isVisible !== false,
    order: index + 1,
  }));
}

function createAboutWorkItemsPayload(items) {
  return normalizeAboutWorkItems(items).map((item, index) => ({
    type: item.type,
    title: item.title,
    url: item.url,
    openInNewTab: item.openInNewTab === true,
    isVisible: item.isVisible !== false,
    order: index + 1,
  }));
}

function createAboutIdentityRolesPayload(roles) {
  return normalizeAboutIdentityRoles(roles).map((role, index) => ({
    label: role.label,
    isVisible: role.isVisible !== false,
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

function createTestimonialsSectionPayload(section) {
  const normalizedSection = normalizeTestimonialsSection(section);

  return {
    eyebrow: normalizedSection.eyebrow,
    heading: normalizedSection.heading,
    description: normalizedSection.description,
    ctaButton: {
      label: normalizedSection.ctaButton.label,
      url: normalizedSection.ctaButton.url,
    },
    trustedHeading: normalizedSection.trustedHeading,
    trustedDescription: normalizedSection.trustedDescription,
    trustedClients: normalizedSection.trustedClients.map((client, index) => ({
      name: client.name,
      logoUrl: client.logoUrl,
      logoAlt: client.logoAlt,
      isVisible: client.isVisible !== false,
      order: index + 1,
    })),
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
      coverImageUrl: values.hero.coverImageUrl,

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

      quickLinks: createHeroQuickLinksPayload(
        values.hero.quickLinks,
      ),
    },

    about: {
      eyebrow: values.about.eyebrow,

      heading: values.about.heading,

      description: values.about.description,

      identityRoles: createAboutIdentityRolesPayload(
        values.about.identityRoles,
      ),

      workItems: createAboutWorkItemsPayload(
        values.about.workItems,
      ),
    },

    statisticsSection: createListingSectionPayload(values.statisticsSection),

    skillsSection: createListingSectionPayload(values.skillsSection),

    servicesSection: createListingSectionPayload(values.servicesSection),

    projectsSection: createListingSectionPayload(values.projectsSection),

    caseStudiesSection: createListingSectionPayload(values.caseStudiesSection),

    educationSection: createListingSectionPayload(values.educationSection),

    experienceSection: createListingSectionPayload(values.experienceSection),

    achievementsSection: createListingSectionPayload(values.achievementsSection),

    teamSection: createListingSectionPayload(values.teamSection),

    companiesSection: createListingSectionPayload(values.companiesSection),

    clientsPartnersSection: createListingSectionPayload(
      values.clientsPartnersSection,
    ),

    testimonialsSection: createTestimonialsSectionPayload(
      values.testimonialsSection,
    ),

    faqSection: createListingSectionPayload(values.faqSection),

    postsSection: createListingSectionPayload(values.postsSection),

    contactSection: {
      eyebrow: values.contactSection.eyebrow,

      heading: values.contactSection.heading,

      description: values.contactSection.description,

      showServicesOnContactPage:
        values.contactSection.showServicesOnContactPage !== false,

      showFaqOnContactPage:
        values.contactSection.showFaqOnContactPage !== false,

      showTestimonialsOnContactPage:
        values.contactSection.showTestimonialsOnContactPage !== false,

      enquiryEyebrow: values.contactSection.enquiryEyebrow,

      enquiryHeading: values.contactSection.enquiryHeading,

      enquiryDescription: values.contactSection.enquiryDescription,

      formHeading: values.contactSection.formHeading,

      formDescription: values.contactSection.formDescription,

      socialHeading: values.contactSection.socialHeading,

      socialDescription: values.contactSection.socialDescription,

      freelancerHeading: values.contactSection.freelancerHeading,

      freelancerDescription: values.contactSection.freelancerDescription,

      submitLabel: values.contactSection.submitLabel,

      privacyNote: values.contactSection.privacyNote,
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

    sections: unifyBlogNewsSections(values.sections).map((section, index) => ({
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
       * Footer Quick Links visibility.
       */
      isFooterNavigationVisible: section.isFooterNavigationVisible,

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

      /*
       * Footer order Navbar aur homepage order
       * se independently preserve hoga.
       */
      footerNavigationOrder: section.footerNavigationOrder,
    })),

    isPublished: values.isPublished,
  };
}

export {
  createArrayFromLines,
  createEmptyAboutIdentityRole,
  createEmptyAboutWorkItem,
  createEmptyHeroQuickLink,
  createEmptyLegalLink,
  createEmptyPlatform,
  createEmptyTestimonialTrustedClient,
  createKeywordsArray,
  createSiteSettingsFormValues,
  createSiteSettingsPayload,
  defaultFooterLegalLinks,
  defaultPlatformGroups,
  defaultSections,
  normalizeLegalLinks,
  normalizePlatforms,
};
