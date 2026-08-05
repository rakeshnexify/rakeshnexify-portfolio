import { useMemo } from "react";
import { Link } from "react-router";

import Container from "../components/layout/Container";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import SkillCard from "../components/skills/SkillCard";
import useSiteSettings from "../hooks/useSiteSettings";
import useSkills from "../hooks/useSkills";

const defaultPageContent = {
  eyebrow: "Technical Skills",

  heading: "Technologies and expertise used to build modern digital products",

  description:
    "Explore the development technologies, frameworks, platforms and professional skills used across websites, applications, APIs and scalable business systems.",
};

const defaultSkillsKeywords = [
  "RakeshNexify skills",
  "MERN stack skills",
  "React developer skills",
  "Node.js developer skills",
  "MongoDB development",
  "Express.js development",
  "WordPress development skills",
  "full stack development skills",
  "web application development",
  "frontend development",
  "backend development",
];

const SITE_URL = "https://rakeshnexify.com";

function sortSkills(firstSkill, secondSkill) {
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

function groupSkillsByCategory(skills) {
  const groupsByCategory = new Map();

  skills.forEach((skill) => {
    const category = String(skill?.category || "").trim() || "Other";

    if (!groupsByCategory.has(category)) {
      groupsByCategory.set(category, []);
    }

    groupsByCategory.get(category).push(skill);
  });

  return [...groupsByCategory.entries()].map(([category, categorySkills]) => ({
    category,
    skills: categorySkills,
  }));
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Skills could not be loaded.";
}

function SkillsLoadingState() {
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

            <div className="mt-12 grid min-w-0 gap-7 [&>*]:min-w-0 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-[30rem] animate-pulse rounded-3xl bg-slate-200"
                />
              ))}
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
}

