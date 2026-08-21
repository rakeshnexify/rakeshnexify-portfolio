import { Link } from "react-router";

import useServices from "../../hooks/useServices";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import ServiceCard from "../services/ServiceCard";

const HOME_SERVICE_LIMIT = 4;

const defaultSectionContent = {
  eyebrow: "My Services",

  heading: "Professional digital services for businesses and creators",

  description:
    "From complete MERN applications to WordPress websites and e-commerce stores, I provide modern development solutions focused on design, usability and long-term growth.",

  ctaButton: {
    label: "View All Services",
    url: "/services",
  },
};

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

function getSafePublicUrl(value, fallbackUrl = "/services") {
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

function sortServicesForPreview(firstService, secondService) {
  const featuredDifference =
    Number(Boolean(secondService?.isFeatured)) -
    Number(Boolean(firstService?.isFeatured));

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  return Number(firstService?.order || 0) - Number(secondService?.order || 0);
}

function DynamicActionLink({ url, children, className = "" }) {
  const safeUrl = getSafePublicUrl(url);

  if (safeUrl.startsWith("http://") || safeUrl.startsWith("https://")) {
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  if (safeUrl.startsWith("/")) {
    return (
      <Link to={safeUrl} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={safeUrl} className={className}>
      {children}
    </a>
  );
}

function ServicesSection() {
  const { services, isLoading, error } = useServices();

  const { settings } = useSiteSettings();

  const sectionContent = settings?.servicesSection || {};

  const eyebrow =
    String(sectionContent.eyebrow || "").trim() ||
    defaultSectionContent.eyebrow;

  const heading =
    String(sectionContent.heading || sectionContent.title || "").trim() ||
    defaultSectionContent.heading;

  const description =
    String(sectionContent.description || "").trim() ||
    defaultSectionContent.description;

  const ctaButton = sectionContent.ctaButton || sectionContent.action || {};

  const ctaLabel =
    String(ctaButton.label || "").trim() ||
    defaultSectionContent.ctaButton.label;

  const ctaUrl = getSafePublicUrl(
    ctaButton.url || ctaButton.href,
    defaultSectionContent.ctaButton.url,
  );

  const previewServices = [...services]
    .sort(sortServicesForPreview)
    .slice(0, HOME_SERVICE_LIMIT);

  return (
    <Section
      id="services"
      className="public-services-section scroll-mt-20"
    >
      <div className="public-services-flowfield" aria-hidden="true">
        <span className="public-services-flow-route public-services-flow-route-one" />
        <span className="public-services-flow-route public-services-flow-route-two" />
        <span className="public-services-flow-route public-services-flow-route-three" />
        <span className="public-services-flow-glow public-services-flow-glow-one" />
        <span className="public-services-flow-glow public-services-flow-glow-two" />
      </div>

      <Container>
        <div className="public-services-content">
          <SectionHeading
            eyebrow={eyebrow}
            title={heading}
            description={description}
            className="public-services-heading"
          />

          {error && (
            <p className="public-services-status public-services-status-warning">
              Live services could not be loaded. Showing saved website data.
            </p>
          )}

          {isLoading && (
            <p className="public-services-status">
              Loading services...
            </p>
          )}

          {!isLoading && services.length === 0 && (
            <div className="public-services-empty">
              <p>Services will be added soon.</p>
            </div>
          )}

          {previewServices.length > 0 && (
            <div
              className="public-services-carousel"
              role="region"
              aria-label="Featured services"
            >
              <div className="public-services-track">
                {previewServices.map((service, index) => (
                  <ServiceCard
                    key={
                      service._id ||
                      service.id ||
                      service.slug ||
                      `${service.title}-${index}`
                    }
                    service={service}
                    index={index}
                    homePreview
                    actionLabel="Order Service"
                    actionHref={service?.orderUrl}
                  />
                ))}
              </div>
            </div>
          )}

          {previewServices.length > 0 && (
            <div className="public-services-footer">
              <DynamicActionLink
                url={ctaUrl}
                className="public-services-view-all"
              >
                <span>{ctaLabel}</span>

                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="size-4"
                >
                  <path
                    d="M4 10h12M11 5l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </DynamicActionLink>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

export default ServicesSection;
