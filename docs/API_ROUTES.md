# API Routes

Last updated: 2026-08-07

## Project

RakeshNexify MERN Portfolio and Admin CMS.

## Base Development URL

Backend development server:

`http://localhost:5000`

All `/api/...` paths in this document are relative to the backend server URL.

Example:

`GET http://localhost:5000/api/health`

## Route Mounting

Main route mounting file:

`server/src/app.js`

Route files:

`server/src/routes/`

## Authentication

Protected Admin endpoints require an access token in the HTTP Authorization header:

`Authorization: Bearer <admin-access-token>`

The token must:

- Be present
- Use the Bearer authentication scheme
- Be a valid Admin access token
- Contain token type `admin-access`
- Contain a valid Admin MongoDB ObjectId
- Belong to an active Admin account
- Not be expired
- Not have been issued before the Admin password was changed

Authentication middleware:

`server/src/middleware/adminAuth.middleware.js`

## Admin Roles

Current roles:

- `super-admin`
- `admin`
- `editor`

General permissions:

- Authenticated Admin users can read Admin resources.
- `super-admin`, `admin` and `editor` can create and update supported resources.
- Only `super-admin` and `admin` can delete supported resources.

## Common Authentication Responses

### 401 Unauthorized

Possible reasons:

- Authorization header is missing
- Bearer token is missing
- Token is invalid
- Token type is invalid
- Token has expired
- Admin account is unavailable
- Admin account is inactive
- Admin password changed after the token was issued

### 403 Forbidden

Returned when an authenticated Admin does not have permission for the requested action.

---

# Public and System Routes

## Server Root

Mounted directly in:

`server/src/app.js`

Route:

`GET /`

Purpose:

Provides the backend root response.

The exact root response payload should be documented separately when its public contract is finalized.

---

## Health Check

Route file:

`server/src/routes/health.routes.js`

Endpoint:

`GET /api/health`

Authentication:

Not required.

Success status:

`200 OK`

Current success response:

```json
{
  "success": true,
  "message": "RakeshNexify Portfolio API is running."
}
```

Purpose:

- Confirm that the API server is running
- Support deployment health checks
- Support basic server monitoring

---

## Sitemap

Route file:

`server/src/routes/sitemap.routes.js`

Endpoint:

`GET /sitemap.xml`

Authentication:

Not required.

Controller:

`getSitemapXml`

Purpose:

Returns the dynamic XML sitemap.

The sitemap respects supported Site Settings publication controls and can exclude disabled public pages.

---

# Public Site Settings API

Route file:

`server/src/routes/siteSettings.routes.js`

Mount path:

`/api/site-settings`

## Get Public Site Settings

Endpoint:

`GET /api/site-settings`

Authentication:

Not required.

Controller:

`getPublicSiteSettings`

Purpose:

Returns public-safe global website settings used by:

- Brand
- Owner information
- Hero
- About
- Listing-section content, including Experience section content
- Contact content
- Footer
- Platforms
- Navigation
- SEO
- Publication behavior

Private Admin-only values must not be exposed through this route.

---

# Public Services API

Route file:

`server/src/routes/service.routes.js`

Mount path:

`/api/services`

## Get Public Services

Endpoint:

`GET /api/services`

Authentication:

Not required.

Controller:

`getPublicServices`

Purpose:

Returns public Services records.

Public behavior should respect Service visibility and display order.

No public Service details endpoint currently exists.

---

# Public Statistics API

Route file:

`server/src/routes/statistic.routes.js`

Mount path:

`/api/statistics`

## Get Public Statistics

Endpoint:

`GET /api/statistics`

Authentication:

Not required.

Controller:

`getPublicStatistics`

Purpose:

Returns public Statistics records.

Public behavior should respect:

- `isVisible`
- `isFeatured`
- `order`

---

# Public Skills API

Route file:

`server/src/routes/skill.routes.js`

Mount path:

`/api/skills`

## Get Public Skills

Endpoint:

`GET /api/skills`

Authentication:

Not required.

Controller:

`getPublicSkills`

Purpose:

Returns publicly visible Skill records.

The public listing always applies:

- `isVisible: true`
- Admin-defined display order
- Stable created-date fallback sorting

Supported query parameters:

- `search` — Searches Skill name, short name, description and category
- `category` — Case-insensitive exact category filter
- `proficiencyLevel` — Proficiency-level filter
- `featured` — Boolean featured filter using `true` or `false`

