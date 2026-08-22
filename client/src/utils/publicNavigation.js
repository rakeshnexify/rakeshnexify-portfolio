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
    navbarHref: "https://idomere.com",
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
    type: "menu",
    href: "",
    navbar: true,
    footer: false,
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

  if (section.key === "hero" || destination.type === "menu") {
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
        navbarHref: destination.navbarHref || "",
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

function createPinnedNavigationLayout(
  items,
  maximumDirectItems,
  pinnedKey = "companies",
) {
  const sourceItems = Array.isArray(items) ? items : [];
  const safeMaximum = Math.max(0, Math.floor(Number(maximumDirectItems) || 0));

  if (safeMaximum === 0) {
    return {
      directItems: [],
      overflowItems: sourceItems,
    };
  }

  if (sourceItems.length <= safeMaximum) {
    return {
      directItems: sourceItems,
      overflowItems: [],
    };
  }

  const pinnedIndex = sourceItems.findIndex((item) => item?.key === pinnedKey);

  if (pinnedIndex < 0 || pinnedIndex < safeMaximum) {
    return {
      directItems: sourceItems.slice(0, safeMaximum),
      overflowItems: sourceItems.slice(safeMaximum),
    };
  }

  const pinnedItem = sourceItems[pinnedIndex];
  const directItems = [
    ...sourceItems.slice(0, Math.max(0, safeMaximum - 1)),
    pinnedItem,
  ];
  const directKeys = new Set(directItems.map((item) => item?.key));

  return {
    directItems,
    overflowItems: sourceItems.filter((item) => !directKeys.has(item?.key)),
  };
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
    .map((item) => ({
      ...item,
      href: item.navbarHref || item.href,
      isExternalNavigation: Boolean(item.navbarHref),
    }))
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
  if (!item || item.type === "menu") {
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
  createPinnedNavigationLayout,
  createPublicNavigationItems,
  getFooterNavigationItems,
  getNavbarNavigationItems,
  getPublicNavigationItem,
  isPublicNavigationDestinationAvailable,
  isPublicNavigationItemActive,
  normalizeSectionKey,
  publicNavigationDestinations,
};
