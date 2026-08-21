import { useMemo, useState } from "react";
import { Link } from "react-router";

import siteData from "../../data/siteData";
import useProjects from "../../hooks/useProjects";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import ProjectCard from "../projects/ProjectCard";

const HOME_PROJECT_LIMIT = 4;

const defaultSectionContent = {
  eyebrow: "MY WORK",
  heading: "Projects That Deliver Results",
  description:
    "A selection of projects where code, creativity and problem-solving come together to build useful digital solutions.",
  ctaButton: {
    label: "View All Projects",
    url: "/projects",
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

function getSafePublicUrl(value, fallbackUrl = "/projects") {
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

function sortProjectsForPreview(firstProject, secondProject) {
  const firstFeatured = Boolean(
    firstProject?.isFeatured ?? firstProject?.featured,
  );

  const secondFeatured = Boolean(
    secondProject?.isFeatured ?? secondProject?.featured,
  );

  const featuredDifference = Number(secondFeatured) - Number(firstFeatured);

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  const firstOrder = Number(firstProject?.order || 0);
  const secondOrder = Number(secondProject?.order || 0);

  return firstOrder - secondOrder;
}

function cleanCategory(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function createCategoryKey(value) {
  return cleanCategory(value).toLowerCase();
}

function getHeadingParts(heading) {
  const words = String(heading || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length <= 1) {
    return {
      lead: "",
      highlight: words[0] || "",
    };
  }

  return {
    lead: words.slice(0, -1).join(" "),
    highlight: words.at(-1),
  };
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

function ProjectsFilterIcon({ all = false }) {
  if (all) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="4" y="4" width="6" height="6" rx="1.2" />
        <rect x="14" y="4" width="6" height="6" rx="1.2" />
        <rect x="4" y="14" width="6" height="6" rx="1.2" />
        <rect x="14" y="14" width="6" height="6" rx="1.2" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3.75 7.75A1.75 1.75 0 0 1 5.5 6h4l1.6 2h7.4a1.75 1.75 0 0 1 1.75 1.75v7A1.75 1.75 0 0 1 18.5 18.5h-13a1.75 1.75 0 0 1-1.75-1.75v-9Z" />
    </svg>
  );
}

function ProjectsSection() {
  const {
    projects: loadedProjects,
    isLoading,
    error,
    refreshProjects,
  } = useProjects({
    fallbackProjects: siteData.projects,
  });

  const { settings } = useSiteSettings();
  const [activeCategoryKey, setActiveCategoryKey] = useState("all");

  const sectionContent = settings?.projectsSection || {};

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

  const headingParts = getHeadingParts(heading);

  const projects = useMemo(() => {
    const sourceProjects = Array.isArray(loadedProjects) ? loadedProjects : [];

    return [...sourceProjects].sort(sortProjectsForPreview);
  }, [loadedProjects]);

  const categories = useMemo(() => {
    const seenCategoryKeys = new Set();

    return projects.reduce((result, project) => {
      const label = cleanCategory(project?.category);

      if (!label) {
        return result;
      }

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
  }, [projects]);

  const activeCategoryExists =
    activeCategoryKey === "all" ||
    categories.some((category) => category.key === activeCategoryKey);

  const resolvedActiveCategoryKey = activeCategoryExists
    ? activeCategoryKey
    : "all";

  const filteredProjects = useMemo(() => {
    if (resolvedActiveCategoryKey === "all") {
      return projects;
    }

    return projects.filter(
      (project) =>
        createCategoryKey(project?.category) === resolvedActiveCategoryKey,
    );
  }, [projects, resolvedActiveCategoryKey]);

  const previewProjects = filteredProjects.slice(0, HOME_PROJECT_LIMIT);

  return (
    <Section
      id="projects"
      className="public-projects-section scroll-mt-20 border-t border-slate-200 bg-white"
    >
      <Container>
        <div className="public-projects-content">
          <header className="public-projects-header">
            <div className="public-projects-eyebrow">
              <span aria-hidden="true">&lt;/&gt;</span>
              <p>{eyebrow}</p>
              <span aria-hidden="true">&lt;/&gt;</span>
            </div>

            <h2 className="public-projects-heading">
              {headingParts.lead && (
                <>
                  {headingParts.lead}{" "}
                </>
              )}

              <span>{headingParts.highlight}</span>
            </h2>

            <p className="public-projects-description">{description}</p>

            <span className="public-projects-heading-accent" aria-hidden="true" />
          </header>

          <p aria-live="polite" className="sr-only">
            {isLoading
              ? "Loading projects."
              : `${projects.length} projects loaded.`}
          </p>

          {error && (
            <div className="public-projects-error">
              <div>
                <p className="font-bold">
                  Saved portfolio projects are being displayed
                </p>

                <p className="mt-1 text-sm opacity-80">
                  The live Projects API could not be reached.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshProjects}
                disabled={isLoading}
              >
                {isLoading ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}

          {categories.length > 0 && (
            <div
              className="public-projects-filters"
              aria-label="Filter projects by category"
            >
              <button
                type="button"
                aria-pressed={resolvedActiveCategoryKey === "all"}
                className={
                  resolvedActiveCategoryKey === "all"
                    ? "public-project-filter public-project-filter-active"
                    : "public-project-filter"
                }
                onClick={() => setActiveCategoryKey("all")}
              >
                <span className="public-project-filter-icon">
                  <ProjectsFilterIcon all />
                </span>
                <span>All Projects</span>
              </button>

              {categories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  aria-pressed={resolvedActiveCategoryKey === category.key}
                  className={
                    resolvedActiveCategoryKey === category.key
                      ? "public-project-filter public-project-filter-active"
                      : "public-project-filter"
                  }
                  onClick={() => setActiveCategoryKey(category.key)}
                >
                  <span className="public-project-filter-icon">
                    <ProjectsFilterIcon />
                  </span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          )}

          {isLoading && projects.length === 0 && (
            <div
              className="public-projects-grid public-projects-grid-loading"
              aria-label="Loading projects"
            >
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="public-projects-skeleton"
                />
              ))}
            </div>
          )}

          {!isLoading && projects.length === 0 && (
            <div className="public-projects-empty">
              <p className="text-lg font-bold">
                No public projects available
              </p>

              <p className="mt-2 text-sm opacity-70">
                Projects will appear here after they are published.
              </p>
            </div>
          )}

          {projects.length > 0 && previewProjects.length === 0 && (
            <div className="public-projects-empty">
              <p className="text-lg font-bold">
                No projects in this category
              </p>

              <button
                type="button"
                className="mt-3 text-sm font-semibold text-brand-600"
                onClick={() => setActiveCategoryKey("all")}
              >
                Show all projects
              </button>
            </div>
          )}

          {previewProjects.length > 0 && (
            <div
              className="public-projects-grid"
              aria-label="Selected projects"
            >
              {previewProjects.map((project, index) => (
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
          )}

          {projects.length > 0 && (
            <div className="public-projects-cta">
              <DynamicActionLink
                url={ctaUrl}
                className="public-projects-cta-button"
              >
                <span>{ctaLabel}</span>
                <span aria-hidden="true">→</span>
              </DynamicActionLink>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

export default ProjectsSection;
