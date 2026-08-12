import { Link } from "react-router";

import { mergeHomepageSections } from "../../config/homepageSections";
import siteData from "../../data/siteData";
import useServices from "../../hooks/useServices";
import useSiteSettings from "../../hooks/useSiteSettings";
import NewsletterSignupForm from "../newsletter/NewsletterSignupForm";
import Logo from "../ui/Logo";
import Container from "./Container";

const defaultNavigationSections = [
  {
    key: "hero",
    label: "Home",
    href: "/",
    isVisible: true,
    order: 1,
  },
  {
    key: "about",
    label: "About",
    href: "/#about",
    isVisible: true,
    order: 2,
  },
  {
    key: "skills",
    label: "Skills",
    href: "/skills",
    isVisible: true,
    order: 3,
  },
  {
    key: "services",
    label: "Services",
    href: "/services",
    isVisible: true,
    order: 4,
  },
  {
    key: "projects",
    label: "Projects",
    href: "/projects",
    isVisible: true,
    order: 6,
  },
  {
    key: "case-studies",
    label: "Case Studies",
    href: "/case-studies",
    isVisible: true,
    order: 7,
  },
  {
    key: "education",
    label: "Education",
    href: "/education",
    isVisible: true,
    order: 8,
  },
  {
    key: "experience",
    label: "Experience",
    href: "/experience",
    isVisible: true,
    order: 9,
  },
  {
    key: "achievements",
    label: "Achievements",
    href: "/achievements",
    isVisible: true,
    order: 10,
  },
  {
    key: "team",
    label: "Team",
    href: "/team",
    isVisible: true,
    order: 11,
  },
  {
    key: "companies",
    label: "Companies",
    href: "/companies",
    isVisible: true,
    order: 12,
  },
  {
    key: "clients-partners",
    label: "Clients & Partners",
    href: "/clients-partners",
    isVisible: true,
    order: 13,
  },
  {
    key: "testimonials",
    label: "Testimonials",
    href: "/testimonials",
    isVisible: true,
    order: 15,
  },
  {
    key: "faq",
    label: "FAQ",
    href: "/faq",
    isVisible: true,
    order: 16,
  },
  {
    key: "contact",
    label: "Contact",
    href: "/#contact",
    isVisible: true,
    order: 17,
  },
  {
    key: "blog",
    label: "Blog",
    href: "/blog",
    isVisible: true,
    order: 18,
  },
  {
    key: "news",
    label: "News",
    href: "/news",
    isVisible: true,
    order: 19,
  },
];

const defaultSectionByKey = Object.fromEntries(
  defaultNavigationSections.map((section) => [section.key, section]),
);

const dedicatedPageSectionKeys = new Set([
  "skills",
  "services",
  "projects",
  "case-studies",
  "education",
  "experience",
  "achievements",
  "team",
  "companies",
  "clients-partners",
  "testimonials",
  "faq",
  "blog",
  "news",
]);

const supportedFooterSections = new Set(
  defaultNavigationSections.map((section) => section.key),
);

const defaultFooterContent = {
  introduction:
    "Developer, creator and entrepreneur building modern digital products.",

  quickLinksHeading: "Quick Links",

  servicesHeading: "Services",

  platformsHeading: "Platforms",

  platformNote: "Profiles without official URLs remain disabled.",

  projectButton: {
    label: "Start a project with me",
    url: "/#contact",
  },

  /*
   * Legal links tabhi show honge jab Admin
   * Panel me valid URL ke saath add honge.
   */
  legalLinks: [],

  copyrightText: "All rights reserved.",
};

function normaliseSectionKey(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();

  return key === "home" ? "hero" : key;
}

function sortByOrder(firstItem, secondItem) {
  const firstOrder = Number(firstItem?.order);

  const secondOrder = Number(secondItem?.order);

  const safeFirstOrder = Number.isFinite(firstOrder) ? firstOrder : 0;

  const safeSecondOrder = Number.isFinite(secondOrder) ? secondOrder : 0;

  return safeFirstOrder - safeSecondOrder;
}

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const characterCode = text.charCodeAt(index);

    if (characterCode <= 31 || characterCode === 127) {
      return true;
    }
  }

  return false;
}

function getSafePublicUrl(value, fallbackUrl = "") {
  const url = String(value || "").trim();

  if (!url || containsControlCharacters(url)) {
    return fallbackUrl;
  }

  if (/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(url)) {
    return url;
  }

  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      parsedUrl.hostname &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return url;
    }
  } catch {
    return fallbackUrl;
  }

  return fallbackUrl;
}

