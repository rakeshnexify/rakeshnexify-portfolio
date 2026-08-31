const postTypes = ["blog", "news"];

const defaultPostFormValues = {
  title: "",
  slug: "",
  type: "blog",
  excerpt: "",
  content: "",
  featuredImageUrl: "",
  featuredImageAlt: "",
  category: "",
  tags: "",
  authorName: "",
  publishedAt: "",
  readingTime: "1",
  relatedProjects: [],
  order: "0",
  isFeatured: false,
  isVisible: true,
  seo: {
    title: "",
    description: "",
    keywords: "",
    ogImageUrl: "",
  },
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireString(value, fieldName) {
  if (typeof value !== "string") {
    throw new TypeError(`${fieldName} must be text.`);
  }

  return value;
}

function cleanText(value, fieldName = "Value") {
  return requireString(value, fieldName).trim();
}

function createPostSlug(value) {
  return cleanText(value, "Post title")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePostType(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedType = value.trim().toLowerCase();

  return postTypes.includes(normalizedType) ? normalizedType : null;
}

function normalizePostOrder(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const numericOrder = Number(value);

  return Number.isFinite(numericOrder) && numericOrder >= 0
    ? numericOrder
    : null;
}

function normalizeReadingTime(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 1 ? value : null;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const numericReadingTime = Number(value);

  return Number.isInteger(numericReadingTime) && numericReadingTime >= 1
    ? numericReadingTime
    : null;
}

function parseListText(value, fieldName) {
  const text = cleanText(value, fieldName);

  if (!text) {
    return [];
  }

  const items = text
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set(items)];
}

function formatListText(value) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}

function isSafeHttpUrl(value) {
  if (typeof value !== "string") {
    return false;
  }

  const url = value.trim();

  if (!url) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);

    return (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    );
  } catch {
    return false;
  }
}

function isValidObjectId(value) {
  return (
    typeof value === "string" &&
    /^[a-fA-F0-9]{24}$/.test(value.trim())
  );
}

function normalizeRelatedProjectIds(value) {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalizedIds = [];

  for (const item of value) {
    let projectId;

    if (typeof item === "string") {
      projectId = item.trim();
    } else if (
      item &&
      typeof item === "object" &&
      !Array.isArray(item)
    ) {
      const rawId = item._id ?? item.id;

      if (typeof rawId !== "string") {
        return null;
      }

      projectId = rawId.trim();
    } else {
      return null;
    }

    if (!projectId) {
      continue;
    }

    if (!isValidObjectId(projectId)) {
      return null;
    }

    if (!normalizedIds.includes(projectId)) {
      normalizedIds.push(projectId);
    }
  }

  return normalizedIds;
}

function formatDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part) => String(part).padStart(2, "0");

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

