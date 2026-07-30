import mongoose from "mongoose";

import Brand from "../models/Brand.js";

const editableStringFields = [
  "name",
  "slug",
  "tagline",
  "shortDescription",
  "description",
  "category",
  "role",
  "websiteUrl",
  "logoUrl",
  "coverImageUrl",
];

const allowedBrandTypes = [
  "personal",
  "creator",
  "business",
  "product",
  "media",
  "education",
  "community",
  "other",
];

const allowedBrandStatuses = ["planned", "active", "inactive", "archived"];

const socialLinkFields = [
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "tiktok",
  "threads",
  "x",
  "github",
];

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function hasOwnProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function createSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createHttpError(`${fieldName} must be an array.`, 400, {
      [fieldName]: `${fieldName} must be an array.`,
    });
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function cleanBoolean(value, fieldName) {
  if (typeof value === "boolean") {
    return value;
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

function cleanOrder(value, fieldName = "order") {
  const numericOrder = Number(value);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    throw createHttpError(`${fieldName} must be a non-negative number.`, 400, {
      [fieldName]: `${fieldName} must be a non-negative number.`,
    });
  }

  return numericOrder;
}

function cleanEnum(value, fieldName, allowedValues) {
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase();

  if (!allowedValues.includes(cleanValue)) {
    throw createHttpError(`Invalid ${fieldName}.`, 400, {
      [fieldName]: `Please select a valid ${fieldName}.`,
    });
  }

  return cleanValue;
}

function cleanLaunchedYear(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const launchedYear = Number(value);

  if (
    !Number.isInteger(launchedYear) ||
    launchedYear < 1800 ||
    launchedYear > 2200
  ) {
    throw createHttpError("Launch year must be a valid four-digit year.", 400, {
      launchedYear: "Launch year must be between 1800 and 2200.",
    });
  }

  return launchedYear;
}

function buildStringObjectPayload(objectValue, objectName, allowedFields) {
  if (
    !objectValue ||
    typeof objectValue !== "object" ||
    Array.isArray(objectValue)
  ) {
    throw createHttpError(`${objectName} must be an object.`, 400, {
      [objectName]: `${objectName} must be an object.`,
    });
  }

  const payload = {};

  allowedFields.forEach((fieldName) => {
    if (hasOwnProperty(objectValue, fieldName)) {
      payload[fieldName] = String(objectValue[fieldName] || "").trim();
    }
  });

  return payload;
}

function buildStatisticsPayload(statisticsValue) {
  if (!Array.isArray(statisticsValue)) {
    throw createHttpError("Brand statistics must be an array.", 400, {
      statistics: "Brand statistics must be an array.",
    });
  }

  return statisticsValue.map((statisticValue, index) => {
    if (
      !statisticValue ||
      typeof statisticValue !== "object" ||
      Array.isArray(statisticValue)
    ) {
      throw createHttpError(`Statistic ${index + 1} must be an object.`, 400, {
        statistics: `Statistic ${index + 1} must be an object.`,
      });
    }

    const label = String(statisticValue.label || "").trim();

    const value = String(statisticValue.value || "").trim();

    const fieldErrors = {};

    if (!label) {
      fieldErrors[`statistics.${index}.label`] = "Statistic label is required.";
    }

    if (!value) {
      fieldErrors[`statistics.${index}.value`] = "Statistic value is required.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      throw createHttpError(
        `Please correct statistic ${index + 1}.`,
        400,
        fieldErrors,
      );
    }

    return {
      label,
      value,
    };
  });
}

function buildSeoPayload(seoValue) {
  if (!seoValue || typeof seoValue !== "object" || Array.isArray(seoValue)) {
    throw createHttpError("SEO settings must be an object.", 400, {
      seo: "SEO settings must be an object.",
    });
  }

  const seo = {};

  if (hasOwnProperty(seoValue, "title")) {
    seo.title = String(seoValue.title || "").trim();
  }

  if (hasOwnProperty(seoValue, "description")) {
    seo.description = String(seoValue.description || "").trim();
  }

  if (hasOwnProperty(seoValue, "keywords")) {
    seo.keywords = cleanStringArray(seoValue.keywords, "seo.keywords");
  }

  if (hasOwnProperty(seoValue, "ogImageUrl")) {
    seo.ogImageUrl = String(seoValue.ogImageUrl || "").trim();
  }

  return seo;
}

