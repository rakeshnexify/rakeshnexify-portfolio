import siteData from "../../data/siteData";
import Logo from "../ui/Logo";
import Container from "./Container";

const platformGroups = [
  {
    title: "Social",
    platforms: siteData.socialPlatforms,
  },
  {
    title: "Developer",
    platforms: siteData.developerPlatforms,
  },
  {
    title: "Freelance",
    platforms: siteData.freelancerPlatforms,
  },
];

function PlatformLink({ platform }) {
  const commonClasses =
    "rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold transition";

  if (!platform.url) {
    return (
      <span
        className={`${commonClasses} cursor-not-allowed text-slate-600`}
        title="Official link will be added soon"
      >
        {platform.name}
      </span>
    );
  }

  return (
    <a
      href={platform.url}
      target="_blank"
      rel="noreferrer"
      className={`${commonClasses} text-slate-400 hover:border-brand-500 hover:bg-brand-500/10 hover:text-white`}
    >
      {platform.name}
    </a>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <Container>
        <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.4fr_0.8fr_1fr_1.2fr]">
          <div>
            <a
              href="#home"
              aria-label={`Go to ${siteData.brand.name} homepage`}
              className="inline-flex"
            >
              <Logo showTagline textClassName="text-white" />
            </a>

            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
              {siteData.owner.introduction}
            </p>

            <p className="mt-4 text-sm text-slate-500">
              {siteData.contact.location}
            </p>

            <a
              href="#contact"
              className="mt-6 inline-flex text-sm font-semibold text-brand-500 transition hover:text-brand-400"
            >
              Start a project with me →
            </a>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Quick Links
            </h2>

            <ul className="mt-5 space-y-3">
              {siteData.navigation.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Services
            </h2>

            <ul className="mt-5 space-y-3">
              {siteData.services.map((service) => (
                <li key={service.id}>
                  <a
                    href="#services"
                    className="text-sm text-slate-400 transition hover:text-white"
                  >
                    {service.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Platforms
            </h2>

            <div className="mt-5 space-y-6">
              {platformGroups.map((group) => (
                <div key={group.title}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {group.title}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {group.platforms.map((platform) => (
                      <PlatformLink
                        key={platform.name}
                        platform={platform}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm leading-6 text-slate-500">
              Empty profile links are disabled until their official URLs are
              added in the central website data.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-800 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {siteData.brand.name}. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a
              href="#privacy"
              className="transition hover:text-white"
            >
              Privacy Policy
            </a>

            <a
              href="#terms"
              className="transition hover:text-white"
            >
              Terms
            </a>

            <a
              href="#contact"
              className="transition hover:text-white"
            >
              Contact
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;