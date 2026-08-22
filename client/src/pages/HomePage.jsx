import { useMemo } from "react";

import CertificationAchievementsSection from "../components/sections/CertificationAchievementsSection";
import ClientsPartnersSection from "../components/sections/ClientsPartnersSection";
import CaseStudiesSection from "../components/sections/CaseStudiesSection";
import ContactSection from "../components/sections/ContactSection";
import EducationSection from "../components/sections/EducationSection";
import ExperienceSection from "../components/sections/ExperienceSection";
import FaqSection from "../components/sections/FaqSection";
import HeroSection from "../components/sections/HeroSection";
import LatestPostsSection from "../components/sections/LatestPostsSection";
import ProjectsSection from "../components/sections/ProjectsSection";
import ServicesSection from "../components/sections/ServicesSection";
import SkillsSection from "../components/sections/SkillsSection";
import StatisticsSection from "../components/sections/StatisticsSection";
import TestimonialsSection from "../components/sections/TestimonialsSection";
import TeamSection from "../components/sections/TeamSection";
import AboutSection from "../components/sections/AboutSection";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import PageSeo from "../components/seo/PageSeo";
import { mergeHomepageSections } from "../config/homepageSections";
import useSiteSettings from "../hooks/useSiteSettings";

const sectionComponents = {
  hero: HeroSection,
  about: AboutSection,
  statistics: StatisticsSection,
  skills: SkillsSection,
  services: ServicesSection,
  projects: ProjectsSection,
  "case-studies": CaseStudiesSection,
  education: EducationSection,
  experience: ExperienceSection,
  achievements: CertificationAchievementsSection,
  team: TeamSection,
  "clients-partners": ClientsPartnersSection,
  posts: LatestPostsSection,
  testimonials: TestimonialsSection,
  faq: FaqSection,
  contact: ContactSection,
};

const defaultSeoContent = {
  title: "RakeshNexify | MERN & WordPress Developer",

  description:
    "Professional MERN applications, WordPress websites, custom websites, web applications, business platforms, e-commerce solutions and modern digital products.",

  keywords: [
    "MERN developer",
    "WordPress developer",
    "full stack developer",
    "custom website development",
    "web application development",
    "business website development",
    "e-commerce development",
    "React developer",
    "Node.js developer",
    "MongoDB developer",
  ],
};

function createVisibleSections(databaseSections) {
  return mergeHomepageSections(databaseSections).filter((section) => {
    return (
      section.isVisible !== false && Boolean(sectionComponents[section.key])
    );
  });
}

function HomePage() {
  const { settings } = useSiteSettings();

  const visibleSections = useMemo(
    () => createVisibleSections(settings?.sections),
    [settings?.sections],
  );

  const brandName =
    String(settings?.brand?.name || "").trim() || "RakeshNexify";

  const seo =
    settings?.seo && typeof settings.seo === "object" ? settings.seo : {};

  const seoTitle =
    String(seo.title || "").trim() ||
    (brandName === "RakeshNexify"
      ? defaultSeoContent.title
      : `${brandName} | MERN & WordPress Developer`);

  const seoDescription =
    String(seo.description || "").trim() || defaultSeoContent.description;

  const socialSharingImage = String(seo.ogImageUrl || "").trim();

  const seoKeywords = Array.isArray(seo.keywords)
    ? seo.keywords.length > 0
      ? seo.keywords
      : defaultSeoContent.keywords
    : String(seo.keywords || "").trim() || defaultSeoContent.keywords;

  return (
    <>
      <PageSeo
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalPath="/"
        image={socialSharingImage}
        type="website"
        brandName={brandName}
      />

      <Navbar />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        {visibleSections.map((section) => {
          const SectionComponent = sectionComponents[section.key];

          return <SectionComponent key={section.key} />;
        })}
      </main>

      <Footer />
    </>
  );
}

export default HomePage;
