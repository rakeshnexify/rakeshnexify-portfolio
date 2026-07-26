import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import Button from "../ui/Button";

const defaultHighlights = [
  {
    title: "MERN Stack",
    description: "Full-stack web applications",
  },
  {
    title: "WordPress",
    description: "Business and e-commerce websites",
  },
  {
    title: "Digital Brands",
    description: "Business and creator platforms",
  },
];

function getOwnerInitials(name) {
  if (!name) {
    return "RP";
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "RP";
}

function getAboutParagraphs(about) {
  if (Array.isArray(about?.paragraphs) && about.paragraphs.length > 0) {
    return about.paragraphs.filter(Boolean);
  }

  if (typeof about?.description === "string" && about.description.trim()) {
    return about.description
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  return [
    "I am a developer, creator and entrepreneur focused on building useful digital products and professional online experiences.",
  ];
}

function getHighlights(about) {
  if (!Array.isArray(about?.highlights) || about.highlights.length === 0) {
    return defaultHighlights;
  }

  return about.highlights
    .filter((highlight) => typeof highlight === "string" && highlight.trim())
    .map((highlight) => ({
      title: highlight.trim(),
      description: "",
    }));
}

function AboutSection() {
  const { settings } = useSiteSettings();

  const about = settings?.about || {};
  const owner = settings?.owner || {};
  const contact = settings?.contact || {};

  const ownerName = owner.name || "Rakesh Pandit";
  const professionalTitle = owner.professionalTitle || "MERN Stack Developer";
  const location = owner.location || "Kathmandu, Nepal";
  const availability =
    contact.availability || "Available for freelance and business projects";

  const profileImageUrl = owner.profileImageUrl || "";
  const resumeUrl = owner.resumeUrl || "";

  const aboutHeading = about.heading || about.title || "About Me";
  const aboutEyebrow = about.eyebrow || "About Me";

  const introduction =
    owner.introduction ||
    "Developer, creator and entrepreneur building modern digital products.";

  const paragraphs = getAboutParagraphs(about);
  const highlights = getHighlights(about);

  function openResume() {
    if (!resumeUrl) {
      return;
    }

    window.open(resumeUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Section
      id="about"
      className="scroll-mt-20 border-t border-slate-200 bg-white"
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-6 shadow-xl shadow-slate-200/70 sm:p-8">
              <div className="grid aspect-[4/5] place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-slate-950">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={ownerName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <div className="mx-auto grid size-28 place-items-center rounded-3xl border border-white/20 bg-white/10 text-4xl font-extrabold text-white backdrop-blur">
                      {getOwnerInitials(ownerName)}
                    </div>

                    <p className="mt-6 text-2xl font-bold text-white">
                      {ownerName}
                    </p>

                    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-300">
                      {professionalTitle}
                    </p>
                  </div>
                )}
              </div>

              {profileImageUrl && (
                <div className="mt-5 text-center">
                  <p className="text-xl font-bold text-white">{ownerName}</p>

                  <p className="mt-1 text-sm text-slate-400">
                    {professionalTitle}
                  </p>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Location
                  </p>

                  <p className="mt-2 text-sm font-semibold text-white">
                    {location}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Availability
                  </p>

                  <p className="mt-2 text-sm font-semibold text-emerald-400">
                    {availability}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -right-4 hidden rounded-2xl border border-brand-100 bg-white px-5 py-4 shadow-xl shadow-brand-600/10 sm:block">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Based in Nepal
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-950">
                Working with clients worldwide
              </p>
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow={aboutEyebrow}
              title={aboutHeading}
              description={introduction}
              align="left"
            />

            <div className="mt-8 space-y-5">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={`${paragraph}-${index}`}
                  className="text-base leading-8 text-slate-600"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {highlights.map((highlight, index) => (
                <div
                  key={`${highlight.title}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-lg font-bold text-slate-950">
                    {highlight.title}
                  </p>

                  {highlight.description && (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {highlight.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {resumeUrl && (
              <div className="mt-8">
                <Button variant="outline" size="large" onClick={openResume}>
                  View Resume
                </Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default AboutSection;
