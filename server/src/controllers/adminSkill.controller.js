import mongoose from "mongoose";

import Skill, {
  normalizeSkillNameKey,
  proficiencyLevels,
} from "../models/Skill.js";
import { createAuditLog } from "../services/auditLog.service.js";

const editableStringFields = [
  "name",
  "slug",
  "shortName",
  "description",
  "category",
  "icon",
  "iconUrl",
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

function normalizeCategory(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
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

function cleanProficiencyPercent(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue) ||
    numericValue < 0 ||
    numericValue > 100
  ) {
    throw createHttpError(
      "Skill proficiency percentage must be between 0 and 100.",
      400,
      {
        proficiencyPercent:
          "Proficiency percentage must be a number between 0 and 100.",
      },
    );
  }

  return numericValue;
}

function cleanYearsOfExperience(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 60) {
    throw createHttpError(
      "Years of experience must be between 0 and 60.",
      400,
      {
        yearsOfExperience:
          "Years of experience must be a number between 0 and 60.",
      },
    );
  }

  return numericValue;
}

function cleanProficiencyLevel(value) {
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase();

  if (!proficiencyLevels.includes(cleanValue)) {
    throw createHttpError("Invalid Skill proficiency level.", 400, {
      proficiencyLevel: "Please select a valid proficiency level.",
    });
  }

  return cleanValue;
}

