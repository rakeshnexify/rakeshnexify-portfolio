import styles from "./PublicSectionEyebrow.module.css";

function LineGraphic({ reverse = false }) {
  return (
    <svg
      className={reverse ? styles.lineRight : styles.lineLeft}
      viewBox="0 0 100 2"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <line
        x1="0"
        y1="1"
        x2="100"
        y2="1"
        className={styles.lineStroke}
      />
    </svg>
  );
}

function PublicSectionEyebrow({ eyebrow }) {
  const cleanEyebrow = String(eyebrow ?? "").trim();

  if (!cleanEyebrow) {
    return null;
  }

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <LineGraphic />
        <span className={styles.label}>{cleanEyebrow}</span>
        <LineGraphic reverse />
      </div>

      <span className={styles.accent} aria-hidden="true" />
    </div>
  );
}

export default PublicSectionEyebrow;
