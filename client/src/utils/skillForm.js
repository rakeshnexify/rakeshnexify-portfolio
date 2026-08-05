const skillProficiencyLevels = [
  "familiar",
  "proficient",
  "advanced",
  "expert",
];

function createDefaultSkillFormValues() {
  return {
    name: "",
    slug: "",
    shortName: "",
    description: "",
    category: "",
    proficiencyLevel: "",
    yearsOfExperience: "",
    icon: "",
    iconUrl: "",
    order: "0",
    isFeatured: false,
    isVisible: true,
  };
}

const defaultSkillFormValues = createDefaultSkillFormValues();

function createSkillSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSkillCategory(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function createSkillFormValues(skill = {}) {
  return {
    name: skill.name || "",

    slug: skill.slug || "",

    shortName: skill.shortName || "",

    description: skill.description || "",

    category: skill.category || "",

    proficiencyLevel: skill.proficiencyLevel || "",

    yearsOfExperience:
      skill.yearsOfExperience === null ||
      skill.yearsOfExperience === undefined
        ? ""
        : String(skill.yearsOfExperience),

    icon: skill.icon || "",

    iconUrl: skill.iconUrl || "",

    order: String(skill.order ?? 0),

    isFeatured: Boolean(skill.isFeatured),

    isVisible:
      typeof skill.isVisible === "boolean"
        ? skill.isVisible
        : true,
  };
}

function createSkillPayload(formValues = {}) {
  const name = String(formValues.name || "").trim();

  const yearsValue = String(
    formValues.yearsOfExperience ?? "",
  ).trim();

  return {
    name,

    slug:
      createSkillSlug(formValues.slug) ||
      createSkillSlug(name),

    shortName: String(formValues.shortName || "").trim(),

    description: String(formValues.description || "").trim(),

    category: normalizeSkillCategory(formValues.category),

    proficiencyLevel: String(
      formValues.proficiencyLevel || "",
    )
      .trim()
      .toLowerCase(),

    yearsOfExperience:
      yearsValue === "" ? null : Number(yearsValue),

    icon: String(formValues.icon || "").trim(),

    iconUrl: String(formValues.iconUrl || "").trim(),

    order: Number(formValues.order || 0),

    isFeatured: Boolean(formValues.isFeatured),

    isVisible: Boolean(formValues.isVisible),
  };
}

function isValidHttpUrl(value) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) {
    return true;
  }

  try {
    const parsedUrl = new URL(cleanValue);

    return (
      parsedUrl.protocol === "http:" ||
      parsedUrl.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function validateSkillFormValues(formValues = {}) {
  const fieldErrors = {};

  const payload = createSkillPayload(formValues);

  if (!payload.name) {
    fieldErrors.name = "Skill name is required.";
  } else if (payload.name.length < 2) {
    fieldErrors.name =
      "Skill name must contain at least 2 characters.";
  } else if (payload.name.length > 120) {
    fieldErrors.name =
      "Skill name cannot exceed 120 characters.";
  }

  if (!payload.slug) {
    fieldErrors.slug = "Skill slug is required.";
  } else if (payload.slug.length < 2) {
    fieldErrors.slug =
      "Skill slug must contain at least 2 characters.";
  } else if (payload.slug.length > 150) {
    fieldErrors.slug =
      "Skill slug cannot exceed 150 characters.";
  } else if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)
  ) {
    fieldErrors.slug =
      "Skill slug can contain lowercase letters, numbers and hyphens only.";
  }

  if (payload.shortName.length > 50) {
    fieldErrors.shortName =
      "Skill short name cannot exceed 50 characters.";
  }

  if (!payload.description) {
    fieldErrors.description =
      "Skill description is required.";
  } else if (payload.description.length < 10) {
    fieldErrors.description =
      "Skill description must contain at least 10 characters.";
  } else if (payload.description.length > 500) {
    fieldErrors.description =
      "Skill description cannot exceed 500 characters.";
  }

  if (!payload.category) {
    fieldErrors.category = "Skill category is required.";
  } else if (payload.category.length < 2) {
    fieldErrors.category =
      "Skill category must contain at least 2 characters.";
  } else if (payload.category.length > 100) {
    fieldErrors.category =
      "Skill category cannot exceed 100 characters.";
  }

  if (
    !skillProficiencyLevels.includes(
      payload.proficiencyLevel,
    )
  ) {
    fieldErrors.proficiencyLevel =
      "Please select a valid proficiency level.";
  }

  if (
    payload.yearsOfExperience !== null &&
    (!Number.isFinite(payload.yearsOfExperience) ||
      payload.yearsOfExperience < 0 ||
      payload.yearsOfExperience > 60)
  ) {
    fieldErrors.yearsOfExperience =
      "Years of experience must be a number between 0 and 60.";
  }

  if (payload.icon.length > 100) {
    fieldErrors.icon =
      "Skill icon cannot exceed 100 characters.";
  }

  if (payload.iconUrl.length > 500) {
    fieldErrors.iconUrl =
      "Skill icon URL cannot exceed 500 characters.";
  } else if (!isValidHttpUrl(payload.iconUrl)) {
    fieldErrors.iconUrl =
      "Skill icon URL must be a valid HTTP or HTTPS URL.";
  }

  if (
    !Number.isFinite(payload.order) ||
    payload.order < 0
  ) {
    fieldErrors.order =
      "Skill display order must be a non-negative number.";
  }

  return fieldErrors;
}

export {
  createDefaultSkillFormValues,
  createSkillFormValues,
  createSkillPayload,
  createSkillSlug,
  defaultSkillFormValues,
  normalizeSkillCategory,
  skillProficiencyLevels,
  validateSkillFormValues,
};