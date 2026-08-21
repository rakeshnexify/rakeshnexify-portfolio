import { useEffect, useRef } from "react";
import { Link } from "react-router";

const iconPaths = {
  briefcase: (
    <>
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M4 7h16v12H4z" />
      <path d="M4 12h16" />
      <path d="M10 12v2h4v-2" />
    </>
  ),
  code: (
    <>
      <path d="m9 18-6-6 6-6" />
      <path d="m15 6 6 6-6 6" />
      <path d="m14 4-4 16" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5l8-3 8 3v16" />
      <path d="M9 21v-4h6v4" />
      <path d="M8 8h1" />
      <path d="M15 8h1" />
      <path d="M8 12h1" />
      <path d="M15 12h1" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="m17 10 4-2v8l-4-2" />
    </>
  ),
  github: (
    <>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.5 5.5 0 0 0 19.3 4 5.2 5.2 0 0 0 19.1.5S17.9.1 15 2a13.4 13.4 0 0 0-7 0C5.1.1 3.9.5 3.9.5A5.2 5.2 0 0 0 3.7 4a5.5 5.5 0 0 0-1.5 3.5c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 8 18v4" />
      <path d="M8 19c-3 .9-3-1.5-4-2" />
    </>
  ),
  layers: (
    <>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v2a4 4 0 0 0 4 4" />
      <path d="M17 6h3v2a4 4 0 0 1-4 4" />
    </>
  ),
  rocket: (
    <>
      <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2" />
      <path d="m9 15-3-3s3.5-6.5 10-8.5c3.5-1 4.5 0 3.5 3.5C17.5 13.5 11 17 11 17l-2-2Z" />
      <circle cx="15" cy="8" r="1.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M3 11h18" />
    </>
  ),
};

const accentTones = [
  "violet",
  "blue",
  "cyan",
  "orange",
  "pink",
  "emerald",
];

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

function getSafePublicUrl(value) {
  const url = String(value || "").trim();

  if (!url || containsControlCharacters(url)) {
    return "";
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
      parsedUrl.hostname &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return url;
    }
  } catch {
    return "";
  }

  return "";
}

function getSafeImageUrl(value) {
  const safeUrl = getSafePublicUrl(value);

  return safeUrl.startsWith("http://") ||
    safeUrl.startsWith("https://") ||
    safeUrl.startsWith("/")
    ? safeUrl
    : "";
}

function createStatisticSymbol(statistic) {
  const icon = String(statistic?.icon || "").trim();

  if (icon && [...icon].length <= 4) {
    return icon;
  }

  const label = String(statistic?.label || "").trim();

  return label.charAt(0).toUpperCase() || "#";
}

function StatisticIcon({ statistic }) {
  const iconUrl = getSafeImageUrl(statistic?.iconUrl);

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className="public-statistic-icon-image"
      />
    );
  }

  const iconName = String(statistic?.icon || "")
    .trim()
    .toLowerCase();

  if (iconPaths[iconName]) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="public-statistic-icon-svg"
      >
        {iconPaths[iconName]}
      </svg>
    );
  }

  return (
    <span aria-hidden="true" className="public-statistic-icon-fallback">
      {createStatisticSymbol(statistic)}
    </span>
  );
}

function getNumericValue(value) {
  const text = String(value ?? "").trim();

  if (!/^-?\d+(?:[.,]\d+)?$/.test(text)) {
    return null;
  }

  const normalized = text.replace(",", ".");
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function AnimatedStatisticNumber({ value }) {
  const valueRef = useRef(null);

  useEffect(() => {
    const element = valueRef.current;

    if (!element) {
      return undefined;
    }

    const rawValue = String(value ?? "").trim();
    const numericValue = getNumericValue(rawValue);

    if (numericValue === null) {
      element.textContent = rawValue;
      return undefined;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      element.textContent = rawValue;
      return undefined;
    }

    let animationFrameId = 0;
    let startTime = 0;
    let hasAnimated = false;

    const decimals = rawValue.includes(".") || rawValue.includes(",")
      ? (rawValue.split(/[.,]/)[1] || "").length
      : 0;

    function renderProgress(timestamp) {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = Math.min((timestamp - startTime) / 900, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      const currentValue = numericValue * easedProgress;

      element.textContent =
        decimals > 0
          ? currentValue.toFixed(decimals)
          : Math.round(currentValue).toLocaleString("en-US");

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(renderProgress);
      } else {
        element.textContent = rawValue;
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry?.isIntersecting || hasAnimated) {
          return;
        }

        hasAnimated = true;
        observer.disconnect();

        element.textContent = "0";
        animationFrameId = window.requestAnimationFrame(renderProgress);
      },
      {
        threshold: 0.35,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [value]);

  return <span ref={valueRef}>{String(value ?? "").trim()}</span>;
}

function StatisticDestination({
  statistic,
  children,
  className,
}) {
  const safeUrl = getSafePublicUrl(statistic?.url);

  if (!safeUrl) {
    return <article className={className}>{children}</article>;
  }

  const openInNewTab = statistic?.openInNewTab === true;
  const sharedProps = {
    className,
    target: openInNewTab ? "_blank" : undefined,
    rel: openInNewTab ? "noopener noreferrer" : undefined,
    "aria-label": `Open ${statistic?.label || "statistic"}`,
  };

  if (safeUrl.startsWith("http://") || safeUrl.startsWith("https://")) {
    return (
      <a href={safeUrl} {...sharedProps}>
        {children}
      </a>
    );
  }

  if (safeUrl.startsWith("/")) {
    return (
      <Link to={safeUrl} {...sharedProps}>
        {children}
      </Link>
    );
  }

  return (
    <a href={safeUrl} {...sharedProps}>
      {children}
    </a>
  );
}

function StatisticCard({ statistic, index = 0 }) {
  const prefix = String(statistic?.prefix || "").trim();
  const value = String(statistic?.value || "").trim();
  const suffix = String(statistic?.suffix || "").trim();
  const label = String(statistic?.label || "").trim();
  const description = String(statistic?.description || "").trim();

  const configuredAccent = String(statistic?.accent || "")
    .trim()
    .toLowerCase();

  const accent = accentTones.includes(configuredAccent)
    ? configuredAccent
    : accentTones[index % accentTones.length];

  const isClickable = Boolean(getSafePublicUrl(statistic?.url));

  const cardClassName = [
    "public-statistic-card",
    `public-statistic-tone-${accent}`,
    isClickable ? "public-statistic-card-clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <StatisticDestination statistic={statistic} className={cardClassName}>
      <div className="public-statistic-card-inner">
        <div className="public-statistic-icon-ring">
          <StatisticIcon statistic={statistic} />
        </div>

        <p className="public-statistic-value">
          {prefix && <span>{prefix}</span>}
          <AnimatedStatisticNumber value={value} />
          {suffix && <span>{suffix}</span>}
        </p>

        <span className="public-statistic-divider" aria-hidden="true" />

        {label && <h3 className="public-statistic-title">{label}</h3>}

        {description && (
          <p className="public-statistic-description">{description}</p>
        )}
      </div>
    </StatisticDestination>
  );
}

export default StatisticCard;
