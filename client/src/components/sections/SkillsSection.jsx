import { useMemo, useState } from "react";

import useSiteSettings from "../../hooks/useSiteSettings";
import useSkills from "../../hooks/useSkills";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SkillCard from "../skills/SkillCard";

import PublicSectionEyebrow from "../layout/PublicSectionEyebrow";
function sortSkills(firstSkill, secondSkill) {
  const orderDifference =
    Number(firstSkill?.order || 0) - Number(secondSkill?.order || 0);

  if (orderDifference !== 0) {
    return orderDifference;
  }

  return String(firstSkill?.name || "").localeCompare(
    String(secondSkill?.name || ""),
  );
}

function cleanCategory(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function createCategoryKey(value) {
  return cleanCategory(value).toLowerCase();
}

function SkillsSection() {
  const {
    skills: loadedSkills,
    isLoading,
    error,
    refreshSkills,
  } = useSkills();

  const { settings } = useSiteSettings();
  const [activeCategoryKey, setActiveCategoryKey] = useState("all");

  const sectionContent = settings?.skillsSection || {};

  const eyebrow =
    String(sectionContent.eyebrow || "").trim();

  const heading =
    String(sectionContent.heading || "").trim();

  const description =
    String(sectionContent.description || "").trim();

  const skills = useMemo(() => {
    const sourceSkills = Array.isArray(loadedSkills) ? loadedSkills : [];

    return [...sourceSkills].sort(sortSkills);
  }, [loadedSkills]);

  const categories = useMemo(() => {
    const seenCategoryKeys = new Set();

    return skills.reduce((result, skill) => {
      const label = cleanCategory(skill?.category) || "Other";
      const key = createCategoryKey(label);

      if (!seenCategoryKeys.has(key)) {
        seenCategoryKeys.add(key);
        result.push({
          key,
          label,
        });
      }

      return result;
    }, []);
  }, [skills]);

  const activeCategoryExists =
    activeCategoryKey === "all" ||
    categories.some((category) => category.key === activeCategoryKey);

  const resolvedActiveCategoryKey = activeCategoryExists
    ? activeCategoryKey
    : "all";

  const visibleSkills = useMemo(() => {
    if (resolvedActiveCategoryKey === "all") {
      return skills;
    }

    return skills.filter(
      (skill) =>
        createCategoryKey(skill?.category || "Other") ===
        resolvedActiveCategoryKey,
    );
  }, [resolvedActiveCategoryKey, skills]);

  if (!isLoading && !error && skills.length === 0) {
    return null;
  }

  return (
    <Section
      id="skills"
      className="public-skills-section scroll-mt-20"
    >
      <Container>
        <div className="public-skills-content">
          <header className="public-skills-header">
            <PublicSectionEyebrow eyebrow={eyebrow} />

            <h2 className="public-skills-heading">{heading}</h2>

            <p className="public-skills-description">{description}</p>


          </header>

          <p aria-live="polite" className="sr-only">
            {isLoading
              ? "Loading skills."
              : `${skills.length} skills loaded.`}
          </p>

          {error && (
            <div className="public-skills-error">
              <div>
                <p className="font-bold">Skills could not be loaded</p>
                <p className="mt-1 text-sm opacity-80">
                  Retry the live Skills request.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshSkills}
                disabled={isLoading}
              >
                {isLoading ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}

          {categories.length > 0 && (
            <div
              className="public-skills-tabs"
              role="tablist"
              aria-label="Filter skills by category"
            >
              <button
                type="button"
                role="tab"
                aria-selected={resolvedActiveCategoryKey === "all"}
                className={
                  resolvedActiveCategoryKey === "all"
                    ? "public-skills-tab public-skills-tab-active"
                    : "public-skills-tab"
                }
                onClick={() => setActiveCategoryKey("all")}
              >
                All Skills
              </button>

              {categories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  role="tab"
                  aria-selected={
                    resolvedActiveCategoryKey === category.key
                  }
                  className={
                    resolvedActiveCategoryKey === category.key
                      ? "public-skills-tab public-skills-tab-active"
                      : "public-skills-tab"
                  }
                  onClick={() => setActiveCategoryKey(category.key)}
                >
                  {category.label}
                </button>
              ))}
            </div>
          )}

          {isLoading && skills.length === 0 && (
            <div
              className="public-skills-grid public-skills-grid-loading"
              aria-label="Loading skills"
            >
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className="public-skill-skeleton"
                />
              ))}
            </div>
          )}

          {visibleSkills.length > 0 && (
            <div
              className="public-skills-grid"
              aria-label="Professional skills"
            >
              {visibleSkills.map((skill, index) => (
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
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

export default SkillsSection;
