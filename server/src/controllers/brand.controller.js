import defaultBrands from "../data/defaultBrands.js";
import Brand from "../models/Brand.js";

async function createDefaultBrandsWhenEmpty() {
  const brandCount = await Brand.countDocuments();

  if (brandCount > 0) {
    return;
  }

  try {
    await Brand.insertMany(defaultBrands);
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

async function getPublicBrands(req, res, next) {
  try {
    await createDefaultBrandsWhenEmpty();

    const filter = {
      isVisible: true,
    };

    const search = String(req.query.search || "").trim();

    const category = String(req.query.category || "").trim();

    const brandType = String(req.query.brandType || "")
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
          slug: {
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
        {
          focusAreas: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          platforms: {
            $regex: safeSearch,
            $options: "i",
          },
        },
        {
          highlights: {
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

    if (brandType) {
      filter.brandType = brandType;
    }

    if (status) {
      filter.status = status;
    }

    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    const brands = await Brand.find(filter)
      .select("-createdBy -updatedBy")
      .sort({
        isFeatured: -1,
        order: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: brands.length,
      data: brands,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPublicBrandBySlug(req, res, next) {
  try {
    await createDefaultBrandsWhenEmpty();

    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();

    const brand = await Brand.findOne({
      slug,
      isVisible: true,
    })
      .select("-createdBy -updatedBy")
      .lean();

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    return next(error);
  }
}

export { getPublicBrands, getPublicBrandBySlug };
