import { useCallback, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router";

import Container from "../components/layout/Container";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import { mergeHomepageSections } from "../config/homepageSections";
import DesignPreviewGallery from "../components/services/pricing/DesignPreviewGallery";
import PackageComparison from "../components/services/pricing/PackageComparison";
import PackageDesignSelector from "../components/services/pricing/PackageDesignSelector";
import PackageOrderActions from "../components/services/pricing/PackageOrderActions";
import ServicePricingSidebar from "../components/services/pricing/ServicePricingSidebar";
import ServiceOverviewCard from "../components/services/pricing/ServiceOverviewCard";
import usePackageDesigns from "../hooks/usePackageDesigns";
import useServicePackages from "../hooks/useServicePackages";
import useServices from "../hooks/useServices";
import useSiteSettings from "../hooks/useSiteSettings";

const defaultPageContent = {
  eyebrow: "Services & Pricing",
  heading: "Choose a service, compare packages and preview your design",
  description:
    "Explore development and management packages for each service, compare included features and open responsive design previews before starting your project.",
};

const defaultServiceKeywords = [
  "MERN development services",
  "WordPress development services",
  "custom website development",
  "web application development",
  "full stack development",
  "business website development",
  "React development",
  "Node.js development",
  "MongoDB development",
  "e-commerce development",
  "website pricing packages",
];

const validGroups = new Set(["development", "management"]);

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

function sortPackages(firstPackage, secondPackage) {
  const featuredDifference =
    Number(Boolean(secondPackage?.isFeatured)) -
    Number(Boolean(firstPackage?.isFeatured));

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  const orderDifference =
    Number(firstPackage?.order || 0) - Number(secondPackage?.order || 0);

  if (orderDifference !== 0) {
    return orderDifference;
  }

  return String(firstPackage?._id || "").localeCompare(
    String(secondPackage?._id || ""),
  );
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
        className="min-h-screen overflow-x-clip bg-slate-50"
      >
        <Container>
          <div className="py-16 sm:py-20">
            <div className="h-6 w-36 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-6 h-14 max-w-3xl animate-pulse rounded-xl bg-slate-200" />
            <div className="mt-5 h-24 max-w-2xl animate-pulse rounded-xl bg-slate-200" />

            <div className="mt-12 grid gap-7 lg:grid-cols-[18rem_minmax(0,1fr)]">
              <div className="h-[34rem] animate-pulse rounded-3xl bg-slate-200" />
              <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="h-96 animate-pulse rounded-3xl bg-slate-200"
                  />
                ))}
              </div>
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
        className="grid min-h-[calc(100vh-5rem)] overflow-x-clip place-items-center bg-slate-50 px-4 py-12"
      >
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-red-600">
            !
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            Services Error
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Services could not be loaded
          </h1>

          <p className="mt-4 leading-7 text-slate-600">
            {getErrorMessage(error)}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-600 hover:text-brand-600"
            >
              Return Home
            </Link>

            <Link
              to="/#contact"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
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

function PackageLoadingState() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-[30rem] animate-pulse rounded-3xl bg-slate-200"
        />
      ))}
    </div>
  );
}

