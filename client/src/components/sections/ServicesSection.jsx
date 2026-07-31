import { Link } from "react-router";

import useServices from "../../hooks/useServices";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import ResponsiveCardRow from "../layout/ResponsiveCardRow";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import ServiceCard from "../services/ServiceCard";

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
    .slice(0, 3);

  return (
    <Section
      id="services"
      className="scroll-mt-20 border-t border-slate-200 bg-slate-50"
    >
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={heading}
          description={description}
        />

        {error && (
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-amber-700">
            Live services could not be loaded. Showing saved website data.
          </p>
        )}

        {isLoading && (
          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            Loading services...
          </p>
        )}

        {!isLoading && services.length === 0 && (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <p className="font-semibold text-slate-700">
              Services will be added soon.
            </p>
          </div>
        )}

        {previewServices.length > 0 && (
          <ResponsiveCardRow
            desktopColumns={3}
            ariaLabel="Featured services"
            className="mt-10"
          >
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
                compact
              />
            ))}
          </ResponsiveCardRow>
        )}

        {previewServices.length > 0 && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-slate-950">
                Explore complete development services
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                The homepage shows selected services only. Open the complete
                Services page to view all available options.
              </p>
            </div>

            <DynamicActionLink
              url={ctaUrl}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {ctaLabel} →
            </DynamicActionLink>
          </div>
        )}
      </Container>
    </Section>
  );
}

export default ServicesSection;
