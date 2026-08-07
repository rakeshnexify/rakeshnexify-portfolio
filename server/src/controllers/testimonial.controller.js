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

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseBooleanQuery(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function parseRatingQuery(value) {
  if (value === undefined || value === "") {
    return undefined;
  }

  const rating = Number(value);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return undefined;
  }

  return rating;
}

async function getPublicTestimonials(req, res, next) {
  try {
    const filter = {
      isVisible: true,
    };

    const search = String(req.query.search || "").trim();
    const rating = parseRatingQuery(req.query.rating);
    const featured = parseBooleanQuery(req.query.featured);

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
        select: [
          "title",
          "slug",
          "shortDescription",
          "coverImageUrl",
          "category",
          "status",
        ].join(" "),
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
    return next(error);
  }
}

export { getPublicTestimonials };