Supported `proficiencyLevel` values:

- `familiar`
- `proficient`
- `advanced`
- `expert`

Successful response status:

`200 OK`

Response shape:

```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

No public Skill details endpoint currently exists.

---

# Public Projects API

Route file:

`server/src/routes/project.routes.js`

Mount path:

`/api/projects`

## Get Public Projects

Endpoint:

`GET /api/projects`

Authentication:

Not required.

Controller:

`getPublicProjects`

Purpose:

Returns public Project records.

## Get Public Project by Slug

Endpoint:

`GET /api/projects/:slug`

Authentication:

Not required.

Controller:

`getPublicProjectBySlug`

Path parameter:

- `slug` — Unique Project slug

Purpose:

Returns one visible Project for its public details page.

---

# Public Education API

Route file:

`server/src/routes/education.routes.js`

Mount path:

`/api/education`

## Get Public Education Records

Endpoint:

`GET /api/education`

Authentication:

Not required.

Controller:

`getPublicEducation`

Purpose:

Returns publicly visible Education records.

The public listing always applies:

- `isVisible: true`
- Featured priority
- Admin-defined display order
- Newest start-date fallback
- Stable `_id` fallback

Supported query parameters:

- `search` — Searches institution, degree, field of study, location and descriptions
- `educationType` — Education-type filter
- `featured` — Boolean featured filter using `true` or `false`
- `currentlyStudying` — Boolean current-study filter using `true` or `false`

Supported `educationType` values:

- `school`
- `college`
- `university`
- `course`
- `training`
- `certification`
- `other`

Successful response status:

`200 OK`

Response shape:

```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

No public Education details endpoint currently exists.

---


# Public Experience API

Route file:

`server/src/routes/experience.routes.js`

Mount path:

`/api/experience`

## Get Public Experience Records

Endpoint:

`GET /api/experience`

Authentication:

Not required.

Controller:

`getPublicExperience`

Purpose:

Returns publicly visible Experience records.

The public listing always applies:

- `isVisible: true`
- Featured priority
- Admin-defined display order
- Newest start-date fallback
- Stable created-date and `_id` fallback sorting

Supported query parameters:

- `search` — Searches organization name, slug, job title, location, descriptions, responsibilities, achievements, skills and tools
- `employmentType` — Employment-type filter
- `current` — Boolean current-position filter using `true` or `false`
- `featured` — Boolean featured filter using `true` or `false`

Supported `employmentType` values:

- `full-time`
- `part-time`
- `freelance`
- `contract`
- `internship`
- `self-employed`
- `founder`
- `volunteer`
- `other`

Successful response status:

`200 OK`

Response shape:

