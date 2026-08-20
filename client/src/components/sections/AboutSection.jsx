import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import Button from "../ui/Button";

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
  const url = String(value || "").trim();

  if (!url) {
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

function getSocialProfiles(settings) {
  const platforms = Array.isArray(settings?.socialPlatforms)
    ? settings.socialPlatforms
    : [];

  return [...platforms]
    .filter((platform) => platform?.isVisible !== false)
    .sort(
      (firstPlatform, secondPlatform) =>
        Number(firstPlatform?.order || 0) -
        Number(secondPlatform?.order || 0),
    )
    .map((platform) => ({
      name: String(platform?.name || "").trim(),
      username: String(platform?.username || "").trim(),
      url: getSafeExternalUrl(platform?.url),
    }))
    .filter((platform) => platform.name && platform.url);
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

function SocialNetworkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.5-4.4M8.2 13.2l7.5 4.4" />
    </svg>
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
    () => getSocialProfiles(settings),
    [settings],
  );
  const workItems = useMemo(
    () => getVisibleWorkItems(about),
    [about],
  );

  const [identityIndex, setIdentityIndex] = useState(0);
  const [workIndex, setWorkIndex] = useState(0);
  const [isSocialOpen, setIsSocialOpen] = useState(false);

  const socialPopoverRef = useRef(null);

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

  useEffect(() => {
    if (!isSocialOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!socialPopoverRef.current?.contains(event.target)) {
        setIsSocialOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsSocialOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSocialOpen]);

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
                <p className="public-about-eyebrow">{aboutEyebrow}</p>
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

            {(activeWorkItem || socialProfiles.length > 0) && (
              <div className="public-about-shortcuts">
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

                {socialProfiles.length > 0 && (
                  <div
                    ref={socialPopoverRef}
                    className="public-about-social"
                  >
                    <button
                      type="button"
                      className="public-about-social-trigger"
                      aria-label={
                        isSocialOpen
                          ? "Hide social profiles"
                          : "Show social profiles"
                      }
                      aria-expanded={isSocialOpen}
                      aria-controls="about-social-profiles"
                      onClick={() =>
                        setIsSocialOpen((currentValue) => !currentValue)
                      }
                    >
                      <SocialNetworkIcon />
                    </button>

                    {isSocialOpen && (
                      <div
                        id="about-social-profiles"
                        className="public-about-social-popover"
                        aria-label="Social profiles"
                      >
                        {socialProfiles.map((platform, index) => (
                          <a
                            key={`${platform.name}-${platform.url}`}
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="public-about-social-link"
                            style={{
                              "--public-about-social-index": index,
                            }}
                          >
                            <span className="public-about-social-mark">
                              {getPlatformMark(platform.name)}
                            </span>

                            <span className="min-w-0">
                              <strong>{platform.name}</strong>

                              {platform.username && (
                                <small>{platform.username}</small>
                              )}
                            </span>

                            <span
                              className="public-about-social-arrow"
                              aria-hidden="true"
                            >
                              -&gt;
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
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
