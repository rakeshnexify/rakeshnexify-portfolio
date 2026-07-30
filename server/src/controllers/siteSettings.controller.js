import SiteSettings from "../models/SiteSettings.js";

const MAIN_SITE_KEY = "main";

const orderedArrayFields = [
  "sections",
  "socialPlatforms",
  "developerPlatforms",
  "freelancerPlatforms",
];

function sortByOrder(firstItem, secondItem) {
  return Number(firstItem?.order || 0) - Number(secondItem?.order || 0);
}

function serializePublicSettings(settings) {
  const publicSettings =
    typeof settings?.toObject === "function"
      ? settings.toObject()
      : { ...settings };

  orderedArrayFields.forEach((fieldName) => {
    publicSettings[fieldName] = Array.isArray(publicSettings[fieldName])
      ? [...publicSettings[fieldName]].sort(sortByOrder)
      : [];
  });

  delete publicSettings.updatedBy;

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
