import SiteSettings from "../models/SiteSettings.js";
import { mergeHomepageSections } from "../config/homepageSections.js";

const MAIN_SITE_KEY = "main";

const MAX_PLATFORMS_PER_GROUP = 25;
const MAX_LEGAL_LINKS = 20;

const platformGroupFields = [
  "socialPlatforms",
  "developerPlatforms",
  "freelancerPlatforms",
];

const listingSectionFields = [
  "statisticsSection",
  "skillsSection",
  "servicesSection",
  "projectsSection",
  "educationSection",
  "experienceSection",
  "achievementsSection",
  "teamSection",
  "companiesSection",
  "clientsPartnersSection",
  "testimonialsSection",
  "faqSection",
  "postsSection",
];

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

const listingSectionStringFields = ["eyebrow", "heading", "description"];

const contactSectionStringFields = [
  "eyebrow",
  "heading",
  "description",
  "enquiryEyebrow",
  "enquiryHeading",
  "enquiryDescription",
];

const contactStringFields = [
  "email",
  "phone",
  "whatsapp",
  "location",
  "availability",
];

const seoStringFields = ["title", "description", "ogImageUrl"];

const footerStringFields = [
  "introduction",
  "quickLinksHeading",
  "servicesHeading",
  "platformsHeading",
  "platformNote",
  "copyrightText",
];

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

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const characterCode = text.charCodeAt(index);

    if (characterCode <= 31 || characterCode === 127) {
      return true;
    }
  }

  return false;
}

function cleanHttpUrl(value, fieldName) {
  const url = cleanString(value);

  if (!url) {
    return "";
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw createHttpError(`${fieldName} must be a valid website URL.`, 400, {
      [fieldName]: "Enter a complete URL beginning with http:// or https://.",
    });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw createHttpError(`${fieldName} must use http:// or https://.`, 400, {
      [fieldName]: "Only http:// and https:// URLs are allowed.",
    });
  }

  if (!parsedUrl.hostname) {
    throw createHttpError(`${fieldName} must contain a valid hostname.`, 400, {
      [fieldName]: "Enter a valid website hostname.",
    });
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw createHttpError(
      `${fieldName} cannot contain login credentials.`,
      400,
      {
        [fieldName]: "URLs containing usernames or passwords are not allowed.",
      },
    );
  }

  return url;
}

function cleanPublicUrl(value, fieldName) {
  const url = cleanString(value);

  if (!url) {
    return "";
  }

  if (/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(url)) {
    return url;
  }

  if (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.includes("\\") &&
    !containsControlCharacters(url)
  ) {
    return url;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw createHttpError(`${fieldName} has an invalid URL.`, 400, {
      [fieldName]:
        "Use a #section anchor, /relative-path or complete http:// or https:// URL.",
    });
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw createHttpError(
      `${fieldName} contains an unsupported URL type.`,
      400,
      {
        [fieldName]:
          "Only section anchors, relative paths, http:// and https:// URLs are allowed.",
      },
    );
  }

  if (!parsedUrl.hostname) {
    throw createHttpError(`${fieldName} must contain a valid hostname.`, 400, {
      [fieldName]: "Enter a valid website hostname.",
    });
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw createHttpError(
      `${fieldName} cannot contain login credentials.`,
      400,
      {
        [fieldName]: "URLs containing usernames or passwords are not allowed.",
      },
    );
  }

  return url;
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

function appendPublicButtonPayload(payload, buttonValue, prefix) {
  const button = ensureObject(buttonValue, prefix);

  if (hasOwnProperty(button, "label")) {
    payload[`${prefix}.label`] = cleanString(button.label);
  }

  if (hasOwnProperty(button, "url")) {
    payload[`${prefix}.url`] = cleanPublicUrl(button.url, `${prefix}.url`);
  }
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

function appendListingSectionPayload(payload, sectionValue, fieldName) {
  const section = ensureObject(sectionValue, fieldName);

  appendStringFields(payload, section, fieldName, listingSectionStringFields);

  if (hasOwnProperty(section, "ctaButton")) {
    appendPublicButtonPayload(
      payload,
      section.ctaButton,
      `${fieldName}.ctaButton`,
    );
  }
}

function appendContactSectionPayload(payload, sectionValue) {
  const section = ensureObject(sectionValue, "contactSection");

  appendStringFields(
    payload,
    section,
    "contactSection",
    contactSectionStringFields,
  );
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

    const sectionOrder = hasOwnProperty(section, "order")
      ? cleanOrder(section.order, `${fieldPrefix}.order`)
      : index + 1;

    const navigationOrder = hasOwnProperty(section, "navigationOrder")
      ? cleanOrder(section.navigationOrder, `${fieldPrefix}.navigationOrder`)
      : sectionOrder;

    return {
      key,
      label,

      /*
       * Homepage section visibility.
       */
      isVisible: hasOwnProperty(section, "isVisible")
        ? cleanBoolean(section.isVisible, `${fieldPrefix}.isVisible`)
        : true,

      /*
       * Desktop aur mobile Navbar visibility.
       */
      isNavigationVisible: hasOwnProperty(section, "isNavigationVisible")
        ? cleanBoolean(
            section.isNavigationVisible,
            `${fieldPrefix}.isNavigationVisible`,
          )
        : true,

      /*
       * Dedicated public page accessibility.
       */
      isPageVisible: hasOwnProperty(section, "isPageVisible")
        ? cleanBoolean(section.isPageVisible, `${fieldPrefix}.isPageVisible`)
        : true,

      order: sectionOrder,

      navigationOrder,
    };
  });
}

