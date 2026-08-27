import { useMemo } from "react";
import useSiteSettings from "../../hooks/useSiteSettings";
import useTeamMembers from "../../hooks/useTeamMembers";
import Container from "../layout/Container";
import Section from "../layout/Section";
import styles from "./TeamSection.module.css";

import PublicSectionEyebrow from "../layout/PublicSectionEyebrow";
import PublicCTAButton from "../layout/PublicCTAButton";
const HOME_TEAM_LIMIT = 5;
const COMPANY_TEAM_URL = "https://idomere.com/team";

const accentClasses = [
  styles.accentBlue,
  styles.accentViolet,
  styles.accentGreen,
  styles.accentAmber,
];

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

function getSafePublicUrl(value, fallbackUrl = "/team") {
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

function sortTeamMembersForPreview(firstMember, secondMember) {
  const firstFeatured = Boolean(
    firstMember?.isFeatured ?? firstMember?.featured,
  );
  const secondFeatured = Boolean(
    secondMember?.isFeatured ?? secondMember?.featured,
  );

  const featuredDifference = Number(secondFeatured) - Number(firstFeatured);

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  const orderDifference =
    Number(firstMember?.order || 0) - Number(secondMember?.order || 0);

  if (orderDifference !== 0) {
    return orderDifference;
  }

  return String(firstMember?.name || "").localeCompare(
    String(secondMember?.name || ""),
  );
}

function createInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "TM";
}

function TeamIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7-1a3 3 0 1 0 0-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M2.5 20v-1.5A4.5 4.5 0 0 1 7 14h3a4.5 4.5 0 0 1 4.5 4.5V20m1-6h1.2a4.8 4.8 0 0 1 4.8 4.8V20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HomeTeamCard({ member, index }) {
  const name = String(member?.name || "").trim() || "Team Member";
  const role =
    String(member?.professionalRole || "").trim() || "Professional Team Member";
  const imageUrl = String(member?.profileImageUrl || "").trim();
  const imageAlt =
    String(member?.profileImageAlt || "").trim() || `${name} profile photo`;
  const accentClass = accentClasses[index % accentClasses.length];

  return (
    <article className={styles.memberCard}>
      <div className={styles.memberPhoto}>
        {imageUrl ? (
          <img src={imageUrl} alt={imageAlt} loading="lazy" />
        ) : (
          <span className={styles.memberInitials}>{createInitials(name)}</span>
        )}
      </div>

      <div className={styles.memberIdentity}>
        <span className={`${styles.memberAccent} ${accentClass}`} />
        <h3>{name}</h3>
        <p>{role}</p>
      </div>
    </article>
  );
}

function TeamSection() {
  const {
    teamMembers: loadedTeamMembers,
    isLoading,
    error,
    refreshTeamMembers,
  } = useTeamMembers();

  const { settings } = useSiteSettings();
  const sectionContent = settings?.teamSection || {};

  const eyebrow =
    String(sectionContent.eyebrow || "").trim();

  const heading =
    String(sectionContent.heading || "").trim();

  const description =
    String(sectionContent.description || "").trim();

  const ctaButton = sectionContent.ctaButton || sectionContent.action || {};

  const ctaLabel =
    String(ctaButton.label || "").trim();

  const configuredCtaUrl = getSafePublicUrl(
    ctaButton.url || ctaButton.href,
    COMPANY_TEAM_URL,
  );

  const ctaUrl =
    configuredCtaUrl === "/team"
      ? COMPANY_TEAM_URL
      : configuredCtaUrl;

  const teamMembers = useMemo(() => {
    const sourceTeamMembers = Array.isArray(loadedTeamMembers)
      ? loadedTeamMembers
      : [];

    return [...sourceTeamMembers].sort(sortTeamMembersForPreview);
  }, [loadedTeamMembers]);

  const previewTeamMembers = teamMembers.slice(0, HOME_TEAM_LIMIT);

  return (
    <Section id="team" className={`${styles.section} scroll-mt-20`}>
      <div className={styles.backdrop} aria-hidden="true">
        <span className={styles.softShapeOne} />
        <span className={styles.softShapeTwo} />
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
              ? "Loading Team members."
              : `${teamMembers.length} Team members loaded.`}
          </p>

          {error && (
            <div className={styles.notice}>
              <div>
                <strong>Saved team information is being displayed</strong>
                <p>The live Team API could not be reached.</p>
              </div>

              <button
                type="button"
                onClick={refreshTeamMembers}
                disabled={isLoading}
              >
                {isLoading ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}

          {isLoading && teamMembers.length === 0 && (
            <div className={styles.memberGrid} aria-hidden="true">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className={styles.skeletonCard} />
              ))}
            </div>
          )}

          {!isLoading && teamMembers.length === 0 && (
            <div className={styles.emptyState}>
              <span>
                <TeamIcon />
              </span>
              <strong>No public Team members available</strong>
              <p>Published Team profiles will appear here automatically.</p>
            </div>
          )}

          {previewTeamMembers.length > 0 && (
            <div className={`${styles.memberGrid} rnx-auto-center-team`}>
              {previewTeamMembers.map((member, index) => (
                <HomeTeamCard
                  key={
                    member._id ||
                    member.id ||
                    member.slug ||
                    `${member.name}-${index}`
                  }
                  member={member}
                  index={index}
                />
              ))}
            </div>
          )}

          {previewTeamMembers.length > 0 && (
            <div className={styles.footerAction}>
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

export default TeamSection;
