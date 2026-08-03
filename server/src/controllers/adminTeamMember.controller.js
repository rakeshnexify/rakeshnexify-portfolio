import mongoose from "mongoose";

import TeamMember from "../models/TeamMember.js";

const editableStringFields = [
  "name",
  "slug",
  "professionalRole",
  "teamPosition",
  "shortIntroduction",
  "biography",
  "profileImageUrl",
  "profileImageAlt",
  "coverImageUrl",
  "email",
  "phone",
  "websiteUrl",
  "portfolioUrl",
];

const allowedMemberStatuses = ["active", "inactive", "former", "archived"];

const allowedAvailabilityStatuses = [
  "available",
  "limited",
  "unavailable",
  "on-leave",
];

const socialLinkFields = [
  "github",
  "linkedin",
  "facebook",
  "instagram",
  "youtube",
  "x",
];

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function hasOwnProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function createSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createHttpError(`${fieldName} must be an array.`, 400, {
      [fieldName]: `${fieldName} must be an array.`,
    });
  }

  const cleanItems = value.map((item) => String(item).trim()).filter(Boolean);

  return [...new Set(cleanItems)];
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

function cleanOrder(value, fieldName = "order") {
  const numericOrder = Number(value);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    throw createHttpError(`${fieldName} must be a non-negative number.`, 400, {
      [fieldName]: `${fieldName} must be a non-negative number.`,
    });
  }

  return numericOrder;
}

function cleanEnum(value, fieldName, allowedValues) {
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase();

  if (!allowedValues.includes(cleanValue)) {
    throw createHttpError(`Invalid ${fieldName}.`, 400, {
      [fieldName]: `Please select a valid ${fieldName}.`,
    });
  }

  return cleanValue;
}

function buildStringObjectPayload(objectValue, objectName, allowedFields) {
  if (
    !objectValue ||
    typeof objectValue !== "object" ||
    Array.isArray(objectValue)
  ) {
    throw createHttpError(`${objectName} must be an object.`, 400, {
      [objectName]: `${objectName} must be an object.`,
    });
  }

  const payload = {};

  allowedFields.forEach((fieldName) => {
    if (hasOwnProperty(objectValue, fieldName)) {
      payload[fieldName] = String(objectValue[fieldName] || "").trim();
    }
  });

  return payload;
}

function cleanObjectIdArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createHttpError(`${fieldName} must be an array.`, 400, {
      [fieldName]: `${fieldName} must be an array.`,
    });
  }

  const cleanIds = [];

  value.forEach((item, index) => {
    const objectId = String(item || "").trim();

    if (!mongoose.isValidObjectId(objectId)) {
      throw createHttpError(
        `${fieldName} contains an invalid record ID.`,
        400,
        {
          [`${fieldName}.${index}`]: "Please select a valid related record.",
        },
      );
    }

    if (!cleanIds.includes(objectId)) {
      cleanIds.push(objectId);
    }
  });

  return cleanIds;
}

function buildSeoPayload(seoValue) {
  if (!seoValue || typeof seoValue !== "object" || Array.isArray(seoValue)) {
    throw createHttpError("SEO settings must be an object.", 400, {
      seo: "SEO settings must be an object.",
    });
  }

  const seo = {};

  if (hasOwnProperty(seoValue, "title")) {
    seo.title = String(seoValue.title || "").trim();
  }

  if (hasOwnProperty(seoValue, "description")) {
    seo.description = String(seoValue.description || "").trim();
  }

  if (hasOwnProperty(seoValue, "keywords")) {
    seo.keywords = cleanStringArray(seoValue.keywords, "seo.keywords");
  }

  if (hasOwnProperty(seoValue, "ogImageUrl")) {
    seo.ogImageUrl = String(seoValue.ogImageUrl || "").trim();
  }

  return seo;
}

function buildTeamMemberPayload(requestBody = {}) {
  const payload = {};

  editableStringFields.forEach((fieldName) => {
    if (hasOwnProperty(requestBody, fieldName)) {
      const cleanValue = String(requestBody[fieldName] || "").trim();

      payload[fieldName] =
        fieldName === "slug" ? createSlug(cleanValue) : cleanValue;
    }
  });

  if (hasOwnProperty(requestBody, "status")) {
    payload.status = cleanEnum(
      requestBody.status,
      "team member status",
      allowedMemberStatuses,
    );
  }

  if (hasOwnProperty(requestBody, "availabilityStatus")) {
    payload.availabilityStatus = cleanEnum(
      requestBody.availabilityStatus,
      "availability status",
      allowedAvailabilityStatuses,
    );
  }

  if (hasOwnProperty(requestBody, "skills")) {
    payload.skills = cleanStringArray(requestBody.skills, "skills");
  }

  if (hasOwnProperty(requestBody, "tools")) {
    payload.tools = cleanStringArray(requestBody.tools, "tools");
  }

  if (hasOwnProperty(requestBody, "socialLinks")) {
    payload.socialLinks = buildStringObjectPayload(
      requestBody.socialLinks,
      "socialLinks",
      socialLinkFields,
    );
  }

  if (hasOwnProperty(requestBody, "relatedProjects")) {
    payload.relatedProjects = cleanObjectIdArray(
      requestBody.relatedProjects,
      "relatedProjects",
    );
  }

  if (hasOwnProperty(requestBody, "relatedCompanies")) {
    payload.relatedCompanies = cleanObjectIdArray(
      requestBody.relatedCompanies,
      "relatedCompanies",
    );
  }

  if (hasOwnProperty(requestBody, "relatedServices")) {
    payload.relatedServices = cleanObjectIdArray(
      requestBody.relatedServices,
      "relatedServices",
    );
  }

  if (hasOwnProperty(requestBody, "order")) {
    payload.order = cleanOrder(requestBody.order);
  }

  if (hasOwnProperty(requestBody, "isFeatured")) {
    payload.isFeatured = cleanBoolean(requestBody.isFeatured, "isFeatured");
  }

  if (hasOwnProperty(requestBody, "isVisible")) {
    payload.isVisible = cleanBoolean(requestBody.isVisible, "isVisible");
  }

  if (hasOwnProperty(requestBody, "seo")) {
    payload.seo = buildSeoPayload(requestBody.seo);
  }

  return payload;
}

