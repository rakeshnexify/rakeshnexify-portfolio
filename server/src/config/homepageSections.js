const homepageSectionDefinitions = [
  {
    key: "hero",
    label: "Hero",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 1,
    navigationOrder: 1,
  },
  {
    key: "about",
    label: "About",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 2,
    navigationOrder: 2,
  },
  {
    key: "statistics",
    label: "Statistics",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 3,
    navigationOrder: 3,
  },
  {
    key: "skills",
    label: "Skills",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 4,
    navigationOrder: 4,
  },
  {
    key: "services",
    label: "Services",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 5,
    navigationOrder: 5,
  },
  {
    key: "projects",
    label: "Projects",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 6,
    navigationOrder: 6,
  },
  {
    key: "education",
    label: "Education",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 7,
    navigationOrder: 7,
  },
  {
    key: "experience",
    label: "Experience",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 8,
    navigationOrder: 8,
  },
  {
    key: "team",
    label: "Team",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 9,
    navigationOrder: 9,
  },
  {
    key: "companies",
    label: "Companies",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 10,
    navigationOrder: 10,
  },
  {
    key: "testimonials",
    label: "Testimonials",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 11,
    navigationOrder: 11,
  },
  {
    key: "contact",
    label: "Contact",
    isVisible: true,
    isNavigationVisible: true,
    isPageVisible: true,
    order: 12,
    navigationOrder: 12,
  },
];

const defaultOrderBySectionKey = Object.fromEntries(
  homepageSectionDefinitions.map((section) => [section.key, section.order]),
);

function cleanSectionText(value) {
  return String(value ?? "").trim();
}

function normalizeHomepageSection(section, index) {
  const numericOrder = Number(section?.order);

  const normalizedOrder =
    Number.isFinite(numericOrder) && numericOrder >= 0
      ? numericOrder
      : index + 1;

  const numericNavigationOrder = Number(section?.navigationOrder);

  return {
    key: cleanSectionText(section?.key).toLowerCase(),

    label: cleanSectionText(section?.label),

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
     * Homepage section display order.
     */
    order: normalizedOrder,

    /*
     * Navbar menu ka independent order.
     * Purane records mein field absent hone
     * par homepage order fallback rahega.
     */
    navigationOrder:
      Number.isFinite(numericNavigationOrder) && numericNavigationOrder >= 0
        ? numericNavigationOrder
        : normalizedOrder,
  };
}

function mergeHomepageSections(value) {
  const providedSections = Array.isArray(value)
    ? value
        .map((section, index) => normalizeHomepageSection(section, index))
        .filter((section) => section.key)
    : [];

  const providedSectionsByKey = new Map();

  providedSections.forEach((section) => {
    if (!providedSectionsByKey.has(section.key)) {
      providedSectionsByKey.set(section.key, section);
    }
  });

  const mergedSections = homepageSectionDefinitions.map((definition) => {
    const providedSection = providedSectionsByKey.get(definition.key);

    providedSectionsByKey.delete(definition.key);

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

  const additionalSections = [...providedSectionsByKey.values()];

  return [...mergedSections, ...additionalSections].sort(
    (firstSection, secondSection) => {
      const orderDifference = firstSection.order - secondSection.order;

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return (
        (defaultOrderBySectionKey[firstSection.key] ??
          Number.MAX_SAFE_INTEGER) -
        (defaultOrderBySectionKey[secondSection.key] ?? Number.MAX_SAFE_INTEGER)
      );
    },
  );
}

export {
  defaultOrderBySectionKey,
  homepageSectionDefinitions,
  mergeHomepageSections,
  normalizeHomepageSection,
};

export default homepageSectionDefinitions;
