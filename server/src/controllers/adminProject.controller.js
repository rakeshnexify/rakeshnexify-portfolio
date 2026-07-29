import mongoose from "mongoose";

import Project from "../models/Project.js";

const editableStringFields = [
  "title",
  "slug",
  "shortDescription",
  "description",
  "category",
  "clientName",
  "role",
  "coverImageUrl",
];

const allowedProjectTypes = [
  "personal",
  "client",
  "company",
  "open-source",
  "practice",
];

const allowedProjectStatuses = [
  "planning",
  "in-progress",
  "completed",
  "maintained",
  "archived",
];

const linkFields = ["liveUrl", "sourceCodeUrl", "caseStudyUrl", "videoUrl"];

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

  return value.map((item) => String(item).trim()).filter(Boolean);
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

function cleanDate(value, fieldName) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw createHttpError(`${fieldName} must be a valid date.`, 400, {
      [fieldName]: `${fieldName} must be a valid date.`,
    });
  }

  return date;
}

function buildLinksPayload(linksValue) {
  if (
    !linksValue ||
    typeof linksValue !== "object" ||
    Array.isArray(linksValue)
  ) {
    throw createHttpError("Project links must be an object.", 400, {
      links: "Project links must be an object.",
    });
  }

  const links = {};

  linkFields.forEach((fieldName) => {
    if (hasOwnProperty(linksValue, fieldName)) {
      links[fieldName] = String(linksValue[fieldName] || "").trim();
    }
  });

  return links;
}

function buildImagesPayload(imagesValue) {
  if (!Array.isArray(imagesValue)) {
    throw createHttpError("Project images must be an array.", 400, {
      images: "Project images must be an array.",
    });
  }

  return imagesValue.map((imageValue, index) => {
    if (
      !imageValue ||
      typeof imageValue !== "object" ||
      Array.isArray(imageValue)
    ) {
      throw createHttpError(`Image ${index + 1} must be an object.`, 400, {
        images: `Image ${index + 1} must be an object.`,
      });
    }

    const url = String(imageValue.url || "").trim();

    if (!url) {
      throw createHttpError(`Image ${index + 1} URL is required.`, 400, {
        [`images.${index}.url`]: "Project image URL is required.",
      });
    }

    return {
      url,
      alt: String(imageValue.alt || "").trim(),
      caption: String(imageValue.caption || "").trim(),
      order: cleanOrder(imageValue.order ?? index, `images.${index}.order`),
    };
  });
}

function buildResultsPayload(resultsValue) {
  if (!Array.isArray(resultsValue)) {
    throw createHttpError("Project results must be an array.", 400, {
      results: "Project results must be an array.",
    });
  }

  return resultsValue.map((resultValue, index) => {
    if (
      !resultValue ||
      typeof resultValue !== "object" ||
      Array.isArray(resultValue)
    ) {
      throw createHttpError(`Result ${index + 1} must be an object.`, 400, {
        results: `Result ${index + 1} must be an object.`,
      });
    }

    const label = String(resultValue.label || "").trim();

    const value = String(resultValue.value || "").trim();

    const fieldErrors = {};

    if (!label) {
      fieldErrors[`results.${index}.label`] = "Result label is required.";
    }

    if (!value) {
      fieldErrors[`results.${index}.value`] = "Result value is required.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw createHttpError(
        `Please correct result ${index + 1}.`,
        400,
        fieldErrors,
      );
    }

    return {
      label,
      value,
    };
  });
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

