import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import Button from "../ui/Button";

import PublicSectionEyebrow from "../layout/PublicSectionEyebrow";
const IDENTITY_ROTATION_MS = 3000;
const WORK_ROTATION_MS = 2600;

function getOwnerInitials(name) {
  if (!name) {
    return "";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function getAboutParagraphs(about) {
  if (typeof about?.description !== "string" || !about.description.trim()) {
    return [];
  }

  return about.description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}


function getVisibleIdentityRoles(about) {
  if (!Array.isArray(about?.identityRoles)) {
    return [];
  }

  return [...about.identityRoles]
    .filter(
      (role) =>
        role?.isVisible !== false &&
        typeof role?.label === "string" &&
        role.label.trim(),
    )
    .sort(
      (firstRole, secondRole) =>
        Number(firstRole?.order || 0) - Number(secondRole?.order || 0),
    )
    .map((role) => role.label.trim());
}

function getIdentityArticle(role) {
  const firstCharacter = String(role || "")
    .trim()
    .charAt(0)
    .toLowerCase();

  return "aeiou".includes(firstCharacter) ? "an" : "a";
}

function getSafeExternalUrl(value) {
  const rawUrl = String(value || "").trim();

  if (!rawUrl) {
    return "";
  }

  const candidateUrl =
    /^[a-z][a-z0-9+.-]*:\/\//i.test(rawUrl) ||
    rawUrl.startsWith("/") ||
    rawUrl.startsWith("#")
      ? rawUrl
      : `https://${rawUrl}`;

  try {
    const parsedUrl = new URL(candidateUrl);

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

function getPlatformProfiles(settings, fieldName) {
  const platforms = Array.isArray(settings?.[fieldName])
    ? settings[fieldName]
    : [];
  const usedUrls = new Set();

  return [...platforms]
    .map((platform, index) => ({
      name: String(platform?.name || "").trim(),
      username: String(platform?.username || "").trim(),
      url: getSafeExternalUrl(platform?.url),
      iconUrl: getSafeExternalUrl(platform?.iconUrl),
      isVisible: platform?.isVisible !== false,
      order: Number(platform?.order || index + 1),
    }))
    .filter(
      (platform) =>
        platform.isVisible &&
        platform.name &&
        platform.url,
    )
    .sort(
      (firstPlatform, secondPlatform) =>
        firstPlatform.order - secondPlatform.order,
    )
    .filter((platform) => {
      const normalizedUrl = platform.url.toLowerCase();

      if (usedUrls.has(normalizedUrl)) {
        return false;
      }

      usedUrls.add(normalizedUrl);
      return true;
    })
    .map(({ name, username, url, iconUrl }) => ({
      name,
      username,
      url,
      iconUrl,
    }));
}

function getPlatformMark(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "->";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function getVisibleWorkItems(about) {
  if (!Array.isArray(about?.workItems)) {
    return [];
  }

  return [...about.workItems]
    .filter(
      (item) =>
        item?.isVisible !== false &&
        typeof item?.type === "string" &&
        item.type.trim() &&
        typeof item?.title === "string" &&
        item.title.trim() &&
        typeof item?.url === "string" &&
        item.url.trim(),
    )
    .sort(
      (firstItem, secondItem) =>
        Number(firstItem?.order || 0) -
        Number(secondItem?.order || 0),
    )
    .map((item, index) => ({
      id: `work-${index}-${item.title.trim()}`,
      type: item.type.trim(),
      title: item.title.trim(),
      url: item.url.trim(),
      openInNewTab: item.openInNewTab === true,
    }));
}

function isExternalWorkUrl(url) {
  return /^https?:\/\//i.test(String(url || "").trim());
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function syncPreference() {
      setPrefersReducedMotion(mediaQuery.matches);
    }

    syncPreference();
    mediaQuery.addEventListener?.("change", syncPreference);

    return () => {
      mediaQuery.removeEventListener?.("change", syncPreference);
    };
  }, []);

  return prefersReducedMotion;
}

function PlatformIconGrid({
  title,
  profiles,
  variant,
}) {
  if (!profiles.length) {
    return null;
  }

  return (
    <section
      className={`public-about-platform-group public-about-platform-group-${variant}`}
      aria-label={`${title} profiles`}
    >
      <div className="public-about-platform-group-header">
        <span>{title}</span>
        <span>{String(profiles.length).padStart(2, "0")}</span>
      </div>

      <div className="public-about-platform-grid">
        {profiles.map((platform, index) => (
          <a
            key={`${variant}-${platform.name}-${platform.url}`}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            className="public-about-platform-tile"
            style={{
              "--public-about-platform-index": index,
            }}
            aria-label={`Open ${platform.name}${platform.username ? ` ${platform.username}` : ""}`}
            title={
              platform.username
                ? `${platform.name} - ${platform.username}`
                : platform.name
            }
          >
            <span
              className={`public-about-platform-mark ${
                platform.iconUrl ? "public-about-platform-mark-media" : ""
              }`}
              aria-hidden="true"
            >
              {platform.iconUrl ? (
                <img
                  src={platform.iconUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="public-about-platform-icon"
                />
              ) : (
                getPlatformMark(platform.name)
              )}
            </span>

          </a>
        ))}
      </div>
    </section>
  );
}

function AboutWorkLink({
  item,
  className,
  children,
}) {
  if (isExternalWorkUrl(item.url)) {
    return (
      <a
        href={item.url}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={item.openInNewTab ? "noopener noreferrer" : undefined}
        className={className}
        aria-label={`Open ${item.type}: ${item.title}`}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      to={item.url}
      target={item.openInNewTab ? "_blank" : undefined}
      rel={item.openInNewTab ? "noopener noreferrer" : undefined}
      className={className}
      aria-label={`Open ${item.type}: ${item.title}`}
    >
      {children}
    </Link>
  );
}

function AboutSection() {
  const { settings } = useSiteSettings();
  const prefersReducedMotion = usePrefersReducedMotion();

  const about = useMemo(
    () => settings?.about || {},
    [settings?.about],
  );
  const owner = settings?.owner || {};
  const contact = settings?.contact || {};

  const ownerName = String(owner.name || "").trim();
  const professionalTitle = String(owner.professionalTitle || "").trim();
  const location = String(owner.location || "").trim();
  const availability = String(contact.availability || "").trim();

  const profileImageUrl = String(owner.profileImageUrl || "").trim();
  const resumeUrl = String(owner.resumeUrl || "").trim();

  const aboutHeading = String(about.heading || about.title || "").trim();
  const aboutEyebrow = String(about.eyebrow || "").trim();

  const paragraphs = getAboutParagraphs(about);
  const identityRoles = useMemo(
    () => getVisibleIdentityRoles(about),
    [about],
  );
  const socialProfiles = useMemo(
    () => getPlatformProfiles(settings, "socialPlatforms"),
    [settings],
  );
  const freelancerProfiles = useMemo(
    () => getPlatformProfiles(settings, "freelancerPlatforms"),
    [settings],
  );
  const workItems = useMemo(
    () => getVisibleWorkItems(about),
    [about],
  );

  const [identityIndex, setIdentityIndex] = useState(0);
  const [workIndex, setWorkIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion || identityRoles.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setIdentityIndex(
        (currentIndex) => (currentIndex + 1) % identityRoles.length,
      );
    }, IDENTITY_ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, [identityRoles, prefersReducedMotion]);


  useEffect(() => {
    if (prefersReducedMotion || workItems.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setWorkIndex(
        (currentIndex) => (currentIndex + 1) % workItems.length,
      );
    }, WORK_ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, [prefersReducedMotion, workItems]);


  function openResume() {
    if (!resumeUrl) {
      return;
    }

    window.open(resumeUrl, "_blank", "noopener,noreferrer");
  }

  const safeIdentityIndex =
    identityRoles.length > 0
      ? identityIndex % identityRoles.length
      : 0;
  const safeWorkIndex =
    workItems.length > 0
      ? workIndex % workItems.length
      : 0;

  const activeIdentity = identityRoles[safeIdentityIndex] || "";
  const activeWorkItem = workItems[safeWorkIndex] || null;
  const activeWorkTone = (safeWorkIndex % 5) + 1;

  return (
    <Section
      id="about"
      className="public-about-section scroll-mt-20"
    >
      <div className="public-about-backdrop" aria-hidden="true">
        <div className="public-about-grid" />
        <div className="public-about-code-orbit public-about-code-orbit-one" />
        <div className="public-about-code-orbit public-about-code-orbit-two" />

        <div className="public-about-tech-rail public-about-tech-rail-left">
          <span>{"</>"}</span>
          <span>{"{ }"}</span>
          <span>API</span>
        </div>

        <div className="public-about-tech-rail public-about-tech-rail-right">
          <span>01</span>
          <span>DB</span>
          <span>npm</span>
        </div>
      </div>

      <Container className="relative z-10">
        <div className="public-about-layout">
          <div className="public-about-profile-column">
            <div className="public-about-profile-shell">
              <div className="public-about-codebar" aria-hidden="true">
                <span className="public-about-codebar-dots">
                  <i />
                  <i />
                  <i />
                </span>

                <span>profile.tsx</span>
              </div>

              <div className="public-about-profile-media">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={ownerName}
                    className="public-about-profile-image"
                    loading="lazy"
                  />
                ) : (
                  <div className="public-about-profile-fallback">
                    <div className="public-about-profile-initials">
                      {getOwnerInitials(ownerName)}
                    </div>

                    {ownerName && <p>{ownerName}</p>}
                  </div>
                )}

                <div className="public-about-profile-scan" aria-hidden="true" />
                <div className="public-about-profile-circuit" aria-hidden="true" />
              </div>

              <div className="public-about-profile-details">
                {(ownerName || professionalTitle) && (
                  <div className="public-about-profile-identity">
                    <div>
                      {ownerName && (
                        <p className="public-about-owner-name">{ownerName}</p>
                      )}

                      {professionalTitle && (
                        <p className="public-about-owner-role">
                          {professionalTitle}
                        </p>
                      )}
                    </div>

                    <span className="public-about-status-dot" aria-hidden="true" />
                  </div>
                )}

                {(location || availability) && (
                  <div className="public-about-meta-grid">
                    {location && (
                      <div className="public-about-meta-card">
                        <span>Location</span>
                        <strong>{location}</strong>
                      </div>
                    )}

                    {availability && (
                      <div className="public-about-meta-card">
                        <span>Availability</span>
                        <strong className="public-about-availability">
                          {availability}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="public-about-copy">
            <div className="public-about-heading-block">
              {aboutEyebrow && (
                <PublicSectionEyebrow eyebrow={aboutEyebrow} />
              )}

              {aboutHeading && (
                <h2 className="public-about-heading">{aboutHeading}</h2>
              )}

              {activeIdentity && (
                <div
                  className="public-about-identity-rotator"
                  aria-live="polite"
                >
                  <span className="public-about-identity-prefix">I am</span>

                  <span
                    key={`${activeIdentity}-${safeIdentityIndex}`}
                    className="public-about-identity-value"
                  >
                    {getIdentityArticle(activeIdentity)} {activeIdentity}
                  </span>

                </div>
              )}
            </div>

            {paragraphs.length > 0 && (
              <div className="public-about-paragraphs">
                {paragraphs.map((paragraph, index) => (
                  <p key={`${paragraph}-${index}`}>{paragraph}</p>
                ))}
              </div>
            )}

            {(
              activeWorkItem ||
              socialProfiles.length > 0 ||
              freelancerProfiles.length > 0
            ) && (
              <div className="public-about-work-stack">
                {activeWorkItem && (
                  <AboutWorkLink
                    item={activeWorkItem}
                    className={`public-about-work-rotator public-about-work-tone-${activeWorkTone}`}
                  >
                    <div
                      key={`${activeWorkItem.id}-${safeWorkIndex}`}
                      className="public-about-work-content"
                      aria-live="polite"
                    >
                      <div className="public-about-work-type">
                        <span>{activeWorkItem.type}</span>
                        <span>
                          {String(safeWorkIndex + 1).padStart(2, "0")}
                          /
                          {String(workItems.length).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="public-about-work-title-row">
                        <h3>{activeWorkItem.title}</h3>

                        <span
                          className="public-about-work-arrow"
                          aria-hidden="true"
                        >
                          -&gt;
                        </span>
                      </div>
                    </div>

                    <div className="public-about-work-track" aria-hidden="true">
                      <span
                        key={`${activeWorkItem.id}-${safeWorkIndex}-track`}
                      />
                    </div>
                  </AboutWorkLink>
                )}

                {(socialProfiles.length > 0 ||
                  freelancerProfiles.length > 0) && (
                  <div className="public-about-platform-groups">
                    <PlatformIconGrid
                      title="Social Media"
                      profiles={socialProfiles}
                      variant="social"
                    />

                    <PlatformIconGrid
                      title="Freelancing"
                      profiles={freelancerProfiles}
                      variant="freelance"
                    />
                  </div>
                )}
              </div>
            )}

            {resumeUrl && (
              <div className="public-about-resume">
                <Button variant="outline" size="large" onClick={openResume}>
                  View Resume
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default AboutSection;