function SkillsErrorState({ error, onRetry, isRetrying }) {
  return (
    <>
      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[calc(100vh-5rem)] overflow-x-hidden place-items-center bg-slate-50 px-4 py-12"
      >
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-red-600">
            !
          </div>

          <p className="mt-6 break-words text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Skills Error
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
            Skills could not be loaded
          </h1>

          <p className="mt-4 break-words leading-7 text-slate-600">
            {getErrorMessage(error)}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isRetrying ? "Retrying..." : "Retry"}
            </button>

            <Link
              to="/"
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-center text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

function SkillsPage() {
  const {
    skills: loadedSkills,
    isLoading,
    error,
    refreshSkills,
  } = useSkills();

  const { settings } = useSiteSettings();

  const brand = settings?.brand || {};

  const sectionContent = settings?.skillsSection || {};

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

  const seoKeywords = [...globalSeoKeywords, ...defaultSkillsKeywords];

  const socialSharingImage = String(seo.ogImageUrl || "").trim();

  const seoTitle = `Skills | ${brandName}`;

  const skills = useMemo(() => {
    const sourceSkills = Array.isArray(loadedSkills) ? loadedSkills : [];

    return [...sourceSkills].sort(sortSkills);
  }, [loadedSkills]);

  const skillGroups = useMemo(
    () => groupSkillsByCategory(skills),
    [skills],
  );

  const skillsStructuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seoTitle,
      headline: heading,
      description,
      url: `${SITE_URL}/skills`,
      isPartOf: {
        "@type": "WebSite",
        name: brandName,
        url: `${SITE_URL}/`,
      },
      mainEntity: {
        "@type": "ItemList",
        name: `${brandName} Professional Skills`,
        numberOfItems: skills.length,
        itemListElement: skills.map((skill, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "DefinedTerm",
            name: String(skill?.name || "").trim() || "Professional Skill",
            description: String(skill?.description || "").trim(),
            inDefinedTermSet: `${SITE_URL}/skills`,
          },
        })),
      },
    }),
    [brandName, description, heading, seoTitle, skills],
  );

  if (isLoading && skills.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/skills"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
          structuredData={skillsStructuredData}
        />

        <SkillsLoadingState />
      </>
    );
  }

  if (error && skills.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/skills"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <SkillsErrorState
          error={error}
          onRetry={refreshSkills}
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
        canonicalPath="/skills"
        image={socialSharingImage}
        type="website"
        brandName={brandName}
        structuredData={skillsStructuredData}
      />

      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl" />

          <div className="absolute -bottom-40 left-10 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

          <Container>
            <div className="relative min-w-0 max-w-4xl">
              <p className="break-words text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                {eyebrow}
              </p>

              <h1 className="mt-4 break-words text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {heading}
              </h1>

              <p className="mt-6 max-w-3xl break-words text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {description}
              </p>

              <div className="mt-8 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <span className="inline-flex max-w-full items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-center text-sm font-semibold text-slate-200">
                  {skills.length} {skills.length === 1 ? "Skill" : "Skills"}
                </span>

                <span className="inline-flex max-w-full items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-center text-sm font-semibold text-slate-200">
                  {skillGroups.length}{" "}
                  {skillGroups.length === 1 ? "Category" : "Categories"}
                </span>

                <Link
                  to="/#contact"
                  className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Discuss Your Project
                </Link>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            {error && skills.length > 0 && (
              <div className="mb-8 flex min-w-0 flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-amber-800">
                    Saved Skills information is being displayed
                  </p>

                  <p className="mt-1 break-words text-sm leading-6 text-amber-700">
                    The live Skills API could not be reached.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshSkills}
                  disabled={isLoading}
                  className="inline-flex min-h-10 max-w-full shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-center text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </button>
              </div>
            )}

            {skillGroups.length > 0 ? (
              <div className="space-y-14">
                {skillGroups.map((group) => (
                  <section
                    key={group.category}
                    aria-labelledby={`skills-category-${group.category
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")}`}
                  >
                    <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
                          Skill Category
                        </p>

                        <h2
                          id={`skills-category-${group.category
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")}`}
                          className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"
                        >
                          {group.category}
                        </h2>
                      </div>

                      <span className="text-sm font-semibold text-slate-500">
                        {group.skills.length}{" "}
                        {group.skills.length === 1 ? "Skill" : "Skills"}
                      </span>
                    </div>

                    <div className="mt-7 grid min-w-0 gap-7 [&>*]:min-w-0 md:grid-cols-2 xl:grid-cols-3">
                      {group.skills.map((skill, index) => (
                        <SkillCard
                          key={
                            skill._id ||
                            skill.id ||
                            skill.slug ||
                            `${skill.name}-${index}`
                          }
                          skill={skill}
                          index={index}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                  0
                </div>

                <h2 className="mt-6 break-words text-2xl font-bold tracking-tight text-slate-950">
                  No public Skills available
                </h2>

                <p className="mx-auto mt-3 max-w-xl break-words leading-7 text-slate-600">
                  Skills will appear here after they are created and published
                  from the Admin Panel.
                </p>

                <Link
                  to="/#contact"
                  className="mt-7 inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Contact Me
                </Link>
              </div>
            )}
          </Container>
        </section>

        <section className="border-t border-slate-200 bg-white py-14">
          <Container>
            <div className="rounded-3xl bg-slate-950 px-6 py-10 text-center text-white sm:px-10">
              <p className="break-words text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                Build With the Right Technology
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl break-words text-2xl font-bold tracking-tight sm:text-4xl">
                Need a website or application using a specific technology?
              </h2>

              <p className="mx-auto mt-5 max-w-2xl break-words leading-7 text-slate-300">
                Share your required features, preferred technology and project
                timeline. The development stack can be selected according to
                your business goals.
              </p>

              <Link
                to="/#contact"
                className="mt-7 inline-flex min-h-12 max-w-full items-center justify-center rounded-xl bg-brand-600 px-6 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Start a Conversation
              </Link>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default SkillsPage;
