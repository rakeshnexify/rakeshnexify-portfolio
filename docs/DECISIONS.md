# Project Decisions

Last updated: 2026-08-07

## Purpose

This file records important technical, architectural and workflow decisions for the RakeshNexify MERN Portfolio.

These decisions prevent future ChatGPT, Codex or developer sessions from unnecessarily changing established architecture.

A decision may later be replaced, but the replacement reason should also be documented here.

---

# Decision 001 — Repository Is the Permanent Project Memory

Status: Accepted

## Decision

The repository, Git history and files inside `docs/` are the permanent source of project context.

Long ChatGPT conversations are not the primary project memory.

## Reason

Very long chats can become difficult to continue accurately.

Repository documentation remains available across:

- New ChatGPT conversations
- Codex sessions
- VS Code sessions
- Desktop and laptop development
- Future developers

## Required Behavior

Every new session should read:

- `AGENTS.md`
- `docs/SESSION_HANDOFF.md`
- `docs/CURRENT_STATUS.md`
- `docs/ROADMAP.md`

The session should also run:

- `git status --short`
- `git log --oneline -10`

---

# Decision 002 — Use Separate Client and Server Applications

Status: Accepted

## Decision

The project uses:

- `client/` for the React frontend
- `server/` for the Express backend

## Reason

This separation keeps frontend and backend responsibilities clear.

It also improves:

- Debugging
- Deployment flexibility
- Security
- Testing
- Maintenance

## Consequence

Frontend code should not directly contain database logic.

Backend code should not contain React rendering logic.

---

# Decision 003 — Use MongoDB Atlas

Status: Accepted

## Decision

Dynamic portfolio data is stored in MongoDB Atlas.

Current database:

`rakeshnexify_portfolio`

## Reason

MongoDB Atlas provides:

- Cloud database access
- Development across multiple devices
- Easier deployment
- MongoDB compatibility
- Separate database ownership for this project

## Security Requirement

MongoDB credentials must only exist in environment files or secure deployment settings.

Credentials must never be stored in:

- Git
- Documentation
- Screenshots intended for public use
- Source-code constants

---

# Decision 004 — Make Manageable Website Content Dynamic

Status: Accepted

## Decision

Every reasonable website element should be controlled through the Admin Panel instead of being unnecessarily hard-coded.

Examples:

- Brand information
- Owner profile
- Homepage content
- Services
- Statistics
- Projects
- Companies
- Team members
- Contact details
- Platform links
- Footer
- SEO
- Publication controls

## Reason

The website is a real professional portfolio, not a static demo.

The owner should be able to update content without editing source code.

## Consequence

New public modules should be evaluated for:

- Database model
- Public API
- Admin API
- Admin CRUD
- Visibility
- Featured status
- Display order
- Homepage integration
- Public pages
- SEO
- Sitemap

---

# Decision 005 — Keep `App.jsx` Minimal

Status: Accepted

## Decision

`client/src/App.jsx` should remain small.

Feature logic should be placed in dedicated files.

## Reason

Large `App.jsx` files become difficult to understand and debug.

## Preferred Separation

Use dedicated:

- Components
- Pages
- Hooks
- Services
- Utilities
- Context providers
- Route files
- Configuration files

---

# Decision 006 — Keep Express Setup and Server Startup Separate

Status: Accepted

## Decision

Responsibilities remain separated between:

- `server/src/app.js`
- `server/src/server.js`

## `app.js` Responsibilities

- Express setup
- Security middleware
- Parsing middleware
- Route mounting
- Production client delivery
- Not Found behavior
- Error handling

## `server.js` Responsibilities

- Database connection
- HTTP server startup
- Graceful shutdown

## Reason

This makes the backend easier to test and maintain.

---

# Decision 007 — Follow the Existing Dynamic Module Pattern

Status: Accepted

## Decision

New major modules should follow the established Services, Statistics, Projects, Companies and Team architecture.

## Backend Pattern

Typical files:

