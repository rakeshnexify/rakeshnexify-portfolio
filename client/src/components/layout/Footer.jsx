import { Link } from "react-router";

import siteData from "../../data/siteData";
import useServices from "../../hooks/useServices";
import useSiteSettings from "../../hooks/useSiteSettings";
import Logo from "../ui/Logo";
import Container from "./Container";

const supportedFooterSections = new Set([
  "hero",
  "about",
  "services",
  "projects",
  "companies",
  "contact",
]);

const defaultFooterContent = {
  introduction:
    "Developer, creator and entrepreneur building modern digital products.",

  quickLinksHeading: "Quick Links",

  servicesHeading: "Services",

  platformsHeading: "Platforms",

  platformNote: "Profiles without official URLs remain disabled.",

  projectButton: {
    label: "Start a project with me",
    url: "#contact",
  },

  legalLinks: [
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
  ],

  copyrightText: "All rights reserved.",
};

function sortByOrder(firstItem, secondItem) {
  return Number(firstItem?.order || 0) - Number(secondItem?.order || 0);
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

function getSectionHref(sectionKey) {
  return sectionKey === "hero" ? "#home" : `#${sectionKey}`;
}

function getSectionLabel(section) {
  if (section.key === "hero" && section.label === "Hero") {
    return "Home";
  }

  return section.label;
}

function getFallbackSections() {
  return (siteData.navigation || []).map((link, index) => ({
    key: link.href === "#home" ? "hero" : link.href.replace("#", ""),

    label: link.label,

    isVisible: true,

    order: index + 1,
  }));
}

function getVisiblePlatforms(settingsPlatforms, fallbackPlatforms = []) {
  const sourcePlatforms = Array.isArray(settingsPlatforms)
    ? settingsPlatforms
    : fallbackPlatforms;

  return sourcePlatforms
    .filter(
      (platform) =>
        platform &&
        platform.isVisible !== false &&
        String(platform.name || "").trim(),
    )
    .sort(sortByOrder);
}

function getFooterServices(services) {
  if (!Array.isArray(services)) {
    return [];
  }

  return services
    .filter((service) => String(service?.title || "").trim())
    .sort(sortByOrder)
    .slice(0, 6);
}

function getLegalLinks(footer) {
  const sourceLegalLinks = Array.isArray(footer?.legalLinks)
    ? footer.legalLinks
    : defaultFooterContent.legalLinks;

  return sourceLegalLinks
    .filter(
      (link) =>
        link && link.isVisible !== false && String(link.label || "").trim(),
    )
    .map((link, index) => ({
      label: String(link.label || "").trim(),

      url: getSafePublicUrl(link.url),

      order: Number.isFinite(Number(link.order))
        ? Number(link.order)
        : index + 1,
    }))
    .filter((link) => link.url)
    .sort(sortByOrder);
}

function FooterLink({ href, children, className = "", ariaLabel }) {
  const safeHref = getSafePublicUrl(href);

  if (!safeHref) {
    return null;
  }

  if (safeHref.startsWith("http://") || safeHref.startsWith("https://")) {
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className={className}
      >
        {children}
      </a>
    );
  }

  if (safeHref.startsWith("/")) {
    return (
      <Link to={safeHref} aria-label={ariaLabel} className={className}>
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
  const name = String(platform?.name || "Platform").trim();

  const username = String(platform?.username || "").trim();

  const url = getSafeHttpUrl(platform?.url);

  const commonClasses =
    "rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold transition";

  if (!url) {
    return (
      <span
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
      aria-label={`Open ${name}${username ? ` profile for ${username}` : ""}`}
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

  const legalLinks = getLegalLinks(footer);

  const settingsSections = Array.isArray(settings?.sections)
    ? settings.sections
    : [];

  const availableSections =
    settingsSections.length > 0 ? settingsSections : getFallbackSections();

  const visibleSections = [...availableSections]
    .filter(
      (section) =>
        section.isVisible !== false && supportedFooterSections.has(section.key),
    )
    .sort(sortByOrder);

  const navigationLinks = visibleSections.map((section) => ({
    key: section.key,

    label: getSectionLabel(section),

    href: getSectionHref(section.key),
  }));

  const isServicesSectionVisible = visibleSections.some(
    (section) => section.key === "services",
  );

  const isContactVisible = visibleSections.some(
    (section) => section.key === "contact",
  );

  const services = getFooterServices(loadedServices);

  const showServicesColumn = isServicesSectionVisible && services.length > 0;

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

  const showProjectButton =
    Boolean(projectButtonLabel && projectButtonUrl) &&
    !(projectButtonUrl === "#contact" && !isContactVisible);

  const hasContactLegalLink = legalLinks.some(
    (link) => link.url === "#contact",
  );

  const gridClasses =
    showServicesColumn && showPlatformsColumn
      ? "lg:grid-cols-[1.4fr_0.8fr_1fr_1.2fr]"
      : showServicesColumn || showPlatformsColumn
        ? "lg:grid-cols-[1.4fr_0.9fr_1.2fr]"
        : "lg:grid-cols-[1.4fr_1fr]";

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <Container>
        <div className={`grid gap-12 py-16 sm:py-20 ${gridClasses}`}>
          <div>
            <a
              href="#home"
              aria-label={`Go to ${brandName} homepage`}
              className="inline-flex"
            >
              <Logo showTagline textClassName="text-white" />
            </a>

            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
              {introduction}
            </p>

            {location && (
              <p className="mt-4 text-sm text-slate-500">{location}</p>
            )}

            {showProjectButton && (
              <FooterLink
                href={projectButtonUrl}
                className="mt-6 inline-flex text-sm font-semibold text-brand-500 transition hover:text-brand-400"
              >
                {projectButtonLabel} →
              </FooterLink>
            )}
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              {quickLinksHeading}
            </h2>

            <ul className="mt-5 space-y-3">
              {navigationLinks.map((link) => (
                <li key={link.key}>
                  <FooterLink
                    href={link.href}
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {showServicesColumn && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
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
                  >
                    <FooterLink
                      href="#services"
                      className="text-sm text-slate-400 transition hover:text-white"
                    >
                      {service.title}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showPlatformsColumn && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
                {platformsHeading}
              </h2>

              <div className="mt-5 space-y-6">
                {platformGroups.map((group) => (
                  <div key={group.key}>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {group.title}
                    </p>

                    <div className="flex flex-wrap gap-2">
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
                <p className="mt-6 text-sm leading-6 text-slate-500">
                  {platformNote}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-800 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {brandName}. {copyrightText}
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link, index) => (
              <FooterLink
                key={`${link.label}-${link.url}-${index}`}
                href={link.url}
                className="transition hover:text-white"
              >
                {link.label}
              </FooterLink>
            ))}

            {isContactVisible && !hasContactLegalLink && (
              <FooterLink
                href="#contact"
                className="transition hover:text-white"
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
