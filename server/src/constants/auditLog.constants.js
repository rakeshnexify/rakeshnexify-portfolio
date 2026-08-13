const AUDIT_ACTOR_TYPES = ["admin", "system", "anonymous"];

const AUDIT_ACTOR_ROLES = ["super-admin", "admin", "editor"];

const AUDIT_CATEGORIES = [
  "authentication",
  "security",
  "content",
  "workflow",
  "configuration",
  "media",
  "subscriber",
];

const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "status-change",
  "assignment-change",
  "publish",
  "unpublish",
  "convert",
  "note-added",
  "upload",
  "unsubscribe",
  "login-success",
  "login-failed",
  "account-lock",
];

const AUDIT_OUTCOMES = ["success", "failure", "denied"];

const AUDIT_RESOURCE_TYPES = [
  "admin-auth",
  "admin-user",
  "site-settings",
  "service",
  "service-package",
  "package-design",
  "service-order",
  "appointment",
  "contact-message",
  "lead",
  "subscriber",
  "media",
  "project",
  "statistic",
  "company",
  "team-member",
  "skill",
  "education",
  "experience",
  "certification-achievement",
  "testimonial",
  "faq",
  "post",
];

const AUDIT_SAFE_CHANGE_FIELDS = new Set([
  "status",
  "assignedTo",
  "scheduledAt",
  "preferredDate",
  "preferredTime",
  "isVisible",
  "isFeatured",
  "isPageVisible",
  "isNavigationVisible",
  "isFooterNavigationVisible",
  "label",
  "order",
  "navigationOrder",
  "footerNavigationOrder",
  "parentId",
  "serviceId",
  "servicePackageId",
]);

const AUDIT_SAFE_METADATA_KEYS = new Set([
  "sourceResourceId",
  "createdLeadId",
  "parentResourceId",
  "parentResourceType",
  "mediaType",
  "provider",
  "noteId",
  "statusReasonCode",
]);

const AUDIT_FORBIDDEN_FIELD_NAME_PATTERN =
  /(password|passcode|token|secret|authorization|cookie|credential|api[-_]?key|private[-_]?key|message|projectsummary|requirementsummary|adminnote|notes?text|consent|email|phone|lostreason)/i;

const AUDIT_LIMITS = Object.freeze({
  actorName: 120,
  actorEmail: 254,
  resourceLabel: 180,
  resourceSlug: 180,
  changedFields: 50,
  changedFieldName: 80,
  changeEntries: 20,
  metadataEntries: 20,
  arrayItems: 20,
  nestingDepth: 3,
  stringValue: 300,
  routePath: 300,
  ip: 45,
  userAgent: 500,
  search: 100,
  pageLimit: 100,
});

export {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLES,
  AUDIT_ACTOR_TYPES,
  AUDIT_CATEGORIES,
  AUDIT_FORBIDDEN_FIELD_NAME_PATTERN,
  AUDIT_LIMITS,
  AUDIT_OUTCOMES,
  AUDIT_RESOURCE_TYPES,
  AUDIT_SAFE_CHANGE_FIELDS,
  AUDIT_SAFE_METADATA_KEYS,
};
