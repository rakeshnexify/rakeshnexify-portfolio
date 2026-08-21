import useEducation from "../../hooks/useEducation";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import styles from "./EducationSection.module.css";


const defaultSectionContent = {
  eyebrow: "Education Journey",
  heading: "Academic learning and professional qualifications",
  description:
    "Explore the institutions, qualifications, courses and training that shaped my technical knowledge and professional development.",
};

const educationTypeLabels = {
  school: "School",
  college: "College",
  university: "University",
  course: "Course",
  training: "Training",
  certification: "Certification",
  other: "Education",
};

const educationToneClassNames = {
  school: styles.toneBlue,
  college: styles.toneGreen,
  university: styles.toneBlue,
  course: styles.toneCyan,
  training: styles.toneAmber,
  certification: styles.toneViolet,
  other: styles.toneBlue,
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

function formatEducationDate(value) {
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

function splitHeading(value) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length <= 1) {
    return {
      prefix: "",
      accent: words[0] || "Education",
    };
  }

  return {
    prefix: words.slice(0, -1).join(" "),
    accent: words[words.length - 1],
  };
}

function EducationCapIcon({ className = "" }) {
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
      <path d="m3 9 9-5 9 5-9 5-9-5Z" />
      <path d="M6.5 11.2v4.5c3 2.2 8 2.2 11 0v-4.5" />
      <path d="M21 9.3v5.4" />
    </svg>
  );
}

function EducationTypeIcon({ type }) {
  if (type === "school") {
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
        <path d="M4 20h16" />
        <path d="M6 20V9l6-4 6 4v11" />
        <path d="M9 20v-5h6v5" />
        <path d="M9 10h.01M15 10h.01" />
      </svg>
    );
  }

  if (type === "course" || type === "training") {
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
        <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v16H7.5A3.5 3.5 0 0 0 4 21.5v-16Z" />
        <path d="M4 18.5A3.5 3.5 0 0 1 7.5 15H20" />
      </svg>
    );
  }

  if (type === "certification") {
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
        <circle cx="12" cy="9" r="5" />
        <path d="m9.5 13.4-1 7 3.5-2 3.5 2-1-7" />
        <path d="m10.3 9 1.1 1.1 2.3-2.3" />
      </svg>
    );
  }

  return <EducationCapIcon />;
}

function KnowledgePrismBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <div className={`${styles.prism} ${styles.prismOne}`} />
      <div className={`${styles.prism} ${styles.prismTwo}`} />
      <div className={`${styles.prism} ${styles.prismThree}`} />

      <svg
        className={styles.knowledgeMap}
        viewBox="0 0 1440 640"
        preserveAspectRatio="none"
      >
        <polyline
          className={`${styles.knowledgeLane} ${styles.lanePrimary}`}
          points="-80,470 180,340 405,390 610,240 850,305 1080,165 1510,260"
        />
        <polyline
          className={`${styles.knowledgeLane} ${styles.laneSecondary}`}
          points="-40,180 235,285 455,180 705,265 920,135 1175,245 1490,115"
        />
        <polyline
          className={`${styles.knowledgeLane} ${styles.laneTertiary}`}
          points="55,610 275,480 520,535 760,395 990,455 1215,315 1485,380"
        />

        <g className={styles.glyphCluster}>
          <path d="M118 112h54M118 126h31M118 140h68" />
          <path d="M1215 92h58M1237 106h36M1202 120h71" />
          <path d="M1040 520h73M1040 534h42M1040 548h58" />
        </g>

        <g className={styles.bracketCluster}>
          <path d="M250 88h-26v48h26M1190 420h26v48h-26" />
          <path d="M905 72h-18v34h18M512 505h18v34h-18" />
        </g>
      </svg>

      <span className={`${styles.dataChip} ${styles.dataChipOne}`}>
        101
      </span>
      <span className={`${styles.dataChip} ${styles.dataChipTwo}`}>
        EDU
      </span>
      <span className={`${styles.dataChip} ${styles.dataChipThree}`}>
        01
      </span>

      <div className={styles.scanBeam} />
    </div>
  );
}