```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

Public response behavior:

- Admin audit fields are excluded.
- Private `identityKey` is excluded.
- Hidden Experience records are excluded.
- There is no public Experience details endpoint.

---

# Public Companies API

Route file:

`server/src/routes/company.routes.js`

Mount path:

`/api/companies`

## Get Public Companies

Endpoint:

`GET /api/companies`

Authentication:

Not required.

Controller:

`getPublicCompanies`

Purpose:

Returns public Company records.

## Get Public Company by Slug

Endpoint:

`GET /api/companies/:slug`

Authentication:

Not required.

Controller:

`getPublicCompanyBySlug`

Path parameter:

- `slug` — Unique Company slug

Purpose:

Returns one visible Company for its public details page.

---

# Public Team API

Route file:

`server/src/routes/teamMember.routes.js`

Mount path:

`/api/team`

## Get Public Team Members

Endpoint:

`GET /api/team`

Authentication:

Not required.

Controller:

`getPublicTeamMembers`

Purpose:

Returns publicly visible Team member records.

The public listing always applies:

- `isVisible: true`
- Display order sorting
- Created-date fallback sorting

Supported query parameters:

- `search` — Searches name, professional role, Team position, short introduction, skills and tools
- `professionalRole` — Case-insensitive exact professional-role filter
- `status` — Member status filter
- `availabilityStatus` — Availability filter
- `featured` — Boolean featured filter using `true` or `false`

Supported `status` values:

- `active`
- `inactive`
- `former`
- `archived`

Supported `availabilityStatus` values:

- `available`
- `limited`
- `unavailable`
- `on-leave`

Successful response status:

`200 OK`

Response shape:

```json
{
  "success": true,
  "count": 0,
  "data": []
}
```

## Get Public Team Member by Slug

Endpoint:

`GET /api/team/:slug`

Authentication:

Not required.

Controller:

`getPublicTeamMemberBySlug`

Path parameter:

- `slug` — Unique Team member slug

Purpose:

Returns one publicly visible Team member for the public details page.

Public behavior:

- Hidden Team members return `404`.
- Hidden related Projects, Companies and Services are excluded.
- Admin audit fields are not exposed.

---

# Public Contact Message API

Route file:

`server/src/routes/contactMessage.routes.js`

Mount path:

`/api/contact-messages`

## Create Contact Message

Endpoint:

`POST /api/contact-messages`

Authentication:

Not required.

Middleware:

`contactMessageRateLimiter`

Controller:

`createContactMessage`

Purpose:

Allows a public visitor to submit the portfolio contact form.

Expected body fields are based on the ContactMessage model and controller validation:

- `name`
- `email`
- `phone`
- `service`
- `serviceTitle`
- `subject`
- `message`
- `source`

The endpoint is protected by a dedicated rate limiter.

---

# Admin Authentication API

Route file:

`server/src/routes/adminAuth.routes.js`

Mount path:

`/api/admin/auth`

## Admin Login

Endpoint:

`POST /api/admin/auth/login`

Authentication:

Not required.

Controller:

`loginAdmin`

Purpose:

Authenticates an Admin and returns an Admin access token when credentials are valid.

## Get Current Admin

Endpoint:

`GET /api/admin/auth/me`

Authentication:

Required.

Middleware:

`requireAdminAuth`

Controller:

`getCurrentAdmin`

Purpose:

Returns the currently authenticated Admin profile.

---

# Admin Site Settings API

Route file:

`server/src/routes/adminSiteSettings.routes.js`

Mount path:

`/api/admin/site-settings`

All routes require:

`requireAdminAuth`

## Get Admin Site Settings

Endpoint:

`GET /api/admin/site-settings`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminSiteSettings`

## Update Site Settings

Endpoint:

`PATCH /api/admin/site-settings`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`updateAdminSiteSettings`

Purpose:

Updates global website settings.

The client currently sends the full settings payload from the modular Site Settings editor.

---

# Admin Services API

Route file:

`server/src/routes/adminService.routes.js`

Mount path:

`/api/admin/services`

All routes require:

`requireAdminAuth`

## List Services

Endpoint:

`GET /api/admin/services`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminServices`

## Create Service

Endpoint:

`POST /api/admin/services`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`createAdminService`

## Get Service by ID

Endpoint:

`GET /api/admin/services/:id`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminServiceById`

## Update Service

Endpoint:

`PATCH /api/admin/services/:id`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`updateAdminService`

## Delete Service

Endpoint:

`DELETE /api/admin/services/:id`

Allowed roles:

- `super-admin`
- `admin`

Controller:

`deleteAdminService`

---

# Admin Statistics API

Route file:

`server/src/routes/adminStatistic.routes.js`

Mount path:

`/api/admin/statistics`

All routes require:

`requireAdminAuth`

## List Statistics

Endpoint:

`GET /api/admin/statistics`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminStatistics`

## Create Statistic

Endpoint:

`POST /api/admin/statistics`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`createAdminStatistic`

## Get Statistic by ID

Endpoint:

`GET /api/admin/statistics/:id`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminStatisticById`

## Update Statistic

Endpoint:

`PATCH /api/admin/statistics/:id`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`updateAdminStatistic`

## Delete Statistic

Endpoint:

`DELETE /api/admin/statistics/:id`

Allowed roles:

- `super-admin`
- `admin`

Controller:

`deleteAdminStatistic`

---

# Admin Skills API

Route file:

`server/src/routes/adminSkill.routes.js`

Mount path:

`/api/admin/skills`

All routes require:

`requireAdminAuth`

## List Skills

Endpoint:

`GET /api/admin/skills`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminSkills`

Supported query parameters:

- `search`
- `category`
- `proficiencyLevel`
- `isVisible`
- `isFeatured`

## Create Skill

Endpoint:

`POST /api/admin/skills`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`createAdminSkill`

Important behavior:

- Generates a normalized slug when required
- Enforces unique slug and normalized Skill-name identity
- Rejects non-object request bodies with a structured `400`
- Maps duplicate normalized names to `fieldErrors.name`

## Get Skill by ID

Endpoint:

`GET /api/admin/skills/:id`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminSkillById`

## Update Skill

Endpoint:

