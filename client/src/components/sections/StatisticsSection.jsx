import { useEffect, useMemo, useRef } from "react";

import useSiteSettings from "../../hooks/useSiteSettings";
import useStatistics from "../../hooks/useStatistics";
import Container from "../layout/Container";
import Section from "../layout/Section";
import StatisticCard from "../statistics/StatisticCard";

const defaultSectionContent = {
  eyebrow: "OUR IMPACT IN NUMBERS",
  heading: "Building Solutions. Delivering Success.",
  description:
    "Numbers that reflect our commitment to quality, innovation, and client satisfaction.",
};

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
  const rowShellRef = useRef(null);
  const animationFrameRef = useRef(0);
  const isAutoScrollPausedRef = useRef(false);
  const manualPauseUntilRef = useRef(0);
  const autoScrollPositionRef = useRef(0);

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

  const statistics = useMemo(() => {
    const sourceStatistics = Array.isArray(loadedStatistics)
      ? loadedStatistics
      : [];

    return [...sourceStatistics].sort(sortStatistics);
  }, [loadedStatistics]);

  const hasOverflowStatistics = statistics.length > 6;

  const carouselStatistics = useMemo(() => {
    if (!hasOverflowStatistics) {
      return statistics;
    }

    return [...statistics, ...statistics];
  }, [hasOverflowStatistics, statistics]);

  useEffect(() => {
    const track = trackRef.current;

    if (!track || !hasOverflowStatistics) {
      return undefined;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      return undefined;
    }

    const speedPixelsPerSecond = 26;
    let previousTimestamp = 0;

    autoScrollPositionRef.current = track.scrollLeft;

    function animate(timestamp) {
      if (!previousTimestamp) {
        previousTimestamp = timestamp;
      }

      const elapsedSeconds = Math.min(
        (timestamp - previousTimestamp) / 1000,
        0.05,
      );

      previousTimestamp = timestamp;

      const isTemporarilyPaused =
        isAutoScrollPausedRef.current ||
        performance.now() < manualPauseUntilRef.current;

      const loopWidth = track.scrollWidth / 2;

      if (!isTemporarilyPaused && loopWidth > track.clientWidth) {
        autoScrollPositionRef.current +=
          speedPixelsPerSecond * elapsedSeconds;

        if (autoScrollPositionRef.current >= loopWidth) {
          autoScrollPositionRef.current -= loopWidth;
        }

        track.scrollLeft = autoScrollPositionRef.current;
      } else if (Math.abs(track.scrollLeft - autoScrollPositionRef.current) > 1) {
        autoScrollPositionRef.current = track.scrollLeft;
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    }

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [hasOverflowStatistics]);

  function setAutoScrollPaused(isPaused) {
    isAutoScrollPausedRef.current = isPaused;
  }

  function scrollStatistics(direction) {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const firstCard = track.querySelector(".public-statistic-card");
    const cardWidth = firstCard?.getBoundingClientRect().width || 280;
    const computedStyles = window.getComputedStyle(track);
    const gap = Number.parseFloat(computedStyles.columnGap) || 16;
    const distance = (cardWidth + gap) * 2;

    manualPauseUntilRef.current = performance.now() + 1500;

    const targetLeft = track.scrollLeft + direction * distance;

    track.scrollTo({
      left: targetLeft,
      behavior: "smooth",
    });

    window.setTimeout(() => {
      autoScrollPositionRef.current = track.scrollLeft;
    }, 350);
  }

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
            <div className="public-statistics-eyebrow">
              <span aria-hidden="true" />
              <p>{eyebrow}</p>
              <span aria-hidden="true" />
            </div>

            <h2 className="public-statistics-heading">{heading}</h2>

            <p className="public-statistics-description">
              {description}
            </p>

            <span
              className="public-statistics-heading-accent"
              aria-hidden="true"
            />
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
            <div
              ref={rowShellRef}
              className={[
                "public-statistics-row-shell",
                hasOverflowStatistics
                  ? "public-statistics-row-shell-scrollable"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onPointerDown={() => setAutoScrollPaused(true)}
              onPointerUp={() => setAutoScrollPaused(false)}
              onPointerCancel={() => setAutoScrollPaused(false)}
              onPointerLeave={() => setAutoScrollPaused(false)}
            >
              {hasOverflowStatistics && (
                <>
                  <button
                    type="button"
                    className="public-statistics-edge-control public-statistics-edge-control-left"
                    onMouseEnter={() => setAutoScrollPaused(true)}
                    onMouseLeave={() => setAutoScrollPaused(false)}
                    onFocus={() => setAutoScrollPaused(true)}
                    onBlur={() => setAutoScrollPaused(false)}
                    onClick={() => scrollStatistics(-1)}
                    aria-label="Scroll statistics left"
                    title="Previous statistics"
                  >
                    <span aria-hidden="true">←</span>
                  </button>

                  <button
                    type="button"
                    className="public-statistics-edge-control public-statistics-edge-control-right"
                    onMouseEnter={() => setAutoScrollPaused(true)}
                    onMouseLeave={() => setAutoScrollPaused(false)}
                    onFocus={() => setAutoScrollPaused(true)}
                    onBlur={() => setAutoScrollPaused(false)}
                    onClick={() => scrollStatistics(1)}
                    aria-label="Scroll statistics right"
                    title="Next statistics"
                  >
                    <span aria-hidden="true">→</span>
                  </button>

                  <span className="public-statistics-count">
                    {String(statistics.length).padStart(2, "0")} metrics
                  </span>
                </>
              )}

              <div
                ref={trackRef}
                className="public-statistics-track"
                aria-label="Portfolio statistics"
                tabIndex={statistics.length > 6 ? 0 : undefined}
              >
                {carouselStatistics.map((statistic, index) => {
                  const isDuplicate =
                    hasOverflowStatistics && index >= statistics.length;

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
