import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import Button from "../ui/Button";
import Logo from "../ui/Logo";

function HeroSection() {
  const { settings } = useSiteSettings();

  const hero = settings?.hero || {};
  const owner = settings?.owner || {};

  const eyebrow =
    hero.eyebrow || owner.professionalTitle || "MERN Stack Developer";

  const heading =
    hero.heading ||
    hero.title ||
    "I build modern digital experiences that help businesses grow.";

  const description =
    hero.description ||
    "I create responsive websites, MERN applications, e-commerce platforms and scalable digital solutions.";

  const primaryButton = {
    label:
      hero.primaryButton?.label || hero.primaryAction?.label || "View Projects",

    url: hero.primaryButton?.url || hero.primaryAction?.href || "#projects",
  };

  const secondaryButton = {
    label:
      hero.secondaryButton?.label ||
      hero.secondaryAction?.label ||
      "Contact Me",

    url: hero.secondaryButton?.url || hero.secondaryAction?.href || "#contact",
  };

  function goToLink(url) {
    if (!url) {
      return;
    }

    if (url.startsWith("#")) {
      const sectionId = url.slice(1);
      const targetSection = document.getElementById(sectionId);

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        window.history.replaceState(null, "", url);
      }

      return;
    }

    window.location.href = url;
  }

  return (
    <Section
      id="home"
      className="flex min-h-[calc(100vh-5rem)] scroll-mt-20 items-center"
    >
      <Container>
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-xl shadow-slate-200/60 sm:px-10 sm:py-20 lg:px-16">
          <div className="mb-10 flex flex-col items-center gap-5">
            {owner.profileImageUrl && (
              <img
                src={owner.profileImageUrl}
                alt={owner.name || "Portfolio owner"}
                className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg ring-1 ring-slate-200"
              />
            )}

            <Logo showTagline />
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-600">
            {eyebrow}
          </p>

          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            {heading}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {description}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="large" onClick={() => goToLink(primaryButton.url)}>
              {primaryButton.label}
            </Button>

            <Button
              variant="secondary"
              size="large"
              onClick={() => goToLink(secondaryButton.url)}
            >
              {secondaryButton.label}
            </Button>

            <Button
              variant="outline"
              size="large"
              onClick={() => goToLink("#about")}
            >
              Learn More
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-500">
            <span>MERN Stack</span>
            <span aria-hidden="true">•</span>
            <span>WordPress</span>
            <span aria-hidden="true">•</span>
            <span>E-commerce</span>
            <span aria-hidden="true">•</span>
            <span>Web Applications</span>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default HeroSection;
