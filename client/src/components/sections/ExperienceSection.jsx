import { useMemo } from "react";
import { mergeHomepageSections } from "../../config/homepageSections";
import useExperience from "../../hooks/useExperience";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import styles from "./ExperienceSection.module.css";

import PublicSectionHeader from "../layout/PublicSectionHeader";
import PublicCTAButton from "../layout/PublicCTAButton";
const SITE_URL = "https://rakeshnexify.com";

const defaultSectionContent = {
  eyebrow: "",
  heading: "",
  description:
    "",
  ctaButton: {
    label: "",
    url: "",
  },
};

const employmentTypeLabels = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  freelance: "Freelance",
  contract: "Contract",
  internship: "Internship",
  "self-employed": "Self-employed",
  founder: "Founder",
  volunteer: "Volunteer",
  other: "Experience",
};

const employmentToneClassNames = {
  "full-time": styles.toneBlue,
  "part-time": styles.toneViolet,
  freelance: styles.toneCyan,
  contract: styles.toneBlue,
  internship: styles.toneAmber,
  "self-employed": styles.toneGreen,
  founder: styles.toneViolet,
  volunteer: styles.toneRose,
  other: styles.toneBlue,
};

const locationTypeLabels = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
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

function getSafeHttpUrl(value) {
  const url = String(value || "").trim();

  if (!url || containsControlCharacters(url)) {
    return "";
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
    return "";
  }

  return "";
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

  return getSafeHttpUrl(url) || fallbackUrl;
}

function getStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
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

function formatExperienceDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getExperienceDurationLabel(startDateValue, endDateValue, isCurrent) {
  const startDate = new Date(startDateValue || "");
  const endDate = isCurrent ? new Date() : new Date(endDateValue || "");

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate < startDate
  ) {
    return "";
  }

  const totalMonths = Math.max(
    1,
    (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
      (endDate.getUTCMonth() - startDate.getUTCMonth()) +
      (endDate.getUTCDate() >= startDate.getUTCDate() ? 0 : -1),
  );

  if (totalMonths < 12) {
    return `${totalMonths} ${totalMonths === 1 ? "Month" : "Months"}`;
  }

  const years = Math.round((totalMonths / 12) * 10) / 10;

  return `${Number.isInteger(years) ? years.toFixed(0) : years.toFixed(1)} ${
    years === 1 ? "Year" : "Years"
  }`;
}

function splitHeading(value) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length <= 1) {
    return {
      prefix: "",
      accent: words[0] || "",
    };
  }

  return {
    prefix: words.slice(0, -1).join(" "),
    accent: words[words.length - 1],
  };
}

function BriefcaseIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="7" width="18" height="13" rx="3" />
      <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" />
      <path d="M3 12h18M10 12v2h4v-2" />
    </svg>
  );
}

