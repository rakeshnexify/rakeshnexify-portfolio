import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import ContactSection from "../components/sections/ContactSection";
import FaqSection from "../components/sections/FaqSection";
import ServicesSection from "../components/sections/ServicesSection";
import TestimonialsSection from "../components/sections/TestimonialsSection";
import useSiteSettings from "../hooks/useSiteSettings";

function ContactPage() {
  const { settings } = useSiteSettings();

  const brandName =
    String(settings?.brand?.name || "").trim() || "RakeshNexify";

  const contactSection = settings?.contactSection || {};

  const showServices =
    contactSection.showServicesOnContactPage !== false;

  const showFaq =
    contactSection.showFaqOnContactPage !== false;

  const showTestimonials =
    contactSection.showTestimonialsOnContactPage !== false;

  return (
    <>
      <PageSeo
        title={`Contact | ${brandName}`}
        description={`Contact ${brandName} for portfolio enquiries, collaborations, professional discussions, and project conversations.`}
        canonicalPath="/contact"
        type="website"
        brandName={brandName}
      />

      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <ContactSection />

        {showServices && <ServicesSection />}

        {showFaq && <FaqSection />}

        {showTestimonials && <TestimonialsSection />}
      </main>

      <Footer />
    </>
  );
}

export default ContactPage;