import { Link } from "react-router";

import siteData from "../../data/siteData";
import usePublicTheme from "../../hooks/usePublicTheme";
import useServices from "../../hooks/useServices";
import useSiteSettings from "../../hooks/useSiteSettings";
import {
  getFooterNavigationItems,
  isPublicNavigationDestinationAvailable,
} from "../../utils/publicNavigation";
import NewsletterSignupForm from "../newsletter/NewsletterSignupForm";
import Logo from "../ui/Logo";
import Container from "./Container";

const defaultFooterContent = {
  introduction:
    "Developer, creator and entrepreneur building modern digital products.",
  quickLinksHeading: "Quick Links",
  servicesHeading: "Services",
  projectButton: {
    label: "Start a project with me",
    url: "/#contact",
  },
  legalLinks: [],
  copyrightText: "All rights reserved.",
};

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

  let targetId;

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

function FooterListLink({ href, children, isDark }) {
  const linkClasses = isDark
    ? "text-slate-400 hover:bg-white/[0.035] hover:text-white"
    : "text-slate-600 hover:bg-brand-50/80 hover:text-brand-700";

  return (
    <li className="min-w-0">
      <FooterLink
        href={href}
        className={`group -ml-2 inline-flex max-w-full items-center gap-2 rounded-md px-2 py-1 text-[11px] font-medium leading-4 transition duration-200 hover:translate-x-1 ${linkClasses}`}
      >
        <span
          aria-hidden="true"
          className="size-1 shrink-0 rounded-full bg-brand-500/70 shadow-[0_0_0_rgba(59,130,246,0)] transition-all duration-200 group-hover:scale-125 group-hover:bg-brand-400 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.55)]"
        />
        <span className="min-w-0 break-words">{children}</span>
      </FooterLink>
    </li>
  );
}