- Model
- Public controller
- Admin controller
- Public routes
- Admin routes
- Optional default data

## Frontend Pattern

Typical files:

- Public card
- Admin form
- Homepage section
- Listing page
- Optional details page
- Public hooks
- Public API service
- Admin API service
- Form utility
- Admin list page
- Admin editor page

## Reason

Using one consistent pattern improves:

- Predictability
- Reusability
- Debugging
- Maintenance
- Development speed

Do not duplicate the full architecture when an existing module can be reused as a reference.

---

# Decision 008 — Use Independent Visibility Controls

Status: Accepted

## Decision

Supported public modules use separate controls for:

- Homepage visibility
- Navbar visibility
- Dedicated public-page visibility
- Homepage order
- Navbar order
- Public label

## Reason

A single visibility setting cannot correctly represent all publication requirements.

A module may need to be:

- Visible on the homepage
- Hidden from the Navbar
- Still accessible through its public page

## Required Fields

Current section registry supports:

- `isVisible`
- `isNavigationVisible`
- `isPageVisible`
- `order`
- `navigationOrder`
- `label`

---

# Decision 009 — Protect Disabled Public Pages

Status: Accepted

## Decision

Disabling a dedicated public page must prevent direct URL access.

## Current Behavior

Disabled supported pages:

- Show the public Not Found page
- Are removed from the dynamic sitemap

## Reason

Hiding only the Navbar link does not disable a page.

Direct routes and search-engine discovery must respect publication settings.

---

# Decision 010 — Use a Dynamic Homepage Registry

Status: Accepted

## Decision

Homepage sections are rendered through a shared section registry instead of a permanently hard-coded order.

## Reason

The Admin must be able to control:

- Homepage section visibility
- Section order
- Navbar visibility
- Navbar order
- Public labels

## Consequence

New homepage modules must be registered in both required client and server configuration files.

---

# Decision 011 — Use Modular Site Settings Pages

Status: Accepted

## Decision

The original long Site Settings form is divided into smaller category pages.

Current categories:

1. Brand
2. Owner
3. Hero
4. About
5. Listing sections
6. Contact
7. Platforms
8. Navigation
9. Footer
10. SEO
11. Publication

## Reason

One very long settings page is difficult to:

- Understand
- Navigate
- Test
- Maintain
- Debug

## Consequence

New settings groups should be placed in the appropriate category or introduced as a clearly named new category.

---

# Decision 012 — Use REST APIs

Status: Accepted

## Decision

The backend uses REST-style public and Admin endpoints.

## Current Pattern

Public reads commonly use:

- `GET`

Public form submission uses:

- `POST`

Admin creation uses:

- `POST`

Admin updates use:

- `PATCH`

Admin deletion uses:

- `DELETE`

## Reason

This matches the current Express architecture and keeps API behavior predictable.

---

# Decision 013 — Use Bearer JWT for Admin Authentication

Status: Accepted

## Decision

Protected Admin APIs require:

`Authorization: Bearer <admin-access-token>`

## Required Checks

The authentication middleware validates:

- Token presence
- Bearer scheme
- Token signature
- Token type
- Admin ID
- Active account
- Token expiry
- Password-change time

## Reason

This provides stateless authentication suitable for the current MERN architecture.

---

# Decision 014 — Use Role-Based Admin Permissions

Status: Accepted

## Current Roles

- `super-admin`
- `admin`
- `editor`

## General Permissions

Read:

- Any authenticated active Admin

Create and update:

- `super-admin`
- `admin`
- `editor`

Delete:

- `super-admin`
- `admin`

## Reason

Editors should manage content but should not perform higher-risk deletion operations.

---

# Decision 015 — Preserve Security Middleware

Status: Accepted

## Decision

The project must preserve:

- Helmet
- CORS
- Rate limiting
- Authentication
- Role authorization
- Environment validation
- Contact-form rate limiting

## Reason

Security should not be removed merely to simplify development or make a test pass.

## Consequence

When debugging, identify the actual issue instead of disabling protection globally.

---

