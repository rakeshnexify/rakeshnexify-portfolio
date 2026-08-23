import Post, { POST_TYPES } from "../models/Post.js";

const PUBLIC_POST_SORT_OPTIONS = ["latest", "oldest", "featured"];
const DEFAULT_PAGE_LIMIT = 12;
const MAX_PAGE_LIMIT = 48;
const DETAIL_CONTEXT_LIMIT = 4;
const RELATED_CANDIDATE_LIMIT = 24;

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

const publicPostContextFields = [
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
  "isFeatured",
  "createdAt",
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

function parsePositiveIntegerQuery(
  query,
  fieldName,
  {
    defaultValue = undefined,
    maxValue = Number.MAX_SAFE_INTEGER,
  } = {},
) {
  if (hasBracketStyleQuery(query, fieldName)) {
    throw createHttpError(`${fieldName} must be a positive whole number.`, 400, {
      [fieldName]: `${fieldName} must be a positive whole number.`,
    });
  }

  const value = query?.[fieldName];

  if (value === undefined || value === "") {
    return defaultValue;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) {
    throw createHttpError(`${fieldName} must be a positive whole number.`, 400, {
      [fieldName]: `${fieldName} must be a positive whole number.`,
    });
  }

  const numericValue = Number(value);

  if (
    !Number.isSafeInteger(numericValue) ||
    numericValue < 1 ||
    numericValue > maxValue
  ) {
    throw createHttpError(
      `${fieldName} must be between 1 and ${maxValue}.`,
      400,
      {
        [fieldName]: `${fieldName} must be between 1 and ${maxValue}.`,
      },
    );
  }

  return numericValue;
}

function parseSortQuery(query) {
  if (hasBracketStyleQuery(query, "sort")) {
    throw createHttpError("sort must be latest, oldest or featured.", 400, {
      sort: "Select latest, oldest or featured.",
    });
  }

  const value = query?.sort;

  if (value === undefined || value === "") {
    return "";
  }

  if (typeof value !== "string") {
    throw createHttpError("sort must be latest, oldest or featured.", 400, {
      sort: "Select latest, oldest or featured.",
    });
  }

  const sort = value.trim().toLowerCase();

  if (!PUBLIC_POST_SORT_OPTIONS.includes(sort)) {
    throw createHttpError("sort must be latest, oldest or featured.", 400, {
      sort: "Select latest, oldest or featured.",
    });
  }

  return sort;
}

function createPublicAvailabilityFilter(now = new Date()) {
  return {
    isVisible: true,
    $or: [
      {
        publishedAt: null,
      },
      {
        publishedAt: {
          $lte: now,
        },
      },
    ],
  };
}

function createPublicSearchFilter(search) {
  const safeSearch = escapeRegularExpression(search);

  return {
    $or: [
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
    ],
  };
}

function createPublicListSort(sort) {
  if (sort === "latest") {
    return {
      publishedAt: -1,
      createdAt: -1,
      _id: -1,
    };
  }

  if (sort === "oldest") {
    return {
      publishedAt: 1,
      createdAt: 1,
      _id: 1,
    };
  }

  return {
    isFeatured: -1,
    order: 1,
    publishedAt: -1,
    createdAt: -1,
    _id: 1,
  };
}

function createPaginationMetadata({
  page,
  limit,
  total,
  isPaginated,
}) {
  const totalPages =
    total > 0 && isPaginated ? Math.ceil(total / limit) : total > 0 ? 1 : 0;

  return {
    page: isPaginated ? page : 1,
    limit: isPaginated ? limit : total,
    total,
    totalPages,
    hasPreviousPage: isPaginated && page > 1 && totalPages > 0,
    hasNextPage: isPaginated && page < totalPages,
    isPaginated,
  };
}

function normalizeCategoryKey(value) {
  return String(value || "").trim().toLowerCase();
}

function getContextPostTimestamp(post) {
  const timestamp = new Date(post?.publishedAt || post?.createdAt || 0).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getRelatedPostScore(candidate, currentPost) {
  let score = 0;

  if (candidate?.type === currentPost?.type) {
    score += 4;
  }

  if (
    normalizeCategoryKey(candidate?.category) &&
    normalizeCategoryKey(candidate?.category) ===
      normalizeCategoryKey(currentPost?.category)
  ) {
    score += 3;
  }

  const currentTags = new Set(
    (Array.isArray(currentPost?.tags) ? currentPost.tags : [])
      .map((tag) => String(tag || "").trim().toLowerCase())
      .filter(Boolean),
  );

  const matchingTagCount = (
    Array.isArray(candidate?.tags) ? candidate.tags : []
  ).reduce((count, tag) => {
    const cleanTag = String(tag || "").trim().toLowerCase();

    return count + Number(Boolean(cleanTag && currentTags.has(cleanTag)));
  }, 0);

  return score + matchingTagCount * 2;
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

async function getPublicPostFacets(now) {
  const availabilityFilter = createPublicAvailabilityFilter(now);

  const [facets = {}] = await Post.aggregate([
    {
      $match: availabilityFilter,
    },
    {
      $facet: {
        types: [
          {
            $group: {
              _id: "$type",
              count: {
                $sum: 1,
              },
            },
          },
        ],
        categories: [
          {
            $project: {
              category: {
                $trim: {
                  input: {
                    $ifNull: ["$category", ""],
                  },
                },
              },
            },
          },
          {
            $match: {
              category: {
                $ne: "",
              },
            },
          },
          {
            $group: {
              _id: {
                $toLower: "$category",
              },
              label: {
                $first: "$category",
              },
              count: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              label: 1,
            },
          },
        ],
        total: [
          {
            $count: "count",
          },
        ],
      },
    },
  ]);

  const typeCounts = {
    blog: 0,
    news: 0,
  };

  (Array.isArray(facets.types) ? facets.types : []).forEach((entry) => {
    if (POST_TYPES.includes(entry?._id)) {
      typeCounts[entry._id] = Number(entry?.count || 0);
    }
  });

  const total = Number(facets?.total?.[0]?.count || 0);

  return {
    total,
    types: {
      all: total,
      ...typeCounts,
    },
    categories: (Array.isArray(facets.categories)
      ? facets.categories
      : []
    ).map((entry) => ({
      value: String(entry?._id || ""),
      label: String(entry?.label || "").trim(),
      count: Number(entry?.count || 0),
    })),
  };
}

async function createPublicPostContext(post, now) {
  const availabilityFilter = createPublicAvailabilityFilter(now);
  const currentPostId = post?._id;

  const relationFilters = [
    {
      type: post.type,
    },
  ];

  const cleanCategory = String(post?.category || "").trim();

  if (cleanCategory) {
    relationFilters.push({
      category: {
        $regex: `^${escapeRegularExpression(cleanCategory)}$`,
        $options: "i",
      },
    });
  }

  const tags = (Array.isArray(post?.tags) ? post.tags : [])
    .map((tag) => String(tag || "").trim().toLowerCase())
    .filter(Boolean);

  if (tags.length > 0) {
    relationFilters.push({
      tags: {
        $in: tags,
      },
    });
  }

  const [recentPosts, relatedCandidates, sameTypePosts] = await Promise.all([
    Post.find({
      $and: [
        availabilityFilter,
        {
          _id: {
            $ne: currentPostId,
          },
        },
      ],
    })
      .select(publicPostContextFields)
      .sort(createPublicListSort("latest"))
      .limit(DETAIL_CONTEXT_LIMIT)
      .lean(),

    Post.find({
      $and: [
        availabilityFilter,
        {
          _id: {
            $ne: currentPostId,
          },
        },
        {
          $or: relationFilters,
        },
      ],
    })
      .select(publicPostContextFields)
      .sort(createPublicListSort("latest"))
      .limit(RELATED_CANDIDATE_LIMIT)
      .lean(),

    Post.find({
      $and: [
        availabilityFilter,
        {
          type: post.type,
        },
      ],
    })
      .select(publicPostContextFields)
      .sort(createPublicListSort("latest"))
      .lean(),
  ]);

  const relatedPosts = [...relatedCandidates]
    .sort((firstPost, secondPost) => {
      const scoreDifference =
        getRelatedPostScore(secondPost, post) -
        getRelatedPostScore(firstPost, post);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return (
        getContextPostTimestamp(secondPost) -
        getContextPostTimestamp(firstPost)
      );
    })
    .slice(0, DETAIL_CONTEXT_LIMIT);

  const currentIndex = sameTypePosts.findIndex(
    (candidate) => String(candidate?._id) === String(currentPostId),
  );

  const previousPost =
    currentIndex >= 0 && currentIndex < sameTypePosts.length - 1
      ? sameTypePosts[currentIndex + 1]
      : null;

  const nextPost =
    currentIndex > 0 ? sameTypePosts[currentIndex - 1] : null;

  return {
    recentPosts,
    relatedPosts,
    previousPost,
    nextPost,
  };
}

async function getPublicPosts(req, res, next) {
  try {
    const now = new Date();
    const search = parseStringQuery(req.query, "search");
    const category = parseStringQuery(req.query, "category");
    const tag = parseStringQuery(req.query, "tag");

    for (const strictFilterName of [
      "type",
      "featured",
      "page",
      "limit",
      "sort",
      "facets",
    ]) {
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
    const featured = parseBooleanQuery(req.query.featured, "featured");
    const requestedPage = parsePositiveIntegerQuery(req.query, "page", {
      maxValue: 100000,
    });
    const requestedLimit = parsePositiveIntegerQuery(req.query, "limit", {
      maxValue: MAX_PAGE_LIMIT,
    });
    const sort = parseSortQuery(req.query);
    const includeFacets =
      parseBooleanQuery(req.query.facets, "facets") === true;
    const isPaginated =
      requestedPage !== undefined || requestedLimit !== undefined;
    const page = requestedPage || 1;
    const limit = requestedLimit || DEFAULT_PAGE_LIMIT;

    const filter = {
      $and: [
        createPublicAvailabilityFilter(now),
      ],
    };

    if (search) {
      filter.$and.push(createPublicSearchFilter(search));
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

    const postsQuery = Post.find(filter)
      .select(publicPostListFields)
      .populate(createPublicRelatedProjectPopulation())
      .sort(createPublicListSort(sort));

    if (isPaginated) {
      postsQuery.skip((page - 1) * limit).limit(limit);
    }

    const [posts, total, facets] = await Promise.all([
      postsQuery.lean(),
      Post.countDocuments(filter),
      includeFacets
        ? getPublicPostFacets(now)
        : Promise.resolve(null),
    ]);

    return res.status(200).json({
      success: true,
      count: posts.length,
      total,
      pagination: createPaginationMetadata({
        page,
        limit,
        total,
        isPaginated,
      }),
      facets,
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

    if (hasBracketStyleQuery(req.query, "context")) {
      throw createHttpError("context must be true or false.", 400, {
        context: "context must be true or false.",
      });
    }

    const includeContext =
      parseBooleanQuery(req.query.context, "context") === true;
    const now = new Date();

    const post = await Post.findOne({
      $and: [
        createPublicAvailabilityFilter(now),
        {
          slug,
        },
      ],
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

    const context = includeContext
      ? await createPublicPostContext(post, now)
      : null;

    return res.status(200).json({
      success: true,
      data: post,
      context,
    });
  } catch (error) {
    return sendPublicPostError(error, res, next);
  }
}

export { getPublicPostBySlug, getPublicPosts };
