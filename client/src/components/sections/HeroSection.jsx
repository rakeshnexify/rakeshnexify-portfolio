import siteData from "../../data/siteData";
import Container from "../layout/Container";
import Section from "../layout/Section";
import Button from "../ui/Button";
import Logo from "../ui/Logo";

function HeroSection() {
  const { hero } = siteData;

  function goToSection(href) {
    window.location.hash = href.replace("#", "");
  }

  return (
    <Section
      id="home"
      className="flex min-h-[calc(100vh-5rem)] scroll-mt-20 items-center"
    >
      <Container>
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-xl shadow-slate-200/60 sm:px-10 sm:py-20 lg:px-16">
          <div className="mb-10 flex justify-center">
            <Logo showTagline />
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-600">
            {hero.eyebrow}
          </p>

          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            {hero.title}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {hero.description}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="large"
              onClick={() => goToSection(hero.primaryAction.href)}
            >
              {hero.primaryAction.label}
            </Button>

            <Button
              variant="secondary"
              size="large"
              onClick={() => goToSection(hero.secondaryAction.href)}
            >
              {hero.secondaryAction.label}
            </Button>

            <Button
              variant="outline"
              size="large"
              onClick={() => goToSection("#about")}
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