function buildProjectPayload(requestBody = {}) {
  const payload = {};

  editableStringFields.forEach((fieldName) => {
    if (hasOwnProperty(requestBody, fieldName)) {
      payload[fieldName] = String(requestBody[fieldName] || "").trim();
    }
  });

  if (hasOwnProperty(requestBody, "projectType")) {
    payload.projectType = cleanEnum(
      requestBody.projectType,
      "project type",
      allowedProjectTypes,
    );
  }

  if (hasOwnProperty(requestBody, "status")) {
    payload.status = cleanEnum(
      requestBody.status,
      "project status",
      allowedProjectStatuses,
    );
  }

  if (hasOwnProperty(requestBody, "startedAt")) {
    payload.startedAt = cleanDate(requestBody.startedAt, "startedAt");
  }

  if (hasOwnProperty(requestBody, "completedAt")) {
    payload.completedAt = cleanDate(requestBody.completedAt, "completedAt");
  }

  if (hasOwnProperty(requestBody, "technologies")) {
    payload.technologies = cleanStringArray(
      requestBody.technologies,
      "technologies",
    );
  }

  if (hasOwnProperty(requestBody, "features")) {
    payload.features = cleanStringArray(requestBody.features, "features");
  }

  if (hasOwnProperty(requestBody, "challenges")) {
    payload.challenges = cleanStringArray(requestBody.challenges, "challenges");
  }

  if (hasOwnProperty(requestBody, "solutions")) {
    payload.solutions = cleanStringArray(requestBody.solutions, "solutions");
  }

  if (hasOwnProperty(requestBody, "images")) {
    payload.images = buildImagesPayload(requestBody.images);
  }

  if (hasOwnProperty(requestBody, "results")) {
    payload.results = buildResultsPayload(requestBody.results);
  }

  if (hasOwnProperty(requestBody, "links")) {
    payload.links = buildLinksPayload(requestBody.links);
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

function validateProjectId(projectId) {
  if (!mongoose.isValidObjectId(projectId)) {
    throw createHttpError("Invalid project ID.", 400);
  }
}

function sendProjectError(error, res, next) {
  if (error?.code === 11000) {
    const duplicateField =
      Object.keys(error.keyPattern || error.keyValue || {})[0] || "slug";

    return res.status(409).json({
      success: false,
      message: "A project with the same unique information already exists.",
      fieldErrors: {
        [duplicateField]: `A project with this ${duplicateField} already exists.`,
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
      message: "Please correct the project details.",
      fieldErrors,
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

async function getAdminProjects(req, res, next) {
  try {
    const filter = {};

    const search = String(req.query.search || "").trim();

    const category = String(req.query.category || "").trim();

    const projectType = String(req.query.projectType || "")
      .trim()
      .toLowerCase();

    const status = String(req.query.status || "")
      .trim()
      .toLowerCase();

    const isVisible = parseBooleanQuery(req.query.isVisible, "isVisible");

    const isFeatured = parseBooleanQuery(req.query.isFeatured, "isFeatured");

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
          slug: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          shortDescription: {
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
        {
          technologies: {
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

    if (projectType) {
      filter.projectType = cleanEnum(
        projectType,
        "project type",
        allowedProjectTypes,
      );
    }

    if (status) {
      filter.status = cleanEnum(
        status,
        "project status",
        allowedProjectStatuses,
      );
    }

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    const projects = await Project.find(filter)
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    return sendProjectError(error, res, next);
  }
}

async function getAdminProjectById(req, res, next) {
  try {
    validateProjectId(req.params.id);

    const project = await Project.findById(req.params.id).lean();

    if (!project) {
      throw createHttpError("Project not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    return sendProjectError(error, res, next);
  }
}

async function createAdminProject(req, res, next) {
  try {
    const projectData = buildProjectPayload(req.body);

    if (!projectData.slug && projectData.title) {
      projectData.slug = createSlug(projectData.title);
    }

    projectData.createdBy = req.admin._id;

    projectData.updatedBy = req.admin._id;

    const project = await Project.create(projectData);

    return res.status(201).json({
      success: true,
      message: "Project created successfully.",
      data: project,
    });
  } catch (error) {
    return sendProjectError(error, res, next);
  }
}

async function updateAdminProject(req, res, next) {
  try {
    validateProjectId(req.params.id);

    const projectData = buildProjectPayload(req.body);

    if (
      hasOwnProperty(projectData, "slug") &&
      !projectData.slug &&
      projectData.title
    ) {
      projectData.slug = createSlug(projectData.title);
    }

    if (Object.keys(projectData).length === 0) {
      throw createHttpError(
        "At least one project field is required for updating.",
        400,
      );
    }

    projectData.updatedBy = req.admin._id;

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $set: projectData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedProject) {
      throw createHttpError("Project not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Project updated successfully.",
      data: updatedProject,
    });
  } catch (error) {
    return sendProjectError(error, res, next);
  }
}

async function deleteAdminProject(req, res, next) {
  try {
    validateProjectId(req.params.id);

    const deletedProject = await Project.findByIdAndDelete(req.params.id);

    if (!deletedProject) {
      throw createHttpError("Project not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Project permanently deleted.",
      data: {
        id: deletedProject._id,
        title: deletedProject.title,
      },
    });
  } catch (error) {
    return sendProjectError(error, res, next);
  }
}

export {
  createAdminProject,
  deleteAdminProject,
  getAdminProjectById,
  getAdminProjects,
  updateAdminProject,
};