function RoleIcon({ employmentType }) {
  if (["freelance", "contract"].includes(employmentType)) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />
      </svg>
    );
  }

  if (["founder", "self-employed"].includes(employmentType)) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 4c3.6.2 5.8 2.4 6 6l-5 5-6-6 5-5Z" />
        <path d="m9 9-3 1-2 4 5 1M15 15l-1 3-4 2-1-5" />
        <path d="M14.5 7.5h.01" />
      </svg>
    );
  }

  return <BriefcaseIcon />;
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function CareerTechTopographyBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <div className={`${styles.terrainMass} ${styles.terrainMassOne}`} />
      <div className={`${styles.terrainMass} ${styles.terrainMassTwo}`} />

      <svg
        className={styles.topography}
        viewBox="0 0 1440 640"
        preserveAspectRatio="none"
      >
        <g className={`${styles.contourGroup} ${styles.contourGroupOne}`}>
          <path d="M-40 500C28 423 35 335 122 286c88-49 195-9 251 63 56 72 53 176-11 247-65 72-186 91-277 42-65-35-99-85-125-138Z" />
          <path d="M5 500c49-58 54-126 117-165 67-42 152-13 196 42 46 57 45 140-3 198-51 61-144 80-216 45-55-26-80-68-94-120Z" />
          <path d="M48 497c34-42 39-91 85-119 49-31 111-10 143 30 34 42 34 102-2 145-37 44-104 57-155 32-39-20-58-49-71-88Z" />
          <path d="M89 492c24-28 27-61 58-80 33-20 73-6 95 20 22 29 22 68-1 97-25 29-68 38-102 22-27-13-40-34-50-59Z" />
        </g>

        <g className={`${styles.contourGroup} ${styles.contourGroupTwo}`}>
          <path d="M982-56c85-15 173 21 229 89 57 68 66 167 23 245-42 77-135 126-222 116-89-10-166-79-185-166-18-85 21-176 92-226 19-14 40-26 63-36Z" />
          <path d="M1008-12c64-10 130 17 173 68 44 52 50 126 18 184-32 59-102 95-169 88-68-8-126-59-140-125-15-63 14-131 68-169 15-11 32-20 50-26Z" />
          <path d="M1035 31c43-7 87 11 116 46 30 35 34 85 12 124-22 39-69 64-114 58-45-5-84-40-94-84-10-43 10-88 46-114 11-8 22-14 34-19Z" />
          <path d="M1060 72c25-4 51 6 68 26 18 21 20 50 8 74-13 24-41 39-68 35-27-3-50-24-56-50-6-25 6-52 28-67 6-5 13-9 20-11Z" />
        </g>

        <g className={`${styles.contourGroup} ${styles.contourGroupThree}`}>
          <path d="M510 726c-31-89 10-188 91-237 81-49 189-39 258 26 69 64 88 172 45 256-43 84-144 135-237 117-91-17-164-99-173-191-2-22 0-46 5-69Z" />
          <path d="M560 692c-22-63 7-132 64-167 57-34 132-27 181 18 49 46 62 122 31 181-30 59-101 94-166 82-64-12-115-69-121-134-2-15 0-31 3-47Z" />
          <path d="M608 661c-14-39 4-82 40-104 35-21 82-17 112 11 31 29 39 76 20 113-19 37-63 59-103 51-40-7-71-43-75-83-1-9 0-19 2-29Z" />
        </g>

        <path
          className={`${styles.contourHighlight} ${styles.contourHighlightOne}`}
          d="M7 500c49-58 54-126 117-165 67-42 152-13 196 42 46 57 45 140-3 198-51 61-144 80-216 45"
        />
        <path
          className={`${styles.contourHighlight} ${styles.contourHighlightTwo}`}
          d="M1008-12c64-10 130 17 173 68 44 52 50 126 18 184-32 59-102 95-169 88"
        />
        <path
          className={`${styles.contourHighlight} ${styles.contourHighlightThree}`}
          d="M560 692c-22-63 7-132 64-167 57-34 132-27 181 18 49 46 62 122 31 181"
        />
      </svg>

      <span className={`${styles.elevationMarker} ${styles.elevationMarkerOne}`}>
        <span />
      </span>
      <span className={`${styles.elevationMarker} ${styles.elevationMarkerTwo}`}>
        <span />
      </span>

      <div className={styles.elevationHalo} />
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 5h5v5" />
      <path d="m10 14 9-9" />
      <path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

