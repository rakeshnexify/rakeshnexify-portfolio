import Education, { EDUCATION_TYPES } from "../models/Education.js";

const publicEducationFields = [
  "institutionName",
  "slug",
  "degree",
  "fieldOfStudy",
  "educationType",
  "startDate",
  "endDate",
  "isCurrentlyStudying",
  "grade",
  "location",
  "shortDescription",
  "description",
  "institutionUrl",
  "certificateUrl",
  "logoUrl",
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

function parseEducationType(value) {
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase();

  if (!cleanValue || !EDUCATION_TYPES.includes(cleanValue)) {
    return undefined;
  }

  return cleanValue;
}

async function getPublicEducation(req, res, next) {
  try {
    const filter = {
      isVisible: true,
    };

    const search = String(req.query.search || "").trim();
    const educationType = parseEducationType(req.query.educationType);
    const featured = parseBooleanQuery(req.query.featured);
    const currentlyStudying = parseBooleanQuery(req.query.currentlyStudying);

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        {
          institutionName: {
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
          degree: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          fieldOfStudy: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          location: {
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
          description: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    if (educationType) {
      filter.educationType = educationType;
    }

    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    if (currentlyStudying !== undefined) {
      filter.isCurrentlyStudying = currentlyStudying;
    }

    const educationRecords = await Education.find(filter)
      .select(publicEducationFields)
      .sort({
        isFeatured: -1,
        order: 1,
        startDate: -1,
        createdAt: 1,
        _id: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: educationRecords.length,
      data: educationRecords,
    });
  } catch (error) {
    return next(error);
  }
}

export { getPublicEducation };
