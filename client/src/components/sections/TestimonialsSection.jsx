import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { mergeHomepageSections } from "../../config/homepageSections";
import useSiteSettings from "../../hooks/useSiteSettings";
import useTestimonials from "../../hooks/useTestimonials";
import Container from "../layout/Container";
import PublicCTAButton from "../layout/PublicCTAButton";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";
import HomeTestimonialCard from "../testimonials/HomeTestimonialCard";

import "../testimonials/HomeTestimonialCard.module.css";
import styles from "./TestimonialsSection.module.css";

const SITE_URL = "https://rakeshnexify.com";
const COMPANY_TESTIMONIALS_URL =
  "https://idomere.com/testimonials";

function cleanText(value) {
  return String(value ?? "").trim();
}

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

function getSafePublicUrl(value, fallbackUrl = "/testimonials") {
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

function createInitials(value) {
  const initials = cleanText(value)
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "CP";
}

function isTestimonialsPageDestination(value) {
  const url = String(value || "").trim();

  if (!url) {
    return false;
  }

  try {
    const siteUrl = new URL(SITE_URL);
    const destinationUrl = new URL(url, siteUrl);
    const normalizedPathname =
      destinationUrl.pathname.replace(/\/+$/, "") || "/";

    return (
      destinationUrl.origin === siteUrl.origin &&
      normalizedPathname === "/testimonials"
    );
  } catch {
    return false;
  }
}

function resolveCompanyTestimonialsUrl(value) {
  const safeUrl = getSafePublicUrl(value, "");

  if (
    !safeUrl ||
    isTestimonialsPageDestination(safeUrl)
  ) {
    return COMPANY_TESTIMONIALS_URL;
  }

  return safeUrl;
}

function ArrowIcon({ direction }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d={
          direction === "left"
            ? "M16 10H4.5M9 5.5 4.5 10 9 14.5"
            : "M4 10h11.5M11 5.5 15.5 10 11 14.5"
        }
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrustIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="m8.1 12.9 2.1 2.1 5.7-6m-8.7-3.4 1.1-1.1a2.3 2.3 0 0 1 3.2 0l.5.5.5-.5a2.3 2.3 0 0 1 3.2 0l1.1 1.1a2.3 2.3 0 0 1 0 3.2l-.5.5.5.5a2.3 2.3 0 0 1 0 3.2l-4.8 4.8-4.8-4.8a2.3 2.3 0 0 1 0-3.2l.5-.5-.5-.5a2.3 2.3 0 0 1 0-3.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TestimonialsSection() {
  const {
    testimonials,
    isLoading,
    error,
    refreshTestimonials,
  } = useTestimonials();

  const { settings } = useSiteSettings();
  const sliderRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const [slidesPerView, setSlidesPerView] = useState(3);
  const [activePage, setActivePage] = useState(0);

  const sectionContent = settings?.testimonialsSection || {};

  const eyebrow =
    String(sectionContent.eyebrow || "").trim();

  const heading =
    String(sectionContent.heading || "").trim();

  const description =
    String(sectionContent.description || "").trim();

  const trustedHeading =
    String(sectionContent.trustedHeading || "").trim();

  const trustedDescription =
    String(sectionContent.trustedDescription || "").trim();

  const ctaButton = sectionContent.ctaButton || sectionContent.action || {};

  const ctaLabel =
    String(ctaButton.label || "").trim();

  const ctaUrl = resolveCompanyTestimonialsUrl(
    ctaButton.url || ctaButton.href,
  );

  const testimonialsPublicationSection = useMemo(() => {
    return mergeHomepageSections(settings?.sections).find(
      (section) => section.key === "testimonials",
    );
  }, [settings?.sections]);

  const shouldShowCta = !(
    testimonialsPublicationSection?.isPageVisible === false &&
    isTestimonialsPageDestination(ctaUrl)
  );

  const publicTestimonials = Array.isArray(testimonials)
    ? testimonials
    : [];

  const trustedPreview = useMemo(() => {
    const sourceClients = Array.isArray(sectionContent.trustedClients)
      ? sectionContent.trustedClients
      : [];

    return sourceClients
      .filter((client) => client?.isVisible !== false)
      .sort((firstClient, secondClient) => {
        const orderDifference =
          Number(firstClient?.order || 0) -
          Number(secondClient?.order || 0);

        if (orderDifference !== 0) {
          return orderDifference;
        }

        return cleanText(firstClient?.name).localeCompare(
          cleanText(secondClient?.name),
          undefined,
          { sensitivity: "base" },
        );
      })
      .slice(0, 6);
  }, [sectionContent.trustedClients]);
  const pageCount = Math.max(
    1,
    publicTestimonials.length - slidesPerView + 1,
  );
  const effectiveActivePage = Math.min(
    activePage,
    Math.max(0, pageCount - 1),
  );

  useEffect(() => {
    function syncSlidesPerView() {
      const viewportWidth = window.innerWidth;
      const nextSlidesPerView =
        viewportWidth >= 1100 ? 3 : viewportWidth >= 700 ? 2 : 1;

      setSlidesPerView(nextSlidesPerView);
    }

    syncSlidesPerView();
    window.addEventListener("resize", syncSlidesPerView);

    return () => {
      window.removeEventListener("resize", syncSlidesPerView);
    };
  }, []);

  const getSlides = useCallback(() => {
    const slider = sliderRef.current;

    if (!slider) {
      return [];
    }

    return Array.from(
      slider.querySelectorAll("[data-testimonial-slide]"),
    );
  }, []);

  const scrollToPage = useCallback(
    (pageIndex) => {
      const slider = sliderRef.current;
      const slides = getSlides();
      const safePageIndex = Math.max(
        0,
        Math.min(pageIndex, pageCount - 1),
      );
      const targetSlide = slides[safePageIndex];

      if (!slider || !targetSlide) {
        return;
      }

      slider.scrollTo({
        left: targetSlide.offsetLeft,
        behavior: "smooth",
      });

      setActivePage(safePageIndex);
    },
    [getSlides, pageCount],
  );

  const syncActivePageFromScroll = useCallback(() => {
    const slider = sliderRef.current;
    const slides = getSlides();

    if (!slider || slides.length === 0) {
      return;
    }

    let nearestPage = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const slide = slides[pageIndex];

      if (!slide) {
        continue;
      }

      const distance = Math.abs(slide.offsetLeft - slider.scrollLeft);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPage = pageIndex;
      }
    }

    setActivePage(nearestPage);
  }, [getSlides, pageCount]);

  const handleSliderScroll = useCallback(() => {
    if (scrollFrameRef.current) {
      cancelAnimationFrame(scrollFrameRef.current);
    }

    scrollFrameRef.current = requestAnimationFrame(
      syncActivePageFromScroll,
    );
  }, [syncActivePageFromScroll]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  return (
    <Section
      id="testimonials"
      className={`${styles.section} scroll-mt-20`}
    >
      <Container>
        <div className={styles.content}>
          <SectionHeading
            eyebrow={eyebrow}
            title={heading}
            description={description}
          />

          <p aria-live="polite" className="sr-only">
            {isLoading
              ? "Loading Testimonials."
              : `${publicTestimonials.length} Testimonials loaded.`}
          </p>

          {error && (
            <div className={`${styles.state} ${styles.errorState}`}>
              <div>
                <p className={styles.stateTitle}>
                  Testimonials could not be loaded
                </p>
                <p className={styles.stateCopy}>{error}</p>
              </div>

              <button
                type="button"
                onClick={refreshTestimonials}
                disabled={isLoading}
                className={styles.retryButton}
              >
                {isLoading ? "Retrying..." : "Retry Testimonials"}
              </button>
            </div>
          )}

          {isLoading && publicTestimonials.length === 0 && (
            <div className={styles.sliderShell}>
              <div className={styles.loadingTrack}>
                {[1, 2, 3].map((item) => (
                  <div key={item} className={styles.skeletonCard} />
                ))}
              </div>
            </div>
          )}

          {!isLoading && !error && publicTestimonials.length === 0 && (
            <div className={styles.state}>
              <p className={styles.stateTitle}>
                No public Testimonials available
              </p>
              <p className={styles.stateCopy}>
                Testimonials will appear here after they are created and
                published from the Admin Panel.
              </p>
            </div>
          )}

          {publicTestimonials.length > 0 && (
            <div className={styles.sliderShell}>
              {pageCount > 1 && (
                <button
                  type="button"
                  className={`${styles.arrowButton} ${styles.arrowLeft}`}
                  onClick={() => scrollToPage(effectiveActivePage - 1)}
                  disabled={effectiveActivePage === 0}
                  aria-label="Previous Testimonials"
                >
                  <ArrowIcon direction="left" />
                </button>
              )}

              <div
                ref={sliderRef}
                className={styles.slider}
                onScroll={handleSliderScroll}
                tabIndex={0}
                aria-label="Client Testimonials carousel"
              >
                {publicTestimonials.map((testimonial, index) => (
                  <div
                    key={
                      testimonial._id ||
                      testimonial.id ||
                      `${testimonial.clientName}-${index}`
                    }
                    className={styles.slide}
                    data-testimonial-slide
                  >
                    <HomeTestimonialCard testimonial={testimonial} />
                  </div>
                ))}
              </div>

              {pageCount > 1 && (
                <button
                  type="button"
                  className={`${styles.arrowButton} ${styles.arrowRight}`}
                  onClick={() => scrollToPage(effectiveActivePage + 1)}
                  disabled={effectiveActivePage === pageCount - 1}
                  aria-label="Next Testimonials"
                >
                  <ArrowIcon direction="right" />
                </button>
              )}

            </div>
          )}

          {publicTestimonials.length > 0 && (
            <nav
              className={styles.paginationRow}
              aria-label="Testimonials carousel positions"
            >
              {Array.from({ length: pageCount }, (_, pageIndex) => (
                <button
                  key={pageIndex}
                  type="button"
                  className={styles.paginationDot}
                  data-active={
                    pageIndex === effectiveActivePage ? "true" : "false"
                  }
                  onClick={() => scrollToPage(pageIndex)}
                  aria-label={`Go to Testimonials position ${pageIndex + 1}`}
                  aria-current={
                    pageIndex === effectiveActivePage ? "true" : undefined
                  }
                >
                    <span
                      className={styles.paginationDotCore}
                      aria-hidden="true"
                    />
                  </button>
              ))}
            </nav>
          )}

          {trustedPreview.length > 0 && (
            <div className={styles.trustStrip}>
              <div className={styles.trustSummary}>
                <span className={styles.trustIcon}>
                  <TrustIcon />
                </span>

                <span>
                  <strong>
                    {trustedHeading || "Trusted showcase clients"}
                  </strong>
                  {trustedDescription && (
                    <small>{trustedDescription}</small>
                  )}
                </span>
              </div>

              <div className={styles.trustLogos}>
                {trustedPreview.map((client, index) => {
                  const name = cleanText(client?.name) || "Client";
                  const logoUrl = cleanText(client?.logoUrl);
                  const logoAlt =
                    cleanText(client?.logoAlt) || `${name} logo`;

                  return (
                    <div
                      key={`${name}-${index}`}
                      className={styles.companyItem}
                    >
                      <span className={styles.companyLogo}>
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={logoAlt}
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.hidden = true;
                            }}
                          />
                        ) : (
                          <span>{createInitials(name)}</span>
                        )}
                      </span>
                      <span className={styles.companyName}>{name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {publicTestimonials.length > 0 && shouldShowCta && ctaLabel && (
            <div className={styles.cta}>
              <PublicCTAButton
                url={ctaUrl}
                label={ctaLabel}
              />
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}

export default TestimonialsSection;
