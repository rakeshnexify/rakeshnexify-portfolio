import cors from "cors";
import express from "express";

import adminAuthRoutes from "./routes/adminAuth.routes.js";
import adminBrandRoutes from "./routes/adminBrand.routes.js";
import adminCompanyRoutes from "./routes/adminCompany.routes.js";
import adminContactMessageRoutes from "./routes/adminContactMessage.routes.js";
import adminProjectRoutes from "./routes/adminProject.routes.js";
import adminServiceRoutes from "./routes/adminService.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import companyRoutes from "./routes/company.routes.js";
import contactMessageRoutes from "./routes/contactMessage.routes.js";
import healthRoutes from "./routes/health.routes.js";
import projectRoutes from "./routes/project.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import siteSettingsRoutes from "./routes/siteSettings.routes.js";

const app = express();

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: clientUrl,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the RakeshNexify Portfolio API.",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/site-settings", siteSettingsRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/services", adminServiceRoutes);
app.use("/api/admin/projects", adminProjectRoutes);
app.use("/api/admin/companies", adminCompanyRoutes);
app.use("/api/admin/brands", adminBrandRoutes);
app.use("/api/admin/contact-messages", adminContactMessageRoutes);
app.use("/api/contact-messages", contactMessageRoutes);

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
