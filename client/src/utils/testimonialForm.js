const testimonialRatings = [1, 2, 3, 4, 5];

const defaultTestimonialFormValues = {
  clientName: "",
  clientRole: "",
  companyName: "",
  reviewText: "",
  rating: "5",
  profileImageUrl: "",
  profileImageAlt: "",
  companyWebsiteUrl: "",
  relatedProject: "",
  order: "0",
  isFeatured: false,
  isVisible: true,
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeTestimonialRating(value) {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  ) {
    return value;
  }

  if (typeof value === "string" && /^[1-5]$/.test(value)) {
    return Number(value);
  }

  return null;
}

function normalizeTestimonialOrder(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const numericOrder = Number(value);

  return Number.isFinite(numericOrder) && numericOrder >= 0
    ? numericOrder
    : null;
}

function getRelatedProjectId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return cleanText(value._id || value.id);
  }

  return cleanText(value);
}

function createTestimonialFormValues(testimonial = {}) {
  const normalizedRating =
    normalizeTestimonialRating(testimonial.rating) ?? 5;

  const normalizedOrder =
    normalizeTestimonialOrder(testimonial.order) ?? 0;

  return {
    clientName: testimonial.clientName || "",

    clientRole: testimonial.clientRole || "",

    companyName: testimonial.companyName || "",

    reviewText: testimonial.reviewText || "",

    rating: String(normalizedRating),

    profileImageUrl: testimonial.profileImageUrl || "",

    profileImageAlt: testimonial.profileImageAlt || "",

    companyWebsiteUrl: testimonial.companyWebsiteUrl || "",

    relatedProject: getRelatedProjectId(testimonial.relatedProject),

    order: String(normalizedOrder),

    isFeatured:
      typeof testimonial.isFeatured === "boolean"
        ? testimonial.isFeatured
        : false,

    isVisible:
      typeof testimonial.isVisible === "boolean"
        ? testimonial.isVisible
        : true,
  };
}

function createTestimonialPayload(formValues = {}) {
  const values = {
    ...defaultTestimonialFormValues,
    ...formValues,
  };

  const rating = normalizeTestimonialRating(values.rating);
  const order = normalizeTestimonialOrder(values.order);

  if (rating === null) {
    throw new TypeError(
      "Testimonial rating must be an integer from 1 to 5.",
    );
  }

  if (order === null) {
    throw new TypeError(
      "Testimonial display order must be a non-negative number.",
    );
  }

  if (typeof values.isFeatured !== "boolean") {
    throw new TypeError("Testimonial featured value must be a boolean.");
  }

  if (typeof values.isVisible !== "boolean") {
    throw new TypeError("Testimonial visibility value must be a boolean.");
  }

  return {
    clientName: cleanText(values.clientName),

    clientRole: cleanText(values.clientRole),

    companyName: cleanText(values.companyName),

    reviewText: cleanText(values.reviewText),

    rating,

    profileImageUrl: cleanText(values.profileImageUrl),

    profileImageAlt: cleanText(values.profileImageAlt),

    companyWebsiteUrl: cleanText(values.companyWebsiteUrl),

    relatedProject: getRelatedProjectId(values.relatedProject) || null,

    order,

    isFeatured: values.isFeatured,

    isVisible: values.isVisible,
  };
}

function isSafeHttpUrl(value) {
  const url = cleanText(value);

  if (!url) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);

    return (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    );
  } catch {
    return false;
  }
}

function isValidObjectId(value) {
  const objectId = cleanText(value);

  return !objectId || /^[a-fA-F0-9]{24}$/.test(objectId);
}

function validateTestimonialFormValues(formValues = {}) {
  const values = {
    ...defaultTestimonialFormValues,
    ...formValues,
  };

  const errors = {};

  const clientName = cleanText(values.clientName);
  const clientRole = cleanText(values.clientRole);
  const companyName = cleanText(values.companyName);
  const reviewText = cleanText(values.reviewText);
  const profileImageAlt = cleanText(values.profileImageAlt);
  const relatedProject = getRelatedProjectId(values.relatedProject);

  if (clientName.length < 2) {
    errors.clientName = "Client name must contain at least 2 characters.";
  } else if (clientName.length > 150) {
    errors.clientName = "Client name cannot exceed 150 characters.";
  }

  if (clientRole.length > 150) {
    errors.clientRole = "Client role cannot exceed 150 characters.";
  }

  if (companyName.length > 180) {
    errors.companyName = "Company name cannot exceed 180 characters.";
  }

  if (reviewText.length < 10) {
    errors.reviewText =
      "Testimonial review must contain at least 10 characters.";
  } else if (reviewText.length > 3000) {
    errors.reviewText =
      "Testimonial review cannot exceed 3000 characters.";
  }

  if (normalizeTestimonialRating(values.rating) === null) {
    errors.rating = "Select a whole-number rating from 1 to 5.";
  }

  [
    ["profileImageUrl", values.profileImageUrl, "Profile image URL"],
    [
      "companyWebsiteUrl",
      values.companyWebsiteUrl,
      "Company website URL",
    ],
  ].forEach(([fieldName, fieldValue, fieldLabel]) => {
    const cleanValue = cleanText(fieldValue);

    if (cleanValue.length > 500) {
      errors[fieldName] = `${fieldLabel} cannot exceed 500 characters.`;
    } else if (!isSafeHttpUrl(cleanValue)) {
      errors[fieldName] =
        `${fieldLabel} must be a complete credential-free http:// or https:// URL.`;
    }
  });

  if (profileImageAlt.length > 200) {
    errors.profileImageAlt =
      "Profile image alternative text cannot exceed 200 characters.";
  }

  if (!isValidObjectId(relatedProject)) {
    errors.relatedProject = "Please select a valid related Project.";
  }

  if (normalizeTestimonialOrder(values.order) === null) {
    errors.order = "Display order must be a non-negative number.";
  }

  if (typeof values.isFeatured !== "boolean") {
    errors.isFeatured = "Featured status must be true or false.";
  }

  if (typeof values.isVisible !== "boolean") {
    errors.isVisible = "Visibility status must be true or false.";
  }

  return errors;
}

export {
  createTestimonialFormValues,
  createTestimonialPayload,
  defaultTestimonialFormValues,
  getRelatedProjectId,
  isSafeHttpUrl,
  isValidObjectId,
  normalizeTestimonialOrder,
  normalizeTestimonialRating,
  testimonialRatings,
  validateTestimonialFormValues,
};
