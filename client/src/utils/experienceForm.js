const employmentTypes = [
  "full-time",
  "part-time",
  "freelance",
  "contract",
  "internship",
  "self-employed",
  "founder",
  "volunteer",
  "other",
];

const locationTypes = ["onsite", "remote", "hybrid"];

const experienceArrayLimits = {
  responsibilities: {
    maxItems: 30,
    maxLength: 300,
  },
  achievements: {
    maxItems: 30,
    maxLength: 300,
  },
  skills: {
    maxItems: 50,
    maxLength: 100,
  },
  tools: {
    maxItems: 50,
    maxLength: 100,
  },
};

const defaultExperienceFormValues = {
  organizationName: "",
  slug: "",
  jobTitle: "",
  employmentType: "full-time",
  startDate: "",
  endDate: "",
  isCurrent: false,
  location: "",
  locationType: "",
  shortDescription: "",
  description: "",
  responsibilities: "",
  achievements: "",
  skills: "",
  tools: "",
  organizationLogoUrl: "",
  organizationWebsiteUrl: "",
  order: "0",
  isFeatured: false,
  isVisible: true,
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function createExperienceSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createExperienceDefaultSlug(formValues = {}) {
  return createExperienceSlug(
    [
      formValues.organizationName,
      formValues.jobTitle,
      formValues.startDate,
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

function listToText(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function textToList(value) {
  const uniqueItems = new Map();

  String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .forEach((item) => {
      const normalizedKey = item.toLowerCase();

      if (!uniqueItems.has(normalizedKey)) {
        uniqueItems.set(normalizedKey, item);
      }
    });

  return [...uniqueItems.values()];
}

function createExperienceFormValues(experience = {}) {
  return {
    organizationName: experience.organizationName || "",

    slug: experience.slug || "",

    jobTitle: experience.jobTitle || "",

    employmentType: employmentTypes.includes(experience.employmentType)
      ? experience.employmentType
      : "full-time",

    startDate: formatDateForInput(experience.startDate),

    endDate: experience.isCurrent
      ? ""
      : formatDateForInput(experience.endDate),

    isCurrent: Boolean(experience.isCurrent),

    location: experience.location || "",

    locationType: locationTypes.includes(experience.locationType)
      ? experience.locationType
      : "",

    shortDescription: experience.shortDescription || "",

    description: experience.description || "",

    responsibilities: listToText(experience.responsibilities),

    achievements: listToText(experience.achievements),

    skills: listToText(experience.skills),

    tools: listToText(experience.tools),

    organizationLogoUrl: experience.organizationLogoUrl || "",

    organizationWebsiteUrl: experience.organizationWebsiteUrl || "",

    order: String(experience.order ?? 0),

    isFeatured: Boolean(experience.isFeatured),

    isVisible:
      typeof experience.isVisible === "boolean"
        ? experience.isVisible
        : true,
  };
}

function createExperiencePayload(formValues = {}) {
  const values = {
    ...defaultExperienceFormValues,
    ...formValues,
  };

  return {
    organizationName: cleanText(values.organizationName),

    slug:
      createExperienceSlug(values.slug) ||
      createExperienceDefaultSlug(values),

    jobTitle: cleanText(values.jobTitle),

    employmentType: employmentTypes.includes(values.employmentType)
      ? values.employmentType
      : "other",

    startDate: cleanText(values.startDate),

    endDate: values.isCurrent
      ? null
      : cleanText(values.endDate) || null,

    isCurrent: Boolean(values.isCurrent),

    location: cleanText(values.location),

    locationType: locationTypes.includes(values.locationType)
      ? values.locationType
      : "",

    shortDescription: cleanText(values.shortDescription),

    description: cleanText(values.description),

    responsibilities: textToList(values.responsibilities),

    achievements: textToList(values.achievements),

    skills: textToList(values.skills),

    tools: textToList(values.tools),

    organizationLogoUrl: cleanText(values.organizationLogoUrl),

    organizationWebsiteUrl: cleanText(values.organizationWebsiteUrl),

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

function validateExperienceTextList(value, fieldName, errors) {
  const items = textToList(value);
  const limits = experienceArrayLimits[fieldName];

  if (items.length > limits.maxItems) {
    errors[fieldName] =
      `${fieldName} cannot contain more than ${limits.maxItems} items.`;

    return;
  }

  const oversizedItem = items.find((item) => item.length > limits.maxLength);

  if (oversizedItem) {
    errors[fieldName] =
      `Each ${fieldName} item cannot exceed ${limits.maxLength} characters.`;
  }
}

function validateExperienceFormValues(formValues = {}) {
  const values = {
    ...defaultExperienceFormValues,
    ...formValues,
  };

  const errors = {};

  const organizationName = cleanText(values.organizationName);
  const jobTitle = cleanText(values.jobTitle);

  const slug =
    createExperienceSlug(values.slug) ||
    createExperienceDefaultSlug(values);

  const location = cleanText(values.location);
  const shortDescription = cleanText(values.shortDescription);
  const description = cleanText(values.description);

  if (organizationName.length < 2) {
    errors.organizationName =
      "Organization name must contain at least 2 characters.";
  } else if (organizationName.length > 180) {
    errors.organizationName =
      "Organization name cannot exceed 180 characters.";
  }

  if (!slug) {
    errors.slug = "Experience slug is required.";
  } else if (slug.length < 2) {
    errors.slug = "Experience slug must contain at least 2 characters.";
  } else if (slug.length > 220) {
    errors.slug = "Experience slug cannot exceed 220 characters.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug =
      "Use lowercase letters, numbers and single hyphens only.";
  }

  if (jobTitle.length < 2) {
    errors.jobTitle =
      "Job title or professional role must contain at least 2 characters.";
  } else if (jobTitle.length > 180) {
    errors.jobTitle =
      "Job title or professional role cannot exceed 180 characters.";
  }

  if (!employmentTypes.includes(values.employmentType)) {
    errors.employmentType = "Please select a supported employment type.";
  }

  if (!isValidCalendarDate(values.startDate)) {
    errors.startDate =
      "Enter a real start date using the YYYY-MM-DD format.";
  }

  if (!values.isCurrent && !cleanText(values.endDate)) {
    errors.endDate =
      "End date is required when the position is not current.";
  } else if (
    !values.isCurrent &&
    !isValidCalendarDate(values.endDate)
  ) {
    errors.endDate =
      "Enter a real end date using the YYYY-MM-DD format.";
  }

  if (
    !values.isCurrent &&
    isValidCalendarDate(values.startDate) &&
    isValidCalendarDate(values.endDate) &&
    values.endDate < values.startDate
  ) {
    errors.endDate = "End date cannot be earlier than the start date.";
  }

  if (location.length > 180) {
    errors.location = "Location cannot exceed 180 characters.";
  }

  if (
    cleanText(values.locationType) &&
    !locationTypes.includes(values.locationType)
  ) {
    errors.locationType = "Please select a supported location type.";
  }

  if (shortDescription.length < 10) {
    errors.shortDescription =
      "Short description must contain at least 10 characters.";
  } else if (shortDescription.length > 600) {
    errors.shortDescription =
      "Short description cannot exceed 600 characters.";
  }

  if (description.length > 5000) {
    errors.description = "Description cannot exceed 5000 characters.";
  }

  Object.keys(experienceArrayLimits).forEach((fieldName) => {
    validateExperienceTextList(values[fieldName], fieldName, errors);
  });

  [
    [
      "organizationLogoUrl",
      values.organizationLogoUrl,
      "Organization logo URL",
    ],
    [
      "organizationWebsiteUrl",
      values.organizationWebsiteUrl,
      "Organization website URL",
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

  const numericOrder = Number(values.order);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    errors.order = "Display order must be a non-negative number.";
  }

  return errors;
}

export {
  createExperienceDefaultSlug,
  createExperienceFormValues,
  createExperiencePayload,
  createExperienceSlug,
  defaultExperienceFormValues,
  employmentTypes,
  experienceArrayLimits,
  formatDateForInput,
  isSafeHttpUrl,
  isValidCalendarDate,
  listToText,
  locationTypes,
  textToList,
  validateExperienceFormValues,
};
