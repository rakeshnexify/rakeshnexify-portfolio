import { randomInt } from "node:crypto";

import mongoose from "mongoose";

import PackageDesign from "../models/PackageDesign.js";
import ServiceOrder from "../models/ServiceOrder.js";
import ServicePackage from "../models/ServicePackage.js";

const ALLOWED_CREATE_FIELDS = new Set([
  "servicePackage",
  "packageDesign",
  "name",
  "email",
  "phone",
  "company",
  "requirements",
  "preferredStartDate",
  "notes",
]);

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function requireObjectBody(req) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw createHttpError("A valid JSON object is required.", 400);
  }

  return req.body;
}

function assertAllowedFields(requestBody) {
  const unsupportedFields = Object.keys(requestBody).filter(
    (fieldName) => !ALLOWED_CREATE_FIELDS.has(fieldName),
  );

  if (unsupportedFields.length > 0) {
    throw createHttpError(
      `Unsupported Service Order field${unsupportedFields.length === 1 ? "" : "s"}: ${unsupportedFields.join(", ")}.`,
      400,
      Object.fromEntries(
        unsupportedFields.map((fieldName) => [
          fieldName,
          "This field is not accepted for public Service Orders.",
        ]),
      ),
    );
  }
}

function cleanString(
  value,
  {
    fieldName,
    fieldLabel,
    required = false,
    minLength = 0,
    maxLength = null,
    lowercase = false,
  },
) {
  if (value === undefined || value === null) {
    if (required) {
      throw createHttpError(`${fieldLabel} is required.`, 400, {
        [fieldName]: `${fieldLabel} is required.`,
      });
    }

    return "";
  }

  if (typeof value !== "string") {
    throw createHttpError(`${fieldLabel} must be text.`, 400, {
      [fieldName]: `${fieldLabel} must be text.`,
    });
  }

  let cleanedValue = value.trim();

  if (lowercase) {
    cleanedValue = cleanedValue.toLowerCase();
  }

  if (required && !cleanedValue) {
    throw createHttpError(`${fieldLabel} is required.`, 400, {
      [fieldName]: `${fieldLabel} is required.`,
    });
  }

  if (cleanedValue && minLength && cleanedValue.length < minLength) {
    throw createHttpError(
      `${fieldLabel} must contain at least ${minLength} characters.`,
      400,
      {
        [fieldName]: `${fieldLabel} must contain at least ${minLength} characters.`,
      },
    );
  }

  if (
    cleanedValue &&
    Number.isInteger(maxLength) &&
    cleanedValue.length > maxLength
  ) {
    throw createHttpError(
      `${fieldLabel} cannot exceed ${maxLength} characters.`,
      400,
      {
        [fieldName]: `${fieldLabel} cannot exceed ${maxLength} characters.`,
      },
    );
  }

  return cleanedValue;
}

function cleanObjectId(value, fieldName, fieldLabel, { required = true } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw createHttpError(`${fieldLabel} is required.`, 400, {
        [fieldName]: `${fieldLabel} is required.`,
      });
    }

    return "";
  }

  if (typeof value !== "string" || !mongoose.isValidObjectId(value.trim())) {
    throw createHttpError(`Invalid ${fieldLabel}.`, 400, {
      [fieldName]: `Please provide a valid ${fieldLabel}.`,
    });
  }

  return value.trim();
}

function cleanEmail(value) {
  const email = cleanString(value, {
    fieldName: "email",
    fieldLabel: "Email",
    required: true,
    maxLength: 254,
    lowercase: true,
  });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createHttpError("Please provide a valid email address.", 400, {
      email: "Please provide a valid email address.",
    });
  }

  return email;
}