function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { services: loadedServices, isLoading, error } = useServices();
  const { settings } = useSiteSettings();

  const sectionsByKey = useMemo(() => {
    return new Map(
      mergeHomepageSections(settings?.sections).map((section) => [
        section.key,
        section,
      ]),
    );
  }, [settings?.sections]);

  const isConsultationPageVisible =
    sectionsByKey.get("consultation")?.isPageVisible !== false;

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

  const seo =
    settings?.seo && typeof settings.seo === "object" ? settings.seo : {};

  const globalSeoKeywords = Array.isArray(seo.keywords)
    ? seo.keywords
    : String(seo.keywords || "")
        .split(/[,\n]/)
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  const seoKeywords = [...globalSeoKeywords, ...defaultServiceKeywords];
  const socialSharingImage = String(seo.ogImageUrl || "").trim();
  const seoTitle = `Services & Pricing | ${brandName}`;

  const services = useMemo(() => {
    const sourceServices = Array.isArray(loadedServices) ? loadedServices : [];

    return [...sourceServices].sort(sortServices);
  }, [loadedServices]);

  const requestedServiceSlug = String(searchParams.get("service") || "").trim();
  const requestedGroupValue = String(searchParams.get("group") || "").trim();
  const requestedGroup = validGroups.has(requestedGroupValue)
    ? requestedGroupValue
    : "";
  const requestedPackageSlug = String(
    searchParams.get("package") || "",
  ).trim();
  const requestedDesignSlug = String(searchParams.get("design") || "").trim();

  const selectedService = useMemo(
    () =>
      services.find(
        (service) => String(service?.slug || "") === requestedServiceSlug,
      ) || null,
    [requestedServiceSlug, services],
  );

  const {
    servicePackages,
    isLoading: packagesLoading,
    error: packagesError,
  } = useServicePackages({
    service: selectedService?.slug || "",
    enabled: Boolean(selectedService),
  });

  const sortedServicePackages = useMemo(
    () => [...servicePackages].sort(sortPackages),
    [servicePackages],
  );

  const selectedPackage = useMemo(() => {
    if (!requestedPackageSlug) {
      return null;
    }

    const candidates = sortedServicePackages.filter(
      (servicePackage) => servicePackage?.slug === requestedPackageSlug,
    );

    if (requestedGroup) {
      return (
        candidates.find(
          (servicePackage) => servicePackage?.group === requestedGroup,
        ) || null
      );
    }

    return candidates[0] || null;
  }, [requestedGroup, requestedPackageSlug, sortedServicePackages]);

  const activeGroup = requestedGroup || selectedPackage?.group || "";

  const {
    packageDesigns,
    isLoading: designsLoading,
    error: designsError,
  } = usePackageDesigns({
    service: selectedService?.slug || "",
    group: selectedPackage?.group || "",
    packageSlug: selectedPackage?.slug || "",
    enabled: Boolean(selectedService && selectedPackage),
  });

  const selectedDesign = useMemo(
    () =>
      packageDesigns.find(
        (design) => design?.slug === requestedDesignSlug,
      ) || null,
    [packageDesigns, requestedDesignSlug],
  );

  const updatePricingParams = useCallback(
    (updates, { replace = false } = {}) => {
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(updates).forEach(([key, value]) => {
        const cleanValue = String(value ?? "").trim();

        if (cleanValue) {
          nextParams.set(key, cleanValue);
        } else {
          nextParams.delete(key);
        }
      });

      setSearchParams(nextParams, {
        replace,
        preventScrollReset: true,
      });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (
      isLoading ||
      !requestedServiceSlug ||
      selectedService
    ) {
      return;
    }

    updatePricingParams(
      {
        service: "",
        group: "",
        package: "",
        design: "",
      },
      {
        replace: true,
      },
    );
  }, [
    isLoading,
    requestedServiceSlug,
    selectedService,
    updatePricingParams,
  ]);

  function handleSelectService(serviceSlug) {
    updatePricingParams({
      service: serviceSlug,
      group: "",
      package: "",
      design: "",
    });
  }

  function handleSelectGroup(group) {
    updatePricingParams({
      group,
      package: "",
      design: "",
    });
  }

  function handleSelectPackage(servicePackage) {
    updatePricingParams({
      service: selectedService?.slug || "",
      group: servicePackage?.group || "",
      package: servicePackage?.slug || "",
      design: "",
    });
  }

  function handleSelectDesign(design) {
    updatePricingParams({
      design: design?.slug || "",
    });
  }

  function handleChangePackage() {
    updatePricingParams({
      package: "",
      design: "",
    });
  }

  const packagesByGroup = useMemo(
    () => ({
      development: sortedServicePackages.filter(
        (servicePackage) => servicePackage?.group === "development",
      ),
      management: sortedServicePackages.filter(
        (servicePackage) => servicePackage?.group === "management",
      ),
    }),
    [sortedServicePackages],
  );

  const groupsToRender = useMemo(() => {
    if (activeGroup) {
      return [activeGroup];
    }

    const availableGroups = ["development", "management"].filter(
      (group) => packagesByGroup[group].length > 0,
    );

    return availableGroups.length > 0
      ? availableGroups
      : ["development", "management"];
  }, [activeGroup, packagesByGroup]);

  if (isLoading && services.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/services"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <ServicesLoadingState />
      </>
    );
  }

  if (error && services.length === 0) {
    return (
      <>
        <PageSeo
          title={seoTitle}
          description={description}
          keywords={seoKeywords}
          canonicalPath="/services"
          image={socialSharingImage}
          type="website"
          brandName={brandName}
        />

        <ServicesErrorState error={error} />
      </>
    );
  }

  return (
    <>
      <PageSeo
        title={seoTitle}
        description={description}
        keywords={seoKeywords}
        canonicalPath="/services"
        image={socialSharingImage}
        type="website"
        brandName={brandName}
      />

      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-clip bg-slate-50"
      >
        <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute -bottom-40 left-10 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

          <Container>
            <div className="relative min-w-0 max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                {eyebrow}
              </p>

              <h1 className="mt-4 break-words text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {heading}
              </h1>

              <p className="mt-6 max-w-3xl break-words text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                  {services.length}{" "}
                  {services.length === 1 ? "Public Service" : "Public Services"}
                </span>

                {selectedService && (
                  <span className="inline-flex items-center justify-center rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-200">
                    Viewing {selectedService.title}
                  </span>
                )}

                <Link
                  to="/#contact"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Discuss Your Project
                </Link>
              </div>
            </div>
          </Container>
        </section>

        <section className="py-10 sm:py-14">
          <Container>
            {error && services.length > 0 && (
              <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-bold text-amber-800">
                  Saved services are being displayed
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-700">
                  The live Services API could not be reached.
                </p>
              </div>
            )}

            <div className="grid min-w-0 gap-7 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[19rem_minmax(0,1fr)]">
              <ServicePricingSidebar
                services={services}
                selectedServiceSlug={selectedService?.slug || ""}
                selectedServiceTitle={selectedService?.title || ""}
                activeGroup={activeGroup}
                servicePackages={sortedServicePackages}
                onSelectService={handleSelectService}
                onSelectGroup={handleSelectGroup}
              />

              <div className="min-w-0">
                {!selectedService ? (
                  <>
                    <div className="mb-7">
                      <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
                        All Services
                      </p>

                      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                        Choose the service you need
                      </h2>

                      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                        Select a service to open its Development and Management
                        packages, compare features and preview available
                        designs.
                      </p>
                    </div>

                    {services.length > 0 ? (
                      <div className="grid min-w-0 gap-7 md:grid-cols-2 xl:grid-cols-3">
                        {services.map((service, index) => (
                          <ServiceOverviewCard
                            key={
                              service._id ||
                              service.id ||
                              service.slug ||
                              `${service.title}-${index}`
                            }
                            service={service}
                            index={index}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                          0
                        </div>

                        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
                          No public services available
                        </h2>

                        <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                          Services will appear here after they are created and
                          published from the Admin Panel.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {packagesError && (
                      <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
                        Service Packages could not be loaded. {packagesError}
                      </div>
                    )}

                    {packagesLoading ? (
                      <div className="mt-7">
                        <PackageLoadingState />
                      </div>
                    ) : selectedPackage ? (
                      <div className="space-y-6">
                        <section className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-lg font-black text-emerald-700">
                                ✓
                              </span>

                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                                  Selected Package
                                </p>

                                <h2 className="truncate text-xl font-black text-slate-950 sm:text-2xl">
                                  {selectedPackage.name}
                                </h2>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleChangePackage}
                              className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 sm:px-4 sm:text-sm"
                            >
                              Change Package
                            </button>
                          </div>
                        </section>

                        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                          <div className="mb-5 flex items-center gap-3">
                            <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-sm font-black text-white">
                              2
                            </span>

                            <h2 className="text-xl font-black text-slate-950 sm:text-2xl">
                              Choose Design
                            </h2>
                          </div>

                          <PackageDesignSelector
                            packageName={selectedPackage.name}
                            designs={packageDesigns}
                            selectedDesignSlug={selectedDesign?.slug || ""}
                            isLoading={designsLoading}
                            error={designsError}
                            onSelectDesign={handleSelectDesign}
                          />

                          {selectedDesign && (
                            <div className="mt-6">
                              <DesignPreviewGallery design={selectedDesign} />
                            </div>
                          )}
                        </section>

                        {selectedDesign && (
                          <PackageOrderActions
                            brandName={brandName}
                            service={selectedService}
                            servicePackage={selectedPackage}
                            design={selectedDesign}
                            whatsapp={settings?.contact?.whatsapp || ""}
                            consultationEnabled={isConsultationPageVisible}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-12">
                        {groupsToRender.map((group) => {
                          const groupPackages = packagesByGroup[group];
                          const groupLabel =
                            group === "development"
                              ? "Development Packages"
                              : "Management Packages";

                          return (
                            <section
                              key={group}
                              id={`packages-${group}`}
                              className="scroll-mt-24"
                            >
                              <div className="mb-5 flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
                                    {groupLabel}
                                  </p>

                                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                                    Choose Package
                                  </h2>
                                </div>

                                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                                  {groupPackages.length}
                                </span>
                              </div>

                              {groupPackages.length > 0 ? (
                                <PackageComparison
                                  servicePackages={groupPackages}
                                  selectedPackageSlug=""
                                  onSelectPackage={handleSelectPackage}
                                />
                              ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">
                                  No public packages yet.
                                </div>
                              )}
                            </section>
                          );
                        })}

                        {!packagesError &&
                          sortedServicePackages.length === 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                              <p className="font-bold text-slate-950">
                                Packages are being prepared.
                              </p>
                            </div>
                          )}
                      </div>
                    )}

                  </>
                )}
              </div>
            </div>
          </Container>
        </section>

        <section className="border-t border-slate-200 bg-white py-14">
          <Container>
            <div className="rounded-3xl bg-slate-950 px-6 py-10 text-center text-white sm:px-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                Custom Requirements
              </p>

              <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-bold tracking-tight sm:text-4xl">
                Need a customised package for your business?
              </h2>

              <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">
                Share your business goals, required features and preferred
                technology. A suitable package can be prepared according to
                your requirements.
              </p>

              <Link
                to="/#contact"
                className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
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
