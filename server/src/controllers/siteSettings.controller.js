import SiteSettings from "../models/SiteSettings.js";

const MAIN_SITE_KEY = "main";

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

    const publicSettings = settings.toObject();

    publicSettings.sections = [...publicSettings.sections].sort(
      (firstSection, secondSection) => firstSection.order - secondSection.order,
    );

    res.status(200).json({
      success: true,
      data: publicSettings,
    });
  } catch (error) {
    next(error);
  }
}

export { getPublicSiteSettings };
