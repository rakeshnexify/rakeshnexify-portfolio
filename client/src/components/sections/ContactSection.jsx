import { useState } from "react";

import siteData from "../../data/siteData";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import ContactForm from "./contact/ContactForm";
import styles from "./ContactSection.module.css";

const defaultSectionContent = {
  eyebrow: "Contact Me",
  formHeading: "Send a Message",
  formDescription: "Share the project details and I will get back to you.",
  socialHeading: "Connect With Me",
  socialDescription: "Find me on social media.",
  freelancerHeading: "Freelancer Profiles",
  freelancerDescription: "Hire me on trusted platforms.",
  submitLabel: "Send Message",
  privacyNote: "Your information is safe and secure. I respect your privacy.",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function getSafeExternalUrl(value) {
  const url = String(value || "").trim();

  if (!url || containsControlCharacters(url)) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !parsedUrl.hostname ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      return "";
    }

    return parsedUrl.href;
  } catch {
    return "";
  }
}

function getSafeEmailHref(value) {
  const email = String(value || "")
    .trim()
    .toLowerCase();

  if (!email || containsControlCharacters(email) || !emailPattern.test(email)) {
    return "";
  }

  return `mailto:${email}`;
}

function getSafePhoneHref(value) {
  const phone = String(value || "").trim();

  if (!phone || containsControlCharacters(phone)) {
    return "";
  }

  const cleanedPhone = phone.replace(/[^\d+]/g, "");

  return cleanedPhone ? `tel:${cleanedPhone}` : "";
}

function getSafeWhatsAppHref(value) {
  const whatsappNumber = String(value || "").replace(/\D/g, "");

  return whatsappNumber ? `https://wa.me/${whatsappNumber}` : "";
}

function sortByOrder(firstPlatform, secondPlatform) {
  return Number(firstPlatform?.order || 0) - Number(secondPlatform?.order || 0);
}

function getVisiblePlatforms(settingsPlatforms, fallbackPlatforms = []) {
  const sourcePlatforms = Array.isArray(settingsPlatforms)
    ? settingsPlatforms
    : fallbackPlatforms;

  return sourcePlatforms
    .filter((platform) => {
      return (
        platform &&
        platform.isVisible !== false &&
        String(platform.name || "").trim()
      );
    })
    .sort(sortByOrder);
}

