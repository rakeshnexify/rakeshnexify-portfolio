import SiteSettings from "../models/SiteSettings.js";
import { mergeHomepageSections } from "../config/homepageSections.js";

const MAIN_SITE_KEY = "main";

const orderedArrayFields = [
  "socialPlatforms",
  "developerPlatforms",
  "freelancerPlatforms",
];

function sortByOrder(firstItem, secondItem) {
  return Number(firstItem?.order || 0) - Number(secondItem?.order || 0);
}

function getOrderedArray(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return [...items].sort(sortByOrder);
}

function serializePublishedLegalPage(page) {
  if (!page || page.isPublished !== true) {
    return {
      isPublished: false,
    };
  }

  return {
    title: String(page.title || "").trim(),
    content: String(page.content || "").trim(),
    seoTitle: String(page.seoTitle || "").trim(),
    seoDescription: String(page.seoDescription || "").trim(),
    isPublished: true,
    publishedAt: page.publishedAt || null,
  };
}
function serializePublicSettings(settings) {
  const publicSettings =
    typeof settings?.toObject === "function"
      ? settings.toObject()
      : { ...settings };

      publicSettings.sections = mergeHomepageSections(publicSettings.sections);

  orderedArrayFields.forEach((fieldName) => {
    publicSettings[fieldName] = getOrderedArray(publicSettings[fieldName]);
  });

  if (
    publicSettings.hero &&
    typeof publicSettings.hero === "object" &&
    !Array.isArray(publicSettings.hero)
  ) {
    publicSettings.hero = {
      ...publicSettings.hero,
      quickLinks: getOrderedArray(publicSettings.hero.quickLinks),
    };
  }

  if (
    publicSettings.about &&
    typeof publicSettings.about === "object" &&
    !Array.isArray(publicSettings.about)
  ) {
    publicSettings.about = {
      ...publicSettings.about,
      identityRoles: getOrderedArray(publicSettings.about.identityRoles),
      workItems: getOrderedArray(publicSettings.about.workItems),
    };
  }

  const legal =
    publicSettings.legal && typeof publicSettings.legal === "object"
      ? publicSettings.legal
      : {};

  publicSettings.legal = {
    privacyPolicy: serializePublishedLegalPage(legal.privacyPolicy),
    termsConditions: serializePublishedLegalPage(legal.termsConditions),
  };

  const footer =
    publicSettings.footer && typeof publicSettings.footer === "object"
      ? {
          ...publicSettings.footer,
        }
      : {};

  footer.legalLinks = getOrderedArray(footer.legalLinks);

  publicSettings.footer = footer;

  delete publicSettings.siteKey;
  delete publicSettings.updatedBy;
  delete publicSettings.__v;

  return publicSettings;
}

async function getPublicSiteSettings(req, res, next) {
  try {
    let settings = await SiteSettings.findOne({
      siteKey: MAIN_SITE_KEY,
    }).select("-updatedBy");

    if (!settings) {
      const createdSettings = await SiteSettings.create({
        siteKey: MAIN_SITE_KEY,
      });

      settings = await SiteSettings.findById(createdSettings._id).select(
        "-updatedBy",
      );
    }

    return res.status(200).json({
      success: true,
      data: serializePublicSettings(settings),
    });
  } catch (error) {
    return next(error);
  }
}

export { getPublicSiteSettings };
