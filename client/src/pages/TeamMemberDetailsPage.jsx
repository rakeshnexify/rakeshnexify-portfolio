import { Link, useParams } from "react-router";

import CompanyCard from "../components/companies/CompanyCard";
import Container from "../components/layout/Container";
import PublicPageCTA from "../components/layout/PublicPageCTA";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import ProjectCard from "../components/projects/ProjectCard";
import PageSeo from "../components/seo/PageSeo";
import ServiceCard from "../components/services/ServiceCard";
import useSiteSettings from "../hooks/useSiteSettings";
import useTeamMember from "../hooks/useTeamMember";

const availabilityLabels = {
  available: "Available",
  limited: "Limited Availability",
  unavailable: "Unavailable",
  "on-leave": "On Leave",
};

const availabilityClasses = {
  available: "bg-emerald-100 text-emerald-700",
  limited: "bg-amber-100 text-amber-700",
  unavailable: "bg-slate-200 text-slate-700",
  "on-leave": "bg-violet-100 text-violet-700",
};

const statusLabels = {
  active: "Active Member",
  inactive: "Inactive",
  former: "Former Member",
  archived: "Archived",
};

const statusClasses = {
  active: "bg-blue-100 text-blue-700",
  inactive: "bg-slate-200 text-slate-700",
  former: "bg-amber-100 text-amber-700",
  archived: "bg-red-100 text-red-700",
};

const socialPlatforms = [
  { key: "github", label: "GitHub" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "x", label: "X" },
];

const defaultTeamMemberSeo = {
  description:
    "Explore this professional Team member profile, including skills, tools, responsibilities, related projects, companies, services and contact links.",
  keywords: [
    "Team member profile",
    "web developer profile",
    "MERN developer",
    "WordPress developer",
    "full stack developer",
    "React developer",
    "Node.js developer",
    "MongoDB developer",
    "software development Team",
    "web development professional",
  ],
};

const SITE_URL = "https://rakeshnexify.com";

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

function getSafePublicUrl(value) {
  const url = String(value || "").trim();

  if (!url || containsControlCharacters(url)) {
    return "";
  }

  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      parsedUrl.hostname &&
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

function getSafeHttpUrl(value) {
  const safeUrl = getSafePublicUrl(value);

  if (safeUrl.startsWith("http://") || safeUrl.startsWith("https://")) {
    return safeUrl;
  }

  return "";
}

function getSafeMediaUrl(value) {
  return getSafePublicUrl(value);
}

function getSafeEmail(value) {
  const email = String(value || "").trim();

  if (!email || containsControlCharacters(email) || email.length > 254) {
    return "";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(email) ? email : "";
}

function getSafePhone(value) {
  const phone = String(value || "").trim();

  if (!phone || containsControlCharacters(phone)) {
    return { display: "", href: "" };
  }

  const phoneHref = phone.replace(/[^\d+]/g, "");
  const isValidPhone = /^\+?\d{6,15}$/.test(phoneHref);

  return {
    display: phone,
    href: isValidPhone ? phoneHref : "",
  };
}

function getTextItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      if (typeof item !== "string" && typeof item !== "number") {
        return "";
      }

      return String(item).trim();
    })
    .filter(Boolean);
}

function getKeywordItems(value) {
  const sourceItems = Array.isArray(value)
    ? value
    : String(value || "").split(/[,\n]/);

  return sourceItems.map((item) => String(item || "").trim()).filter(Boolean);
}

function getRelatedRecords(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item) => item && typeof item === "object" && !Array.isArray(item),
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

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Team member could not be loaded.";
}

function TeamMemberLink({ href, children, variant = "primary" }) {
  const safeHref = getSafePublicUrl(href);

  if (!safeHref) {
    return null;
  }

  const baseClasses =
    "inline-flex min-h-11 max-w-full items-center justify-center rounded-xl px-5 py-2.5 text-center text-sm font-semibold transition";

  const variantClasses = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",

    secondary: "bg-slate-950 text-white hover:bg-slate-800",

    outline:
      "border border-slate-300 bg-white text-slate-700 hover:border-brand-600 hover:text-brand-600",

    heroOutline:
      "border border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/15",
  };

  const className = `${baseClasses} ${
    variantClasses[variant] || variantClasses.primary
  }`;

  const isExternalLink =
    safeHref.startsWith("http://") || safeHref.startsWith("https://");

  if (!isExternalLink) {
    return (
      <Link to={safeHref} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      <span aria-hidden="true" className="ml-2">
        ↗
      </span>
      <span className="sr-only"> opens in a new tab</span>
    </a>
  );
}

