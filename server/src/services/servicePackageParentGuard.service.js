import mongoose from "mongoose";

import Service from "../models/Service.js";

function normalizeServiceIds(serviceIds = []) {
  return [...new Set(
    serviceIds
      .map((serviceId) => String(serviceId ?? "").trim())
      .filter(Boolean),
  )].sort();
}

async function acquireServicePackageParentGuards(serviceIds, session) {
  const normalizedServiceIds = normalizeServiceIds(serviceIds);

  for (const serviceId of normalizedServiceIds) {
    const result = await Service.updateOne(
      {
        _id: serviceId,
      },
      {
        $inc: {
          servicePackageGuardVersion: 1,
        },
      },
      {
        session,
        timestamps: false,
      },
    );

    if (result.matchedCount !== 1) {
      return {
        ok: false,
        missingServiceId: serviceId,
      };
    }
  }

  return {
    ok: true,
    serviceIds: normalizedServiceIds,
  };
}

async function runServicePackageParentTransaction(callback) {
  return mongoose.connection.transaction(
    async (session) => callback(session),
    {
      readPreference: "primary",
    },
  );
}

export {
  acquireServicePackageParentGuards,
  runServicePackageParentTransaction,
};
