import siteData from "../../data/siteData";
import useSiteSettings from "../../hooks/useSiteSettings";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import ContactForm from "./contact/ContactForm";

function ContactDetail({ label, value, href, icon }) {
  if (!value) {
    return null;
  }

  const content = (
    <>
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-900">
          {value}
        </p>
      </div>
    </>
  );

  if (!href) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {content}
      </div>
    );
  }

  const isExternalLink = href.startsWith("http");

  return (
    <a
      href={href}
      target={isExternalLink ? "_blank" : undefined}
      rel={isExternalLink ? "noopener noreferrer" : undefined}
      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-brand-200 hover:bg-brand-50/50"
    >
      {content}
    </a>
  );
}

function PlatformLink({ platform }) {
  if (!platform?.url) {
    return (
      <span
        title={`${platform?.name || "Platform"} link will be added soon`}
        className="inline-flex cursor-not-allowed items-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400"
      >
        {platform?.name || "Platform"}
      </span>
    );
  }

  return (
    <a
      href={platform.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
    >
      {platform.name}
    </a>
  );
}

function ContactSection() {
  const { settings } = useSiteSettings();

  const contact = settings?.contact || siteData.contact || {};

  const socialPlatforms = siteData.socialPlatforms || [];
  const developerPlatforms = siteData.developerPlatforms || [];
  const freelancerPlatforms = siteData.freelancerPlatforms || [];

  const email = String(contact.email || "").trim();
  const phone = String(contact.phone || "").trim();
  const whatsapp = String(contact.whatsapp || "").trim();
  const location = String(contact.location || "").trim();

  const availability =
    String(contact.availability || "").trim() ||
    "Available for freelance and business projects";

  const emailHref = email ? `mailto:${email}` : "";

  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : "";

  const whatsappNumber = whatsapp.replace(/\D/g, "");

  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "";

  return (
    <Section
      id="contact"
      className="scroll-mt-20 border-t border-slate-200 bg-white"
    >
      <Container>
        <SectionHeading
          eyebrow="Contact Me"
          title="Let us discuss your next digital project"
          description="Share your requirements for a business website, MERN application, WordPress website, e-commerce store or long-term development support."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
                Project Enquiries
              </p>

              <h3 className="mt-3 text-3xl font-bold tracking-tight">
                Ready to build something useful?
              </h3>

              <p className="mt-4 leading-7 text-slate-400">
                Explain your idea, required features, preferred technology and
                expected timeline. I will review the project details and reply
                through an available contact method.
              </p>

              <div className="mt-7 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <span className="size-3 shrink-0 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />

                <p className="text-sm font-semibold text-emerald-300">
                  {availability}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <ContactDetail
                label="Email"
                value={email}
                href={emailHref}
                icon={
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M4 6h16v12H4z" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                }
              />

              <ContactDetail
                label="Phone"
                value={phone}
                href={phoneHref}
                icon={
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M6.5 4h3l1.5 4-2 1.5a15 15 0 0 0 5.5 5.5l1.5-2 4 1.5v3c0 1.1-.9 2-2 2C10 19.5 4.5 14 4.5 6c0-1.1.9-2 2-2Z" />
                  </svg>
                }
              />

              <ContactDetail
                label="WhatsApp"
                value={whatsapp}
                href={whatsappHref}
                icon={
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.5Z" />
                    <path d="M9 8.5c.5 2.5 2 4 4.5 4.8" />
                  </svg>
                }
              />

              <ContactDetail
                label="Location"
                value={location}
                icon={
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 5-8 10-8 10S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                }
              />
            </div>
          </div>

          <ContactForm />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
              Social Media
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {socialPlatforms.map((platform) => (
                <PlatformLink key={platform.name} platform={platform} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
              Developer Profiles
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {developerPlatforms.map((platform) => (
                <PlatformLink key={platform.name} platform={platform} />
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
              Freelancer Profiles
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {freelancerPlatforms.map((platform) => (
                <PlatformLink key={platform.name} platform={platform} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export default ContactSection;
