const SITE_URL = "https://rakeshnexify.com";

const publicPageDefinitions = [
  {
    key: "statistics",
    pathname: "/statistics",
  },
  {
    key: "skills",
    pathname: "/skills",
  },
  {
    key: "services",
    pathname: "/services",
  },
  {
    key: "projects",
    pathname: "/projects",
  },
  {
    key: "education",
    pathname: "/education",
  },
  {
    key: "experience",
    pathname: "/experience",
  },
  {
    key: "achievements",
    pathname: "/achievements",
  },
  {
    key: "team",
    pathname: "/team",
  },
  {
    key: "companies",
    pathname: "/companies",
  },
  {
    key: "clients-partners",
    pathname: "/clients-partners",
  },
  {
    key: "testimonials",
    pathname: "/testimonials",
  },
  {
    key: "faq",
    pathname: "/faq",
  },
  {
    key: "blog",
    pathname: "/blog",
  },
  {
    key: "news",
    pathname: "/news",
  },
];

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

function normalizeSectionKey(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase();

  return key === "home" ? "hero" : key;
}

function normalizeRelationship(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function findSectionByKey(sections, requiredKey) {
  if (!Array.isArray(sections)) {
    return null;
  }

  const normalizedRequiredKey = normalizeSectionKey(requiredKey);

  return (
    sections.find(
      (section) => normalizeSectionKey(section?.key) === normalizedRequiredKey,
    ) || null
  );
}

function isPublicPageVisible(sections, sectionKey) {
  const section = findSectionByKey(sections, sectionKey);

  /*
   * Purane database records ya missing section
   * backward compatibility ke liye visible rahenge.
   */
  return section?.isPageVisible !== false;
}

function createStaticPaths(sections) {
  const enabledPagePaths = publicPageDefinitions
    .filter((page) => isPublicPageVisible(sections, page.key))
    .map((page) => page.pathname);

  /*
   * Homepage sitemap mein hamesha available rahega.
   */
  return ["/", ...enabledPagePaths];
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

function normalizePostType(value) {
  const type = String(value || "")
    .trim()
    .toLowerCase();

  return type === "blog" || type === "news" ? type : "";
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

function isClientPartnerCompany(company) {
  const relationship = normalizeRelationship(company?.relationship);

  return relationship === "client" || relationship === "partner";
}

function createCompanyEntries({ companies, sections }) {
  const companiesPageVisible = isPublicPageVisible(sections, "companies");

  if (companiesPageVisible) {
    return createDynamicEntries({
      items: companies,
      basePath: "/companies",
    });
  }

  const clientsPartnersPageVisible = isPublicPageVisible(
    sections,
    "clients-partners",
  );

  if (!clientsPartnersPageVisible) {
    return [];
  }

  return createDynamicEntries({
    items: Array.isArray(companies)
      ? companies.filter(isClientPartnerCompany)
      : [],
    basePath: "/companies",
  });
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

export function createSitemapXml({
  projects = [],
  companies = [],
  teamMembers = [],
  posts = [],
  sections = [],
} = {}) {
  const staticPaths = createStaticPaths(sections);

  const staticEntries = staticPaths.map((pathname) => ({
    pathname,
  }));

  const projectEntries = isPublicPageVisible(sections, "projects")
    ? createDynamicEntries({
        items: projects,
        basePath: "/projects",
      })
    : [];

  const teamMemberEntries = isPublicPageVisible(sections, "team")
    ? createDynamicEntries({
        items: teamMembers,
        basePath: "/team",
      })
    : [];

  /*
   * Company detail pages are canonical organization profiles.
   *
   * Companies public page ON:
   *   all visible Company profiles remain indexable.
   *
   * Companies OFF + Clients & Partners ON:
   *   only visible client/partner Company profiles remain indexable because
   *   those are the only Company details still published by that collection.
   *
   * Both OFF:
   *   no Company detail profiles are included.
   */
  const companyEntries = createCompanyEntries({
    companies,
    sections,
  });

  const blogPostEntries = isPublicPageVisible(sections, "blog")
    ? createDynamicEntries({
        items: Array.isArray(posts)
          ? posts.filter(
              (post) =>
                post?.isVisible !== false &&
                normalizePostType(post?.type) === "blog",
            )
          : [],
        basePath: "/blog",
      })
    : [];

  const newsPostEntries = isPublicPageVisible(sections, "news")
    ? createDynamicEntries({
        items: Array.isArray(posts)
          ? posts.filter(
              (post) =>
                post?.isVisible !== false &&
                normalizePostType(post?.type) === "news",
            )
          : [],
        basePath: "/news",
      })
    : [];

  const sitemapEntries = removeDuplicateEntries([
    ...staticEntries,
    ...projectEntries,
    ...teamMemberEntries,
    ...companyEntries,
    ...blogPostEntries,
    ...newsPostEntries,
  ]);

  const urlEntries = sitemapEntries.map(createUrlEntry).join("\n\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

export default createSitemapXml;