function getSafeHttpUrl(value) {
  const safeUrl = getSafePublicUrl(value);

  if (safeUrl.startsWith("http://") || safeUrl.startsWith("https://")) {
    return safeUrl;
  }

  return "";
}

function getSafeSectionLabel(key, value) {
  const label = String(value || "").trim();

  if (key === "hero" && label.toLowerCase() === "hero") {
    return "Home";
  }

  return label || defaultSectionByKey[key]?.label || key;
}

function createNavigationLinks(settingsSections) {
  const sourceSections = mergeHomepageSections(settingsSections);

  const sectionsByKey = new Map();

  sourceSections.forEach((section, index) => {
    const key = normaliseSectionKey(section?.key);

    if (!key || !supportedFooterSections.has(key)) {
      return;
    }

    const defaultSection = defaultSectionByKey[key];

    const numericOrder = Number(section?.order);

    const isHomepageVisible = section?.isVisible !== false;

    const isPageVisible = section?.isPageVisible !== false;

    const isDestinationAvailable =
      key === "hero" ||
      (dedicatedPageSectionKeys.has(key) ? isPageVisible : isHomepageVisible);

    sectionsByKey.set(key, {
      key,

      label: getSafeSectionLabel(key, section?.label),

      href: defaultSection.href,

      isHomepageVisible,

      isPageVisible,

      /*
       * Homepage-only links ko homepage visibility
       * aur dedicated page links ko public-page
       * accessibility control karegi.
       */
      isVisible: isDestinationAvailable,

      order: Number.isFinite(numericOrder)
        ? numericOrder
        : (defaultSection.order ?? index + 1),
    });
  });

  if (!sectionsByKey.has("hero")) {
    sectionsByKey.set("hero", {
      ...defaultSectionByKey.hero,
      isVisible: true,
    });
  }

  return [...sectionsByKey.values()]
    .filter((section) => section.isVisible !== false)
    .sort((firstSection, secondSection) => {
      const orderDifference = sortByOrder(firstSection, secondSection);

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return (
        (defaultSectionByKey[firstSection.key]?.order || 0) -
        (defaultSectionByKey[secondSection.key]?.order || 0)
      );
    });
}

function getVisiblePlatforms(settingsPlatforms, fallbackPlatforms = []) {
  const sourcePlatforms = Array.isArray(settingsPlatforms)
    ? settingsPlatforms
    : fallbackPlatforms;

  const platformsByName = new Map();

  sourcePlatforms.forEach((platform, index) => {
    const name = String(platform?.name || "").trim();

    if (!platform || platform.isVisible === false || !name) {
      return;
    }

    const duplicateKey = name.toLowerCase();

    const numericOrder = Number(platform?.order);

    platformsByName.set(duplicateKey, {
      ...platform,
      name,
      order: Number.isFinite(numericOrder) ? numericOrder : index + 1,
    });
  });

  return [...platformsByName.values()].sort(sortByOrder);
}

function getFooterServices(services) {
  if (!Array.isArray(services)) {
    return [];
  }

  const servicesByKey = new Map();

  services.forEach((service, index) => {
    const title = String(service?.title || "").trim();

    if (!title) {
      return;
    }

    const duplicateKey = String(
      service?._id || service?.id || service?.slug || title.toLowerCase(),
    );

    const numericOrder = Number(service?.order);

    servicesByKey.set(duplicateKey, {
      ...service,
      title,
      order: Number.isFinite(numericOrder) ? numericOrder : index + 1,
    });
  });

  return [...servicesByKey.values()].sort(sortByOrder).slice(0, 6);
}

function getLegalLinks(footer) {
  const sourceLegalLinks = Array.isArray(footer?.legalLinks)
    ? footer.legalLinks
    : defaultFooterContent.legalLinks;

  const legalLinksByKey = new Map();

  sourceLegalLinks.forEach((link, index) => {
    const label = String(link?.label || "").trim();

    const url = getSafePublicUrl(link?.url || link?.href);

    if (!link || link.isVisible === false || !label || !url) {
      return;
    }

    const numericOrder = Number(link?.order);

    const duplicateKey = `${label.toLowerCase()}|${url}`;

    legalLinksByKey.set(duplicateKey, {
      label,
      url,
      order: Number.isFinite(numericOrder) ? numericOrder : index + 1,
    });
  });

  return [...legalLinksByKey.values()].sort(sortByOrder);
}

