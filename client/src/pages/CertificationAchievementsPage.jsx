import { useMemo, useState } from "react";

import CertificationAchievementCard, {
  certificationAchievementTypeLabels,
  getSafeHttpUrl,
} from "../components/certification-achievements/CertificationAchievementCard";
import Container from "../components/layout/Container";
import PublicPageCTA from "../components/layout/PublicPageCTA";
import Footer from "../components/layout/Footer";
import PublicPageHeader from "../components/layout/PublicPageHeader";
import PageSeo from "../components/seo/PageSeo";
import useCertificationAchievements from "../hooks/useCertificationAchievements";
import useSiteSettings from "../hooks/useSiteSettings";

const SITE_URL = "https://rakeshnexify.com";

const publicTypes = [
  "",
  "certification",
  "license",
  "award",
  "achievement",
];

const defaultPageContent = {
  eyebrow: "Credentials & Recognition",
  heading: "Certifications & Achievements",
  description:
    "Explore professional certifications, licenses, awards and achievements that demonstrate verified learning, practical capability and recognition.",
};

const defaultKeywords = [
  "RakeshNexify certifications",
  "Rakesh Pandit certifications",
  "developer certifications",
  "professional achievements",
  "developer awards",
  "software developer credentials",
  "MERN developer certification",
  "web developer achievements",
];

function createStructuredDate(value) {
  const cleanValue = String(value || "").slice(0, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(cleanValue) ? cleanValue : "";
}

function getStructuredImageUrl(value) {
  const mediaUrl = getSafeHttpUrl(value);

  if (!mediaUrl) {
    return "";
  }

  try {
    const pathname = new URL(mediaUrl).pathname.toLowerCase();

    return /\.(?:jpe?g|png|webp|avif|gif|svg)$/.test(pathname)
      ? mediaUrl
      : "";
  } catch {
    return "";
  }
}

function CertificationAchievementsPage() {
  const [selectedType, setSelectedType] = useState("");

  const {
    achievementRecords,
    isLoading,
    error,
    refreshCertificationAchievements,
  } = useCertificationAchievements({
    type: selectedType,
  });

  const { settings } = useSiteSettings();

  const sectionContent = settings?.achievementsSection || {};
  const brand = settings?.brand || {};
  const owner = settings?.owner || {};
  const seo = settings?.seo || {};

  const brandName = String(brand.name || "").trim() || "RakeshNexify";
  const ownerName = String(owner.name || "").trim() || "Rakesh Pandit";

  const eyebrow =
    String(sectionContent.eyebrow || "").trim() ||
    defaultPageContent.eyebrow;

  const heading =
    String(sectionContent.heading || sectionContent.title || "").trim() ||
    defaultPageContent.heading;

  const description =
    String(sectionContent.description || "").trim() ||
    defaultPageContent.description;

  const globalSeoKeywords = Array.isArray(seo.keywords)
    ? seo.keywords
    : String(seo.keywords || "")
        .split(/[,\n]/)
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  const seoKeywords = [...globalSeoKeywords, ...defaultKeywords];
  const socialSharingImage = String(seo.ogImageUrl || "").trim();

  const records = Array.isArray(achievementRecords)
    ? achievementRecords
    : [];


  const pageTitle = `Certifications & Achievements | ${brandName}`;

  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: pageTitle,
      headline: heading,
      description,
      url: `${SITE_URL}/achievements`,
      isPartOf: {
        "@type": "WebSite",
        name: brandName,
        url: `${SITE_URL}/`,
      },
      about: {
        "@type": "Person",
        name: ownerName,
      },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: records.length,
        itemListElement: records.map((record, index) => {
          const verificationUrl = getSafeHttpUrl(record?.verificationUrl);
          const structuredImageUrl = getStructuredImageUrl(record?.mediaUrl);
          const issueDate = createStructuredDate(record?.issueDate);
          const expirationDate = createStructuredDate(record?.expirationDate);

          return {
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type":
                record?.type === "certification" ||
                record?.type === "license"
                  ? "EducationalOccupationalCredential"
                  : "Thing",
              name: String(record?.title || "").trim(),
              description: String(
                record?.shortDescription || record?.description || "",
              ).trim(),
              ...(record?.issuerName
                ? {
                    provider: {
                      "@type": "Organization",
                      name: String(record.issuerName).trim(),
                    },
                  }
                : {}),
              ...(issueDate ? { dateCreated: issueDate } : {}),
              ...(expirationDate ? { expires: expirationDate } : {}),
              ...(verificationUrl ? { url: verificationUrl } : {}),
              ...(structuredImageUrl ? { image: structuredImageUrl } : {}),
            },
          };
        }),
      },
    }),
    [
      brandName,
      description,
      heading,
      ownerName,
      pageTitle,
      records,
    ],
  );

  return (
    <>
      <PageSeo
        title={pageTitle}
        description={description}
        keywords={seoKeywords}
        canonicalPath="/achievements"
        image={socialSharingImage}
        type="website"
        brandName={brandName}
        structuredData={structuredData}
      />

      <PublicPageHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen overflow-x-hidden bg-slate-50"
      >
        <section className="relative overflow-hidden bg-slate-950 py-16 text-white sm:py-20">
          <div className="absolute -right-32 -top-32 size-96 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute -bottom-40 left-10 size-96 rounded-full bg-amber-400/10 blur-3xl" />

          <Container>
            <div className="relative max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-400">
                {eyebrow}
              </p>

              <h1 className="mt-4 break-words text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {heading}
              </h1>

              <p className="mt-6 max-w-3xl break-words text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
                  {records.length} published record
                  {records.length === 1 ? "" : "s"}
                </span>

                {selectedType && (
                  <span className="rounded-full border border-brand-400/20 bg-brand-400/10 px-4 py-2 text-sm font-semibold text-brand-200">
                    {certificationAchievementTypeLabels[selectedType] ||
                      selectedType}
                  </span>
                )}
              </div>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            <div className="flex flex-wrap gap-3">
              {publicTypes.map((type) => (
                <button
                  key={type || "all"}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
                    selectedType === type
                      ? "bg-brand-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-600"
                  }`}
                >
                  {type
                    ? certificationAchievementTypeLabels[type] || type
                    : "All"}
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Certifications & Achievements could not be loaded
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-700">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshCertificationAchievements}
                  disabled={isLoading}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                >
                  {isLoading ? "Retrying..." : "Retry"}
                </button>
              </div>
            )}

            {isLoading && records.length === 0 && (
              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="h-[34rem] animate-pulse rounded-3xl bg-slate-200"
                  />
                ))}
              </div>
            )}

            {!isLoading && !error && records.length === 0 && (
              <div className="mt-10 rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-50 text-2xl font-black text-brand-600">
                  0
                </div>

                <h2 className="mt-6 text-2xl font-bold text-slate-950">
                  No published records found
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
                  Try another type filter or return later when more
                  Certifications & Achievements are published.
                </p>
              </div>
            )}

            {records.length > 0 && (
              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {records.map((record) => (
                  <CertificationAchievementCard
                    key={record._id || record.id || record.slug}
                    achievement={record}
                  />
                ))}
              </div>
            )}
          </Container>
        </section>

        <PublicPageCTA
          ctaKey="certificationAchievements"
        />
      </main>

      <Footer />
    </>
  );
}

export default CertificationAchievementsPage;
