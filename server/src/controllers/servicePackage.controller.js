import Service from "../models/Service.js";
import ServicePackage, {
  SERVICE_PACKAGE_GROUPS,
} from "../models/ServicePackage.js";

const ALLOWED_LIST_QUERY_FIELDS = new Set(["service", "group"]);

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function hasOwnProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function assertValidListQuery(query = {}) {
  const unsupportedFields = Object.keys(query).filter(
    (fieldName) => !ALLOWED_LIST_QUERY_FIELDS.has(fieldName),
  );

  if (unsupportedFields.length > 0) {
    throw createHttpError(
      `Unsupported Service Package query parameter${
        unsupportedFields.length === 1 ? "" : "s"
      }: ${unsupportedFields.join(", ")}.`,
      400,
      Object.fromEntries(
        unsupportedFields.map((fieldName) => [
          fieldName,
          "This query parameter is not supported.",
        ]),
      ),
    );
  }

  Object.entries(query).forEach(([fieldName, value]) => {
    if (typeof value !== "string") {
      throw createHttpError(
        `Query parameter "${fieldName}" must contain one text value.`,
        400,
        {
          [fieldName]:
            "Provide this query parameter once as a single text value.",
        },
      );
    }
  });
}

function cleanSlug(value, fieldName, fieldLabel) {
  if (typeof value !== "string") {
    throw createHttpError(`${fieldLabel} must be text.`, 400, {
      [fieldName]: `${fieldLabel} must be text.`,
    });
  }

  const cleanValue = value.trim().toLowerCase();

  if (
    cleanValue.length < 2 ||
    cleanValue.length > 160 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanValue)
  ) {
    throw createHttpError(`Invalid ${fieldLabel.toLowerCase()}.`, 400, {
      [fieldName]:
        `${fieldLabel} must contain lowercase letters, numbers and hyphens only.`,
    });
  }

  return cleanValue;
}

function cleanGroup(value, fieldName = "group") {
  if (typeof value !== "string") {
    throw createHttpError("Package group must be text.", 400, {
      [fieldName]: "Package group must be text.",
    });
  }

  const cleanValue = value.trim().toLowerCase();

  if (!SERVICE_PACKAGE_GROUPS.includes(cleanValue)) {
    throw createHttpError("Invalid package group.", 400, {
      [fieldName]: "Select development or management.",
    });
  }

  return cleanValue;
}

function sendServicePackageError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      fieldErrors: error.fieldErrors || {},
    });
  }

  return next(error);
}

async function getPublicServicePackages(req, res, next) {
  try {
    assertValidListQuery(req.query);

    const filter = {
      isVisible: true,
    };

    let visibleServices;

    if (hasOwnProperty(req.query, "service")) {
      const serviceSlug = cleanSlug(
        req.query.service,
        "service",
        "Service slug",
      );

      const service = await Service.findOne({
        slug: serviceSlug,
        isVisible: true,
      })
        .select("_id title slug shortDescription icon iconUrl order")
        .lean();

      if (!service) {
        throw createHttpError("Service not found.", 404, {
          service: "Select an existing visible Service.",
        });
      }

      visibleServices = [service];
      filter.service = service._id;
    } else {
      visibleServices = await Service.find({
        isVisible: true,
      })
        .select("_id title slug shortDescription icon iconUrl order")
        .sort({
          order: 1,
          createdAt: 1,
          _id: 1,
        })
        .lean();

      filter.service = {
        $in: visibleServices.map((service) => service._id),
      };
    }

    if (hasOwnProperty(req.query, "group")) {
      filter.group = cleanGroup(req.query.group);
    }

    const records = await ServicePackage.find(filter)
      .select("-createdBy -updatedBy -createdAt -updatedAt")
      .populate({
        path: "service",
        select: "title slug shortDescription icon iconUrl order",
      })
      .sort({
        group: 1,
        isFeatured: -1,
        order: 1,
        _id: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return sendServicePackageError(error, res, next);
  }
}

async function getPublicServicePackageBySlugs(req, res, next) {
  try {
    const serviceSlug = cleanSlug(
      req.params.serviceSlug,
      "serviceSlug",
      "Service slug",
    );
    const group = cleanGroup(req.params.group);
    const packageSlug = cleanSlug(
      req.params.packageSlug,
      "packageSlug",
      "Package slug",
    );

    const service = await Service.findOne({
      slug: serviceSlug,
      isVisible: true,
    })
      .select("_id")
      .lean();

    if (!service) {
      throw createHttpError("Service not found.", 404);
    }

    const record = await ServicePackage.findOne({
      service: service._id,
      group,
      slug: packageSlug,
      isVisible: true,
    })
      .select("-createdBy -updatedBy -createdAt -updatedAt")
      .populate({
        path: "service",
        select: "title slug shortDescription icon iconUrl order",
      })
      .lean();

    if (!record) {
      throw createHttpError("Service Package not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return sendServicePackageError(error, res, next);
  }
}

export {
  getPublicServicePackageBySlugs,
  getPublicServicePackages,
};
