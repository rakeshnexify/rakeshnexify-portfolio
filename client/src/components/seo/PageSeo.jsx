import { useEffect } from "react";
import { useLocation } from "react-router";

const SITE_URL = "https://rakeshnexify.com";
const DEFAULT_BRAND_NAME = "RakeshNexify";
const STRUCTURED_DATA_ELEMENT_ID = "page-structured-data";

const DEFAULT_TITLE = "RakeshNexify | MERN & WordPress Developer";

const DEFAULT_DESCRIPTION =
  "Professional MERN applications, WordPress websites, custom web platforms, business websites, e-commerce solutions and modern digital products.";

function removeTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function createAbsoluteUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  return `${removeTrailingSlash(SITE_URL)}${normalizedPath}`;
}

function normalizeKeywords(value) {
  const sourceKeywords = Array.isArray(value)
    ? value
    : String(value || "").split(/[,\n]/);

  const uniqueKeywords = new Map();

  sourceKeywords.forEach((keyword) => {
    const safeKeyword = String(keyword || "").trim();

    if (!safeKeyword) {
      return;
    }

    uniqueKeywords.set(safeKeyword.toLowerCase(), safeKeyword);
  });

  return [...uniqueKeywords.values()].join(", ");
}

function getOrCreateMeta({ attribute, value }) {
  let element = document.head.querySelector(`meta[${attribute}="${value}"]`);

  if (!element) {
    element = document.createElement("meta");

    element.setAttribute(attribute, value);

    document.head.appendChild(element);
  }

  return element;
}

function updateMeta({ attribute, value, content }) {
  const element = getOrCreateMeta({
    attribute,
    value,
  });

  element.setAttribute("content", String(content || ""));
}

function removeMeta({ attribute, value }) {
  const element = document.head.querySelector(`meta[${attribute}="${value}"]`);

  element?.remove();
}

function updateCanonicalLink(url) {
  let element = document.head.querySelector('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");

    element.setAttribute("rel", "canonical");

    document.head.appendChild(element);
  }

  element.setAttribute("href", url);
}

function createStructuredDataJson(value) {
  const structuredDataItems = Array.isArray(value)
    ? value.filter(
        (item) => item && typeof item === "object" && !Array.isArray(item),
      )
    : value && typeof value === "object"
      ? [value]
      : [];

  if (structuredDataItems.length === 0) {
    return "";
  }

  const structuredDataValue =
    structuredDataItems.length === 1
      ? structuredDataItems[0]
      : structuredDataItems;

  try {
    return JSON.stringify(structuredDataValue).replaceAll("<", "\\u003c");
  } catch {
    return "";
  }
}

function updateStructuredData(jsonValue) {
  let element = document.getElementById(STRUCTURED_DATA_ELEMENT_ID);

  if (!jsonValue) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement("script");

    element.id = STRUCTURED_DATA_ELEMENT_ID;
    element.type = "application/ld+json";

    document.head.appendChild(element);
  }

  element.textContent = jsonValue;
}

function PageSeo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = [],
  canonicalPath,
  image = "",
  type = "website",
  noIndex = false,
  brandName = DEFAULT_BRAND_NAME,
  structuredData = null,
}) {
  const { pathname } = useLocation();

  const safeTitle = String(title || "").trim() || DEFAULT_TITLE;

  const safeDescription =
    String(description || "").trim() || DEFAULT_DESCRIPTION;

  const safeBrandName = String(brandName || "").trim() || DEFAULT_BRAND_NAME;

  const safeKeywords = normalizeKeywords(keywords);

  const canonicalUrl = createAbsoluteUrl(canonicalPath || pathname || "/");

  const imageUrl = createAbsoluteUrl(image);

  const structuredDataJson = createStructuredDataJson(structuredData);

  const robotsContent = noIndex ? "noindex, nofollow" : "index, follow";

  useEffect(() => {
    document.title = safeTitle;

    updateMeta({
      attribute: "name",
      value: "description",
      content: safeDescription,
    });

    updateMeta({
      attribute: "name",
      value: "robots",
      content: robotsContent,
    });

    updateMeta({
      attribute: "property",
      value: "og:type",
      content: type,
    });

    updateMeta({
      attribute: "property",
      value: "og:site_name",
      content: safeBrandName,
    });

    updateMeta({
      attribute: "property",
      value: "og:title",
      content:
      structuredDataJson,
    });

    updateMeta({
      attribute: "property",
      value: "og:description",
      content: safeDescription,
    });

    updateMeta({
      attribute: "property",
      value: "og:url",
      content: canonicalUrl,
    });

    updateMeta({
      attribute: "name",
      value: "twitter:card",
      content: imageUrl ? "summary_large_image" : "summary",
    });

    updateMeta({
      attribute: "name",
      value: "twitter:title",
      content:
      structuredDataJson,
    });

    updateMeta({
      attribute: "name",
      value: "twitter:description",
      content: safeDescription,
    });

    updateCanonicalLink(canonicalUrl);
    updateStructuredData(structuredDataJson);

    if (safeKeywords) {
      updateMeta({
        attribute: "name",
        value: "keywords",
        content: safeKeywords,
      });
    } else {
      removeMeta({
        attribute: "name",
        value: "keywords",
      });
    }

    if (imageUrl) {
      updateMeta({
        attribute: "property",
        value: "og:image",
        content: imageUrl,
      });

      updateMeta({
        attribute: "name",
        value: "twitter:image",
        content: imageUrl,
      });
    } else {
      removeMeta({
        attribute: "property",
        value: "og:image",
      });

      removeMeta({
        attribute: "name",
        value: "twitter:image",
      });
    }

    return () => {
      const element = document.getElementById(STRUCTURED_DATA_ELEMENT_ID);

      if (element?.textContent === structuredDataJson) {
        element.remove();
      }
    };
  }, [
    canonicalUrl,
    imageUrl,
    robotsContent,
    safeBrandName,
    safeDescription,
    safeKeywords,
    safeTitle,
    structuredDataJson,
    type,
  ]);

  return null;
}

export default PageSeo;
