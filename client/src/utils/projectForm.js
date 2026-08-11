function createEmptyProjectImage() {
  return {
    url: "",
    alt: "",
    caption: "",
    order: "0",
  };
}

function createEmptyProjectResult() {
  return {
    label: "",
    value: "",
  };
}

function createDefaultProjectFormValues() {
  return {
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    category: "",
    projectType: "personal",
    clientName: "",
    role: "",
    status: "completed",
    startedAt: "",
    completedAt: "",
    coverImageUrl: "",

    images: [],
    technologies: "",
    features: "",
    challenges: "",
    solutions: "",
    results: [],

    liveUrl: "",
    sourceCodeUrl: "",
    caseStudyUrl: "",
    videoUrl: "",

    caseStudyIsPublished: false,
    caseStudyIsFeatured: false,
    caseStudyOrder: "0",

    order: "0",
    isFeatured: false,
    isVisible: true,

    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    seoOgImageUrl: "",
  };
}

const defaultProjectFormValues = createDefaultProjectFormValues();

function createProjectSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function listToText(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function textToList(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const stringValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) {
    return stringValue.slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function createProjectImageFormValue(image = {}, index = 0) {
  return {
    url: image.url || "",
    alt: image.alt || "",
    caption: image.caption || "",
    order: String(image.order ?? index),
  };
}

function createProjectResultFormValue(result = {}) {
  return {
    label: result.label || "",
    value: result.value || "",
  };
}

function createProjectFormValues(project = {}) {
  const links = project.links || {};
  const seo = project.seo || {};
  const caseStudy = project.caseStudy || {};

  return {
    title: project.title || "",
    slug: project.slug || "",

    shortDescription: project.shortDescription || "",

    description: project.description || "",

    category: project.category || "",

    projectType: project.projectType || "personal",

    clientName: project.clientName || "",

    role: project.role || "",

    status: project.status || "completed",

    startedAt: toDateInputValue(project.startedAt),

    completedAt: toDateInputValue(project.completedAt),

    coverImageUrl: project.coverImageUrl || "",

    images: Array.isArray(project.images)
      ? project.images.map(createProjectImageFormValue)
      : [],

    technologies: listToText(project.technologies),

    features: listToText(project.features),

    challenges: listToText(project.challenges),

    solutions: listToText(project.solutions),

    results: Array.isArray(project.results)
      ? project.results.map(createProjectResultFormValue)
      : [],

    liveUrl: links.liveUrl || "",

    sourceCodeUrl: links.sourceCodeUrl || "",

    caseStudyUrl: links.caseStudyUrl || "",

    videoUrl: links.videoUrl || "",

    caseStudyIsPublished: Boolean(caseStudy.isPublished),

    caseStudyIsFeatured: Boolean(caseStudy.isFeatured),

    caseStudyOrder: String(caseStudy.order ?? 0),

    order: String(project.order ?? 0),

    isFeatured: Boolean(project.isFeatured),

    isVisible:
      typeof project.isVisible === "boolean" ? project.isVisible : true,

    seoTitle: seo.title || "",

    seoDescription: seo.description || "",

    seoKeywords: listToText(seo.keywords),

    seoOgImageUrl: seo.ogImageUrl || "",
  };
}

function createImagesPayload(images = []) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images
    .filter((image) => Boolean(String(image?.url || "").trim()))
    .map((image, index) => ({
      url: String(image.url || "").trim(),

      alt: String(image.alt || "").trim(),

      caption: String(image.caption || "").trim(),

      order: Number(image.order ?? index),
    }));
}

function createResultsPayload(results = []) {
  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .filter((result) => {
      const label = String(result?.label || "").trim();

      const value = String(result?.value || "").trim();

      return Boolean(label || value);
    })
    .map((result) => ({
      label: String(result.label || "").trim(),

      value: String(result.value || "").trim(),
    }));
}

function createProjectPayload(formValues) {
  const title = String(formValues.title || "").trim();

  return {
    title,

    slug: createProjectSlug(formValues.slug) || createProjectSlug(title),

    shortDescription: String(formValues.shortDescription || "").trim(),

    description: String(formValues.description || "").trim(),

    category: String(formValues.category || "").trim(),

    projectType: formValues.projectType || "personal",

    clientName: String(formValues.clientName || "").trim(),

    role: String(formValues.role || "").trim(),

    status: formValues.status || "completed",

    startedAt: formValues.startedAt || null,

    completedAt: formValues.completedAt || null,

    coverImageUrl: String(formValues.coverImageUrl || "").trim(),

    images: createImagesPayload(formValues.images),

    technologies: textToList(formValues.technologies),

    features: textToList(formValues.features),

    challenges: textToList(formValues.challenges),

    solutions: textToList(formValues.solutions),

    results: createResultsPayload(formValues.results),

    links: {
      liveUrl: String(formValues.liveUrl || "").trim(),

      sourceCodeUrl: String(formValues.sourceCodeUrl || "").trim(),

      caseStudyUrl: String(formValues.caseStudyUrl || "").trim(),

      videoUrl: String(formValues.videoUrl || "").trim(),
    },

    caseStudy: {
      isPublished: Boolean(formValues.caseStudyIsPublished),

      isFeatured: Boolean(formValues.caseStudyIsFeatured),

      order: Number(formValues.caseStudyOrder || 0),
    },

    order: Number(formValues.order || 0),

    isFeatured: Boolean(formValues.isFeatured),

    isVisible: Boolean(formValues.isVisible),

    seo: {
      title: String(formValues.seoTitle || "").trim(),

      description: String(formValues.seoDescription || "").trim(),

      keywords: textToList(formValues.seoKeywords),

      ogImageUrl: String(formValues.seoOgImageUrl || "").trim(),
    },
  };
}

export {
  createDefaultProjectFormValues,
  createEmptyProjectImage,
  createEmptyProjectResult,
  createProjectFormValues,
  createProjectPayload,
  createProjectSlug,
  defaultProjectFormValues,
};