# Decision 016 — Use Dynamic SEO and Sitemap Behavior

Status: Accepted

## Decision

Public pages use dynamic SEO metadata and a dynamic XML sitemap.

## Current SEO Support

- Page title
- Description
- Keywords
- Canonical URL
- Open Graph image

## Sitemap Requirement

The sitemap should include only supported and published routes.

## Reason

SEO behavior must match public visibility and current database content.

---

# Decision 017 — Use Small Numbered Development Steps

Status: Accepted

## Decision

Development should happen through one small numbered step at a time.

## Required Communication

Each step should include:

- Step number
- Step title
- Exact file path
- Exact VS Code command
- Clear add, delete or replace instructions
- Validation before continuing

## Reason

Small steps reduce confusion, mistakes and difficult debugging.

---

# Decision 018 — Commit Only Verified Work

Status: Accepted

## Decision

A Git commit message should be provided only after the complete feature or phase has been verified.

## Required Final Checks

Before committing a completed phase:

- Run relevant browser tests
- Run `npm run build`
- Run `npm run check`
- Run `git diff --check`
- Review `git status --short`
- Confirm secrets and generated files are not staged

## Reason

Git commits are permanent project checkpoints.

Incomplete or broken checkpoints reduce the reliability of Git history.

---

# Decision 019 — Do Not Use Forced Dependency Fixes Without Review

Status: Accepted

## Decision

Do not run:

`npm audit fix --force`

without first reviewing the affected packages and breaking changes.

## Reason

Forced dependency updates may:

- Upgrade major versions
- Break Vite or React configuration
- Change runtime behavior
- Create new incompatibilities

## Required Process

1. Run a normal audit.
2. Identify the affected package.
3. Determine whether it affects production.
4. Review safe versions.
5. Update carefully.
6. Build and test after updating.

---

# Decision 020 — Treat Bundle Size as a Future Performance Phase

Status: Accepted

## Current Warning

The latest verified client build reports a main JavaScript chunk of:

`1,057.06 kB`

The latest verified gzip size is:

`223.72 kB`

## Decision

This warning is currently non-blocking.

It will be addressed in a dedicated performance phase.

## Planned Review

- Route-based lazy loading
- Dynamic imports
- Admin/public bundle separation
- Bundle analysis
- Image optimization
- Caching

## Reason

Performance work should be handled carefully rather than mixed into unrelated feature development.

---

# Decision 021 — Implement the Dynamic Team Management System

Status: Implemented

## Decision

The Dynamic Team Management System is an approved and implemented major module.

The completed implementation includes:

- Dynamic Team backend
- Protected Admin Team management frontend
- Public Team listing and member-details pages
- Homepage Team section
- Team Site Settings content
- Module-level publication controls
- Navbar, public-header and Footer integration
- Visibility-aware public routes
- XML sitemap integration
- Member-specific SEO
- JSON-LD structured data
- Runtime and browser validation

## Completed Scope

### Backend

- `TeamMember` model
- `teamMembers` MongoDB collection
- Public Team API
- Public Team member-details API
- Protected Admin Team CRUD API
- Hidden-member protection
- Hidden related-record filtering
- Search and filtering
- Role-based permissions
- Member-specific SEO fields

### Admin Frontend

- Admin Team dashboard module
- Admin Team listing page
- Admin Team create page
- Admin Team edit page
- Reusable Team form
- Relationship selectors
- Visibility and featured quick actions
- Role-restricted permanent deletion
- Browser-tested create, edit, filter and delete workflows

### Public Website

- Public Team API service
- Public Team list hook
- Public Team member-detail hook
- Reusable `TeamMemberCard`
- Homepage `TeamSection`
- `/team` listing page
- `/team/:slug` member-details page
- Loading, error, empty and not-found states
- Related Projects display
- Related Companies display
- Related Services display
- Responsive related-record grids
- Profile-image initials fallback
- Portfolio, website and social-profile links

### Site Settings and Publication

