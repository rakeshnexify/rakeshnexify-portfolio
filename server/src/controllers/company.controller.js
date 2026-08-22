import defaultCompanies from "../data/defaultCompanies.js";
import Company from "../models/Company.js";

async function createDefaultCompaniesWhenEmpty() {
  const companyCount = await Company.countDocuments();

  if (companyCount > 0) {
    return;
  }

  try {
    await Company.insertMany(defaultCompanies);
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }
  }
}

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

async function getPublicCompanies(req, res, next) {
  try {
    await createDefaultCompaniesWhenEmpty();

    const filter = {
      isVisible: true,
    };

    const search = String(req.query.search || "").trim();

    const industry = String(req.query.industry || "").trim();

    const relationship = String(req.query.relationship || "")
      .trim()
      .toLowerCase();

    const status = String(req.query.status || "")
      .trim()
      .toLowerCase();

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
          legalName: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          tagline: {
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
          industry: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          businessAreas: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          services: {
            $regex: safeSearch,
            $options: "i",
          },
        },
      ];
    }

    if (industry) {
      filter.industry = {
        $regex: `^${escapeRegularExpression(industry)}$`,
        $options: "i",
      };
    }

    if (relationship) {
      filter.relationship = relationship;
    }

    if (status) {
      filter.status = status;
    }

    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    const companies = await Company.find(filter)
      .select("-createdBy -updatedBy")
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    return next(error);
  }
}

export { getPublicCompanies };
