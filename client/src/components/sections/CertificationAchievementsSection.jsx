import { useMemo, useState } from "react";
import { mergeHomepageSections } from "../../config/homepageSections";
import useCertificationAchievements from "../../hooks/useCertificationAchievements";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import styles from "./CertificationAchievementsSection.module.css";

import PublicSectionEyebrow from "../layout/PublicSectionEyebrow";
import PublicCTAButton from "../layout/PublicCTAButton";
const SITE_URL = "https://rakeshnexify.com";

const HOME_CREDENTIAL_LIMIT = 3;
const HOME_ACHIEVEMENT_LIMIT = 4;

const supportedTypes = [
  {
    value: "certification",
    label: "Certification",
  },
  {
    value: "license",
    label: "License",
  },
  {
    value: "award",
    label: "Award",
  },
  {
    value: "achievement",
    label: "Achievement",
  },
];

const typeLabels = Object.fromEntries(
  supportedTypes.map((type) => [type.value, type.label]),
);

function getSafePublicUrl(value, fallbackUrl = "/achievements") {
  const url = String(value || "").trim();

  if (!url) {
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

function getSafeHttpUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
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

function isPdfUrl(value) {
  const safeUrl = getSafeHttpUrl(value);

  if (!safeUrl) {
    return false;
  }

  try {
    return /\.pdf$/i.test(new URL(safeUrl).pathname);
  } catch {
    return false;
  }
}

function formatYear(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return String(date.getUTCFullYear());
}

function formatDateOnly(value) {
  const cleanValue = String(value || "").slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    return "";
  }

  const date = new Date(`${cleanValue}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== cleanValue
  ) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function isAchievementsPageDestination(value) {
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
      normalizedPathname === "/achievements"
    );
  } catch {
    return false;
  }
}

function getCredentialsCtaLabel(value) {
  const label = String(value || "").trim();

  if (!label) {
    return "View All Credentials";
  }

  if (/achievements?/i.test(label)) {
    return label.replace(/achievements?/i, "Credentials");
  }

  return "View All Credentials";
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h13m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="m7 9.5 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="m12 3 2.1 1.55 2.62-.15.68 2.54 2.22 1.4-.96 2.45.96 2.45-2.22 1.4-.68 2.54-2.62-.15L12 18.58l-2.1-1.55-2.62.15-.68-2.54-2.22-1.4.96-2.45-.96-2.45 2.22-1.4.68-2.54 2.62.15L12 3Z"
        fill="currentColor"
        opacity=".2"
      />
      <path
        d="m9.3 11.9 1.7 1.7 3.8-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MedalIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M8.2 3h7.6l-1.2 5.1H9.4L8.2 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="14"
        r="5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m12 11.4.75 1.5 1.65.24-1.2 1.17.28 1.65L12 15.18l-1.48.78.28-1.65-1.2-1.17 1.65-.24.75-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TypeIcon({ type }) {
  if (type === "license") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 3.5h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M8.5 8h7M8.5 11.5H14M9 17l1.2 1.2L13 15.4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (type === "award") {
    return <MedalIcon />;
  }

  if (type === "achievement") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 20V9m7 11V4m7 16v-7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="m4 8 6-4 4 3 6-5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 4.5h9.5a2 2 0 0 1 2 2v13H6a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M17.5 9.5h2.5v10h-2.5M8 9h5.5M8 12h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="14"
        y="4"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <rect
        x="14"
        y="14"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function CredentialMedia({ record }) {
  const title =
    String(record?.title || "").trim() || "Professional credential";
  const mediaUrl = getSafeHttpUrl(record?.mediaUrl);
  const mediaAlt =
    String(record?.mediaAlt || "").trim() || `${title} evidence`;
  const canShowImage = mediaUrl && !isPdfUrl(mediaUrl);

  return (
    <span className={styles.credentialMedia}>
      <span className={styles.credentialMediaFallback}>
        <TypeIcon type={record?.type} />
      </span>

      {canShowImage && (
        <img
          src={mediaUrl}
          alt={mediaAlt}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      )}
    </span>
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

function RecordExpandedDetails({ record }) {
  const type = String(record?.type || "achievement").trim().toLowerCase();
  const typeLabel = typeLabels[type] || "Credential";
  const issuerName = String(record?.issuerName || "").trim();
  const shortDescription = String(record?.shortDescription || "").trim();
  const description = String(record?.description || "").trim();
  const credentialId = String(record?.credentialId || "").trim();

  const issueDate = formatDateOnly(record?.issueDate);
  const expirationDate = formatDateOnly(record?.expirationDate);
  const expirationLabel = record?.doesNotExpire
    ? "Does not expire"
    : expirationDate;

  const verificationUrl = getSafeHttpUrl(record?.verificationUrl);
  const mediaUrl = getSafeHttpUrl(record?.mediaUrl);
  const mediaIsPdf = isPdfUrl(mediaUrl);

  const showDetailedDescription =
    description && description !== shortDescription;

  const isAchievement = type === "achievement";
  const isAward = type === "award";
  const isCredentialLifecycleType =
    type === "certification" || type === "license";

  const issuerLabel = isAchievement
    ? "Organization / Source"
    : "Issuer / Organization";

  const issueLabel = isAchievement
    ? "Achievement Date"
    : isAward
      ? "Awarded"
      : "Issued";

  const verificationLabel = isAchievement
    ? "Verify Achievement"
    : isAward
      ? "Verify Award"
      : "Verify Credential";

  return (
    <div className={styles.recordExpandedPanel}>
      {record?.isFeatured && (
        <div className={styles.expandedFeatured}>
          <span aria-hidden="true">★</span>
          {isAchievement
            ? "Featured Achievement"
            : isAward
              ? "Featured Award"
              : "Featured Credential"}
        </div>
      )}

      <div className={styles.detailFacts}>
        <DetailFact label="Type" value={typeLabel} />
        <DetailFact label={issuerLabel} value={issuerName} />
        <DetailFact label={issueLabel} value={issueDate} />

        {isCredentialLifecycleType && (
          <DetailFact label="Expiration" value={expirationLabel} />
        )}

        {!isAchievement && (
          <DetailFact label="Credential ID" value={credentialId} />
        )}
      </div>

      {shortDescription && (
        <section
          className={`${styles.detailTextBlock} ${styles.detailTextPrimary}`}
        >
          <h5>Quick Overview</h5>
          <p>{shortDescription}</p>
        </section>
      )}

      {showDetailedDescription && (
        <section
          className={`${styles.detailTextBlock} ${styles.detailTextSecondary}`}
        >
          <h5>Detailed Highlights</h5>
          <p>{description}</p>
        </section>
      )}

      {(verificationUrl || mediaUrl) && (
        <div className={styles.detailActions}>
          {verificationUrl && (
            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.detailActionPrimary}
            >
              {verificationLabel}
              <VerifiedIcon />
              <span className="sr-only"> opens in a new tab</span>
            </a>
          )}

          {mediaUrl && (
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.detailActionSecondary}
            >
              {mediaIsPdf ? "View Evidence PDF" : "Open Evidence"}
              <ArrowIcon />
              <span className="sr-only"> opens in a new tab</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function CredentialRow({ record }) {
  const title =
    String(record?.title || "").trim() || "Professional credential";
  const issuerName =
    String(record?.issuerName || "").trim() || "Independent recognition";
  const issueYear = formatYear(record?.issueDate);
  const verificationUrl = getSafeHttpUrl(record?.verificationUrl);
  const type = String(record?.type || "certification").trim().toLowerCase();
  const typeLabel = typeLabels[type] || "Credential";

  return (
    <details className={styles.recordDetails}>
      <summary className={styles.credentialRow}>
        <CredentialMedia record={record} />

        <div className={styles.credentialCopy}>
          <span className={styles.recordType}>{typeLabel}</span>
          <h4>{title}</h4>
          <p>{issuerName}</p>
        </div>

        <div className={styles.credentialMeta}>
          {issueYear && <span>{issueYear}</span>}

          {verificationUrl && (
            <span
              className={styles.verifiedBadge}
              title="Verification link available"
            >
              <VerifiedIcon />
              <span className="sr-only">Verification link available</span>
            </span>
          )}

          {record?.isFeatured && (
            <span className={styles.featuredDot} title="Featured">
              ★
              <span className="sr-only">Featured</span>
            </span>
          )}

          <span className={styles.expandIndicator} aria-hidden="true">
            <ChevronDownIcon />
          </span>
        </div>

        <span className="sr-only">
          Open complete details for {title}
        </span>
      </summary>

      <RecordExpandedDetails record={record} />
    </details>
  );
}

function AchievementTile({ record, index }) {
  const title =
    String(record?.title || "").trim() || "Professional achievement";
  const issuerName = String(record?.issuerName || "").trim();
  const shortDescription = String(record?.shortDescription || "").trim();
  const issueYear = formatYear(record?.issueDate);
  const verificationUrl = getSafeHttpUrl(record?.verificationUrl);
  const mediaUrl = getSafeHttpUrl(record?.mediaUrl);
  const mediaAlt =
    String(record?.mediaAlt || "").trim() || `${title} evidence`;
  const canShowImage = mediaUrl && !isPdfUrl(mediaUrl);

  return (
    <details
      className={`${styles.achievementTile} ${
        styles[`achievementTone${(index % 4) + 1}`]
      }`}
    >
      <summary className={styles.achievementSummary}>
        <div className={styles.achievementTop}>
          <span className={styles.achievementIcon}>
            <span className={styles.achievementIconFallback}>
              <TypeIcon type="achievement" />
            </span>

            {canShowImage && (
              <img
                src={mediaUrl}
                alt={mediaAlt}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            )}
          </span>

          <div className={styles.achievementFlags}>
            {record?.isFeatured && (
              <span className={styles.achievementFeatured}>Featured</span>
            )}

            {issueYear && (
              <span className={styles.achievementYear}>{issueYear}</span>
            )}

            {verificationUrl && (
              <span
                className={styles.achievementVerified}
                title="Verification link available"
              >
                <VerifiedIcon />
                <span className="sr-only">Verification link available</span>
              </span>
            )}

            <span className={styles.achievementChevron} aria-hidden="true">
              <ChevronDownIcon />
            </span>
          </div>
        </div>

        <h4>{title}</h4>

        <p className={styles.achievementLabel}>
          {issuerName || "Achievement"}
        </p>

        {shortDescription && (
          <p className={styles.achievementDescription}>{shortDescription}</p>
        )}

        <div className={styles.achievementAccent} aria-hidden="true" />

        <span className="sr-only">
          Open complete details for {title}
        </span>
      </summary>

      <RecordExpandedDetails record={record} />
    </details>
  );
}

function PanelHeading({ icon, title, count }) {
  return (
    <div className={styles.panelHeading}>
      <div className={styles.panelHeadingTitle}>
        <span className={styles.panelHeadingIcon}>{icon}</span>
        <h3>{title}</h3>
      </div>

      <span className={styles.panelCount}>{count}</span>
    </div>
  );
}

function LoadingPreview() {
  return (
    <div className={styles.showcaseGrid} aria-hidden="true">
      <div className={styles.panel}>
        <div className={styles.skeletonHeading} />

        <div className={styles.credentialList}>
          {[1, 2, 3].map((item) => (
            <div key={item} className={styles.skeletonCredential} />
          ))}
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.skeletonHeading} />

        <div className={styles.achievementGrid}>
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className={styles.skeletonAchievement} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CertificationAchievementsSection() {
  const {
    achievementRecords,
    isLoading,
    error,
    refreshCertificationAchievements,
  } = useCertificationAchievements();

  const { settings } = useSiteSettings();
  const [activeType, setActiveType] = useState("all");

  const sectionContent = settings?.achievementsSection || {};

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

  const credentialsCtaLabel = getCredentialsCtaLabel(ctaLabel);

  const publicationSection = useMemo(() => {
    return mergeHomepageSections(settings?.sections).find(
      (section) => section.key === "achievements",
    );
  }, [settings?.sections]);

  const shouldShowCta = !(
    publicationSection?.isPageVisible === false &&
    isAchievementsPageDestination(ctaUrl)
  );

  const records = useMemo(
    () => (Array.isArray(achievementRecords) ? achievementRecords : []),
    [achievementRecords],
  );

  const typeCounts = useMemo(() => {
    return records.reduce((counts, record) => {
      const type = String(record?.type || "").trim().toLowerCase();

      if (Object.hasOwn(typeLabels, type)) {
        counts[type] = (counts[type] || 0) + 1;
      }

      return counts;
    }, {});
  }, [records]);

  const filterOptions = useMemo(() => {
    return [
      {
        value: "all",
        label: "All Types",
        count: records.length,
      },
      ...supportedTypes
        .filter((type) => Number(typeCounts[type.value] || 0) > 0)
        .map((type) => ({
          ...type,
          count: Number(typeCounts[type.value] || 0),
        })),
    ];
  }, [records.length, typeCounts]);

  const filteredRecords = useMemo(() => {
    if (activeType === "all") {
      return records;
    }

    return records.filter(
      (record) =>
        String(record?.type || "").trim().toLowerCase() === activeType,
    );
  }, [activeType, records]);

  const credentialRecords = filteredRecords
    .filter(
      (record) =>
        String(record?.type || "").trim().toLowerCase() !== "achievement",
    )
    .slice(0, HOME_CREDENTIAL_LIMIT);

  const achievementPreviewRecords = filteredRecords
    .filter(
      (record) =>
        String(record?.type || "").trim().toLowerCase() === "achievement",
    )
    .slice(0, HOME_ACHIEVEMENT_LIMIT);

  const showCredentialPanel =
    activeType !== "achievement" &&
    (credentialRecords.length > 0 || activeType !== "all");

  const showAchievementPanel =
    activeType === "all" ||
    activeType === "achievement" ||
    achievementPreviewRecords.length > 0;

  const onePanelVisible =
    Number(showCredentialPanel) + Number(showAchievementPanel) === 1;

  return (
    <Section
      id="achievements"
      className={`${styles.section} scroll-mt-20`}
    >
      <div className={styles.backdrop} aria-hidden="true">
        <span className={`${styles.orbit} ${styles.orbitOne}`} />
        <span className={`${styles.orbit} ${styles.orbitTwo}`} />
        <span className={styles.verificationGlow} />
      </div>

      <Container>
        <div className={styles.content}>
          <header className={styles.heading}>
            <PublicSectionEyebrow eyebrow={eyebrow} />

            <h2>{heading}</h2>

            {description && <p>{description}</p>}


          </header>

          <p aria-live="polite" className="sr-only">
            {isLoading
              ? "Loading Certifications and Achievements."
              : `${records.length} Certifications and Achievements loaded.`}
          </p>

          {records.length > 0 && (
            <div
              className={styles.filters}
              role="group"
              aria-label="Filter Certifications and Achievements"
            >
              {filterOptions.map((option) => {
                const isActive = option.value === activeType;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.filterButton} ${
                      isActive ? styles.filterButtonActive : ""
                    }`}
                    aria-pressed={isActive}
                    onClick={() => setActiveType(option.value)}
                  >
                    <span className={styles.filterIcon}>
                      {option.value === "all" ? (
                        <FilterIcon />
                      ) : (
                        <TypeIcon type={option.value} />
                      )}
                    </span>
                    <span>{option.label}</span>
                    <span className={styles.filterCount}>{option.count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div className={styles.notice}>
              <div>
                <strong>Credentials could not be loaded</strong>
                <p>{error}</p>
              </div>

              <button
                type="button"
                onClick={refreshCertificationAchievements}
                disabled={isLoading}
              >
                {isLoading ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}

          {isLoading && records.length === 0 && <LoadingPreview />}

          {!isLoading && !error && records.length === 0 && (
            <div className={styles.emptyState}>
              <span>
                <MedalIcon />
              </span>
              <strong>No public credentials available yet</strong>
              <p>
                Published certifications, licenses, awards and achievements
                will appear here automatically.
              </p>
            </div>
          )}

          {records.length > 0 && (
            <div
              className={`${styles.showcaseGrid} ${
                onePanelVisible ? styles.showcaseGridSingle : ""
              }`}
            >
              {showCredentialPanel && (
                <section className={styles.panel}>
                  <PanelHeading
                    icon={<TypeIcon type="certification" />}
                    title="Certificates"
                    count={credentialRecords.length}
                  />

                  {credentialRecords.length > 0 ? (
                    <div className={styles.credentialList}>
                      {credentialRecords.map((record) => (
                        <CredentialRow
                          key={
                            record._id ||
                            record.id ||
                            record.slug ||
                            `${record.type}-${record.title}`
                          }
                          record={record}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className={styles.panelEmpty}>
                      No {typeLabels[activeType] || "credential"} records are
                      published in this filter.
                    </div>
                  )}

                  {credentialRecords.length > 0 && shouldShowCta && (
                    <PublicCTAButton
                      url={ctaUrl}
                      label={credentialsCtaLabel}
                    />
                  )}
                </section>
              )}

              {showAchievementPanel && (
                <section className={styles.panel}>
                  <PanelHeading
                    icon={<MedalIcon />}
                    title="Achievements"
                    count={achievementPreviewRecords.length}
                  />

                  {achievementPreviewRecords.length > 0 ? (
                    <div className={styles.achievementGrid}>
                      {achievementPreviewRecords.map((record, index) => (
                        <AchievementTile
                          key={
                            record._id ||
                            record.id ||
                            record.slug ||
                            `${record.type}-${record.title}`
                          }
                          record={record}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className={styles.panelEmpty}>
                      No achievement records are published in this filter.
                    </div>
                  )}

                  {achievementPreviewRecords.length > 0 && shouldShowCta && (
                    <PublicCTAButton
                      url={ctaUrl}
                      label={ctaLabel}
                    />
                  )}
                </section>
              )}
            </div>
          )}

        </div>
      </Container>
    </Section>
  );
}

export default CertificationAchievementsSection;