`PATCH /api/admin/skills/:id`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`updateAdminSkill`

## Delete Skill

Endpoint:

`DELETE /api/admin/skills/:id`

Allowed roles:

- `super-admin`
- `admin`

Controller:

`deleteAdminSkill`

---

# Admin Projects API

Route file:

`server/src/routes/adminProject.routes.js`

Mount path:

`/api/admin/projects`

All routes require:

`requireAdminAuth`

## List Projects

Endpoint:

`GET /api/admin/projects`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminProjects`

## Create Project

Endpoint:

`POST /api/admin/projects`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`createAdminProject`

## Get Project by ID

Endpoint:

`GET /api/admin/projects/:id`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminProjectById`

## Update Project

Endpoint:

`PATCH /api/admin/projects/:id`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`updateAdminProject`

## Delete Project

Endpoint:

`DELETE /api/admin/projects/:id`

Allowed roles:

- `super-admin`
- `admin`

Controller:

`deleteAdminProject`

---

# Admin Education API

Route file:

`server/src/routes/adminEducation.routes.js`

Mount path:

`/api/admin/education`

All routes require:

`requireAdminAuth`

## List Education Records

Endpoint:

`GET /api/admin/education`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminEducation`

Supported query parameters:

- `search`
- `educationType`
- `isCurrentlyStudying`
- `isVisible`
- `isFeatured`

## Create Education Record

Endpoint:

`POST /api/admin/education`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`createAdminEducation`

Important behavior:

- Uses strict `YYYY-MM-DD` calendar validation
- Generates and validates the slug
- Enforces unique slug and normalized Education identity
- Clears `endDate` when `isCurrentlyStudying` is true
- Returns structured field-level validation errors

## Get Education Record by ID

Endpoint:

`GET /api/admin/education/:id`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminEducationById`

## Update Education Record

Endpoint:

`PATCH /api/admin/education/:id`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`updateAdminEducation`

## Delete Education Record

Endpoint:

`DELETE /api/admin/education/:id`

Allowed roles:

- `super-admin`
- `admin`

Controller:

`deleteAdminEducation`

---


# Admin Experience API

Route file:

`server/src/routes/adminExperience.routes.js`

Mount path:

`/api/admin/experience`

All routes require:

`requireAdminAuth`

## List Experience Records

Endpoint:

`GET /api/admin/experience`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminExperience`

Supported query parameters:

- `search`
- `employmentType`
- `isCurrent`
- `isVisible`
- `isFeatured`

Admin sorting:

1. `order` ascending
2. `startDate` descending
3. `createdAt` ascending
4. `_id` ascending

## Create Experience Record

Endpoint:

`POST /api/admin/experience`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`createAdminExperience`

Important behavior:

- Rejects non-object request bodies with a structured `400`
- Uses strict `YYYY-MM-DD` calendar validation
- Requires an end date when the position is not current
- Clears `endDate` when `isCurrent` is true
- Generates a slug from organization, role and start date when needed
- Enforces unique slug and normalized Experience identity
- Rejects non-text values inside text arrays
- Normalizes responsibilities, achievements, skills and tools
- Returns structured field-level errors

## Get Experience Record by ID

Endpoint:

`GET /api/admin/experience/:id`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminExperienceById`

## Update Experience Record

Endpoint:

`PATCH /api/admin/experience/:id`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`updateAdminExperience`

Important behavior:

- Rejects an empty update payload
- Revalidates timeline and required fields
- Regenerates the private duplicate identity when identity fields change
- Preserves immutable Admin audit ownership
- Updates `updatedBy` from the authenticated Admin

## Delete Experience Record

Endpoint:

`DELETE /api/admin/experience/:id`

Allowed roles:

- `super-admin`
- `admin`

Controller:

`deleteAdminExperience`

Purpose:

Permanently deletes one Experience record.

---

# Admin Companies API

Route file:

`server/src/routes/adminCompany.routes.js`

Mount path:

`/api/admin/companies`

All routes require:

`requireAdminAuth`

## List Companies

Endpoint:

`GET /api/admin/companies`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminCompanies`

## Create Company

Endpoint:

`POST /api/admin/companies`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`createAdminCompany`

## Get Company by ID

Endpoint:

`GET /api/admin/companies/:id`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminCompanyById`

## Update Company

Endpoint:

`PATCH /api/admin/companies/:id`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`updateAdminCompany`

## Delete Company

Endpoint:

