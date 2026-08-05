import Skill, { proficiencyLevels } from "../models/Skill.js";

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeCategory(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
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

function parseProficiencyQuery(value) {
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase();

  if (!cleanValue || !proficiencyLevels.includes(cleanValue)) {
    return undefined;
  }

  return cleanValue;
}

async function getPublicSkills(req, res, next) {
  try {
    const filter = {
      isVisible: true,
    };

    const search = String(req.query.search || "").trim();
    const category = normalizeCategory(req.query.category);
    const proficiencyLevel = parseProficiencyQuery(req.query.proficiencyLevel);
    const featured = parseBooleanQuery(req.query.featured);

    if (search) {
      const safeSearch = escapeRegularExpression(search);

      filter.$or = [
        {
          name: {
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
          shortName: {
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
          category: {
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

    if (proficiencyLevel) {
      filter.proficiencyLevel = proficiencyLevel;
    }

    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    const skills = await Skill.find(filter)
      .select("-createdBy -updatedBy")
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: skills.length,
      data: skills,
    });
  } catch (error) {
    return next(error);
  }
}

export { getPublicSkills };
