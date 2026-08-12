import path from "node:path";

import mongoose from "mongoose";

import Media, { MEDIA_TYPES } from "../models/Media.js";

import { cleanupMediaUpload } from "../middleware/mediaUpload.middleware.js";

import {
  cleanupUploadedMediaAsset,
  destroyCloudinaryAsset,
  uploadMediaAsset,
} from "../services/mediaStorage.service.js";

import { getMediaUsageSummary } from "../services/mediaReference.service.js";
import {
  createAuditLog,
  createAuditLogBestEffort,
} from "../services/auditLog.service.js";

import { validateMediaFile } from "../utils/mediaFileValidation.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;
const MAX_PAGE = 1_000_000;

const ADMIN_USER_FIELDS = ["name", "email", "role"].join(" ");

const MEDIA_SORT_OPTIONS = Object.freeze({
  newest: {
    createdAt: -1,
    _id: -1,
  },

  oldest: {
    createdAt: 1,
    _id: 1,
  },

  "title-asc": {
    title: 1,
    _id: 1,
  },

  "title-desc": {
    title: -1,
    _id: -1,
  },

  "size-desc": {
    size: -1,
    createdAt: -1,
    _id: -1,
  },

  "size-asc": {
    size: 1,
    createdAt: -1,
    _id: -1,
  },
});

const EDITABLE_MEDIA_FIELDS = Object.freeze([
  "title",
  "altText",
  "isDecorative",
  "caption",
  "description",
  "folder",
  "tags",
]);

const ALLOWED_MEDIA_QUERY_FIELDS = Object.freeze([
  "search",
  "mediaType",
  "mediaTypes",
  "folder",
  "tag",
  "sort",
  "page",
  "limit",
]);

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function hasOwnProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function assertAllowedKeys(object, allowedKeys, sourceLabel) {
  const allowedKeySet = new Set(allowedKeys);

  const unexpectedKeys = Object.keys(object || {}).filter(
    (key) => !allowedKeySet.has(key),
  );

  if (unexpectedKeys.length === 0) {
    return;
  }

  const fieldErrors = Object.fromEntries(
    unexpectedKeys.map((key) => [key, `${key} is not supported.`]),
  );

  throw createHttpError(
    `${sourceLabel} contains unsupported field${
      unexpectedKeys.length === 1 ? "" : "s"
    }: ${unexpectedKeys.join(", ")}.`,
    400,
    fieldErrors,
  );
}

function requireString(value, fieldName) {
  if (typeof value !== "string") {
    throw createHttpError(`${fieldName} must be text.`, 400, {
      [fieldName]: `${fieldName} must be text.`,
    });
  }

  return value;
}

function cleanText(value, fieldName) {
  return requireString(value, fieldName).trim();
}

function cleanSingleLineText(value, fieldName) {
  return cleanText(value, fieldName).replace(/\s+/g, " ");
}

function cleanBoolean(value, fieldName) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw createHttpError(`${fieldName} must be true or false.`, 400, {
    [fieldName]: `${fieldName} must be true or false.`,
  });
}

function cleanEnum(value, fieldName, allowedValues) {
  if (typeof value !== "string") {
    throw createHttpError(`Invalid ${fieldName}.`, 400, {
      [fieldName]: `Please select a valid ${fieldName}.`,
    });
  }

  const cleanValue = value.trim().toLowerCase();

  if (!allowedValues.includes(cleanValue)) {
    throw createHttpError(`Invalid ${fieldName}.`, 400, {
      [fieldName]: `Please select a valid ${fieldName}.`,
    });
  }

  return cleanValue;
}

