import AppointmentForm from "../components/appointments/AppointmentForm";
import Container from "../components/layout/Container";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import useSiteSettings from "../hooks/useSiteSettings";

const DEFAULT_CONSULTATION_KEYWORDS = [
  "consultation",
  "web development consultation",
  "MERN consultation",
  "website consultation",
  "project consultation",
  "development services",
];

function normalizeSeoKeywords(value) {
  if (Array.isArray(value)) {
    return value
      .map((keyword) =>
        String(keyword || "").trim(),
      )
      .filter(Boolean);
  }

  return String(value || "")
    .split(/[,\n]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function getUniqueKeywords(keywords) {
  const seen = new Set();

  return keywords.filter((keyword) => {
    const normalizedKeyword =
      keyword.toLowerCase();

    if (seen.has(normalizedKeyword)) {
      return false;
    }

    seen.add(normalizedKeyword);

    return true;
  });
}

function ConsultationPage() {
  const { settings } = useSiteSettings();

  const brand =
    settings?.brand &&
    typeof settings.brand === "object"
      ? settings.brand
      : {};

  const seo =
    settings?.seo &&
    typeof settings.seo === "object"
      ? settings.seo
      : {};

  const brandName =
    String(brand.name || "").trim() ||
    "RakeshNexify";

  const globalSeoKeywords =
    normalizeSeoKeywords(seo.keywords);

  const seoKeywords = getUniqueKeywords([
    ...globalSeoKeywords,
    ...DEFAULT_CONSULTATION_KEYWORDS,
  ]);

  const socialSharingImage = String(
    seo.ogImageUrl || "",
  ).trim();

  const seoTitle = `Request a Consultation | ${brandName}`;

  const description =
    "Request a consultation for your website, MERN application, development, or project needs. Share your preferred schedule and project details for review.";

  return (
    <>
      <PageSeo
        title={seoTitle}
        description={description}
        keywords={seoKeywords}
        canonicalPath="/consultation"
        image={socialSharingImage}
        type="website"
        brandName={brandName}
      />

      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
          <div
            aria-hidden="true"
            className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-40 left-10 size-96 rounded-full bg-cyan-500/10 blur-3xl"
          />

          <Container>
            <div className="relative min-w-0 max-w-4xl">
              <p className="break-words text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                Consultation
              </p>

              <h1 className="mt-4 break-words text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Let&apos;s discuss your
                project
              </h1>

              <p className="mt-6 max-w-3xl break-words text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                Share what you want to build,
                improve, or manage and choose
                a preferred consultation time.
                Your request will be reviewed
                before the final schedule is
                confirmed.
              </p>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
              <div className="min-w-0">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
                    Before you send
                  </p>

                  <h2 className="mt-3 break-words text-3xl font-black tracking-tight text-slate-950">
                    A simple way to start the
                    conversation
                  </h2>

                  <p className="mt-4 break-words leading-7 text-slate-600">
                    Tell me about your project,
                    select a relevant Service
                    or package if you already
                    know what you need, and
                    choose the date and time
                    that work best for you.
                  </p>

                  <div className="mt-8 space-y-6">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
                        1
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-950">
                          Share your project
                        </h3>

                        <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                          Describe what you
                          need, your goals, and
                          any useful project
                          details.
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
                        2
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-950">
                          Choose your preference
                        </h3>

                        <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                          Select a preferred
                          consultation date,
                          time, timezone, and
                          meeting type.
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
                        3
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-950">
                          Wait for schedule
                          review
                        </h3>

                        <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                          Your preferred time
                          will be reviewed before
                          the consultation is
                          confirmed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-7">
                  <p className="text-sm font-bold text-amber-950">
                    Important scheduling note
                  </p>

                  <p className="mt-2 break-words text-sm leading-6 text-amber-900">
                    This form sends a
                    consultation request. The
                    date and time you choose
                    are your preference and are
                    not a guaranteed or
                    confirmed booking.
                  </p>
                </div>

                <div className="mt-6 rounded-3xl bg-slate-900 p-6 text-white sm:p-7">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-400">
                    What can we discuss?
                  </p>

                  <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                    <li className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-400"
                      />

                      <span>
                        New websites and MERN
                        applications
                      </span>
                    </li>

                    <li className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-400"
                      />

                      <span>
                        Existing website or
                        application improvements
                      </span>
                    </li>

                    <li className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-400"
                      />

                      <span>
                        Development packages and
                        ongoing management needs
                      </span>
                    </li>

                    <li className="flex gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-400"
                      />

                      <span>
                        Technical planning,
                        architecture, deployment,
                        and maintenance
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="min-w-0">
                <AppointmentForm />
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default ConsultationPage;