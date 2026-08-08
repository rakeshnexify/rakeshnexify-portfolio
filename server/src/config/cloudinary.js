import { v2 as cloudinary } from "cloudinary";

const DEFAULT_MEDIA_FOLDER = "rakeshnexify/media";

let isConfigured = false;

function readEnvironmentValue(variableName) {
  return String(process.env[variableName] || "").trim();
}

function getCloudinarySettings() {
  return {
    cloudName: readEnvironmentValue("CLOUDINARY_CLOUD_NAME"),
    apiKey: readEnvironmentValue("CLOUDINARY_API_KEY"),
    apiSecret: readEnvironmentValue("CLOUDINARY_API_SECRET"),
    mediaFolder:
      readEnvironmentValue("CLOUDINARY_MEDIA_FOLDER") ||
      DEFAULT_MEDIA_FOLDER,
  };
}

function hasCompleteCloudinaryConfiguration() {
  const {
    cloudName,
    apiKey,
    apiSecret,
  } = getCloudinarySettings();

  return Boolean(cloudName && apiKey && apiSecret);
}

function configureCloudinary() {
  if (isConfigured) {
    return cloudinary;
  }

  const {
    cloudName,
    apiKey,
    apiSecret,
  } = getCloudinarySettings();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary Media storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isConfigured = true;

  return cloudinary;
}

function getCloudinaryClient() {
  return configureCloudinary();
}

function getCloudinaryMediaFolder() {
  return getCloudinarySettings().mediaFolder;
}

export {
  DEFAULT_MEDIA_FOLDER,
  configureCloudinary,
  getCloudinaryClient,
  getCloudinaryMediaFolder,
  getCloudinarySettings,
  hasCompleteCloudinaryConfiguration,
};

export default getCloudinaryClient;