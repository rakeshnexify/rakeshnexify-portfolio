import {
  mkdtemp,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import multer from "multer";

import {
  getMaximumUploadBytes,
} from "../utils/mediaFileValidation.js";

const MEDIA_FILE_FIELD_NAME = "file";

const MEDIA_TEMP_DIRECTORY_PREFIX =
  "rakeshnexify-media-";

const MAX_TEXT_FIELDS = 20;
const MAX_FIELD_SIZE_BYTES = 64 * 1024;

const requestTempDirectories =
  new WeakMap();

function createMediaUploadError({
  message,
  statusCode = 400,
  code = "MEDIA_UPLOAD_ERROR",
}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
}

function mapMulterError(error) {
  if (!(error instanceof multer.MulterError)) {
    return error;
  }

  if (error.code === "LIMIT_FILE_SIZE") {
    return createMediaUploadError({
      message:
        "Uploaded file exceeds the maximum allowed upload size.",
      statusCode: 413,
      code: "MEDIA_FILE_TOO_LARGE",
    });
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return createMediaUploadError({
      message:
        "Only one Media file can be uploaded per request.",
      code: "MEDIA_FILE_COUNT_LIMIT",
    });
  }

  if (
    error.code ===
    "LIMIT_UNEXPECTED_FILE"
  ) {
    return createMediaUploadError({
      message: `Upload exactly one file using the "${MEDIA_FILE_FIELD_NAME}" field.`,
      code: "MEDIA_UNEXPECTED_FILE",
    });
  }

  if (error.code === "LIMIT_FIELD_COUNT") {
    return createMediaUploadError({
      message:
        "Media upload contains too many metadata fields.",
      code: "MEDIA_FIELD_COUNT_LIMIT",
    });
  }

  if (error.code === "LIMIT_FIELD_VALUE") {
    return createMediaUploadError({
      message:
        "A Media metadata field is too large.",
      statusCode: 413,
      code: "MEDIA_FIELD_TOO_LARGE",
    });
  }

  if (error.code === "LIMIT_PART_COUNT") {
    return createMediaUploadError({
      message:
        "Media upload contains too many multipart fields.",
      code: "MEDIA_PART_COUNT_LIMIT",
    });
  }

  if (error.code === "LIMIT_FIELD_KEY") {
    return createMediaUploadError({
      message:
        "A Media upload field name is too long.",
      code: "MEDIA_FIELD_NAME_LIMIT",
    });
  }

  return createMediaUploadError({
    message:
      "Media upload could not be processed.",
    code: "MEDIA_MULTIPART_ERROR",
  });
}

async function createRequestTempDirectory(
  request,
) {
  const existingDirectory =
    requestTempDirectories.get(request);

  if (existingDirectory) {
    return existingDirectory;
  }

  const directory = await mkdtemp(
    join(
      tmpdir(),
      MEDIA_TEMP_DIRECTORY_PREFIX,
    ),
  );

  requestTempDirectories.set(
    request,
    directory,
  );

  return directory;
}

const mediaDiskStorage =
  multer.diskStorage({
    destination(
      request,
      _file,
      callback,
    ) {
      createRequestTempDirectory(request)
        .then((directory) => {
          callback(null, directory);
        })
        .catch((error) => {
          callback(error);
        });
    },

    filename(
      _request,
      _file,
      callback,
    ) {
      callback(
        null,
        `${randomUUID()}.upload`,
      );
    },
  });

const mediaUploadParser = multer({
  storage: mediaDiskStorage,

  limits: {
    fileSize: getMaximumUploadBytes(),
    files: 1,
    fields: MAX_TEXT_FIELDS,
    parts: MAX_TEXT_FIELDS + 1,
    fieldNameSize: 100,
    fieldSize: MAX_FIELD_SIZE_BYTES,
    headerPairs: 200,
  },
}).single(MEDIA_FILE_FIELD_NAME);

async function cleanupMediaUpload(
  request,
) {
  if (!request) {
    return;
  }

  const directory =
    requestTempDirectories.get(request);

  requestTempDirectories.delete(request);

  if (!directory) {
    return;
  }

  try {
    await rm(directory, {
      recursive: true,
      force: true,
      maxRetries: 2,
      retryDelay: 50,
    });
  } catch (error) {
    console.error(
      "Failed to clean temporary Media upload directory:",
      error,
    );
  }
}

function mediaUploadMiddleware(
  request,
  response,
  next,
) {
  mediaUploadParser(
    request,
    response,
    (error) => {
      if (!error) {
        next();
        return;
      }

      const mappedError =
        mapMulterError(error);

      cleanupMediaUpload(request)
        .finally(() => {
          next(mappedError);
        });
    },
  );
}

function requireMediaUpload(
  request,
  _response,
  next,
) {
  if (!request.file?.path) {
    next(
      createMediaUploadError({
        message:
          "A Media file is required.",
        code: "MEDIA_FILE_REQUIRED",
      }),
    );

    return;
  }

  next();
}

export {
  MAX_FIELD_SIZE_BYTES,
  MAX_TEXT_FIELDS,
  MEDIA_FILE_FIELD_NAME,
  MEDIA_TEMP_DIRECTORY_PREFIX,
  cleanupMediaUpload,
  createMediaUploadError,
  mapMulterError,
  mediaUploadMiddleware,
  requireMediaUpload,
};

export default mediaUploadMiddleware;