# Project Structure

Last updated: 2026-08-04

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

`105`

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
│   │   ├── statistics/
│   │   └── team/
│   ├── companies/
│   ├── layout/
│   ├── projects/
│   ├── sections/
│   │   └── contact/
│   ├── seo/
│   ├── services/
│   ├── statistics/
│   ├── team/
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
- `team`

Important files include:

- `CompanyForm.jsx`
- `ProjectForm.jsx`
- `ServiceForm.jsx`
- `StatisticForm.jsx`
- `TeamMemberForm.jsx`
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

### Team

Path:

`client/src/components/team/`

Current component:

- `TeamMemberCard.jsx`

Purpose:

Renders a reusable public Team member card with:

- Profile image or initials fallback
- Name and professional role
- Team position
- Short introduction
- Skills and tools
- Status and availability
- Featured state
- Social, website and portfolio links
- Public member-details route

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

These components provide shared page structure, navigation and responsive behavior.

Team integration exists in:

- `Navbar.jsx`
- `PublicPageHeader.jsx`
- `Footer.jsx`

## Homepage Sections

Path:

`client/src/components/sections/`

Current sections:

- `HeroSection.jsx`
- `AboutSection.jsx`
- `StatisticsSection.jsx`
- `ServicesSection.jsx`
- `ProjectsSection.jsx`
- `TeamSection.jsx`
- `CompaniesSection.jsx`
- `ContactSection.jsx`

`TeamSection.jsx` loads visible Team records, sorts featured members first, renders a homepage preview and links to the dedicated Team page.

Contact form component:

`client/src/components/sections/contact/ContactForm.jsx`

## SEO Component

Path:

`client/src/components/seo/PageSeo.jsx`

Purpose:

Handles dynamic public-page SEO metadata, including:

- Page title
- Description
- Keywords
- Canonical URL
- Robots directives
- Open Graph metadata
- Twitter metadata
- Social-sharing image
- JSON-LD structured data
- Structured-data cleanup during route changes

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

The Team section is registered after Projects and before Companies.

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

No fake or default Team member data should be added.

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
- `useTeamMembers.js`
- `useTeamMember.js`

Purpose:

Keeps API-loading and reusable state logic outside page components.

Team hooks:

### `useTeamMembers.js`

Loads the public visible Team member collection and exposes loading, error and refresh state.

### `useTeamMember.js`

Loads one public Team member by slug and exposes loading, error, HTTP status and refresh state.

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
- `TeamPage.jsx`
- `TeamMemberDetailsPage.jsx`
- `CompaniesPage.jsx`
- `CompanyDetailsPage.jsx`
- `NotFoundPage.jsx`

Team pages:

### `TeamPage.jsx`

Provides:

- Dedicated `/team` listing
- Loading, error and empty states
- Featured-first and display-order sorting
- Reusable Team member cards
- Canonical and social metadata
- `CollectionPage` and `ItemList` JSON-LD

### `TeamMemberDetailsPage.jsx`

Provides:

- Dedicated `/team/:slug` profile
- Member biography, skills and tools
- Contact, portfolio, website and social links
- Related Projects, Companies and Services
- Loading, error and not-found states
- Member-specific metadata
- `ProfilePage` and `Person` JSON-LD
- `noindex, nofollow` for unavailable profiles

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
- `AdminTeamMembersPage.jsx`
- `AdminTeamMemberEditorPage.jsx`
- `AdminCompaniesPage.jsx`
- `AdminCompanyEditorPage.jsx`
- `AdminContactMessagesPage.jsx`

The Admin Team module follows the existing list-and-editor pattern.

---

# Client Routes

Path:

`client/src/routes/`

Current files:

### `AppRoutes.jsx`

Contains the main public and Admin route definitions.

Current public Team routes:

- `/team`
- `/team/:slug`

Current Admin Team routes:

- `/admin/team`
- `/admin/team/new`
- `/admin/team/:id/edit`

The public Team routes are wrapped by `PublicPageVisibilityRoute` with the `team` section key.

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
- `teamApi.js`
- `companiesApi.js`
- `contactMessageApi.js`

Current Admin API services:

- `adminAuthApi.js`
- `adminSiteSettingsApi.js`
- `adminServicesApi.js`
- `adminStatisticsApi.js`
- `adminProjectsApi.js`
- `adminTeamMembersApi.js`
- `adminCompaniesApi.js`
- `adminContactMessagesApi.js`

Team API services:

### `teamApi.js`

Consumes:

- `GET /api/team`
- `GET /api/team/:slug`

Supports public list filters and public member-details loading.

### `adminTeamMembersApi.js`

Consumes protected Admin Team CRUD endpoints.

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
- `teamMemberForm.js`
- `companyForm.js`

Purpose:

Handles form conversion, validation helpers, normalization and reusable data transformations.

`teamMemberForm.js` contains Team form defaults, API-data conversion, slug generation and payload normalization.

`siteSettingsForm.js` includes Team section content conversion and request-payload handling.

---

# Client Team Integration Files

The completed public Team module also modifies these shared files:

```text
client/src/components/admin/site-settings/SiteSettingsForm.jsx
client/src/components/layout/Footer.jsx
client/src/components/layout/Navbar.jsx
client/src/components/layout/PublicPageHeader.jsx
client/src/components/seo/PageSeo.jsx
client/src/config/homepageSections.js
client/src/pages/HomePage.jsx
client/src/routes/AppRoutes.jsx
client/src/utils/siteSettingsForm.js
```

Responsibilities:

- Register Team as a homepage and navigation module
- Render the homepage Team section
- Add Team links to public navigation surfaces
- Add Team Site Settings fields
- Control Team homepage, Navbar and public-page visibility
- Add public Team routes
- Support Team SEO and JSON-LD

