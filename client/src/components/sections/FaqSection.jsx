import { useMemo } from "react";
import { mergeHomepageSections } from "../../config/homepageSections";
import useFaqs from "../../hooks/useFaqs";
import useSiteSettings from "../../hooks/useSiteSettings";
import FaqAccordion from "../faqs/FaqAccordion";
import Container from "../layout/Container";
import Section from "../layout/Section";
import SectionHeading from "../layout/SectionHeading";

import PublicCTAButton from "../layout/PublicCTAButton";
const SITE_URL = "https://rakeshnexify.com";

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

function getSafePublicUrl(value, fallbackUrl = "/faq") {
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

function isFaqPageDestination(value) {
  try {
    const siteUrl = new URL(SITE_URL);
    const destinationUrl = new URL(String(value || "").trim(), siteUrl);
    const normalizedPathname =
      destinationUrl.pathname.replace(/\/+$/, "") || "/";

    return (
      destinationUrl.origin === siteUrl.origin &&
      normalizedPathname === "/faq"
    );
  } catch {
    return false;
  }
}

function FaqSection() {
  const { faqs, isLoading, error, refreshFaqs } = useFaqs();
  const { settings } = useSiteSettings();

  const sectionContent = settings?.faqSection || {};

  const eyebrow =
    String(sectionContent.eyebrow || "").trim();

  const heading =
    String(sectionContent.heading || "").trim();

  const description =
    String(sectionContent.description || "").trim();

  const ctaButton = sectionContent.ctaButton || sectionContent.action || {};

  const ctaLabel =
    String(ctaButton.label || "").trim();

  const ctaUrl = getSafePublicUrl(
    ctaButton.url || ctaButton.href, "");

  const faqPublicationSection = useMemo(
    () =>
      mergeHomepageSections(settings?.sections).find(
        (section) => section.key === "faq",
      ),
    [settings?.sections],
  );

  const shouldShowCta = !(
    faqPublicationSection?.isPageVisible === false &&
    isFaqPageDestination(ctaUrl)
  );

  const publicFaqs = Array.isArray(faqs) ? faqs : [];
  const previewFaqs = publicFaqs.slice(0, 5);

  return (
    <Section
      id="faq"
      className="scroll-mt-20 border-t border-slate-200 bg-white"
    >
      <Container>
        <SectionHeading
          eyebrow={eyebrow}
          title={heading}
          description={description}
        />

        <p aria-live="polite" className="sr-only">
          {isLoading ? "Loading FAQs." : `${publicFaqs.length} FAQs loaded.`}
        </p>

        {error && (
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-800">
                FAQs could not be loaded
              </p>
              <p className="mt-1 break-words text-sm leading-6 text-amber-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={refreshFaqs}
              disabled={isLoading}
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-800 disabled:opacity-60"
            >
              {isLoading ? "Retrying..." : "Retry FAQs"}
            </button>
          </div>
        )}

        {isLoading && publicFaqs.length === 0 && (
          <div className="mt-10 space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && (
          <div className="mx-auto mt-10 max-w-4xl">
            <FaqAccordion
              faqs={previewFaqs}
              compact
              emptyMessage="No public FAQs are available yet."
            />
          </div>
        )}

        {previewFaqs.length > 0 && shouldShowCta && (
          <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-slate-950">
                Need more answers?
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Explore all published questions and categories.
              </p>
            </div>

            <PublicCTAButton
              url={ctaUrl}
              label={ctaLabel}
            />
          </div>
        )}
      </Container>
    </Section>
  );
}

export default FaqSection;
