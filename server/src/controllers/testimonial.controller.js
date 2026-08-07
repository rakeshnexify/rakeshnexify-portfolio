import Testimonial from "../models/Testimonial.js";

const publicTestimonialFields = [
  "clientName",
  "clientRole",
  "companyName",
  "reviewText",
  "rating",
  "profileImageUrl",
  "profileImageAlt",
  "companyWebsiteUrl",
  "relatedProject",
  "order",
  "isFeatured",
  "createdAt",
  "updatedAt",
].join(" ");

const relatedProjectPublicFields = [
  "title",
  "slug",
  "shortDescription",
  "coverImageUrl",
  "category",
  "status",
].join(" ");

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseBooleanQuery(value, fieldName) {
  if (value === undefined) {
    return undefined;
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

function createInvalidRatingQueryError() {
  return createHttpError(
    "rating must be a whole number from 1 to 5.",
    400,
    {
      rating: "Select one rating from 1 to 5.",
    },
  );
}

function parseRatingQuery(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw createInvalidRatingQueryError();
    }

    return value;
  }

  if (typeof value !== "string") {
    throw createInvalidRatingQueryError();
  }

  if (!/^[1-5]$/.test(value)) {
    throw createInvalidRatingQueryError();
  }

  return Number(value);
}

function hasBracketStyleRatingQuery(query = {}) {
  return Object.keys(query).some((key) => /^rating\[.*\]$/.test(key));
}

function sendPublicTestimonialError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      fieldErrors: error.fieldErrors || {},
    });
  }

  return next(error);
}

async function getPublicTestimonials(req, res, next) {
  try {
    const filter = {
      isVisible: true,
    };

    const search = String(req.query.search || "").trim();

    if (hasBracketStyleRatingQuery(req.query)) {
      throw createInvalidRatingQueryError();
    }

    const rating = parseRatingQuery(req.query.rating);
    const featured = parseBooleanQuery(req.query.featured, "featured");

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        {
          clientName: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          clientRole: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          companyName: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          reviewText: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    if (rating !== undefined) {
      filter.rating = rating;
    }

    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    const testimonials = await Testimonial.find(filter)
      .select(publicTestimonialFields)
      .populate({
        path: "relatedProject",
        match: {
          isVisible: true,
        },
        select: relatedProjectPublicFields,
      })
      .sort({
        isFeatured: -1,
        order: 1,
        createdAt: 1,
        _id: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    });
  } catch (error) {
    return sendPublicTestimonialError(error, res, next);
  }
}

export { getPublicTestimonials };
