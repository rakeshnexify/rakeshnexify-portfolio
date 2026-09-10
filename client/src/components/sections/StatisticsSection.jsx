import { useEffect, useMemo, useRef } from "react";

import useSiteSettings from "../../hooks/useSiteSettings";
import useStatistics from "../../hooks/useStatistics";
import Container from "../layout/Container";
import Section from "../layout/Section";
import StatisticCard from "../statistics/StatisticCard";

import PublicSectionEyebrow from "../layout/PublicSectionEyebrow";

const STATISTICS_LOOP_COPIES = 4;
function sortStatistics(firstStatistic, secondStatistic) {
  const firstOrder = Number(firstStatistic?.order);
  const secondOrder = Number(secondStatistic?.order);

  const safeFirstOrder = Number.isFinite(firstOrder) ? firstOrder : 0;
  const safeSecondOrder = Number.isFinite(secondOrder) ? secondOrder : 0;

  if (safeFirstOrder !== safeSecondOrder) {
    return safeFirstOrder - safeSecondOrder;
  }

  return String(firstStatistic?.label || "").localeCompare(
    String(secondStatistic?.label || ""),
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
  const trackRef = useRef(null);
  const animationFrameRef = useRef(0);
  const autoScrollPositionRef = useRef(0);

  const sectionContent = settings?.statisticsSection || {};

  const eyebrow =
    String(sectionContent.eyebrow || "").trim();

  const heading =
    String(sectionContent.heading || "").trim();

  const description =
    String(sectionContent.description || "").trim();

  const statistics = useMemo(() => {
    const sourceStatistics = Array.isArray(loadedStatistics)
      ? loadedStatistics
      : [];

    return [...sourceStatistics].sort(sortStatistics);
  }, [loadedStatistics]);

  const shouldAutoScroll = statistics.length > 1;

  const carouselStatistics = useMemo(() => {
    if (!shouldAutoScroll) {
      return statistics;
    }

    return Array.from(
      { length: STATISTICS_LOOP_COPIES },
      () => statistics,
    ).flat();
  }, [shouldAutoScroll, statistics]);

  useEffect(() => {
    const track = trackRef.current;

    if (!track || !shouldAutoScroll) {
      return undefined;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      return undefined;
    }

    const speedPixelsPerSecond = 24;
    let previousTimestamp = 0;

    autoScrollPositionRef.current = 0;
    track.scrollLeft = 0;

    function animate(timestamp) {
      if (!previousTimestamp) {
        previousTimestamp = timestamp;
      }

      const elapsedSeconds = Math.min(
        (timestamp - previousTimestamp) / 1000,
        0.05,
      );

      previousTimestamp = timestamp;

      const firstItem = track.children[0];
      const nextCycleItem = track.children[statistics.length];

      const loopWidth =
        firstItem && nextCycleItem
          ? nextCycleItem.offsetLeft - firstItem.offsetLeft
          : 0;

      if (
        loopWidth > 0 &&
        track.scrollWidth > track.clientWidth
      ) {
        autoScrollPositionRef.current +=
          speedPixelsPerSecond * elapsedSeconds;

        while (autoScrollPositionRef.current >= loopWidth) {
          autoScrollPositionRef.current -= loopWidth;
        }

        track.scrollLeft = autoScrollPositionRef.current;
      }

      animationFrameRef.current =
        window.requestAnimationFrame(animate);
    }

    animationFrameRef.current =
      window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [shouldAutoScroll, statistics.length]);

  if (!isLoading && !error && statistics.length === 0) {
    return null;
  }

  return (
    <Section
      id="statistics"
      className="public-statistics-section scroll-mt-20"
    >
      <div
        className="public-statistics-circuit public-statistics-circuit-left"
        aria-hidden="true"
      />
      <div
        className="public-statistics-circuit public-statistics-circuit-right"
        aria-hidden="true"
      />

      <Container>
        <div className="public-statistics-content">
          <header className="public-statistics-header">
            <PublicSectionEyebrow eyebrow={eyebrow} />

            <h2 className="public-statistics-heading">{heading}</h2>

            <p className="public-statistics-description">
              {description}
            </p>


          </header>

          <p aria-live="polite" className="sr-only">
            {isLoading
              ? "Loading statistics."
              : `${statistics.length} statistics loaded.`}
          </p>

          {error && (
            <div className="public-statistics-error">
              <div>
                <p className="font-bold">Statistics could not be loaded</p>
                <p className="mt-1 text-sm opacity-80">
                  Retry the live statistics request.
                </p>
              </div>

              <button
                type="button"
                onClick={refreshStatistics}
                disabled={isLoading}
              >
                {isLoading ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}

          {isLoading && statistics.length === 0 && (
            <div
              className="public-statistics-track public-statistics-track-loading"
              aria-label="Loading portfolio statistics"
            >
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="public-statistic-skeleton"
                />
              ))}
            </div>
          )}

          {statistics.length > 0 && (
            <div className="public-statistics-row-shell">
              <span className="public-statistics-count">
                {String(statistics.length).padStart(2, "0")} metrics
              </span>

              <div
                ref={trackRef}
                className="public-statistics-track"
                aria-label="Portfolio statistics"
              >
                {carouselStatistics.map((statistic, index) => {
                  const isDuplicate =
                    shouldAutoScroll && index >= statistics.length;

                  return (
                    <div
                      key={`${
                        statistic._id ||
                        statistic.key ||
                        statistic.label ||
                        "statistic"
                      }-${index}`}
                      aria-hidden={isDuplicate ? "true" : undefined}
                    >
                      <StatisticCard
                        statistic={statistic}
                        index={index % statistics.length}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

export default StatisticsSection;
