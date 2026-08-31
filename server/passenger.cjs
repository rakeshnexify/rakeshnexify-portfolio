"use strict";

(async () => {
  await import("./src/server.js");
})().catch((error) => {
  console.error(
    "Passenger ESM bootstrap failed:",
    error?.stack || error,
  );

  process.exit(1);
});
