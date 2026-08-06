import { useMemo } from "react";
import { Link } from "react-router";

import { mergeHomepageSections } from "../../config/homepageSections";
import useExperience from "../../hooks/useExperience";
import useSiteSettings from "../../hooks/useSiteSettings";
import ExperienceTimelineCard from "../experience/ExperienceTimelineCard";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";

const SITE_URL = "https://rakeshnexify.com";

const defaultSectionContent = {
  eyebrow: "Professional Experience",

  heading: "Work, freelance and business experience",

  description:
    "Explore the professional roles, responsibilities, achievements and technologies that shaped my practical development experience.",

  ctaButton: {
    label: "View Complete Experience",
    url: "/experience",
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

function getSafePublicUrl(value, fallbackUrl = "/experience") {
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
      Boolean(parsedUrl.hostname) &&
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

function isExperiencePageDestination(value) {
  const url = String(value || "").trim();

  if (!url) {
    return false;
  }

  try {
    const siteUrl = new URL(SITE_URL);
    const destinationUrl = new URL(url, siteUrl);

    const normalizedPathname =
      destinationUrl.pathname.replace(/\/+$/, "") || "/";

    return (
      destinationUrl.origin === siteUrl.origin &&
      normalizedPathname === "/experience"
    );
  } catch {
    return false;
  }
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
        <span className="sr-only"> opens in a new tab</span>
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

function ExperienceSection() {
  const {
    experienceRecords,
    isLoading,
    error,
    refreshExperience,
  } = useExperience();

  const { settings } = useSiteSettings();

  const sectionContent = settings?.experienceSection || {};

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

  const experiencePublicationSection = useMemo(() => {
    return mergeHomepageSections(settings?.sections).find(
      (section) => section.key === "experience",
    );
  }, [settings?.sections]);

  const shouldShowCta = !(
    experiencePublicationSection?.isPageVisible === false &&
    isExperiencePageDestination(ctaUrl)
  );

  const experience = Array.isArray(experienceRecords)
    ? experienceRecords
    : [];

  const previewExperience = experience.slice(0, 4);

  return (
    <Section
      id="experience"
      className="scroll-mt-20 border-t border-slate-200 bg-white"
    >
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={heading}
          description={description}
        />

        <p aria-live="polite" className="sr-only">
          {isLoading
            ? "Loading Experience records."
            : `${experience.length} Experience records loaded.`}
        </p>

        {error && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-800">
                Experience information could not be loaded
              </p>

              <p className="mt-1 break-words text-sm leading-6 text-amber-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={refreshExperience}
              disabled={isLoading}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Retrying..." : "Retry Experience"}
            </button>
          </div>
        )}

        {isLoading && experience.length === 0 && (
          <div className="mt-10 space-y-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && experience.length === 0 && (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
              0
            </div>

            <p className="mt-6 text-lg font-bold text-slate-950">
              No public Experience records available
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Experience records will appear here after they are created and
              published from the Admin Panel.
            </p>
          </div>
        )}

        {previewExperience.length > 0 && (
          <div className="mt-10 space-y-7">
            {previewExperience.map((experienceRecord, index) => (
              <ExperienceTimelineCard
                key={
                  experienceRecord._id ||
                  experienceRecord.id ||
                  experienceRecord.slug ||
                  `${experienceRecord.organizationName}-${index}`
                }
                experience={experienceRecord}
                compact
                showTimelineConnector={index < previewExperience.length - 1}
              />
            ))}
          </div>
        )}

        {previewExperience.length > 0 && shouldShowCta && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-bold text-slate-950">
                Explore the complete professional timeline
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                View every published role, responsibility, achievement, skill
                and tool.
              </p>
            </div>

            <DynamicActionLink
              url={ctaUrl}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {ctaLabel} →
            </DynamicActionLink>
          </div>
        )}
      </Container>
    </Section>
  );
}

export default ExperienceSection;
