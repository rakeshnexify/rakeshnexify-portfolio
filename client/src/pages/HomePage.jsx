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

function HomePage() {
  const { settings } = useSiteSettings();

  const databaseSections = Array.isArray(settings?.sections)
    ? settings.sections
    : [];

  const availableSections =
    databaseSections.length > 0 ? databaseSections : defaultSections;

  const visibleSections = [...availableSections]
    .filter(
      (section) =>
        section.isVisible !== false && Boolean(sectionComponents[section.key]),
    )
    .sort(
      (firstSection, secondSection) => firstSection.order - secondSection.order,
    );

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
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