function EducationJourneyCard({ education, index, isLast }) {
  const institutionName =
    String(education?.institutionName || "").trim() || "Institution";
  const degree =
    String(education?.degree || "").trim() || "Education Qualification";
  const fieldOfStudy = String(education?.fieldOfStudy || "").trim();
  const location = String(education?.location || "").trim();
  const grade = String(education?.grade || "").trim();
  const educationType = String(
    education?.educationType || "other",
  ).toLowerCase();
  const typeLabel =
    educationTypeLabels[educationType] || educationTypeLabels.other;
  const toneClassName =
    educationToneClassNames[educationType] || educationToneClassNames.other;

  const startDate = formatEducationDate(education?.startDate);
  const endDate = education?.isCurrentlyStudying
    ? "Present"
    : formatEducationDate(education?.endDate);
  const timelineLabel = [startDate, endDate].filter(Boolean).join(" - ");
  const logoUrl = getSafeHttpUrl(education?.logoUrl);
  const institutionUrl = getSafeHttpUrl(education?.institutionUrl);
  const certificateUrl = getSafeHttpUrl(education?.certificateUrl);

  return (
    <li className={`${styles.timelineItem} ${toneClassName}`}>
      <div className={styles.rail} aria-hidden="true">
        <span className={styles.node}>
          <span />
        </span>
        {!isLast && <span className={styles.connector} />}
      </div>

      <article className={styles.card}>
        <div className={styles.iconShell}>
          <span className={styles.iconFallback}>
            <EducationTypeIcon type={educationType} />
          </span>

          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${institutionName} logo`}
              className={styles.logoImage}
              loading={index > 1 ? "lazy" : "eager"}
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          )}
        </div>

        <div className={styles.cardContent}>
          <div className={styles.cardTopline}>
            <span className={styles.typeLabel}>{typeLabel}</span>
          </div>

          <h3 className={styles.degree}>{degree}</h3>

          <div className={styles.institutionRow}>
            <span className={styles.institutionIcon} aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <path d="M5 21V8l7-4 7 4v13" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </span>

            <span className={styles.institution}>{institutionName}</span>

            {fieldOfStudy && (
              <>
                <span className={styles.metaDot} aria-hidden="true" />
                <span className={styles.field}>{fieldOfStudy}</span>
              </>
            )}
          </div>

          {(location || grade) && (
            <div className={styles.secondaryMeta}>
              {location && <span>{location}</span>}
              {location && grade && <span aria-hidden="true">/</span>}
              {grade && <span>{grade}</span>}
            </div>
          )}
        </div>

        <div className={styles.cardMeta}>
          {timelineLabel && (
            <div className={styles.dateBadge}>
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
              <span>{timelineLabel}</span>
            </div>
          )}

          {(
            education?.isFeatured ||
            education?.isCurrentlyStudying ||
            institutionUrl ||
            certificateUrl
          ) && (
            <div className={styles.metaFooter}>
              {(education?.isFeatured || education?.isCurrentlyStudying) && (
                <div className={styles.statuses}>
                  {education?.isFeatured && (
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
                  {education?.isCurrentlyStudying && (
                    <span className={styles.current}>Current</span>
                  )}
                </div>
              )}

              {(institutionUrl || certificateUrl) && (
                <div className={styles.actions}>
                  {institutionUrl && (
                    <a
                      href={institutionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.actionLink}
                      aria-label={`Open ${institutionName} website in a new tab`}
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                      </svg>
                      <span className={styles.actionLabel}>Website</span>
                    </a>
                  )}

                  {certificateUrl && (
                    <a
                      href={certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.actionLink}
                      aria-label="View certificate in a new tab"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M6 3h9l3 3v15H6z" />
                        <path d="M14 3v4h4M9 12h6M9 16h4" />
                      </svg>
                      <span className={styles.actionLabel}>Certificate</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </article>
    </li>
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

  const education = Array.isArray(educationRecords)
    ? educationRecords
    : [];
  const previewEducation = education.slice(0, 4);
  const headingParts = splitHeading(heading);

  return (
    <Section id="education" className={`${styles.section} scroll-mt-20`}>
      <KnowledgePrismBackdrop />

      <Container>
        <div className={styles.content}>
          <header className={styles.intro}>
            <div className={styles.eyebrowRow}>
              <span className={styles.eyebrowLine} />
              <span className={styles.eyebrow}>
                <EducationCapIcon />
                {eyebrow}
              </span>
              <span className={styles.eyebrowLine} />
            </div>

            <h2 className={styles.heading}>
              {headingParts.prefix && <span>{headingParts.prefix} </span>}
              <span className={styles.headingAccent}>
                {headingParts.accent}
              </span>
            </h2>

            <span className={styles.headingMark} aria-hidden="true" />

            {description && (
              <p className={styles.description}>{description}</p>
            )}
          </header>

          <p aria-live="polite" className="sr-only">
            {isLoading
              ? "Loading Education records."
              : `${education.length} Education records loaded.`}
          </p>

          {error && (
            <div className={styles.notice}>
              <div>
                <p className={styles.noticeTitle}>
                  Saved Education information is being displayed
                </p>
                <p className={styles.noticeText}>
                  The live Education API could not be reached.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshEducation}
                disabled={isLoading}
                className={styles.retryButton}
              >
                {isLoading ? "Retrying..." : "Retry Education"}
              </button>
            </div>
          )}

          {isLoading && education.length === 0 && (
            <div className={styles.skeletonList} aria-hidden="true">
              {[1, 2, 3].map((item) => (
                <div key={item} className={styles.skeletonRow}>
                  <div className={styles.skeletonNode} />
                  <div className={styles.skeletonCard} />
                </div>
              ))}
            </div>
          )}

          {!isLoading && education.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <EducationCapIcon />
              </div>
              <p className={styles.emptyTitle}>
                No public Education records available
              </p>
              <p className={styles.emptyText}>
                Education records will appear here after they are created and
                published from the Admin Panel.
              </p>
            </div>
          )}

          {previewEducation.length > 0 && (
            <ol className={styles.timeline}>
              {previewEducation.map((educationRecord, index) => (
                <EducationJourneyCard
                  key={
                    educationRecord._id ||
                    educationRecord.id ||
                    educationRecord.slug ||
                    `${educationRecord.institutionName}-${index}`
                  }
                  education={educationRecord}
                  index={index}
                  isLast={index === previewEducation.length - 1}
                />
              ))}
            </ol>
          )}

        </div>
      </Container>
    </Section>
  );
}

export default EducationSection;
