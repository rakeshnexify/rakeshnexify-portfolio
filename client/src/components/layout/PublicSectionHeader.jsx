import PublicSectionEyebrow from "./PublicSectionEyebrow";
import styles from "./PublicSectionHeader.module.css";

function normalizeText(value) {
  return String(value ?? "").trim();
}

function PublicSectionHeader({
  eyebrow,
  title,
  titleContent = null,
  description,
  align = "center",
  as = "div",
  className = "",
  titleClassName = "",
  descriptionClassName = "",
}) {
  const cleanEyebrow = normalizeText(eyebrow);
  const cleanTitle = normalizeText(title);
  const cleanDescription = normalizeText(description);
  const Root = as;

  return (
    <Root
      className={`${styles.root} ${
        align === "left" ? styles.left : styles.center
      } ${className}`.trim()}
    >
      <div className={styles.eyebrowSlot}>
        <PublicSectionEyebrow eyebrow={cleanEyebrow} />
      </div>

      {cleanTitle && (
        <h2 className={titleClassName}>
          {titleContent ?? cleanTitle}
        </h2>
      )}

      {cleanDescription && (
        <p className={descriptionClassName}>{cleanDescription}</p>
      )}
    </Root>
  );
}

export default PublicSectionHeader;
