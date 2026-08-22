import mongoose from "mongoose";

import Company from "../models/Company.js";
import { createAuditLog } from "../services/auditLog.service.js";

const editableStringFields = [
  "name",
  "slug",
  "legalName",
  "tagline",
  "shortDescription",
  "description",
  "industry",
  "role",
  "websiteUrl",
  "logoUrl",
  "coverImageUrl",
];

const allowedRelationships = ["owned", "managed", "partner", "client", "other"];

const allowedCompanyStatuses = ["planned", "active", "inactive", "archived"];

const contactFields = ["email", "phone", "address", "city", "country"];

const socialLinkFields = ["facebook", "instagram", "linkedin", "youtube", "x"];

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function cleanOptionalHttpUrl(value, fieldName) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) {
    return "";
  }

  try {
    const parsedUrl = new URL(cleanValue);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      parsedUrl.hostname &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return parsedUrl.toString();
    }
  } catch {
    // The field error below is intentionally shared for invalid URL shapes.
  }

  throw createHttpError(
    `${fieldName} must be a valid http:// or https:// URL.`,
    400,
    {
      [fieldName]:
        `${fieldName} must be a valid http:// or https:// URL without credentials.`,
    },
  );
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

function cleanFoundedYear(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const foundedYear = Number(value);

  if (
    !Number.isInteger(foundedYear) ||
    foundedYear < 1800 ||
    foundedYear > 2200
  ) {
    throw createHttpError(
      "Founded year must be a valid four-digit year.",
      400,
      {
        foundedYear: "Founded year must be between 1800 and 2200.",
      },
    );
  }

  return foundedYear;
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
    throw createHttpError("Company statistics must be an array.", 400, {
      statistics: "Company statistics must be an array.",
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

function buildCompanyPayload(requestBody = {}) {
  const payload = {};

  editableStringFields.forEach((fieldName) => {
    if (hasOwnProperty(requestBody, fieldName)) {
      const cleanValue = String(requestBody[fieldName] || "").trim();

      payload[fieldName] =
        fieldName === "slug"
          ? createSlug(cleanValue)
          : fieldName === "websiteUrl"
            ? cleanOptionalHttpUrl(cleanValue, "websiteUrl")
            : cleanValue;
    }
  });

  if (hasOwnProperty(requestBody, "relationship")) {
    payload.relationship = cleanEnum(
      requestBody.relationship,
      "relationship",
      allowedRelationships,
    );
  }

  if (hasOwnProperty(requestBody, "status")) {
    payload.status = cleanEnum(
      requestBody.status,
      "company status",
      allowedCompanyStatuses,
    );
  }

  if (hasOwnProperty(requestBody, "foundedYear")) {
    payload.foundedYear = cleanFoundedYear(requestBody.foundedYear);
  }

  if (hasOwnProperty(requestBody, "businessAreas")) {
    payload.businessAreas = cleanStringArray(
      requestBody.businessAreas,
      "businessAreas",
    );
  }

  if (hasOwnProperty(requestBody, "services")) {
    payload.services = cleanStringArray(requestBody.services, "services");
  }

  if (hasOwnProperty(requestBody, "highlights")) {
    payload.highlights = cleanStringArray(requestBody.highlights, "highlights");
  }

  if (hasOwnProperty(requestBody, "statistics")) {
    payload.statistics = buildStatisticsPayload(requestBody.statistics);
  }

  if (hasOwnProperty(requestBody, "contact")) {
    payload.contact = buildStringObjectPayload(
      requestBody.contact,
      "contact",
      contactFields,
    );
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

function buildStandardContentAuditChangeSet(previous, current) {
  const changedFields = [];
  const changes = {};

  for (const fieldName of [
    "status",
    "isVisible",
    "isFeatured",
    "order",
  ]) {
    if (
      Object.prototype.hasOwnProperty.call(previous, fieldName) &&
      Object.prototype.hasOwnProperty.call(current, fieldName) &&
      previous[fieldName] !== current[fieldName]
    ) {
      changedFields.push(fieldName);
      changes[fieldName] = {
        from: previous[fieldName],
        to: current[fieldName],
      };
    }
  }

  let action = "update";

  if (
    Object.prototype.hasOwnProperty.call(previous, "isVisible") &&
    Object.prototype.hasOwnProperty.call(current, "isVisible") &&
    previous.isVisible !== current.isVisible
  ) {
    action = current.isVisible
      ? "publish"
      : "unpublish";
  } else if (
    Object.prototype.hasOwnProperty.call(previous, "status") &&
    Object.prototype.hasOwnProperty.call(current, "status") &&
    previous.status !== current.status
  ) {
    action = "status-change";
  }

  return {
    action,
    changedFields,
    changes,
  };
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

function validateCompanyId(companyId) {
  if (!mongoose.isValidObjectId(companyId)) {
    throw createHttpError("Invalid company ID.", 400);
  }
}

function sendCompanyError(error, res, next) {
  if (error?.code === 11000) {
    const duplicateField =
      Object.keys(error.keyPattern || error.keyValue || {})[0] || "slug";

    return res.status(409).json({
      success: false,

      message: "A company with the same unique information already exists.",

      fieldErrors: {
        [duplicateField]: `A company with this ${duplicateField} already exists.`,
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

      message: "Please correct the company details.",

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

async function getAdminCompanies(req, res, next) {
  try {
    const filter = {};

    const search = String(req.query.search || "").trim();

    const industry = String(req.query.industry || "").trim();

    const relationship = String(req.query.relationship || "")
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
          legalName: {
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
        {
          highlights: {
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
      filter.relationship = cleanEnum(
        relationship,
        "relationship",
        allowedRelationships,
      );
    }

    if (status) {
      filter.status = cleanEnum(
        status,
        "company status",
        allowedCompanyStatuses,
      );
    }

    if (isVisible !== undefined) {
      filter.isVisible = isVisible;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    const companies = await Company.find(filter)
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
    return sendCompanyError(error, res, next);
  }
}

async function getAdminCompanyById(req, res, next) {
  try {
    validateCompanyId(req.params.id);

    const company = await Company.findById(req.params.id).lean();

    if (!company) {
      throw createHttpError("Company not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    return sendCompanyError(error, res, next);
  }
}

async function createAdminCompany(req, res, next) {
  try {
    const companyData = buildCompanyPayload(req.body);

    if (!companyData.slug && companyData.name) {
      companyData.slug = createSlug(companyData.name);
    }

    companyData.createdBy = req.admin._id;
    companyData.updatedBy = req.admin._id;

    const company = await mongoose.connection.transaction(
      async (session) => {
        const [createdCompany] = await Company.create(
          [companyData],
          {
            session,
          },
        );

        await createAuditLog({
          actor: req.admin,
          category: "content",
          action: "create",
          outcome: "success",
          resource: {
            type: "company",
            id: createdCompany._id,
            label: createdCompany.name,
            slug: createdCompany.slug,
          },
          request: req,
          session,
        });

        return createdCompany;
      },
    );

    return res.status(201).json({
      success: true,

      message: "Company created successfully.",

      data: company,
    });
  } catch (error) {
    return sendCompanyError(error, res, next);
  }
}

async function updateAdminCompany(req, res, next) {
  try {
    validateCompanyId(req.params.id);

    const companyData = buildCompanyPayload(req.body);

    if (
      hasOwnProperty(companyData, "slug") &&
      !companyData.slug &&
      companyData.name
    ) {
      companyData.slug = createSlug(companyData.name);
    }

    if (Object.keys(companyData).length === 0) {
      throw createHttpError(
        "At least one company field is required for updating.",
        400,
      );
    }

    companyData.updatedBy = req.admin._id;

    const updatedCompany = await mongoose.connection.transaction(
      async (session) => {
        const company = await Company.findById(req.params.id)
          .session(session);

        if (!company) {
          throw createHttpError("Company not found.", 404);
        }

        const previous = {
          status: company.status,
          isVisible: company.isVisible,
          isFeatured: company.isFeatured,
          order: company.order,
        };

        company.set(companyData);

        await company.save({
          session,
        });

        const auditChangeSet = buildStandardContentAuditChangeSet(
          previous,
          {
            status: company.status,
            isVisible: company.isVisible,
            isFeatured: company.isFeatured,
            order: company.order,
          },
        );

        await createAuditLog({
          actor: req.admin,
          category: "content",
          action: auditChangeSet.action,
          outcome: "success",
          resource: {
            type: "company",
            id: company._id,
            label: company.name,
            slug: company.slug,
          },
          changedFields: auditChangeSet.changedFields,
          changes: auditChangeSet.changes,
          request: req,
          session,
        });

        return company;
      },
    );

    return res.status(200).json({
      success: true,

      message: "Company updated successfully.",

      data: updatedCompany,
    });
  } catch (error) {
    return sendCompanyError(error, res, next);
  }
}

async function deleteAdminCompany(req, res, next) {
  try {
    validateCompanyId(req.params.id);

    const deletedCompany = await mongoose.connection.transaction(
      async (session) => {
        const company = await Company.findById(req.params.id)
          .select("_id name slug")
          .session(session)
          .lean();

        if (!company) {
          throw createHttpError("Company not found.", 404);
        }

        const deleteResult = await Company.deleteOne(
          {
            _id: company._id,
          },
          {
            session,
          },
        );

        if (deleteResult.deletedCount !== 1) {
          throw createHttpError("Company not found.", 404);
        }

        await createAuditLog({
          actor: req.admin,
          category: "content",
          action: "delete",
          outcome: "success",
          resource: {
            type: "company",
            id: company._id,
            label: company.name,
            slug: company.slug,
          },
          request: req,
          session,
        });

        return company;
      },
    );

    return res.status(200).json({
      success: true,

      message: "Company permanently deleted.",

      data: {
        id: deletedCompany._id,
        name: deletedCompany.name,
      },
    });
  } catch (error) {
    return sendCompanyError(error, res, next);
  }
}

export {
  createAdminCompany,
  deleteAdminCompany,
  getAdminCompanies,
  getAdminCompanyById,
  updateAdminCompany,
};