function cleanTagArray(value, fieldName = "tags") {
  if (!Array.isArray(value)) {
    throw createHttpError(`${fieldName} must be an array.`, 400, {
      [fieldName]: `${fieldName} must be an array of text values.`,
    });
  }

  if (value.length > 20) {
    throw createHttpError("Media can contain at most 20 tags.", 400, {
      [fieldName]: "Add no more than 20 Media tags.",
    });
  }

  const normalizedTags = value
    .map((tag, index) => {
      if (typeof tag !== "string") {
        throw createHttpError(
          "Media tags must contain text values only.",
          400,
          {
            [`${fieldName}.${index}`]: "Media tag must be text.",
          },
        );
      }

      const cleanTag = tag.trim().toLowerCase();

      if (cleanTag.length > 60) {
        throw createHttpError("Media tag cannot exceed 60 characters.", 400, {
          [`${fieldName}.${index}`]: "Media tag cannot exceed 60 characters.",
        });
      }

      return cleanTag;
    })
    .filter(Boolean);

  return [...new Set(normalizedTags)];
}

function parseMultipartTags(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return cleanTagArray(value);
  }

  if (typeof value !== "string") {
    throw createHttpError("tags must be text or a JSON array.", 400, {
      tags: "Send Media tags as comma-separated text or a JSON array.",
    });
  }

  const cleanValue = value.trim();

  if (!cleanValue) {
    return [];
  }

  if (cleanValue.startsWith("[")) {
    let parsedTags;

    try {
      parsedTags = JSON.parse(cleanValue);
    } catch {
      throw createHttpError("Media tags contain invalid JSON.", 400, {
        tags: "Send Media tags as a valid JSON array.",
      });
    }

    return cleanTagArray(parsedTags);
  }

  return cleanTagArray(cleanValue.split(","));
}

function deriveMediaTitle(originalName) {
  const fileName = path.basename(String(originalName || ""));

  const extension = path.extname(fileName);

  const withoutExtension = extension
    ? fileName.slice(0, -extension.length)
    : fileName;

  const title = withoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (title || "Media asset").slice(0, 180);
}

function buildUploadMetadata(requestBody, originalName) {
  if (!isPlainObject(requestBody)) {
    throw createHttpError("Media upload metadata must be an object.", 400, {
      body: "Send Media upload metadata using multipart form fields.",
    });
  }

  assertAllowedKeys(
    requestBody,
    EDITABLE_MEDIA_FIELDS,
    "Media upload metadata",
  );

  const payload = {
    title: deriveMediaTitle(originalName),

    altText: "",
    isDecorative: false,
    caption: "",
    description: "",
    folder: "",
    tags: [],
  };

  if (hasOwnProperty(requestBody, "title")) {
    payload.title = cleanSingleLineText(requestBody.title, "title");
  }

  if (hasOwnProperty(requestBody, "altText")) {
    payload.altText = cleanSingleLineText(requestBody.altText, "altText");
  }

  if (hasOwnProperty(requestBody, "isDecorative")) {
    payload.isDecorative = cleanBoolean(
      requestBody.isDecorative,
      "isDecorative",
    );
  }

  if (hasOwnProperty(requestBody, "caption")) {
    payload.caption = cleanText(requestBody.caption, "caption");
  }

  if (hasOwnProperty(requestBody, "description")) {
    payload.description = cleanText(requestBody.description, "description");
  }

  if (hasOwnProperty(requestBody, "folder")) {
    payload.folder = cleanSingleLineText(requestBody.folder, "folder");
  }

  if (hasOwnProperty(requestBody, "tags")) {
    payload.tags = parseMultipartTags(requestBody.tags);
  }

  return payload;
}

function buildMediaUpdatePayload(requestBody) {
  if (!isPlainObject(requestBody)) {
    throw createHttpError("Media request body must be a JSON object.", 400, {
      body: "Media request body must be a JSON object.",
    });
  }

  assertAllowedKeys(
    requestBody,
    EDITABLE_MEDIA_FIELDS,
    "Media metadata request",
  );

  const payload = {};

  if (hasOwnProperty(requestBody, "title")) {
    payload.title = cleanSingleLineText(requestBody.title, "title");
  }

  if (hasOwnProperty(requestBody, "altText")) {
    payload.altText = cleanSingleLineText(requestBody.altText, "altText");
  }

  if (hasOwnProperty(requestBody, "isDecorative")) {
    payload.isDecorative = cleanBoolean(
      requestBody.isDecorative,
      "isDecorative",
    );
  }

  if (hasOwnProperty(requestBody, "caption")) {
    payload.caption = cleanText(requestBody.caption, "caption");
  }

  if (hasOwnProperty(requestBody, "description")) {
    payload.description = cleanText(requestBody.description, "description");
  }

  if (hasOwnProperty(requestBody, "folder")) {
    payload.folder = cleanSingleLineText(requestBody.folder, "folder");
  }

  if (hasOwnProperty(requestBody, "tags")) {
    payload.tags = cleanTagArray(requestBody.tags);
  }

  return payload;
}