function buildBrandPayload(requestBody = {}) {
  const payload = {};

  editableStringFields.forEach((fieldName) => {
    if (hasOwnProperty(requestBody, fieldName)) {
      const cleanValue = String(requestBody[fieldName] || "").trim();

      payload[fieldName] =
        fieldName === "slug" ? createSlug(cleanValue) : cleanValue;
    }
  });

  if (hasOwnProperty(requestBody, "brandType")) {
    payload.brandType = cleanEnum(
      requestBody.brandType,
      "brand type",
      allowedBrandTypes,
    );
  }

  if (hasOwnProperty(requestBody, "status")) {
    payload.status = cleanEnum(
      requestBody.status,
      "brand status",
      allowedBrandStatuses,
    );
  }

  if (hasOwnProperty(requestBody, "launchedYear")) {
    payload.launchedYear = cleanLaunchedYear(requestBody.launchedYear);
  }

  if (hasOwnProperty(requestBody, "focusAreas")) {
    payload.focusAreas = cleanStringArray(requestBody.focusAreas, "focusAreas");
  }

  if (hasOwnProperty(requestBody, "platforms")) {
    payload.platforms = cleanStringArray(requestBody.platforms, "platforms");
  }

  if (hasOwnProperty(requestBody, "highlights")) {
    payload.highlights = cleanStringArray(requestBody.highlights, "highlights");
  }

  if (hasOwnProperty(requestBody, "statistics")) {
    payload.statistics = buildStatisticsPayload(requestBody.statistics);
  }

  if (hasOwnProperty(requestBody, "socialLinks")) {
    payload.socialLinks = buildStringObjectPayload(
      requestBody.socialLinks,
      "socialLinks",
      socialLinkFields,
    );
  }

  if (hasOwnProperty(requestBody, "order")) {
    payload.order = cleanOrder(requestBody.order);
  }

  if (hasOwnProperty(requestBody, "isFeatured")) {
    payload.isFeatured = cleanBoolean(requestBody.isFeatured, "isFeatured");
  }

  if (hasOwnProperty(requestBody, "isVisible")) {
    payload.isVisible = cleanBoolean(requestBody.isVisible, "isVisible");
  }

  if (hasOwnProperty(requestBody, "seo")) {
    payload.seo = buildSeoPayload(requestBody.seo);
  }

  return payload;
}

function parseBooleanQuery(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  return cleanBoolean(value, fieldName);
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validateBrandId(brandId) {
  if (!mongoose.isValidObjectId(brandId)) {
    throw createHttpError("Invalid brand ID.", 400);
  }
}

function sendBrandError(error, res, next) {
  if (error?.code === 11000) {
    const duplicateField =
      Object.keys(error.keyPattern || error.keyValue || {})[0] || "slug";

    return res.status(409).json({
      success: false,

      message: "A brand with the same unique information already exists.",

      fieldErrors: {
        [duplicateField]: `A brand with this ${duplicateField} already exists.`,
      },
    });
  }

  if (error?.name === "ValidationError") {
    const fieldErrors = {};

    Object.entries(error.errors).forEach(([fieldName, fieldError]) => {
      fieldErrors[fieldName] = fieldError.message;
    });

    return res.status(400).json({
      success: false,

      message: "Please correct the brand details.",

      fieldErrors,
    });
  }

  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,

      fieldErrors: error.fieldErrors || {},
    });
  }

  return next(error);
}

async function getAdminBrands(req, res, next) {
  try {
    const filter = {};

    const search = String(req.query.search || "").trim();

    const category = String(req.query.category || "").trim();

    const brandType = String(req.query.brandType || "")
      .trim()
      .toLowerCase();

    const status = String(req.query.status || "")
      .trim()
      .toLowerCase();

    const isVisible = parseBooleanQuery(req.query.isVisible, "isVisible");

    const isFeatured = parseBooleanQuery(req.query.isFeatured, "isFeatured");

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
          role: {
            $regex: safeSearch,

            $options: "i",
          },
        },
        {
          websiteUrl: {
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
      filter.brandType = cleanEnum(brandType, "brand type", allowedBrandTypes);
    }

    if (status) {
      filter.status = cleanEnum(status, "brand status", allowedBrandStatuses);
    }

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    const brands = await Brand.find(filter)
      .sort({
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
    return sendBrandError(error, res, next);
  }
}

async function getAdminBrandById(req, res, next) {
  try {
    validateBrandId(req.params.id);

    const brand = await Brand.findById(req.params.id).lean();

    if (!brand) {
      throw createHttpError("Brand not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    return sendBrandError(error, res, next);
  }
}

async function createAdminBrand(req, res, next) {
  try {
    const brandData = buildBrandPayload(req.body);

    if (!brandData.slug && brandData.name) {
      brandData.slug = createSlug(brandData.name);
    }

    brandData.createdBy = req.admin._id;

    brandData.updatedBy = req.admin._id;

    const brand = await Brand.create(brandData);

    return res.status(201).json({
      success: true,

      message: "Brand created successfully.",

      data: brand,
    });
  } catch (error) {
    return sendBrandError(error, res, next);
  }
}

async function updateAdminBrand(req, res, next) {
  try {
    validateBrandId(req.params.id);

    const brandData = buildBrandPayload(req.body);

    if (
      hasOwnProperty(brandData, "slug") &&
      !brandData.slug &&
      brandData.name
    ) {
      brandData.slug = createSlug(brandData.name);
    }

    if (Object.keys(brandData).length === 0) {
      throw createHttpError(
        "At least one brand field is required for updating.",
        400,
      );
    }

    brandData.updatedBy = req.admin._id;

    const updatedBrand = await Brand.findByIdAndUpdate(
      req.params.id,
      {
        $set: brandData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedBrand) {
      throw createHttpError("Brand not found.", 404);
    }

    return res.status(200).json({
      success: true,

      message: "Brand updated successfully.",

      data: updatedBrand,
    });
  } catch (error) {
    return sendBrandError(error, res, next);
  }
}

async function deleteAdminBrand(req, res, next) {
  try {
    validateBrandId(req.params.id);

    const deletedBrand = await Brand.findByIdAndDelete(req.params.id);

    if (!deletedBrand) {
      throw createHttpError("Brand not found.", 404);
    }

    return res.status(200).json({
      success: true,

      message: "Brand permanently deleted.",

      data: {
        id: deletedBrand._id,

        name: deletedBrand.name,
      },
    });
  } catch (error) {
    return sendBrandError(error, res, next);
  }
}

export {
  createAdminBrand,
  deleteAdminBrand,
  getAdminBrandById,
  getAdminBrands,
  updateAdminBrand,
};
