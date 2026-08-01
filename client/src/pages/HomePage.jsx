import { useMemo } from "react";

import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import AboutSection from "../components/sections/AboutSection";
import CompaniesSection from "../components/sections/CompaniesSection";
import ContactSection from "../components/sections/ContactSection";
import HeroSection from "../components/sections/HeroSection";
import ProjectsSection from "../components/sections/ProjectsSection";
import ServicesSection from "../components/sections/ServicesSection";
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

  /*
   * Use the safe defaults when the database
   * contains only invalid or unsupported keys.
   */
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

  return (
    <>
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
