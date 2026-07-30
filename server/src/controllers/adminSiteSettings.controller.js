import SiteSettings from "../models/SiteSettings.js";

const MAIN_SITE_KEY = "main";

const brandStringFields = [
  "name",
  "shortName",
  "tagline",
  "logoUrl",
  "faviconUrl",
];

const ownerStringFields = [
  "name",
  "professionalTitle",
  "location",
  "profileImageUrl",
  "resumeUrl",
];

const heroStringFields = ["eyebrow", "heading", "description"];

const buttonStringFields = ["label", "url"];

const aboutStringFields = ["heading", "description"];

const contactStringFields = [
  "email",
  "phone",
  "whatsapp",
  "location",
  "availability",
];

const seoStringFields = ["title", "description", "ogImageUrl"];

function createHttpError(message, statusCode = 400, fieldErrors = {}) {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.fieldErrors = fieldErrors;

  return error;
}

function hasOwnProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function ensureObject(value, fieldName) {
  if (!isPlainObject(value)) {
    throw createHttpError(`${fieldName} settings must be an object.`, 400, {
      [fieldName]: `${fieldName} settings must be an object.`,
    });
  }

  return value;
}

function cleanString(value) {
  return String(value ?? "").trim();
}

function cleanEmail(value) {
  const email = cleanString(value).toLowerCase();

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createHttpError(
      "Please provide a valid contact email address.",
      400,
      {
        "contact.email": "Please provide a valid email address.",
      },
    );
  }

  return email;
}

function cleanStringArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createHttpError(`${fieldName} must be an array.`, 400, {
      [fieldName]: `${fieldName} must be an array.`,
    });
  }

  return [...new Set(value.map((item) => cleanString(item)).filter(Boolean))];
}

function cleanBoolean(value, fieldName) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw createHttpError(`${fieldName} must be true or false.`, 400, {
    [fieldName]: `${fieldName} must be true or false.`,
  });
}

function cleanOrder(value, fieldName) {
  const numericOrder = Number(value);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    throw createHttpError(`${fieldName} must be a non-negative number.`, 400, {
      [fieldName]: `${fieldName} must be a non-negative number.`,
    });
  }

  return numericOrder;
}

function appendStringFields(payload, source, prefix, fieldNames) {
  fieldNames.forEach((fieldName) => {
    if (hasOwnProperty(source, fieldName)) {
      payload[`${prefix}.${fieldName}`] = cleanString(source[fieldName]);
    }
  });
}

function appendButtonPayload(payload, buttonValue, prefix) {
  const button = ensureObject(buttonValue, prefix);

  appendStringFields(payload, button, prefix, buttonStringFields);
}

function appendBrandPayload(payload, brandValue) {
  const brand = ensureObject(brandValue, "brand");

  appendStringFields(payload, brand, "brand", brandStringFields);
}

function appendOwnerPayload(payload, ownerValue) {
  const owner = ensureObject(ownerValue, "owner");

  appendStringFields(payload, owner, "owner", ownerStringFields);
}

function appendHeroPayload(payload, heroValue) {
  const hero = ensureObject(heroValue, "hero");

  appendStringFields(payload, hero, "hero", heroStringFields);

  if (hasOwnProperty(hero, "primaryButton")) {
    appendButtonPayload(payload, hero.primaryButton, "hero.primaryButton");
  }

  if (hasOwnProperty(hero, "secondaryButton")) {
    appendButtonPayload(payload, hero.secondaryButton, "hero.secondaryButton");
  }
}

function appendAboutPayload(payload, aboutValue) {
  const about = ensureObject(aboutValue, "about");

  appendStringFields(payload, about, "about", aboutStringFields);

  if (hasOwnProperty(about, "highlights")) {
    payload["about.highlights"] = cleanStringArray(
      about.highlights,
      "about.highlights",
    );
  }
}

function appendContactPayload(payload, contactValue) {
  const contact = ensureObject(contactValue, "contact");

  contactStringFields.forEach((fieldName) => {
    if (!hasOwnProperty(contact, fieldName)) {
      return;
    }

    payload[`contact.${fieldName}`] =
      fieldName === "email"
        ? cleanEmail(contact[fieldName])
        : cleanString(contact[fieldName]);
  });
}

function appendSeoPayload(payload, seoValue) {
  const seo = ensureObject(seoValue, "seo");

  appendStringFields(payload, seo, "seo", seoStringFields);

  if (hasOwnProperty(seo, "keywords")) {
    payload["seo.keywords"] = cleanStringArray(
      seo.keywords,
      "seo.keywords",
    ).map((keyword) => keyword.toLowerCase());
  }
}

