import { useMemo } from "react";

import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import AboutSection from "../components/sections/AboutSection";
import CompaniesSection from "../components/sections/CompaniesSection";
import ContactSection from "../components/sections/ContactSection";
import HeroSection from "../components/sections/HeroSection";
import ProjectsSection from "../components/sections/ProjectsSection";
import ServicesSection from "../components/sections/ServicesSection";
import PageSeo from "../components/seo/PageSeo";
import useSiteSettings from "../hooks/useSiteSettings";

const sectionComponents = {
  hero: HeroSection,
  about: AboutSection,
  services: ServicesSection,
  projects: ProjectsSection,
  companies: CompaniesSection,
  contact: ContactSection,
};

const defaultSections = [
  {
    key: "hero",
    isVisible: true,
    order: 1,
  },
  {
    key: "about",
    isVisible: true,
    order: 2,
  },
  {
    key: "services",
    isVisible: true,
    order: 3,
  },
  {
    key: "projects",
    isVisible: true,
    order: 4,
  },
  {
    key: "companies",
    isVisible: true,
    order: 5,
  },
  {
    key: "contact",
    isVisible: true,
    order: 6,
  },
];

const defaultOrderByKey = Object.fromEntries(
  defaultSections.map((section) => [section.key, section.order]),
);

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
function normaliseSectionKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function createVisibleSections(databaseSections, allowDefaultFallback = true) {
  const sourceSections =
    Array.isArray(databaseSections) && databaseSections.length > 0
      ? databaseSections
      : defaultSections;

  const sectionsByKey = new Map();

  sourceSections.forEach((section, index) => {
    const key = normaliseSectionKey(section?.key);

    if (!key || !sectionComponents[key]) {
      return;
    }

    const numericOrder = Number(section?.order);

    const fallbackOrder = defaultOrderByKey[key] ?? index + 1;

    sectionsByKey.set(key, {
      key,

      isVisible: section?.isVisible !== false,

      order: Number.isFinite(numericOrder) ? numericOrder : fallbackOrder,
    });
  });

  if (sectionsByKey.size === 0 && allowDefaultFallback) {
    return createVisibleSections(defaultSections, false);
  }

  return [...sectionsByKey.values()]
    .filter((section) => section.isVisible !== false)
    .sort((firstSection, secondSection) => {
      const orderDifference = firstSection.order - secondSection.order;

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return (
        (defaultOrderByKey[firstSection.key] || 0) -
        (defaultOrderByKey[secondSection.key] || 0)
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
