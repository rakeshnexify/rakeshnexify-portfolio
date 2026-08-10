import mongoose from "mongoose";

import Faq, {
  FAQ_ANSWER_MAX_LENGTH,
  FAQ_ANSWER_MIN_LENGTH,
  FAQ_CATEGORY_MAX_LENGTH,
  FAQ_CATEGORY_MIN_LENGTH,
  FAQ_ORDER_MAX,
  FAQ_QUESTION_MAX_LENGTH,
  FAQ_QUESTION_MIN_LENGTH,
  normalizeFaqIdentity,
  normalizeSingleLineText,
} from "../models/Faq.js";

const editableFaqFields = new Set([
  "question",
  "answer",
  "category",
  "order",
  "isFeatured",
  "isVisible",
]);

const allowedAdminFaqQueryFields = new Set([
  "search",
  "category",
  "isVisible",
  "isFeatured",
  "page",
  "limit",
]);

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function requireJsonContentType(req) {
  if (!req.is("application/json")) {
    throw createHttpError(
      "FAQ write requests must use application/json.",
      415,
      {
        body: "Send the FAQ request body using application/json.",
      },
    );
  }
}

function assertAllowedBodyFields(requestBody) {
  const unknownFields = Object.keys(requestBody).filter(
    (fieldName) => !editableFaqFields.has(fieldName),
  );

  if (unknownFields.length > 0) {
    throw createHttpError(
      `Unsupported FAQ field: ${unknownFields[0]}.`,
      400,
      {
        [unknownFields[0]]:
          "This field cannot be written through the FAQ API.",
      },
    );
  }
}

function assertAllowedQueryFields(query) {
  const unknownFields = Object.keys(query).filter(
    (fieldName) => !allowedAdminFaqQueryFields.has(fieldName),
  );

  if (unknownFields.length > 0) {
    throw createHttpError(
      `Unsupported FAQ query parameter: ${unknownFields[0]}.`,
      400,
      {
        query: "Remove unsupported FAQ query parameters.",
      },
    );
  }
}

function requireSingleQueryString(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw createHttpError(
      `${fieldName} must be provided exactly once as text.`,
      400,
      {
        [fieldName]: `Provide exactly one ${fieldName} query value.`,
      },
    );
  }

  return value;
}

function requireTextField(value, fieldName, label) {
  if (typeof value !== "string") {
    throw createHttpError(`${label} must be provided as text.`, 400, {
      [fieldName]: `${label} must be provided as text.`,
    });
  }

  return value;
}