function normalizePublishedAt(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const cleanValue = value.trim();

  if (!cleanValue) {
    return null;
  }

  const date = new Date(cleanValue);

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function createPostFormValues(post = {}) {
  const record = isPlainObject(post) ? post : {};
  const seo = isPlainObject(record.seo) ? record.seo : {};

  const normalizedType = normalizePostType(record.type) || "blog";
  const normalizedReadingTime =
    normalizeReadingTime(record.readingTime) ?? 1;
  const normalizedOrder = normalizePostOrder(record.order) ?? 0;
  const relatedProjects =
    normalizeRelatedProjectIds(record.relatedProjects || []) || [];

  return {
    title: typeof record.title === "string" ? record.title : "",
    slug: typeof record.slug === "string" ? record.slug : "",
    type: normalizedType,
    excerpt: typeof record.excerpt === "string" ? record.excerpt : "",
    content: typeof record.content === "string" ? record.content : "",
    featuredImageUrl:
      typeof record.featuredImageUrl === "string"
        ? record.featuredImageUrl
        : "",
    featuredImageAlt:
      typeof record.featuredImageAlt === "string"
        ? record.featuredImageAlt
        : "",
    category: typeof record.category === "string" ? record.category : "",
    tags: formatListText(record.tags),
    authorName:
      typeof record.authorName === "string" ? record.authorName : "",
    publishedAt: formatDateTimeLocal(record.publishedAt),
    readingTime: String(normalizedReadingTime),
    relatedProjects,
    order: String(normalizedOrder),
    isFeatured:
      typeof record.isFeatured === "boolean" ? record.isFeatured : false,
    isVisible:
      typeof record.isVisible === "boolean" ? record.isVisible : true,
    seo: {
      title: typeof seo.title === "string" ? seo.title : "",
      description:
        typeof seo.description === "string" ? seo.description : "",
      keywords: formatListText(seo.keywords),
      ogImageUrl:
        typeof seo.ogImageUrl === "string" ? seo.ogImageUrl : "",
    },
  };
}

function createPostPayload(formValues = {}) {
  if (!isPlainObject(formValues)) {
    throw new TypeError("Post form values must be an object.");
  }

  if (
    Object.prototype.hasOwnProperty.call(formValues, "seo") &&
    !isPlainObject(formValues.seo)
  ) {
    throw new TypeError("Post SEO form values must be an object.");
  }

  const values = {
    ...defaultPostFormValues,
    ...formValues,
    seo: {
      ...defaultPostFormValues.seo,
      ...(formValues.seo || {}),
    },
  };

  const type = normalizePostType(values.type);
  const readingTime = normalizeReadingTime(values.readingTime);
  const order = normalizePostOrder(values.order);
  const publishedAt = normalizePublishedAt(values.publishedAt);
  const relatedProjects = normalizeRelatedProjectIds(values.relatedProjects);

  if (!type) {
    throw new TypeError("Post type must be blog or news.");
  }

  if (readingTime === null) {
    throw new TypeError(
      "Reading time must be a whole number of at least 1 minute.",
    );
  }

  if (order === null) {
    throw new TypeError("Post display order must be a non-negative number.");
  }

  if (publishedAt === undefined) {
    throw new TypeError("Published date must be a valid date.");
  }

  if (relatedProjects === null) {
    throw new TypeError(
      "Related Projects must contain only valid Project IDs.",
    );
  }

  if (typeof values.isFeatured !== "boolean") {
    throw new TypeError("Post featured value must be a boolean.");
  }

  if (typeof values.isVisible !== "boolean") {
    throw new TypeError("Post visibility value must be a boolean.");
  }

  return {
    title: cleanText(values.title, "Post title"),
    slug: cleanText(values.slug, "Post slug"),
    type,
    excerpt: cleanText(values.excerpt, "Post excerpt"),
    content: cleanText(values.content, "Post content"),
    featuredImageUrl: cleanText(
      values.featuredImageUrl,
      "Featured image URL",
    ),
    featuredImageAlt: cleanText(
      values.featuredImageAlt,
      "Featured image alt",
    ),
    category: cleanText(values.category, "Post category"),
    tags: parseListText(values.tags, "Post tags"),
    authorName: cleanText(values.authorName, "Post author name"),
    publishedAt,
    readingTime,
    relatedProjects,
    order,
    isFeatured: values.isFeatured,
    isVisible: values.isVisible,
    seo: {
      title: cleanText(values.seo.title, "SEO title"),
      description: cleanText(
        values.seo.description,
        "SEO description",
      ),
      keywords: parseListText(values.seo.keywords, "SEO keywords").map(
        (keyword) => keyword.toLowerCase(),
      ),
      ogImageUrl: cleanText(values.seo.ogImageUrl, "SEO image URL"),
    },
  };
}

function validatePostFormValues(formValues = {}) {
  const errors = {};

  if (!isPlainObject(formValues)) {
    return {
      body: "Post form values must be an object.",
    };
  }

  if (
    Object.prototype.hasOwnProperty.call(formValues, "seo") &&
    !isPlainObject(formValues.seo)
  ) {
    errors.seo = "Post SEO form values must be an object.";
  }

  const values = {
    ...defaultPostFormValues,
    ...formValues,
    seo: {
      ...defaultPostFormValues.seo,
      ...(isPlainObject(formValues.seo) ? formValues.seo : {}),
    },
  };

  const readText = (value, fieldName) => {
    if (typeof value !== "string") {
      errors[fieldName] = `${fieldName} must be text.`;
      return "";
    }

    return value.trim();
  };

  const title = readText(values.title, "title");
  const slug = readText(values.slug, "slug");
  const excerpt = readText(values.excerpt, "excerpt");
  const content = readText(values.content, "content");
  const featuredImageUrl = readText(
    values.featuredImageUrl,
    "featuredImageUrl",
  );
  const featuredImageAlt = readText(
    values.featuredImageAlt,
    "featuredImageAlt",
  );
  const category = readText(values.category, "category");
  const authorName = readText(values.authorName, "authorName");
  const seoTitle = readText(values.seo.title, "seo.title");
  const seoDescription = readText(
    values.seo.description,
    "seo.description",
  );
  const seoOgImageUrl = readText(
    values.seo.ogImageUrl,
    "seo.ogImageUrl",
  );

  if (title.length < 2) {
    errors.title = "Post title must contain at least 2 characters.";
  } else if (title.length > 180) {
    errors.title = "Post title cannot exceed 180 characters.";
  }

  if (
    slug &&
    (slug.length < 2 ||
      slug.length > 200 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
  ) {
    errors.slug =
      "Slug must use lowercase letters, numbers and single hyphens only.";
  }

  if (!normalizePostType(values.type)) {
    errors.type = "Select blog or news.";
  }

  if (excerpt.length < 10) {
    errors.excerpt = "Post excerpt must contain at least 10 characters.";
  } else if (excerpt.length > 500) {
    errors.excerpt = "Post excerpt cannot exceed 500 characters.";
  }

  if (content.length < 20) {
    errors.content = "Post content must contain at least 20 characters.";
  } else if (content.length > 50000) {
    errors.content = "Post content cannot exceed 50000 characters.";
  }

  if (featuredImageUrl.length > 500) {
    errors.featuredImageUrl =
      "Featured image URL cannot exceed 500 characters.";
  } else if (!isSafeHttpUrl(featuredImageUrl)) {
    errors.featuredImageUrl =
      "Featured image URL must be a complete credential-free http:// or https:// URL.";
  }

  if (featuredImageAlt.length > 220) {
    errors.featuredImageAlt =
      "Featured image alternative text cannot exceed 220 characters.";
  }

  if (category.length > 120) {
    errors.category = "Post category cannot exceed 120 characters.";
  }

  if (authorName.length < 2) {
    errors.authorName =
      "Post author name must contain at least 2 characters.";
  } else if (authorName.length > 150) {
    errors.authorName = "Post author name cannot exceed 150 characters.";
  }

  if (typeof values.tags !== "string") {
    errors.tags = "Post tags must be text.";
  }

  if (normalizePublishedAt(values.publishedAt) === undefined) {
    errors.publishedAt = "Published date must be a valid date.";
  }

  if (normalizeReadingTime(values.readingTime) === null) {
    errors.readingTime =
      "Reading time must be a whole number of at least 1 minute.";
  }

  if (normalizeRelatedProjectIds(values.relatedProjects) === null) {
    errors.relatedProjects =
      "Please select only valid related Projects.";
  }

  if (normalizePostOrder(values.order) === null) {
    errors.order = "Display order must be a non-negative number.";
  }

  if (typeof values.isFeatured !== "boolean") {
    errors.isFeatured = "Featured status must be true or false.";
  }

  if (typeof values.isVisible !== "boolean") {
    errors.isVisible = "Visibility status must be true or false.";
  }

  if (seoTitle.length > 70) {
    errors["seo.title"] = "SEO title cannot exceed 70 characters.";
  }

  if (seoDescription.length > 180) {
    errors["seo.description"] =
      "SEO description cannot exceed 180 characters.";
  }

  if (typeof values.seo.keywords !== "string") {
    errors["seo.keywords"] = "SEO keywords must be text.";
  }

  if (seoOgImageUrl.length > 500) {
    errors["seo.ogImageUrl"] =
      "SEO Open Graph image URL cannot exceed 500 characters.";
  } else if (!isSafeHttpUrl(seoOgImageUrl)) {
    errors["seo.ogImageUrl"] =
      "SEO Open Graph image URL must be a complete credential-free http:// or https:// URL.";
  }

  return errors;
}

export {
  createPostFormValues,
  createPostPayload,
  createPostSlug,
  defaultPostFormValues,
  formatDateTimeLocal,
  formatListText,
  isPlainObject,
  isSafeHttpUrl,
  isValidObjectId,
  normalizePostOrder,
  normalizePostType,
  normalizePublishedAt,
  normalizeReadingTime,
  normalizeRelatedProjectIds,
  parseListText,
  postTypes,
  validatePostFormValues,
};
