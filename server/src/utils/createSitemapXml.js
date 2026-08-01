const SITE_URL = "https://rakeshnexify.com";

const staticPaths = ["/", "/services", "/projects", "/companies"];

function removeTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function normalizeSlug(value) {
  return String(value || "").trim();
}

function createAbsoluteUrl(pathname) {
  const safePath = String(pathname || "").trim();

  if (!safePath || safePath === "/") {
    return `${removeTrailingSlash(SITE_URL)}/`;
  }

  const normalizedPath = safePath.startsWith("/") ? safePath : `/${safePath}`;

  return `${removeTrailingSlash(SITE_URL)}${normalizedPath}`;
}

function createLastModifiedValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
}

function createUrlEntry({ pathname, updatedAt }) {
  const absoluteUrl = createAbsoluteUrl(pathname);

  const lastModified = createLastModifiedValue(updatedAt);

  const lastModifiedTag = lastModified
    ? `\n    <lastmod>${escapeXml(lastModified)}</lastmod>`
    : "";

  return `  <url>
    <loc>${escapeXml(absoluteUrl)}</loc>${lastModifiedTag}
  </url>`;
}

function createDynamicEntries({ items, basePath }) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const slug = normalizeSlug(typeof item === "string" ? item : item?.slug);

      if (!slug) {
        return null;
      }

      return {
        pathname: `${basePath}/${encodeURIComponent(slug)}`,

        updatedAt: typeof item === "object" ? item?.updatedAt : undefined,
      };
    })
    .filter(Boolean);
}

function removeDuplicateEntries(entries) {
  const entriesByPath = new Map();

  entries.forEach((entry) => {
    const pathname = String(entry?.pathname || "").trim();

    if (!pathname) {
      return;
    }

    const existingEntry = entriesByPath.get(pathname);

    if (!existingEntry) {
      entriesByPath.set(pathname, entry);
      return;
    }

    const existingUpdatedAt = createLastModifiedValue(existingEntry.updatedAt);

    const nextUpdatedAt = createLastModifiedValue(entry.updatedAt);

    if (
      nextUpdatedAt &&
      (!existingUpdatedAt || nextUpdatedAt > existingUpdatedAt)
    ) {
      entriesByPath.set(pathname, entry);
    }
  });

  return [...entriesByPath.values()];
}

export function createSitemapXml({ projects = [], companies = [] } = {}) {
  const staticEntries = staticPaths.map((pathname) => ({
    pathname,
  }));

  const projectEntries = createDynamicEntries({
    items: projects,
    basePath: "/projects",
  });

  const companyEntries = createDynamicEntries({
    items: companies,
    basePath: "/companies",
  });

  const sitemapEntries = removeDuplicateEntries([
    ...staticEntries,
    ...projectEntries,
    ...companyEntries,
  ]);

  const urlEntries = sitemapEntries.map(createUrlEntry).join("\n\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

export default createSitemapXml;