function DetailList({ title, items }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.detailBlock}>
      <h4 className={styles.detailTitle}>{title}</h4>

      <ul className={styles.detailList}>
        {items.map((item, index) => (
          <li key={`${title}-${index}-${item}`}>
            <span className={styles.detailBullet} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DetailFact({ label, value }) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) {
    return null;
  }

  return (
    <div className={styles.detailFact}>
      <span>{label}</span>
      <strong>{cleanValue}</strong>
    </div>
  );
}

function DetailTags({ title, items }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={styles.tagBlock}>
      <h4 className={styles.detailTitle}>{title}</h4>

      <div className={styles.tagList}>
        {items.map((item, index) => (
          <span key={`${title}-${index}-${item}`} className={styles.detailTag}>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function ExperienceJourneyCard({
  experience,
  isLast,
}) {
  const organizationName =
    String(experience?.organizationName || "").trim() || "Organization";
  const jobTitle =
    String(experience?.jobTitle || "").trim() || "Professional Role";
  const employmentType =
    String(experience?.employmentType || "other").trim().toLowerCase();
  const employmentTypeLabel =
    employmentTypeLabels[employmentType] || employmentTypeLabels.other;
  const toneClassName =
    employmentToneClassNames[employmentType] || employmentToneClassNames.other;

  const location = String(experience?.location || "").trim();
  const locationType =
    String(experience?.locationType || "").trim().toLowerCase();
  const locationTypeLabel = locationTypeLabels[locationType] || "";

  const shortDescription = String(
    experience?.shortDescription || experience?.description || "",
  ).trim();
  const detailedDescription = String(experience?.description || "").trim();

  const responsibilities = getStringList(experience?.responsibilities);
  const achievements = getStringList(experience?.achievements);
  const skills = getStringList(experience?.skills);
  const tools = getStringList(experience?.tools);

  const organizationWebsiteUrl = getSafeHttpUrl(
    experience?.organizationWebsiteUrl,
  );
  const organizationLogoUrl = getSafeHttpUrl(
    experience?.organizationLogoUrl,
  );

  const startDate = formatExperienceDate(experience?.startDate);
  const endDate = experience?.isCurrent
    ? "Present"
    : formatExperienceDate(experience?.endDate);
  const timelineLabel = [startDate, endDate].filter(Boolean).join(" - ");
  const durationLabel = experience?.isCurrent
    ? "Currently Working"
    : getExperienceDurationLabel(
        experience?.startDate,
        experience?.endDate,
        false,
      );
  const statusLabel = experience?.isCurrent ? "Current Position" : "Completed";

  const shouldShowDetailedDescription =
    detailedDescription &&
    detailedDescription !== shortDescription;

  return (
    <li className={`${styles.timelineItem} ${toneClassName}`}>
      <div className={styles.rail} aria-hidden="true">
        <span className={styles.node}>
          <RoleIcon employmentType={employmentType} />
        </span>
        {!isLast && <span className={styles.connector} />}
      </div>

      <details className={styles.experienceDetails}>
        <summary className={styles.card}>
          <div className={styles.identity}>
            <div className={styles.roleRow}>
              <span className={styles.role}>{jobTitle}</span>

              {experience?.isFeatured && (
                <span
                  className={styles.featured}
                  aria-label="Featured"
                  title="Featured"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="m12 2.7 2.8 5.67 6.26.91-4.53 4.41 1.07 6.23L12 16.98l-5.6 2.94 1.07-6.23-4.53-4.41 6.26-.91L12 2.7Z" />
                  </svg>
                </span>
              )}
            </div>

            <h3 className={styles.organization}>{organizationName}</h3>

            <div className={styles.meta}>
              {timelineLabel && (
                <span className={styles.metaItem}>
                  <CalendarIcon />
                  {timelineLabel}
                </span>
              )}
            </div>
          </div>

          <div className={styles.impact}>
            <div className={styles.impactTop}>
              {durationLabel && (
                <span
                  className={`${styles.duration} ${
                    experience?.isCurrent ? styles.durationCurrent : ""
                  }`}
                >
                  {durationLabel}
                </span>
              )}

              <span className={styles.expandIndicator} aria-hidden="true">
                <ChevronDownIcon />
              </span>
            </div>

            <span className="sr-only">
              Open full details for {jobTitle} at {organizationName}
            </span>
          </div>
        </summary>

        <div className={styles.expandedPanel}>
          <section className={styles.completeDetailsBlock}>
            <div className={styles.completeDetailsHeading}>
              <div>
                <span className={styles.completeDetailsEyebrow}>
                  Complete Role Details
                </span>
                <h4>Published Experience information</h4>
              </div>

              {experience?.isFeatured && (
                <span className={styles.completeFeatured}>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="m12 2.7 2.8 5.67 6.26.91-4.53 4.41 1.07 6.23L12 16.98l-5.6 2.94 1.07-6.23-4.53-4.41 6.26-.91L12 2.7Z" />
                  </svg>
                  Featured
                </span>
              )}
            </div>

            <div className={styles.detailFacts}>
              <DetailFact label="Role" value={jobTitle} />
              <DetailFact label="Organization" value={organizationName} />
              <DetailFact label="Employment Type" value={employmentTypeLabel} />
              <DetailFact label="Period" value={timelineLabel} />
              <DetailFact label="Status" value={statusLabel} />
              <DetailFact label="Duration" value={durationLabel} />
              <DetailFact label="Location" value={location} />
              <DetailFact label="Work Mode" value={locationTypeLabel} />
            </div>
          </section>

          {shortDescription && (
            <section className={styles.descriptionBlock}>
              <h4 className={styles.detailTitle}>Short Description</h4>
              <p className={styles.detailDescription}>{shortDescription}</p>
            </section>
          )}

          {shouldShowDetailedDescription && (
            <section className={styles.descriptionBlock}>
              <h4 className={styles.detailTitle}>Detailed Description</h4>
              <p className={styles.detailDescription}>
                {detailedDescription}
              </p>
            </section>
          )}

          {(responsibilities.length > 0 || achievements.length > 0) && (
            <div className={styles.detailGrid}>
              <DetailList title="Responsibilities" items={responsibilities} />
              <DetailList title="Achievements" items={achievements} />
            </div>
          )}

          {(skills.length > 0 || tools.length > 0) && (
            <div className={styles.tagsGrid}>
              <DetailTags title="Skills" items={skills} />
              <DetailTags title="Tools & Technologies" items={tools} />
            </div>
          )}

          {(organizationWebsiteUrl || organizationLogoUrl) && (
            <div className={styles.organizationDetails}>
              <div className={styles.organizationDetailsIdentity}>
                {organizationLogoUrl && (
                  <span className={styles.organizationLogo}>
                    <img
                      src={organizationLogoUrl}
                      alt={`${organizationName} logo`}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.hidden = true;
                      }}
                    />
                  </span>
                )}

                <div>
                  <span className={styles.organizationDetailsLabel}>
                    Organization
                  </span>
                  <strong>{organizationName}</strong>
                  {organizationLogoUrl && (
                    <span className={styles.mediaAvailable}>Logo Added</span>
                  )}
                </div>
              </div>

              {organizationWebsiteUrl && (
                <a
                  href={organizationWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.websiteLink}
                >
                  Organization Website
                  <ExternalLinkIcon />
                  <span className="sr-only"> opens in a new tab</span>
                </a>
              )}
            </div>
          )}
        </div>
      </details>
    </li>
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
  const owner = settings?.owner || {};

  const eyebrow = String(sectionContent.eyebrow || "").trim();
  const heading = String(sectionContent.heading || "").trim();
  const description = String(sectionContent.description || "").trim();

  const configuredCta =
    sectionContent.ctaButton || sectionContent.action || {};
  const configuredCtaLabel =
    String(configuredCta.label || "").trim() ||
    defaultSectionContent.ctaButton.label;
  const configuredCtaUrl = getSafePublicUrl(
    configuredCta.url || configuredCta.href,
    defaultSectionContent.ctaButton.url,
  );

  const experiencePublicationSection = useMemo(() => {
    return mergeHomepageSections(settings?.sections).find(
      (section) => section.key === "experience",
    );
  }, [settings?.sections]);

  const resumeUrl = getSafeHttpUrl(owner.resumeUrl);
  const canShowConfiguredCta = !(
    experiencePublicationSection?.isPageVisible === false &&
    isExperiencePageDestination(configuredCtaUrl)
  );

  const action = resumeUrl
    ? {
        label: "View Resume",
        url: resumeUrl,
      }
    : canShowConfiguredCta
      ? {
          label: configuredCtaLabel,
          url: configuredCtaUrl,
        }
      : null;

  const experience = Array.isArray(experienceRecords)
    ? experienceRecords
    : [];
  const previewExperience = experience.slice(0, 3);
  const headingParts = splitHeading(heading);

  return (
    <Section id="experience" className={`${styles.section} scroll-mt-20`}>
      <CareerTechTopographyBackdrop />

      <Container>
        <div className={styles.content}>
          <PublicSectionHeader
            as="header"
            eyebrow={eyebrow}
            title={heading}
            titleContent={
              <>
                {headingParts.prefix && (
                  <span>{headingParts.prefix} </span>
                )}
                <span className={styles.headingAccent}>
                  {headingParts.accent}
                </span>
              </>
            }
            description={description}
            className={styles.intro}
            titleClassName={styles.heading}
            descriptionClassName={styles.description}
          />

          <p aria-live="polite" className="sr-only">
            {isLoading
              ? "Loading Experience records."
              : `${experience.length} Experience records loaded.`}
          </p>

          {error && (
            <div className={styles.notice}>
              <div>
                <p className={styles.noticeTitle}>
                  Experience information could not be loaded
                </p>
                <p className={styles.noticeText}>{error}</p>
              </div>

              <button
                type="button"
                onClick={refreshExperience}
                disabled={isLoading}
                className={styles.retryButton}
              >
                {isLoading ? "Retrying..." : "Retry Experience"}
              </button>
            </div>
          )}

          {isLoading && experience.length === 0 && (
            <div className={styles.skeletonList} aria-hidden="true">
              {[1, 2, 3].map((item) => (
                <div key={item} className={styles.skeletonRow}>
                  <div className={styles.skeletonNode} />
                  <div className={styles.skeletonCard} />
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && experience.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>
                <BriefcaseIcon />
              </span>

              <p className={styles.emptyTitle}>
                No public Experience records available
              </p>

              <p className={styles.emptyText}>
                Experience records will appear here after they are created and
                published from the Admin Panel.
              </p>
            </div>
          )}

          {previewExperience.length > 0 && (
            <ol className={styles.timeline}>
              {previewExperience.map((experienceRecord, index) => (
                <ExperienceJourneyCard
                  key={
                    experienceRecord._id ||
                    experienceRecord.id ||
                    experienceRecord.slug ||
                    `${experienceRecord.organizationName}-${index}`
                  }
                  experience={experienceRecord}
                  isLast={index === previewExperience.length - 1}
                />
              ))}
            </ol>
          )}

          {previewExperience.length > 0 && action && (
            <div className={styles.actionWrap}>
              <PublicCTAButton
                url={action.url}
                label={action.label}
              />
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

export default ExperienceSection;