function cleanPreferredStartDate(value) {
  const cleanedValue = cleanString(value, {
    fieldName: "preferredStartDate",
    fieldLabel: "Preferred start date",
    maxLength: 10,
  });

  if (!cleanedValue) {
    return "";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanedValue)) {
    throw createHttpError(
      "Preferred start date must use YYYY-MM-DD format.",
      400,
      {
        preferredStartDate:
          "Preferred start date must use YYYY-MM-DD format.",
      },
    );
  }

  const parsedDate = new Date(`${cleanedValue}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== cleanedValue
  ) {
    throw createHttpError("Preferred start date is not valid.", 400, {
      preferredStartDate: "Please choose a valid calendar date.",
    });
  }

  return cleanedValue;
}

function createOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = randomInt(100000, 1000000);

  return `RN-${datePart}-${randomPart}`;
}

function createSelectionPath(service, servicePackage, packageDesign) {
  const query = new URLSearchParams({
    service: service.slug,
    group: servicePackage.group,
    package: servicePackage.slug,
  });

  if (packageDesign?.slug) {
    query.set("design", packageDesign.slug);
  }

  return `/services?${query.toString()}`;
}

function createPackageSnapshot(servicePackage) {
  return {
    name: servicePackage.name,
    slug: servicePackage.slug,
    group: servicePackage.group,
    pricingMode: servicePackage.pricingMode,
    price: servicePackage.price ?? null,
    currency: servicePackage.currency || "NPR",
    priceLabel: servicePackage.priceLabel || "",
    billingCycle: servicePackage.billingCycle,
    billingLabel: servicePackage.billingLabel || "",
  };
}

function createDesignSnapshot(packageDesign) {
  if (!packageDesign) {
    return {
      name: "",
      slug: "",
      thumbnailUrl: "",
    };
  }

  return {
    name: packageDesign.name,
    slug: packageDesign.slug,
    thumbnailUrl: packageDesign.thumbnailUrl || "",
  };
}

function createMongooseFieldErrors(error) {
  if (error?.name !== "ValidationError") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(error.errors || {}).map(([fieldName, fieldError]) => [
      fieldName,
      fieldError.message,
    ]),
  );
}

function sendServiceOrderError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      fieldErrors: error.fieldErrors || {},
    });
  }

  if (error?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Please correct the Service Order fields and try again.",
      fieldErrors: createMongooseFieldErrors(error),
    });
  }

  return next(error);
}

async function createServiceOrder(req, res, next) {
  try {
    const requestBody = requireObjectBody(req);

    assertAllowedFields(requestBody);

    const servicePackageId = cleanObjectId(
      requestBody.servicePackage,
      "servicePackage",
      "Service Package ID",
    );

    const packageDesignId = cleanObjectId(
      requestBody.packageDesign,
      "packageDesign",
      "Package Design ID",
      {
        required: false,
      },
    );

    const customerName = cleanString(requestBody.name, {
      fieldName: "name",
      fieldLabel: "Name",
      required: true,
      minLength: 2,
      maxLength: 100,
    });

    const customerEmail = cleanEmail(requestBody.email);

    const customerPhone = cleanString(requestBody.phone, {
      fieldName: "phone",
      fieldLabel: "Phone / WhatsApp",
      required: true,
      minLength: 7,
      maxLength: 30,
    });

    const company = cleanString(requestBody.company, {
      fieldName: "company",
      fieldLabel: "Company",
      maxLength: 160,
    });

    const requirements = cleanString(requestBody.requirements, {
      fieldName: "requirements",
      fieldLabel: "Project requirements",
      required: true,
      minLength: 10,
      maxLength: 5000,
    });

    const preferredStartDate = cleanPreferredStartDate(
      requestBody.preferredStartDate,
    );

    const notes = cleanString(requestBody.notes, {
      fieldName: "notes",
      fieldLabel: "Notes",
      maxLength: 2000,
    });

    const servicePackage = await ServicePackage.findOne({
      _id: servicePackageId,
      isVisible: true,
    })
      .select(
        "service group name slug pricingMode price currency priceLabel billingCycle billingLabel isVisible",
      )
      .populate({
        path: "service",
        select: "_id title slug isVisible",
      })
      .lean();

    if (!servicePackage || !servicePackage.service?.isVisible) {
      throw createHttpError(
        "The selected Service Package is not available.",
        404,
        {
          servicePackage:
            "Please choose a currently available Service Package.",
        },
      );
    }

    let packageDesign = null;

    if (packageDesignId) {
      packageDesign = await PackageDesign.findOne({
        _id: packageDesignId,
        servicePackage: servicePackage._id,
        isVisible: true,
      })
        .select("_id servicePackage name slug thumbnailUrl isVisible")
        .lean();

      if (!packageDesign) {
        throw createHttpError(
          "The selected Package Design is not available for this package.",
          404,
          {
            packageDesign:
              "Please choose a currently available design for this package.",
          },
        );
      }
    }

    const orderPayload = {
      customerName,
      customerEmail,
      customerPhone,
      company,
      requirements,
      preferredStartDate,
      notes,
      service: servicePackage.service._id,
      serviceSnapshot: {
        title: servicePackage.service.title,
        slug: servicePackage.service.slug,
      },
      servicePackage: servicePackage._id,
      packageSnapshot: createPackageSnapshot(servicePackage),
      packageDesign: packageDesign?._id || null,
      designSnapshot: createDesignSnapshot(packageDesign),
      selectionPath: createSelectionPath(
        servicePackage.service,
        servicePackage,
        packageDesign,
      ),
      source: "website",
      status: "new",
    };

    let savedOrder = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        savedOrder = await ServiceOrder.create({
          ...orderPayload,
          orderNumber: createOrderNumber(),
        });

        break;
      } catch (error) {
        const isOrderNumberCollision =
          error?.code === 11000 &&
          (error?.keyPattern?.orderNumber || error?.keyValue?.orderNumber);

        if (!isOrderNumberCollision || attempt === 4) {
          throw error;
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: "Your order has been submitted successfully.",
      data: {
        id: savedOrder._id,
        orderNumber: savedOrder.orderNumber,
        status: savedOrder.status,
        createdAt: savedOrder.createdAt,
        service: savedOrder.serviceSnapshot,
        package: savedOrder.packageSnapshot,
        design: savedOrder.designSnapshot,
        selectionPath: savedOrder.selectionPath,
      },
    });
  } catch (error) {
    return sendServiceOrderError(error, res, next);
  }
}

export { createServiceOrder };
