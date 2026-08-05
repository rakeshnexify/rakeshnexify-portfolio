import { useMemo } from "react";
import { Link } from "react-router";

import { mergeHomepageSections } from "../../config/homepageSections";
import useSiteSettings from "../../hooks/useSiteSettings";
import useSkills from "../../hooks/useSkills";
import Container from "../layout/Container";
import ResponsiveCardRow from "../layout/ResponsiveCardRow";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import SkillCard from "../skills/SkillCard";

const defaultSectionContent = {
  eyebrow: "Technical Skills",

  heading: "Modern technologies used to build reliable digital products",

  description:
    "Explore the technologies, frameworks and development skills used across websites, applications, APIs and business platforms.",

  ctaButton: {
    label: "View All Skills",
    url: "/skills",
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

function getSafePublicUrl(value, fallbackUrl = "/skills") {
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

function sortSkillsForPreview(firstSkill, secondSkill) {
  const featuredDifference =
    Number(Boolean(secondSkill?.isFeatured ?? secondSkill?.featured)) -
    Number(Boolean(firstSkill?.isFeatured ?? firstSkill?.featured));

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  const orderDifference =
    Number(firstSkill?.order || 0) - Number(secondSkill?.order || 0);

  if (orderDifference !== 0) {
    return orderDifference;
  }

  return String(firstSkill?.name || "").localeCompare(
    String(secondSkill?.name || ""),
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

function SkillsSection() {
  const {
    skills: loadedSkills,
    isLoading,
    error,
    refreshSkills,
  } = useSkills();

  const { settings } = useSiteSettings();

  const sectionContent = settings?.skillsSection || {};

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

  const skillsPublicationSection = useMemo(() => {
    return mergeHomepageSections(settings?.sections).find(
      (section) => section.key === "skills",
    );
  }, [settings?.sections]);

  const shouldShowCta =
    !(
      skillsPublicationSection?.isPageVisible === false &&
      ["/skills", "/skills/"].includes(ctaUrl)
    );

  const skills = useMemo(() => {
    const sourceSkills = Array.isArray(loadedSkills) ? loadedSkills : [];

    return [...sourceSkills].sort(sortSkillsForPreview);
  }, [loadedSkills]);

  const previewSkills = skills.slice(0, 6);

  return (
    <Section
      id="skills"
      className="scroll-mt-20 border-t border-slate-200 bg-white"
    >
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={heading}
          description={description}
        />

        <p aria-live="polite" className="sr-only">
          {isLoading
            ? "Loading Skills."
            : `${skills.length} Skills loaded.`}
        </p>

        {error && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-800">
                Saved Skills information is being displayed
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                The live Skills API could not be reached.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshSkills}
              disabled={isLoading}
              className="inline-flex min-h-10 max-w-full shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-center text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Retrying..." : "Retry Skills"}
            </button>
          </div>
        )}

        {isLoading && skills.length === 0 && (
          <div className="mt-10 grid min-w-0 gap-7 [&>*]:min-w-0 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-[30rem] animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {!isLoading && skills.length === 0 && (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
              0
            </div>

            <p className="mt-6 text-lg font-bold text-slate-950">
              No public Skills available
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Skills will appear here after they are created and published from
              the Admin Panel.
            </p>
          </div>
        )}

        {previewSkills.length > 0 && (
          <ResponsiveCardRow
            desktopColumns={3}
            ariaLabel="Featured professional Skills"
            className="mt-10"
          >
            {previewSkills.map((skill, index) => (
              <SkillCard
                key={
                  skill._id ||
                  skill.id ||
                  skill.slug ||
                  `${skill.name}-${index}`
                }
                skill={skill}
                index={index}
                compact
              />
            ))}
          </ResponsiveCardRow>
        )}

        {previewSkills.length > 0 && shouldShowCta && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-bold text-slate-950">
                Explore the complete technical skill set
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                The homepage shows selected Skills only. Open the complete
                Skills page to view all published technologies and proficiency
                details.
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

export default SkillsSection;
