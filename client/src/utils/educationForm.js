const educationTypes = [
  "school",
  "college",
  "university",
  "course",
  "training",
  "certification",
  "other",
];

const defaultEducationFormValues = {
  institutionName: "",
  slug: "",
  degree: "",
  fieldOfStudy: "",
  educationType: "university",
  startDate: "",
  endDate: "",
  isCurrentlyStudying: false,
  grade: "",
  location: "",
  shortDescription: "",
  description: "",
  institutionUrl: "",
  certificateUrl: "",
  logoUrl: "",
  order: "0",
  isFeatured: false,
  isVisible: true,
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function createEducationSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createEducationDefaultSlug(formValues = {}) {
  const startYear = cleanText(formValues.startDate).slice(0, 4);

  return createEducationSlug(
    [
      formValues.institutionName,
      formValues.degree,
      formValues.fieldOfStudy,
      startYear,
    ]
      .map((value) => cleanText(value))
      .filter(Boolean)
      .join(" "),
  );
}

function formatDateForInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function createEducationFormValues(education = {}) {
  return {
    institutionName: education.institutionName || "",

    slug: education.slug || "",

    degree: education.degree || "",

    fieldOfStudy: education.fieldOfStudy || "",

    educationType: educationTypes.includes(education.educationType)
      ? education.educationType
      : "university",

    startDate: formatDateForInput(education.startDate),

    endDate: education.isCurrentlyStudying
      ? ""
      : formatDateForInput(education.endDate),

    isCurrentlyStudying: Boolean(education.isCurrentlyStudying),

    grade: education.grade || "",

    location: education.location || "",

    shortDescription: education.shortDescription || "",

    description: education.description || "",

    institutionUrl: education.institutionUrl || "",

    certificateUrl: education.certificateUrl || "",

    logoUrl: education.logoUrl || "",

    order: String(education.order ?? 0),

    isFeatured: Boolean(education.isFeatured),

    isVisible:
      typeof education.isVisible === "boolean"
        ? education.isVisible
        : true,
  };
}

function createEducationPayload(formValues = {}) {
  const values = {
    ...defaultEducationFormValues,
    ...formValues,
  };

  return {
    institutionName: cleanText(values.institutionName),

    slug:
      createEducationSlug(values.slug) ||
      createEducationDefaultSlug(values),

    degree: cleanText(values.degree),

    fieldOfStudy: cleanText(values.fieldOfStudy),

    educationType: educationTypes.includes(values.educationType)
      ? values.educationType
      : "other",

    startDate: cleanText(values.startDate),

    endDate: values.isCurrentlyStudying
      ? null
      : cleanText(values.endDate) || null,

    isCurrentlyStudying: Boolean(values.isCurrentlyStudying),

    grade: cleanText(values.grade),

    location: cleanText(values.location),

    shortDescription: cleanText(values.shortDescription),

    description: cleanText(values.description),

    institutionUrl: cleanText(values.institutionUrl),

    certificateUrl: cleanText(values.certificateUrl),

    logoUrl: cleanText(values.logoUrl),

    order: Number(values.order || 0),

    isFeatured: Boolean(values.isFeatured),

    isVisible: Boolean(values.isVisible),
  };
}

function isValidCalendarDate(value) {
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

function validateEducationFormValues(formValues = {}) {
  const values = {
    ...defaultEducationFormValues,
    ...formValues,
  };

  const errors = {};

  const institutionName = cleanText(values.institutionName);

  const degree = cleanText(values.degree);

  const fieldOfStudy = cleanText(values.fieldOfStudy);

  const slug =
    createEducationSlug(values.slug) ||
    createEducationDefaultSlug(values);

  const shortDescription = cleanText(values.shortDescription);

  const description = cleanText(values.description);

  const grade = cleanText(values.grade);

  const location = cleanText(values.location);

  if (institutionName.length < 2) {
    errors.institutionName =
      "Institution name must contain at least 2 characters.";
  } else if (institutionName.length > 180) {
    errors.institutionName =
      "Institution name cannot exceed 180 characters.";
  }

  if (!slug) {
    errors.slug = "Education slug is required.";
  } else if (slug.length < 2) {
    errors.slug = "Education slug must contain at least 2 characters.";
  } else if (slug.length > 220) {
    errors.slug = "Education slug cannot exceed 220 characters.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug =
      "Use lowercase letters, numbers and single hyphens only.";
  }

  if (degree.length < 2) {
    errors.degree =
      "Degree or qualification must contain at least 2 characters.";
  } else if (degree.length > 180) {
    errors.degree =
      "Degree or qualification cannot exceed 180 characters.";
  }

  if (fieldOfStudy.length < 2) {
    errors.fieldOfStudy =
      "Field of study must contain at least 2 characters.";
  } else if (fieldOfStudy.length > 180) {
    errors.fieldOfStudy =
      "Field of study cannot exceed 180 characters.";
  }

  if (!educationTypes.includes(values.educationType)) {
    errors.educationType = "Please select a supported education type.";
  }

  if (!isValidCalendarDate(values.startDate)) {
    errors.startDate =
      "Enter a real start date using the YYYY-MM-DD format.";
  }

  if (
    !values.isCurrentlyStudying &&
    cleanText(values.endDate) &&
    !isValidCalendarDate(values.endDate)
  ) {
    errors.endDate =
      "Enter a real end date using the YYYY-MM-DD format.";
  }

  if (
    !values.isCurrentlyStudying &&
    isValidCalendarDate(values.startDate) &&
    isValidCalendarDate(values.endDate) &&
    values.endDate < values.startDate
  ) {
    errors.endDate = "End date cannot be earlier than the start date.";
  }

  if (grade.length > 100) {
    errors.grade = "Grade cannot exceed 100 characters.";
  }

  if (location.length > 180) {
    errors.location = "Location cannot exceed 180 characters.";
  }

  if (shortDescription && shortDescription.length < 10) {
    errors.shortDescription =
      "Short description must contain at least 10 characters when provided.";
  } else if (shortDescription.length > 600) {
    errors.shortDescription =
      "Short description cannot exceed 600 characters.";
  }

  if (description.length > 5000) {
    errors.description = "Description cannot exceed 5000 characters.";
  }

  [
    ["institutionUrl", values.institutionUrl, "Institution URL"],
    ["certificateUrl", values.certificateUrl, "Certificate URL"],
    ["logoUrl", values.logoUrl, "Logo URL"],
  ].forEach(([fieldName, fieldValue, fieldLabel]) => {
    if (!isSafeHttpUrl(fieldValue)) {
      errors[fieldName] =
        `${fieldLabel} must be a complete credential-free http:// or https:// URL.`;
    }
  });

  const numericOrder = Number(values.order);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    errors.order = "Display order must be a non-negative number.";
  }

  return errors;
}

export {
  createEducationDefaultSlug,
  createEducationFormValues,
  createEducationPayload,
  createEducationSlug,
  defaultEducationFormValues,
  educationTypes,
  formatDateForInput,
  isSafeHttpUrl,
  isValidCalendarDate,
  validateEducationFormValues,
};