- Team section content in Site Settings
- Independent homepage visibility
- Independent Navbar visibility
- Independent dedicated-page visibility
- Homepage display order
- Navbar display order
- Dynamic navigation label
- Visibility-aware Navbar, public header and Footer links

### Sitemap and SEO

- `/team` sitemap entry
- Visible `/team/:slug` sitemap entries
- Hidden-member sitemap filtering
- Public-page visibility sitemap filtering
- Canonical URLs
- Open Graph metadata
- Twitter metadata
- Member-specific SEO title, description, keywords and sharing image
- Reusable JSON-LD support in `PageSeo`
- `/team` `CollectionPage` and `ItemList` JSON-LD
- `/team/:slug` `ProfilePage` and `Person` JSON-LD
- Invalid-member `noindex, nofollow` protection
- Stale structured-data cleanup during route changes

## Validation

Verified behavior includes:

- Public APIs return visible Team members only
- Hidden members return `404`
- Hidden related records are excluded from public details
- Quick Hide and Show actions work
- Homepage Team section renders live API data
- Public Team routes respect publication settings
- Disabling the Team public page removes all Team sitemap URLs
- Restoring the Team public page restores Team sitemap URLs
- Team listing metadata and JSON-LD were browser-tested
- Team member metadata and JSON-LD were browser-tested
- Invalid-member indexing protection was browser-tested
- Temporary `Public Team Test` data was permanently deleted

Current valid public Team record:

- Name: `Rakesh Pandit`
- Slug: `rakesh-pandit`
- Visibility: enabled

Current valid Team sitemap URLs:

- `https://rakeshnexify.com/team`
- `https://rakeshnexify.com/team/rakesh-pandit`

## Verified Checkpoints

Backend:

`90cb41b Add dynamic team backend APIs`

Admin frontend:

`95578b5 Add dynamic team admin management`

Documentation checkpoint:

`504705d Synchronize team phase documentation`

Public Team website checkpoint:

`7ca4f6c Add public team website integration`

## Current Phase

`Step 6.9D — Public Team Website Integration`

Status:

`COMPLETE, VALIDATED AND PUSHED`

The implementation commit is synchronized with `origin/main`, and the working tree was clean immediately after the push.

---

# Decision 022 — Update Documentation With Architecture Changes

Status: Accepted

## Decision

Whenever implementation changes the architecture, update the relevant documentation.

Examples:

### Model changes

Update:

- `docs/DATABASE_SCHEMA.md`

### Route changes

Update:

- `docs/API_ROUTES.md`

### Folder or file structure changes

Update:

- `docs/PROJECT_STRUCTURE.md`

### Project progress changes

Update:

- `docs/CURRENT_STATUS.md`
- `docs/SESSION_HANDOFF.md`
- `docs/ROADMAP.md`

### Important technical choice

Update:

- `docs/DECISIONS.md`

### New or resolved issue

Update:

- `docs/BUGS.md`

## Reason

Documentation must stay synchronized with the actual repository.

---

# Decision 023 — Use Consistent Team Naming

Status: Accepted

## Decision

Use these Team names consistently:

- Mongoose model: `TeamMember`
- MongoDB collection: `teamMembers`
- Public API base: `/api/team`
- Admin API base: `/api/admin/team`
- Public listing route: `/team`
- Public details route: `/team/:slug`
- Admin listing route: `/admin/team`
- Admin create route: `/admin/team/new`
- Admin edit route: `/admin/team/:id/edit`

## Reason

Consistent naming prevents duplicate models, routes, services and documentation.

## Consequence

Do not introduce alternative names such as:

- `team_members`
- `Team`
- `/api/team-members`
- `/admin/team-members`

without reviewing and intentionally migrating the existing implementation.

---

# Decision 024 — Do Not Add Fake Team Members

Status: Accepted

## Decision

The Team module must not use fake, hard-coded or automatically seeded Team member profiles.

## Reason

Team member information is real professional content and must be managed through the protected Admin interface.

## Consequence