`DELETE /api/admin/companies/:id`

Allowed roles:

- `super-admin`
- `admin`

Controller:

`deleteAdminCompany`

---

# Admin Contact Messages API

Route file:

`server/src/routes/adminContactMessage.routes.js`

Mount path:

`/api/admin/contact-messages`

All routes require:

`requireAdminAuth`

## List Contact Messages

Endpoint:

`GET /api/admin/contact-messages`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminContactMessages`

## Get Contact Message by ID

Endpoint:

`GET /api/admin/contact-messages/:id`

Allowed roles:

Any authenticated active Admin.

Controller:

`getAdminContactMessageById`

## Update Contact Message

Endpoint:

`PATCH /api/admin/contact-messages/:id`

Allowed roles:

- `super-admin`
- `admin`
- `editor`

Controller:

`updateAdminContactMessage`

Purpose:

Can update supported Admin-managed fields such as message status and Admin notes.

## Delete Contact Message

Endpoint:

`DELETE /api/admin/contact-messages/:id`

Allowed roles:

- `super-admin`
- `admin`

Controller:

`deleteAdminContactMessage`

---

# Current Route Summary

## Public and System

- `GET /`
- `GET /api/health`
- `GET /sitemap.xml`
- `GET /api/site-settings`
- `GET /api/services`
- `GET /api/statistics`
- `GET /api/skills`
- `GET /api/projects`
- `GET /api/projects/:slug`
- `GET /api/education`
- `GET /api/experience`
- `GET /api/companies`
- `GET /api/companies/:slug`
- `GET /api/team`
- `GET /api/team/:slug`
- `POST /api/contact-messages`

## Admin Authentication

- `POST /api/admin/auth/login`
- `GET /api/admin/auth/me`

## Admin Site Settings

- `GET /api/admin/site-settings`
- `PATCH /api/admin/site-settings`

## Admin Services

- `GET /api/admin/services`
- `POST /api/admin/services`
- `GET /api/admin/services/:id`
- `PATCH /api/admin/services/:id`
- `DELETE /api/admin/services/:id`

## Admin Statistics

- `GET /api/admin/statistics`
- `POST /api/admin/statistics`
- `GET /api/admin/statistics/:id`
- `PATCH /api/admin/statistics/:id`
- `DELETE /api/admin/statistics/:id`

## Admin Skills

- `GET /api/admin/skills`
- `POST /api/admin/skills`
- `GET /api/admin/skills/:id`
- `PATCH /api/admin/skills/:id`
- `DELETE /api/admin/skills/:id`

## Admin Projects

- `GET /api/admin/projects`
- `POST /api/admin/projects`
- `GET /api/admin/projects/:id`
- `PATCH /api/admin/projects/:id`
- `DELETE /api/admin/projects/:id`

## Admin Education

- `GET /api/admin/education`
- `POST /api/admin/education`
- `GET /api/admin/education/:id`
- `PATCH /api/admin/education/:id`
- `DELETE /api/admin/education/:id`

## Admin Experience

- `GET /api/admin/experience`
- `POST /api/admin/experience`
- `GET /api/admin/experience/:id`
- `PATCH /api/admin/experience/:id`
- `DELETE /api/admin/experience/:id`

## Admin Companies

- `GET /api/admin/companies`
- `POST /api/admin/companies`
- `GET /api/admin/companies/:id`
- `PATCH /api/admin/companies/:id`
- `DELETE /api/admin/companies/:id`

## Admin Team

- `GET /api/admin/team`
- `POST /api/admin/team`
- `GET /api/admin/team/:id`
- `PATCH /api/admin/team/:id`
- `DELETE /api/admin/team/:id`

## Admin Contact Messages

- `GET /api/admin/contact-messages`
- `GET /api/admin/contact-messages/:id`
- `PATCH /api/admin/contact-messages/:id`
- `DELETE /api/admin/contact-messages/:id`

---


## Query Parameter Documentation

Team listing query parameters have been audited and documented in their Public and Admin Team API sections.

Other module-specific listing parameters should be documented only after their controllers are audited.

Do not add undocumented query parameters based only on assumptions.

## API Documentation Rule

Whenever an API route is created, removed or changed:

1. Update this file.
2. Document the HTTP method.
3. Document the complete route.
4. Document authentication.
5. Document allowed roles.
6. Document path parameters.
7. Document important middleware.
8. Update `docs/SESSION_HANDOFF.md`.
