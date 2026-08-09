# Project Memory

Last updated: 2026-08-09

## Purpose

This file is the long-term development memory for the RakeshNexify MERN Portfolio.

Keep it concise and architecture-focused. Do not turn it into a development diary.

The two active development-memory files are:

- `docs/PROJECT_MEMORY.md`
- `docs/SESSION_HANDOFF.md`

Other documentation may remain as workflow, public, archived, or historical reference, but normal module completion should not require updating a large documentation matrix.

## Source of Truth

Use this priority when information conflicts:

1. Verified runtime and database behavior
2. Current repository files
3. Git status, diff, and history
4. `docs/PROJECT_MEMORY.md`
5. `docs/SESSION_HANDOFF.md`
6. Archived or legacy documentation
7. Old chat history

The repository wins when documentation disagrees with implementation.

## Project Identity

Project: `RakeshNexify MERN Portfolio and Admin CMS`

Repository: `D:\rakeshnexify-portfolio`

Primary branch: `main`

Purpose: A production-oriented professional portfolio and Admin CMS with database-backed content, protected administration, public publication controls, SEO, reusable Media Management, and future business-management modules.

## Technology Stack

Frontend:

- React
- Vite
- React Router
- Tailwind CSS
- JavaScript

Backend:

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- REST APIs

Security and platform:

- JWT authentication
- bcrypt password hashing
- role-based authorization
- Helmet
- CORS
- rate limiting
- environment validation

Media:

- Cloudinary
- Multer
- `file-type`
- `@file-type/xml`
- `sanitize-html`

## Repository Architecture

The application is split into `client/` and `server/`.

### Client Conventions

`client/src/App.jsx` stays minimal and renders the main routing system.

Use dedicated `pages/`, `components/`, `services/`, `hooks/`, `utils/`, `context/`, `routes/`, and `config/` folders. Do not place large feature logic in `App.jsx`.

### Server Conventions

Use `models/`, `routes/`, `controllers/`, `services/`, `middleware/`, and `config/` for their respective responsibilities.

`server/src/app.js` owns Express configuration, security middleware, parsing, route mounting, production client delivery, Not Found behavior, and centralized errors.

`server/src/server.js` owns startup validation, MongoDB connection, HTTP startup, graceful shutdown, and process-level failure handling.

## Authentication, RBAC, and Security

Protected Admin APIs use `Authorization: Bearer <admin-access-token>`.

JWT validation includes signature, token type, Admin subject, issuer/audience rules, expiry, active Admin lookup, and password-change invalidation.

Roles:

- `super-admin`
- `admin`
- `editor`

General RBAC:

- Read: any authenticated active Admin
- Create/update: `super-admin`, `admin`, `editor`
- Delete: `super-admin`, `admin`

Individual routes may intentionally define narrower permissions.

Admin accounts use bcrypt cost 12 and temporary account locking after repeated failed attempts.

Preserve Helmet, configured CORS, global rate limiting, environment validation, Admin authentication, role authorization, and public contact-message rate limiting.

Secrets must remain outside committed source.

## API Conventions

Public content APIs mainly use `GET`. Public contact submission is a notable `POST` exception.

Admin APIs generally live under `/api/admin/*`.

