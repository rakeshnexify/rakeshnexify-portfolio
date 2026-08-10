import Faq, {
  FAQ_CATEGORY_MAX_LENGTH,
  FAQ_QUESTION_MAX_LENGTH,
  normalizeFaqIdentity,
  normalizeSingleLineText,
} from "../models/Faq.js";

const allowedPublicFaqQueryFields = new Set([
  "search",
  "category",
  "featured",
]);

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function assertAllowedQueryFields(query) {
  const unknownFields = Object.keys(query).filter(
    (fieldName) => !allowedPublicFaqQueryFields.has(fieldName),
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

function cleanOptionalBooleanQuery(value, fieldName) {
  const queryValue = requireSingleQueryString(value, fieldName);

  if (queryValue === undefined || queryValue === "") {
    return undefined;
  }

  if (queryValue === "true") {
    return true;
  }

  if (queryValue === "false") {
    return false;
  }

  throw createHttpError(`${fieldName} must be true or false.`, 400, {
    [fieldName]: `${fieldName} must be true or false.`,
  });
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

function cleanCategory(value) {
  const queryValue = requireSingleQueryString(value, "category");

  if (queryValue === undefined) {
    return "";
  }

  const category = normalizeSingleLineText(queryValue);

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

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sendFaqError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      fieldErrors: error.fieldErrors || {},
    });
  }

  return next(error);
}

async function getPublicFaqs(req, res, next) {
  try {
    assertAllowedQueryFields(req.query);

    const filter = {
      isVisible: true,
    };

    const search = cleanSearch(req.query.search);
    const category = cleanCategory(req.query.category);
    const featured = cleanOptionalBooleanQuery(
      req.query.featured,
      "featured",
    );

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

    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    const faqs = await Faq.find(filter)
      .select(
        [
          "question",
          "answer",
          "category",
          "order",
          "isFeatured",
        ].join(" "),
      )
      .sort({
        isFeatured: -1,
        order: 1,
        categoryKey: 1,
        question: 1,
        _id: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
    });
  } catch (error) {
    return sendFaqError(error, res, next);
  }
}

export { getPublicFaqs };