- No default Team data file is required.
- Testing may use temporary records.
- Temporary test records must be deleted after validation.
- Public Team pages must support a proper empty state.

---

# Decision 025 — Use Visibility-Aware Team SEO, Sitemap and Structured Data

Status: Accepted and Implemented

## Decision

The public Team module must use the same publication state across public routing, navigation and XML sitemap behavior.

Individual Team member visibility and module-level public-page visibility are separate controls.

The shared `PageSeo` component supports page-specific JSON-LD so structured data remains reusable and route-aware.

## Rules

- Hidden Team members must not appear in public Team APIs.
- Hidden Team members must not appear in Team member sitemap URLs.
- Hidden Team members must return `404` from public member-details APIs.
- Disabling the Team public page must block `/team` and `/team/:slug`.
- Disabling the Team public page must remove all Team URLs from the sitemap.
- Homepage Team visibility must remain independent from dedicated-page visibility.
- Team navigation links must respect publication settings.
- Unavailable Team member profiles must use `noindex, nofollow`.
- Valid Team listing pages use `CollectionPage` and `ItemList` JSON-LD.
- Valid Team member pages use `ProfilePage` and `Person` JSON-LD.
- Structured-data scripts must be removed when a route no longer supplies valid structured data.

## Reason

Using one consistent publication model prevents hidden or disabled Team content from remaining discoverable through direct routes, navigation, search metadata or sitemap URLs.

Reusable JSON-LD support avoids duplicating document-head manipulation in individual pages.

## Consequence

Future dynamic public modules should follow the same separation between:

- Record-level visibility
- Homepage visibility
- Navbar visibility
- Dedicated-page visibility
- Sitemap visibility
- SEO indexing behavior

---

# Superseding a Decision

When replacing an existing decision:

1. Do not silently delete the previous decision.
2. Mark the old decision as superseded.
3. Add the new decision.
4. Explain why the decision changed.
5. Update affected documentation.
6. Verify implementation before committing.


# Decision 026 — Implement the Dynamic Skills Management Module

Status: Accepted and Implemented

## Decision

Use these Skills conventions:

- Mongoose model: `Skill`
- MongoDB collection: `skills`
- Public API: `/api/skills`
- Admin API: `/api/admin/skills`
- Public page: `/skills`
- Admin routes:
  - `/admin/skills`
  - `/admin/skills/new`
  - `/admin/skills/:id/edit`

## Approved Scope

- Database-backed Skills
- Protected Admin CRUD
- Search and practical filters
- Category and proficiency
- Optional years of experience
- Visibility, featured and order
- Homepage section
- Dedicated public page
- Site Settings
- Independent publication controls
- SEO, JSON-LD and sitemap

## Important Decisions

- No public Skill details page
- No record-specific Skill SEO fields
- No fake or seeded Skills
- Private normalized `nameKey` prevents duplicate names
- Public API excludes Admin audit fields
- Homepage does not depend on featured records only

## Reason

The portfolio needs maintainable professional Skill content without unnecessary detail-page or relation complexity.

---

# Decision 027 — Implement the Dynamic Education Management Module

Status: Accepted and Implemented

## Decision

Use these Education conventions:

- Mongoose model: `Education`
- MongoDB collection: `education`
- Public API: `/api/education`
- Admin API: `/api/admin/education`
- Public page: `/education`
- Admin routes:
  - `/admin/education`
  - `/admin/education/new`
  - `/admin/education/:id/edit`

## Approved Scope

- Institution and qualification fields
- Education type
- Start and end dates
- Current-study behavior
- Grade and location
- Short and full descriptions
- Institution, certificate and logo URLs
- Visibility, featured and order
- Homepage timeline
- Dedicated public page
- Site Settings
- Independent publication controls
- SEO, JSON-LD and sitemap

## Important Decisions

- No `/education/:slug` details page
- No record-specific SEO fields
- No cross-module relations
- No fake or seeded Education records
- Duplicate identity uses institution, qualification, field, type and start date
- Current study forces `endDate` to `null`
- URL values must be credential-free HTTP/HTTPS URLs
- Public ordering combines featured priority, Admin order and chronological fallback

