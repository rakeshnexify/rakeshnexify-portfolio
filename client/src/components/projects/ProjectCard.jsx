import { Link } from "react-router";

const statusLabels = {
  planning: "Planning",
  "in-progress": "In Development",
  completed: "Completed",
  maintained: "Active Project",
  archived: "Archived",
};

function formatProjectStatus(status) {
  if (!status) {
    return "Project";
  }

  return statusLabels[status] || status;
}

function normaliseProject(project = {}, index = 0) {
  const links = project.links || {};

  const technologies = Array.isArray(project.technologies)
    ? project.technologies
    : [];

  const images = Array.isArray(project.images)
    ? [...project.images]
        .filter((image) => Boolean(String(image?.url || "").trim()))
        .sort(
          (firstImage, secondImage) =>
            Number(firstImage?.order || 0) -
            Number(secondImage?.order || 0),
        )
    : [];

  const numericOrder = Number(project.order);

  const coverImageUrl =
    String(project.coverImageUrl || "").trim() ||
    String(images[0]?.url || "").trim();

  const coverImageAlt =
    String(images[0]?.alt || "").trim() ||
    `${project.title || "Project"} preview`;

  return {
    id: project._id || project.id || project.slug || `project-${index + 1}`,
    title: project.title || "Untitled Project",
    slug: project.slug || "",
    shortDescription: project.shortDescription || "",
    category: project.category || "Project",
    status: formatProjectStatus(project.status),
    featured: Boolean(project.isFeatured ?? project.featured),
    order: Number.isFinite(numericOrder) ? numericOrder : index,
    coverImageUrl,
    coverImageAlt,
    technologies,
    liveUrl: links.liveUrl || project.liveUrl || "",
    sourceUrl: links.sourceCodeUrl || project.sourceUrl || "",
    caseStudyUrl:
      links.caseStudyUrl ||
      project.caseStudyUrl ||
      (project.slug ? `/projects/${project.slug}` : ""),
  };
}

function ExternalArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8.5 8-4 4 4 4" />
      <path d="m15.5 8 4 4-4 4" />
      <path d="m13.5 5-3 14" />
    </svg>
  );
}

function CaseStudyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function FeaturedIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="m12 2.8 2.72 5.51 6.08.88-4.4 4.29 1.04 6.06L12 16.68l-5.44 2.86 1.04-6.06-4.4-4.29 6.08-.88L12 2.8Z" />
    </svg>
  );
}

function ProjectAction({
  href,
  children,
  icon,
  variant = "primary",
  ariaLabel,
}) {
  if (!href) {
    return null;
  }

  const className = [
    "public-project-card-action",
    `public-project-card-action-${variant}`,
  ].join(" ");

  const content = (
    <>
      <span>{children}</span>
      <span className="public-project-card-action-icon">
        {icon}
      </span>
    </>
  );

  if (/^https?:\/\//i.test(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={ariaLabel}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={href}
      className={className}
      aria-label={ariaLabel}
    >
      {content}
    </Link>
  );
}

function ProjectCard({ project, index = 0, compact = false }) {
  const normalisedProject = normaliseProject(project, index);

  const projectNumber = String(index + 1).padStart(2, "0");

  const visibleTechnologies = compact
    ? normalisedProject.technologies.slice(0, 4)
    : normalisedProject.technologies.slice(0, 6);

  const hiddenTechnologyCount = Math.max(
    normalisedProject.technologies.length - visibleTechnologies.length,
    0,
  );

  const cardClassName = compact
    ? "public-project-card public-project-card-compact"
    : "public-project-card";

  return (
    <article
      className={cardClassName}
      tabIndex={compact ? 0 : undefined}
      aria-label={
        compact
          ? `${normalisedProject.title}. Tap or focus to view project details.`
          : undefined
      }
    >
      <div className="public-project-card-media">
        {normalisedProject.coverImageUrl ? (
          <img
            src={normalisedProject.coverImageUrl}
            alt={normalisedProject.coverImageAlt}
            loading="lazy"
            className="public-project-card-image"
          />
        ) : (
          <div
            className="public-project-card-image-placeholder"
            aria-hidden="true"
          >
            <span>{projectNumber}</span>
          </div>
        )}

        <div
          className="public-project-card-media-overlay"
          aria-hidden="true"
        />

        <div className="public-project-card-media-top">
          <span className="public-project-card-category">
            {normalisedProject.category}
          </span>

          <div className="public-project-card-media-meta">
            {normalisedProject.featured && (
              <span
                className="public-project-card-featured"
                title="Featured project"
                aria-label="Featured project"
              >
                <FeaturedIcon />
              </span>
            )}

            <span
              className="public-project-card-number"
              aria-hidden="true"
            >
              {projectNumber}
            </span>
          </div>
        </div>

        <div className="public-project-card-media-bottom">
          <span className="public-project-card-status">
            <span aria-hidden="true" />
            {normalisedProject.status}
          </span>
        </div>
      </div>

      <div className="public-project-card-body">
        <div className="public-project-card-main">
          <h3 className="public-project-card-title">
            {normalisedProject.title}
          </h3>

          {normalisedProject.shortDescription && (
            <p className="public-project-card-description">
              {normalisedProject.shortDescription}
            </p>
          )}

          {visibleTechnologies.length > 0 && (
            <div
              className="public-project-card-technologies"
              aria-label={`${normalisedProject.title} technologies`}
            >
              {visibleTechnologies.map((technology, technologyIndex) => (
                <span
                  key={`${normalisedProject.id}-${technology}-${technologyIndex}`}
                  className="public-project-card-technology"
                >
                  {technology}
                </span>
              ))}

              {hiddenTechnologyCount > 0 && (
                <span
                  className="public-project-card-technology public-project-card-technology-more"
                  title={`${hiddenTechnologyCount} more technologies`}
                >
                  +{hiddenTechnologyCount}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="public-project-card-actions">
          <div className="public-project-card-actions-primary">
            <ProjectAction
              href={normalisedProject.liveUrl}
              icon={<ExternalArrowIcon />}
              ariaLabel={`Open live preview for ${normalisedProject.title}`}
            >
              Live Demo
            </ProjectAction>

            <ProjectAction
              href={normalisedProject.sourceUrl}
              icon={<CodeIcon />}
              variant="secondary"
              ariaLabel={`View source code for ${normalisedProject.title}`}
            >
              View Code
            </ProjectAction>
          </div>

          <ProjectAction
            href={normalisedProject.caseStudyUrl}
            icon={<CaseStudyIcon />}
            variant="case-study"
            ariaLabel={`Open case study for ${normalisedProject.title}`}
          >
            Case Study
          </ProjectAction>
        </div>
      </div>
    </article>
  );
}

export default ProjectCard;