function Footer() {
  const { settings } = useSiteSettings();
  const { isDark } = usePublicTheme();
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

  const navigationLinks = getFooterNavigationItems(settings?.sections);

  const isServicesAvailable = isPublicNavigationDestinationAvailable(
    settings?.sections,
    "services",
  );

  const isContactAvailable = isPublicNavigationDestinationAvailable(
    settings?.sections,
    "contact",
  );

  const services = getFooterServices(loadedServices);
  const showServicesColumn = isServicesAvailable && services.length > 0;

  const legalLinks = getLegalLinks(footer).filter((link) => {
    const targetsContact = link.url === "/#contact" || link.url === "#contact";

    return !targetsContact || isContactAvailable;
  });

  const projectButtonTargetsContact =
    projectButtonUrl === "/#contact" || projectButtonUrl === "#contact";

  const showProjectButton =
    Boolean(projectButtonLabel && projectButtonUrl) &&
    !(projectButtonTargetsContact && !isContactAvailable);

  const hasContactLegalLink = legalLinks.some(
    (link) => link.url === "/#contact" || link.url === "#contact",
  );

  const footerClasses = isDark
    ? "public-theme-footer overflow-x-hidden border-t border-slate-800/80 bg-[radial-gradient(circle_at_16%_0%,rgba(37,99,235,0.08),transparent_28%),linear-gradient(180deg,#06101d_0%,#02050a_100%)] text-slate-300"
    : "public-theme-footer overflow-x-hidden border-t border-slate-300/80 bg-[radial-gradient(circle_at_14%_0%,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_88%_18%,rgba(99,102,241,0.08),transparent_26%),linear-gradient(180deg,#e1e9f3_0%,#d7e1ed_50%,#ced9e7_100%)] text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]";

  const newsletterShellClasses = isDark
    ? "border-slate-800/75 bg-slate-950/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] hover:border-brand-500/30 hover:bg-slate-950/38"
    : "border-slate-400/70 bg-[linear-gradient(180deg,rgba(241,245,249,0.88),rgba(226,232,240,0.84))] shadow-[0_12px_28px_rgba(71,85,105,0.10),inset_0_1px_0_rgba(255,255,255,0.62)] hover:border-sky-400/75 hover:bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(232,239,247,0.90))]";

  const mutedClasses = isDark ? "text-slate-400" : "text-slate-700";
  const softMutedClasses = isDark ? "text-slate-500" : "text-slate-700";
  const headingClasses = isDark ? "text-slate-100" : "text-slate-950";
  const dividerClasses = isDark ? "border-slate-800/80" : "border-slate-400/60";
  const legalLinkClasses = isDark
    ? "text-slate-500 hover:text-white"
    : "text-slate-700 hover:text-brand-700";

  return (
    <footer className={footerClasses}>
      <Container>
        <div className="relative py-6 sm:py-7">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-px w-36 bg-gradient-to-r from-transparent via-cyan-400/65 to-transparent"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 h-px w-40 bg-gradient-to-r from-transparent via-violet-400/55 to-transparent"
          />

          <div className="grid min-w-0 gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <FooterLink
                  href="/"
                  ariaLabel={`Go to ${brandName} homepage`}
                  className="inline-flex max-w-full shrink-0 transition duration-200 hover:-translate-y-0.5"
                >
                  <Logo
                    textClassName={isDark ? "text-white" : "text-slate-950"}
                    iconClassName="!h-9 !w-9 !rounded-xl"
                  />
                </FooterLink>

                <div className="hidden h-7 w-px shrink-0 bg-slate-500/20 sm:block" />

                {location && (
                  <span
                    className={`hidden max-w-[18rem] items-center gap-1.5 break-words text-[10px] sm:inline-flex ${softMutedClasses}`}
                  >
                    <span
                      aria-hidden="true"
                      className="size-1 shrink-0 rounded-full bg-brand-500"
                    />
                    {location}
                  </span>
                )}
              </div>

              <p
                className={`mt-2.5 max-w-2xl break-words text-[11px] leading-5 ${mutedClasses}`}
              >
                {introduction}
              </p>

              <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                {showProjectButton && (
                  <FooterLink
                    href={projectButtonUrl}
                    className="group inline-flex max-w-full items-center gap-1 break-words text-[11px] font-bold text-brand-500 transition duration-200 hover:translate-x-1 hover:text-brand-400"
                  >
                    {projectButtonLabel}
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    >
                      &rarr;
                    </span>
                  </FooterLink>
                )}

                {location && (
                  <span
                    className={`inline-flex max-w-full items-center gap-1.5 break-words text-[10px] sm:hidden ${softMutedClasses}`}
                  >
                    <span
                      aria-hidden="true"
                      className="size-1 shrink-0 rounded-full bg-brand-500"
                    />
                    {location}
                  </span>
                )}
              </div>
            </div>

            <div
              className={`min-w-0 rounded-xl border p-2.5 transition duration-200 ${newsletterShellClasses}`}
            >
              <NewsletterSignupForm
                variant={isDark ? "dark" : "light"}
                consentMode="implicit"
                compact
              />
            </div>
          </div>

          <div
            className={`mt-4 grid min-w-0 gap-x-8 gap-y-5 border-t pt-4 lg:grid-cols-[1.1fr_0.9fr] ${dividerClasses}`}
          >
            <section className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  className={`text-[9px] font-black uppercase tracking-[0.18em] ${headingClasses}`}
                >
                  {quickLinksHeading}
                </h2>
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-gradient-to-r from-brand-500/35 to-transparent"
                />
              </div>

              <ul className="mt-2 grid min-w-0 grid-cols-2 gap-x-5 gap-y-0.5 sm:grid-cols-3">
                {navigationLinks.map((link) => (
                  <FooterListLink
                    key={link.key}
                    href={link.href}
                    isDark={isDark}
                  >
                    {link.label}
                  </FooterListLink>
                ))}
              </ul>
            </section>

            {showServicesColumn && (
              <section className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2
                    className={`text-[9px] font-black uppercase tracking-[0.18em] ${headingClasses}`}
                  >
                    {servicesHeading}
                  </h2>
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 bg-gradient-to-r from-brand-500/35 to-transparent"
                  />
                </div>

                <ul className="mt-2 grid min-w-0 grid-cols-1 gap-y-0.5 sm:grid-cols-2 sm:gap-x-5">
                  {services.map((service, index) => (
                    <FooterListLink
                      key={
                        service._id ||
                        service.id ||
                        service.slug ||
                        `${service.title}-${index}`
                      }
                      href="/services"
                      isDark={isDark}
                    >
                      {service.title}
                    </FooterListLink>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div
            className={`mt-3 flex min-w-0 flex-col gap-1.5 border-t pt-2.5 text-[10px] sm:flex-row sm:items-center sm:justify-between ${dividerClasses} ${softMutedClasses}`}
          >
            <p className="min-w-0 break-words">
              &copy; {currentYear} {brandName}. {copyrightText}
            </p>

            <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1">
              {legalLinks.map((link, index) => (
                <FooterLink
                  key={`${link.label}-${link.url}-${index}`}
                  href={link.url}
                  className={`max-w-full break-words transition duration-200 hover:-translate-y-0.5 ${legalLinkClasses}`}
                >
                  {link.label}
                </FooterLink>
              ))}

              {isContactAvailable && !hasContactLegalLink && (
                <FooterLink
                  href="/#contact"
                  className={`max-w-full break-words transition duration-200 hover:-translate-y-0.5 ${legalLinkClasses}`}
                >
                  Contact
                </FooterLink>
              )}
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