function requireJsonContentType(request) {
  if (!request.is("application/json")) {
    throw createHttpError(
      "Media metadata update requests must use application/json.",
      415,
      {
        body: "Send the Media metadata request body using application/json.",
      },
    );
  }
}

function validateMediaId(mediaId) {
  if (!mongoose.isValidObjectId(mediaId)) {
    throw createHttpError("Invalid Media ID.", 400, {
      id: "Media ID must be a valid record ID.",
    });
  }
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasBracketStyleQuery(query, fieldName) {
  const escapedFieldName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const bracketPattern = new RegExp(`^${escapedFieldName}\\[.*\\]$`);

  return Object.keys(query || {}).some((key) => bracketPattern.test(key));
}

function parseStringQuery(query, fieldName, { maxLength = 200 } = {}) {
  if (hasBracketStyleQuery(query, fieldName)) {
    throw createHttpError(`${fieldName} must be a single text value.`, 400, {
      [fieldName]: `${fieldName} must be a single text value.`,
    });
  }

  const value = query?.[fieldName];

  if (value === undefined) {
    return "";
  }

  if (typeof value !== "string") {
    throw createHttpError(`${fieldName} must be a single text value.`, 400, {
      [fieldName]: `${fieldName} must be a single text value.`,
    });
  }

  const cleanValue = value.trim();

  if (cleanValue.length > maxLength) {
    throw createHttpError(`${fieldName} is too long.`, 400, {
      [fieldName]: `${fieldName} cannot exceed ${maxLength} characters.`,
    });
  }

  return cleanValue;
}

function parsePositiveIntegerQuery(
  query,
  fieldName,
  { defaultValue, minimum = 1, maximum },
) {
  const rawValue = parseStringQuery(query, fieldName, {
    maxLength: 12,
  });

  if (!rawValue) {
    return defaultValue;
  }

  if (!/^[0-9]+$/.test(rawValue)) {
    throw createHttpError(`${fieldName} must be a whole number.`, 400, {
      [fieldName]: `${fieldName} must be a whole number.`,
    });
  }

  const numericValue = Number(rawValue);

  if (
    !Number.isSafeInteger(numericValue) ||
    numericValue < minimum ||
    (maximum !== undefined && numericValue > maximum)
  ) {
    throw createHttpError(`${fieldName} is outside the allowed range.`, 400, {
      [fieldName]: `${fieldName} must be between ${minimum} and ${maximum}.`,
    });
  }

  return numericValue;
}

function parseMediaTypeQuery(query) {
  const rawValue = parseStringQuery(query, "mediaType", {
    maxLength: 30,
  });

  if (!rawValue) {
    return "";
  }

  return cleanEnum(rawValue, "mediaType", MEDIA_TYPES);
}

function parseMediaTypesQuery(query) {
  const hasMediaTypesQuery = hasOwnProperty(query, "mediaTypes");

  if (!hasMediaTypesQuery) {
    return [];
  }

  const rawValue = parseStringQuery(query, "mediaTypes", {
    maxLength: 200,
  });

  if (!rawValue) {
    throw createHttpError("Invalid Media type filter.", 400, {
      mediaTypes: "Select at least one supported Media type.",
    });
  }

  const requestedTypes = rawValue
    .split(",")
    .map((type) => type.trim().toLowerCase());

  if (requestedTypes.some((type) => !type)) {
    throw createHttpError("Invalid Media type filter.", 400, {
      mediaTypes:
        "Media types must be a comma-separated list without empty values.",
    });
  }

  const normalizedTypes = [
    ...new Set(
      requestedTypes.map((type) =>
        cleanEnum(type, "mediaTypes", MEDIA_TYPES),
      ),
    ),
  ];

  if (normalizedTypes.length === 0) {
    throw createHttpError("Invalid Media type filter.", 400, {
      mediaTypes: "Select at least one supported Media type.",
    });
  }

  return normalizedTypes;
}

function parseSortQuery(query) {
  const rawValue = parseStringQuery(query, "sort", {
    maxLength: 30,
  });

  if (!rawValue) {
    return "newest";
  }

  if (!hasOwnProperty(MEDIA_SORT_OPTIONS, rawValue)) {
    throw createHttpError("Invalid Media sort option.", 400, {
      sort: "Select a supported Media sort option.",
    });
  }

  return rawValue;
}

function createAdminPopulation() {
  return [
    {
      path: "uploadedBy",
      select: ADMIN_USER_FIELDS,
    },

    {
      path: "updatedBy",
      select: ADMIN_USER_FIELDS,
    },
  ];
}

function isSizeValidationError(error) {
  return (
    /exceed/i.test(error?.message || "") ||
    /too large/i.test(error?.message || "")
  );
}

async function validateUploadedMediaFile(request) {
  if (!request.file?.path) {
    throw createHttpError("A Media file is required.", 400, {
      file: "Select a Media file to upload.",
    });
  }

  try {
    return await validateMediaFile({
      filePath: request.file.path,

      originalName: request.file.originalname,

      browserMimeType: request.file.mimetype,
    });
  } catch (error) {
    throw createHttpError(
      error?.message || "Uploaded Media file is invalid.",
      isSizeValidationError(error) ? 413 : 400,
      {
        file: error?.message || "Uploaded Media file is invalid.",
      },
    );
  }
}

function sendMediaError(error, response, next) {
  if (error?.code === 11000) {
    return response.status(409).json({
      success: false,
      message: "This Media asset already exists.",
      fieldErrors: {
        media: "A Media record with the same provider asset already exists.",
      },
    });
  }

  if (error?.name === "ValidationError") {
    const fieldErrors = {};

    Object.entries(error.errors).forEach(([fieldName, fieldError]) => {
      fieldErrors[fieldName] = fieldError.message;
    });

    return response.status(400).json({
      success: false,
      message: "Please correct the Media details.",
      fieldErrors,
    });
  }

  if (error?.name === "CastError") {
    return response.status(400).json({
      success: false,
      message: "A Media value or record ID is invalid.",
      fieldErrors: {},
    });
  }

  if (error?.statusCode) {
    return response.status(error.statusCode).json({
      success: false,
      message: error.message,
      fieldErrors: error.fieldErrors || {},
    });
  }

  if (String(error?.code || "").startsWith("MEDIA_STORAGE_")) {
    return response.status(502).json({
      success: false,
      message: error.message || "Media storage provider request failed.",
      fieldErrors: {},
    });
  }

  if (
    String(error?.message || "").includes(
      "Cloudinary Media storage is not configured",
    )
  ) {
    return response.status(503).json({
      success: false,
      message: "Media storage is currently unavailable.",
      fieldErrors: {},
    });
  }

  return next(error);
}

async function getAdminMedia(request, response, next) {
  try {
    assertAllowedKeys(request.query, ALLOWED_MEDIA_QUERY_FIELDS, "Media query");

    const search = parseStringQuery(request.query, "search", {
      maxLength: 200,
    });

    const folder = parseStringQuery(request.query, "folder", {
      maxLength: 200,
    });

    const tag = parseStringQuery(request.query, "tag", {
      maxLength: 60,
    }).toLowerCase();

    const hasMediaTypeQuery = hasOwnProperty(request.query, "mediaType");

    const hasMediaTypesQuery = hasOwnProperty(request.query, "mediaTypes");

    if (hasMediaTypeQuery && hasMediaTypesQuery) {
      throw createHttpError(
        "Use either mediaType or mediaTypes, not both.",
        400,
        {
          mediaType: "Choose one Media type filter format.",
          mediaTypes: "Choose one Media type filter format.",
        },
      );
    }

    const mediaType = parseMediaTypeQuery(request.query);

    const mediaTypes = parseMediaTypesQuery(request.query);

    const sortOption = parseSortQuery(request.query);

    const page = parsePositiveIntegerQuery(request.query, "page", {
      defaultValue: DEFAULT_PAGE,

      minimum: 1,
      maximum: MAX_PAGE,
    });

    const limit = parsePositiveIntegerQuery(request.query, "limit", {
      defaultValue: DEFAULT_LIMIT,

      minimum: 1,
      maximum: MAX_LIMIT,
    });

    const filter = {};

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        {
          title: {
            $regex: safeSearch,
            $options: "i",
          },
        },

        {
          originalName: {
            $regex: safeSearch,
            $options: "i",
          },
        },

        {
          caption: {
            $regex: safeSearch,
            $options: "i",
          },
        },

        {
          description: {
            $regex: safeSearch,
            $options: "i",
          },
        },

        {
          tags: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    if (mediaType) {
      filter.mediaType = mediaType;
    } else if (mediaTypes.length > 0) {
      filter.mediaType = {
        $in: mediaTypes,
      };
    }

    if (folder) {
      filter.folder = {
        $regex: `^${escapeRegularExpression(folder)}$`,

        $options: "i",
      };
    }

    if (tag) {
      filter.tags = {
        $regex: `^${escapeRegularExpression(tag)}$`,

        $options: "i",
      };
    }

    const skip = (page - 1) * limit;

    const [mediaRecords, total] = await Promise.all([
      Media.find(filter)
        .populate(createAdminPopulation())
        .sort(MEDIA_SORT_OPTIONS[sortOption])
        .skip(skip)
        .limit(limit)
        .lean(),

      Media.countDocuments(filter),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return response.status(200).json({
      success: true,

      count: mediaRecords.length,

      total,

      page,

      limit,

      totalPages,

      data: mediaRecords,
    });
  } catch (error) {
    return sendMediaError(error, response, next);
  }
}

async function getAdminMediaById(request, response, next) {
  try {
    validateMediaId(request.params.id);

    const media = await Media.findById(request.params.id)
      .populate(createAdminPopulation())
      .lean();

    if (!media) {
      throw createHttpError("Media record not found.", 404);
    }

    const usage = await getMediaUsageSummary(media.url);

    return response.status(200).json({
      success: true,

      data: {
        ...media,
        usage,
      },
    });
  } catch (error) {
    return sendMediaError(error, response, next);
  }
}

async function getAdminMediaFolders(request, response) {
  try {
    const folders = await Media.aggregate([
      {
        $match: {
          folder: {
            $type: "string",
            $ne: "",
          },
        },
      },
      {
        $group: {
          _id: "$folder",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const normalizedFolders = folders.map((folderRecord) => ({
      folder: folderRecord._id,
      count: folderRecord.count,
    }));

    return response.status(200).json({
      success: true,
      count: normalizedFolders.length,
      data: normalizedFolders,
    });
  } catch (error) {
    console.error("Admin Media folders loading failed:", error);

    return response.status(500).json({
      success: false,
      message: "Media folders could not be loaded.",
    });
  }
}

async function createAdminMedia(request, response, next) {
  let storedAsset = null;
  let databaseRecordCreated = false;

  try {
    const validatedFile = await validateUploadedMediaFile(request);

    const metadata = buildUploadMetadata(
      request.body,
      request.file.originalname,
    );

    storedAsset = await uploadMediaAsset({
      filePath: request.file.path,
      validatedFile,
    });

    const media = await Media.create({
      ...storedAsset,
      originalName: validatedFile.originalName,
      title: metadata.title,
      altText: metadata.altText,
      isDecorative: metadata.isDecorative,
      caption: metadata.caption,
      description: metadata.description,
      folder: metadata.folder,
      tags: metadata.tags,
      uploadedBy: request.admin._id,
      updatedBy: request.admin._id,
    });

    databaseRecordCreated = true;

    await createAuditLogBestEffort({
      actor: request.admin,
      category: "media",
      action: "upload",
      outcome: "success",
      resource: {
        type: "media",
        id: media._id,
        label: "Media asset",
      },
      metadata: {
        mediaType: media.mediaType,
        provider: media.provider,
      },
      request,
    });

    return response.status(201).json({
      success: true,
      message: "Media uploaded successfully.",
      data: media,
    });
  } catch (error) {
    if (storedAsset && !databaseRecordCreated) {
      try {
        await cleanupUploadedMediaAsset(storedAsset);
      } catch (cleanupError) {
        console.error(
          "Failed to clean Cloudinary asset after Media database failure:",
          cleanupError,
        );
      }
    }

    return sendMediaError(error, response, next);
  } finally {
    await cleanupMediaUpload(request);
  }
}

async function updateAdminMedia(request, response, next) {
  try {
    requireJsonContentType(request);

    validateMediaId(request.params.id);

    const payload = buildMediaUpdatePayload(request.body);

    if (Object.keys(payload).length === 0) {
      throw createHttpError(
        "At least one Media metadata field is required for updating.",
        400,
      );
    }

    let updatedMediaId = null;

    await mongoose.connection.transaction(async (session) => {
      const media = await Media.findById(request.params.id)
        .session(session);

      if (!media) {
        throw createHttpError("Media record not found.", 404);
      }

      for (const fieldName of EDITABLE_MEDIA_FIELDS) {
        if (hasOwnProperty(payload, fieldName)) {
          media[fieldName] = payload[fieldName];
        }
      }

      media.updatedBy = request.admin._id;

      await media.save({
        session,
      });

      await createAuditLog({
        actor: request.admin,
        category: "media",
        action: "update",
        outcome: "success",
        resource: {
          type: "media",
          id: media._id,
          label: "Media asset",
        },
        request,
        session,
      });

      updatedMediaId = media._id;
    });

    const media = await Media.findById(updatedMediaId)
      .populate(createAdminPopulation());

    return response.status(200).json({
      success: true,
      message: "Media metadata updated successfully.",
      data: media,
    });
  } catch (error) {
    return sendMediaError(error, response, next);
  }
}

async function deleteAdminMedia(request, response, next) {
  try {
    validateMediaId(request.params.id);

    const media = await Media.findById(request.params.id);

    if (!media) {
      throw createHttpError("Media record not found.", 404);
    }

    const usage = await getMediaUsageSummary(media.url);

    if (usage.isReferenced) {
      const resourceSummary = usage.resourceTypes.join(", ");

      throw createHttpError(
        "Media asset is currently referenced and cannot be deleted.",
        409,
        {
          media: resourceSummary
            ? `Remove this Media asset from the following content first: ${resourceSummary}.`
            : "Remove this Media asset from existing content before deleting it.",
        },
      );
    }

    await destroyCloudinaryAsset({
      providerPublicId: media.providerPublicId,
      providerResourceType: media.providerResourceType,
    });

    const deleteResult = await Media.deleteOne({
      _id: media._id,
    });

    if (deleteResult.deletedCount !== 1) {
      throw createHttpError("Media record not found.", 404);
    }

    await createAuditLogBestEffort({
      actor: request.admin,
      category: "media",
      action: "delete",
      outcome: "success",
      resource: {
        type: "media",
        id: media._id,
        label: "Media asset",
      },
      metadata: {
        mediaType: media.mediaType,
        provider: media.provider,
      },
      request,
    });

    return response.status(200).json({
      success: true,
      message: "Media permanently deleted.",
      data: {
        id: media._id,
        title: media.title,
        originalName: media.originalName,
        mediaType: media.mediaType,
      },
    });
  } catch (error) {
    return sendMediaError(error, response, next);
  }
}

export {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
  MEDIA_SORT_OPTIONS,
  createAdminMedia,
  deleteAdminMedia,
  getAdminMedia,
  getAdminMediaFolders,
  getAdminMediaById,
  updateAdminMedia,
};
