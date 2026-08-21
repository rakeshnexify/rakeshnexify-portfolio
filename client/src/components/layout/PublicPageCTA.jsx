import { Link } from "react-router";

import { getPublicPageCta } from "../../config/publicPageCtas";
import Container from "./Container";

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    if (code <= 31 || code === 127) {
      return true;
    }
  }

  return false;
}

function getSafePublicUrl(value) {
  const url = String(value || "").trim();

  if (!url || containsControlCharacters(url)) {
    return "/#contact";
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
    return "/#contact";
  }

  return "/#contact";
}

function ActionLink({ url, children }) {
  const safeUrl = getSafePublicUrl(url);

  const content = (
    <>
      <span>{children}</span>
      <span aria-hidden="true">→</span>
    </>
  );

  if (safeUrl.startsWith("http://") || safeUrl.startsWith("https://")) {
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="public-page-cta-button"
      >
        {content}
      </a>
    );
  }

  if (safeUrl.startsWith("/")) {
    return (
      <Link to={safeUrl} className="public-page-cta-button">
        {content}
      </Link>
    );
  }

  return (
    <a href={safeUrl} className="public-page-cta-button">
      {content}
    </a>
  );
}

function PublicPageCTA({
  ctaKey,
  embedded = false,
  className = "",
  sectionClassName = "",
}) {
  const content = getPublicPageCta(ctaKey);

  if (!content) {
    return null;
  }

  const card = (
    <div
      className={[
        "public-page-cta-card",
        embedded ? "public-page-cta-card-embedded" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="public-page-cta-copy">
        <p className="public-page-cta-eyebrow">{content.eyebrow}</p>
        <h2 className="public-page-cta-title">{content.title}</h2>
      </div>

      <ActionLink url={content.url}>{content.buttonLabel}</ActionLink>
    </div>
  );

  if (embedded) {
    return card;
  }

  return (
    <section
      className={["public-page-cta-section", sectionClassName]
        .filter(Boolean)
        .join(" ")}
    >
      <Container>{card}</Container>
    </section>
  );
}

export default PublicPageCTA;
