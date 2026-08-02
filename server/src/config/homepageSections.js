const homepageSectionDefinitions = [
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

const defaultOrderBySectionKey = Object.fromEntries(
  homepageSectionDefinitions.map((section) => [section.key, section.order]),
);

function cleanSectionText(value) {
  return String(value ?? "").trim();
}

function normalizeHomepageSection(section, index) {
  const numericOrder = Number(section?.order);

  return {
    key: cleanSectionText(section?.key).toLowerCase(),

    label: cleanSectionText(section?.label),

    isVisible: section?.isVisible !== false,

    order:
      Number.isFinite(numericOrder) && numericOrder >= 0
        ? numericOrder
        : index + 1,
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
