import fs from "node:fs/promises";

import SiteSettings from "../models/SiteSettings.js";

const SITE_KEY = "main";
const SITE_URL = "https://rakeshnexify.com";
const DEFAULT_BRAND_NAME = "RakeshNexify";
const DEFAULT_TITLE =
  "RakeshNexify | MERN & WordPress Developer";
const DEFAULT_DESCRIPTION =
  "Professional MERN applications, WordPress websites, custom web platforms, business websites, e-commerce solutions and modern digital products.";

const SOCIAL_META_START = "<!-- SERVER_SOCIAL_META_START -->";
const SOCIAL_META_END = "<!-- SERVER_SOCIAL_META_END -->";

let cachedIndexPath = "";
let cachedIndexHtml = "";

function cleanString(value) {
  return String(value ?? "").trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createAbsoluteUrl(value) {
  const rawValue = cleanString(value);

  if (!rawValue) {
    return "";
  }

  try {
    const url = rawValue.startsWith("/")
      ? new URL(rawValue, SITE_URL)
      : new URL(rawValue);

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function createCanonicalUrl(pathname) {
  const safePath = cleanString(pathname);

  try {
    const url = new URL(
      safePath && safePath.startsWith("/") ? safePath : "/",
      SITE_URL,
    );

    url.search = "";
    url.hash = "";

    return url.toString();
  } catch {
    return `${SITE_URL}/`;
  }
}

function getLegalRouteMetadata(settings, pathname, brandName) {
  const legal =
    settings?.legal &&
    typeof settings.legal === "object" &&
    !Array.isArray(settings.legal)
      ? settings.legal
      : {};

  const routeMap = {
    "/privacy-policy": {
      key: "privacyPolicy",
      defaultTitle: "Privacy Policy",
    },
    "/terms-and-conditions": {
      key: "termsConditions",
      defaultTitle: "Terms & Conditions",
    },
  };

  const route = routeMap[pathname];

  if (!route) {
    return null;
  }

  const page =
    legal?.[route.key] &&
    typeof legal[route.key] === "object" &&
    !Array.isArray(legal[route.key])
      ? legal[route.key]
      : {};

  const isPublished =
    page.isPublished === true &&
    Boolean(cleanString(page.content));

  return {
    title:
      cleanString(page.seoTitle) ||
      `${cleanString(page.title) || route.defaultTitle} | ${brandName}`,
    description:
      cleanString(page.seoDescription) ||
      `Read the ${cleanString(page.title) || route.defaultTitle} for ${brandName}.`,
    noIndex: !isPublished,
  };
}

function createSocialMetadata(settings, pathname) {
  const brandName =
    cleanString(settings?.brand?.name) || DEFAULT_BRAND_NAME;

  const globalSeo =
    settings?.seo &&
    typeof settings.seo === "object" &&
    !Array.isArray(settings.seo)
      ? settings.seo
      : {};

  let title =
    cleanString(globalSeo.title) || DEFAULT_TITLE;

  let description =
    cleanString(globalSeo.description) || DEFAULT_DESCRIPTION;

  let noIndex =
    pathname === "/admin" || pathname.startsWith("/admin/");

  const legalMetadata = getLegalRouteMetadata(
    settings,
    pathname,
    brandName,
  );

  if (legalMetadata) {
    title = legalMetadata.title;
    description = legalMetadata.description;
    noIndex = legalMetadata.noIndex;
  }

  return {
    brandName,
    title,
    description,
    canonicalUrl: createCanonicalUrl(pathname),
    imageUrl: createAbsoluteUrl(globalSeo.ogImageUrl),
    type: "website",
    noIndex,
  };
}

function createSocialMetaHtml(metadata) {
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const brandName = escapeHtml(metadata.brandName);
  const canonicalUrl = escapeHtml(metadata.canonicalUrl);
  const imageUrl = escapeHtml(metadata.imageUrl);
  const imageAlt = escapeHtml(
    `${metadata.brandName} social sharing image`,
  );

  const lines = [
    SOCIAL_META_START,
    `    <meta name="description" content="${description}" />`,
    `    <meta name="robots" content="${
      metadata.noIndex ? "noindex, nofollow" : "index, follow"
    }" />`,
    `    <meta property="og:type" content="${escapeHtml(metadata.type)}" />`,
    `    <meta property="og:site_name" content="${brandName}" />`,
    `    <meta property="og:title" content="${title}" />`,
    `    <meta property="og:description" content="${description}" />`,
    `    <meta property="og:url" content="${canonicalUrl}" />`,
    '    <meta property="og:locale" content="en_US" />',
  ];

  if (imageUrl) {
    lines.push(
      `    <meta property="og:image" content="${imageUrl}" />`,
      `    <meta property="og:image:secure_url" content="${imageUrl}" />`,
      `    <meta property="og:image:alt" content="${imageAlt}" />`,
    );
  }

  lines.push(
    `    <meta name="twitter:card" content="${
      imageUrl ? "summary_large_image" : "summary"
    }" />`,
    `    <meta name="twitter:title" content="${title}" />`,
    `    <meta name="twitter:description" content="${description}" />`,
  );

  if (imageUrl) {
    lines.push(
      `    <meta name="twitter:image" content="${imageUrl}" />`,
      `    <meta name="twitter:image:alt" content="${imageAlt}" />`,
    );
  }

  lines.push(
    `    <link rel="canonical" href="${canonicalUrl}" />`,
    `    <title>${title}</title>`,
    `    ${SOCIAL_META_END}`,
  );

  return lines.join("\n");
}

function injectSocialMeta(indexHtml, socialMetaHtml) {
  const startIndex = indexHtml.indexOf(SOCIAL_META_START);
  const endIndex = indexHtml.indexOf(SOCIAL_META_END);

  if (
    startIndex < 0 ||
    endIndex < 0 ||
    endIndex <= startIndex
  ) {
    throw new Error(
      "Client index is missing server social metadata markers.",
    );
  }

  const afterEndIndex =
    endIndex + SOCIAL_META_END.length;

  return [
    indexHtml.slice(0, startIndex),
    socialMetaHtml,
    indexHtml.slice(afterEndIndex),
  ].join("");
}

async function getClientIndexHtml(indexPath) {
  if (
    cachedIndexHtml &&
    cachedIndexPath === indexPath
  ) {
    return cachedIndexHtml;
  }

  cachedIndexHtml = await fs.readFile(indexPath, "utf8");
  cachedIndexPath = indexPath;

  return cachedIndexHtml;
}

async function getMetadataSettings() {
  try {
    return await SiteSettings.findOne({
      siteKey: SITE_KEY,
    })
      .select("brand.name seo legal")
      .lean();
  } catch (error) {
    console.warn(
      "Social metadata settings lookup failed; serving static fallback metadata:",
      error.message,
    );

    return null;
  }
}

async function renderSocialMetadataHtml({
  indexPath,
  pathname,
}) {
  const indexHtml = await getClientIndexHtml(indexPath);
  const settings = await getMetadataSettings();

  const metadata = createSocialMetadata(
    settings,
    cleanString(pathname) || "/",
  );

  return injectSocialMeta(
    indexHtml,
    createSocialMetaHtml(metadata),
  );
}

export {
  createSocialMetaHtml,
  createSocialMetadata,
  injectSocialMeta,
  renderSocialMetadataHtml,
};