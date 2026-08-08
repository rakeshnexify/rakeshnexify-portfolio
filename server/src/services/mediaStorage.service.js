import { randomUUID } from "node:crypto";

import {
  getCloudinaryClient,
  getCloudinaryMediaFolder,
} from "../config/cloudinary.js";

const CLOUDINARY_DELIVERY_TYPE = "upload";

function createStorageError(
  message,
  {
    code = "MEDIA_STORAGE_ERROR",
    cause,
  } = {},
) {
  const error = new Error(message);

  error.code = code;

  if (cause) {
    error.cause = cause;
  }

  return error;
}

function createProviderPublicId({
  resourceType,
  extension,
}) {
  const basePublicId =
    `asset-${Date.now()}-${randomUUID()}`;

  if (resourceType === "raw") {
    return `${basePublicId}.${extension}`;
  }

  return basePublicId;
}

function normalizePositiveInteger(value) {
  const numericValue = Number(value);

  if (
    !Number.isInteger(numericValue) ||
    numericValue <= 0
  ) {
    return null;
  }

  return numericValue;
}

function normalizePositiveNumber(value) {
  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue) ||
    numericValue <= 0
  ) {
    return null;
  }

  return numericValue;
}

function getStoredFileName({
  providerPublicId,
  format,
  fallbackExtension,
  resourceType,
}) {
  const publicIdParts =
    String(providerPublicId)
      .split("/")
      .filter(Boolean);

  const baseName =
    publicIdParts.at(-1) || randomUUID();

  if (resourceType === "raw") {
    return baseName;
  }

  const normalizedFormat =
    String(
      format || fallbackExtension || "",
    )
      .trim()
      .toLowerCase();

  if (!normalizedFormat) {
    return baseName;
  }

  return `${baseName}.${normalizedFormat}`;
}

function assertValidUploadResponse(
  result,
  expectedResourceType,
) {
  if (!result || typeof result !== "object") {
    throw createStorageError(
      "Cloudinary returned an invalid upload response.",
      {
        code:
          "MEDIA_STORAGE_INVALID_RESPONSE",
      },
    );
  }

  if (
    !result.public_id ||
    !result.secure_url
  ) {
    throw createStorageError(
      "Cloudinary upload response is missing required asset information.",
      {
        code:
          "MEDIA_STORAGE_INCOMPLETE_RESPONSE",
      },
    );
  }

  if (
    result.resource_type !==
    expectedResourceType
  ) {
    throw createStorageError(
      "Cloudinary stored the uploaded asset using an unexpected resource type.",
      {
        code:
          "MEDIA_STORAGE_RESOURCE_TYPE_MISMATCH",
      },
    );
  }

  try {
    const parsedUrl =
      new URL(result.secure_url);

    if (
      parsedUrl.protocol !== "https:"
    ) {
      throw new Error();
    }
  } catch {
    throw createStorageError(
      "Cloudinary did not return a valid HTTPS delivery URL.",
      {
        code:
          "MEDIA_STORAGE_INVALID_URL",
      },
    );
  }
}

async function destroyCloudinaryAsset({
  providerPublicId,
  providerResourceType,
  invalidate = true,
}) {
  const publicId =
    String(providerPublicId || "").trim();

  const resourceType =
    String(
      providerResourceType || "",
    ).trim();

  if (!publicId) {
    throw createStorageError(
      "Cloudinary public ID is required for Media deletion.",
      {
        code:
          "MEDIA_STORAGE_PUBLIC_ID_REQUIRED",
      },
    );
  }

  if (
    !["image", "video", "raw"].includes(
      resourceType,
    )
  ) {
    throw createStorageError(
      "Cloudinary resource type is invalid for Media deletion.",
      {
        code:
          "MEDIA_STORAGE_RESOURCE_TYPE_INVALID",
      },
    );
  }

  const cloudinary =
    getCloudinaryClient();

  let result;

  try {
    result =
      await cloudinary.uploader.destroy(
        publicId,
        {
          resource_type:
            resourceType,

          type:
            CLOUDINARY_DELIVERY_TYPE,

          invalidate:
            Boolean(invalidate),
        },
      );
  } catch (error) {
    throw createStorageError(
      "Media asset could not be deleted from Cloudinary.",
      {
        code:
          "MEDIA_STORAGE_DELETE_FAILED",

        cause:
          error,
      },
    );
  }

  const resultValue =
    String(result?.result || "")
      .trim()
      .toLowerCase();

  if (
    resultValue !== "ok" &&
    resultValue !== "not found"
  ) {
    throw createStorageError(
      "Cloudinary did not confirm Media asset deletion.",
      {
        code:
          "MEDIA_STORAGE_DELETE_UNCONFIRMED",
      },
    );
  }

  return {
    deleted:
      resultValue === "ok",

    alreadyMissing:
      resultValue === "not found",

    result:
      resultValue,
  };
}

