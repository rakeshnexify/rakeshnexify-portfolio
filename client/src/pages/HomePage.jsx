import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import AboutSection from "../components/sections/AboutSection";
import CompaniesSection from "../components/sections/CompaniesSection";
import ContactSection from "../components/sections/ContactSection";
import HeroSection from "../components/sections/HeroSection";
import ProjectsSection from "../components/sections/ProjectsSection";
import ServicesSection from "../components/sections/ServicesSection";

function HomePage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50">
        <HeroSection />

        <AboutSection />

        <ServicesSection />

        <ProjectsSection />

        <CompaniesSection />

        <ContactSection />
      </main>

      <Footer />
    </>
  );
}

export default HomePage;