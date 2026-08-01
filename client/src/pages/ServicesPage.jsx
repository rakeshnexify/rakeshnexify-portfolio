import { useEffect, useMemo } from "react";
import { Link } from "react-router";

import Container from "../components/layout/Container";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import ServiceCard from "../components/services/ServiceCard";
import useServices from "../hooks/useServices";
import useSiteSettings from "../hooks/useSiteSettings";

const defaultPageContent = {
  eyebrow: "All Services",

  heading: "Complete development services for modern businesses and creators",

  description:
    "Explore all available website development, MERN application, WordPress and e-commerce services. Each service can be customised according to your business requirements.",
};

function sortServices(firstService, secondService) {
  const firstFeatured = Boolean(
    firstService?.isFeatured ?? firstService?.featured,
  );

  const secondFeatured = Boolean(
    secondService?.isFeatured ?? secondService?.featured,
  );

  const featuredDifference = Number(secondFeatured) - Number(firstFeatured);

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  return Number(firstService?.order || 0) - Number(secondService?.order || 0);
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Services could not be loaded.";
}

function ServicesLoadingState() {
  return (
    <>
      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <Container>
          <div className="py-16 sm:py-20">
            <div className="h-6 w-36 animate-pulse rounded-lg bg-slate-200" />

            <div className="mt-6 h-14 max-w-3xl animate-pulse rounded-xl bg-slate-200" />

            <div className="mt-5 h-24 max-w-2xl animate-pulse rounded-xl bg-slate-200" />

            <div className="mt-12 grid min-w-0 gap-7 [&>*]:min-w-0 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-96 animate-pulse rounded-3xl bg-slate-200"
                />
              ))}
            </div>
          </div>
        </Container>
      </main>
        <Footer />
    </>
  );
}

function ServicesErrorState({ error }) {
  return (
    <>
      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="grid min-h-[calc(100vh-5rem)] overflow-x-hidden place-items-center bg-slate-50 px-4 py-12"
      >
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-red-600">
            !
          </div>

          <p className="mt-6 break-words text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Services Error
          </p>

          <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-950">
            Services could not be loaded
          </h1>

          <p className="mt-4 break-words leading-7 text-slate-600">
            {getErrorMessage(error)}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-center text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
            >
              Return Home
            </Link>

            <Link
              to="/#contact"
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Contact Me
            </Link>
          </div>
        </div>
      </main>
        <Footer />
    </>
  );
}

function ServicesPage() {
  const { services: loadedServices, isLoading, error } = useServices();

  const { settings } = useSiteSettings();

  const brand = settings?.brand || {};

  const sectionContent = settings?.servicesSection || {};

  const brandName = String(brand.name || "").trim() || "RakeshNexify";

  const eyebrow =
    String(sectionContent.eyebrow || "").trim() || defaultPageContent.eyebrow;

  const heading =
    String(sectionContent.heading || sectionContent.title || "").trim() ||
    defaultPageContent.heading;

  const description =
    String(sectionContent.description || "").trim() ||
    defaultPageContent.description;

  const services = useMemo(() => {
    const sourceServices = Array.isArray(loadedServices) ? loadedServices : [];

    return [...sourceServices].sort(sortServices);
  }, [loadedServices]);

  useEffect(() => {
    const previousTitle = document.title;

    document.title = `Services | ${brandName}`;

    return () => {
      document.title = previousTitle;
    };
  }, [brandName]);

  if (isLoading && services.length === 0) {
    return <ServicesLoadingState />;
  }

  if (error && services.length === 0) {
    return <ServicesErrorState error={error} />;
  }

  return (
    <>
      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl" />

          <div className="absolute -bottom-40 left-10 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

          <Container>
            <div className="relative min-w-0 max-w-4xl">
              <p className="break-words text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                {eyebrow}
              </p>

              <h1 className="mt-4 break-words text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {heading}
              </h1>

              <p className="mt-6 max-w-3xl break-words text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {description}
              </p>

              <div className="mt-8 flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <span className="inline-flex max-w-full items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-center text-sm font-semibold text-slate-200">
                  {services.length}{" "}
                  {services.length === 1 ? "Public Service" : "Public Services"}
                </span>

                <Link
                  to="/#contact"
                  className="inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Discuss Your Project
                </Link>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            {error && services.length > 0 && (
              <div className="mb-8 min-w-0 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="break-words text-sm font-bold text-amber-800">
                  Saved services are being displayed
                </p>

                <p className="mt-1 break-words text-sm leading-6 text-amber-700">
                  The live Services API could not be reached.
                </p>
              </div>
            )}

            {services.length > 0 ? (
              <div className="grid min-w-0 gap-7 [&>*]:min-w-0 md:grid-cols-2 xl:grid-cols-3">
                {services.map((service, index) => (
                  <ServiceCard
                    key={
                      service._id ||
                      service.id ||
                      service.slug ||
                      `${service.title}-${index}`
                    }
                    service={service}
                    index={index}
                    actionLabel="Discuss this service"
                    actionHref="/#contact"
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                  0
                </div>

                <h2 className="mt-6 break-words text-2xl font-bold tracking-tight text-slate-950">
                  No public services available
                </h2>

                <p className="mx-auto mt-3 max-w-xl break-words leading-7 text-slate-600">
                  Services will appear here after they are created and published
                  from the Admin Panel.
                </p>

                <Link
                  to="/#contact"
                  className="mt-7 inline-flex min-h-11 max-w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Contact Me
                </Link>
              </div>
            )}
          </Container>
        </section>

        <section className="border-t border-slate-200 bg-white py-14">
          <Container>
            <div className="rounded-3xl bg-slate-950 px-6 py-10 text-center text-white sm:px-10">
              <p className="break-words text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                Custom Development
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl break-words text-2xl font-bold tracking-tight sm:text-4xl">
                Need a customised service package for your business?
              </h2>

              <p className="mx-auto mt-5 max-w-2xl break-words leading-7 text-slate-300">
                Share your business goals, required features and preferred
                technology. A suitable development solution can be prepared
                according to your requirements.
              </p>

              <Link
                to="/#contact"
                className="mt-7 inline-flex min-h-12 max-w-full items-center justify-center rounded-xl bg-brand-600 px-6 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Start Your Project
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default ServicesPage;