function getOptionalContent(value, fallbackValue = "") {
  if (value === undefined || value === null) {
    return fallbackValue;
  }

  return String(value).trim();
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M6.5 4h3l1.5 4-2 1.5a15 15 0 0 0 5.5 5.5l1.5-2 4 1.5v3c0 1.1-.9 2-2 2C10 19.5 4.5 14 4.5 6c0-1.1.9-2 2-2Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.5Z" />
      <path d="M9 8.5c.5 2.5 2 4 4.5 4.8" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M20 10c0 5-8 10-8 10S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ContactMethod({ kind, label, value, href, icon }) {
  if (!value) {
    return null;
  }

  const content = (
    <>
      <span className={styles.methodIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.methodValue}>{value}</span>
    </>
  );

  if (!href) {
    return (
      <div className={styles.method} data-kind={kind} aria-label={`${label}: ${value}`}>
        {content}
      </div>
    );
  }

  const isExternal = href.startsWith("http://") || href.startsWith("https://");

  return (
    <a
      href={href}
      className={styles.method}
      data-kind={kind}
      aria-label={`${label}: ${value}`}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
    >
      {content}
    </a>
  );
}

function createInitial(value) {
  return String(value || "P").trim().charAt(0).toUpperCase() || "P";
}

function PlatformIcon({ platform }) {
  const iconUrl = getSafeExternalUrl(platform?.iconUrl);
  const [hasImageError, setHasImageError] = useState(false);

  if (iconUrl && !hasImageError) {
    return (
      <img
        src={iconUrl}
        alt=""
        loading="lazy"
        onError={() => setHasImageError(true)}
      />
    );
  }

  return <span>{createInitial(platform?.name)}</span>;
}

function PlatformLink({ platform }) {
  const name = String(platform?.name || "Platform").trim() || "Platform";
  const safeUrl = getSafeExternalUrl(platform?.url);

  const content = (
    <>
      <span className={styles.platformIcon} aria-hidden="true">
        <PlatformIcon platform={platform} />
      </span>
      <span className={styles.platformName}>{name}</span>
    </>
  );

  if (!safeUrl) {
    return (
      <span className={styles.platformLink} data-disabled="true" aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.platformLink}
      aria-label={`Open ${name} profile in a new tab`}
    >
      {content}
    </a>
  );
}

function PlatformPanel({ title, description, platforms, kind }) {
  if (!Array.isArray(platforms) || platforms.length === 0) {
    return null;
  }

  return (
    <section className={styles.platformPanel} data-kind={kind}>
      {(title || description) && (
        <header className={styles.platformHeader}>
          {title && <h3>{title}</h3>}
          {description && <p>{description}</p>}
        </header>
      )}

      <div className={styles.platformGrid}>
        {platforms.map((platform, index) => {
          const key =
            platform?._id ||
            platform?.id ||
            platform?.key ||
            `${kind}-${platform?.name || "platform"}-${index}`;

          return <PlatformLink key={key} platform={platform} />;
        })}
      </div>
    </section>
  );
}

function ContactSection() {
  const { settings } = useSiteSettings();
  const contact = settings?.contact || siteData.contact || {};
  const sectionContent = settings?.contactSection || {};

  const eyebrow =
    String(sectionContent.eyebrow || "").trim() || defaultSectionContent.eyebrow;
  const heading = String(sectionContent.heading || "").trim();
  const description = String(sectionContent.description || "").trim();

  const formHeading = getOptionalContent(
    sectionContent.formHeading,
    defaultSectionContent.formHeading,
  );
  const formDescription = getOptionalContent(
    sectionContent.formDescription,
    defaultSectionContent.formDescription,
  );
  const socialHeading = getOptionalContent(
    sectionContent.socialHeading,
    defaultSectionContent.socialHeading,
  );
  const socialDescription = getOptionalContent(
    sectionContent.socialDescription,
    defaultSectionContent.socialDescription,
  );
  const freelancerHeading = getOptionalContent(
    sectionContent.freelancerHeading,
    defaultSectionContent.freelancerHeading,
  );
  const freelancerDescription = getOptionalContent(
    sectionContent.freelancerDescription,
    defaultSectionContent.freelancerDescription,
  );
  const submitLabel =
    getOptionalContent(sectionContent.submitLabel, defaultSectionContent.submitLabel) ||
    defaultSectionContent.submitLabel;
  const privacyNote = getOptionalContent(
    sectionContent.privacyNote,
    defaultSectionContent.privacyNote,
  );

  const socialPlatforms = getVisiblePlatforms(
    settings?.socialPlatforms,
    siteData.socialPlatforms || [],
  );
  const freelancerPlatforms = getVisiblePlatforms(
    settings?.freelancerPlatforms,
    siteData.freelancerPlatforms || [],
  );

  const email = String(contact.email || "").trim();
  const phone = String(contact.phone || "").trim();
  const whatsapp = String(contact.whatsapp || "").trim();
  const location = String(contact.location || "").trim();

  const methods = [
    {
      key: "email",
      kind: "email",
      label: "Email",
      value: email,
      href: getSafeEmailHref(email),
      icon: <MailIcon />,
    },
    {
      key: "phone",
      kind: "phone",
      label: "Phone",
      value: phone,
      href: getSafePhoneHref(phone),
      icon: <PhoneIcon />,
    },
    {
      key: "whatsapp",
      kind: "whatsapp",
      label: "WhatsApp",
      value: whatsapp,
      href: getSafeWhatsAppHref(whatsapp),
      icon: <WhatsAppIcon />,
    },
    {
      key: "location",
      kind: "location",
      label: "Location",
      value: location,
      href: "",
      icon: <LocationIcon />,
    },
  ].filter((method) => method.value);

  const hasSidePanels = socialPlatforms.length > 0 || freelancerPlatforms.length > 0;

  return (
    <Section id="contact" className={styles.section}>
      <Container>
        <div className={styles.inner}>
          <SectionHeading
            eyebrow={eyebrow}
            title={heading}
            description={description}
          />

          {methods.length > 0 && (
            <div className={styles.methods}>
              {methods.map(({ key, ...method }) => (
                <ContactMethod key={key} {...method} />
              ))}
            </div>
          )}

          <div
            className={styles.workspace}
            data-single-column={hasSidePanels ? "false" : "true"}
          >
            <section className={styles.formPanel}>
              {(formHeading || formDescription) && (
                <header className={styles.formHeader}>
                  {formHeading && <h3>{formHeading}</h3>}
                  {formDescription && <p>{formDescription}</p>}
                </header>
              )}

              <ContactForm submitLabel={submitLabel} />
            </section>

            {hasSidePanels && (
              <div className={styles.sideColumn}>
                <PlatformPanel
                  kind="social"
                  title={socialHeading}
                  description={socialDescription}
                  platforms={socialPlatforms}
                />

                <PlatformPanel
                  kind="freelancer"
                  title={freelancerHeading}
                  description={freelancerDescription}
                  platforms={freelancerPlatforms}
                />
              </div>
            )}
          </div>

          {privacyNote && <p className={styles.privacyNote}>{privacyNote}</p>}
        </div>
      </Container>
    </Section>
  );
}

export default ContactSection;
