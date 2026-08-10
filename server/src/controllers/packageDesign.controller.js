import Service from "../models/Service.js";
import ServicePackage, {
  SERVICE_PACKAGE_GROUPS,
} from "../models/ServicePackage.js";
import PackageDesign from "../models/PackageDesign.js";

const ALLOWED_LIST_QUERY_FIELDS =
  new Set([
    "service",
    "group",
    "package",
  ]);

function createHttpError(
  message,
  statusCode = 400,
  fieldErrors = {},
) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function hasOwnProperty(
  object,
  property,
) {
  return Object.prototype.hasOwnProperty.call(
    object,
    property,
  );
}

function assertValidListQuery(
  query = {},
) {
  const unsupportedFields =
    Object.keys(query).filter(
      (fieldName) =>
        !ALLOWED_LIST_QUERY_FIELDS.has(
          fieldName,
        ),
    );

  if (
    unsupportedFields.length > 0
  ) {
    throw createHttpError(
      `Unsupported Package Design query parameter${
        unsupportedFields.length === 1
          ? ""
          : "s"
      }: ${unsupportedFields.join(", ")}.`,
      400,
      Object.fromEntries(
        unsupportedFields.map(
          (fieldName) => [
            fieldName,
            "This query parameter is not supported.",
          ],
        ),
      ),
    );
  }

  Object.entries(query).forEach(
    ([fieldName, value]) => {
      if (
        typeof value !== "string"
      ) {
        throw createHttpError(
          `Query parameter "${fieldName}" must contain one text value.`,
          400,
          {
            [fieldName]:
              "Provide this query parameter once as a single text value.",
          },
        );
      }
    },
  );
}

function cleanSlug(
  value,
  fieldName,
  fieldLabel,
) {
  if (
    typeof value !== "string"
  ) {
    throw createHttpError(
      `${fieldLabel} must be text.`,
      400,
      {
        [fieldName]:
          `${fieldLabel} must be text.`,
      },
    );
  }

  const cleanValue =
    value.trim().toLowerCase();

  if (
    cleanValue.length < 2 ||
    cleanValue.length > 160 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      cleanValue,
    )
  ) {
    throw createHttpError(
      `Invalid ${fieldLabel.toLowerCase()}.`,
      400,
      {
        [fieldName]:
          `${fieldLabel} must contain lowercase letters, numbers and hyphens only.`,
      },
    );
  }

  return cleanValue;
}

function cleanGroup(
  value,
  fieldName = "group",
) {
  if (
    typeof value !== "string"
  ) {
    throw createHttpError(
      "Package group must be text.",
      400,
      {
        [fieldName]:
          "Package group must be text.",
      },
    );
  }

  const cleanValue =
    value.trim().toLowerCase();

  if (
    !SERVICE_PACKAGE_GROUPS.includes(
      cleanValue,
    )
  ) {
    throw createHttpError(
      "Invalid package group.",
      400,
      {
        [fieldName]:
          "Select development or management.",
      },
    );
  }

  return cleanValue;
}

function sendPackageDesignError(
  error,
  res,
  next,
) {
  if (error?.statusCode) {
    return res
      .status(error.statusCode)
      .json({
        success: false,
        message: error.message,
        fieldErrors:
          error.fieldErrors || {},
      });
  }

  return next(error);
}

function createPublicPackagePopulate() {
  return {
    path: "servicePackage",
    select: [
      "service",
      "group",
      "name",
      "slug",
      "shortDescription",
      "pricingMode",
      "price",
      "currency",
      "priceLabel",
      "billingCycle",
      "billingLabel",
      "badge",
      "ctaLabel",
      "whatsappEnabled",
      "isFeatured",
      "order",
    ].join(" "),
    populate: {
      path: "service",
      select: [
        "title",
        "slug",
        "shortDescription",
        "icon",
        "iconUrl",
        "order",
      ].join(" "),
    },
  };
}

