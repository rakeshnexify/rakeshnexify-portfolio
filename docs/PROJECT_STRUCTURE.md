# Project Structure

Last updated: 2026-08-07

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

Last recorded frontend source file count after Experience public integration:

`135`

Testimonials public integration has since added new frontend files; use the repository itself for the current exact count.

## Client Source Tree

```text
client/src/
├── assets/
├── components/
│   ├── admin/
│   │   ├── companies/
│   │   ├── education/
│   │   ├── experience/
│   │   ├── projects/
│   │   ├── services/
│   │   ├── site-settings/
│   │   ├── skills/
│   │   ├── statistics/
│   │   ├── team/
│   │   └── testimonials/
│   ├── companies/
│   ├── education/
│   ├── experience/
│   ├── layout/
│   ├── projects/
│   ├── sections/
│   │   └── contact/
│   ├── seo/
│   ├── services/
│   ├── skills/
│   ├── statistics/
│   ├── team/
│   ├── testimonials/
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
- `education`
- `experience`
- `projects`
- `services`
- `site-settings`
- `skills`
- `statistics`
- `team`
- `testimonials`

Important files include:

- `CompanyForm.jsx`
- `EducationForm.jsx`
- `ExperienceForm.jsx`
- `ProjectForm.jsx`
- `ServiceForm.jsx`
- `SkillForm.jsx`
- `StatisticForm.jsx`
- `TeamMemberForm.jsx`
- `TestimonialForm.jsx`
- `SiteSettingsForm.jsx`
- `SiteSettingsOverview.jsx`
- `LegalLinksEditor.jsx`
- `PlatformSettingsEditor.jsx`

## Public Feature Components

### Education

Path:

`client/src/components/education/`

Current component:

- `EducationTimelineCard.jsx`

Purpose:

Renders a public Education timeline record with:

- Institution logo or initials fallback
- Degree and field of study
- Education type
- Study dates
- Current-study and featured badges
- Grade and location
- Institution and certificate links
- Safe HTTP/HTTPS URL handling


### Experience

Path:

`client/src/components/experience/`

Current component:

- `ExperienceTimelineCard.jsx`

Purpose:

Renders a public Experience timeline record with:

- Organization logo or initials fallback
- Organization name and job title
- Employment and location labels
- Start and end dates
- Current and featured badges
- Descriptions
- Responsibilities and achievements
- Skills and tools
- Safe organization website link

### Skills

Path:

`client/src/components/skills/`

Current component:

- `SkillCard.jsx`

Purpose:

Renders a reusable public Skill card with:

- Skill name and short name
- Category
- Proficiency level
- Optional years of experience
- Icon or image
- Featured state

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

### Testimonials

Path:

`client/src/components/testimonials/`

Current component:

- `TestimonialCard.jsx`

Purpose:

Renders a reusable public Testimonial card with:

- Client name
- Client role
- Company name
- Review text
- Strict 1–5 rating display
- Profile image or initials fallback
- Featured state
- Safe company website link
- Optional populated related Project link
- Hidden or unavailable related Projects omitted safely

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

Team and Testimonials integration exists in:

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
- `SkillsSection.jsx`
- `ServicesSection.jsx`
- `ProjectsSection.jsx`
- `EducationSection.jsx`
- `ExperienceSection.jsx`
- `TeamSection.jsx`
- `CompaniesSection.jsx`
- `TestimonialsSection.jsx`
- `ContactSection.jsx`

`TeamSection.jsx` loads visible Team records, sorts featured members first, renders a homepage preview and links to the dedicated Team page.

`TestimonialsSection.jsx` loads public visible Testimonials, preserves the approved public ordering, renders up to three homepage preview cards and uses the dedicated Testimonials page CTA only when that page is enabled.

Default shared section placement is Companies → Testimonials → Contact. Final homepage and Navbar order remain Admin-controlled through Site Settings.

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

Skills, Education, Experience, Team, Companies and Testimonials are registered in the shared homepage, navigation and public-page visibility system. Testimonials is registered after Companies and before Contact by default.

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

No fake or default Testimonial data should be added.

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
- `useSkills.js`
- `useStatistics.js`
- `useEducation.js`
- `useExperience.js`
- `useTeamMembers.js`
- `useTeamMember.js`
- `useTestimonials.js`

Purpose:

Keeps API-loading and reusable state logic outside page components.

Team hooks:

### `useTeamMembers.js`

Loads the public visible Team member collection and exposes loading, error and refresh state.

### `useTeamMember.js`

Loads one public Team member by slug and exposes loading, error, HTTP status and refresh state.

Testimonials hook:

### `useTestimonials.js`

Loads the public visible Testimonial collection and exposes loading, error and refresh state. It supports the approved public filters and protects state from stale or aborted requests.

---

# Client Pages

## Public Pages

Path:

`client/src/pages/`

Current public pages:

- `HomePage.jsx`
- `StatisticsPage.jsx`
- `SkillsPage.jsx`
- `ServicesPage.jsx`
- `ProjectsPage.jsx`
- `EducationPage.jsx`
- `ExperiencePage.jsx`
- `ProjectDetailsPage.jsx`
- `TeamPage.jsx`
- `TeamMemberDetailsPage.jsx`
- `CompaniesPage.jsx`
- `CompanyDetailsPage.jsx`
- `TestimonialsPage.jsx`
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

Testimonials page:

### `TestimonialsPage.jsx`

Provides:

- Dedicated `/testimonials` listing
- Search filter
- Strict rating filter
- Loading, error, retry and empty states
- Reusable Testimonial cards
- Matching-result count for filtered states
- Average rating derived only from valid ratings
- Canonical `/testimonials` metadata
- `CollectionPage` structured data
- `ItemList` and `Review` JSON-LD only when appropriate
- No public Testimonial detail route

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
- `AdminSkillsPage.jsx`
- `AdminSkillEditorPage.jsx`
- `AdminProjectsPage.jsx`
- `AdminEducationPage.jsx`
- `AdminEducationEditorPage.jsx`
- `AdminExperiencePage.jsx`
- `AdminExperienceEditorPage.jsx`
- `AdminProjectEditorPage.jsx`
- `AdminTeamMembersPage.jsx`
- `AdminTeamMemberEditorPage.jsx`
- `AdminTestimonialsPage.jsx`
- `AdminTestimonialEditorPage.jsx`
- `AdminCompaniesPage.jsx`
- `AdminCompanyEditorPage.jsx`
- `AdminContactMessagesPage.jsx`

The Admin Team module follows the existing list-and-editor pattern.

The Admin Testimonials module follows the same protected list-and-editor pattern and supports search, rating, visibility, featured and related-Project filters.

---

# Client Routes

Path:

`client/src/routes/`

Current files:

### `AppRoutes.jsx`

Contains the main public and Admin route definitions.

Current public Skills, Education and Experience routes:

- `/skills`
- `/education`
- `/experience`

Current Admin Skills routes:

- `/admin/skills`
- `/admin/skills/new`
- `/admin/skills/:id/edit`

Current Admin Education routes:

- `/admin/education`
- `/admin/education/new`
- `/admin/education/:id/edit`

Current Admin Experience routes:

- `/admin/experience`
- `/admin/experience/new`
- `/admin/experience/:id/edit`

Current public Team routes:

- `/team`
- `/team/:slug`

Current Admin Team routes:

- `/admin/team`
- `/admin/team/new`
- `/admin/team/:id/edit`

The public Team routes are wrapped by `PublicPageVisibilityRoute` with the `team` section key.

Current public Testimonials route:

- `/testimonials`

Current Admin Testimonials routes:

- `/admin/testimonials`
- `/admin/testimonials/new`
- `/admin/testimonials/:id/edit`

The public Testimonials route is wrapped by `PublicPageVisibilityRoute` with the `testimonials` section key.

No `/testimonials/:slug` route exists in the MVP.

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
- `skillsApi.js`
- `projectsApi.js`
- `educationApi.js`
- `experienceApi.js`
- `teamApi.js`
- `testimonialsApi.js`
- `companiesApi.js`
- `contactMessageApi.js`

Current Admin API services:

- `adminAuthApi.js`
- `adminSiteSettingsApi.js`
- `adminServicesApi.js`
- `adminStatisticsApi.js`
- `adminSkillsApi.js`
- `adminProjectsApi.js`
- `adminEducationApi.js`
- `adminExperienceApi.js`
- `adminTeamMembersApi.js`
- `adminTestimonialsApi.js`
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

Testimonials API services:

### `testimonialsApi.js`

Consumes:

- `GET /api/testimonials`

Supports public `search`, strict `rating` and `featured` filters plus AbortSignal cancellation and structured errors.

### `adminTestimonialsApi.js`

Consumes protected Admin Testimonials CRUD endpoints and supports Admin search, rating, visibility, featured and related-Project filters.

---

# Client Utilities

Path:

`client/src/utils/`

Current files:

- `mergeSiteSettings.js`
- `siteSettingsForm.js`
- `serviceForm.js`
- `statisticForm.js`
- `skillForm.js`
- `projectForm.js`
- `educationForm.js`
- `experienceForm.js`
- `teamMemberForm.js`
- `testimonialForm.js`
- `companyForm.js`

Purpose:

Handles form conversion, validation helpers, normalization and reusable data transformations.

`teamMemberForm.js` contains Team form defaults, API-data conversion, slug generation and payload normalization.

`testimonialForm.js` contains Testimonial form defaults, API-data conversion, strict rating validation, URL validation, related-Project ObjectId validation, order validation, boolean handling and editable payload creation.

`siteSettingsForm.js` includes Team and Testimonials section content conversion and request-payload handling.

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

# Client Testimonials Integration Files

The completed public Testimonials module modifies these shared files:

```text
client/src/components/admin/site-settings/SiteSettingsForm.jsx
client/src/components/layout/Footer.jsx
client/src/components/layout/Navbar.jsx
client/src/components/layout/PublicPageHeader.jsx
client/src/config/homepageSections.js
client/src/pages/HomePage.jsx
client/src/routes/AppRoutes.jsx
client/src/utils/siteSettingsForm.js
```

Responsibilities:

- Register Testimonials as a homepage, navigation and dedicated-page module
- Render the homepage Testimonials section
- Add `/testimonials` links to public navigation surfaces
- Add `testimonialsSection` Site Settings fields
- Control Testimonials homepage, Navbar and public-page visibility independently
- Add and protect the public `/testimonials` route
- Hide the homepage CTA when it targets a disabled Testimonials page
- Support listing-page SEO and structured data

---

# Server Structure

Server application path:

`server/`

Backend source path:

`server/src/`

Last recorded backend source file count after Experience backend integration:

`72`

Testimonials backend integration has since added new server files; use the repository itself for the current exact count.

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
- Public Testimonials API mounting
- Protected Admin Testimonials API mounting
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

`homepageSections.js` registers Team, Companies and Testimonials in the shared registry. Testimonials is placed after Companies and before Contact by default.

---

# Server Controllers

Path:

`server/src/controllers/`

## Public Controllers

- `siteSettings.controller.js`
- `service.controller.js`
- `statistic.controller.js`
- `skill.controller.js`
- `project.controller.js`
- `education.controller.js`
- `experience.controller.js`
- `teamMember.controller.js`
- `testimonial.controller.js`
- `company.controller.js`
- `contactMessage.controller.js`
- `sitemap.controller.js`

## Admin Controllers

- `adminAuth.controller.js`
- `adminSiteSettings.controller.js`
- `adminService.controller.js`
- `adminStatistic.controller.js`
- `adminSkill.controller.js`
- `adminProject.controller.js`
- `adminEducation.controller.js`
- `adminExperience.controller.js`
- `adminTeamMember.controller.js`
- `adminTestimonial.controller.js`
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

Testimonials controller files:

- `testimonial.controller.js`
- `adminTestimonial.controller.js`

Testimonials-related shared controller file:

- `adminSiteSettings.controller.js`

Responsibilities:

- Return only public visible Testimonials
- Support approved public search, rating and featured filters
- Prevent hidden related Project data from leaking publicly
- Provide protected Admin CRUD and filters
- Save `testimonialsSection` Site Settings content

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

No Testimonials default-data file exists. Testimonials must be created dynamically through the protected Admin management interface. Fake or hard-coded Testimonial records should not be introduced.

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
- `Skill.js`
- `Education.js`
- `Experience.js`
- `Project.js`
- `Company.js`
- `TeamMember.js`
- `Testimonial.js`
- `ContactMessage.js`

`TeamMember.js` stores dynamic Team profiles, publication controls, SEO fields and cross-module relationships.

`Testimonial.js` stores dynamic client feedback, strict rating data, optional profile media, optional related Project relation, display order, featured/visibility controls, Admin audit references and timestamps.

`SiteSettings.js` stores Team and Testimonials section content plus the shared section publication settings.

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
- `skill.routes.js`
- `education.routes.js`
- `experience.routes.js`
- `project.routes.js`
- `teamMember.routes.js`
- `testimonial.routes.js`
- `company.routes.js`
- `contactMessage.routes.js`

## Admin Routes

- `adminAuth.routes.js`
- `adminSiteSettings.routes.js`
- `adminService.routes.js`
- `adminStatistic.routes.js`
- `adminSkill.routes.js`
- `adminEducation.routes.js`
- `adminExperience.routes.js`
- `adminProject.routes.js`
- `adminTeamMember.routes.js`
- `adminTestimonial.routes.js`
- `adminCompany.routes.js`
- `adminContactMessage.routes.js`

Team route files:

- `teamMember.routes.js`
- `adminTeamMember.routes.js`

Mounted API paths:

- `/api/team`
- `/api/admin/team`
- `/api/testimonials`
- `/api/admin/testimonials`

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

Testimonials sitemap responsibilities:

- Add `/testimonials` when the Testimonials public page is enabled
- Exclude `/testimonials` when its public page is disabled
- Do not generate Testimonial detail URLs

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

# Server Testimonials Integration Files

The completed Testimonials module uses these shared server files:

```text
server/src/app.js
server/src/config/homepageSections.js
server/src/controllers/adminSiteSettings.controller.js
server/src/models/SiteSettings.js
server/src/utils/createSitemapXml.js
```

Responsibilities:

- Mount public and protected Admin Testimonials APIs
- Register Testimonials in shared homepage-section configuration
- Store `testimonialsSection` content
- Save Testimonials section content through Admin Site Settings
- Add `/testimonials` to the sitemap only when the public page is enabled
- Preserve independent homepage, Navbar and public-page visibility
- Avoid creating Testimonial detail sitemap URLs

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

# Current Skills Module Structure

Status:

`COMPLETE, VALIDATED AND PUSHED`

Git checkpoints:

- `6aa985c Add dynamic skills backend APIs`
- `5311e2d Add dynamic skills admin interface`
- `1bb7e5f Add public Skills section and page`
- `92966df Fix Skills CTA visibility`

## Backend

```text
server/src/models/Skill.js
server/src/controllers/skill.controller.js
server/src/controllers/adminSkill.controller.js
server/src/routes/skill.routes.js
server/src/routes/adminSkill.routes.js
```

## Admin Frontend

```text
client/src/components/admin/skills/SkillForm.jsx
client/src/pages/admin/AdminSkillsPage.jsx
client/src/pages/admin/AdminSkillEditorPage.jsx
client/src/services/adminSkillsApi.js
client/src/utils/skillForm.js
```

## Public Frontend

```text
client/src/components/skills/SkillCard.jsx
client/src/components/sections/SkillsSection.jsx
client/src/hooks/useSkills.js
client/src/services/skillsApi.js
client/src/pages/SkillsPage.jsx
```

## Routes

```text
/skills
/admin/skills
/admin/skills/new
/admin/skills/:id/edit
```

No fake or automatically seeded Skill records should be added.

---

# Current Education Module Structure

Status:

`COMPLETE, VALIDATED AND PUSHED`

Git checkpoints:

- `8fd4cd6 Add dynamic education backend APIs`
- `2604555 Add dynamic Education admin interface`
- `6c0e2a1 Add public Education section and page`

## Backend

```text
server/src/models/Education.js
server/src/controllers/education.controller.js
server/src/controllers/adminEducation.controller.js
server/src/routes/education.routes.js
server/src/routes/adminEducation.routes.js
```

## Admin Frontend

```text
client/src/components/admin/education/EducationForm.jsx
client/src/pages/admin/AdminEducationPage.jsx
client/src/pages/admin/AdminEducationEditorPage.jsx
client/src/services/adminEducationApi.js
client/src/utils/educationForm.js
```

## Public Frontend

```text
client/src/components/education/EducationTimelineCard.jsx
client/src/components/sections/EducationSection.jsx
client/src/hooks/useEducation.js
client/src/services/educationApi.js
client/src/pages/EducationPage.jsx
```

## Routes

```text
/education
/admin/education
/admin/education/new
/admin/education/:id/edit
```

No fake or automatically seeded Education records should be added.

---


# Current Experience Module Structure

Status:

`COMPLETE, VALIDATED AND PUSHED`

Git checkpoints:

- `b117e22 Add dynamic Experience backend APIs`
- `5dbcb7a Add Experience frontend services and form utilities`
- `8e235fb Add dynamic Experience admin interface`
- `91263aa Add public Experience section and page`

## Backend

```text
server/src/models/Experience.js
server/src/controllers/experience.controller.js
server/src/controllers/adminExperience.controller.js
server/src/routes/experience.routes.js
server/src/routes/adminExperience.routes.js
```

## Frontend Services and Utility

```text
client/src/services/experienceApi.js
client/src/services/adminExperienceApi.js
client/src/hooks/useExperience.js
client/src/utils/experienceForm.js
```

## Admin Frontend

```text
client/src/components/admin/experience/ExperienceForm.jsx
client/src/pages/admin/AdminExperiencePage.jsx
client/src/pages/admin/AdminExperienceEditorPage.jsx
```

## Public Frontend

```text
client/src/components/experience/ExperienceTimelineCard.jsx
client/src/components/sections/ExperienceSection.jsx
client/src/pages/ExperiencePage.jsx
```

## Shared Client Integration

```text
client/src/components/admin/site-settings/SiteSettingsForm.jsx
client/src/components/layout/Footer.jsx
client/src/components/layout/Navbar.jsx
client/src/components/layout/PublicPageHeader.jsx
client/src/config/homepageSections.js
client/src/pages/HomePage.jsx
client/src/pages/admin/AdminDashboardPage.jsx
client/src/routes/AppRoutes.jsx
client/src/utils/siteSettingsForm.js
```

## Shared Server Integration

```text
server/src/app.js
server/src/config/homepageSections.js
server/src/controllers/adminSiteSettings.controller.js
server/src/models/SiteSettings.js
server/src/utils/createSitemapXml.js
```

## Routes

```text
GET    /api/experience
GET    /api/admin/experience
POST   /api/admin/experience
GET    /api/admin/experience/:id
PATCH  /api/admin/experience/:id
DELETE /api/admin/experience/:id