Common success shape:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "count": 0,
  "pagination": {}
}
```

Common error shape:

```json
{
  "success": false,
  "message": "Error message",
  "fieldErrors": {}
}
```

Common statuses:

- `200` read/update/delete
- `201` create
- `400` validation
- `401` authentication
- `403` authorization
- `404` missing resource
- `409` duplicate/reference conflict
- `415` unsupported content type
- `429` rate limit

Controllers should use editable-field allowlists and structured validation/duplicate errors.

Newer Post and Media controllers are stricter about unknown query/body keys than some older controllers.

## Database Conventions

Database name is environment-configured through `MONGODB_DB_NAME`.

The project's current intended/default database name is:

`rakeshnexify_portfolio`

Provider: MongoDB Atlas

ODM: Mongoose

General conventions:

- explicit collection names where defined
- timestamps
- `versionKey: false`
- server-controlled audit references where supported
- visibility, featured, and order fields for publishable modules
- unique indexed slugs where detail routing requires them
- private normalized identity fields where useful
- relation validation before saving referenced records
- indexes for publication, filtering, uniqueness, and search where justified

Common audit fields:

- `createdBy`
- `updatedBy`

Private identity examples:

- Skill `nameKey`
- Education `identityKey`
- Experience `identityKey`

## Site Settings and Publication System

`SiteSettings` is the shared database-backed website configuration system.

Registry keys include:

`hero`, `about`, `statistics`, `skills`, `services`, `projects`, `education`, `experience`, `team`, `companies`, `posts`, `testimonials`, `contact`, `blog`, `news`.

Registry controls:

- `isVisible`
- `isNavigationVisible`
- `isPageVisible`
- `order`
- `navigationOrder`
- `label`

`PublicPageVisibilityRoute` blocks supported dedicated pages when disabled.

Navbar, PublicPageHeader, Footer, and sitemap use publication settings.

Special cases:

- `posts` is the combined homepage Articles & News section.
- `blog` and `news` control dedicated Blog/News experiences.
- Hero, About, and Contact are anchor-oriented.
- Media and Contact Message management are Admin-only.

## SEO and Sitemap System

`client/src/components/seo/PageSeo.jsx` handles title, description, keywords, canonical URL, robots, Open Graph, Twitter metadata, social image, and JSON-LD.

Managed JSON-LD scripts are updated and cleaned during route changes.

The sitemap dynamically respects publication settings, record visibility, and supported detail routes.

## Media Management

Media Management is an Admin-only reusable system.

Model: `Media`

Collection: `media`

Admin API: `/api/admin/media`

Admin page: `/admin/media`

No public Media API or page exists.

### Storage

Cloudinary stores binaries. MongoDB stores Media metadata and provider references only. Provider logic is isolated behind backend configuration/services.

### Supported Types

- JPG/JPEG
- PNG
- WebP
- AVIF
- sanitized SVG
- PDF
- MP3
- WAV
- OGG
- M4A
- MP4
- WebM

Default limits:

- image: `10 MB`
- SVG: `5 MB`
- PDF/document: `20 MB`
- audio: `50 MB`
- video: `100 MB`

Do not disable audio, video, SVG, or PDF support unless intentionally changing the architecture.

### Upload Security

Media upload protection includes:

- authenticated/RBAC-protected multipart handling
- single-file upload boundaries
- randomized temporary files
- actual file-signature inspection
- MIME/extension cross-checks
- dangerous intermediate-extension rejection
- filename safety checks
- size enforcement
- SVG unsafe-content rejection and sanitization
- no raw SVG HTML injection in React
- temporary cleanup
- Cloudinary cleanup if MongoDB persistence fails
- HTTPS provider URLs
- overwrite protection

### Media Picker

Reusable system:

- `MediaField`
- `MediaPicker`
- `MediaPickerModal`
- `useMediaPicker`

Supports authenticated browsing, search, folders, server-backed media-type restrictions, pagination, cancellation/stale-response protection, manual URL compatibility, accessible field errors/help text, and keyboard-safe modal behavior.

Filtering contract:

- `mediaType` is used for one requested Media type.
- `mediaTypes` is used for multiple compatible types.
- `mediaType` and `mediaTypes` are mutually exclusive by query-key presence.
- blank or invalid `mediaTypes` values return structured `400` responses.
- multi-type filtering uses the same MongoDB filter for result retrieval and counting so pagination totals remain accurate.
- unrestricted Media Library browsing remains supported.

Media Picker integration now covers compatible fields across:

- Site Settings
- Services
- Statistics
- Skills
- Education
- Experience
- Testimonials
- Posts / Blog / News
- Projects
- Companies
- Team

Manual external URLs remain supported alongside Media Library selection. Normal website, portfolio, institution, social, email, and phone fields remain normal URL/contact fields rather than Media Picker fields.

Where an existing companion alt field exists, selected Media `altText` may populate it only when that alt field is currently blank; manually entered alt text must not be overwritten.

Public Service cards render `iconUrl` when available and safely fall back to the existing numeric service marker when the icon is missing or fails to load.

Project video URLs intentionally remain hybrid: uploaded Media video and external/manual video URLs are both supported.

### Reference Protection

Exact Media URL references are checked across Site Settings, Services, Statistics, Skills, Education, Experience, Testimonials, Posts, Projects, Companies, and Team.

Referenced Media is blocked from normal permanent deletion with `409 Conflict`.

See `Permanent Architectural Limitations` for the current reference-detail cap and deletion TOCTOU window.

## Leads / CRM Management

Leads / CRM is an Admin-only sales-opportunity system that extends the existing Contact Message inquiry workflow rather than replacing or duplicating public enquiry capture.

Model: `Lead`

Collection: `leads`

Admin API: `/api/admin/leads`

Admin routes:

- `/admin/leads`
- `/admin/leads/new`
- `/admin/leads/:id/edit`

No public Lead API or public Lead page exists.

### Inquiry-to-Lead Contract

`ContactMessage` remains the raw enquiry/inbox record.

`Lead` is the CRM sales opportunity.

Conversion is manual and Admin-driven through:

`POST /api/admin/contact-messages/:id/convert-to-lead`

The original Contact Message remains unchanged after conversion.

`Lead.sourceContactMessage` is the source-of-truth relation.

A partial unique index on `sourceContactMessage` prevents duplicate conversion while allowing manual Leads with no source Contact Message.

Multiple Leads may use the same customer email; Lead email is intentionally not unique.

### Pipeline and Ownership

Lead statuses:

- `new`
- `qualified`
- `contacted`
- `proposal`
- `negotiation`
- `won`
- `lost`
- `archived`

Lead priorities:

- `low`
- `medium`
- `high`
- `urgent`

Leads support:

- customer/contact details
- company/source
- optional Service relation
- Service slug/title snapshots
- requirement summary
- estimated value and currency
- active Admin assignment
- follow-up and last-contact dates
- status metadata
- lost reason
- display order
- private CRM notes
- created/updated Admin audit fields

Private CRM notes are server-authored with acting Admin identity and timestamp, and are not writable through normal Lead create/update payloads.

### Service Snapshot Contract

Historical Service snapshots must survive normal Lead maintenance.

If the Service relation is unchanged, the existing Lead snapshot remains authoritative even if the current Service record was renamed.

If the Service relation changes to another valid Service, the Lead stores that Service's current authoritative slug/title snapshot.

If the Service relation is cleared, the relation becomes `null` while the previous historical slug/title snapshot remains.

This contract applies to manual Leads and Contact Message-converted Leads.

### RBAC

Read:

- any authenticated active Admin

Create/update/private note/conversion:

- `super-admin`
- `admin`
- `editor`

Permanent delete:

- `super-admin`
- `admin`

## Completed Module Inventory

| Module | Model / Collection | Public API | Admin API | Public Routes | Admin Routes / Notes |
| --- | --- | --- | --- | --- | --- |
| Site Settings | `SiteSettings` / `site_settings` | `GET /api/site-settings` | `/api/admin/site-settings` | No standalone public page | `/admin/site-settings` |
| Services | `Service` / `services` | `/api/services` | `/api/admin/services` | `/services` | `/admin/services`, `/admin/services/new`, `/admin/services/:id/edit` |
| Statistics | `Statistic` / `statistics` | `/api/statistics` | `/api/admin/statistics` | `/statistics` | Admin list/create/edit routes |
| Projects | `Project` / `projects` | `/api/projects` | `/api/admin/projects` | `/projects`, `/projects/:slug` | Admin list/create/edit; Media Picker integrated |
| Companies | `Company` / `companies` | `/api/companies` | `/api/admin/companies` | `/companies`, `/companies/:slug` | Admin list/create/edit; Media Picker integrated |
| Contact Messages | `ContactMessage` / `contact_messages` | `POST /api/contact-messages` | `/api/admin/contact-messages` | Homepage contact workflow | `/admin/contact-messages`; rate-limited public inquiry |
| Leads / CRM | `Lead` / `leads` | None | `/api/admin/leads` | None | `/admin/leads`, `/admin/leads/new`, `/admin/leads/:id/edit`; manual Contact Message conversion, pipeline/follow-up, assignment, Service snapshots, private CRM notes |
| Team | `TeamMember` / `teamMembers` | `/api/team` | `/api/admin/team` | `/team`, `/team/:slug` | `/admin/team`, `/admin/team/new`, `/admin/team/:id/edit`; relations to Projects, Companies, Services; Media Picker integrated |
| Skills | `Skill` / `skills` | `/api/skills` | `/api/admin/skills` | `/skills` | `/admin/skills`, `/admin/skills/new`, `/admin/skills/:id/edit`; private `nameKey` |
| Education | `Education` / `education` | `/api/education` | `/api/admin/education` | `/education` | `/admin/education`, `/admin/education/new`, `/admin/education/:id/edit`; private `identityKey` |
| Experience | `Experience` / `experiences` | `/api/experience` | `/api/admin/experience` | `/experience` | `/admin/experience`, `/admin/experience/new`, `/admin/experience/:id/edit`; private `identityKey` |
| Testimonials | `Testimonial` / `testimonials` | `/api/testimonials` | `/api/admin/testimonials` | `/testimonials` | `/admin/testimonials`, `/admin/testimonials/new`, `/admin/testimonials/:id/edit`; optional Project relation |
| Blog / News | `Post` / `posts` | `/api/posts` | `/api/admin/posts` | `/blog`, `/news`, `/blog/:slug`, `/news/:slug` | `/admin/posts`, `/admin/posts/new`, `/admin/posts/:id/edit`; shared model and Project relations; Media Picker integrated |
| Media | `Media` / `media` | None | `/api/admin/media` | None | `/admin/media`; Cloudinary-backed binary storage |
| Admin Users | `AdminUser` / `admin_users` | None | `/api/admin/auth` | None | `/admin/login` plus protected Admin system; authentication support only, no AdminUser CRUD UI |

## Reusable Systems

Prefer extending these instead of duplicating architecture:

- Admin authentication and RBAC
- Site Settings
- publication registry
- `PublicPageVisibilityRoute`
- `PageSeo`
- dynamic sitemap
- slug/identity conventions
- API service pattern
- AbortSignal/stale-safe hooks
- Admin list/editor/form patterns
- loading/error/empty states
- Contact Message -> Lead conversion pattern
- CRM pipeline/follow-up/private-note patterns
- Media Picker

## Long-Term Decisions

- Repository/runtime implementation outranks documentation.
- Keep client/server separation.
- Keep `App.jsx` minimal.
- Keep Express app setup separate from server startup.
- Manage reasonable content dynamically through Admin.
- Use REST-style APIs.
- Preserve JWT/RBAC/security middleware.
- Keep homepage/navigation/page publication controls independent.
- Keep routing, sitemap, and SEO consistent with publication state.
- Blog and News share one `Post` model.
- Media binaries stay outside MongoDB through a provider abstraction.
- SVG requires dedicated validation/sanitization.
- Media Picker supplements manual URLs.
- Compatible Admin media fields should reuse `MediaField` rather than duplicate picker logic.
- Single-type and multi-type Media Picker filtering must remain server-backed so pagination/counts stay correct.
- Companion alt text from selected Media may only auto-fill when the existing alt field is blank.
- Referenced Media must be protected from normal deletion.
- Contact Messages remain raw enquiries; Leads remain CRM sales opportunities.
- Contact Message -> Lead conversion stays explicit and Admin-driven rather than automatic.
- `Lead.sourceContactMessage` remains the source-of-truth conversion relation; do not require a reverse Lead ID on ContactMessage unless a future feature justifies it.
- Historical Lead Service snapshots must be preserved when the relation is unchanged or cleared, and refreshed only when a genuinely different Service is linked.
- Avoid duplicate models where an existing module substantially owns the domain.
- Commit only verified work.
- Never run `npm audit fix --force` without review.

Documentation policy:

- `docs/PROJECT_MEMORY.md` is permanent memory.
- `docs/SESSION_HANDOFF.md` is current state.
- Do not update a large historical documentation matrix after every module.
- Legacy docs may become archive/read-only reference.

## Permanent Architectural Limitations

- Media reference details are capped at 25 displayed records even though deletion protection remains conservative.
- Media deletion has a narrow reference-check/provider-delete TOCTOU window.
- Older controllers are not uniformly as strict as newer Post/Media controllers.
- Navigation is registry-based, not arbitrary hierarchical navigation.

Temporary build/audit/test warnings belong in `SESSION_HANDOFF.md`.

## Remaining Roadmap

Approved order:

1. Certifications & Achievements
2. Service Packages / Pricing
3. FAQ
4. Clients / Partners
5. Case Studies
6. Appointment / Consultation Booking
7. Newsletter / Subscribers Management
8. Admin Analytics Dashboard
9. Admin Activity / Audit Log
10. Menu / Navigation Management

Overlap rules:

- Certifications/Achievements overlaps Education certificates and Experience achievements.
- Service Packages/Pricing must extend or relate to the existing Services domain rather than duplicate service definitions.
- Clients/Partners overlaps Companies, Projects, and Testimonials.
- Case Studies substantially overlaps Projects; prefer extension unless review justifies a separate module.
- Appointment/Consultation Booking is distinct from Contact Message inquiry capture even though both feed lead intake.
- Admin Analytics extends the existing dashboard.
- Audit Log is distinct from existing `createdBy`/`updatedBy`.
- Menu/Navigation must account for the existing Site Settings registry.
- Newsletter scope is subscriber management only.

## Future Separate Phases

After advanced modules:

- Professional UI/UX
- Email and Notifications
- Final SEO, testing, performance, and security
- Production deployment