function cleanOptionalBooleanQuery(value, fieldName) {
  const queryValue = requireSingleQueryString(value, fieldName);

  if (queryValue === undefined || queryValue === "") {
    return undefined;
  }

  return cleanBoolean(queryValue, fieldName);
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

function cleanOrder(value) {
  const supported =
    typeof value === "number" || typeof value === "string";

  const rawValue =
    typeof value === "string" ? value.trim() : value;

  if (!supported || rawValue === "") {
    throw createHttpError(
      "FAQ display order must be a whole number from 0 to 1000000.",
      400,
      {
        order: "Enter a whole number from 0 to 1000000.",
      },
    );
  }

  if (
    typeof rawValue === "string" &&
    !/^\d+$/.test(rawValue)
  ) {
    throw createHttpError(
      "FAQ display order must be a whole number from 0 to 1000000.",
      400,
      {
        order: "Enter a whole number from 0 to 1000000.",
      },
    );
  }

  const order = Number(rawValue);

  if (
    !Number.isSafeInteger(order) ||
    order < 0 ||
    order > FAQ_ORDER_MAX
  ) {
    throw createHttpError(
      `FAQ display order must be a whole number from 0 to ${FAQ_ORDER_MAX}.`,
      400,
      {
        order: `Enter a whole number from 0 to ${FAQ_ORDER_MAX}.`,
      },
    );
  }

  return order;
}

function cleanQuestion(value) {
  const question = normalizeSingleLineText(
    requireTextField(value, "question", "FAQ question"),
  );

  if (
    question.length < FAQ_QUESTION_MIN_LENGTH ||
    question.length > FAQ_QUESTION_MAX_LENGTH
  ) {
    throw createHttpError(
      `FAQ question must contain ${FAQ_QUESTION_MIN_LENGTH} to ${FAQ_QUESTION_MAX_LENGTH} characters.`,
      400,
      {
        question: `Question must contain ${FAQ_QUESTION_MIN_LENGTH} to ${FAQ_QUESTION_MAX_LENGTH} characters.`,
      },
    );
  }

  return question;
}

function cleanAnswer(value) {
  const answer = requireTextField(
    value,
    "answer",
    "FAQ answer",
  ).trim();

  if (
    answer.length < FAQ_ANSWER_MIN_LENGTH ||
    answer.length > FAQ_ANSWER_MAX_LENGTH
  ) {
    throw createHttpError(
      `FAQ answer must contain ${FAQ_ANSWER_MIN_LENGTH} to ${FAQ_ANSWER_MAX_LENGTH} characters.`,
      400,
      {
        answer: `Answer must contain ${FAQ_ANSWER_MIN_LENGTH} to ${FAQ_ANSWER_MAX_LENGTH} characters.`,
      },
    );
  }

  return answer;
}

function cleanCategory(value) {
  const category = normalizeSingleLineText(
    requireTextField(value, "category", "FAQ category"),
  );

  if (
    category.length < FAQ_CATEGORY_MIN_LENGTH ||
    category.length > FAQ_CATEGORY_MAX_LENGTH
  ) {
    throw createHttpError(
      `FAQ category must contain ${FAQ_CATEGORY_MIN_LENGTH} to ${FAQ_CATEGORY_MAX_LENGTH} characters.`,
      400,
      {
        category: `Category must contain ${FAQ_CATEGORY_MIN_LENGTH} to ${FAQ_CATEGORY_MAX_LENGTH} characters.`,
      },
    );
  }

  return category;
}

function cleanSearch(value) {
  const queryValue = requireSingleQueryString(value, "search");

  if (queryValue === undefined) {
    return "";
  }

  const search = normalizeSingleLineText(queryValue);

  if (search.length > FAQ_QUESTION_MAX_LENGTH) {
    throw createHttpError(
      `FAQ search cannot exceed ${FAQ_QUESTION_MAX_LENGTH} characters.`,
      400,
      {
        search: `Search cannot exceed ${FAQ_QUESTION_MAX_LENGTH} characters.`,
      },
    );
  }

  return search;
}

function cleanOptionalCategoryFilter(value) {
  const queryValue = requireSingleQueryString(value, "category");

  if (queryValue === undefined) {
    return "";
  }

  const category = normalizeSingleLineText(queryValue);

  if (!category) {
    return "";
  }

  if (category.length > FAQ_CATEGORY_MAX_LENGTH) {
    throw createHttpError(
      `FAQ category filter cannot exceed ${FAQ_CATEGORY_MAX_LENGTH} characters.`,
      400,
      {
        category: `Category cannot exceed ${FAQ_CATEGORY_MAX_LENGTH} characters.`,
      },
    );
  }

  return category;
}

function cleanPositiveIntegerQuery(
  value,
  fieldName,
  defaultValue,
  maximum = Number.MAX_SAFE_INTEGER,
) {
  const queryValue = requireSingleQueryString(value, fieldName);

  if (queryValue === undefined || queryValue === "") {
    return defaultValue;
  }

  const rawValue = queryValue.trim();

  if (!/^\d+$/.test(rawValue)) {
    throw createHttpError(
      `${fieldName} must be a positive whole number.`,
      400,
      {
        [fieldName]: `${fieldName} must be a positive whole number.`,
      },
    );
  }

  const number = Number(rawValue);

  if (
    !Number.isSafeInteger(number) ||
    number < 1 ||
    number > maximum
  ) {
    throw createHttpError(
      `${fieldName} must be a positive whole number no greater than ${maximum}.`,
      400,
      {
        [fieldName]: `${fieldName} must be between 1 and ${maximum}.`,
      },
    );
  }

  return number;
}

function buildFaqPayload(requestBody) {
  if (!isPlainObject(requestBody)) {
    throw createHttpError(
      "FAQ request body must be a JSON object.",
      400,
      {
        body: "FAQ request body must be a JSON object.",
      },
    );
  }

  assertAllowedBodyFields(requestBody);

  const payload = {};

  if (hasOwnProperty(requestBody, "question")) {
    payload.question = cleanQuestion(requestBody.question);
    payload.questionKey = normalizeFaqIdentity(payload.question);
  }

  if (hasOwnProperty(requestBody, "answer")) {
    payload.answer = cleanAnswer(requestBody.answer);
  }

  if (hasOwnProperty(requestBody, "category")) {
    payload.category = cleanCategory(requestBody.category);
    payload.categoryKey = normalizeFaqIdentity(payload.category);
  }

  if (hasOwnProperty(requestBody, "order")) {
    payload.order = cleanOrder(requestBody.order);
  }

  if (hasOwnProperty(requestBody, "isFeatured")) {
    payload.isFeatured = cleanBoolean(
      requestBody.isFeatured,
      "isFeatured",
    );
  }

  if (hasOwnProperty(requestBody, "isVisible")) {
    payload.isVisible = cleanBoolean(
      requestBody.isVisible,
      "isVisible",
    );
  }

  return payload;
}

function validateFaqId(faqId) {
  if (!mongoose.isValidObjectId(faqId)) {
    throw createHttpError("Invalid FAQ ID.", 400, {
      id: "FAQ ID is invalid.",
    });
  }
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sendFaqError(error, res, next) {
  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "An FAQ with this question already exists.",
      fieldErrors: {
        question: "Please use a different FAQ question.",
      },
    });
  }

  if (error?.name === "ValidationError") {
    const fieldErrors = {};

    Object.entries(error.errors).forEach(
      ([fieldName, fieldError]) => {
        if (["questionKey", "categoryKey"].includes(fieldName)) {
          return;
        }

        fieldErrors[fieldName] = fieldError.message;
      },
    );

    return res.status(400).json({
      success: false,
      message: "Please correct the FAQ details.",
      fieldErrors,
    });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "An FAQ value is invalid.",
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

async function getAdminFaqs(req, res, next) {
  try {
    assertAllowedQueryFields(req.query);

    const search = cleanSearch(req.query.search);
    const category = cleanOptionalCategoryFilter(req.query.category);
    const isVisible = cleanOptionalBooleanQuery(
      req.query.isVisible,
      "isVisible",
    );
    const isFeatured = cleanOptionalBooleanQuery(
      req.query.isFeatured,
      "isFeatured",
    );
    const page = cleanPositiveIntegerQuery(
      req.query.page,
      "page",
      DEFAULT_PAGE,
    );
    const limit = cleanPositiveIntegerQuery(
      req.query.limit,
      "limit",
      DEFAULT_LIMIT,
      MAX_LIMIT,
    );

    const filter = {};

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        {
          question: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          answer: {
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
      filter.categoryKey = normalizeFaqIdentity(category);
    }

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    const [faqs, total] = await Promise.all([
      Faq.find(filter)
        .sort({
          order: 1,
          categoryKey: 1,
          question: 1,
          _id: 1,
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Faq.countDocuments(filter),
    ]);

    const pages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    return sendFaqError(error, res, next);
  }
}

async function getAdminFaqById(req, res, next) {
  try {
    validateFaqId(req.params.id);

    const faq = await Faq.findById(req.params.id).lean();

    if (!faq) {
      throw createHttpError("FAQ record not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    return sendFaqError(error, res, next);
  }
}

async function createAdminFaq(req, res, next) {
  try {
    requireJsonContentType(req);

    const faqData = buildFaqPayload(req.body);

    if (!hasOwnProperty(faqData, "question")) {
      throw createHttpError("FAQ question is required.", 400, {
        question: "Question is required.",
      });
    }

    if (!hasOwnProperty(faqData, "answer")) {
      throw createHttpError("FAQ answer is required.", 400, {
        answer: "Answer is required.",
      });
    }

    if (!hasOwnProperty(faqData, "category")) {
      throw createHttpError("FAQ category is required.", 400, {
        category: "Category is required.",
      });
    }

    faqData.createdBy = req.admin._id;
    faqData.updatedBy = req.admin._id;

    const faq = await Faq.create(faqData);

    return res.status(201).json({
      success: true,
      message: "FAQ created successfully.",
      data: faq,
    });
  } catch (error) {
    return sendFaqError(error, res, next);
  }
}

async function updateAdminFaq(req, res, next) {
  try {
    requireJsonContentType(req);
    validateFaqId(req.params.id);

    const faqData = buildFaqPayload(req.body);

    if (Object.keys(faqData).length === 0) {
      throw createHttpError(
        "At least one FAQ field is required for updating.",
        400,
        {
          body: "Provide at least one editable FAQ field.",
        },
      );
    }

    faqData.updatedBy = req.admin._id;

    const faq = await Faq.findByIdAndUpdate(
      req.params.id,
      {
        $set: faqData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!faq) {
      throw createHttpError("FAQ record not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "FAQ updated successfully.",
      data: faq,
    });
  } catch (error) {
    return sendFaqError(error, res, next);
  }
}

async function deleteAdminFaq(req, res, next) {
  try {
    validateFaqId(req.params.id);

    const faq = await Faq.findByIdAndDelete(req.params.id);

    if (!faq) {
      throw createHttpError("FAQ record not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "FAQ permanently deleted.",
      data: {
        id: faq._id,
        question: faq.question,
      },
    });
  } catch (error) {
    return sendFaqError(error, res, next);
  }
}

export {
  createAdminFaq,
  deleteAdminFaq,
  getAdminFaqById,
  getAdminFaqs,
  updateAdminFaq,
};
