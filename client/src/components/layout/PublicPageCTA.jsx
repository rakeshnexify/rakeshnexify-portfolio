import { getPublicPageCta } from "../../config/publicPageCtas";
import Container from "./Container";
import PublicCTAButton from "./PublicCTAButton";

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

      <PublicCTAButton
        url={content.url}
        label={content.buttonLabel}
      />
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
