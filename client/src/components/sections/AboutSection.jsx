import siteData from "../../data/siteData";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";

function AboutSection() {
  const { about, owner, contact } = siteData;

  return (
    <Section
      id="about"
      className="scroll-mt-20 border-t border-slate-200 bg-white"
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-6 shadow-xl shadow-slate-200/70 sm:p-8">
              <div className="grid aspect-[4/5] place-items-center rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-slate-950">
                <div className="text-center">
                  <div className="mx-auto grid size-28 place-items-center rounded-3xl border border-white/20 bg-white/10 text-4xl font-extrabold text-white backdrop-blur">
                    RP
                  </div>

                  <p className="mt-6 text-2xl font-bold text-white">
                    {owner.name}
                  </p>

                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-300">
                    {owner.professionalTitle}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Location
                  </p>

                  <p className="mt-2 text-sm font-semibold text-white">
                    {owner.location}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Availability
                  </p>

                  <p className="mt-2 text-sm font-semibold text-emerald-400">
                    {contact.availability}
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
              eyebrow={about.eyebrow}
              title={about.title}
              description={owner.introduction}
              align="left"
            />

            <div className="mt-8 space-y-5">
              {about.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-base leading-8 text-slate-600"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-bold text-slate-950">
                  MERN Stack
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Full-stack web applications
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-bold text-slate-950">
                  WordPress
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Business and e-commerce websites
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-lg font-bold text-slate-950">
                  Digital Brands
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Business and creator platforms
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default AboutSection;