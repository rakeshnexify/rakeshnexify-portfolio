import { useMemo, useState } from "react";
import { Link } from "react-router";

import Footer from "../components/layout/Footer";
import PublicPageCTA from "../components/layout/PublicPageCTA";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import Container from "../components/layout/Container";
import PageSeo from "../components/seo/PageSeo";
import useSiteSettings from "../hooks/useSiteSettings";
import useTeamMembers from "../hooks/useTeamMembers";
import { fetchPublicTeamMemberBySlug } from "../services/teamApi";
import styles from "./TeamPage.module.css";

const defaultPageContent = {
  eyebrow: "Meet the Team",
  heading: "The People Behind the Work",
  description:
    "Explore the professionals, expertise and collaboration behind RakeshNexify projects.",
};

const defaultTeamKeywords = [
  "RakeshNexify team",
  "web development team",
  "MERN development team",
  "full stack developers",
  "React developers",
  "Node.js developers",
  "MongoDB developers",
  "website designers",
  "software development team",
  "professional development team",
];

const SITE_URL = "https://rakeshnexify.com";

const availabilityLabels = {
  available: "Available",
  limited: "Limited",
  unavailable: "Unavailable",
  "on-leave": "On Leave",
};

const statusLabels = {
  active: "Active Member",
  inactive: "Inactive",
  former: "Former Member",
  archived: "Archived",
};

const socialPlatforms = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "github", label: "GitHub" },
  { key: "x", label: "X" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
];

function sortTeamMembers(firstMember, secondMember) {
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

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Team members could not be loaded.";
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

function getSafeExternalUrl(value) {
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

function getSafeEmail(value) {
  const email = String(value || "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "";
  }

  return email;
}

function getSafePhone(value) {
  const display = String(value || "").trim();

  if (!display) {
    return { display: "", href: "" };
  }

  const href = display.replace(/[^\d+]/g, "");

  return {
    display,
    href: /^\+?\d{6,15}$/.test(href) ? href : "",
  };
}

function getTextItems(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function getRelatedItems(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item) => item && typeof item === "object" && !Array.isArray(item),
  );
}

function AvailabilityDot({ status }) {
  return (
    <span
      className={`${styles.availabilityDot} ${
        styles[`availability_${status}`] || ""
      }`}
      aria-hidden="true"
    />
  );
}

function ChevronIcon() {
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

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6.5h16v11H4v-11Zm1 1 7 5 7-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M7.4 3.7 10 7.2 8.4 9c1.1 2.2 2.8 3.9 5 5l1.8-1.6 3.5 2.6-.7 3.4c-.2 1-1.1 1.7-2.1 1.6C9.2 19.3 4.7 14.8 4 8.1 3.9 7.1 4.6 6.2 5.6 6l1.8-.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="m9.5 14.5 5-5m-7.8 8.3-1.5 1.5a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 4.95 0m9.15-5.1 1.5-1.5a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-4.95 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7m-11 0h14a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm-2 5h18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7-1a3 3 0 1 0 0-6M2.5 20v-1.5A4.5 4.5 0 0 1 7 14h3a4.5 4.5 0 0 1 4.5 4.5V20m1-6h1.2a4.8 4.8 0 0 1 4.8 4.8V20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExternalLink({ href, children, className = "" }) {
  const safeHref = getSafeExternalUrl(href);

  if (!safeHref) {
    return null;
  }

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      <span className="sr-only"> opens in a new tab</span>
    </a>
  );
}

