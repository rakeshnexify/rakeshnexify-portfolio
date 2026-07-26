import siteData from "../../data/siteData";
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

function PlatformLink({ platform }) {
  const commonClasses =
    "rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold transition";

  if (!platform?.url) {
    return (
      <span
        className={`${commonClasses} cursor-not-allowed text-slate-600`}
        title="Official link will be added soon"
      >
        {platform?.name || "Platform"}
      </span>
    );
  }

  return (
    <a
      href={platform.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${commonClasses} text-slate-400 hover:border-brand-500 hover:bg-brand-500/10 hover:text-white`}
    >
      {platform.name}
    </a>
  );
}

function Footer() {
  const { settings } = useSiteSettings();

  const currentYear = new Date().getFullYear();

  const brand = settings?.brand || siteData.brand || {};
  const owner = settings?.owner || siteData.owner || {};
  const contact = settings?.contact || siteData.contact || {};

  const brandName = brand.name || siteData.brand?.name || "RakeshNexify";

  const introduction =
    owner.introduction ||
    siteData.owner?.introduction ||
    "Developer, creator and entrepreneur building modern digital products.";

  const location =
    contact.location || owner.location || siteData.contact?.location || "";

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
    .sort(
      (firstSection, secondSection) => firstSection.order - secondSection.order,
    );

  const navigationLinks = visibleSections.map((section) => ({
    key: section.key,
    label: getSectionLabel(section),
    href: getSectionHref(section.key),
  }));

  const isServicesVisible = visibleSections.some(
    (section) => section.key === "services",
  );

  const isContactVisible = visibleSections.some(
    (section) => section.key === "contact",
  );

  const services = Array.isArray(siteData.services) ? siteData.services : [];

  const platformGroups = [
    {
      title: "Social",
      platforms: siteData.socialPlatforms || [],
    },
    {
      title: "Developer",
      platforms: siteData.developerPlatforms || [],
    },
    {
      title: "Freelance",
      platforms: siteData.freelancerPlatforms || [],
    },
  ];

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <Container>
        <div
          className={`grid gap-12 py-16 sm:py-20 ${
            isServicesVisible
              ? "lg:grid-cols-[1.4fr_0.8fr_1fr_1.2fr]"
              : "lg:grid-cols-[1.4fr_0.9fr_1.2fr]"
          }`}
        >
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

            {isContactVisible && (
              <a
                href="#contact"
                className="mt-6 inline-flex text-sm font-semibold text-brand-500 transition hover:text-brand-400"
              >
                Start a project with me →
              </a>
            )}
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Quick Links
            </h2>

            <ul className="mt-5 space-y-3">
              {navigationLinks.map((link) => (
                <li key={link.key}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {isServicesVisible && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
                Services
              </h2>

              <ul className="mt-5 space-y-3">
                {services.map((service) => (
                  <li key={service.id}>
                    <a
                      href="#services"
                      className="text-sm text-slate-400 transition hover:text-white"
                    >
                      {service.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Platforms
            </h2>

            <div className="mt-5 space-y-6">
              {platformGroups.map((group) => (
                <div key={group.title}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {group.title}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {group.platforms.map((platform) => (
                      <PlatformLink key={platform.name} platform={platform} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm leading-6 text-slate-500">
              Empty profile links are disabled until their official URLs are
              added.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-800 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {brandName}. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="#privacy" className="transition hover:text-white">
              Privacy Policy
            </a>

            <a href="#terms" className="transition hover:text-white">
              Terms
            </a>

            {isContactVisible && (
              <a href="#contact" className="transition hover:text-white">
                Contact
              </a>
            )}
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
