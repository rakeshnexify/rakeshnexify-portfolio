import path from "node:path";
import { fileURLToPath } from "node:url";

import cors from "cors";
import express from "express";
import helmet from "helmet";

import corsOptions from "./config/cors.js";
import helmetOptions from "./config/helmet.js";

import adminAuthRoutes from "./routes/adminAuth.routes.js";
import adminCertificationAchievementRoutes from "./routes/adminCertificationAchievement.routes.js";
import adminCompanyRoutes from "./routes/adminCompany.routes.js";
import adminContactMessageRoutes from "./routes/adminContactMessage.routes.js";
import adminEducationRoutes from "./routes/adminEducation.routes.js";
import adminExperienceRoutes from "./routes/adminExperience.routes.js";
import adminLeadRoutes from "./routes/adminLead.routes.js";
import adminMediaRoutes from "./routes/adminMedia.routes.js";
import adminPostRoutes from "./routes/adminPost.routes.js";
import adminProjectRoutes from "./routes/adminProject.routes.js";
import adminServiceRoutes from "./routes/adminService.routes.js";
import adminSiteSettingsRoutes from "./routes/adminSiteSettings.routes.js";
import adminSkillRoutes from "./routes/adminSkill.routes.js";
import adminStatisticRoutes from "./routes/adminStatistic.routes.js";
import adminTestimonialRoutes from "./routes/adminTestimonial.routes.js";
import adminTeamMemberRoutes from "./routes/adminTeamMember.routes.js";

import certificationAchievementRoutes from "./routes/certificationAchievement.routes.js";
import companyRoutes from "./routes/company.routes.js";
import contactMessageRoutes from "./routes/contactMessage.routes.js";
import educationRoutes from "./routes/education.routes.js";
import experienceRoutes from "./routes/experience.routes.js";
import healthRoutes from "./routes/health.routes.js";
import postRoutes from "./routes/post.routes.js";
import projectRoutes from "./routes/project.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import siteSettingsRoutes from "./routes/siteSettings.routes.js";
import skillRoutes from "./routes/skill.routes.js";
import sitemapRoutes from "./routes/sitemap.routes.js";
import statisticRoutes from "./routes/statistic.routes.js";
import testimonialRoutes from "./routes/testimonial.routes.js";
import teamMemberRoutes from "./routes/teamMember.routes.js";

const app = express();

const isProduction = process.env.NODE_ENV === "production";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);

const clientDistPath = path.resolve(
  currentDirectoryPath,
  "../../client/dist",
);

app.use(helmet(helmetOptions));
app.use(cors(corsOptions));

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
      message:
        "Welcome to the RakeshNexify Portfolio API.",
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
app.use("/api/statistics", statisticRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/experience", experienceRoutes);
app.use("/api/achievements", certificationAchievementRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/team", teamMemberRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/companies", companyRoutes);

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/services", adminServiceRoutes);
app.use("/api/admin/statistics", adminStatisticRoutes);
app.use("/api/admin/skills", adminSkillRoutes);
app.use("/api/admin/education", adminEducationRoutes);
app.use("/api/admin/experience", adminExperienceRoutes);
app.use(
  "/api/admin/achievements",
  adminCertificationAchievementRoutes,
);
app.use("/api/admin/leads", adminLeadRoutes);
app.use("/api/admin/testimonials", adminTestimonialRoutes);
app.use("/api/admin/posts", adminPostRoutes);
app.use("/api/admin/team", adminTeamMemberRoutes);
app.use("/api/admin/projects", adminProjectRoutes);
app.use("/api/admin/companies", adminCompanyRoutes);
app.use("/api/admin/media", adminMediaRoutes);
app.use(
  "/api/admin/contact-messages",
  adminContactMessageRoutes,
);
app.use(
  "/api/admin/site-settings",
  adminSiteSettingsRoutes,
);

app.use(
  "/api/contact-messages",
  contactMessageRoutes,
);

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
          res.setHeader(
            "Cache-Control",
            "no-cache",
          );
        }
      },
    }),
  );

  /*
   * React Router deep routes:
   * /services
   * /statistics
   * /skills
   * /education
   * /experience
   * /projects
   * /projects/:slug
   * /blog
   * /blog/:slug
   * /news
   * /news/:slug
   * /team
   * /team/:slug
   * /companies
   * /companies/:slug
   * /admin/*
   *
   * Express 5 ke liye /{*splat}
   * wildcard syntax use kiya gaya hai.
   */
  app.get(
    "/{*splat}",
    (req, res, next) => {
      const isApiRequest =
        req.path === "/api" ||
        req.path.startsWith("/api/");

      if (isApiRequest) {
        next();
        return;
      }

      res.sendFile(
        path.join(
          clientDistPath,
          "index.html",
        ),
        (error) => {
          if (error) {
            next(error);
          }
        },
      );
    },
  );
}

app.use((req, res) => {
  res.status(404).json({
    success: false,

    message:
      `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(
  (error, req, res, next) => {
    const isMalformedJson =
      error instanceof SyntaxError &&
      error?.type ===
        "entity.parse.failed" &&
      error?.status === 400;

    if (isMalformedJson) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            "Request body contains invalid JSON.",
        });
    }

    console.error(
      "Unhandled server error:",
      error.message,
    );

    const receivedStatusCode =
      Number(
        error.statusCode ||
          error.status,
      );

    const statusCode =
      Number.isInteger(
        receivedStatusCode,
      ) &&
      receivedStatusCode >= 400 &&
      receivedStatusCode <= 599
        ? receivedStatusCode
        : 500;

    return res
      .status(statusCode)
      .json({
        success: false,

        message:
          statusCode < 500
            ? error.message
            : "An unexpected server error occurred.",
      });
  },
);

export default app;