---

# Server Structure

Server application path:

`server/`

Backend source path:

`server/src/`

Current backend source file count:

`57`

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
- Public Team API mounting
- Protected Admin Team API mounting
- Sitemap mounting
- Production client delivery
- Public Team deep-route fallback documentation
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

`homepageSections.js` registers Team after Projects and before Companies.

---

# Server Controllers

Path:

`server/src/controllers/`

## Public Controllers

- `siteSettings.controller.js`
- `service.controller.js`
- `statistic.controller.js`
- `project.controller.js`
- `teamMember.controller.js`
- `company.controller.js`
- `contactMessage.controller.js`
- `sitemap.controller.js`

## Admin Controllers

- `adminAuth.controller.js`
- `adminSiteSettings.controller.js`
- `adminService.controller.js`
- `adminStatistic.controller.js`
- `adminProject.controller.js`
- `adminTeamMember.controller.js`
- `adminCompany.controller.js`
- `adminContactMessage.controller.js`

Controller responsibilities should remain separate from route mounting and database model definitions.

Team controller files:

- `teamMember.controller.js`
- `adminTeamMember.controller.js`

Team-related shared controller files:

- `adminSiteSettings.controller.js`
- `sitemap.controller.js`

Responsibilities:

- Save `teamSection` Site Settings content
- Load visible Team member slugs for sitemap generation
- Respect Team public-page publication settings

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

No Team default-data file exists.

Team members must be created dynamically through the protected Admin management interface. Fake or hard-coded Team records should not be introduced.

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
- `TeamMember.js`
- `ContactMessage.js`

`TeamMember.js` stores dynamic Team profiles, publication controls, SEO fields and cross-module relationships.

`SiteSettings.js` stores Team section content and the shared section publication settings.

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
- `teamMember.routes.js`
- `company.routes.js`
- `contactMessage.routes.js`

## Admin Routes

- `adminAuth.routes.js`
- `adminSiteSettings.routes.js`
- `adminService.routes.js`
- `adminStatistic.routes.js`
- `adminProject.routes.js`
- `adminTeamMember.routes.js`
- `adminCompany.routes.js`
- `adminContactMessage.routes.js`

Team route files:

- `teamMember.routes.js`
- `adminTeamMember.routes.js`

Mounted API paths:

- `/api/team`
- `/api/admin/team`

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

Team sitemap responsibilities:

- Add `/team` when the Team public page is enabled
- Add visible `/team/:slug` member URLs
- Exclude hidden Team members
- Remove all Team URLs when the Team public page is disabled

---

# Server Team Integration Files

The completed public Team integration modifies these shared server files:

```text
server/src/app.js
server/src/config/homepageSections.js
server/src/controllers/adminSiteSettings.controller.js
server/src/controllers/sitemap.controller.js
server/src/models/SiteSettings.js
server/src/utils/createSitemapXml.js
```

Responsibilities:

- Register Team in shared homepage-section configuration
- Store Team section content
- Save Team section content through Admin Site Settings
- Add Team listing and detail URLs to the sitemap
- Respect Team visibility and public-page settings
- Document production deep-route support

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

# Current Team Module Structure

Status:

`COMPLETE, VALIDATED AND PUSHED`

Git checkpoint:

`7ca4f6c Add public team website integration`

## Completed Backend

```text
server/src/models/TeamMember.js
server/src/controllers/teamMember.controller.js
server/src/controllers/adminTeamMember.controller.js
server/src/routes/teamMember.routes.js
server/src/routes/adminTeamMember.routes.js
```

Primary integration file:

```text
server/src/app.js
```

## Completed Admin Frontend

```text
client/src/components/admin/team/TeamMemberForm.jsx
client/src/pages/admin/AdminTeamMembersPage.jsx
client/src/pages/admin/AdminTeamMemberEditorPage.jsx
client/src/services/adminTeamMembersApi.js
client/src/utils/teamMemberForm.js
```

Admin integration files:

```text
client/src/pages/admin/AdminDashboardPage.jsx
client/src/routes/AppRoutes.jsx
```

## Completed Public Frontend

```text
client/src/components/team/TeamMemberCard.jsx
client/src/components/sections/TeamSection.jsx
client/src/hooks/useTeamMembers.js
client/src/hooks/useTeamMember.js
client/src/services/teamApi.js
client/src/pages/TeamPage.jsx
client/src/pages/TeamMemberDetailsPage.jsx
```

## Completed Client Integration

```text
client/src/components/admin/site-settings/SiteSettingsForm.jsx
client/src/components/layout/Footer.jsx
client/src/components/layout/Navbar.jsx
client/src/components/layout/PublicPageHeader.jsx
client/src/components/seo/PageSeo.jsx
client/src/config/homepageSections.js
client/src/pages/HomePage.jsx
client/src/routes/AppRoutes.jsx
client/src/utils/siteSettingsForm.js
```

## Completed Server Integration

```text
server/src/app.js
server/src/config/homepageSections.js
server/src/controllers/adminSiteSettings.controller.js
server/src/controllers/sitemap.controller.js
server/src/models/SiteSettings.js
server/src/utils/createSitemapXml.js
```

## Public Routes

```text
/team
/team/:slug
```

## Admin Routes

```text
/admin/team
/admin/team/new
/admin/team/:id/edit
```

## API Routes

```text
GET    /api/team
GET    /api/team/:slug
GET    /api/admin/team
POST   /api/admin/team
GET    /api/admin/team/:id
PATCH  /api/admin/team/:id
DELETE /api/admin/team/:id
```

## Current Valid Team Data

```text
Name: Rakesh Pandit
Slug: rakesh-pandit
Public visibility: enabled
```

No fake or default Team member records should be added.

Temporary test records must be permanently deleted after validation.

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
