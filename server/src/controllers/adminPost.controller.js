import mongoose from "mongoose";

import Post, { POST_TYPES } from "../models/Post.js";
import Project from "../models/Project.js";

const editableSingleLineStringFields = [
  "title",
  "slug",
  "excerpt",
  "featuredImageUrl",
  "featuredImageAlt",
  "category",
  "authorName",
];

const relatedProjectAdminFields = [
  "title",
  "slug",
  "shortDescription",
  "coverImageUrl",
  "category",
  "status",
  "isVisible",
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

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
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

function normalizeSingleLineText(value, fieldName) {
  return cleanText(value, fieldName).replace(/\s+/g, " ");
}

function createSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function requireJsonContentType(req) {
  if (!req.is("application/json")) {
    throw createHttpError("Post write requests must use application/json.", 415, {
      body: "Send the Post request body using application/json.",
    });
  }
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
  const isSupportedScalar =
    typeof value === "number" || typeof value === "string";

  const hasNonEmptyStringValue =
    typeof value !== "string" || value.trim().length > 0;

  if (!isSupportedScalar || !hasNonEmptyStringValue) {
    throw createHttpError(`${fieldName} must be a non-negative number.`, 400, {
      [fieldName]: `${fieldName} must be a non-negative number.`,
    });
  }

  const numericOrder = Number(value);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    throw createHttpError(`${fieldName} must be a non-negative number.`, 400, {
      [fieldName]: `${fieldName} must be a non-negative number.`,
    });
  }

  return numericOrder;
}

function cleanReadingTime(value) {
  const isSupportedScalar =
    typeof value === "number" || typeof value === "string";

  const hasNonEmptyStringValue =
    typeof value !== "string" || value.trim().length > 0;

  if (!isSupportedScalar || !hasNonEmptyStringValue) {
    throw createHttpError(
      "readingTime must be a whole number of at least 1 minute.",
      400,
      {
        readingTime: "Enter a whole-number reading time of at least 1 minute.",
      },
    );
  }

  const numericReadingTime = Number(value);

  if (!Number.isInteger(numericReadingTime) || numericReadingTime < 1) {
    throw createHttpError(
      "readingTime must be a whole number of at least 1 minute.",
      400,
      {
        readingTime: "Enter a whole-number reading time of at least 1 minute.",
      },
    );
  }

  return numericReadingTime;
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

function cleanDate(value, fieldName) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (
    typeof value === "boolean" ||
    Array.isArray(value) ||
    isPlainObject(value)
  ) {
    throw createHttpError(`${fieldName} must be a valid date.`, 400, {
      [fieldName]: `${fieldName} must be a valid date.`,
    });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw createHttpError(`${fieldName} must be a valid date.`, 400, {
      [fieldName]: `${fieldName} must be a valid date.`,
    });
  }

  return date;
}

function cleanStringArray(value, fieldName, { lowercase = false } = {}) {
  if (!Array.isArray(value)) {
    throw createHttpError(`${fieldName} must be an array.`, 400, {
      [fieldName]: `${fieldName} must be an array.`,
    });
  }

  const normalizedValues = value
    .map((item, index) => {
      if (typeof item !== "string") {
        throw createHttpError(`${fieldName} items must be text.`, 400, {
          [`${fieldName}.${index}`]: `${fieldName} items must be text.`,
        });
      }

      return item.trim();
    })
    .filter(Boolean)
    .map((item) => (lowercase ? item.toLowerCase() : item));

  return [...new Set(normalizedValues)];
}

function cleanObjectIdArray(value, fieldName) {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (!Array.isArray(value)) {
    throw createHttpError(`${fieldName} must be an array.`, 400, {
      [fieldName]: `${fieldName} must be an array of valid Project IDs.`,
    });
  }

  const objectIds = value
    .map((item, index) => {
      if (typeof item !== "string") {
        throw createHttpError(
          `${fieldName} must contain Project ID strings.`,
          400,
          {
            [`${fieldName}.${index}`]:
              "Please select only valid related Projects.",
          },
        );
      }

      return item.trim();
    })
    .filter(Boolean);

  const invalidObjectId = objectIds.find(
    (objectId) => !mongoose.isValidObjectId(objectId),
  );

  if (invalidObjectId) {
    throw createHttpError(
      `${fieldName} contains an invalid Project ID.`,
      400,
      {
        [fieldName]: "Please select only valid related Projects.",
      },
    );
  }

  return [...new Set(objectIds)];
}

