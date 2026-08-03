import TeamMember from "../models/TeamMember.js";

const allowedMemberStatuses = ["active", "inactive", "former", "archived"];

const allowedAvailabilityStatuses = [
  "available",
  "limited",
  "unavailable",
  "on-leave",
];

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

function parseEnumQuery(value, allowedValues) {
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase();

  if (!cleanValue || !allowedValues.includes(cleanValue)) {
    return undefined;
  }

  return cleanValue;
}

async function getPublicTeamMembers(req, res, next) {
  try {
    const filter = {
      isVisible: true,
    };

    const search = String(req.query.search || "").trim();

    const professionalRole = String(req.query.professionalRole || "").trim();

    const status = parseEnumQuery(req.query.status, allowedMemberStatuses);

    const availabilityStatus = parseEnumQuery(
      req.query.availabilityStatus,
      allowedAvailabilityStatuses,
    );

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
          professionalRole: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          teamPosition: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          shortIntroduction: {
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

    if (professionalRole) {
      filter.professionalRole = {
        $regex: `^${escapeRegularExpression(professionalRole)}$`,
        $options: "i",
      };
    }

    if (status) {
      filter.status = status;
    }

    if (availabilityStatus) {
      filter.availabilityStatus = availabilityStatus;
    }

    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    const teamMembers = await TeamMember.find(filter)
      .select(
        [
          "-biography",
          "-relatedProjects",
          "-relatedCompanies",
          "-relatedServices",
          "-createdBy",
          "-updatedBy",
        ].join(" "),
      )
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: teamMembers.length,
      data: teamMembers,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPublicTeamMemberBySlug(req, res, next) {
  try {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();

    const teamMember = await TeamMember.findOne({
      slug,
      isVisible: true,
    })
      .select("-createdBy -updatedBy")
      .populate({
        path: "relatedProjects",
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
        options: {
          sort: {
            order: 1,
            createdAt: 1,
          },
        },
      })
      .populate({
        path: "relatedCompanies",
        match: {
          isVisible: true,
        },
        select: [
          "name",
          "slug",
          "shortDescription",
          "logoUrl",
          "industry",
          "status",
        ].join(" "),
        options: {
          sort: {
            order: 1,
            createdAt: 1,
          },
        },
      })
      .populate({
        path: "relatedServices",
        match: {
          isVisible: true,
        },
        select: ["title", "slug", "shortDescription", "icon", "iconUrl"].join(
          " ",
        ),
        options: {
          sort: {
            order: 1,
            createdAt: 1,
          },
        },
      })
      .lean();

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: "Team member not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: teamMember,
    });
  } catch (error) {
    return next(error);
  }
}

export { getPublicTeamMemberBySlug, getPublicTeamMembers };
