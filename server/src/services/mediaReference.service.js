import Company from "../models/Company.js";
import CertificationAchievement from "../models/CertificationAchievement.js";
import Education from "../models/Education.js";
import Experience from "../models/Experience.js";
import Post from "../models/Post.js";
import Project from "../models/Project.js";
import Service from "../models/Service.js";
import SiteSettings from "../models/SiteSettings.js";
import Skill from "../models/Skill.js";
import Statistic from "../models/Statistic.js";
import TeamMember from "../models/TeamMember.js";
import Testimonial from "../models/Testimonial.js";

const MAX_REFERENCES_PER_RESOURCE = 25;

const MEDIA_REFERENCE_DEFINITIONS = Object.freeze([
  {
    resourceType: "site-settings",
    model: SiteSettings,
    labelField: "siteKey",
    fields: [
      "brand.logoUrl",
      "brand.faviconUrl",
      "owner.profileImageUrl",
      "owner.resumeUrl",
      "seo.ogImageUrl",
    ],
  },

  {
    resourceType: "service",
    model: Service,
    labelField: "title",
    fields: [
      "iconUrl",
    ],
  },

  {
    resourceType: "statistic",
    model: Statistic,
    labelField: "label",
    fields: [
      "iconUrl",
    ],
  },

  {
    resourceType: "skill",
    model: Skill,
    labelField: "name",
    fields: [
      "iconUrl",
    ],
  },

  {
    resourceType: "education",
    model: Education,
    labelField: "institutionName",
    fields: [
      "logoUrl",
      "certificateUrl",
    ],
  },

  {
    resourceType: "experience",
    model: Experience,
    labelField: "organizationName",
    fields: [
      "organizationLogoUrl",
    ],
  },

  {
    resourceType: "certification-achievement",
    model: CertificationAchievement,
    labelField: "title",
    fields: [
      "mediaUrl",
    ],
  },

  {
    resourceType: "testimonial",
    model: Testimonial,
    labelField: "clientName",
    fields: [
      "profileImageUrl",
    ],
  },

  {
    resourceType: "post",
    model: Post,
    labelField: "title",
    fields: [
      "featuredImageUrl",
      "seo.ogImageUrl",
    ],
  },

  {
    resourceType: "project",
    model: Project,
    labelField: "title",
    fields: [
      "coverImageUrl",
      "images.url",
      "links.videoUrl",
      "seo.ogImageUrl",
    ],
  },

  {
    resourceType: "company",
    model: Company,
    labelField: "name",
    fields: [
      "logoUrl",
      "coverImageUrl",
      "seo.ogImageUrl",
    ],
  },

  {
    resourceType: "team-member",
    model: TeamMember,
    labelField: "name",
    fields: [
      "profileImageUrl",
      "coverImageUrl",
      "seo.ogImageUrl",
    ],
  },
]);

function normalizeMediaUrl(value) {
  return String(value ?? "").trim();
}

function getNestedValues(value, pathParts) {
  if (pathParts.length === 0) {
    if (Array.isArray(value)) {
      return value.flatMap((item) =>
        getNestedValues(item, []),
      );
    }

    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) =>
      getNestedValues(item, pathParts),
    );
  }

  if (
    value === null ||
    value === undefined ||
    typeof value !== "object"
  ) {
    return [];
  }

  const [currentPart, ...remainingParts] =
    pathParts;

  return getNestedValues(
    value[currentPart],
    remainingParts,
  );
}

function documentUsesUrlAtField(
  document,
  fieldPath,
  mediaUrl,
) {
  const values = getNestedValues(
    document,
    fieldPath.split("."),
  );

  return values.some(
    (value) =>
      normalizeMediaUrl(value) ===
      mediaUrl,
  );
}

function createReferenceQuery(
  fields,
  mediaUrl,
) {
  return {
    $or: fields.map((fieldName) => ({
      [fieldName]: mediaUrl,
    })),
  };
}

function createReferenceSelection(
  definition,
) {
  return [
    "_id",
    definition.labelField,
    ...definition.fields,
  ].join(" ");
}

function normalizeReferenceLabel(
  document,
  labelField,
  resourceType,
) {
  const label = String(
    document?.[labelField] ?? "",
  ).trim();

  if (label) {
    return label;
  }

  return resourceType;
}

async function findReferencesForDefinition(
  definition,
  mediaUrl,
) {
  const documents =
    await definition.model
      .find(
        createReferenceQuery(
          definition.fields,
          mediaUrl,
        ),
      )
      .select(
        createReferenceSelection(
          definition,
        ),
      )
      .limit(
        MAX_REFERENCES_PER_RESOURCE,
      )
      .lean();

  return documents.map((document) => {
    const matchedFields =
      definition.fields.filter(
        (fieldName) =>
          documentUsesUrlAtField(
            document,
            fieldName,
            mediaUrl,
          ),
      );

    return {
      resourceType:
        definition.resourceType,

      resourceId:
        String(document._id),

      resourceLabel:
        normalizeReferenceLabel(
          document,
          definition.labelField,
          definition.resourceType,
        ),

      fields:
        matchedFields,
    };
  });
}

async function findMediaReferences(
  url,
) {
  const mediaUrl =
    normalizeMediaUrl(url);

  if (!mediaUrl) {
    return [];
  }

  const groupedReferences =
    await Promise.all(
      MEDIA_REFERENCE_DEFINITIONS.map(
        (definition) =>
          findReferencesForDefinition(
            definition,
            mediaUrl,
          ),
      ),
    );

  return groupedReferences
    .flat()
    .sort((left, right) => {
      const typeComparison =
        left.resourceType.localeCompare(
          right.resourceType,
        );

      if (typeComparison !== 0) {
        return typeComparison;
      }

      return left.resourceLabel.localeCompare(
        right.resourceLabel,
      );
    });
}

async function getMediaUsageSummary(
  url,
) {
  const references =
    await findMediaReferences(url);

  const resourceTypes =
    [
      ...new Set(
        references.map(
          (reference) =>
            reference.resourceType,
        ),
      ),
    ].sort();

  return {
    usageCount:
      references.length,

    isReferenced:
      references.length > 0,

    resourceTypes,

    references,
  };
}

async function isMediaReferenced(
  url,
) {
  const mediaUrl =
    normalizeMediaUrl(url);

  if (!mediaUrl) {
    return false;
  }

  for (
    const definition of
      MEDIA_REFERENCE_DEFINITIONS
  ) {
    const exists =
      await definition.model.exists(
        createReferenceQuery(
          definition.fields,
          mediaUrl,
        ),
      );

    if (exists) {
      return true;
    }
  }

  return false;
}

export {
  MAX_REFERENCES_PER_RESOURCE,
  MEDIA_REFERENCE_DEFINITIONS,
  findMediaReferences,
  getMediaUsageSummary,
  isMediaReferenced,
  normalizeMediaUrl,
};

export default getMediaUsageSummary;