function buildSkillPayload(requestBody = {}) {
  if (
    requestBody === null ||
    typeof requestBody !== "object" ||
    Array.isArray(requestBody)
  ) {
    throw createHttpError("Skill request body must be a JSON object.", 400, {
      body: "Skill request body must be a JSON object.",
    });
  }

  const payload = {};

  editableStringFields.forEach((fieldName) => {
    if (!hasOwnProperty(requestBody, fieldName)) {
      return;
    }

    const cleanValue = String(requestBody[fieldName] || "").trim();

    if (fieldName === "slug") {
      payload.slug = createSlug(cleanValue);
      return;
    }

    if (fieldName === "category") {
      payload.category = normalizeCategory(cleanValue);
      return;
    }

    payload[fieldName] = cleanValue;
  });

  if (hasOwnProperty(requestBody, "proficiencyLevel")) {
    payload.proficiencyLevel = cleanProficiencyLevel(
      requestBody.proficiencyLevel,
    );
  }

  if (hasOwnProperty(requestBody, "proficiencyPercent")) {
    payload.proficiencyPercent = cleanProficiencyPercent(
      requestBody.proficiencyPercent,
    );
  }

  if (hasOwnProperty(requestBody, "yearsOfExperience")) {
    payload.yearsOfExperience = cleanYearsOfExperience(
      requestBody.yearsOfExperience,
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

  return payload;
}

function buildStandardContentAuditChangeSet(previous, current) {
  const changedFields = [];
  const changes = {};

  for (const fieldName of [
    "status",
    "isVisible",
    "isFeatured",
    "order",
  ]) {
    if (
      Object.prototype.hasOwnProperty.call(previous, fieldName) &&
      Object.prototype.hasOwnProperty.call(current, fieldName) &&
      previous[fieldName] !== current[fieldName]
    ) {
      changedFields.push(fieldName);
      changes[fieldName] = {
        from: previous[fieldName],
        to: current[fieldName],
      };
    }
  }

  let action = "update";

  if (
    Object.prototype.hasOwnProperty.call(previous, "isVisible") &&
    Object.prototype.hasOwnProperty.call(current, "isVisible") &&
    previous.isVisible !== current.isVisible
  ) {
    action = current.isVisible
      ? "publish"
      : "unpublish";
  } else if (
    Object.prototype.hasOwnProperty.call(previous, "status") &&
    Object.prototype.hasOwnProperty.call(current, "status") &&
    previous.status !== current.status
  ) {
    action = "status-change";
  }

  return {
    action,
    changedFields,
    changes,
  };
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

function validateSkillId(skillId) {
  if (!mongoose.isValidObjectId(skillId)) {
    throw createHttpError("Invalid Skill ID.", 400);
  }
}

async function ensureUniqueSkillName(
  name,
  excludedSkillId = null,
  session = null,
) {
  if (!name) {
    return;
  }

  const filter = {
    nameKey: normalizeSkillNameKey(name),
  };

  if (excludedSkillId) {
    filter._id = {
      $ne: excludedSkillId,
    };
  }

  let query = Skill.findOne(filter).select("_id");

  if (session) {
    query = query.session(session);
  }

  const existingSkill = await query.lean();

  if (existingSkill) {
    throw createHttpError("A Skill with the same name already exists.", 409, {
      name: "A Skill with this name already exists.",
    });
  }
}

function sendSkillError(error, res, next) {
  if (error?.code === 11000) {
    const duplicateDatabaseField =
      Object.keys(error.keyPattern || error.keyValue || {})[0] || "slug";

    const duplicateClientField =
      duplicateDatabaseField === "nameKey" ? "name" : duplicateDatabaseField;

    return res.status(409).json({
      success: false,
      message: "A Skill with the same unique information already exists.",
      fieldErrors: {
        [duplicateClientField]:
          duplicateClientField === "name"
            ? "A Skill with this name already exists."
            : `A Skill with this ${duplicateClientField} already exists.`,
      },
    });
  }

  if (error?.name === "ValidationError") {
    const fieldErrors = {};

    Object.entries(error.errors).forEach(([fieldName, fieldError]) => {
      if (fieldName === "nameKey") {
        return;
      }

      fieldErrors[fieldName] = fieldError.message;
    });

    return res.status(400).json({
      success: false,
      message: "Please correct the Skill details.",
      fieldErrors,
    });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "A Skill value or record ID is invalid.",
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

async function getAdminSkills(req, res, next) {
  try {
    const filter = {};

    const search = String(req.query.search || "").trim();
    const category = normalizeCategory(req.query.category);

    const proficiencyLevel = String(req.query.proficiencyLevel || "")
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
          shortName: {
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
          category: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    if (category) {
      filter.category = {
        $regex: `^${escapeRegularExpression(category)}$`,
        $options: "i",
      };
    }

    if (proficiencyLevel) {
      filter.proficiencyLevel = cleanProficiencyLevel(proficiencyLevel);
    }

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    const skills = await Skill.find(filter)
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: skills.length,
      data: skills,
    });
  } catch (error) {
    return sendSkillError(error, res, next);
  }
}

async function getAdminSkillById(req, res, next) {
  try {
    validateSkillId(req.params.id);

    const skill = await Skill.findById(req.params.id).lean();

    if (!skill) {
      throw createHttpError("Skill not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: skill,
    });
  } catch (error) {
    return sendSkillError(error, res, next);
  }
}

async function createAdminSkill(req, res, next) {
  try {
    const skillData = buildSkillPayload(req.body);

    if (!skillData.slug && skillData.name) {
      skillData.slug = createSlug(skillData.name);
    }

    skillData.createdBy = req.admin._id;
    skillData.updatedBy = req.admin._id;

    const skill = await mongoose.connection.transaction(
      async (session) => {
        await ensureUniqueSkillName(
          skillData.name,
          null,
          session,
        );

        const [createdSkill] = await Skill.create(
          [skillData],
          {
            session,
          },
        );

        await createAuditLog({
          actor: req.admin,
          category: "content",
          action: "create",
          outcome: "success",
          resource: {
            type: "skill",
            id: createdSkill._id,
            label: createdSkill.name,
            slug: createdSkill.slug,
          },
          request: req,
          session,
        });

        return createdSkill;
      },
    );

    return res.status(201).json({
      success: true,
      message: "Skill created successfully.",
      data: skill,
    });
  } catch (error) {
    return sendSkillError(error, res, next);
  }
}

async function updateAdminSkill(req, res, next) {
  try {
    validateSkillId(req.params.id);

    const skillData = buildSkillPayload(req.body);

    if (
      hasOwnProperty(skillData, "slug") &&
      !skillData.slug &&
      skillData.name
    ) {
      skillData.slug = createSlug(skillData.name);
    }

    if (hasOwnProperty(skillData, "slug") && !skillData.slug) {
      throw createHttpError("Skill slug cannot be empty.", 400, {
        slug: "Skill slug cannot be empty.",
      });
    }

    if (Object.keys(skillData).length === 0) {
      throw createHttpError(
        "At least one Skill field is required for updating.",
        400,
      );
    }

    skillData.updatedBy = req.admin._id;

    const updatedSkill = await mongoose.connection.transaction(
      async (session) => {
        const skill = await Skill.findById(req.params.id)
          .session(session);

        if (!skill) {
          throw createHttpError("Skill not found.", 404);
        }

        if (skillData.name) {
          await ensureUniqueSkillName(
            skillData.name,
            req.params.id,
            session,
          );
        }

        const previous = {
          isVisible: skill.isVisible,
          isFeatured: skill.isFeatured,
          order: skill.order,
        };

        skill.set(skillData);

        await skill.save({
          session,
        });

        const auditChangeSet = buildStandardContentAuditChangeSet(
          previous,
          {
            isVisible: skill.isVisible,
            isFeatured: skill.isFeatured,
            order: skill.order,
          },
        );

        await createAuditLog({
          actor: req.admin,
          category: "content",
          action: auditChangeSet.action,
          outcome: "success",
          resource: {
            type: "skill",
            id: skill._id,
            label: skill.name,
            slug: skill.slug,
          },
          changedFields: auditChangeSet.changedFields,
          changes: auditChangeSet.changes,
          request: req,
          session,
        });

        return skill;
      },
    );

    return res.status(200).json({
      success: true,
      message: "Skill updated successfully.",
      data: updatedSkill,
    });
  } catch (error) {
    return sendSkillError(error, res, next);
  }
}

async function deleteAdminSkill(req, res, next) {
  try {
    validateSkillId(req.params.id);

    const deletedSkill = await mongoose.connection.transaction(
      async (session) => {
        const skill = await Skill.findById(req.params.id)
          .select("_id name slug")
          .session(session)
          .lean();

        if (!skill) {
          throw createHttpError("Skill not found.", 404);
        }

        const deleteResult = await Skill.deleteOne(
          {
            _id: skill._id,
          },
          {
            session,
          },
        );

        if (deleteResult.deletedCount !== 1) {
          throw createHttpError("Skill not found.", 404);
        }

        await createAuditLog({
          actor: req.admin,
          category: "content",
          action: "delete",
          outcome: "success",
          resource: {
            type: "skill",
            id: skill._id,
            label: skill.name,
            slug: skill.slug,
          },
          request: req,
          session,
        });

        return skill;
      },
    );

    return res.status(200).json({
      success: true,
      message: "Skill permanently deleted.",
      data: {
        id: deletedSkill._id,
        name: deletedSkill.name,
      },
    });
  } catch (error) {
    return sendSkillError(error, res, next);
  }
}

export {
  createAdminSkill,
  deleteAdminSkill,
  getAdminSkillById,
  getAdminSkills,
  updateAdminSkill,
};
