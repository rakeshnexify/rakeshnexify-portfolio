import Post, { POST_TYPES } from "../models/Post.js";

const publicPostListFields = [
  "title",
  "slug",
  "type",
  "excerpt",
  "featuredImageUrl",
  "featuredImageAlt",
  "category",
  "tags",
  "authorName",
  "publishedAt",
  "readingTime",
  "relatedProjects",
  "order",
  "isFeatured",
  "seo",
  "createdAt",
  "updatedAt",
].join(" ");

const publicPostDetailFields = [
  publicPostListFields,
  "content",
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

function parsePostTypeQuery(value) {
  if (value === undefined || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw createHttpError("type must be blog or news.", 400, {
      type: "Select blog or news.",
    });
  }

  const cleanType = value.trim().toLowerCase();

  if (!POST_TYPES.includes(cleanType)) {
    throw createHttpError("type must be blog or news.", 400, {
      type: "Select blog or news.",
    });
  }

  return cleanType;
}

function sendPublicPostError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      fieldErrors: error.fieldErrors || {},
    });
  }

  return next(error);
}

function createPublicRelatedProjectPopulation() {
  return {
    path: "relatedProjects",
    match: {
      isVisible: true,
    },
    select: relatedProjectPublicFields,
  };
}

async function getPublicPosts(req, res, next) {
  try {
    const filter = {
      isVisible: true,
    };

    const search = parseStringQuery(req.query, "search");
    const category = parseStringQuery(req.query, "category");
    const tag = parseStringQuery(req.query, "tag");

    if (hasBracketStyleQuery(req.query, "type")) {
      throw createHttpError("type must be blog or news.", 400, {
        type: "Select blog or news.",
      });
    }

    if (hasBracketStyleQuery(req.query, "featured")) {
      throw createHttpError("featured must be true or false.", 400, {
        featured: "featured must be true or false.",
      });
    }

    const type = parsePostTypeQuery(req.query.type);
    const featured = parseBooleanQuery(req.query.featured, "featured");

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
          excerpt: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          content: {
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
          tags: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          authorName: {
            $regex: safeSearch,
            $options: "i",
          },
        },
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

    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    const posts = await Post.find(filter)
      .select(publicPostListFields)
      .populate(createPublicRelatedProjectPopulation())
      .sort({
        isFeatured: -1,
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
    return sendPublicPostError(error, res, next);
  }
}

async function getPublicPostBySlug(req, res, next) {
  try {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();

    if (!slug) {
      throw createHttpError("Post slug is required.", 400, {
        slug: "Post slug is required.",
      });
    }

    const post = await Post.findOne({
      slug,
      isVisible: true,
    })
      .select(publicPostDetailFields)
      .populate(createPublicRelatedProjectPopulation())
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    return sendPublicPostError(error, res, next);
  }
}

export { getPublicPostBySlug, getPublicPosts };
