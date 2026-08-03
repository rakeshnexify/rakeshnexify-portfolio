function createDefaultTeamMemberFormValues() {
  return {
    name: "",
    slug: "",

    professionalRole: "",
    teamPosition: "",

    shortIntroduction: "",
    biography: "",

    profileImageUrl: "",
    profileImageAlt: "",
    coverImageUrl: "",

    skills: "",
    tools: "",

    status: "active",
    availabilityStatus: "available",

    email: "",
    phone: "",
    websiteUrl: "",
    portfolioUrl: "",

    githubUrl: "",
    linkedinUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    xUrl: "",

    relatedProjects: [],
    relatedCompanies: [],
    relatedServices: [],

    order: "0",
    isFeatured: false,
    isVisible: true,

    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    seoOgImageUrl: "",
  };
}

const defaultTeamMemberFormValues =
  createDefaultTeamMemberFormValues();

function createTeamMemberSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function listToText(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

function textToList(value) {
  const items = String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set(items)];
}

function createRelationIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const relationIds = value
    .map((relation) => {
      if (relation && typeof relation === "object") {
        return String(relation._id || relation.id || "").trim();
      }

      return String(relation || "").trim();
    })
    .filter(Boolean);

  return [...new Set(relationIds)];
}

function createTeamMemberFormFromData(teamMember = {}) {
  const socialLinks = teamMember.socialLinks || {};

  const seo = teamMember.seo || {};

  return {
    name: teamMember.name || "",

    slug: teamMember.slug || "",

    professionalRole: teamMember.professionalRole || "",

    teamPosition: teamMember.teamPosition || "",

    shortIntroduction: teamMember.shortIntroduction || "",

    biography: teamMember.biography || "",

    profileImageUrl: teamMember.profileImageUrl || "",

    profileImageAlt: teamMember.profileImageAlt || "",

    coverImageUrl: teamMember.coverImageUrl || "",

    skills: listToText(teamMember.skills),

    tools: listToText(teamMember.tools),

    status: teamMember.status || "active",

    availabilityStatus:
      teamMember.availabilityStatus || "available",

    email: teamMember.email || "",

    phone: teamMember.phone || "",

    websiteUrl: teamMember.websiteUrl || "",

    portfolioUrl: teamMember.portfolioUrl || "",

    githubUrl: socialLinks.github || "",

    linkedinUrl: socialLinks.linkedin || "",

    facebookUrl: socialLinks.facebook || "",

    instagramUrl: socialLinks.instagram || "",

    youtubeUrl: socialLinks.youtube || "",

    xUrl: socialLinks.x || "",

    relatedProjects: createRelationIds(teamMember.relatedProjects),

    relatedCompanies: createRelationIds(teamMember.relatedCompanies),

    relatedServices: createRelationIds(teamMember.relatedServices),

    order: String(teamMember.order ?? 0),

    isFeatured: Boolean(teamMember.isFeatured),

    isVisible:
      typeof teamMember.isVisible === "boolean"
        ? teamMember.isVisible
        : true,

    seoTitle: seo.title || "",

    seoDescription: seo.description || "",

    seoKeywords: listToText(seo.keywords),

    seoOgImageUrl: seo.ogImageUrl || "",
  };
}

function createTeamMemberPayload(formValues) {
  const name = String(formValues.name || "").trim();

  return {
    name,

    slug:
      createTeamMemberSlug(formValues.slug) ||
      createTeamMemberSlug(name),

    professionalRole: String(
      formValues.professionalRole || "",
    ).trim(),

    teamPosition: String(formValues.teamPosition || "").trim(),

    shortIntroduction: String(
      formValues.shortIntroduction || "",
    ).trim(),

    biography: String(formValues.biography || "").trim(),

    profileImageUrl: String(
      formValues.profileImageUrl || "",
    ).trim(),

    profileImageAlt: String(
      formValues.profileImageAlt || "",
    ).trim(),

    coverImageUrl: String(
      formValues.coverImageUrl || "",
    ).trim(),

    skills: textToList(formValues.skills),

    tools: textToList(formValues.tools),

    status: formValues.status || "active",

    availabilityStatus:
      formValues.availabilityStatus || "available",

    email: String(formValues.email || "").trim(),

    phone: String(formValues.phone || "").trim(),

    websiteUrl: String(formValues.websiteUrl || "").trim(),

    portfolioUrl: String(formValues.portfolioUrl || "").trim(),

    socialLinks: {
      github: String(formValues.githubUrl || "").trim(),

      linkedin: String(formValues.linkedinUrl || "").trim(),

      facebook: String(formValues.facebookUrl || "").trim(),

      instagram: String(formValues.instagramUrl || "").trim(),

      youtube: String(formValues.youtubeUrl || "").trim(),

      x: String(formValues.xUrl || "").trim(),
    },

    relatedProjects: createRelationIds(
      formValues.relatedProjects,
    ),

    relatedCompanies: createRelationIds(
      formValues.relatedCompanies,
    ),

    relatedServices: createRelationIds(
      formValues.relatedServices,
    ),

    order: Number(formValues.order || 0),

    isFeatured: Boolean(formValues.isFeatured),

    isVisible: Boolean(formValues.isVisible),

    seo: {
      title: String(formValues.seoTitle || "").trim(),

      description: String(
        formValues.seoDescription || "",
      ).trim(),

      keywords: textToList(formValues.seoKeywords),

      ogImageUrl: String(
        formValues.seoOgImageUrl || "",
      ).trim(),
    },
  };
}

export {
  createDefaultTeamMemberFormValues,
  createRelationIds,
  createTeamMemberFormFromData,
  createTeamMemberPayload,
  createTeamMemberSlug,
  defaultTeamMemberFormValues,
};