function InformationItem({ label, children }) {
  if (children === undefined || children === null || children === "") {
    return null;
  }

  return (
    <div className="py-4 first:pt-0">
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-semibold leading-6 text-slate-700">
        {children}
      </dd>
    </div>
  );
}

function TagSection({ title, items = [], variant = "default" }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const tagClasses =
    variant === "brand"
      ? "bg-brand-50 text-brand-700"
      : "border border-slate-200 bg-slate-50 text-slate-600";

  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="break-words text-2xl font-bold tracking-tight text-slate-950">
        {title}
      </h2>
      <div className="mt-6 flex min-w-0 flex-wrap gap-3">
        {items.map((item, index) => (
          <span
            key={`${title}-${item}-${index}`}
            className={`max-w-full break-words rounded-xl px-4 py-2 text-sm font-semibold ${tagClasses}`}
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function RelatedSection({ eyebrow, title, children }) {
  return (
    <section className="min-w-0">
      <div className="mb-6 min-w-0">
        <p className="break-words text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
          {eyebrow}
        </p>
        <h2 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function TeamMemberLoadingState() {
  return (
    <>
      <PublicPageHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <Container>
          <div className="py-16 sm:py-20">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-6 h-14 max-w-3xl animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-5 h-24 max-w-2xl animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-10 h-96 animate-pulse rounded-3xl bg-slate-200" />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function TeamMemberErrorState({ error, status, onRetry, isRetrying }) {
  const isNotFound = status === 404;

  return (
    <>
      <PublicPageHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[calc(100vh-5rem)] overflow-x-hidden place-items-center bg-slate-50 px-4 py-12"
      >
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
            !
          </div>
          <p className="mt-6 break-words text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            {isNotFound ? "Team Member Not Found" : "Team Member Error"}
          </p>
          <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
            {isNotFound
              ? "This Team member is unavailable"
              : "Team member could not be loaded"}
          </h1>
          <p className="mt-4 break-words leading-7 text-slate-600">
            {isNotFound
              ? "The Team member may be hidden, deleted or the profile URL may be incorrect."
              : getErrorMessage(error)}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            {!isNotFound && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isRetrying ? "Retrying..." : "Retry"}
              </button>
            )}
            <Link
              to="/team"
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-center text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
            >
              View All Team Members
            </Link>
            <Link
              to="/#contact"
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-brand-600 bg-white px-5 text-center text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              Contact Me
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function TeamMemberDetailsPage() {
  const { slug } = useParams();
  const { teamMember, isLoading, error, status, refreshTeamMember } =
    useTeamMember(slug);
  const { settings } = useSiteSettings();

  const brandName =
    String(settings?.brand?.name || "").trim() || "RakeshNexify";
  const memberName = String(teamMember?.name || "").trim() || "Team Member";
  const professionalRole =
    String(teamMember?.professionalRole || "").trim() ||
    "Professional Team Member";
  const globalSeo =
    settings?.seo && typeof settings.seo === "object" ? settings.seo : {};
  const memberSeo =
    teamMember?.seo && typeof teamMember.seo === "object" ? teamMember.seo : {};
  const safeSlug = String(slug || "").trim();
  const canonicalPath = safeSlug
    ? `/team/${encodeURIComponent(safeSlug)}`
    : "/team";
  const globalSeoKeywords = getKeywordItems(globalSeo.keywords);
  const memberSeoKeywords = getKeywordItems(memberSeo.keywords);
  const memberSkills = getTextItems(teamMember?.skills);
  const memberTools = getTextItems(teamMember?.tools);
  const seoTitle =
    String(memberSeo.title || "").trim() ||
    (teamMember?.name
      ? `${memberName} | ${professionalRole} | ${brandName}`
      : `Team Member | ${brandName}`);
  const seoDescription =
    String(
      memberSeo.description ||
        teamMember?.shortIntroduction ||
        teamMember?.biography ||
        "",
    ).trim() || defaultTeamMemberSeo.description;
  const seoKeywords = [
    ...globalSeoKeywords,
    ...memberSeoKeywords,
    ...memberSkills,
    ...memberTools,
    professionalRole,
    teamMember?.teamPosition,
    teamMember?.name ? `${memberName} Team member` : "",
    ...defaultTeamMemberSeo.keywords,
  ].filter(Boolean);
  const socialSharingImage =
    getSafeMediaUrl(memberSeo.ogImageUrl) ||
    getSafeMediaUrl(teamMember?.coverImageUrl) ||
    getSafeMediaUrl(teamMember?.profileImageUrl) ||
    getSafeMediaUrl(globalSeo.ogImageUrl);

  if (isLoading && !teamMember) {
    return (
      <>
        <PageSeo
          title={`Team Member | ${brandName}`}
          description={defaultTeamMemberSeo.description}
          keywords={[...globalSeoKeywords, ...defaultTeamMemberSeo.keywords]}
          canonicalPath={canonicalPath}
          image={getSafeMediaUrl(globalSeo.ogImageUrl)}
          type="website"
          brandName={brandName}
        />
        <TeamMemberLoadingState />
      </>
    );
  }

  if (error || !teamMember) {
    const isNotFound = status === 404;

    return (
      <>
        <PageSeo
          title={
            isNotFound
              ? `Team Member Not Found | ${brandName}`
              : `Team Member Error | ${brandName}`
          }
          description={
            isNotFound
              ? "The requested Team member is unavailable, hidden, deleted or the profile URL is incorrect."
              : "The requested Team member could not be loaded at this time."
          }
          keywords={[...globalSeoKeywords, ...defaultTeamMemberSeo.keywords]}
          canonicalPath={canonicalPath}
          image={getSafeMediaUrl(globalSeo.ogImageUrl)}
          type="website"
          noIndex={isNotFound}
          brandName={brandName}
        />
        <TeamMemberErrorState
          error={error}
          status={status}
          onRetry={refreshTeamMember}
          isRetrying={isLoading}
        />
      </>
    );
  }

  const skills = memberSkills;
  const tools = memberTools;
  const relatedProjects = getRelatedRecords(teamMember.relatedProjects);
  const relatedCompanies = getRelatedRecords(teamMember.relatedCompanies);
  const relatedServices = getRelatedRecords(teamMember.relatedServices);
  const socialLinks =
    teamMember.socialLinks && typeof teamMember.socialLinks === "object"
      ? teamMember.socialLinks
      : {};
  const availableSocialLinks = socialPlatforms
    .map((platform) => ({
      ...platform,
      url: getSafeHttpUrl(socialLinks[platform.key]),
    }))
    .filter((platform) => platform.url);
  const email = getSafeEmail(teamMember.email);
  const phone = getSafePhone(teamMember.phone);
  const websiteUrl = getSafeHttpUrl(teamMember.websiteUrl);
  const portfolioUrl = getSafeHttpUrl(teamMember.portfolioUrl);
  const coverImageUrl = getSafeMediaUrl(teamMember.coverImageUrl);
  const profileImageUrl = getSafeMediaUrl(teamMember.profileImageUrl);
  const profileImageAlt =
    String(teamMember.profileImageAlt || "").trim() ||
    `${memberName} profile photo`;
  const availabilityLabel =
    availabilityLabels[teamMember.availabilityStatus] ||
    String(teamMember.availabilityStatus || "").trim() ||
    "Availability Unknown";
  const statusLabel =
    statusLabels[teamMember.status] ||
    String(teamMember.status || "").trim() ||
    "Team Member";
  const biography = String(teamMember.biography || "").trim();
  const shortIntroduction = String(teamMember.shortIntroduction || "").trim();

  const profilePageUrl = `${SITE_URL}${canonicalPath}`;

  const absoluteProfileImageUrl = profileImageUrl.startsWith("/")
    ? `${SITE_URL}${profileImageUrl}`
    : profileImageUrl;

  const sameAsUrls = [
    portfolioUrl,
    websiteUrl,
    ...availableSocialLinks.map((platform) => platform.url),
  ]
    .map((url) => String(url || "").trim())
    .filter(Boolean);

  const uniqueSameAsUrls = [...new Set(sameAsUrls)];

  const knowledgeItems = [...skills, ...tools]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  const uniqueKnowledgeItems = [...new Set(knowledgeItems)];

  const personStructuredData = {
    "@type": "Person",
    name: memberName,
    jobTitle: professionalRole,
    description: seoDescription,
    url: profilePageUrl,
    mainEntityOfPage: profilePageUrl,
    affiliation: {
      "@type": "Organization",
      name: brandName,
      url: `${SITE_URL}/`,
    },
  };

  if (absoluteProfileImageUrl) {
    personStructuredData.image = absoluteProfileImageUrl;
  }

  if (uniqueSameAsUrls.length > 0) {
    personStructuredData.sameAs = uniqueSameAsUrls;
  }

  if (uniqueKnowledgeItems.length > 0) {
    personStructuredData.knowsAbout = uniqueKnowledgeItems;
  }

  if (teamMember.teamPosition) {
    personStructuredData.hasOccupation = {
      "@type": "Occupation",
      name: String(teamMember.teamPosition).trim(),
      description: professionalRole,
    };
  }

  const teamMemberStructuredData = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: seoTitle,
    headline: `${memberName} — ${professionalRole}`,
    description: seoDescription,
    url: profilePageUrl,
    isPartOf: {
      "@type": "WebSite",
      name: brandName,
      url: `${SITE_URL}/`,
    },
    mainEntity: personStructuredData,
  };

  return (
    <>
      <PageSeo
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalPath={canonicalPath}
        image={socialSharingImage}
        type="profile"
        brandName={brandName}
        structuredData={teamMemberStructuredData}
      />
      <PublicPageHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt=""
              decoding="async"
              className="absolute inset-0 size-full object-cover opacity-20"
            />
          )}
          {coverImageUrl && (
            <div className="absolute inset-0 bg-slate-950/80" />
          )}
          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute -bottom-40 left-10 size-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <Container>
            <div className="relative grid min-w-0 gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap gap-2">
                  <span
                    className={`max-w-full break-words rounded-full px-3 py-1.5 text-xs font-semibold ${
                      availabilityClasses[teamMember.availabilityStatus] ||
                      "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {availabilityLabel}
                  </span>
                  <span
                    className={`max-w-full break-words rounded-full px-3 py-1.5 text-xs font-semibold ${
                      statusClasses[teamMember.status] ||
                      "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {statusLabel}
                  </span>
                  {teamMember.isFeatured && (
                    <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
                      Featured
                    </span>
                  )}
                </div>
                <p className="mt-7 break-words text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                  {professionalRole}
                </p>
                <h1 className="mt-4 max-w-4xl break-words text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {memberName}
                </h1>
                {teamMember.teamPosition && (
                  <p className="mt-3 break-words text-base font-semibold text-slate-400">
                    {teamMember.teamPosition}
                  </p>
                )}
                {shortIntroduction && (
                  <p className="mt-6 max-w-3xl break-words text-lg leading-8 text-slate-300">
                    {shortIntroduction}
                  </p>
                )}
                <div className="mt-8 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <TeamMemberLink href={portfolioUrl}>
                    Visit Portfolio
                  </TeamMemberLink>
                  <TeamMemberLink href={websiteUrl} variant="secondary">
                    Open Website
                  </TeamMemberLink>
                  <TeamMemberLink href="/#contact" variant="heroOutline">
                    Discuss a Project
                  </TeamMemberLink>
                </div>
              </div>
              <div className="min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={profileImageAlt}
                    decoding="async"
                    className="aspect-[16/10] w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="grid aspect-[16/10] place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-brand-600/30 via-slate-900 to-cyan-500/20 p-6">
                    <div className="min-w-0 text-center">
                      <div className="mx-auto grid size-24 place-items-center rounded-3xl border border-white/10 bg-white/10 text-3xl font-black text-white">
                        {createInitials(memberName)}
                      </div>
                      <p className="mt-5 break-words font-bold text-white">
                        {memberName}
                      </p>
                      <p className="mt-2 break-words text-sm text-slate-400">
                        Profile photo will be added soon
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 space-y-8">
                {(biography || shortIntroduction) && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <p className="break-words text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
                      Team Member Profile
                    </p>
                    <h2 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
                      About {memberName}
                    </h2>
                    <p className="mt-6 whitespace-pre-line break-words text-base leading-8 text-slate-600">
                      {biography || shortIntroduction}
                    </p>
                  </section>
                )}

                <TagSection title="Professional Skills" items={skills} />
                <TagSection
                  title="Tools and Technologies"
                  items={tools}
                  variant="brand"
                />
              </div>

              <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
                <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="break-words text-lg font-bold text-slate-950">
                    Team Member Information
                  </h2>
                  <dl className="mt-6 divide-y divide-slate-100">
                    <InformationItem label="Professional Role">
                      {professionalRole}
                    </InformationItem>
                    <InformationItem label="Team Position">
                      {teamMember.teamPosition}
                    </InformationItem>
                    <InformationItem label="Member Status">
                      {statusLabel}
                    </InformationItem>
                    <InformationItem label="Availability">
                      {availabilityLabel}
                    </InformationItem>
                  </dl>
                </section>

                {(email || phone.display) && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="break-words text-lg font-bold text-slate-950">
                      Contact Information
                    </h2>
                    <div className="mt-5 grid min-w-0 gap-3">
                      {email && (
                        <a
                          href={`mailto:${email}`}
                          className="max-w-full break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
                        >
                          {email}
                        </a>
                      )}
                      {phone.display && phone.href && (
                        <a
                          href={`tel:${phone.href}`}
                          className="max-w-full break-words rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
                        >
                          {phone.display}
                        </a>
                      )}
                      {phone.display && !phone.href && (
                        <p className="max-w-full break-words rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                          {phone.display}
                        </p>
                      )}
                    </div>
                  </section>
                )}

                {(portfolioUrl || websiteUrl) && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="break-words text-lg font-bold text-slate-950">
                      Professional Links
                    </h2>
                    <div className="mt-5 grid min-w-0 gap-3">
                      <TeamMemberLink href={portfolioUrl}>
                        Open Portfolio
                      </TeamMemberLink>
                      <TeamMemberLink href={websiteUrl} variant="outline">
                        Open Website
                      </TeamMemberLink>
                    </div>
                  </section>
                )}

                {availableSocialLinks.length > 0 && (
                  <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="break-words text-lg font-bold text-slate-950">
                      Social Profiles
                    </h2>
                    <div className="mt-5 grid min-w-0 gap-3">
                      {availableSocialLinks.map((platform) => (
                        <TeamMemberLink
                          key={platform.key}
                          href={platform.url}
                          variant="outline"
                        >
                          {platform.label}
                        </TeamMemberLink>
                      ))}
                    </div>
                  </section>
                )}
              </aside>
            </div>

            {(relatedProjects.length > 0 ||
              relatedCompanies.length > 0 ||
              relatedServices.length > 0) && (
              <div className="mt-12 space-y-14 border-t border-slate-200 pt-12 sm:mt-16 sm:pt-16">
                {relatedProjects.length > 0 && (
                  <RelatedSection
                    eyebrow="Related Work"
                    title="Projects connected to this Team member"
                  >
                    <div className="grid min-w-0 gap-7 [&>*]:min-w-0 md:grid-cols-2 xl:grid-cols-3">
                      {relatedProjects.map((project, index) => (
                        <ProjectCard
                          key={
                            project._id ||
                            project.id ||
                            project.slug ||
                            `${project.title}-${index}`
                          }
                          project={project}
                          index={index}
                          compact
                        />
                      ))}
                    </div>
                  </RelatedSection>
                )}

                {relatedCompanies.length > 0 && (
                  <RelatedSection
                    eyebrow="Business Relationships"
                    title="Companies connected to this Team member"
                  >
                    <div className="grid min-w-0 gap-7 [&>*]:min-w-0 md:grid-cols-2 xl:grid-cols-3">
                      {relatedCompanies.map((company, index) => (
                        <CompanyCard
                          key={
                            company._id ||
                            company.id ||
                            company.slug ||
                            `${company.name}-${index}`
                          }
                          company={company}
                          index={index}
                          compact
                        />
                      ))}
                    </div>
                  </RelatedSection>
                )}

                {relatedServices.length > 0 && (
                  <RelatedSection
                    eyebrow="Professional Services"
                    title="Services supported by this Team member"
                  >
                    <div className="grid min-w-0 gap-7 [&>*]:min-w-0 md:grid-cols-2 xl:grid-cols-3">
                      {relatedServices.map((service, index) => (
                        <ServiceCard
                          key={
                            service._id ||
                            service.id ||
                            service.slug ||
                            `${service.title}-${index}`
                          }
                          service={service}
                          index={index}
                          compact
                          actionLabel="Discuss this service"
                          actionHref="/#contact"
                        />
                      ))}
                    </div>
                  </RelatedSection>
                )}
              </div>
            )}
          </Container>
        </section>

        <PublicPageCTA
          ctaKey="teamMemberDetails"
        />
      </main>
      <Footer />
    </>
  );
}

export default TeamMemberDetailsPage;
