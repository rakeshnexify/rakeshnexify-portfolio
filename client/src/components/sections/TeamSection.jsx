import { useMemo } from "react";
import { Link } from "react-router";

import useSiteSettings from "../../hooks/useSiteSettings";
import useTeamMembers from "../../hooks/useTeamMembers";
import Container from "../layout/Container";
import ResponsiveCardRow from "../layout/ResponsiveCardRow";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import TeamMemberCard from "../team/TeamMemberCard";

const defaultSectionContent = {
  eyebrow: "Meet My Team",

  heading: "Skilled professionals working together on modern digital projects",

  description:
    "Meet the developers, designers and collaborators who contribute their skills, experience and ideas to our websites, applications and business platforms.",

  ctaButton: {
    label: "View All Team Members",
    url: "/team",
  },
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

function DynamicActionLink({ url, children, className = "" }) {
  const safeUrl = getSafePublicUrl(url);

  if (safeUrl.startsWith("http://") || safeUrl.startsWith("https://")) {
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}

        <span className="sr-only"> opens in a new tab</span>
      </a>
    );
  }

  if (safeUrl.startsWith("/")) {
    return (
      <Link to={safeUrl} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={safeUrl} className={className}>
      {children}
    </a>
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
    String(sectionContent.eyebrow || "").trim() ||
    defaultSectionContent.eyebrow;

  const heading =
    String(sectionContent.heading || sectionContent.title || "").trim() ||
    defaultSectionContent.heading;

  const description =
    String(sectionContent.description || "").trim() ||
    defaultSectionContent.description;

  const ctaButton = sectionContent.ctaButton || sectionContent.action || {};

  const ctaLabel =
    String(ctaButton.label || "").trim() ||
    defaultSectionContent.ctaButton.label;

  const ctaUrl = getSafePublicUrl(
    ctaButton.url || ctaButton.href,
    defaultSectionContent.ctaButton.url,
  );

  const teamMembers = useMemo(() => {
    const sourceTeamMembers = Array.isArray(loadedTeamMembers)
      ? loadedTeamMembers
      : [];

    return [...sourceTeamMembers].sort(sortTeamMembersForPreview);
  }, [loadedTeamMembers]);

  const previewTeamMembers = teamMembers.slice(0, 3);

  return (
    <Section
      id="team"
      className="scroll-mt-20 border-t border-slate-200 bg-slate-50"
    >
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={heading}
          description={description}
        />

        <p aria-live="polite" className="sr-only">
          {isLoading
            ? "Loading Team members."
            : `${teamMembers.length} Team members loaded.`}
        </p>

        {error && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-800">
                Saved Team information is being displayed
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                The live Team API could not be reached.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshTeamMembers}
              disabled={isLoading}
              className="inline-flex min-h-10 max-w-full shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-center text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Retrying..." : "Retry Team"}
            </button>
          </div>
        )}

        {isLoading && teamMembers.length === 0 && (
          <div className="mt-10 grid min-w-0 gap-7 [&>*]:min-w-0 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[34rem] animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {!isLoading && teamMembers.length === 0 && (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
              0
            </div>

            <p className="mt-6 text-lg font-bold text-slate-950">
              No public Team members available
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Team member profiles will appear here after they are created and
              published from the Admin Panel.
            </p>
          </div>
        )}

        {previewTeamMembers.length > 0 && (
          <ResponsiveCardRow
            desktopColumns={3}
            ariaLabel="Featured Team members"
            className="mt-10"
          >
            {previewTeamMembers.map((teamMember, index) => (
              <TeamMemberCard
                key={
                  teamMember._id ||
                  teamMember.id ||
                  teamMember.slug ||
                  `${teamMember.name}-${index}`
                }
                teamMember={teamMember}
                index={index}
                compact
              />
            ))}
          </ResponsiveCardRow>
        )}

        {previewTeamMembers.length > 0 && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-bold text-slate-950">
                Meet every professional working with RakeshNexify
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                The homepage shows selected Team members only. Open the complete
                Team page to view all published profiles, skills and
                professional links.
              </p>
            </div>

            <DynamicActionLink
              url={ctaUrl}
              className="inline-flex min-h-11 max-w-full shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {ctaLabel} →
            </DynamicActionLink>
          </div>
        )}
      </Container>
    </Section>
  );
}

export default TeamSection;