## Reason

The listing page can present complete Education information without additional detail-route complexity.

---

# Decision 028 — Use Mongoose 9-Compatible Middleware

Status: Accepted

## Decision

Synchronous Mongoose middleware must not accept or call the old callback-style `next` argument.

Use:

```js
schema.pre("validate", function prepareForValidation() {
  // synchronous preparation
});
```

Do not use:

```js
schema.pre("validate", function prepareForValidation(next) {
  next();
});
```

## Evidence

The Education create workflow produced:

`next is not a function`

under Mongoose `9.8.0`.

Removing the callback signature fixed the runtime failure.

## Consequence

Future models, including Experience, must use:

- Synchronous middleware without `next`
- Promise-returning middleware
- Or `async` middleware

according to actual needs.

---

# Decision 029 — Keep Listing Modules Simple Without Unnecessary Detail Pages

Status: Accepted

## Decision

Skills and Education use dedicated listing pages without record-detail routes.

Experience follows the same rule in the completed MVP. It has a dedicated `/experience` listing page and no `/experience/:slug` detail route.

## Reason

A detail route adds:

- Additional public API contract
- Record-level SEO
- Sitemap detail URLs
- Not-found states
- More publication behavior
- More maintenance

This complexity is not justified when the listing page can display the complete record.

---

# Decision 030 — Keep Social Metadata Separate From JSON-LD

Status: Accepted and Verified

## Decision

`PageSeo` must use the page title for:

- `og:title`
- `twitter:title`

Serialized structured data must only be written to the `application/ld+json` script.

## Reason

Using JSON-LD as a social title produces broken sharing previews.

## Verification

The correction was implemented during Education public integration and passed focused Codex re-review.


# Decision 031 — Implement the Dynamic Experience Management Module

Status: Accepted and Implemented

## Decision

Use these Experience conventions:

- Mongoose model: `Experience`
- MongoDB collection: `experiences`
- Public API: `/api/experience`
- Admin API: `/api/admin/experience`
- Public page: `/experience`
- Admin routes:
  - `/admin/experience`
  - `/admin/experience/new`
  - `/admin/experience/:id/edit`

## Completed Scope

- Database-backed professional Experience records
- Organization and job-title identity
- Employment type
- Start and end dates
- Current-position behavior
- Location and location type
- Short and full descriptions
- Separate responsibilities and achievements
- Skills and tools arrays
- Optional organization logo and website
- Visibility, featured and display order
- Protected Admin CRUD
- Search and practical filters
- Homepage timeline preview
- Dedicated `/experience` listing page
- Dynamic Site Settings content
- Independent homepage, Navbar and public-page visibility
- Dynamic listing-page SEO and JSON-LD
- Visibility-aware sitemap entry
- Responsive loading, error and empty states

## Important Decisions

- No `/experience/:slug` public details page
- No record-specific Experience SEO fields
- No cross-module relations in the MVP
- No pagination in the MVP
- No separate status enum
- No fake or automatically seeded Experience records
- Backend field name remains `jobTitle`; the Admin UI label is `Job title / professional role`
- `isCurrent: true` forces `endDate` to `null`
- Non-current records require an end date
- Private duplicate identity combines organization, job title, employment type and start date
- Responsibilities, achievements, skills and tools remain separate normalized string arrays

## Publication and Ordering

Public ordering:

1. Featured records first
2. Admin `order` ascending
3. Newest `startDate` first
4. Oldest `createdAt` first
5. Stable `_id` fallback

Admin ordering:

1. `order` ascending
2. Newest `startDate` first
3. Oldest `createdAt` first
4. Stable `_id` fallback

The homepage preview uses the public ordering and displays up to four visible records. It does not require records to be featured.

## Security and Validation

