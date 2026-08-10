import mongoose from "mongoose";

import ServicePackage from "../models/ServicePackage.js";

function normalizeServicePackageIds(
  servicePackageIds = [],
) {
  return [
    ...new Set(
      servicePackageIds
        .map((servicePackageId) =>
          String(
            servicePackageId ?? "",
          ).trim(),
        )
        .filter(Boolean),
    ),
  ].sort();
}

async function acquirePackageDesignParentGuards(
  servicePackageIds,
  session,
) {
  const normalizedServicePackageIds =
    normalizeServicePackageIds(
      servicePackageIds,
    );

  for (
    const servicePackageId of
      normalizedServicePackageIds
  ) {
    const result =
      await ServicePackage.updateOne(
        {
          _id: servicePackageId,
        },
        {
          $inc: {
            packageDesignGuardVersion: 1,
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
        missingServicePackageId:
          servicePackageId,
      };
    }
  }

  return {
    ok: true,
    servicePackageIds:
      normalizedServicePackageIds,
  };
}

async function runPackageDesignParentTransaction(
  callback,
) {
  return mongoose.connection.transaction(
    async (session) =>
      callback(session),
    {
      readPreference: "primary",
    },
  );
}

export {
  acquirePackageDesignParentGuards,
  runPackageDesignParentTransaction,
};