/experience
/admin/experience
/admin/experience/new
/admin/experience/:id/edit
```

No public Experience detail route exists in the MVP.

No fake or automatically seeded Experience records should be added.

Temporary validation records must be permanently deleted after testing.

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

# Current Testimonials Module Structure

Status:

`COMPLETE, VALIDATED AND PUSHED`

Git checkpoints:

- `d625157 Add dynamic Testimonials backend APIs`
- `c9d0dfe Fix Testimonials backend validation`
- `92f2dbd Complete strict Testimonials backend validation`
- `b340cee Add Testimonials frontend foundation`
- `5c825e1 Add dynamic Testimonials admin interface`
- `12a2e67 Add public Testimonials section and page`

## Backend

```text
server/src/models/Testimonial.js
server/src/controllers/testimonial.controller.js
server/src/controllers/adminTestimonial.controller.js
server/src/routes/testimonial.routes.js
server/src/routes/adminTestimonial.routes.js
server/src/app.js
```

## Frontend Services, Hook and Utility

```text
client/src/services/testimonialsApi.js
client/src/services/adminTestimonialsApi.js
client/src/hooks/useTestimonials.js
client/src/utils/testimonialForm.js
```

## Admin Frontend

```text
client/src/components/admin/testimonials/TestimonialForm.jsx
client/src/pages/admin/AdminTestimonialsPage.jsx
client/src/pages/admin/AdminTestimonialEditorPage.jsx
client/src/pages/admin/AdminDashboardPage.jsx
client/src/routes/AppRoutes.jsx
```

## Public Frontend

```text
client/src/components/testimonials/TestimonialCard.jsx
client/src/components/sections/TestimonialsSection.jsx
client/src/pages/TestimonialsPage.jsx
```

## Shared Client Integration

```text
client/src/components/admin/site-settings/SiteSettingsForm.jsx
client/src/components/layout/Footer.jsx
client/src/components/layout/Navbar.jsx
client/src/components/layout/PublicPageHeader.jsx
client/src/config/homepageSections.js
client/src/pages/HomePage.jsx
client/src/routes/AppRoutes.jsx
client/src/utils/siteSettingsForm.js
```

## Shared Server Integration

```text
server/src/config/homepageSections.js
server/src/controllers/adminSiteSettings.controller.js
server/src/models/SiteSettings.js
server/src/utils/createSitemapXml.js
```

## Public API

```text
GET /api/testimonials
```

Supported public filters:

- `search`
- `rating`
- `featured`

Public behavior:

- Returns visible Testimonials only
- Applies strict rating validation
- Sorts featured Testimonials first, then display order with stable fallback ordering
- Populates only public-safe related Project data
- Returns hidden related Projects as `null`
- Does not expose Admin audit fields

## Admin API

```text
GET    /api/admin/testimonials
POST   /api/admin/testimonials
GET    /api/admin/testimonials/:id
PATCH  /api/admin/testimonials/:id
DELETE /api/admin/testimonials/:id
```

Admin filters include:

- Search
- Rating
- Visibility
- Featured state
- Related Project

RBAC:

- Read: any active authenticated Admin
- Create/update: `super-admin`, `admin`, `editor`
- Delete: `super-admin`, `admin`

## Public Route

```text
/testimonials
```

The route is protected by `PublicPageVisibilityRoute` using section key `testimonials`.

No `/testimonials/:slug` route exists in the MVP.

## Admin Routes

```text
/admin/testimonials
/admin/testimonials/new
/admin/testimonials/:id/edit
```

## Site Settings

Testimonials uses:

```text
testimonialsSection.eyebrow
testimonialsSection.heading
testimonialsSection.description
testimonialsSection.ctaButton.label
testimonialsSection.ctaButton.url
```

Shared section controls remain independent:

- `isVisible` — homepage section
- `isNavigationVisible` — Navbar/PublicPageHeader
- `isPageVisible` — dedicated `/testimonials` page, Footer dedicated-page link and sitemap entry

When the Testimonials page is disabled, homepage content may remain visible, but a CTA targeting `/testimonials` is hidden.

## SEO and Sitemap

`TestimonialsPage.jsx` provides:

- Canonical `/testimonials`
- `CollectionPage` JSON-LD
- `ItemList` and `Review` JSON-LD for valid unfiltered records
- Strict rating handling so malformed ratings do not enter stars, averages or structured data

`createSitemapXml.js` includes `/testimonials` only while the dedicated public page is enabled.

No Testimonial detail URLs are generated.

## Data Rules

No fake or automatically seeded Testimonial records should be added.

Temporary validation records must be permanently deleted after testing.

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
