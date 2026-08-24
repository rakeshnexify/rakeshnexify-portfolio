import ContactMessage from "../models/ContactMessage.js";

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



function sendHoneypotSuccess(res) {
  return res.status(201).json({
    success: true,

    message: "Your project enquiry has been submitted successfully.",
  });
}

async function createContactMessage(req, res, next) {
  try {
    const requestBody =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : {};

    const website = cleanString(requestBody.website);

    /*
     * Real visitors never fill this hidden field.
     * Return a normal-looking success response without
     * saving the automated submission in MongoDB.
     */
    if (website) {
      return sendHoneypotSuccess(res);
    }

    const name = cleanString(requestBody.name);

    const email = cleanEmail(requestBody.email);

    const phone = cleanString(requestBody.phone);

    const subject = cleanString(requestBody.subject);

    const message = cleanString(requestBody.message);

    const savedMessage = await ContactMessage.create({
      name,
      email,
      phone,

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
