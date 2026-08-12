import mongoose from "mongoose";

import {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLES,
  AUDIT_ACTOR_TYPES,
  AUDIT_CATEGORIES,
  AUDIT_LIMITS,
  AUDIT_OUTCOMES,
  AUDIT_RESOURCE_TYPES,
} from "../constants/auditLog.constants.js";

const { Schema } = mongoose;

function createAppendOnlyError() {
  const error = new Error(
    "Audit Log records are append-only and cannot be modified or deleted.",
  );

  error.name = "AuditLogAppendOnlyError";
  error.statusCode = 409;

  return error;
}

const auditLogSchema = new Schema(
  {
    actorType: {
      type: String,
      required: true,
      enum: AUDIT_ACTOR_TYPES,
      immutable: true,
    },

    actorAdminId: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
      immutable: true,
    },

    actorNameSnapshot: {
      type: String,
      trim: true,
      maxlength: AUDIT_LIMITS.actorName,
      default: "",
      immutable: true,
    },

    actorEmailSnapshot: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: AUDIT_LIMITS.actorEmail,
      default: "",
      immutable: true,
    },

    actorRoleSnapshot: {
      type: String,
      enum: [...AUDIT_ACTOR_ROLES, ""],
      default: "",
      immutable: true,
    },

    category: {
      type: String,
      required: true,
      enum: AUDIT_CATEGORIES,
      immutable: true,
    },

    action: {
      type: String,
      required: true,
      enum: AUDIT_ACTIONS,
      immutable: true,
    },

    outcome: {
      type: String,
      required: true,
      enum: AUDIT_OUTCOMES,
      default: "success",
      immutable: true,
    },

    resourceType: {
      type: String,
      required: true,
      enum: AUDIT_RESOURCE_TYPES,
      immutable: true,
    },

    resourceId: {
      type: Schema.Types.ObjectId,
      default: null,
      immutable: true,
    },

    resourceLabel: {
      type: String,
      trim: true,
      maxlength: AUDIT_LIMITS.resourceLabel,
      default: "",
      immutable: true,
    },

    resourceSlug: {
      type: String,
      trim: true,
      maxlength: AUDIT_LIMITS.resourceSlug,
      default: "",
      immutable: true,
    },

    changedFields: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: AUDIT_LIMITS.changedFieldName,
        },
      ],
      default: [],
      immutable: true,
    },

    changes: {
      type: Schema.Types.Mixed,
      default: {},
      immutable: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
      immutable: true,
    },

    httpMethod: {
      type: String,
      trim: true,
      maxlength: 12,
      default: "",
      immutable: true,
    },

    routePath: {
      type: String,
      trim: true,
      maxlength: AUDIT_LIMITS.routePath,
      default: "",
      immutable: true,
    },

    ip: {
      type: String,
      trim: true,
      maxlength: AUDIT_LIMITS.ip,
      default: "",
      immutable: true,
    },

    userAgent: {
      type: String,
      trim: true,
      maxlength: AUDIT_LIMITS.userAgent,
      default: "",
      immutable: true,
    },
  },
  {
    collection: "audit_logs",
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
    strict: "throw",
    minimize: false,
  },
);

auditLogSchema.index({
  createdAt: -1,
  _id: -1,
});

auditLogSchema.index({
  actorAdminId: 1,
  createdAt: -1,
  _id: -1,
});

auditLogSchema.index({
  resourceType: 1,
  createdAt: -1,
  _id: -1,
});

auditLogSchema.index({
  action: 1,
  createdAt: -1,
  _id: -1,
});

auditLogSchema.index({
  resourceType: 1,
  resourceId: 1,
  createdAt: -1,
});

auditLogSchema.index(
  {
    actorNameSnapshot: "text",
    actorEmailSnapshot: "text",
    resourceLabel: "text",
    resourceSlug: "text",
  },
  {
    name: "audit_log_safe_search",
    weights: {
      resourceLabel: 8,
      resourceSlug: 6,
      actorNameSnapshot: 4,
      actorEmailSnapshot: 2,
    },
  },
);

auditLogSchema.pre(
  "save",
  function preventExistingDocumentSave() {
    if (!this.isNew) {
      throw createAppendOnlyError();
    }
  },
);

auditLogSchema.pre(
  "deleteOne",
  {
    document: true,
    query: true,
  },
  function preventAuditDeleteOne() {
    throw createAppendOnlyError();
  },
);

[
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "findOneAndReplace",
  "replaceOne",
  "deleteMany",
  "findOneAndDelete",
].forEach((middlewareName) => {
  auditLogSchema.pre(
    middlewareName,
    function preventAuditMutation() {
      throw createAppendOnlyError();
    },
  );
});

const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
