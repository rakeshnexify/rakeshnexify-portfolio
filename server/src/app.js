import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express from "express";
import helmet from "helmet";

import adminAuthRoutes from "./routes/adminAuth.routes.js";
import adminCompanyRoutes from "./routes/adminCompany.routes.js";
import adminContactMessageRoutes from "./routes/adminContactMessage.routes.js";
import adminProjectRoutes from "./routes/adminProject.routes.js";
import adminServiceRoutes from "./routes/adminService.routes.js";
import adminSiteSettingsRoutes from "./routes/adminSiteSettings.routes.js";
import companyRoutes from "./routes/company.routes.js";
import contactMessageRoutes from "./routes/contactMessage.routes.js";
import healthRoutes from "./routes/health.routes.js";
import projectRoutes from "./routes/project.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import sitemapRoutes from "./routes/sitemap.routes.js";
import siteSettingsRoutes from "./routes/siteSettings.routes.js";

const app = express();

const isProduction = process.env.NODE_ENV === "production";

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const currentFilePath = fileURLToPath(import.meta.url);

const currentDirectoryPath = path.dirname(currentFilePath);

const clientDistPath = path.resolve(currentDirectoryPath, "../../client/dist");

app.use(helmet());

app.use(
  cors({
    origin: clientUrl,

    methods: ["GET", "POST", "PATCH", "DELETE"],

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(
  express.json({
    limit: "20kb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20kb",
  }),
);

/*
 * Development me backend root par
 * API welcome response dikhayenge.
 *
 * Production me root URL React
 * application serve karega.
 */
if (!isProduction) {
  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,

      message: "Welcome to the RakeshNexify Portfolio API.",
    });
  });
}

/*
 * Dynamic sitemap ko static frontend
 * files se pehle mount karna zaruri hai.
 */
app.use("/", sitemapRoutes);

app.use("/api/health", healthRoutes);

app.use("/api/site-settings", siteSettingsRoutes);

app.use("/api/services", serviceRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/companies", companyRoutes);

app.use("/api/admin/auth", adminAuthRoutes);

app.use("/api/admin/services", adminServiceRoutes);

app.use("/api/admin/projects", adminProjectRoutes);

app.use("/api/admin/companies", adminCompanyRoutes);

app.use("/api/admin/contact-messages", adminContactMessageRoutes);

app.use("/api/admin/site-settings", adminSiteSettingsRoutes);

app.use("/api/contact-messages", contactMessageRoutes);

/*
 * Production me Vite ke generated
 * React files Express serve karega.
 */
if (isProduction) {
  app.use(
    express.static(clientDistPath, {
      index: false,

      maxAge: "1d",

      setHeaders(res, filePath) {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  /*
   * React Router deep routes:
   * /projects
   * /projects/:slug
   * /companies
   * /companies/:slug
   * /admin/*
   *
   * Express 5 ke liye /{*splat}
   * wildcard syntax use kiya gaya hai.
   */
  app.get("/{*splat}", (req, res, next) => {
    const isApiRequest = req.path === "/api" || req.path.startsWith("/api/");

    if (isApiRequest) {
      next();
      return;
    }

    res.sendFile(path.join(clientDistPath, "index.html"), (error) => {
      if (error) {
        next(error);
      }
    });
  });
}

app.use((req, res) => {
  res.status(404).json({
    success: false,

    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error.message);

  res.status(error.statusCode || 500).json({
    success: false,

    message:
      error.statusCode && error.statusCode < 500
        ? error.message
        : "An unexpected server error occurred.",
  });
});

export default app;