function cleanPlatforms(value, fieldName) {
  if (!Array.isArray(value)) {
    throw createHttpError(`${fieldName} must be an array.`, 400, {
      [fieldName]: `${fieldName} must be an array.`,
    });
  }

  if (value.length > MAX_PLATFORMS_PER_GROUP) {
    throw createHttpError(
      `${fieldName} cannot contain more than ${MAX_PLATFORMS_PER_GROUP} platforms.`,
      400,
      {
        [fieldName]: `Add no more than ${MAX_PLATFORMS_PER_GROUP} platforms to this group.`,
      },
    );
  }

  const usedNames = new Set();

  return value.map((platformValue, index) => {
    const fieldPrefix = `${fieldName}.${index}`;

    const platform = ensureObject(platformValue, fieldPrefix);

    const name = cleanString(platform.name);

    if (!name) {
      throw createHttpError("Every platform requires a name.", 400, {
        [`${fieldPrefix}.name`]: "Platform name is required.",
      });
    }

    const normalizedName = name.toLowerCase();

    if (usedNames.has(normalizedName)) {
      throw createHttpError(
        `Platform names inside ${fieldName} must be unique.`,
        400,
        {
          [`${fieldPrefix}.name`]: `The platform "${name}" already exists in this group.`,
        },
      );
    }

    usedNames.add(normalizedName);

    return {
      name,

      username: hasOwnProperty(platform, "username")
        ? cleanString(platform.username)
        : "",

      url: hasOwnProperty(platform, "url")
        ? cleanHttpUrl(platform.url, `${fieldPrefix}.url`)
        : "",

      isVisible: hasOwnProperty(platform, "isVisible")
        ? cleanBoolean(platform.isVisible, `${fieldPrefix}.isVisible`)
        : true,

      order: hasOwnProperty(platform, "order")
        ? cleanOrder(platform.order, `${fieldPrefix}.order`)
        : index + 1,
    };
  });
}

function cleanLegalLinks(value) {
  const fieldName = "footer.legalLinks";

  if (!Array.isArray(value)) {
    throw createHttpError("Footer legal links must be an array.", 400, {
      [fieldName]: "Footer legal links must be an array.",
    });
  }

  if (value.length > MAX_LEGAL_LINKS) {
    throw createHttpError(
      `Footer cannot contain more than ${MAX_LEGAL_LINKS} legal links.`,
      400,
      {
        [fieldName]: `Add no more than ${MAX_LEGAL_LINKS} legal links.`,
      },
    );
  }

  const usedLabels = new Set();

  return value.map((linkValue, index) => {
    const fieldPrefix = `${fieldName}.${index}`;

    const link = ensureObject(linkValue, fieldPrefix);

    const label = cleanString(link.label);

    if (!label) {
      throw createHttpError("Every legal link requires a label.", 400, {
        [`${fieldPrefix}.label`]: "Legal link label is required.",
      });
    }

    const normalizedLabel = label.toLowerCase();

    if (usedLabels.has(normalizedLabel)) {
      throw createHttpError("Footer legal link labels must be unique.", 400, {
        [`${fieldPrefix}.label`]: `The legal link "${label}" already exists.`,
      });
    }

    usedLabels.add(normalizedLabel);

    return {
      label,

      url: hasOwnProperty(link, "url")
        ? cleanPublicUrl(link.url, `${fieldPrefix}.url`)
        : "",

      isVisible: hasOwnProperty(link, "isVisible")
        ? cleanBoolean(link.isVisible, `${fieldPrefix}.isVisible`)
        : true,

      order: hasOwnProperty(link, "order")
        ? cleanOrder(link.order, `${fieldPrefix}.order`)
        : index + 1,
    };
  });
}

function appendFooterPayload(payload, footerValue) {
  const footer = ensureObject(footerValue, "footer");

  appendStringFields(payload, footer, "footer", footerStringFields);

  if (hasOwnProperty(footer, "projectButton")) {
    appendPublicButtonPayload(
      payload,
      footer.projectButton,
      "footer.projectButton",
    );
  }

  if (hasOwnProperty(footer, "legalLinks")) {
    payload["footer.legalLinks"] = cleanLegalLinks(footer.legalLinks);
  }
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

  listingSectionFields.forEach((fieldName) => {
    if (hasOwnProperty(body, fieldName)) {
      appendListingSectionPayload(payload, body[fieldName], fieldName);
    }
  });

  if (hasOwnProperty(body, "contactSection")) {
    appendContactSectionPayload(payload, body.contactSection);
  }

  if (hasOwnProperty(body, "contact")) {
    appendContactPayload(payload, body.contact);
  }

  if (hasOwnProperty(body, "seo")) {
    appendSeoPayload(payload, body.seo);
  }

  if (hasOwnProperty(body, "footer")) {
    appendFooterPayload(payload, body.footer);
  }

  platformGroupFields.forEach((fieldName) => {
    if (hasOwnProperty(body, fieldName)) {
      payload[fieldName] = cleanPlatforms(body[fieldName], fieldName);
    }
  });

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

function sortByOrder(firstItem, secondItem) {
  return Number(firstItem?.order || 0) - Number(secondItem?.order || 0);
}

function serializeSettings(settings) {
  const data =
    typeof settings.toObject === "function"
      ? settings.toObject()
      : { ...settings };

  data.sections = mergeHomepageSections(data.sections);

  platformGroupFields.forEach((fieldName) => {
    data[fieldName] = Array.isArray(data[fieldName])
      ? [...data[fieldName]].sort(sortByOrder)
      : [];
  });

  if (isPlainObject(data.footer)) {
    data.footer = {
      ...data.footer,

      legalLinks: Array.isArray(data.footer.legalLinks)
        ? [...data.footer.legalLinks].sort(sortByOrder)
        : [],
    };
  }

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
