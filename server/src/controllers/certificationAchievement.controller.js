import CertificationAchievement, {
  CERTIFICATION_ACHIEVEMENT_TYPES,
} from "../models/CertificationAchievement.js";

const ALLOWED_PUBLIC_QUERY_FIELDS = new Set(["type"]);

const publicCertificationAchievementFields = [
  "type",
  "title",
  "slug",
  "issuerName",
  "shortDescription",
  "description",
  "issueDate",
  "doesNotExpire",
  "expirationDate",
  "credentialId",
  "verificationUrl",
  "mediaUrl",
  "mediaAlt",
  "relatedEducation",
  "relatedExperience",
  "order",
  "isFeatured",
  "createdAt",
  "updatedAt",
].join(" ");

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function hasOwnProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function assertValidPublicQuery(query = {}) {
  if (!query || typeof query !== "object" || Array.isArray(query)) {
    throw createHttpError(
      "Certification/Achievement query parameters are not valid.",
      400,
    );
  }

  const unsupportedFields = Object.keys(query).filter(
    (fieldName) => !ALLOWED_PUBLIC_QUERY_FIELDS.has(fieldName),
  );

  if (unsupportedFields.length > 0) {
    throw createHttpError(
      `Unsupported Certification/Achievement query parameter${
        unsupportedFields.length === 1 ? "" : "s"
      }: ${unsupportedFields.join(", ")}.`,
      400,
      Object.fromEntries(
        unsupportedFields.map((fieldName) => [
          fieldName,
          "This query parameter is not supported.",
        ]),
      ),
    );
  }

  Object.entries(query).forEach(([fieldName, value]) => {
    if (typeof value !== "string") {
      throw createHttpError(
        `Query parameter "${fieldName}" must contain one text value.`,
        400,
        {
          [fieldName]:
            "Provide this query parameter once as a single text value.",
        },
      );
    }
  });
}

function parseTypeQuery(query) {
  if (!hasOwnProperty(query, "type")) {
    return "";
  }

  const cleanType = query.type.trim().toLowerCase();

  if (!CERTIFICATION_ACHIEVEMENT_TYPES.includes(cleanType)) {
    throw createHttpError(
      "Invalid Certification/Achievement type filter.",
      400,
      {
        type: "Please select a supported Certification/Achievement type.",
      },
    );
  }

  return cleanType;
}

function sendPublicCertificationAchievementError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      fieldErrors: error.fieldErrors || {},
    });
  }

  return next(error);
}

async function getPublicCertificationAchievements(req, res, next) {
  try {
    assertValidPublicQuery(req.query);

    const filter = {
      isVisible: true,
    };

    const type = parseTypeQuery(req.query);

    if (type) {
      filter.type = type;
    }

    const records = await CertificationAchievement.find(filter)
      .select(publicCertificationAchievementFields)
      .sort({
        isFeatured: -1,
        order: 1,
        issueDate: -1,
        createdAt: 1,
        _id: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return sendPublicCertificationAchievementError(error, res, next);
  }
}

export { getPublicCertificationAchievements };