function ContactItem({ icon, label, children }) {
  if (!children) {
    return null;
  }

  return (
    <div className={styles.contactItem}>
      <span className={styles.contactIcon}>{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{children}</strong>
      </div>
    </div>
  );
}

function TagGroup({ title, items, tone = "blue" }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className={styles.tagGroup}>
      <h4>{title}</h4>
      <div className={styles.tagList}>
        {items.map((item, index) => (
          <span
            key={`${title}-${item}-${index}`}
            className={`${styles.tag} ${styles[`tag_${tone}`] || ""}`}
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function RelationSummary({ projects, companies, services }) {
  const stats = [
    { label: "Related Projects", value: projects.length },
    { label: "Companies", value: companies.length },
    { label: "Services", value: services.length },
  ].filter((item) => item.value > 0);

  if (!stats.length) {
    return null;
  }

  return (
    <div className={styles.relationStats}>
      {stats.map((item) => (
        <div key={item.label} className={styles.relationStat}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function RelatedNames({ title, items, nameKey }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className={styles.relatedNames}>
      <h4>{title}</h4>
      <div>
        {items.map((item, index) => {
          const label = String(item?.[nameKey] || "").trim();

          if (!label) {
            return null;
          }

          return (
            <span key={item._id || item.id || item.slug || `${label}-${index}`}>
              {label}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function TeamMemberExpandedContent({
  member,
  isLoading,
  error,
  onRetry,
}) {
  if (isLoading) {
    return (
      <div className={styles.expandedLoading} aria-live="polite">
        <div className={styles.loadingPortrait} />
        <div className={styles.loadingBody}>
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.expandedError}>
        <div>
          <strong>Full profile could not be loaded</strong>
          <p>{getErrorMessage(error)}</p>
        </div>
        <button type="button" onClick={onRetry}>
          Retry profile
        </button>
      </div>
    );
  }

  const name = String(member?.name || "").trim() || "Team Member";
  const role =
    String(member?.professionalRole || "").trim() || "Professional Team Member";
  const teamPosition = String(member?.teamPosition || "").trim();
  const shortIntroduction = String(member?.shortIntroduction || "").trim();
  const biography = String(member?.biography || "").trim();
  const profileImageUrl = String(member?.profileImageUrl || "").trim();
  const profileImageAlt =
    String(member?.profileImageAlt || "").trim() || `${name} profile photo`;
  const coverImageUrl = getSafeExternalUrl(member?.coverImageUrl);
  const availabilityStatus =
    String(member?.availabilityStatus || "available").trim() || "available";
  const availabilityLabel =
    availabilityLabels[availabilityStatus] || "Availability";
  const status = String(member?.status || "active").trim() || "active";
  const statusLabel = statusLabels[status] || "Team Member";
  const email = getSafeEmail(member?.email);
  const phone = getSafePhone(member?.phone);
  const portfolioUrl = getSafeExternalUrl(member?.portfolioUrl);
  const websiteUrl = getSafeExternalUrl(member?.websiteUrl);
  const skills = getTextItems(member?.skills);
  const tools = getTextItems(member?.tools);
  const projects = getRelatedItems(member?.relatedProjects);
  const companies = getRelatedItems(member?.relatedCompanies);
  const services = getRelatedItems(member?.relatedServices);

  const socialLinks =
    member?.socialLinks &&
    typeof member.socialLinks === "object" &&
    !Array.isArray(member.socialLinks)
      ? member.socialLinks
      : {};

  const availableSocialLinks = socialPlatforms
    .map((platform) => ({
      ...platform,
      url: getSafeExternalUrl(socialLinks[platform.key]),
    }))
    .filter((platform) => platform.url);

  return (
    <div className={styles.expandedContent}>
      {coverImageUrl && (
        <div className={styles.profileCover}>
          <img
            src={coverImageUrl}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.parentElement.hidden = true;
            }}
          />
          <span className={styles.profileCoverShade} aria-hidden="true" />
        </div>
      )}

      <aside className={styles.profileRail}>
        <div className={styles.largePortrait}>
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={profileImageAlt}
              className={styles.profilePortrait}
              loading="lazy"
            />
          ) : (
            <span className={styles.largeInitials}>{createInitials(name)}</span>
          )}

          <span
            className={`${styles.railAvailability} ${
              styles[`availability_${availabilityStatus}`] || ""
            }`}
          >
            <AvailabilityDot status={availabilityStatus} />
            {availabilityLabel}
          </span>
        </div>

        <div className={styles.contactStack}>
          {email && (
            <a href={`mailto:${email}`} className={styles.contactLink}>
              <ContactItem icon={<MailIcon />} label="Email">
                {email}
              </ContactItem>
            </a>
          )}

          {phone.display && (
            <>
              {phone.href ? (
                <a href={`tel:${phone.href}`} className={styles.contactLink}>
                  <ContactItem icon={<PhoneIcon />} label="Phone">
                    {phone.display}
                  </ContactItem>
                </a>
              ) : (
                <ContactItem icon={<PhoneIcon />} label="Phone">
                  {phone.display}
                </ContactItem>
              )}
            </>
          )}

          {portfolioUrl && (
            <ExternalLink href={portfolioUrl} className={styles.contactLink}>
              <ContactItem icon={<BriefcaseIcon />} label="Portfolio">
                Open Portfolio
              </ContactItem>
            </ExternalLink>
          )}

          {websiteUrl && (
            <ExternalLink href={websiteUrl} className={styles.contactLink}>
              <ContactItem icon={<LinkIcon />} label="Website">
                Visit Website
              </ContactItem>
            </ExternalLink>
          )}
        </div>

        {availableSocialLinks.length > 0 && (
          <div className={styles.socialBlock}>
            <span>Connect</span>
            <div>
              {availableSocialLinks.map((platform) => (
                <ExternalLink
                  key={platform.key}
                  href={platform.url}
                  className={styles.socialLink}
                >
                  {platform.label}
                </ExternalLink>
              ))}
            </div>
          </div>
        )}
      </aside>

      <div className={styles.profileBody}>
        <div className={styles.profileHeader}>
          <div>
            <h3>{name}</h3>
            <p>{role}</p>
            {teamPosition && <span>{teamPosition}</span>}
          </div>

          <div className={styles.profileFlags}>
            <span
              className={`${styles.statusBadge} ${
                styles[`status_${status}`] || ""
              }`}
            >
              {statusLabel}
            </span>

            {member?.isFeatured && (
              <span className={styles.featuredBadge}>★ Featured</span>
            )}
          </div>
        </div>

        {shortIntroduction && (
          <p className={styles.profileIntro}>{shortIntroduction}</p>
        )}

        <TagGroup title="Expertise" items={skills} tone="blue" />

        {biography && (
          <section className={styles.aboutBlock}>
            <h4>About</h4>
            <p>{biography}</p>
          </section>
        )}

        <TagGroup title="Tools & Technologies" items={tools} tone="violet" />

        <RelationSummary
          projects={projects}
          companies={companies}
          services={services}
        />

        {(projects.length > 0 ||
          companies.length > 0 ||
          services.length > 0) && (
          <div className={styles.relatedGrid}>
            <RelatedNames
              title="Related Projects"
              items={projects}
              nameKey="title"
            />
            <RelatedNames
              title="Companies"
              items={companies}
              nameKey="name"
            />
            <RelatedNames
              title="Supported Services"
              items={services}
              nameKey="title"
            />
          </div>
        )}

        <div className={styles.profileActions}>
          <Link to="/#contact" className={styles.primaryAction}>
            Discuss a Project
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ExpandableTeamMemberCard({ teamMember, index }) {
  const [fullMember, setFullMember] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const name = String(teamMember?.name || "").trim() || "Team Member";
  const role =
    String(teamMember?.professionalRole || "").trim() || "Professional Team Member";
  const slug = String(teamMember?.slug || "").trim();
  const imageUrl = String(teamMember?.profileImageUrl || "").trim();
  const imageAlt =
    String(teamMember?.profileImageAlt || "").trim() || `${name} profile photo`;
  const availabilityStatus =
    String(teamMember?.availabilityStatus || "available").trim() || "available";
  const availabilityLabel =
    availabilityLabels[availabilityStatus] || "Availability";

  async function loadFullProfile() {
    if (!slug || isProfileLoading) {
      return;
    }

    setIsProfileLoading(true);
    setProfileError("");

    try {
      const response = await fetchPublicTeamMemberBySlug(slug);
      setFullMember(response);
    } catch (requestError) {
      setProfileError(getErrorMessage(requestError));
    } finally {
      setIsProfileLoading(false);
    }
  }

  function handleToggle(event) {
    if (event.currentTarget.open && !fullMember && !profileError) {
      loadFullProfile();
    }
  }

  return (
    <details className={styles.memberDetails} onToggle={handleToggle}>
      <summary className={styles.memberSummary}>
        <div className={styles.summaryPortrait}>
          {imageUrl ? (
            <img src={imageUrl} alt={imageAlt} loading="lazy" />
          ) : (
            <span>{createInitials(name)}</span>
          )}
        </div>

        <div className={styles.summaryIdentity}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <h2>{name}</h2>
          <p>{role}</p>
        </div>

        <div className={styles.summaryActions}>
          <span
            className={`${styles.availabilityBadge} ${
              styles[`availability_${availabilityStatus}`] || ""
            }`}
          >
            <AvailabilityDot status={availabilityStatus} />
            {availabilityLabel}
          </span>

          {teamMember?.isFeatured && (
            <span className={styles.summaryFeatured}>★</span>
          )}

          <span className={styles.summaryChevron} aria-hidden="true">
            <ChevronIcon />
          </span>
        </div>

        <span className="sr-only">Open full details for {name}</span>
      </summary>

      <TeamMemberExpandedContent
        member={fullMember || teamMember}
        isLoading={isProfileLoading && !fullMember}
        error={profileError}
        onRetry={loadFullProfile}
      />
    </details>
  );
}

function TeamLoadingState() {
  return (
    <>
      <PublicPageHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className={styles.page}
      >
        <Container>
          <div className={styles.loadingPage}>
            <div className={styles.loadingHeading} />
            <div className={styles.loadingSubheading} />
            <div className={styles.loadingList}>
              {[1, 2, 3].map((item) => (
                <div key={item} className={styles.loadingRow} />
              ))}
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function TeamErrorState({ error, onRetry, isRetrying }) {
  return (
    <>
      <PublicPageHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className={styles.page}
      >
        <Container>
          <div className={styles.errorState}>
            <span>!</span>
            <strong>Team members could not be loaded</strong>
            <p>{getErrorMessage(error)}</p>
            <div>
              <button type="button" onClick={onRetry} disabled={isRetrying}>
                {isRetrying ? "Retrying..." : "Retry"}
              </button>
              <Link to="/">Return Home</Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function TeamPage() {
  const {
    teamMembers: loadedTeamMembers,
    isLoading,
    error,
    refreshTeamMembers,
  } = useTeamMembers();

  const { settings } = useSiteSettings();

  const brand = settings?.brand || {};
  const sectionContent = settings?.teamSection || {};
  const brandName = String(brand.name || "").trim() || "RakeshNexify";

  const eyebrow =
    String(sectionContent.eyebrow || "").trim() || defaultPageContent.eyebrow;

  const heading =
    String(sectionContent.heading || sectionContent.title || "").trim() ||
    defaultPageContent.heading;

  const description =
    String(sectionContent.description || "").trim() ||
    defaultPageContent.description;

  const seo =
    settings?.seo && typeof settings.seo === "object" ? settings.seo : {};

  const globalSeoKeywords = Array.isArray(seo.keywords)
    ? seo.keywords
    : String(seo.keywords || "")
        .split(/[,\n]/)
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  const seoKeywords = [...globalSeoKeywords, ...defaultTeamKeywords];

  const socialSharingImage = String(
    sectionContent.ogImageUrl || seo.ogImageUrl || "",
  ).trim();

  const seoTitle = `Team | ${brandName}`;

  const teamMembers = useMemo(() => {
    const sourceTeamMembers = Array.isArray(loadedTeamMembers)
      ? loadedTeamMembers
      : [];

    return [...sourceTeamMembers].sort(sortTeamMembers);
  }, [loadedTeamMembers]);

  const teamStructuredData = useMemo(() => {
    const itemListElements = teamMembers
      .map((teamMember, index) => {
        const memberName =
          String(teamMember?.name || "").trim() || "Team Member";

        return {
          "@type": "ListItem",
          position: index + 1,
          name: memberName,
        };
      })
      .filter(Boolean);

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seoTitle,
      headline: heading,
      description,
      url: `${SITE_URL}/team`,
      isPartOf: {
        "@type": "WebSite",
        name: brandName,
        url: `${SITE_URL}/`,
      },
      mainEntity: {
        "@type": "ItemList",
        name: `${brandName} Team Members`,
        numberOfItems: itemListElements.length,
        itemListElement: itemListElements,
      },
    };

    if (socialSharingImage) {
      structuredData.image = socialSharingImage.startsWith("/")
        ? `${SITE_URL}${socialSharingImage}`
        : socialSharingImage;
    }

    return structuredData;
  }, [
    brandName,
    description,
    heading,
    seoTitle,
    socialSharingImage,
    teamMembers,
  ]);

  if (isLoading && teamMembers.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/team"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
          structuredData={teamStructuredData}
        />
        <TeamLoadingState />
      </>
    );
  }

  if (error && teamMembers.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/team"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />
        <TeamErrorState
          error={error}
          onRetry={refreshTeamMembers}
          isRetrying={isLoading}
        />
      </>
    );
  }

  return (
    <>
      <PageSeo
        title={seoTitle}
        description={description}
        keywords={seoKeywords}
        canonicalPath="/team"
        image={socialSharingImage}
        type="website"
        brandName={brandName}
        structuredData={teamStructuredData}
      />

      <PublicPageHeader />

      <main id="main-content" tabIndex={-1} className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />

          <Container>
            <div className={styles.heroContent}>
              <span className={styles.heroIcon}>
                <TeamIcon />
              </span>

              <p className={styles.heroEyebrow}>{eyebrow}</p>

              <h1>{heading}</h1>

              {description && <p className={styles.heroDescription}>{description}</p>}

              <div className={styles.heroMeta}>
                <span>
                  {teamMembers.length}{" "}
                  {teamMembers.length === 1 ? "Team Member" : "Team Members"}
                </span>
                <Link to="/#contact">Discuss Your Project</Link>
              </div>
            </div>
          </Container>
        </section>

        <section className={styles.teamListSection}>
          <Container>
            {error && teamMembers.length > 0 && (
              <div className={styles.inlineNotice}>
                <div>
                  <strong>Saved Team information is being displayed</strong>
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

            {teamMembers.length > 0 ? (
              <div className={styles.teamList}>
                {teamMembers.map((teamMember, index) => (
                  <ExpandableTeamMemberCard
                    key={
                      teamMember._id ||
                      teamMember.id ||
                      teamMember.slug ||
                      `${teamMember.name}-${index}`
                    }
                    teamMember={teamMember}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <span>
                  <TeamIcon />
                </span>
                <strong>No public Team members available</strong>
                <p>
                  Team profiles will appear here after they are published.
                </p>
                <Link to="/#contact">Contact Me</Link>
              </div>
            )}
          </Container>
        </section>

        <PublicPageCTA ctaKey="team" />
      </main>

      <Footer />
    </>
  );
}

export default TeamPage;
