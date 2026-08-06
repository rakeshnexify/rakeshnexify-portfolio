import Experience, {
  EMPLOYMENT_TYPES,
} from "../models/Experience.js";

const publicExperienceFields = [
  "organizationName",
  "slug",
  "jobTitle",
  "employmentType",
  "startDate",
  "endDate",
  "isCurrent",
  "location",
  "locationType",
  "shortDescription",
  "description",
  "responsibilities",
  "achievements",
  "skills",
  "tools",
  "organizationLogoUrl",
  "organizationWebsiteUrl",
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

function parseEmploymentType(value) {
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase();

  if (!cleanValue || !EMPLOYMENT_TYPES.includes(cleanValue)) {
    return undefined;
  }

  return cleanValue;
}

async function getPublicExperience(req, res, next) {
  try {
    const filter = {
      isVisible: true,
    };

    const search = String(req.query.search || "").trim();
    const employmentType = parseEmploymentType(req.query.employmentType);
    const current = parseBooleanQuery(req.query.current);
    const featured = parseBooleanQuery(req.query.featured);

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        {
          organizationName: {
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
          jobTitle: {
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
        {
          responsibilities: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          achievements: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          skills: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          tools: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    if (employmentType) {
      filter.employmentType = employmentType;
    }

    if (current !== undefined) {
      filter.isCurrent = current;
    }

    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    const experienceRecords = await Experience.find(filter)
      .select(publicExperienceFields)
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
      count: experienceRecords.length,
      data: experienceRecords,
    });
  } catch (error) {
    return next(error);
  }
}

export { getPublicExperience };
