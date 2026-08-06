import { useMemo } from "react";
import { Link } from "react-router";

import { mergeHomepageSections } from "../../config/homepageSections";
import useEducation from "../../hooks/useEducation";
import useSiteSettings from "../../hooks/useSiteSettings";
import EducationTimelineCard from "../education/EducationTimelineCard";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";

const SITE_URL = "https://rakeshnexify.com";

const defaultSectionContent = {
  eyebrow: "Education Journey",

  heading: "Academic learning and professional qualifications",

  description:
    "Explore the institutions, qualifications, courses and training that shaped my technical knowledge and professional development.",

  ctaButton: {
    label: "View Complete Education",
    url: "/education",
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

function getSafePublicUrl(value, fallbackUrl = "/education") {
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

function isEducationPageDestination(value) {
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
      normalizedPathname === "/education"
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

function EducationSection() {
  const {
    educationRecords,
    isLoading,
    error,
    refreshEducation,
  } = useEducation();

  const { settings } = useSiteSettings();

  const sectionContent = settings?.educationSection || {};

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

  const educationPublicationSection = useMemo(() => {
    return mergeHomepageSections(settings?.sections).find(
      (section) => section.key === "education",
    );
  }, [settings?.sections]);

  const shouldShowCta = !(
    educationPublicationSection?.isPageVisible === false &&
    isEducationPageDestination(ctaUrl)
  );

  const education = Array.isArray(educationRecords)
    ? educationRecords
    : [];

  const previewEducation = education.slice(0, 4);

  return (
    <Section
      id="education"
      className="scroll-mt-20 border-t border-slate-200 bg-slate-50"
    >
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={heading}
          description={description}
        />

        <p aria-live="polite" className="sr-only">
          {isLoading
            ? "Loading Education records."
            : `${education.length} Education records loaded.`}
        </p>

        {error && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-800">
                Saved Education information is being displayed
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                The live Education API could not be reached.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshEducation}
              disabled={isLoading}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Retrying..." : "Retry Education"}
            </button>
          </div>
        )}

        {isLoading && education.length === 0 && (
          <div className="mt-10 space-y-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {!isLoading && education.length === 0 && (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
              0
            </div>

            <p className="mt-6 text-lg font-bold text-slate-950">
              No public Education records available
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Education records will appear here after they are created and
              published from the Admin Panel.
            </p>
          </div>
        )}

        {previewEducation.length > 0 && (
          <div className="mt-10 space-y-7">
            {previewEducation.map((educationRecord, index) => (
              <EducationTimelineCard
                key={
                  educationRecord._id ||
                  educationRecord.id ||
                  educationRecord.slug ||
                  `${educationRecord.institutionName}-${index}`
                }
                education={educationRecord}
                compact
                showTimelineConnector={index < previewEducation.length - 1}
              />
            ))}
          </div>
        )}

        {previewEducation.length > 0 && shouldShowCta && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-bold text-slate-950">
                Explore the complete education timeline
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                View every published qualification, institution, course and
                training record.
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

export default EducationSection;
