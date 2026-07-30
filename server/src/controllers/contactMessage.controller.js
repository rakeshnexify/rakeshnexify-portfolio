import ContactMessage from "../models/ContactMessage.js";
import Service from "../models/Service.js";

function formatValidationErrors(error) {
  return Object.fromEntries(
    Object.entries(error.errors).map(([fieldName, fieldError]) => [
      fieldName,
      fieldError.message,
    ]),
  );
}

function cleanString(value) {
  return String(value || "").trim();
}

function cleanEmail(value) {
  return cleanString(value).toLowerCase();
}

function cleanServiceSlug(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sendFieldError(res, fieldName, fieldMessage) {
  return res.status(400).json({
    success: false,

    message: "Please correct the invalid or missing form fields.",

    errors: {
      [fieldName]: fieldMessage,
    },
  });
}

async function createContactMessage(req, res, next) {
  try {
    const requestBody =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : {};

    const name = cleanString(requestBody.name);

    const email = cleanEmail(requestBody.email);

    const phone = cleanString(requestBody.phone);

    const serviceSlug = cleanServiceSlug(requestBody.service);

    const subject = cleanString(requestBody.subject);

    const message = cleanString(requestBody.message);

    if (!serviceSlug) {
      return sendFieldError(res, "service", "Please select a service.");
    }

    const selectedService = await Service.findOne({
      slug: serviceSlug,
      isVisible: true,
    })
      .select("title slug")
      .lean();

    if (!selectedService) {
      return sendFieldError(
        res,
        "service",
        "The selected service is unavailable. Please choose another service.",
      );
    }

    const savedMessage = await ContactMessage.create({
      name,
      email,
      phone,

      service: selectedService.slug,

      serviceTitle: selectedService.title,

      subject,
      message,

      source: "portfolio-website",
    });

    return res.status(201).json({
      success: true,

      message: "Your project enquiry has been submitted successfully.",

      data: {
        id: savedMessage._id,
        status: savedMessage.status,
        createdAt: savedMessage.createdAt,
      },
    });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,

        message: "Please correct the invalid or missing form fields.",

        errors: formatValidationErrors(error),
      });
    }

    return next(error);
  }
}

export { createContactMessage };