function handleSamePageNavigation(event, href) {
  let targetUrl;

  try {
    targetUrl = new URL(href, window.location.origin);
  } catch {
    return;
  }

  const isSamePage =
    targetUrl.pathname === window.location.pathname &&
    targetUrl.search === window.location.search;

  if (!isSamePage) {
    return;
  }

  if (!targetUrl.hash) {
    event.preventDefault();

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });

    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }

    return;
  }

  let targetId = "";

  try {
    targetId = decodeURIComponent(targetUrl.hash.slice(1));
  } catch {
    targetId = targetUrl.hash.slice(1);
  }

  const targetElement = document.getElementById(targetId);

  if (!targetElement) {
    return;
  }

  event.preventDefault();

  targetElement.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  if (window.location.hash !== targetUrl.hash) {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}${targetUrl.hash}`,
    );
  }
}

function FooterLink({ href, children, className = "", ariaLabel }) {
  const safeHref = getSafePublicUrl(href);

  if (!safeHref) {
    return null;
  }

  const isExternal =
    safeHref.startsWith("http://") || safeHref.startsWith("https://");

  if (isExternal) {
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className={className}
      >
        {children}

        <span className="sr-only"> opens in a new tab</span>
      </a>
    );
  }

  if (safeHref.startsWith("/")) {
    return (
      <Link
        to={safeHref}
        aria-label={ariaLabel}
        onClick={(event) => {
          handleSamePageNavigation(event, safeHref);
        }}
        className={className}
      >
        {children}
      </Link>
    );
  }

  return (
    <a href={safeHref} aria-label={ariaLabel} className={className}>
      {children}
    </a>
  );
}

function PlatformLink({ platform }) {
  const name = String(platform?.name || "Platform").trim() || "Platform";

  const username = String(platform?.username || "").trim();

  const url = getSafeHttpUrl(platform?.url);

  const commonClasses =
    "max-w-full break-words rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold transition";

  if (!url) {
    return (
      <span
        aria-disabled="true"
        className={`${commonClasses} cursor-not-allowed text-slate-600`}
        title={`${name} profile link will be added soon`}
      >
        {name}
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${name}${
        username ? ` profile for ${username}` : ""
      } in a new tab`}
      title={username ? `${name}: ${username}` : name}
      className={`${commonClasses} text-slate-400 hover:border-brand-500 hover:bg-brand-500/10 hover:text-white`}
    >
      {name}
    </a>
  );
}