- Public API exposes visible records only.
- Private `identityKey` and Admin audit fields are excluded from public responses.
- Admin APIs preserve Bearer JWT authentication and project RBAC.
- Create and update allow `super-admin`, `admin` and `editor`.
- Permanent deletion allows only `super-admin` and `admin`.
- URL fields allow credential-free HTTP or HTTPS URLs only.
- Text-array payloads reject non-text items.
- Synchronous Mongoose middleware follows the Mongoose 9-compatible pattern.

## Verified Checkpoints

- `b117e22 Add dynamic Experience backend APIs`
- `5dbcb7a Add Experience frontend services and form utilities`
- `8e235fb Add dynamic Experience admin interface`
- `91263aa Add public Experience section and page`

## Reason

The portfolio needs a complete professional work-history module that is fully manageable through the Admin Panel while avoiding unnecessary detail-route, relation and record-specific SEO complexity.

---

# Decision 032 — Implement the Dynamic Testimonials Management Module

Status: Accepted and Implemented

## Decision

Use these Testimonials conventions:

- Mongoose model: `Testimonial`
- MongoDB collection: `testimonials`
- Public API: `/api/testimonials`
- Admin API: `/api/admin/testimonials`
- Public page: `/testimonials`
- Admin routes:
  - `/admin/testimonials`
  - `/admin/testimonials/new`
  - `/admin/testimonials/:id/edit`

## Completed Scope

- Database-backed client Testimonials
- Required client name, review text and rating
- Optional client role and company name
- Optional profile image and company website
- Optional related Project
- Rating from 1 through 5
- Visibility, featured and display order
- Protected Admin CRUD
- Search and practical filters
- Homepage Testimonials preview
- Dedicated `/testimonials` listing page
- Dynamic Site Settings content
- Independent homepage, Navbar and public-page visibility
- Visibility-aware navigation, Footer and sitemap integration
- Listing-page SEO and general Schema.org structured data
- Loading, error and empty states
- No fake or automatically seeded Testimonial records

## Important Decisions

- No `/testimonials/:slug` public detail route
- No record-specific Testimonial SEO fields in the MVP
- No pagination in the MVP
- Public API exposes visible Testimonials only
- Hidden related Projects must not leak through public responses
- Admin audit fields remain server-controlled
- Public sorting is featured descending, order ascending, created date ascending and stable `_id` fallback
- Rating validation is intentionally strict and rejects permissive numeric coercion
- The homepage preview uses public ordering and displays up to three Testimonials

## Verified Checkpoints

- `d625157 Add dynamic Testimonials backend APIs`
- `c9d0dfe Fix Testimonials backend validation`
- `92f2dbd Complete strict Testimonials backend validation`
- `b340cee Add Testimonials frontend foundation`
- `5c825e1 Add dynamic Testimonials admin interface`
- `12a2e67 Add public Testimonials section and page`

## Reason

The portfolio needs real client feedback that is fully manageable through the Admin Panel while remaining safe, easy to publish and simple enough to maintain without unnecessary record-detail routes.

---

# Decision 033 — Keep Testimonials Ratings and Review Structured Data Strict

Status: Accepted and Verified

## Decision

Testimonials rating inputs and filters must accept only valid whole-number ratings from 1 through 5.

Malformed numeric-like inputs must not be silently normalized into a valid rating.

The public `/testimonials` page may publish accurate general Schema.org `Review` data, but the project must not change the reviewed entity type merely to imply unsupported Google Review Snippet eligibility.

## Rules

- Accept valid rating numbers `1` through `5`.
- Accept exact public filter strings `"1"` through `"5"`.
- Reject malformed variants such as `01`, `+1`, `1.0`, `1e0`, arrays and objects.
- Exclude malformed ratings from stars, averages and Review JSON-LD.
- Filtered listing states must not publish a misleading canonical Review `ItemList`.
- `itemReviewed` must remain semantically accurate.
- Company information may be represented as author affiliation where supported by the record.

## Reason

Strict ratings prevent inconsistent API, form, visual and structured-data behavior. Accurate Schema.org semantics are more important than forcing eligibility for a search-engine rich-result format that does not match the portfolio data model.