function cleanSections(value) {
  if (!Array.isArray(value)) {
    throw createHttpError("Sections must be an array.", 400, {
      sections: "Sections must be an array.",
    });
  }

  const usedKeys = new Set();

  return value.map((sectionValue, index) => {
    const fieldPrefix = `sections.${index}`;

    const section = ensureObject(sectionValue, fieldPrefix);

    const key = cleanString(section.key).toLowerCase();

    const label = cleanString(section.label);

    if (!key) {
      throw createHttpError("Every section requires a key.", 400, {
        [`${fieldPrefix}.key`]: "Section key is required.",
      });
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
      throw createHttpError(
        "Section keys can contain lowercase letters, numbers and hyphens only.",
        400,
        {
          [`${fieldPrefix}.key`]:
            "Use lowercase letters, numbers and hyphens only.",
        },
      );
    }

    if (usedKeys.has(key)) {
      throw createHttpError("Section keys must be unique.", 400, {
        [`${fieldPrefix}.key`]: `The section key "${key}" is already being used.`,
      });
    }

    usedKeys.add(key);

    if (!label) {
      throw createHttpError("Every section requires a label.", 400, {
        [`${fieldPrefix}.label`]: "Section label is required.",
      });
    }

    return {
      key,
      label,

      isVisible: hasOwnProperty(section, "isVisible")
        ? cleanBoolean(section.isVisible, `${fieldPrefix}.isVisible`)
        : true,

      order: hasOwnProperty(section, "order")
        ? cleanOrder(section.order, `${fieldPrefix}.order`)
        : index + 1,
    };
  });
}

function buildSiteSettingsPayload(requestBody) {
  const body = ensureObject(requestBody, "siteSettings");

  const payload = {};

  if (hasOwnProperty(body, "brand")) {
    appendBrandPayload(payload, body.brand);
  }

  if (hasOwnProperty(body, "owner")) {
    appendOwnerPayload(payload, body.owner);
  }

  if (hasOwnProperty(body, "hero")) {
    appendHeroPayload(payload, body.hero);
  }

  if (hasOwnProperty(body, "about")) {
    appendAboutPayload(payload, body.about);
  }

  if (hasOwnProperty(body, "contact")) {
    appendContactPayload(payload, body.contact);
  }

  if (hasOwnProperty(body, "seo")) {
    appendSeoPayload(payload, body.seo);
  }

  if (hasOwnProperty(body, "sections")) {
    payload.sections = cleanSections(body.sections);
  }

  if (hasOwnProperty(body, "isPublished")) {
    payload.isPublished = cleanBoolean(body.isPublished, "isPublished");
  }

  return payload;
}

async function getOrCreateMainSettings() {
  return SiteSettings.findOneAndUpdate(
    {
      siteKey: MAIN_SITE_KEY,
    },
    {
      $setOnInsert: {
        siteKey: MAIN_SITE_KEY,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );
}

function serializeSettings(settings) {
  const data =
    typeof settings.toObject === "function"
      ? settings.toObject()
      : { ...settings };

  data.sections = Array.isArray(data.sections)
    ? [...data.sections].sort(
        (firstSection, secondSection) =>
          (firstSection.order || 0) - (secondSection.order || 0),
      )
    : [];

  return data;
}

function sendSiteSettingsError(error, res, next) {
  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,

      message: "Main site settings already exist.",

      fieldErrors: {
        siteKey: "Main site settings already exist.",
      },
    });
  }

  if (error?.name === "ValidationError") {
    const fieldErrors = {};

    Object.entries(error.errors).forEach(([fieldName, fieldError]) => {
      fieldErrors[fieldName] = fieldError.message;
    });

    return res.status(400).json({
      success: false,

      message: "Please correct the site settings details.",

      fieldErrors,
    });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,

      message: "A site settings value has an invalid format.",

      fieldErrors: {
        [error.path || "siteSettings"]: "This value has an invalid format.",
      },
    });
  }

  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,

      fieldErrors: error.fieldErrors || {},
    });
  }

  return next(error);
}

async function getAdminSiteSettings(req, res, next) {
  try {
    const settings = await getOrCreateMainSettings();

    return res.status(200).json({
      success: true,
      data: serializeSettings(settings),
    });
  } catch (error) {
    return sendSiteSettingsError(error, res, next);
  }
}

async function updateAdminSiteSettings(req, res, next) {
  try {
    const updateData = buildSiteSettingsPayload(req.body);

    if (Object.keys(updateData).length === 0) {
      throw createHttpError(
        "At least one site settings field is required for updating.",
        400,
      );
    }

    const settings = await getOrCreateMainSettings();

    settings.set(updateData);

    settings.updatedBy = req.admin._id;

    await settings.save();

    return res.status(200).json({
      success: true,

      message: "Site settings updated successfully.",

      data: serializeSettings(settings),
    });
  } catch (error) {
    return sendSiteSettingsError(error, res, next);
  }
}

export { getAdminSiteSettings, updateAdminSiteSettings };