function buildSeoPayload(seoValue) {
  if (!isPlainObject(seoValue)) {
    throw createHttpError("SEO settings must be an object.", 400, {
      seo: "SEO settings must be an object.",
    });
  }

  const seo = {};

  if (hasOwnProperty(seoValue, "title")) {
    seo.title = normalizeSingleLineText(seoValue.title, "seo.title");
  }

  if (hasOwnProperty(seoValue, "description")) {
    seo.description = cleanText(seoValue.description, "seo.description");
  }

  if (hasOwnProperty(seoValue, "keywords")) {
    seo.keywords = cleanStringArray(seoValue.keywords, "seo.keywords", {
      lowercase: true,
    });
  }

  if (hasOwnProperty(seoValue, "ogImageUrl")) {
    seo.ogImageUrl = cleanText(seoValue.ogImageUrl, "seo.ogImageUrl");
  }

  return seo;
}

function buildPostPayload(requestBody = {}) {
  if (!isPlainObject(requestBody)) {
    throw createHttpError("Post request body must be a JSON object.", 400, {
      body: "Post request body must be a JSON object.",
    });
  }

  const payload = {};

  editableSingleLineStringFields.forEach((fieldName) => {
    if (hasOwnProperty(requestBody, fieldName)) {
      payload[fieldName] = normalizeSingleLineText(requestBody[fieldName], fieldName);
    }
  });

  if (hasOwnProperty(requestBody, "content")) {
    payload.content = cleanText(requestBody.content, "content");
  }

  if (hasOwnProperty(requestBody, "type")) {
    payload.type = cleanEnum(requestBody.type, "type", POST_TYPES);
  }

  if (hasOwnProperty(requestBody, "tags")) {
    payload.tags = cleanStringArray(requestBody.tags, "tags", {
      lowercase: true,
    });
  }

  if (hasOwnProperty(requestBody, "publishedAt")) {
    payload.publishedAt = cleanDate(requestBody.publishedAt, "publishedAt");
  }

  if (hasOwnProperty(requestBody, "readingTime")) {
    payload.readingTime = cleanReadingTime(requestBody.readingTime);
  }

  if (hasOwnProperty(requestBody, "relatedProjects")) {
    payload.relatedProjects = cleanObjectIdArray(
      requestBody.relatedProjects,
      "relatedProjects",
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

function createPostUpdateSet(postData) {
  const updateSet = {
    ...postData,
  };

  if (hasOwnProperty(updateSet, "seo")) {
    const seo = updateSet.seo;

    delete updateSet.seo;

    Object.entries(seo).forEach(([fieldName, fieldValue]) => {
      updateSet[`seo.${fieldName}`] = fieldValue;
    });
  }

  return updateSet;
}

function parseBooleanQuery(value, fieldName) {
  if (value === undefined || value === "") {
    return undefined;
  }

  return cleanBoolean(value, fieldName);
}

function parsePostTypeQuery(value) {
  if (value === undefined || value === "") {
    return undefined;
  }

  return cleanEnum(value, "type", POST_TYPES);
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasBracketStyleQuery(query = {}, fieldName) {
  const escapedFieldName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const bracketPattern = new RegExp(`^${escapedFieldName}\\[.*\\]$`);

  return Object.keys(query).some((key) => bracketPattern.test(key));
}

function parseStringQuery(query, fieldName) {
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

  return value.trim();
}


function validatePostId(postId) {
  if (!mongoose.isValidObjectId(postId)) {
    throw createHttpError("Invalid Post ID.", 400);
  }
}

async function validateRelatedProjects(projectIds = []) {
  if (projectIds.length === 0) {
    return;
  }

  const existingProjects = await Project.find({
    _id: {
      $in: projectIds,
    },
  })
    .select("_id")
    .lean();

  if (existingProjects.length !== projectIds.length) {
    throw createHttpError(
      "One or more related Projects were not found.",
      400,
      {
        relatedProjects: "Please select only existing Projects.",
      },
    );
  }
}

function createAdminRelatedProjectsPopulation() {
  return {
    path: "relatedProjects",
    select: relatedProjectAdminFields,
  };
}

async function populateRelatedProjects(post) {
  await post.populate(createAdminRelatedProjectsPopulation());

  return post;
}

function sendPostError(error, res, next) {
  if (error?.code === 11000) {
    const duplicateField =
      Object.keys(error.keyPattern || error.keyValue || {})[0] || "slug";

    return res.status(409).json({
      success: false,
      message: "A Post with the same unique information already exists.",
      fieldErrors: {
        [duplicateField]: `A Post with this ${duplicateField} already exists.`,
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
      message: "Please correct the Post details.",
      fieldErrors,
    });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "A Post value or related record ID is invalid.",
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

async function getAdminPosts(req, res, next) {
  try {
    const filter = {};

    const search = parseStringQuery(req.query, "search");
    const category = parseStringQuery(req.query, "category");
    const tag = parseStringQuery(req.query, "tag");

    for (const strictFilterName of ["type", "isVisible", "isFeatured"]) {
      if (hasBracketStyleQuery(req.query, strictFilterName)) {
        throw createHttpError(
          `${strictFilterName} has an invalid query format.`,
          400,
          {
            [strictFilterName]: `${strictFilterName} has an invalid query format.`,
          },
        );
      }
    }

    const type = parsePostTypeQuery(req.query.type);
    const isVisible = parseBooleanQuery(req.query.isVisible, "isVisible");
    const isFeatured = parseBooleanQuery(req.query.isFeatured, "isFeatured");

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { slug: { $regex: safeSearch, $options: "i" } },
        { excerpt: { $regex: safeSearch, $options: "i" } },
        { content: { $regex: safeSearch, $options: "i" } },
        { category: { $regex: safeSearch, $options: "i" } },
        { tags: { $regex: safeSearch, $options: "i" } },
        { authorName: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (type !== undefined) {
      filter.type = type;
    }

    if (category) {
      filter.category = {
        $regex: `^${escapeRegularExpression(category)}$`,
        $options: "i",
      };
    }

    if (tag) {
      filter.tags = {
        $regex: `^${escapeRegularExpression(tag)}$`,
        $options: "i",
      };
    }

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    const posts = await Post.find(filter)
      .populate(createAdminRelatedProjectsPopulation())
      .sort({
        order: 1,
        publishedAt: -1,
        createdAt: -1,
        _id: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (error) {
    return sendPostError(error, res, next);
  }
}

async function getAdminPostById(req, res, next) {
  try {
    validatePostId(req.params.id);

    const post = await Post.findById(req.params.id)
      .populate(createAdminRelatedProjectsPopulation())
      .lean();

    if (!post) {
      throw createHttpError("Post not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    return sendPostError(error, res, next);
  }
}

async function createAdminPost(req, res, next) {
  try {
    requireJsonContentType(req);

    const postData = buildPostPayload(req.body);

    if (!postData.slug && postData.title) {
      postData.slug = createSlug(postData.title);
    }

    await validateRelatedProjects(postData.relatedProjects || []);

    postData.createdBy = req.admin._id;
    postData.updatedBy = req.admin._id;

    const post = await Post.create(postData);

    await populateRelatedProjects(post);

    return res.status(201).json({
      success: true,
      message: "Post created successfully.",
      data: post,
    });
  } catch (error) {
    return sendPostError(error, res, next);
  }
}

async function updateAdminPost(req, res, next) {
  try {
    requireJsonContentType(req);
    validatePostId(req.params.id);

    const postData = buildPostPayload(req.body);

    if (
      hasOwnProperty(postData, "slug") &&
      !postData.slug &&
      postData.title
    ) {
      postData.slug = createSlug(postData.title);
    }

    if (hasOwnProperty(postData, "relatedProjects")) {
      await validateRelatedProjects(postData.relatedProjects);
    }

    const updateSet = createPostUpdateSet(postData);

    if (Object.keys(updateSet).length === 0) {
      throw createHttpError(
        "At least one Post field is required for updating.",
        400,
      );
    }

    updateSet.updatedBy = req.admin._id;

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateSet,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!post) {
      throw createHttpError("Post not found.", 404);
    }

    await populateRelatedProjects(post);

    return res.status(200).json({
      success: true,
      message: "Post updated successfully.",
      data: post,
    });
  } catch (error) {
    return sendPostError(error, res, next);
  }
}

async function deleteAdminPost(req, res, next) {
  try {
    validatePostId(req.params.id);

    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      throw createHttpError("Post not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Post permanently deleted.",
      data: {
        id: post._id,
        title: post.title,
        slug: post.slug,
        type: post.type,
      },
    });
  } catch (error) {
    return sendPostError(error, res, next);
  }
}

export {
  createAdminPost,
  deleteAdminPost,
  getAdminPostById,
  getAdminPosts,
  updateAdminPost,
};
