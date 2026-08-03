# Project Structure

Last updated: 2026-08-03

## Project

RakeshNexify MERN Portfolio and Admin CMS.

Local repository path:

`D:\rakeshnexify-portfolio`

## Root Structure

```text
rakeshnexify-portfolio/
├── client/
├── docs/
├── server/
├── .gitattributes
├── .gitignore
├── AGENTS.md
├── package-lock.json
├── package.json
└── README.md
```

## Root Files

### `AGENTS.md`

Permanent AI development instructions.

Every new ChatGPT or Codex session should read this file before editing the project.

### `package.json`

Contains root-level scripts for:

- Development
- Client build
- Full project validation
- Production server
- Dependency installation

### `package-lock.json`

Locks root npm dependency versions.

### `README.md`

General project documentation and setup information.

### `.gitignore`

Prevents private, generated and dependency files from being committed.

### `.gitattributes`

Controls Git file handling and line-ending behavior.

---

# Client Structure

Client application path:

`client/`

Frontend source path:

`client/src/`

Current frontend source file count:

`93`

## Client Source Tree

```text
client/src/
├── assets/
├── components/
│   ├── admin/
│   │   ├── companies/
│   │   ├── projects/
│   │   ├── services/
│   │   ├── site-settings/
│   │   └── statistics/
│   ├── companies/
│   ├── layout/
│   ├── projects/
│   ├── sections/
│   │   └── contact/
│   ├── seo/
│   ├── services/
│   ├── statistics/
│   └── ui/
├── config/
├── context/
├── data/
├── hooks/
├── pages/
│   └── admin/
├── routes/
├── services/
├── utils/
├── App.jsx
├── index.css
└── main.jsx
```

## Client Root Files

### `client/src/main.jsx`

Frontend entry point.

It mounts the React application and global providers.

### `client/src/App.jsx`

Top-level application component.

This file should remain minimal.

Routing and feature logic should stay in dedicated files.

### `client/src/index.css`

Global CSS and Tailwind-related styles.

---

# Client Components

## Admin Components

Path:

`client/src/components/admin/`

Purpose:

Contains reusable Admin forms and editors.

Current feature folders:

- `companies`
- `projects`
- `services`
- `site-settings`
- `statistics`

Important files include:

- `CompanyForm.jsx`
- `ProjectForm.jsx`
- `ServiceForm.jsx`
- `StatisticForm.jsx`
- `SiteSettingsForm.jsx`
- `SiteSettingsOverview.jsx`
- `LegalLinksEditor.jsx`
- `PlatformSettingsEditor.jsx`

## Public Feature Components

### Companies

Path:

`client/src/components/companies/`

Current component:

- `CompanyCard.jsx`

### Projects

Path:

`client/src/components/projects/`

Current component:

- `ProjectCard.jsx`

### Services

Path:

`client/src/components/services/`

Current component:

- `ServiceCard.jsx`

### Statistics

Path:

`client/src/components/statistics/`

Current component:

- `StatisticCard.jsx`

## Layout Components

Path:

`client/src/components/layout/`

Current files:

- `Container.jsx`
- `Footer.jsx`
- `Navbar.jsx`
- `PublicPageHeader.jsx`
- `ResponsiveCardRow.jsx`
- `Section.jsx`
- `SectionHeading.jsx`

These components provide shared page structure and responsive behavior.

## Homepage Sections

Path:

`client/src/components/sections/`

Current sections:

- `HeroSection.jsx`
- `AboutSection.jsx`
- `StatisticsSection.jsx`
- `ServicesSection.jsx`
- `ProjectsSection.jsx`
- `CompaniesSection.jsx`
- `ContactSection.jsx`

Contact form component:

`client/src/components/sections/contact/ContactForm.jsx`

## SEO Component

Path:

`client/src/components/seo/PageSeo.jsx`

Purpose:

Handles dynamic public-page SEO metadata.

## Shared UI Components

Path:

`client/src/components/ui/`

Current files:

- `Button.jsx`
- `Logo.jsx`

---

# Client Configuration

Path:

`client/src/config/`

Current files:

### `apiConfig.js`

Stores frontend API configuration behavior.

### `homepageSections.js`

Defines and merges supported homepage-section settings.

### `siteSettingsPages.js`

Defines modular Admin Site Settings categories and routes.

---

# Client Context

Path:

`client/src/context/`

Current files:

- `adminAuthContext.js`
- `AdminAuthProvider.jsx`
- `siteSettingsContext.js`
- `SiteSettingsProvider.jsx`

Purpose:

Provides shared Admin authentication and Site Settings state.

---

# Client Data

Path:

`client/src/data/`

Current file:

`siteData.js`

