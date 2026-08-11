import { Link } from "react-router";

import useProjects from "../../hooks/useProjects";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import ResponsiveCardRow from "../layout/ResponsiveCardRow";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import CaseStudyCard from "../projects/CaseStudyCard";

const defaultSectionContent = {
  eyebrow: "Case Studies",

  heading: "Selected projects with the problem, process and measurable results",

  description:
    "Explore selected project case studies covering the challenge, solution, technologies, implementation decisions and outcomes behind the finished work.",

  ctaButton: {
    label: "View All Case Studies",
    url: "/case-studies",
  },
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

function getSafePublicUrl(value, fallbackUrl = "/case-studies") {
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

function findSection(sections, requiredKey) {
  if (!Array.isArray(sections)) {
    return null;
  }

  const normalizedRequiredKey = String(requiredKey || "")
    .trim()
    .toLowerCase();

  return (
    sections.find(
      (section) =>
        String(section?.key || "").trim().toLowerCase() ===
        normalizedRequiredKey,
    ) || null
  );
}

function targetsCaseStudiesPage(value) {
  const url = String(value || "").trim();

  if (!url) {
    return false;
  }

  try {
    const siteUrl = new URL(SITE_URL);
    const targetUrl = new URL(url, siteUrl);

    const normalizedPathname =
      targetUrl.pathname.replace(/\/+$/, "") || "/";

    return (
      targetUrl.origin === siteUrl.origin &&
      normalizedPathname === "/case-studies"
    );
  } catch {
    return false;
  }
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

function CaseStudiesSection() {
  const {
    projects: loadedCaseStudies,
    isLoading,
    error,
    refreshProjects,
  } = useProjects({
    fallbackProjects: [],
    caseStudy: true,
  });

  const { settings } = useSiteSettings();

  const sectionContent = settings?.caseStudiesSection || {};
  const registryItem = findSection(settings?.sections, "case-studies");

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

  const caseStudies = Array.isArray(loadedCaseStudies)
    ? loadedCaseStudies
    : [];

  const previewCaseStudies = caseStudies.slice(0, 3);

  const pageIsVisible = registryItem?.isPageVisible !== false;

  const showCta =
    Boolean(ctaLabel && ctaUrl) &&
    !(targetsCaseStudiesPage(ctaUrl) && !pageIsVisible);

  return (
    <Section
      id="case-studies"
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
            ? "Loading case studies."
            : `${caseStudies.length} case studies loaded.`}
        </p>

        {error && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-amber-800">
                Case studies could not be refreshed
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                Published Case Studies are loaded only from the live Projects
                API so unpublished Projects are never used as fallback content.
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

        {isLoading && caseStudies.length === 0 && (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[30rem] animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && caseStudies.length === 0 && (
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
              0
            </div>

            <p className="mt-6 text-lg font-bold text-slate-950">
              No Case Studies published yet
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Selected Projects will appear here after they are published as
              Case Studies from the Admin Projects editor.
            </p>
          </div>
        )}

        {previewCaseStudies.length > 0 && (
          <ResponsiveCardRow
            desktopColumns={3}
            ariaLabel="Featured project case studies"
            className="mt-10"
          >
            {previewCaseStudies.map((project) => (
              <CaseStudyCard
                key={project._id || project.slug}
                project={project}
                compact
              />
            ))}
          </ResponsiveCardRow>
        )}

        {previewCaseStudies.length > 0 && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-brand-100 bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-bold text-slate-950">
                See the complete story behind selected work
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Each Case Study uses the canonical Project profile for its
                challenge, solution, implementation details and results.
              </p>
            </div>

            {showCta && (
              <DynamicActionLink
                url={ctaUrl}
                className="inline-flex min-h-11 max-w-full shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                {ctaLabel} →
              </DynamicActionLink>
            )}
          </div>
        )}
      </Container>
    </Section>
  );
}

export default CaseStudiesSection;