async function resolveVisiblePackages({
  serviceSlug = "",
  group = "",
  packageSlug = "",
}) {
  const serviceFilter = {
    isVisible: true,
  };

  if (serviceSlug) {
    serviceFilter.slug =
      serviceSlug;
  }

  const visibleServices =
    await Service.find(
      serviceFilter,
    )
      .select("_id")
      .lean();

  if (
    serviceSlug &&
    visibleServices.length === 0
  ) {
    throw createHttpError(
      "Service not found.",
      404,
      {
        service:
          "Select an existing visible Service.",
      },
    );
  }

  const packageFilter = {
    isVisible: true,
    service: {
      $in: visibleServices.map(
        (service) => service._id,
      ),
    },
  };

  if (group) {
    packageFilter.group = group;
  }

  if (packageSlug) {
    packageFilter.slug =
      packageSlug;
  }

  const packages =
    await ServicePackage.find(
      packageFilter,
    )
      .select("_id")
      .lean();

  if (
    packageSlug &&
    packages.length === 0
  ) {
    throw createHttpError(
      "Service Package not found.",
      404,
      {
        package:
          "Select an existing visible Service Package.",
      },
    );
  }

  return packages;
}

async function getPublicPackageDesigns(
  req,
  res,
  next,
) {
  try {
    assertValidListQuery(
      req.query,
    );

    const hasService =
      hasOwnProperty(
        req.query,
        "service",
      );
    const hasGroup =
      hasOwnProperty(
        req.query,
        "group",
      );
    const hasPackage =
      hasOwnProperty(
        req.query,
        "package",
      );

    if (
      hasPackage &&
      (!hasService || !hasGroup)
    ) {
      throw createHttpError(
        "Package filter requires both Service and group.",
        400,
        {
          package:
            "Provide service and group together with package.",
        },
      );
    }

    const serviceSlug =
      hasService
        ? cleanSlug(
            req.query.service,
            "service",
            "Service slug",
          )
        : "";

    const group =
      hasGroup
        ? cleanGroup(
            req.query.group,
          )
        : "";

    const packageSlug =
      hasPackage
        ? cleanSlug(
            req.query.package,
            "package",
            "Package slug",
          )
        : "";

    const visiblePackages =
      await resolveVisiblePackages({
        serviceSlug,
        group,
        packageSlug,
      });

    const records =
      await PackageDesign.find({
        servicePackage: {
          $in: visiblePackages.map(
            (record) =>
              record._id,
          ),
        },
        isVisible: true,
      })
        .select(
          "-createdBy -updatedBy -createdAt -updatedAt",
        )
        .populate(
          createPublicPackagePopulate(),
        )
        .sort({
          servicePackage: 1,
          isDefault: -1,
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
    return sendPackageDesignError(
      error,
      res,
      next,
    );
  }
}

async function getPublicPackageDesignBySlugs(
  req,
  res,
  next,
) {
  try {
    const serviceSlug =
      cleanSlug(
        req.params.serviceSlug,
        "serviceSlug",
        "Service slug",
      );

    const group =
      cleanGroup(
        req.params.group,
      );

    const packageSlug =
      cleanSlug(
        req.params.packageSlug,
        "packageSlug",
        "Package slug",
      );

    const designSlug =
      cleanSlug(
        req.params.designSlug,
        "designSlug",
        "Design slug",
      );

    const service =
      await Service.findOne({
        slug: serviceSlug,
        isVisible: true,
      })
        .select("_id")
        .lean();

    if (!service) {
      throw createHttpError(
        "Service not found.",
        404,
      );
    }

    const servicePackage =
      await ServicePackage.findOne({
        service: service._id,
        group,
        slug: packageSlug,
        isVisible: true,
      })
        .select("_id")
        .lean();

    if (!servicePackage) {
      throw createHttpError(
        "Service Package not found.",
        404,
      );
    }

    const record =
      await PackageDesign.findOne({
        servicePackage:
          servicePackage._id,
        slug: designSlug,
        isVisible: true,
      })
        .select(
          "-createdBy -updatedBy -createdAt -updatedAt",
        )
        .populate(
          createPublicPackagePopulate(),
        )
        .lean();

    if (!record) {
      throw createHttpError(
        "Package Design not found.",
        404,
      );
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return sendPackageDesignError(
      error,
      res,
      next,
    );
  }
}

export {
  getPublicPackageDesignBySlugs,
  getPublicPackageDesigns,
};
