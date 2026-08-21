import {
  homepageSectionDefinitions,
  mergeHomepageSections,
} from "../config/homepageSections";

const publicNavigationDestinations = Object.freeze({
  hero: {
    type: "section",
    href: "/",
    targetId: "home",
    navbar: true,
    footer: true,
  },
  about: {
    type: "section",
    href: "/#about",
    targetId: "about",
    navbar: true,
    footer: true,
  },
  statistics: {
    type: "section",
    href: "/#statistics",
    targetId: "statistics",
    navbar: true,
    footer: true,
  },
  skills: {
    type: "page",
    href: "/skills",
    navbar: true,
    footer: true,
  },
  services: {
    type: "page",
    href: "/services",
    navbar: true,
    footer: true,
  },
  projects: {
    type: "page",
    href: "/projects",
    navbar: true,
    footer: true,
  },
  "case-studies": {
    type: "page",
    href: "/case-studies",
    navbar: true,
    footer: true,
  },
  education: {
    type: "page",
    href: "/education",
    navbar: true,
    footer: true,
  },
  experience: {
    type: "page",
    href: "/experience",
    navbar: true,
    footer: true,
  },
  achievements: {
    type: "page",
    href: "/achievements",
    navbar: true,
    footer: true,
  },
  team: {
    type: "page",
    href: "/team",
    navbar: true,
    footer: true,
  },
  companies: {
    type: "page",
    href: "/companies",
    navbar: true,
    footer: true,
  },
  "clients-partners": {
    type: "page",
    href: "/clients-partners",
    navbar: true,
    footer: true,
  },
  testimonials: {
    type: "page",
    href: "/testimonials",
    navbar: true,
    footer: true,
  },
  faq: {
    type: "page",
    href: "/faq",
    navbar: true,
    footer: true,
  },
  contact: {
    type: "section",
    href: "/#contact",
    targetId: "contact",
    navbar: true,
    footer: true,
  },
  blog: {
    type: "page",
    href: "/blog",
    navbar: true,
    footer: true,
  },
  news: {
    type: "page",
    href: "/news",
    navbar: true,
    footer: true,
  },
  consultation: {
    type: "page",
    href: "/consultation",
    navbar: true,
    footer: true,
  },
});

const defaultSectionByKey = Object.fromEntries(
  homepageSectionDefinitions.map((section) => [section.key, section]),
);

function normalizeSectionKey(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();

  return key === "home" ? "hero" : key;
}

function getSafeSectionLabel(sectionKey, value) {
  const label = String(value || "").trim();

  if (sectionKey === "hero" && label.toLowerCase() === "hero") {
    return "Home";
  }

  return label || defaultSectionByKey[sectionKey]?.label || sectionKey;
}

function getSafeOrder(value, fallbackValue) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) && numericValue >= 0
    ? numericValue
    : fallbackValue;
}

function getDestinationAvailability(section, destination) {
  if (!section || !destination) {
    return false;
  }

  if (section.key === "hero") {
    return true;
  }

  if (destination.type === "page") {
    return section.isPageVisible !== false;
  }

  return section.isVisible !== false;
}

function createPublicNavigationItems(settingsSections) {
  const mergedSections = mergeHomepageSections(settingsSections);

  const mergedSectionByKey = new Map(
    mergedSections.map((section) => [normalizeSectionKey(section?.key), section]),
  );

  return Object.entries(publicNavigationDestinations).map(
    ([key, destination]) => {
      const defaultSection = defaultSectionByKey[key] || {};
      const sourceSection = mergedSectionByKey.get(key) || defaultSection;

      const homepageOrder = getSafeOrder(
        sourceSection?.order,
        defaultSection.order ?? 0,
      );

      const navigationOrder = getSafeOrder(
        sourceSection?.navigationOrder,
        defaultSection.navigationOrder ?? homepageOrder,
      );

      const footerNavigationOrder = getSafeOrder(
        sourceSection?.footerNavigationOrder,
        defaultSection.footerNavigationOrder ?? homepageOrder,
      );

      const item = {
        key,
        label: getSafeSectionLabel(key, sourceSection?.label),
        type: destination.type,
        href: destination.href,
        targetId: destination.targetId || "",
        isHomepageVisible: sourceSection?.isVisible !== false,
        isNavigationVisible: sourceSection?.isNavigationVisible !== false,
        isFooterNavigationVisible:
          sourceSection?.isFooterNavigationVisible !== false,
        isPageVisible: sourceSection?.isPageVisible !== false,
        homepageOrder,
        navigationOrder,
        footerNavigationOrder,
        navbarCapable: destination.navbar !== false,
        footerCapable: destination.footer !== false,
      };

      return {
        ...item,
        isDestinationAvailable: getDestinationAvailability(item, destination),
      };
    },
  );
}

function sortByNavigationOrder(firstItem, secondItem) {
  const orderDifference = firstItem.navigationOrder - secondItem.navigationOrder;

  if (orderDifference !== 0) {
    return orderDifference;
  }

  return (
    (defaultSectionByKey[firstItem.key]?.navigationOrder || 0) -
    (defaultSectionByKey[secondItem.key]?.navigationOrder || 0)
  );
}

function sortByFooterNavigationOrder(firstItem, secondItem) {
  const orderDifference =
    firstItem.footerNavigationOrder - secondItem.footerNavigationOrder;

  if (orderDifference !== 0) {
    return orderDifference;
  }

  return (
    (defaultSectionByKey[firstItem.key]?.footerNavigationOrder || 0) -
    (defaultSectionByKey[secondItem.key]?.footerNavigationOrder || 0)
  );
}

function getNavbarNavigationItems(settingsSections) {
  return createPublicNavigationItems(settingsSections)
    .filter(
      (item) =>
        item.navbarCapable &&
        item.isNavigationVisible !== false &&
        item.isDestinationAvailable !== false,
    )
    .sort(sortByNavigationOrder);
}

function getFooterNavigationItems(settingsSections) {
  return createPublicNavigationItems(settingsSections)
    .filter(
      (item) =>
        item.footerCapable &&
        item.isFooterNavigationVisible !== false &&
        item.isDestinationAvailable !== false,
    )
    .sort(sortByFooterNavigationOrder);
}

function getPublicNavigationItem(settingsSections, sectionKey) {
  const normalizedKey = normalizeSectionKey(sectionKey);

  return (
    createPublicNavigationItems(settingsSections).find(
      (item) => item.key === normalizedKey,
    ) || null
  );
}

function isPublicNavigationDestinationAvailable(settingsSections, sectionKey) {
  const item = getPublicNavigationItem(settingsSections, sectionKey);

  return item?.isDestinationAvailable !== false && Boolean(item);
}

function isPublicNavigationItemActive(item, pathname, hash) {
  if (!item) {
    return false;
  }

  if (item.key === "hero") {
    return pathname === "/" && (!hash || hash === "#home");
  }

  if (item.type === "section") {
    return pathname === "/" && hash === `#${item.targetId}`;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export {
  createPublicNavigationItems,
  getFooterNavigationItems,
  getNavbarNavigationItems,
  getPublicNavigationItem,
  isPublicNavigationDestinationAvailable,
  isPublicNavigationItemActive,
  normalizeSectionKey,
  publicNavigationDestinations,
};
