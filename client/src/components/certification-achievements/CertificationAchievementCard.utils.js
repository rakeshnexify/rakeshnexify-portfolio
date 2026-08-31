const certificationAchievementTypeLabels = {
  certification: "Certification",
  license: "License",
  award: "Award",
  achievement: "Achievement",
};

function getSafeHttpUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return "";
  }

  try {
    const parsedUrl = new URL(url);

    if (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    ) {
      return url;
    }
  } catch {
    return "";
  }

  return "";
}

export { certificationAchievementTypeLabels, getSafeHttpUrl };
