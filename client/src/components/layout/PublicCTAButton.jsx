import { Link } from "react-router";

import styles from "./PublicCTAButton.module.css";

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

function normalizePublicUrl(value) {
  const url = String(value || "").trim();

  if (!url || containsControlCharacters(url)) {
    return "";
  }

  if (/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(url)) {
    return url;
  }

  if (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.includes("\\")
  ) {
    return url;
  }

  try {
    const parsed = new URL(url);

    if (
      ["http:", "https:"].includes(parsed.protocol) &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    ) {
      return url;
    }
  } catch {
    return "";
  }

  return "";
}

function ArrowIcon() {
  return (
    <svg
      className={styles.arrow}
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M4 10h11.5M11 5.5 15.5 10 11 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Content({ label }) {
  return (
    <>
      <span className={styles.label}>{label}</span>
      <span className={styles.iconShell}>
        <ArrowIcon />
      </span>
    </>
  );
}

function PublicCTAButton({
  url,
  label,
  ariaLabel = "",
}) {
  const cleanLabel = String(label ?? "").trim();
  const safeUrl = normalizePublicUrl(url);

  if (!cleanLabel || !safeUrl) {
    return null;
  }

  const className = styles.button;
  const resolvedAriaLabel =
    String(ariaLabel || "").trim() || cleanLabel;

  if (
    safeUrl.startsWith("http://") ||
    safeUrl.startsWith("https://")
  ) {
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={resolvedAriaLabel}
      >
        <Content label={cleanLabel} />
      </a>
    );
  }

  if (safeUrl.startsWith("/")) {
    return (
      <Link
        to={safeUrl}
        className={className}
        aria-label={resolvedAriaLabel}
      >
        <Content label={cleanLabel} />
      </Link>
    );
  }

  return (
    <a
      href={safeUrl}
      className={className}
      aria-label={resolvedAriaLabel}
    >
      <Content label={cleanLabel} />
    </a>
  );
}

export default PublicCTAButton;
