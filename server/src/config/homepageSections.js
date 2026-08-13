const homepageSectionDefinitions = [
  {
    key: "hero",
    label: "Hero",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 1,
    navigationOrder: 1,
    footerNavigationOrder: 1,
  },
  {
    key: "about",
    label: "About",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 2,
    navigationOrder: 2,
    footerNavigationOrder: 2,
  },
  {
    key: "statistics",
    label: "Statistics",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: false,
    isPageVisible: true,
    order: 3,
    navigationOrder: 3,
    footerNavigationOrder: 3,
  },
  {
    key: "skills",
    label: "Skills",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 4,
    navigationOrder: 4,
    footerNavigationOrder: 4,
  },
  {
    key: "services",
    label: "Services",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 5,
    navigationOrder: 5,
    footerNavigationOrder: 5,
  },
  {
    key: "projects",
    label: "Projects",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 6,
    navigationOrder: 6,
    footerNavigationOrder: 6,
  },
  {
    key: "case-studies",
    label: "Case Studies",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 7,
    navigationOrder: 7,
    footerNavigationOrder: 7,
  },
  {
    key: "education",
    label: "Education",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 8,
    navigationOrder: 8,
    footerNavigationOrder: 8,
  },
  {
    key: "experience",
    label: "Experience",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 9,
    navigationOrder: 9,
    footerNavigationOrder: 9,
  },
  {
    key: "achievements",
    label: "Achievements",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 10,
    navigationOrder: 10,
    footerNavigationOrder: 10,
  },
  {
    key: "team",
    label: "Team",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 11,
    navigationOrder: 11,
    footerNavigationOrder: 11,
  },
  {
    key: "companies",
    label: "Companies",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 12,
    navigationOrder: 12,
    footerNavigationOrder: 12,
  },
  {
    key: "clients-partners",
    label: "Clients & Partners",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 13,
    navigationOrder: 13,
    footerNavigationOrder: 13,
  },
  {
    key: "posts",
    label: "Articles & News",
    isVisible: true,
    isNavigationVisible: false,
    isFooterNavigationVisible: false,
    isPageVisible: false,
    order: 14,
    navigationOrder: 14,
    footerNavigationOrder: 14,
  },
  {
    key: "testimonials",
    label: "Testimonials",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 15,
    navigationOrder: 14,
    footerNavigationOrder: 15,
  },
  {
    key: "faq",
    label: "FAQ",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 16,
    navigationOrder: 15,
    footerNavigationOrder: 16,
  },
  {
    key: "contact",
    label: "Contact",
    isVisible: true,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 17,
    navigationOrder: 16,
    footerNavigationOrder: 17,
  },
  {
    key: "blog",
    label: "Blog",
    isVisible: false,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 18,
    navigationOrder: 17,
    footerNavigationOrder: 18,
  },
  {
    key: "news",
    label: "News",
    isVisible: false,
    isNavigationVisible: true,
    isFooterNavigationVisible: true,
    isPageVisible: true,
    order: 19,
    navigationOrder: 18,
    footerNavigationOrder: 19,
  },
  {
    key: "consultation",
    label: "Consultation",
    isVisible: false,
    isNavigationVisible: false,
    isFooterNavigationVisible: false,
    isPageVisible: true,
    order: 20,
    navigationOrder: 20,
    footerNavigationOrder: 20,
  },
];

const homepageSectionDefinitionByKey = new Map(
  homepageSectionDefinitions.map((section) => [section.key, section]),
);

const defaultOrderBySectionKey = Object.fromEntries(
  homepageSectionDefinitions.map((section) => [section.key, section.order]),
);

function cleanSectionText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBoolean(value, fallbackValue) {
  return typeof value === "boolean" ? value : fallbackValue;
}

function normalizeOrder(value, fallbackValue) {
  const numericOrder = Number(value);

  return Number.isFinite(numericOrder) && numericOrder >= 0
    ? numericOrder
    : fallbackValue;
}

function normalizeHomepageSection(section, index) {
  const key = cleanSectionText(section?.key).toLowerCase();

  const definition = homepageSectionDefinitionByKey.get(key);

  const fallbackOrder = definition?.order ?? index + 1;

  return {
    key,

    label:
      cleanSectionText(section?.label) ||
      definition?.label ||
      "",

    /*
     * Homepage section visibility.
     */
    isVisible: normalizeBoolean(
      section?.isVisible,
      definition?.isVisible ?? true,
    ),

    /*
     * Desktop aur mobile Navbar visibility.
     */
    isNavigationVisible: normalizeBoolean(
      section?.isNavigationVisible,
      definition?.isNavigationVisible ?? true,
    ),

    /*
     * Footer quick-link visibility.
     *
     * Purane records mein field absent hone par
     * canonical per-section default use hoga.
     */
    isFooterNavigationVisible: normalizeBoolean(
      section?.isFooterNavigationVisible,
      definition?.isFooterNavigationVisible ?? false,
    ),

    /*
     * Dedicated public page accessibility.
     */
    isPageVisible: normalizeBoolean(
      section?.isPageVisible,
      definition?.isPageVisible ?? true,
    ),

    /*
     * Homepage section display order.
     */
    order: normalizeOrder(
      section?.order,
      fallbackOrder,
    ),

    /*
     * Navbar menu ka independent order.
     */
    navigationOrder: normalizeOrder(
      section?.navigationOrder,
      definition?.navigationOrder ?? fallbackOrder,
    ),

    /*
     * Footer quick links ka independent order.
     */
    footerNavigationOrder: normalizeOrder(
      section?.footerNavigationOrder,
      definition?.footerNavigationOrder ?? fallbackOrder,
    ),
  };
}

function mergeHomepageSections(value) {
  const providedSections = Array.isArray(value)
    ? value
        .map((section, index) => normalizeHomepageSection(section, index))
        .filter(
          (section) =>
            section.key &&
            homepageSectionDefinitionByKey.has(section.key),
        )
    : [];

  const providedSectionsByKey = new Map();

  providedSections.forEach((section) => {
    if (!providedSectionsByKey.has(section.key)) {
      providedSectionsByKey.set(section.key, section);
    }
  });

  const mergedSections = homepageSectionDefinitions.map((definition) => {
    const providedSection = providedSectionsByKey.get(definition.key);

    if (!providedSection) {
      return {
        ...definition,
      };
    }

    return {
      ...definition,
      ...providedSection,

      label: providedSection.label || definition.label,
    };
  });

  return mergedSections.sort((firstSection, secondSection) => {
    const orderDifference = firstSection.order - secondSection.order;

    if (orderDifference !== 0) {
      return orderDifference;
    }

    return (
      (defaultOrderBySectionKey[firstSection.key] ??
        Number.MAX_SAFE_INTEGER) -
      (defaultOrderBySectionKey[secondSection.key] ??
        Number.MAX_SAFE_INTEGER)
    );
  });
}

export {
  defaultOrderBySectionKey,
  homepageSectionDefinitions,
  mergeHomepageSections,
  normalizeHomepageSection,
};

export default homepageSectionDefinitions;
