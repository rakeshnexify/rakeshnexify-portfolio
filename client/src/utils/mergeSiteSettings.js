const DYNAMIC_OBJECT_KEYS = [
  "brand",
  "owner",
  "hero",
  "about",
  "contact",
  "seo",
];

export default function mergeSiteSettings(
  fallbackSettings,
  databaseSettings,
) {
  if (!databaseSettings || typeof databaseSettings !== "object") {
    return fallbackSettings;
  }

  const mergedSettings = {
    ...fallbackSettings,
    ...databaseSettings,
  };

  DYNAMIC_OBJECT_KEYS.forEach((key) => {
    mergedSettings[key] = {
      ...(fallbackSettings[key] || {}),
      ...(databaseSettings[key] || {}),
    };
  });

  mergedSettings.sections = Array.isArray(databaseSettings.sections)
    ? [...databaseSettings.sections].sort(
        (firstSection, secondSection) =>
          firstSection.order - secondSection.order,
      )
    : fallbackSettings.sections || [];

  mergedSettings.isPublished =
    typeof databaseSettings.isPublished === "boolean"
      ? databaseSettings.isPublished
      : true;

  return mergedSettings;
}