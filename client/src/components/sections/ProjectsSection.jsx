import siteData from "../../data/siteData";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";

const statusClasses = {
  Completed: "bg-emerald-100 text-emerald-700",
  "Active Project": "bg-blue-100 text-blue-700",
  "In Development": "bg-amber-100 text-amber-700",
};

function ProjectAction({ href, children, variant = "primary" }) {
  const baseClasses =
    "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition";

  const variantClasses = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-slate-950 text-white hover:bg-slate-800",
    outline:
      "border border-slate-300 bg-white text-slate-700 hover:border-brand-600 hover:text-brand-600",
  };

  const actionClasses = `${baseClasses} ${
    variantClasses[variant] || variantClasses.primary
  }`;

  if (!href) {
    return (
      <span
        aria-disabled="true"
        title="Link will be added soon"
        className={`${baseClasses} cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400`}
      >
        {children}
      </span>
    );
  }

  const isExternalLink = href.startsWith("http");

  return (
    <a
      href={href}
      target={isExternalLink ? "_blank" : undefined}
      rel={isExternalLink ? "noreferrer" : undefined}
      className={actionClasses}
    >
      {children}
    </a>
  );
}

function ProjectsSection() {
  const projects = [...siteData.projects].sort(
    (firstProject, secondProject) =>
      Number(secondProject.featured) - Number(firstProject.featured),
  );

  return (
    <Section
      id="projects"
      className="scroll-mt-20 border-t border-slate-200 bg-white"
    >
      <Container>
        <SectionHeading
          eyebrow="Featured Projects"
          title="Selected websites, applications and digital products"
          description="Explore my MERN applications, e-commerce websites, business platforms and frontend projects. Each project is built with a focus on clean design, useful features and responsive performance."
        />

        <div className="mt-12 grid gap-7 lg:grid-cols-2">
          {projects.map((project, index) => {
            const projectNumber = String(index + 1).padStart(2, "0");

            return (
              <article
                key={project.id}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-slate-200/70"
              >
                <div className="relative overflow-hidden bg-slate-950 px-6 py-8 sm:px-8">
                  <div className="absolute -right-12 -top-12 size-40 rounded-full bg-brand-600/20 blur-3xl" />

                  <div className="absolute -bottom-16 left-12 size-40 rounded-full bg-cyan-500/10 blur-3xl" />

                  <div className="relative">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200">
                          {project.category}
                        </span>

                        {project.featured && (
                          <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
                            Featured
                          </span>
                        )}
                      </div>

                      <span className="text-4xl font-black tracking-tight text-white/10">
                        {projectNumber}
                      </span>
                    </div>

                    <div className="mt-12 flex items-end justify-between gap-5">
                      <div>
                        <p className="text-sm font-semibold text-brand-400">
                          Project
                        </p>

                        <h3 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                          {project.title}
                        </h3>
                      </div>

                      <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/10 text-white">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          className="size-6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 5h16v14H4z" />
                          <path d="M8 9h8" />
                          <path d="M8 13h5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        statusClasses[project.status] ||
                        "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {project.status}
                    </span>

                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {project.technologies.length} Technologies
                    </span>
                  </div>

                  <p className="mt-5 text-base leading-7 text-slate-600">
                    {project.shortDescription}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {project.technologies.map((technology) => (
                      <span
                        key={`${project.id}-${technology}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                      >
                        {technology}
                      </span>
                    ))}
                  </div>

                  <div className="mt-7 border-t border-slate-200 pt-6">
                    <p className="text-sm font-bold text-slate-950">
                      Project highlights
                    </p>

                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {project.highlights.slice(0, 6).map((highlight) => (
                        <li
                          key={`${project.id}-${highlight}`}
                          className="flex items-start gap-2.5 text-sm leading-6 text-slate-600"
                        >
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-600" />

                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-3 pt-8">
                    <ProjectAction href={project.liveUrl}>
                      Live Preview
                    </ProjectAction>

                    <ProjectAction href={project.sourceUrl} variant="secondary">
                      Source Code
                    </ProjectAction>

                    <ProjectAction
                      href={project.caseStudyUrl}
                      variant="outline"
                    >
                      Case Study
                    </ProjectAction>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 rounded-3xl border border-brand-100 bg-brand-50 px-6 py-8 text-center sm:px-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
            More Projects Coming
          </p>

          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            New MERN, WordPress and e-commerce projects are being developed
          </h3>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            Live demonstrations, GitHub repositories and detailed case studies
            will be connected as each project is completed and published.
          </p>

          <a
            href="#contact"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Discuss Your Project
          </a>
        </div>
      </Container>
    </Section>
  );
}

export default ProjectsSection;
