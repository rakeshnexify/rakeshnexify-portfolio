const MEDIA_TYPE_LABELS = Object.freeze({
  image: "Image",
  svg: "SVG",
  document: "Document",
  audio: "Audio",
  video: "Video",
});

const MEDIA_TYPE_ACCEPT = Object.freeze({
  image: ["image/jpeg", "image/png", "image/webp", "image/avif"],

  svg: ["image/svg+xml"],

  document: ["application/pdf"],

  audio: [
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "application/ogg",
    "audio/mp4",
    "audio/x-m4a",
  ],

  video: ["video/mp4", "video/webm"],
});

const MEDIA_UPLOAD_ACCEPT = Object.freeze(
  Object.values(MEDIA_TYPE_ACCEPT).flat().join(","),
);

const DEFAULT_MEDIA_FORM_VALUES = Object.freeze({
  title: "",
  altText: "",
  isDecorative: false,
  caption: "",
  description: "",
  folder: "",
  tagsText: "",
});

function normalizeFormText(value) {
  return String(value ?? "").trim();
}

function normalizeSingleLineText(value) {
  return normalizeFormText(value).replace(/\s+/g, " ");
}

function splitTags(value) {
  const rawValue = String(value ?? "");

  const tags = rawValue
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(tags)];
}

function joinTags(tags) {
  if (!Array.isArray(tags)) {
    return "";
  }

  return tags
    .map((tag) =>
      String(tag ?? "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean)
    .join(", ");
}

function createMediaFormValues(media = null) {
  if (!media || typeof media !== "object" || Array.isArray(media)) {
    return {
      ...DEFAULT_MEDIA_FORM_VALUES,
    };
  }

  return {
    title: String(media.title ?? ""),

    altText: String(media.altText ?? ""),

    isDecorative: Boolean(media.isDecorative),

    caption: String(media.caption ?? ""),

    description: String(media.description ?? ""),

    folder: String(media.folder ?? ""),

    tagsText: joinTags(media.tags),
  };
}

function validateMediaFormValues(values, { requireTitle = false } = {}) {
  const fieldErrors = {};

  const title = normalizeSingleLineText(values?.title);

  const altText = normalizeSingleLineText(values?.altText);

  const caption = normalizeFormText(values?.caption);

  const description = normalizeFormText(values?.description);

  const folder = normalizeSingleLineText(values?.folder);

  const tags = splitTags(values?.tagsText);

  if (requireTitle && !title) {
    fieldErrors.title = "Media title is required.";
  }

  if (title.length > 180) {
    fieldErrors.title = "Media title cannot exceed 180 characters.";
  }

  if (altText.length > 300) {
    fieldErrors.altText = "Alternative text cannot exceed 300 characters.";
  }

  if (caption.length > 500) {
    fieldErrors.caption = "Caption cannot exceed 500 characters.";
  }

  if (description.length > 3000) {
    fieldErrors.description = "Description cannot exceed 3000 characters.";
  }

  if (folder.length > 200) {
    fieldErrors.folder = "Folder cannot exceed 200 characters.";
  }

  if (
    folder &&
    (folder.startsWith("/") ||
      folder.endsWith("/") ||
      folder.includes("\\") ||
      folder.includes("..") ||
      folder.includes("//") ||
      !/^[a-zA-Z0-9][a-zA-Z0-9/_-]*$/.test(folder))
  ) {
    fieldErrors.folder = "Use a safe relative folder such as projects/covers.";
  }

  if (tags.length > 20) {
    fieldErrors.tags = "Add no more than 20 tags.";
  }

  const oversizedTag = tags.find((tag) => tag.length > 60);

  if (oversizedTag) {
    fieldErrors.tags = "Each tag cannot exceed 60 characters.";
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,

    fieldErrors,

    values: {
      title,
      altText,
      isDecorative: Boolean(values?.isDecorative),
      caption,
      description,
      folder,
      tags,
    },
  };
}

function buildMediaUploadMetadata(values) {
  const validation = validateMediaFormValues(values);

  if (!validation.isValid) {
    const error = new Error("Please correct the Media details.");

    error.fieldErrors = validation.fieldErrors;

    throw error;
  }

  const metadata = {
    isDecorative: validation.values.isDecorative,

    tags: validation.values.tags,
  };

  if (validation.values.title) {
    metadata.title = validation.values.title;
  }

  if (validation.values.altText) {
    metadata.altText = validation.values.altText;
  }

  if (validation.values.caption) {
    metadata.caption = validation.values.caption;
  }

  if (validation.values.description) {
    metadata.description = validation.values.description;
  }

  if (validation.values.folder) {
    metadata.folder = validation.values.folder;
  }

  return metadata;
}

function buildMediaUpdatePayload(values) {
  const validation = validateMediaFormValues(values, {
    requireTitle: true,
  });

  if (!validation.isValid) {
    const error = new Error("Please correct the Media details.");

    error.fieldErrors = validation.fieldErrors;

    throw error;
  }

  return {
    title: validation.values.title,

    altText: validation.values.altText,

    isDecorative: validation.values.isDecorative,

    caption: validation.values.caption,

    description: validation.values.description,

    folder: validation.values.folder,

    tags: validation.values.tags,
  };
}

function formatFileSize(bytes) {
  const numericBytes = Number(bytes);

  if (!Number.isFinite(numericBytes) || numericBytes < 0) {
    return "Unknown size";
  }

  if (numericBytes < 1024) {
    return `${Math.round(numericBytes)} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];

  let value = numericBytes / 1024;

  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const fractionDigits = value >= 100 ? 0 : value >= 10 ? 1 : 2;

  return `${value.toFixed(fractionDigits)} ${units[unitIndex]}`;
}

function formatDuration(seconds) {
  const numericSeconds = Number(seconds);

  if (!Number.isFinite(numericSeconds) || numericSeconds <= 0) {
    return "";
  }

  const roundedSeconds = Math.round(numericSeconds);

  const hours = Math.floor(roundedSeconds / 3600);

  const minutes = Math.floor((roundedSeconds % 3600) / 60);

  const remainingSeconds = roundedSeconds % 60;

  if (hours > 0) {
    return [
      hours,
      String(minutes).padStart(2, "0"),
      String(remainingSeconds).padStart(2, "0"),
    ].join(":");
  }

  return [minutes, String(remainingSeconds).padStart(2, "0")].join(":");
}

function formatDimensions(width, height) {
  const numericWidth = Number(width);

  const numericHeight = Number(height);

  if (
    !Number.isFinite(numericWidth) ||
    !Number.isFinite(numericHeight) ||
    numericWidth <= 0 ||
    numericHeight <= 0
  ) {
    return "";
  }

  return `${Math.round(numericWidth)} × ${Math.round(numericHeight)}`;
}

function getMediaTypeLabel(mediaType) {
  return MEDIA_TYPE_LABELS[String(mediaType ?? "").toLowerCase()] || "Media";
}

function isVisualMedia(mediaType) {
  return ["image", "svg"].includes(String(mediaType ?? "").toLowerCase());
}

function isPlayableMedia(mediaType) {
  return ["audio", "video"].includes(String(mediaType ?? "").toLowerCase());
}

function getMediaPreviewKind(media) {
  const mediaType = String(media?.mediaType ?? "").toLowerCase();

  if (["image", "svg"].includes(mediaType)) {
    return "image";
  }

  if (mediaType === "video") {
    return "video";
  }

  if (mediaType === "audio") {
    return "audio";
  }

  if (mediaType === "document") {
    return "document";
  }

  return "unknown";
}

export {
  DEFAULT_MEDIA_FORM_VALUES,
  MEDIA_TYPE_ACCEPT,
  MEDIA_TYPE_LABELS,
  MEDIA_UPLOAD_ACCEPT,
  buildMediaUpdatePayload,
  buildMediaUploadMetadata,
  createMediaFormValues,
  formatDimensions,
  formatDuration,
  formatFileSize,
  getMediaPreviewKind,
  getMediaTypeLabel,
  isPlayableMedia,
  isVisualMedia,
  joinTags,
  normalizeFormText,
  normalizeSingleLineText,
  splitTags,
  validateMediaFormValues,
};