This folder should contain frontend fallback or static support data only where required.

Database-managed content should not be duplicated here unnecessarily.

---

# Client Hooks

Path:

`client/src/hooks/`

Current hooks:

- `useAdminAuth.js`
- `useCompanies.js`
- `useCompany.js`
- `useProject.js`
- `useProjects.js`
- `useServices.js`
- `useSiteSettings.js`
- `useStatistics.js`

Purpose:

Keeps API-loading and reusable state logic outside page components.

Future Team hooks should follow this pattern:

- `useTeamMembers.js`
- `useTeamMember.js`

---

# Client Pages

## Public Pages

Path:

`client/src/pages/`

Current public pages:

- `HomePage.jsx`
- `StatisticsPage.jsx`
- `ServicesPage.jsx`
- `ProjectsPage.jsx`
- `ProjectDetailsPage.jsx`
- `CompaniesPage.jsx`
- `CompanyDetailsPage.jsx`
- `NotFoundPage.jsx`

## Admin Pages

Path:

`client/src/pages/admin/`

Current Admin pages:

- `AdminLoginPage.jsx`
- `AdminDashboardPage.jsx`
- `AdminSiteSettingsPage.jsx`
- `AdminSiteSettingsEditorPage.jsx`
- `AdminServicesPage.jsx`
- `AdminServiceEditorPage.jsx`
- `AdminStatisticsPage.jsx`
- `AdminStatisticEditorPage.jsx`
- `AdminProjectsPage.jsx`
- `AdminProjectEditorPage.jsx`
- `AdminCompaniesPage.jsx`
- `AdminCompanyEditorPage.jsx`
- `AdminContactMessagesPage.jsx`

Future Team pages should follow the existing list-and-editor pattern.

---

# Client Routes

Path:

`client/src/routes/`

Current files:

### `AppRoutes.jsx`

Contains the main route definitions.

### `ProtectedAdminRoute.jsx`

Protects authenticated Admin pages.

### `PublicPageVisibilityRoute.jsx`

Prevents access to dedicated public pages disabled through Site Settings.

### `PublicSiteRoute.jsx`

Handles public-site publication behavior.

---

# Client API Services

Path:

`client/src/services/`

Current public API services:

- `siteSettingsApi.js`
- `servicesApi.js`
- `statisticsApi.js`
- `projectsApi.js`
- `companiesApi.js`
- `contactMessageApi.js`

Current Admin API services:

- `adminAuthApi.js`
- `adminSiteSettingsApi.js`
- `adminServicesApi.js`
- `adminStatisticsApi.js`
- `adminProjectsApi.js`
- `adminCompaniesApi.js`
- `adminContactMessagesApi.js`

Future Team services should follow this structure:

- `teamApi.js`
- `adminTeamApi.js`

---

# Client Utilities

Path:

`client/src/utils/`

Current files:

- `mergeSiteSettings.js`
- `siteSettingsForm.js`
- `serviceForm.js`
- `statisticForm.js`
- `projectForm.js`
- `companyForm.js`

Purpose:

Handles form conversion, validation helpers, normalization and reusable data transformations.

Future Team form utilities should be added in a dedicated file such as:

`teamForm.js`

---

# Server Structure

Server application path:

`server/`

Backend source path:

`server/src/`

Current backend source file count:

`52`

## Server Source Tree

```text
server/src/
├── config/
├── controllers/
├── data/
├── middleware/
├── models/
├── routes/
├── scripts/
├── utils/
├── app.js
└── server.js
```

## Server Entry Files

### `server/src/app.js`

Creates and configures the Express application.

Responsibilities include:

- Security middleware
- CORS
- JSON parsing
- Rate limiting
- Route mounting
- Sitemap mounting
- Production client delivery
- Not Found handling
- Error handling

### `server/src/server.js`

Starts the HTTP server and database connection.

It also handles graceful shutdown behavior.

---

# Server Configuration

Path:

`server/src/config/`

Current files:

- `cors.js`
- `database.js`
- `environment.js`
- `helmet.js`
- `homepageSections.js`

Responsibilities:

- MongoDB connection
- Environment validation
- CORS origins
- Helmet policies
- Shared homepage-section definitions

---

# Server Controllers

Path:

`server/src/controllers/`

## Public Controllers

- `siteSettings.controller.js`
- `service.controller.js`
- `statistic.controller.js`
- `project.controller.js`
- `company.controller.js`
- `contactMessage.controller.js`
- `sitemap.controller.js`

## Admin Controllers

- `adminAuth.controller.js`
- `adminSiteSettings.controller.js`
- `adminService.controller.js`
- `adminStatistic.controller.js`
- `adminProject.controller.js`
- `adminCompany.controller.js`
- `adminContactMessage.controller.js`