function Footer() {
  const { settings } = useSiteSettings();

  const { services: loadedServices } = useServices();

  const currentYear = new Date().getFullYear();

  const brand = settings?.brand || siteData.brand || {};

  const owner = settings?.owner || siteData.owner || {};

  const contact = settings?.contact || siteData.contact || {};

  const footer = settings?.footer || {};

  const brandName =
    String(brand.name || siteData.brand?.name || "").trim() || "RakeshNexify";

  const introduction =
    String(
      footer.introduction ||
        owner.introduction ||
        siteData.owner?.introduction ||
        "",
    ).trim() || defaultFooterContent.introduction;

  const quickLinksHeading =
    String(footer.quickLinksHeading || "").trim() ||
    defaultFooterContent.quickLinksHeading;

  const servicesHeading =
    String(footer.servicesHeading || "").trim() ||
    defaultFooterContent.servicesHeading;

  const platformsHeading =
    String(footer.platformsHeading || "").trim() ||
    defaultFooterContent.platformsHeading;

  const platformNote =
    String(footer.platformNote || "").trim() ||
    defaultFooterContent.platformNote;

  const copyrightText =
    String(footer.copyrightText || "").trim() ||
    defaultFooterContent.copyrightText;

  const location = String(
    contact.location || owner.location || siteData.contact?.location || "",
  ).trim();

  const projectButton = footer.projectButton || {};

  const projectButtonLabel =
    String(projectButton.label || "").trim() ||
    defaultFooterContent.projectButton.label;

  const projectButtonUrl = getSafePublicUrl(
    projectButton.url || projectButton.href,
    defaultFooterContent.projectButton.url,
  );

  const navigationLinks = createNavigationLinks(settings?.sections);

  const visibleSectionKeys = new Set(navigationLinks.map((link) => link.key));

  const isServicesVisible = visibleSectionKeys.has("services");

  const isContactVisible = visibleSectionKeys.has("contact");

  const services = getFooterServices(loadedServices);

  const showServicesColumn = isServicesVisible && services.length > 0;

  const legalLinks = getLegalLinks(footer);

  const platformGroups = [
    {
      key: "social",
      title: "Social",

      platforms: getVisiblePlatforms(
        settings?.socialPlatforms,
        siteData.socialPlatforms || [],
      ),
    },
    {
      key: "developer",
      title: "Developer",

      platforms: getVisiblePlatforms(
        settings?.developerPlatforms,
        siteData.developerPlatforms || [],
      ),
    },
    {
      key: "freelance",
      title: "Freelance",

      platforms: getVisiblePlatforms(
        settings?.freelancerPlatforms,
        siteData.freelancerPlatforms || [],
      ),
    },
  ].filter((group) => group.platforms.length > 0);

  const showPlatformsColumn = platformGroups.length > 0;

  const projectButtonTargetsContact =
    projectButtonUrl === "/#contact" || projectButtonUrl === "#contact";

  const showProjectButton =
    Boolean(projectButtonLabel && projectButtonUrl) &&
    !(projectButtonTargetsContact && !isContactVisible);

  const hasContactLegalLink = legalLinks.some(
    (link) => link.url === "/#contact" || link.url === "#contact",
  );

  const gridClasses =
    showServicesColumn && showPlatformsColumn
      ? "lg:grid-cols-[1.4fr_0.8fr_1fr_1.2fr]"
      : showServicesColumn || showPlatformsColumn
        ? "lg:grid-cols-[1.4fr_0.9fr_1.2fr]"
        : "lg:grid-cols-[1.4fr_1fr]";

  return (
    <footer className="overflow-x-hidden border-t border-slate-800 bg-slate-950 text-slate-300">
      <Container>
        <div className={`grid min-w-0 gap-12 py-16 sm:py-20 ${gridClasses}`}>
          <div className="min-w-0">
            <FooterLink
              href="/"
              ariaLabel={`Go to ${brandName} homepage`}
              className="inline-flex max-w-full"
            >
              <Logo showTagline textClassName="text-white" />
            </FooterLink>

            <p className="mt-6 max-w-md break-words text-sm leading-7 text-slate-400">
              {introduction}
            </p>

            {location && (
              <p className="mt-4 break-words text-sm leading-6 text-slate-500">
                {location}
              </p>
            )}

            {showProjectButton && (
              <FooterLink
                href={projectButtonUrl}
                className="mt-6 inline-flex max-w-full break-words text-sm font-semibold text-brand-500 transition hover:text-brand-400"
              >
                {projectButtonLabel}
                <span aria-hidden="true" className="ml-1">
                  →
                </span>
              </FooterLink>
            )}
          </div>

          <div className="min-w-0">
            <h2 className="break-words text-sm font-bold uppercase tracking-[0.18em] text-white">
              {quickLinksHeading}
            </h2>

            <ul className="mt-5 space-y-3">
              {navigationLinks.map((link) => (
                <li key={link.key} className="min-w-0">
                  <FooterLink
                    href={link.href}
                    className="inline-flex max-w-full break-words text-sm text-slate-400 transition hover:text-white"
                  >
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {showServicesColumn && (
            <div className="min-w-0">
              <h2 className="break-words text-sm font-bold uppercase tracking-[0.18em] text-white">
                {servicesHeading}
              </h2>

              <ul className="mt-5 space-y-3">
                {services.map((service, index) => (
                  <li
                    key={
                      service._id ||
                      service.id ||
                      service.slug ||
                      `${service.title}-${index}`
                    }
                    className="min-w-0"
                  >
                    <FooterLink
                      href="/services"
                      className="inline-flex max-w-full break-words text-sm text-slate-400 transition hover:text-white"
                    >
                      {service.title}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showPlatformsColumn && (
            <div className="min-w-0">
              <h2 className="break-words text-sm font-bold uppercase tracking-[0.18em] text-white">
                {platformsHeading}
              </h2>

              <div className="mt-5 space-y-6">
                {platformGroups.map((group) => (
                  <div key={group.key} className="min-w-0">
                    <p className="mb-3 break-words text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {group.title}
                    </p>

                    <div className="flex min-w-0 flex-wrap gap-2">
                      {group.platforms.map((platform, index) => (
                        <PlatformLink
                          key={`${group.key}-${platform.name}-${index}`}
                          platform={platform}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {platformNote && (
                <p className="mt-6 break-words text-sm leading-6 text-slate-500">
                  {platformNote}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="pb-12 sm:pb-16">
          <NewsletterSignupForm />
        </div>

        <div className="flex min-w-0 flex-col gap-4 border-t border-slate-800 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 break-words">
            © {currentYear} {brandName}. {copyrightText}
          </p>

          <div className="flex min-w-0 flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link, index) => (
              <FooterLink
                key={`${link.label}-${link.url}-${index}`}
                href={link.url}
                className="max-w-full break-words transition hover:text-white"
              >
                {link.label}
              </FooterLink>
            ))}

            {isContactVisible && !hasContactLegalLink && (
              <FooterLink
                href="/#contact"
                className="max-w-full break-words transition hover:text-white"
              >
                Contact
              </FooterLink>
            )}
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
