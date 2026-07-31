import siteData from "../../data/siteData";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import ContactForm from "./contact/ContactForm";

const defaultSectionContent = {
  eyebrow: "Contact Me",

  heading: "Let us discuss your next digital project",

  description:
    "Share your requirements for a business website, MERN application, WordPress website, e-commerce store or long-term development support.",

  enquiryEyebrow: "Project Enquiries",

  enquiryHeading: "Ready to build something useful?",

  enquiryDescription:
    "Explain your idea, required features, preferred technology and expected timeline. I will review the project details and reply through an available contact method.",
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

  if (!cleanedPhone) {
    return "";
  }

  return `tel:${cleanedPhone}`;
}

function getSafeWhatsAppHref(value) {
  const whatsappNumber = String(value || "").replace(/\D/g, "");

  if (!whatsappNumber) {
    return "";
  }

  return `https://wa.me/${whatsappNumber}`;
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

function ContactDetail({ label, value, href, icon }) {
  if (!value) {
    return null;
  }

  const content = (
    <>
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-words text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
    </>
  );

  if (!href) {
    return (
      <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {content}
      </div>
    );
  }

  const isExternalLink =
    href.startsWith("http://") || href.startsWith("https://");

  return (
    <a
      href={href}
      target={isExternalLink ? "_blank" : undefined}
      rel={isExternalLink ? "noopener noreferrer" : undefined}
      className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-brand-200 hover:bg-brand-50/50"
    >
      {content}
    </a>
  );
}

function PlatformLink({ platform }) {
  const name = String(platform?.name || "Platform").trim() || "Platform";

  const username = String(platform?.username || "").trim();

  const safeUrl = getSafeExternalUrl(platform?.url);

  const content = (
    <>
      <span className="max-w-full break-words font-semibold">{name}</span>

      {username && (
        <span className="mt-0.5 max-w-full truncate text-xs font-medium opacity-70">
          {username}
        </span>
      )}
    </>
  );

  if (!safeUrl) {
    return (
      <span
        title={`${name} profile link will be added soon`}
        aria-disabled="true"
        className="inline-flex min-w-0 max-w-full cursor-not-allowed flex-col items-start rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-400"
      >
        {content}
      </span>
    );
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${name}${username ? ` profile for ${username}` : ""}`}
      className="inline-flex min-w-0 max-w-full flex-col items-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
    >
      {content}
    </a>
  );
}

function PlatformGroup({ groupKey, title, platforms }) {
  if (!Array.isArray(platforms) || platforms.length === 0) {
    return null;
  }

  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
      <p className="break-words text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
        {title}
      </p>

      <div className="mt-5 flex min-w-0 flex-wrap gap-3">
        {platforms.map((platform, index) => {
          const platformName = String(platform?.name || "platform").trim();

          const platformUrl = String(platform?.url || "").trim();

          const platformUsername = String(platform?.username || "").trim();

          const platformKey =
            platform?._id ||
            platform?.id ||
            platform?.key ||
            `${groupKey}-${platformName}-${platformUrl}-${platformUsername}-${index}`;

          return <PlatformLink key={platformKey} platform={platform} />;
        })}
      </div>
    </div>
  );
}

function ContactSection() {
  const { settings } = useSiteSettings();

  const contact = settings?.contact || siteData.contact || {};

  const sectionContent = settings?.contactSection || {};

  const eyebrow =
    String(sectionContent.eyebrow || "").trim() ||
    defaultSectionContent.eyebrow;

  const heading =
    String(sectionContent.heading || sectionContent.title || "").trim() ||
    defaultSectionContent.heading;

  const description =
    String(sectionContent.description || "").trim() ||
    defaultSectionContent.description;

  const enquiryEyebrow =
    String(sectionContent.enquiryEyebrow || "").trim() ||
    defaultSectionContent.enquiryEyebrow;

  const enquiryHeading =
    String(sectionContent.enquiryHeading || "").trim() ||
    defaultSectionContent.enquiryHeading;

  const enquiryDescription =
    String(sectionContent.enquiryDescription || "").trim() ||
    defaultSectionContent.enquiryDescription;

  const socialPlatforms = getVisiblePlatforms(
    settings?.socialPlatforms,
    siteData.socialPlatforms || [],
  );

  const developerPlatforms = getVisiblePlatforms(
    settings?.developerPlatforms,
    siteData.developerPlatforms || [],
  );

  const freelancerPlatforms = getVisiblePlatforms(
    settings?.freelancerPlatforms,
    siteData.freelancerPlatforms || [],
  );

  const platformGroups = [
    {
      key: "social",
      title: "Social Media",
      platforms: socialPlatforms,
    },
    {
      key: "developer",
      title: "Developer Profiles",
      platforms: developerPlatforms,
    },
    {
      key: "freelancer",
      title: "Freelancer Profiles",
      platforms: freelancerPlatforms,
    },
  ].filter((group) => group.platforms.length > 0);

  const email = String(contact.email || "").trim();

  const phone = String(contact.phone || "").trim();

  const whatsapp = String(contact.whatsapp || "").trim();

  const location = String(contact.location || "").trim();

  const availability =
    String(contact.availability || "").trim() ||
    "Available for freelance and business projects";

  const emailHref = getSafeEmailHref(email);

  const phoneHref = getSafePhoneHref(phone);

  const whatsappHref = getSafeWhatsAppHref(whatsapp);

  return (
    <Section
      id="contact"
      className="scroll-mt-20 overflow-x-hidden border-t border-slate-200 bg-white"
    >
      <Container>
        <div className="min-w-0">
          <SectionHeading
            eyebrow={eyebrow}
            title={heading}
            description={description}
          />

          <div className="mt-12 grid min-w-0 gap-8 [&>*]:min-w-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="min-w-0 space-y-6">
              <div className="min-w-0 rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70 sm:p-8">
                <p className="break-words text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
                  {enquiryEyebrow}
                </p>

                <h3 className="mt-3 break-words text-3xl font-bold tracking-tight">
                  {enquiryHeading}
                </h3>

                <p className="mt-4 break-words leading-7 text-slate-400">
                  {enquiryDescription}
                </p>

                <div className="mt-7 flex min-w-0 items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <span className="mt-1 size-3 shrink-0 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />

                  <p className="min-w-0 break-words text-sm font-semibold leading-6 text-emerald-300">
                    {availability}
                  </p>
                </div>
              </div>

              <div className="grid min-w-0 gap-4 [&>*]:min-w-0 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <ContactDetail
                  label="Email"
                  value={email}
                  href={emailHref}
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M4 6h16v12H4z" />
                      <path d="m4 7 8 6 8-6" />
                    </svg>
                  }
                />

                <ContactDetail
                  label="Phone"
                  value={phone}
                  href={phoneHref}
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <path d="M6.5 4h3l1.5 4-2 1.5a15 15 0 0 0 5.5 5.5l1.5-2 4 1.5v3c0 1.1-.9 2-2 2C10 19.5 4.5 14 4.5 6c0-1.1.9-2 2-2Z" />
                    </svg>
                  }
                />

                <ContactDetail
                  label="WhatsApp"
                  value={whatsapp}
                  href={whatsappHref}
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.5Z" />
                      <path d="M9 8.5c.5 2.5 2 4 4.5 4.8" />
                    </svg>
                  }
                />

                <ContactDetail
                  label="Location"
                  value={location}
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 10c0 5-8 10-8 10S4 15 4 10a8 8 0 1 1 16 0Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  }
                />
              </div>
            </div>

            <ContactForm />
          </div>

          {platformGroups.length > 0 && (
            <div
              className={`mt-12 grid min-w-0 gap-6 [&>*]:min-w-0 ${
                platformGroups.length === 1
                  ? "lg:grid-cols-1"
                  : platformGroups.length === 2
                    ? "lg:grid-cols-2"
                    : "lg:grid-cols-3"
              }`}
            >
              {platformGroups.map((group) => (
                <PlatformGroup
                  key={group.key}
                  groupKey={group.key}
                  title={group.title}
                  platforms={group.platforms}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

export default ContactSection;