async function uploadMediaAsset({
  filePath,
  validatedFile,
}) {
  if (!filePath) {
    throw createStorageError(
      "Temporary Media file path is required.",
      {
        code:
          "MEDIA_STORAGE_FILE_REQUIRED",
      },
    );
  }

  if (
    !validatedFile ||
    typeof validatedFile !== "object"
  ) {
    throw createStorageError(
      "Validated Media file information is required.",
      {
        code:
          "MEDIA_STORAGE_VALIDATION_REQUIRED",
      },
    );
  }

  const {
    extension,
    mediaType,
    mimeType,
    providerResourceType,
  } = validatedFile;

  if (
    !["image", "video", "raw"].includes(
      providerResourceType,
    )
  ) {
    throw createStorageError(
      "Validated Media resource type is not supported by Cloudinary.",
      {
        code:
          "MEDIA_STORAGE_RESOURCE_TYPE_INVALID",
      },
    );
  }

  const cloudinary =
    getCloudinaryClient();

  const mediaFolder =
    getCloudinaryMediaFolder();

  const requestedPublicId =
    createProviderPublicId({
      resourceType:
        providerResourceType,

      extension,
    });

  let result;

  try {
    result =
      await cloudinary.uploader.upload(
        filePath,
        {
          resource_type:
            providerResourceType,

          type:
            CLOUDINARY_DELIVERY_TYPE,

          folder:
            mediaFolder,

          public_id:
            requestedPublicId,

          use_filename:
            false,

          unique_filename:
            false,

          overwrite:
            false,
        },
      );
  } catch (error) {
    throw createStorageError(
      "Media file could not be uploaded to Cloudinary.",
      {
        code:
          "MEDIA_STORAGE_UPLOAD_FAILED",

        cause:
          error,
      },
    );
  }

  try {
    assertValidUploadResponse(
      result,
      providerResourceType,
    );
  } catch (error) {
    if (result?.public_id) {
      try {
        await destroyCloudinaryAsset({
          providerPublicId:
            result.public_id,

          providerResourceType:
            result.resource_type ||
            providerResourceType,

          invalidate:
            false,
        });
      } catch {
        // Best-effort cleanup only.
      }
    }

    throw error;
  }

  const responseFormat =
    String(
      result.format ||
      extension ||
      "",
    )
      .trim()
      .toLowerCase();

  const width =
    ["image", "svg", "video"].includes(
      mediaType,
    )
      ? normalizePositiveInteger(
          result.width,
        )
      : null;

  const height =
    ["image", "svg", "video"].includes(
      mediaType,
    )
      ? normalizePositiveInteger(
          result.height,
        )
      : null;

  const duration =
    ["audio", "video"].includes(
      mediaType,
    )
      ? normalizePositiveNumber(
          result.duration,
        )
      : null;

  const providerPublicId =
    String(result.public_id).trim();

  return {
    provider:
      "cloudinary",

    providerPublicId,

    providerResourceType:
      String(
        result.resource_type,
      ).trim(),

    fileName:
      getStoredFileName({
        providerPublicId,
        format:
          responseFormat,
        fallbackExtension:
          extension,
        resourceType:
          providerResourceType,
      }),

    url:
      String(
        result.secure_url,
      ).trim(),

    mediaType,

    mimeType,

    extension,

    size:
      normalizePositiveInteger(
        result.bytes,
      ) ||
      validatedFile.size,

    width,

    height,

    duration,
  };
}

async function cleanupUploadedMediaAsset(
  storedAsset,
) {
  if (
    !storedAsset ||
    typeof storedAsset !== "object"
  ) {
    return {
      deleted: false,
      skipped: true,
    };
  }

  if (
    storedAsset.provider !==
    "cloudinary"
  ) {
    return {
      deleted: false,
      skipped: true,
    };
  }

  if (
    !storedAsset.providerPublicId ||
    !storedAsset.providerResourceType
  ) {
    return {
      deleted: false,
      skipped: true,
    };
  }

  return destroyCloudinaryAsset({
    providerPublicId:
      storedAsset.providerPublicId,

    providerResourceType:
      storedAsset.providerResourceType,
  });
}

export {
  CLOUDINARY_DELIVERY_TYPE,
  cleanupUploadedMediaAsset,
  createStorageError,
  destroyCloudinaryAsset,
  uploadMediaAsset,
};

export default uploadMediaAsset;