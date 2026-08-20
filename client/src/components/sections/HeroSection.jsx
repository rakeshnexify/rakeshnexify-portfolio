import usePublicTheme from "../../hooks/usePublicTheme";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import NewsletterSignupForm from "../newsletter/NewsletterSignupForm";
import Section from "../layout/Section";

const technologyItems = [
  {
    label: "MERN Stack",
    icon: "database",
  },
  {
    label: "WordPress",
    icon: "wordpress",
  },
  {
    label: "E-commerce",
    icon: "commerce",
  },
  {
    label: "Web Applications",
    icon: "code",
  },
];

function TechnologyIcon({ type }) {
  if (type === "commerce") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 5h2l2 10h10l2-7H6" />
        <circle cx="9" cy="19" r="1.25" />
        <circle cx="17" cy="19" r="1.25" />
      </svg>
    );
  }

  if (type === "code") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
      </svg>
    );
  }

  if (type === "wordpress") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="m7.5 8.5 3.2 8 1.9-5 2 5 2.9-8" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </svg>
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

            <div className="public-hero-technologies" aria-label="Technology focus">
              {technologyItems.map((item, index) => (
                <div className="contents" key={item.label}>
                  {index > 0 && (
                    <span className="public-hero-tech-separator" aria-hidden="true">
                      •
                    </span>
                  )}

                  <span className="public-hero-tech-chip">
                    <span className="public-hero-tech-icon">
                      <TechnologyIcon type={item.icon} />
                    </span>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default HeroSection;
