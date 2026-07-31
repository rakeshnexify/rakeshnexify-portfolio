import { useMemo } from "react";
import { Link } from "react-router";

import siteData from "../../data/siteData";
import useProjects from "../../hooks/useProjects";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import ResponsiveCardRow from "../layout/ResponsiveCardRow";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import ProjectCard from "../projects/ProjectCard";

const defaultSectionContent = {
  eyebrow: "Featured Projects",

  heading: "Selected websites, applications and digital products",

  description:
    "Explore my MERN applications, e-commerce websites, business platforms and frontend projects. Each project is built with a focus on clean design, useful features and responsive performance.",

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

  const projects = useMemo(() => {
    const sourceProjects = Array.isArray(loadedProjects) ? loadedProjects : [];

    return [...sourceProjects].sort(sortProjectsForPreview);
  }, [loadedProjects]);

  const previewProjects = projects.slice(0, 2);

  return (
    <Section
      id="projects"
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
            ? "Loading projects."
            : `${projects.length} projects loaded.`}
        </p>

        {error && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-amber-800">
                Saved portfolio projects are being displayed
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                The live Projects API could not be reached.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshProjects}
              disabled={isLoading}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {isLoading && projects.length === 0 && (
          <div className="mt-10 grid gap-7 lg:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-96 animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {!isLoading && projects.length === 0 && (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <p className="text-lg font-bold text-slate-950">
              No public projects available
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Projects will appear here after they are published.
            </p>
          </div>
        )}

        {previewProjects.length > 0 && (
          <ResponsiveCardRow
            desktopColumns={2}
            ariaLabel="Featured projects"
            className="mt-10"
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
          </ResponsiveCardRow>
        )}

        {previewProjects.length > 0 && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-bold text-slate-950">
                Explore the complete project portfolio
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                The homepage shows selected projects only. Open the complete
                Projects page to view all published work and case studies.
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

export default ProjectsSection;