function parseBooleanQuery(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  return cleanBoolean(value, fieldName);
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateTeamMemberId(teamMemberId) {
  if (!mongoose.isValidObjectId(teamMemberId)) {
    throw createHttpError("Invalid team member ID.", 400);
  }
}

function sendTeamMemberError(error, res, next) {
  if (error?.code === 11000) {
    const duplicateField =
      Object.keys(error.keyPattern || error.keyValue || {})[0] || "slug";

    return res.status(409).json({
      success: false,
      message: "A team member with the same unique information already exists.",
      fieldErrors: {
        [duplicateField]: `A team member with this ${duplicateField} already exists.`,
      },
    });
  }

  if (error?.name === "ValidationError") {
    const fieldErrors = {};

    Object.entries(error.errors).forEach(([fieldName, fieldError]) => {
      fieldErrors[fieldName] = fieldError.message;
    });

    return res.status(400).json({
      success: false,
      message: "Please correct the team member details.",
      fieldErrors,
    });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "A related record ID is invalid.",
      fieldErrors: {},
    });
  }

  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      fieldErrors: error.fieldErrors || {},
    });
  }

  return next(error);
}

async function getAdminTeamMembers(req, res, next) {
  try {
    const filter = {};

    const search = String(req.query.search || "").trim();

    const professionalRole = String(req.query.professionalRole || "").trim();

    const status = String(req.query.status || "")
      .trim()
      .toLowerCase();

    const availabilityStatus = String(req.query.availabilityStatus || "")
      .trim()
      .toLowerCase();

    const isVisible = parseBooleanQuery(req.query.isVisible, "isVisible");

    const isFeatured = parseBooleanQuery(req.query.isFeatured, "isFeatured");

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        {
          name: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          slug: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          professionalRole: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          teamPosition: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          shortIntroduction: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          skills: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          tools: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    if (professionalRole) {
      filter.professionalRole = {
        $regex: `^${escapeRegularExpression(professionalRole)}$`,
        $options: "i",
      };
    }

    if (status) {
      filter.status = cleanEnum(
        status,
        "team member status",
        allowedMemberStatuses,
      );
    }

    if (availabilityStatus) {
      filter.availabilityStatus = cleanEnum(
        availabilityStatus,
        "availability status",
        allowedAvailabilityStatuses,
      );
    }

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    const teamMembers = await TeamMember.find(filter)
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: teamMembers.length,
      data: teamMembers,
    });
  } catch (error) {
    return sendTeamMemberError(error, res, next);
  }
}

async function getAdminTeamMemberById(req, res, next) {
  try {
    validateTeamMemberId(req.params.id);

    const teamMember = await TeamMember.findById(req.params.id).lean();

    if (!teamMember) {
      throw createHttpError("Team member not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: teamMember,
    });
  } catch (error) {
    return sendTeamMemberError(error, res, next);
  }
}

async function createAdminTeamMember(req, res, next) {
  try {
    const teamMemberData = buildTeamMemberPayload(req.body);

    if (!teamMemberData.slug && teamMemberData.name) {
      teamMemberData.slug = createSlug(teamMemberData.name);
    }

    teamMemberData.createdBy = req.admin._id;
    teamMemberData.updatedBy = req.admin._id;

    const teamMember = await TeamMember.create(teamMemberData);

    return res.status(201).json({
      success: true,
      message: "Team member created successfully.",
      data: teamMember,
    });
  } catch (error) {
    return sendTeamMemberError(error, res, next);
  }
}

async function updateAdminTeamMember(req, res, next) {
  try {
    validateTeamMemberId(req.params.id);

    const teamMemberData = buildTeamMemberPayload(req.body);

    if (
      hasOwnProperty(teamMemberData, "slug") &&
      !teamMemberData.slug &&
      teamMemberData.name
    ) {
      teamMemberData.slug = createSlug(teamMemberData.name);
    }

    if (Object.keys(teamMemberData).length === 0) {
      throw createHttpError(
        "At least one team member field is required for updating.",
        400,
      );
    }

    teamMemberData.updatedBy = req.admin._id;

    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      {
        $set: teamMemberData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedTeamMember) {
      throw createHttpError("Team member not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Team member updated successfully.",
      data: updatedTeamMember,
    });
  } catch (error) {
    return sendTeamMemberError(error, res, next);
  }
}

async function deleteAdminTeamMember(req, res, next) {
  try {
    validateTeamMemberId(req.params.id);

    const deletedTeamMember = await TeamMember.findByIdAndDelete(req.params.id);

    if (!deletedTeamMember) {
      throw createHttpError("Team member not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Team member permanently deleted.",
      data: {
        id: deletedTeamMember._id,
        name: deletedTeamMember.name,
      },
    });
  } catch (error) {
    return sendTeamMemberError(error, res, next);
  }
}

export {
  createAdminTeamMember,
  deleteAdminTeamMember,
  getAdminTeamMemberById,
  getAdminTeamMembers,
  updateAdminTeamMember,
};
