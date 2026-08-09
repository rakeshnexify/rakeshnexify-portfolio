const certificationAchievementTypes = [
  "certification",
  "license",
  "award",
  "achievement",
];

const certificationAchievementTypeLabels = {
  certification: "Certification",
  license: "License",
  award: "Award",
  achievement: "Achievement",
};

const issuerRequiredTypes = new Set([
  "certification",
  "license",
  "award",
]);

const defaultCertificationAchievementFormValues = {
  type: "certification",
  title: "",
  slug: "",
  issuerName: "",
  shortDescription: "",
  description: "",
  issueDate: "",
  doesNotExpire: false,
  expirationDate: "",
  credentialId: "",
  verificationUrl: "",
  mediaUrl: "",
  mediaAlt: "",
  relatedEducation: "",
  relatedExperience: "",
  order: "0",
  isFeatured: false,
  isVisible: true,
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function createCertificationAchievementSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createCertificationAchievementDefaultSlug(formValues = {}) {
  return createCertificationAchievementSlug(
    [
      formValues.title,
      formValues.issuerName,
      formValues.issueDate,
    ]
      .map((value) => cleanText(value))
      .filter(Boolean)
      .join(" "),
  );
}

function formatCertificationAchievementDateForInput(value) {
  if (!value) {
    return "";
  }

  const cleanValue = cleanText(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    return cleanValue;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function normalizeRelationId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object" && value !== null) {
    return cleanText(value._id || value.id);
  }

  return "";
}

function createCertificationAchievementFormValues(achievement = {}) {
  return {
    type: certificationAchievementTypes.includes(achievement.type)
      ? achievement.type
      : "certification",

    title: achievement.title || "",

    slug: achievement.slug || "",

    issuerName: achievement.issuerName || "",

    shortDescription: achievement.shortDescription || "",

    description: achievement.description || "",

    issueDate: formatCertificationAchievementDateForInput(
      achievement.issueDate,
    ),

    doesNotExpire: Boolean(achievement.doesNotExpire),

    expirationDate: achievement.doesNotExpire
      ? ""
      : formatCertificationAchievementDateForInput(
          achievement.expirationDate,
        ),

    credentialId: achievement.credentialId || "",

    verificationUrl: achievement.verificationUrl || "",

    mediaUrl: achievement.mediaUrl || "",

    mediaAlt: achievement.mediaAlt || "",

    relatedEducation: normalizeRelationId(achievement.relatedEducation),

    relatedExperience: normalizeRelationId(achievement.relatedExperience),

    order: String(achievement.order ?? 0),

    isFeatured: Boolean(achievement.isFeatured),

    isVisible:
      typeof achievement.isVisible === "boolean"
        ? achievement.isVisible
        : true,
  };
}

function createCertificationAchievementPayload(formValues = {}) {
  const values = {
    ...defaultCertificationAchievementFormValues,
    ...formValues,
  };

  return {
    type: certificationAchievementTypes.includes(values.type)
      ? values.type
      : "achievement",

    title: cleanText(values.title),

    slug:
      createCertificationAchievementSlug(values.slug) ||
      createCertificationAchievementDefaultSlug(values),

    issuerName: cleanText(values.issuerName),

    shortDescription: cleanText(values.shortDescription),

    description: cleanText(values.description),

    issueDate: cleanText(values.issueDate),

    doesNotExpire: Boolean(values.doesNotExpire),

    expirationDate: values.doesNotExpire
      ? null
      : cleanText(values.expirationDate) || null,

    credentialId: cleanText(values.credentialId),

    verificationUrl: cleanText(values.verificationUrl),

    mediaUrl: cleanText(values.mediaUrl),

    mediaAlt: cleanText(values.mediaAlt),

    relatedEducation: normalizeRelationId(values.relatedEducation) || null,

    relatedExperience: normalizeRelationId(values.relatedExperience) || null,

    order: Number(values.order || 0),

    isFeatured: Boolean(values.isFeatured),

    isVisible: Boolean(values.isVisible),
  };
}

function isValidCertificationAchievementCalendarDate(value) {
  const cleanValue = cleanText(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    return false;
  }

  const date = new Date(`${cleanValue}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === cleanValue
  );
}

function isSafeCertificationAchievementHttpUrl(value) {
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

function isValidMongoObjectId(value) {
  const cleanValue = cleanText(value);

  return !cleanValue || /^[a-fA-F0-9]{24}$/.test(cleanValue);
}

function validateCertificationAchievementFormValues(formValues = {}) {
  const values = {
    ...defaultCertificationAchievementFormValues,
    ...formValues,
  };

  const errors = {};

  const type = cleanText(values.type).toLowerCase();
  const title = cleanText(values.title);
  const issuerName = cleanText(values.issuerName);
  const shortDescription = cleanText(values.shortDescription);
  const description = cleanText(values.description);
  const credentialId = cleanText(values.credentialId);
  const mediaAlt = cleanText(values.mediaAlt);

  const slug =
    createCertificationAchievementSlug(values.slug) ||
    createCertificationAchievementDefaultSlug(values);

  if (!certificationAchievementTypes.includes(type)) {
    errors.type = "Please select a supported record type.";
  }

  if (title.length < 2) {
    errors.title = "Title must contain at least 2 characters.";
  }

  if (!slug) {
    errors.slug = "URL slug is required.";
  } else if (slug.length < 2) {
    errors.slug = "URL slug must contain at least 2 characters.";
  } else if (slug.length > 220) {
    errors.slug = "URL slug cannot exceed 220 characters.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug =
      "Use lowercase letters, numbers and single hyphens only.";
  }

  if (issuerRequiredTypes.has(type) && issuerName.length < 2) {
    errors.issuerName =
      "Issuer or organization is required for this record type.";
  }

  if (shortDescription.length < 10) {
    errors.shortDescription =
      "Short description must contain at least 10 characters.";
  }

  if (!isValidCertificationAchievementCalendarDate(values.issueDate)) {
    errors.issueDate =
      "Enter a real issue date using the YYYY-MM-DD format.";
  }

  const expirationDate = cleanText(values.expirationDate);

  if (
    !values.doesNotExpire &&
    expirationDate &&
    !isValidCertificationAchievementCalendarDate(expirationDate)
  ) {
    errors.expirationDate =
      "Enter a real expiration date using the YYYY-MM-DD format.";
  }

  if (
    !values.doesNotExpire &&
    isValidCertificationAchievementCalendarDate(values.issueDate) &&
    isValidCertificationAchievementCalendarDate(expirationDate) &&
    expirationDate < cleanText(values.issueDate)
  ) {
    errors.expirationDate =
      "Expiration date cannot be earlier than the issue date.";
  }

  [
    ["verificationUrl", values.verificationUrl, "Verification URL"],
    ["mediaUrl", values.mediaUrl, "Media URL"],
  ].forEach(([fieldName, fieldValue, fieldLabel]) => {
    if (!isSafeCertificationAchievementHttpUrl(fieldValue)) {
      errors[fieldName] =
        `${fieldLabel} must be a complete credential-free http:// or https:// URL.`;
    }
  });

  if (!isValidMongoObjectId(values.relatedEducation)) {
    errors.relatedEducation =
      "Related Education must be a valid record ID.";
  }

  if (!isValidMongoObjectId(values.relatedExperience)) {
    errors.relatedExperience =
      "Related Experience must be a valid record ID.";
  }

  const numericOrder = Number(values.order);

  if (
    !Number.isSafeInteger(numericOrder) ||
    numericOrder < 0 ||
    numericOrder > 1_000_000
  ) {
    errors.order =
      "Display order must be a whole number from 0 to 1,000,000.";
  }

  // Keep these lightweight client checks intentionally conservative.
  // Exact backend field-size constraints remain the source of truth and are
  // returned through structured fieldErrors when needed.
  if (description.length > 20_000) {
    errors.description =
      "Description is too long. Please shorten the content.";
  }

  if (credentialId.length > 1_000) {
    errors.credentialId =
      "Credential ID is too long. Please shorten the value.";
  }

  if (mediaAlt.length > 1_000) {
    errors.mediaAlt =
      "Media alt text is too long. Please shorten the value.";
  }

  return errors;
}

export {
  certificationAchievementTypeLabels,
  certificationAchievementTypes,
  createCertificationAchievementDefaultSlug,
  createCertificationAchievementFormValues,
  createCertificationAchievementPayload,
  createCertificationAchievementSlug,
  defaultCertificationAchievementFormValues,
  formatCertificationAchievementDateForInput,
  isSafeCertificationAchievementHttpUrl,
  isValidCertificationAchievementCalendarDate,
  isValidMongoObjectId,
  issuerRequiredTypes,
  normalizeRelationId,
  validateCertificationAchievementFormValues,
};
