import { Link } from "react-router";

import usePublicTheme from "../../hooks/usePublicTheme";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import NewsletterSignupForm from "../newsletter/NewsletterSignupForm";
import Section from "../layout/Section";

function getVisibleHeroQuickLinks(hero) {
  if (!Array.isArray(hero?.quickLinks)) {
    return [];
  }

  return [...hero.quickLinks]
    .filter(
      (item) =>
        item?.isVisible !== false &&
        typeof item?.label === "string" &&
        item.label.trim() &&
        typeof item?.url === "string" &&
        item.url.trim(),
    )
    .sort(
      (firstItem, secondItem) =>
        Number(firstItem?.order || 0) -
        Number(secondItem?.order || 0),
    )
    .map((item) => ({
      label: item.label.trim(),
      url: item.url.trim(),
      iconUrl:
        typeof item.iconUrl === "string"
          ? item.iconUrl.trim()
          : "",
      openInNewTab: item.openInNewTab === true,
    }));
}

function isExternalHeroQuickLink(url) {
  return /^https?:\/\//i.test(String(url || "").trim());
}

function HeroQuickLink({
  item,
  children,
}) {
  const commonProps = {
    className: "public-hero-tech-chip",
    target: item.openInNewTab ? "_blank" : undefined,
    rel: item.openInNewTab ? "noopener noreferrer" : undefined,
  };

  if (isExternalHeroQuickLink(item.url) || item.url.startsWith("#")) {
    return (
      <a href={item.url} {...commonProps}>
        {children}
      </a>
    );
  }

  return (
    <Link to={item.url} {...commonProps}>
      {children}
    </Link>
  );
}

function renderHeroHeading(value) {
  const normalized = String(value || "").trim();
  const lastSpaceIndex = normalized.lastIndexOf(" ");

  if (lastSpaceIndex <= 0) {
    return normalized;
  }

  return (
    <>
      {normalized.slice(0, lastSpaceIndex)}{" "}
      <span className="public-hero-heading-accent">
        {normalized.slice(lastSpaceIndex + 1)}
      </span>
    </>
  );
}

function HeroSection() {
  const { settings } = useSiteSettings();
  const { isDark } = usePublicTheme();

  const hero = settings?.hero || {};
  const owner = settings?.owner || {};

  const eyebrow =
    hero.eyebrow || owner.professionalTitle || "MERN Stack Developer";

  const heading =
    hero.heading ||
    hero.title ||
    "I build modern digital experiences that help businesses grow.";

  const description =
    hero.description ||
    "I create responsive websites, MERN applications, e-commerce platforms and scalable digital solutions.";

  const coverImageUrl = String(hero.coverImageUrl || "").trim();
  const quickLinks = getVisibleHeroQuickLinks(hero);

  return (
    <Section id="home" className="public-hero-section scroll-mt-20">
      <Container>
        <div className="public-hero-shell">
          <div className="public-hero-cover" aria-hidden="true">
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt=""
                className="public-hero-cover-image"
                fetchPriority="high"
                decoding="async"
              />
            )}

            <div className="public-hero-cover-grid" />
            <div className="public-hero-cover-circuit public-hero-cover-circuit-a" />
            <div className="public-hero-cover-circuit public-hero-cover-circuit-b" />
            <div className="public-hero-cover-orbit" />

            <span className="public-hero-node public-hero-node-a" />
            <span className="public-hero-node public-hero-node-b" />
            <span className="public-hero-node public-hero-node-c" />
            <span className="public-hero-node public-hero-node-d" />
          </div>

          <div className="public-hero-body">
            <div className="public-hero-identity">
              {owner.profileImageUrl && (
                <div className="public-hero-profile-ring">
                  <img
                    src={owner.profileImageUrl}
                    alt={owner.name || "Portfolio owner"}
                    className="public-hero-profile-image"
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>
              )}
            </div>

            <p className="public-hero-eyebrow">{eyebrow}</p>

            <h1 className="public-hero-heading">{renderHeroHeading(heading)}</h1>

            <p className="public-hero-description">{description}</p>

            <div className="public-hero-newsletter">
              <NewsletterSignupForm
                variant={isDark ? "dark" : "light"}
                consentMode="implicit"
              />
            </div>

            {quickLinks.length > 0 && (
              <div
                className="public-hero-technologies"
                aria-label="Hero quick links"
              >
                {quickLinks.map((item, index) => (
                  <div
                    className="contents"
                    key={`${item.label}-${item.url}`}
                  >
                    {index > 0 && (
                      <span
                        className="public-hero-tech-separator"
                        aria-hidden="true"
                      >
                        •
                      </span>
                    )}

                    <HeroQuickLink item={item}>
                      {item.iconUrl && (
                        <span
                          className="public-hero-tech-icon"
                          aria-hidden="true"
                        >
                          <img
                            src={item.iconUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="public-hero-tech-image"
                          />
                        </span>
                      )}

                      <span>{item.label}</span>
                    </HeroQuickLink>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default HeroSection;
