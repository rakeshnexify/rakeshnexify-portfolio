import useServices from "../../hooks/useServices";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import ServiceCard from "../services/ServiceCard";

import PublicCTAButton from "../layout/PublicCTAButton";
const HOME_SERVICE_LIMIT = 4;

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

function ServicesSection() {
  const { services, isLoading, error } = useServices();

  const { settings } = useSiteSettings();

  const sectionContent = settings?.servicesSection || {};

  const eyebrow =
    String(sectionContent.eyebrow || "").trim();

  const heading =
    String(sectionContent.heading || "").trim();

  const description =
    String(sectionContent.description || "").trim();

  const ctaButton = sectionContent.ctaButton || sectionContent.action || {};

  const ctaLabel =
    String(ctaButton.label || "").trim();

  const ctaUrl = getSafePublicUrl(
    ctaButton.url || ctaButton.href, "");

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
              <PublicCTAButton
                url={ctaUrl}
                label={ctaLabel}
              />
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

export default ServicesSection;
