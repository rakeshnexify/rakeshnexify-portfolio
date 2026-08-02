import { useMemo } from "react";
import { Link } from "react-router";

import useSiteSettings from "../../hooks/useSiteSettings";
import useStatistics from "../../hooks/useStatistics";
import Container from "../layout/Container";
import ResponsiveCardRow from "../layout/ResponsiveCardRow";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import StatisticCard from "../statistics/StatisticCard";

const defaultSectionContent = {
  eyebrow: "Impact in Numbers",

  heading: "Experience, projects and progress at a glance",

  description:
    "A quick overview of the work, technologies, content and business experience behind RakeshNexify.",

  ctaButton: {
    label: "View All Statistics",
    url: "/statistics",
  },
};

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const characterCode = text.charCodeAt(index);

    if (characterCode <= 31 || characterCode === 127) {
      return true;
    }
  }

  return false;
}

function getSafePublicUrl(value, fallbackUrl = "/statistics") {
  const url = String(value || "").trim();

  if (!url || containsControlCharacters(url)) {
    return fallbackUrl;
  }

  if (/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(url)) {
    return url;
  }

  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return url;
    }
  } catch {
    return fallbackUrl;
  }

  return fallbackUrl;
}

function sortStatisticsForPreview(firstStatistic, secondStatistic) {
  const firstFeatured = Boolean(firstStatistic?.isFeatured);

  const secondFeatured = Boolean(secondStatistic?.isFeatured);

  const featuredDifference = Number(secondFeatured) - Number(firstFeatured);

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  const firstOrder = Number(firstStatistic?.order || 0);

  const secondOrder = Number(secondStatistic?.order || 0);

  return firstOrder - secondOrder;
}

function DynamicActionLink({ url, children, className = "" }) {
  const safeUrl = getSafePublicUrl(url);

  if (safeUrl.startsWith("http://") || safeUrl.startsWith("https://")) {
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }

  if (safeUrl.startsWith("/")) {
    return (
      <Link to={safeUrl} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={safeUrl} className={className}>
      {children}
    </a>
  );
}

function StatisticsSection() {
  const {
    statistics: loadedStatistics,
    isLoading,
    error,
    refreshStatistics,
  } = useStatistics();

  const { settings } = useSiteSettings();

  const sectionContent = settings?.statisticsSection || {};

  const eyebrow =
    String(sectionContent.eyebrow || "").trim() ||
    defaultSectionContent.eyebrow;

  const heading =
    String(sectionContent.heading || sectionContent.title || "").trim() ||
    defaultSectionContent.heading;

  const description =
    String(sectionContent.description || "").trim() ||
    defaultSectionContent.description;

  const ctaButton = sectionContent.ctaButton || sectionContent.action || {};

  const ctaLabel =
    String(ctaButton.label || "").trim() ||
    defaultSectionContent.ctaButton.label;

  const ctaUrl = getSafePublicUrl(
    ctaButton.url || ctaButton.href,
    defaultSectionContent.ctaButton.url,
  );

  const statistics = useMemo(() => {
    const sourceStatistics = Array.isArray(loadedStatistics)
      ? loadedStatistics
      : [];

    return [...sourceStatistics].sort(sortStatisticsForPreview);
  }, [loadedStatistics]);

  const previewStatistics = statistics.slice(0, 3);

  if (!isLoading && !error && statistics.length === 0) {
    return null;
  }

  return (
    <Section
      id="statistics"
      className="scroll-mt-20 border-t border-slate-200 bg-white"
    >
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={heading}
          description={description}
        />

        <p aria-live="polite" className="sr-only">
          {isLoading
            ? "Loading statistics."
            : `${statistics.length} statistics loaded.`}
        </p>

        {error && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-800">
                Portfolio statistics could not be loaded
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                Please retry the live Statistics API request.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshStatistics}
              disabled={isLoading}
              className="inline-flex min-h-10 max-w-full shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-center text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Retrying..." : "Retry Statistics"}
            </button>
          </div>
        )}

        {isLoading && statistics.length === 0 && (
          <ResponsiveCardRow
            desktopColumns={3}
            ariaLabel="Loading portfolio statistics"
            className="mt-10"
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </ResponsiveCardRow>
        )}

        {previewStatistics.length > 0 && (
          <ResponsiveCardRow
            desktopColumns={3}
            ariaLabel="Portfolio statistics"
            className="mt-10"
          >
            {previewStatistics.map((statistic, index) => (
              <StatisticCard
                key={
                  statistic._id ||
                  statistic.key ||
                  `${statistic.label}-${index}`
                }
                statistic={statistic}
                compact
              />
            ))}
          </ResponsiveCardRow>
        )}

        {previewStatistics.length > 0 && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-bold text-slate-950">
                Explore the complete portfolio impact
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                The homepage shows selected statistics only. Open the complete
                Statistics page to view every published achievement and number.
              </p>
            </div>

            <DynamicActionLink
              url={ctaUrl}
              className="inline-flex min-h-11 max-w-full shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {ctaLabel} →
            </DynamicActionLink>
          </div>
        )}
      </Container>
    </Section>
  );
}

export default StatisticsSection;
