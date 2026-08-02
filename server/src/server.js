import "dotenv/config";

import app from "./app.js";
import connectDatabase, { disconnectDatabase } from "./config/database.js";
import validateServerEnvironment from "./config/environment.js";

const SHUTDOWN_TIMEOUT_MS = 10000;

let httpServer = null;
let isShuttingDown = false;

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  return String(error || "Unknown error");
}

function closeHttpServer() {
  return new Promise((resolve, reject) => {
    if (!httpServer) {
      resolve();
      return;
    }

    httpServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      console.log("HTTP server closed successfully.");

      resolve();
    });
  });
}

async function shutdownServer({ reason, exitCode = 0 }) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`Server shutdown started: ${reason}`);

  const forceShutdownTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out. Forcing server shutdown.");

    httpServer?.closeAllConnections?.();

    process.exit(exitCode || 1);
  }, SHUTDOWN_TIMEOUT_MS);

  forceShutdownTimer.unref();

  try {
    await closeHttpServer();

    await disconnectDatabase();

    clearTimeout(forceShutdownTimer);

    console.log("Server shutdown completed successfully.");

    process.exit(exitCode);
  } catch (error) {
    clearTimeout(forceShutdownTimer);

    console.error(`Server shutdown failed: ${getErrorMessage(error)}`);

    httpServer?.closeAllConnections?.();

    process.exit(1);
  }
}

async function startServer() {
  try {
    const { port } = validateServerEnvironment();

    await connectDatabase();

    httpServer = app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });

    httpServer.on("error", (error) => {
      console.error(`HTTP server error: ${getErrorMessage(error)}`);

      void shutdownServer({
        reason: "HTTP server error",
        exitCode: 1,
      });
    });
  } catch (error) {
    console.error(`Server startup failed: ${getErrorMessage(error)}`);

    try {
      await disconnectDatabase();
    } catch (disconnectError) {
      console.error(
        `Database cleanup failed: ${getErrorMessage(disconnectError)}`,
      );
    }

    process.exit(1);
  }
}

process.on("SIGTERM", () => {
  void shutdownServer({
    reason: "SIGTERM received",
    exitCode: 0,
  });
});

process.on("SIGINT", () => {
  void shutdownServer({
    reason: "SIGINT received",
    exitCode: 0,
  });
});

process.on("unhandledRejection", (reason) => {
  console.error(`Unhandled promise rejection: ${getErrorMessage(reason)}`);

  void shutdownServer({
    reason: "Unhandled promise rejection",
    exitCode: 1,
  });
});

process.on("uncaughtException", (error) => {
  console.error(`Uncaught exception: ${getErrorMessage(error)}`);

  void shutdownServer({
    reason: "Uncaught exception",
    exitCode: 1,
  });
});

void startServer();
