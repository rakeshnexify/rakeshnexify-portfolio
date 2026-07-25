import ContactMessage from "../models/ContactMessage.js";

function formatValidationErrors(error) {
  return Object.fromEntries(
    Object.entries(error.errors).map(([fieldName, fieldError]) => [
      fieldName,
      fieldError.message,
    ]),
  );
}

async function createContactMessage(req, res, next) {
  try {
    const {
      name,
      email,
      phone = "",
      service,
      subject,
      message,
    } = req.body;

    const savedMessage = await ContactMessage.create({
      name,
      email,
      phone,
      service,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      message:
        "Your project enquiry has been submitted successfully.",
      data: {
        id: savedMessage._id,
        status: savedMessage.status,
        createdAt: savedMessage.createdAt,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          "Please correct the invalid or missing form fields.",
        errors: formatValidationErrors(error),
      });
    }

    return next(error);
  }
}

export { createContactMessage };