Controller responsibilities should remain separate from route mounting and database model definitions.

Future Team controllers should be:

- `team.controller.js`
- `adminTeam.controller.js`

---

# Server Default Data

Path:

`server/src/data/`

Current files:

- `defaultServices.js`
- `defaultStatistics.js`
- `defaultProjects.js`
- `defaultCompanies.js`

Purpose:

Provides safe default database records or fallback initialization data.

Future Team defaults should only be added when genuinely required.

---

# Server Middleware

Path:

`server/src/middleware/`

Current files:

### `adminAuth.middleware.js`

Handles:

- Bearer token reading
- JWT verification
- Active Admin validation
- Password-change token invalidation
- Role authorization

### `contactMessageRateLimiter.js`

Protects the public contact form against excessive requests.

---

# Server Models

Path:

`server/src/models/`

Current models:

- `AdminUser.js`
- `SiteSettings.js`
- `Service.js`
- `Statistic.js`
- `Project.js`
- `Company.js`
- `ContactMessage.js`

Future Team model:

`TeamMember.js`

All new models should document:

- Collection name
- Fields
- Validation
- Enums
- Indexes
- Relations
- Timestamps

---

# Server Routes

Path:

`server/src/routes/`

## Public and System Routes

- `health.routes.js`
- `sitemap.routes.js`
- `siteSettings.routes.js`
- `service.routes.js`
- `statistic.routes.js`
- `project.routes.js`
- `company.routes.js`
- `contactMessage.routes.js`

## Admin Routes

- `adminAuth.routes.js`
- `adminSiteSettings.routes.js`
- `adminService.routes.js`
- `adminStatistic.routes.js`
- `adminProject.routes.js`
- `adminCompany.routes.js`
- `adminContactMessage.routes.js`

Future Team routes should be:

- `team.routes.js`
- `adminTeam.routes.js`

---

# Server Scripts

Path:

`server/src/scripts/`

Current file:

`createSuperAdmin.js`

Purpose:

Creates the initial Super Admin account through a controlled script.

Credentials must never be stored in source code or documentation.

---

# Server Utilities

Path:

`server/src/utils/`

Current files:

### `adminToken.js`

Handles Admin access-token creation and verification.

### `createSitemapXml.js`

Builds dynamic XML sitemap output.

---

# Documentation Structure

Path:

`docs/`

Current files:

- `API_ROUTES.md`
- `BUGS.md`
- `CURRENT_STATUS.md`
- `DATABASE_SCHEMA.md`
- `DECISIONS.md`
- `PROJECT_OVERVIEW.md`
- `PROJECT_STRUCTURE.md`
- `ROADMAP.md`
- `SESSION_HANDOFF.md`

All required repository-memory documentation files now exist.

The documentation folder is the permanent continuation memory for future ChatGPT and Codex sessions.
---

# Feature File Pattern

A full dynamic module should generally use this structure.

## Backend

```text
server/src/models/Feature.js
server/src/controllers/feature.controller.js
server/src/controllers/adminFeature.controller.js
server/src/routes/feature.routes.js
server/src/routes/adminFeature.routes.js
server/src/data/defaultFeatures.js
```

Default-data files are optional.

## Frontend

```text
client/src/components/feature/
client/src/components/admin/feature/
client/src/components/sections/FeatureSection.jsx
client/src/hooks/useFeatures.js
client/src/hooks/useFeature.js
client/src/services/featuresApi.js
client/src/services/adminFeaturesApi.js
client/src/utils/featureForm.js
client/src/pages/FeaturesPage.jsx
client/src/pages/FeatureDetailsPage.jsx
client/src/pages/admin/AdminFeaturesPage.jsx
client/src/pages/admin/AdminFeatureEditorPage.jsx
```

Only create files required by the specific feature.

Do not create empty files merely to match this example.

---

# Code Organization Rules

1. Keep `App.jsx` minimal.
2. Keep `app.js` focused on Express application setup.
3. Keep `server.js` focused on server startup and shutdown.
4. Use small dedicated components.
5. Keep API logic in service files.
6. Keep reusable data loading in hooks.
7. Keep form transformation in utility files.
8. Keep database behavior in models and controllers.
9. Keep HTTP route definitions in route files.
10. Do not duplicate completed module logic.
11. Follow existing naming conventions.
12. Inspect existing modules before creating a new architecture.

## Structure Documentation Rule

Whenever an important folder or file is added, removed or moved:

1. Update this file.
2. Update `docs/SESSION_HANDOFF.md`.
3. Update related API or database documentation.
4. Confirm all imports still work.
5. Run the appropriate build or syntax validation.
