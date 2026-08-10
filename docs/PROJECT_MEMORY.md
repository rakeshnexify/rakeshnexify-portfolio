# Project Memory

Last updated: 2026-08-10

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

Public content APIs mainly use `GET`. Public contact submission and public Service Order submission are intentional `POST` exceptions.

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
- CertificationAchievement `identityKey`

## Site Settings and Publication System

`SiteSettings` is the shared database-backed website configuration system.

Registry keys include:

`hero`, `about`, `statistics`, `skills`, `services`, `projects`, `education`, `experience`, `achievements`, `team`, `companies`, `posts`, `testimonials`, `contact`, `blog`, `news`.

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
- Certifications & Achievements
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

Exact Media URL references are checked across Site Settings, Services, Statistics, Skills, Education, Experience, Certifications & Achievements, Testimonials, Posts, Projects, Companies, Team, and Package Designs.

Referenced Media is blocked from normal permanent deletion with `409 Conflict`.

See `Permanent Architectural Limitations` for the current reference-detail cap and deletion TOCTOU window.


## Service Packages, Pricing, Package Designs, and Orders

The Services domain now supports a complete dynamic package-pricing and ordering flow without duplicating Service definitions.

Ownership:

`Service -> ServicePackage -> PackageDesign`

Orders are stored independently as `ServiceOrder`.

### ServicePackage

Model: `ServicePackage`

Collection: `service_packages`

Public API:

- `GET /api/service-packages`
- `GET /api/service-packages/:serviceSlug/:group/:packageSlug`

Admin API:

- `/api/admin/service-packages`

Admin routes:

- `/admin/service-packages`
- `/admin/service-packages/new`
- `/admin/service-packages/:id/edit`

Supported package groups:

- `development`
- `management`

Pricing modes:

- `fixed`
- `starting-from`
- `custom`

Billing cycles:

- `one-time`
- `monthly`
- `yearly`
- `custom`

Core package data includes:

- required Service relation
- group
- name
- slug
- short/full description
- pricing mode
- numeric price
- currency
- optional price label
- billing cycle/label
- structured comparison features
- best-for text
- delivery/support/revision labels
- badge
- CTA label
- `whatsappEnabled`
- order
- featured/visible state
- Admin audit fields
- timestamps

Package slugs are unique within the owning Service + group scope.

ServicePackage create/reassignment and Service deletion use a shared transactional parent-guard protocol. A Service cannot be deleted while packages reference it, including relevant create/delete races.

Public package results require both the package and parent Service to be visible.

Public ordering is deterministic and keeps featured packages before display order.

RBAC:

- read: any authenticated active Admin
- create/update: `super-admin`, `admin`, `editor`
- permanent delete: `super-admin`, `admin`

### PackageDesign

Model: `PackageDesign`

Collection: `package_designs`

Public API:

- `GET /api/package-designs`
- `GET /api/package-designs/:serviceSlug/:group/:packageSlug/:designSlug`

Admin API:

- `/api/admin/package-designs`

Admin routes:

- `/admin/package-designs`
- `/admin/package-designs/new`
- `/admin/package-designs/:id/edit`

PackageDesign belongs only to ServicePackage; Service ownership is always derived through the package rather than duplicated.

Core data includes:

- required ServicePackage relation
- name
- slug
- private normalized identity key
- short/full description
- thumbnail URL/alt
- responsive screenshots with device + order
- live-demo URL/label
- order
- default/featured/visible state
- Admin audit fields
- timestamps

Supported screenshot devices:

- `desktop`
- `tablet`
- `mobile`

Exactly one default design per package is enforced through transactional switching plus a database uniqueness rule.

PackageDesign create/reassignment and ServicePackage deletion use a shared transactional parent-guard protocol so relevant races cannot create orphaned designs.

Public PackageDesign results require the design, ServicePackage, and Service to all be visible.

Media reference protection includes:

- `PackageDesign.thumbnailUrl`
- `PackageDesign.screenshots.url`

RBAC:

- read: any authenticated active Admin
- create/update: `super-admin`, `admin`, `editor`
- permanent delete: `super-admin`, `admin`

### Public Services / Pricing Experience

The public `/services` page now owns the package-selection flow.

Current functional flow:

`All Services -> Service -> Development/Management -> Compare Packages -> Choose Package -> Choose Design -> Responsive Preview -> Order`

The current interaction contract is intentionally simple:

- before package selection, the user compares package rows/features
- after package selection, the comparison is hidden
- the selected package remains visible with a Change Package action
- the next phase contains only design selection
- design cards are intentionally compact
- selected designs expose Desktop/Tablet/Mobile screenshot viewing
- long screenshots scroll vertically inside the preview
- Live Demo is shown when available
- Order buttons appear only after a design is selected
- website Order and WhatsApp Order remain separate actions

Shareable query state:

- `service`
- `group`
- `package`
- `design`

Query-only navigation is configured not to force unwanted scroll-to-top behavior.

Desktop uses a sticky Services sidebar. Mobile uses a narrow sliding Services drawer with Service -> Package Type navigation. The current mobile sidebar has user-tuned compact typography and must be preserved from the repository rather than replaced from an older generated copy.

A later all-project Professional UI/UX phase may polish presentation, but this functional interaction structure is considered complete unless a concrete issue is found.

### WhatsApp Ordering

WhatsApp ordering is separate from website ServiceOrder submission.

The WhatsApp number comes from dynamic Site Settings rather than a hard-coded private number.

The Package's `whatsappEnabled` flag is respected.

The message includes the current Service, Package, Price, Design, and shareable selected Services URL. The user manually sends the message in WhatsApp.

### ServiceOrder

Model: `ServiceOrder`

Collection: `service_orders`

Public API:

- `POST /api/service-orders`

There is intentionally no public ServiceOrder list or detail endpoint.

Admin API:

- `GET /api/admin/service-orders`
- `GET /api/admin/service-orders/:id`
- `PATCH /api/admin/service-orders/:id`
- `DELETE /api/admin/service-orders/:id`

Admin routes:

- `/admin/service-orders`
- `/admin/service-orders/:id`

ServiceOrder is the actual package-order domain.

ContactMessage remains the raw inquiry domain.

Lead remains the CRM/sales-opportunity domain.

A public order contains customer-submitted:

- name
- email
- phone / WhatsApp
- optional company
- project requirements
- optional preferred start date
- optional customer notes
- selected ServicePackage ID
- optional selected PackageDesign ID

The server must not trust public client claims for Service/package/design identity or commercial details.

Before persistence the backend resolves current visible database records and derives immutable historical snapshots for:

- Service title/slug
- Package name/slug/group
- pricing mode
- price/currency/price label
- billing cycle/label
- Design name/slug/thumbnail
- selected Services URL path

This preserves the commercial record even if live Service/Package/Design content changes later.

Public ServiceOrder creation uses a strict body allowlist, ObjectId validation, structured field validation, Service/Package/Design visibility and ownership checks, and submission rate limiting.

Order numbers use a unique database index and bounded collision retries.

ServiceOrder statuses:

- `new`
- `reviewing`
- `confirmed`
- `in-progress`
- `completed`
- `cancelled`
- `rejected`

Admin PATCH intentionally allows only:

- `status`
- private `adminNotes`

Customer data and historical snapshots are not editable through the Admin update endpoint.

RBAC:

- read: any authenticated active Admin
- update: `super-admin`, `admin`, `editor`
- permanent delete: `super-admin`, `admin`

The Admin UI supports:

- order listing
- order-number/customer/service search
- status/group/service filters
- pagination
- order detail
- status update
- private Admin notes
- role-restricted deletion

### Order Rate Limiting and Proxy Trust

ServiceOrder public submission is protected by `express-rate-limit`.

Express proxy trust is deployment-aware through:

`TRUST_PROXY_HOPS`

Rules:

- missing value defaults to `0`
- accepted values are validated whole-number hop counts from `0` through `10`
- invalid values fail startup
- unconditional `trust proxy: true` is not used
- `app.set("trust proxy", trustProxyHops)` uses the validated value

`server/.env.example` documents:

`TRUST_PROXY_HOPS=0`

Production deployment must set the actual trusted proxy-hop count based on the real hosting topology.

### Order Dialog Accessibility

The public website Order modal includes:

- `role="dialog"`
- `aria-modal="true"`
- title association
- labelled close control
- initial focus
- Tab / Shift+Tab focus containment
- Escape close when safe
- background body-scroll lock
- focus restoration to the Order Now opener
- sensible success-state focus


## Certifications & Achievements

Certifications & Achievements is the dedicated independently publishable credential-and-recognition domain.

Model: `CertificationAchievement`

Collection: `certification_achievements`

Public API:

- `GET /api/achievements`

Admin API:

- `/api/admin/achievements`

Public page:

- `/achievements`

Admin routes:

- `/admin/achievements`
- `/admin/achievements/new`
- `/admin/achievements/:id/edit`

Homepage/publication registry key:

`achievements`

Site Settings content field:

`achievementsSection`

Default homepage placement:

`Education -> Experience -> Certifications & Achievements -> Team`

### Domain Ownership

Education remains responsible for formal academic, course, training, and learning records, including its supporting `certificateUrl`.

Experience remains responsible for short job-context achievement bullets attached to a professional role.

`CertificationAchievement` owns independently publishable or verifiable:

- certifications
- licenses
- awards
- achievements

There is no automatic migration, copy, synchronization, or dual-write between Education, Experience, and CertificationAchievement.

### Supported Types

Locked values:

- `certification`
- `license`
- `award`
- `achievement`

Issuer rules:

- certification -> issuer required
- license -> issuer required
- award -> issuer required
- achievement -> issuer optional

### Core Data Contract

Supported fields include:

- `type`
- `title`
- `slug`
- private normalized `identityKey`
- `issuerName`
- `shortDescription`
- `description`
- `issueDate`
- `doesNotExpire`
- `expirationDate`
- `credentialId`
- `verificationUrl`
- `mediaUrl`
- `mediaAlt`
- optional `relatedEducation`
- optional `relatedExperience`
- `order`
- `isFeatured`
- `isVisible`
- `createdBy`
- `updatedBy`
- timestamps

`identityKey` is private and must not be exposed in public or Admin API responses.

Slug and identity uniqueness are protected by database indexes and duplicate conflicts map to structured `409` responses.

Dates are date-only values. Expiration filtering uses the intended UTC+05:45 business-date boundary and treats the expiration date itself as active through that date.

### Public Behavior

Only visible records are exposed publicly.

Public ordering is:

1. featured first
2. display order
3. newest issue date

The public API supports the four locked type filters.

There is intentionally no public detail endpoint or per-record public route in the initial architecture.

The public `/achievements` page provides collection-level SEO and structured data. Image structured data is emitted only for recognized image/SVG evidence, not PDF or arbitrary non-image evidence.

The sitemap includes `/achievements` only while the public page is enabled. No per-record sitemap URLs exist.

### Admin Behavior and RBAC

Read:

- any authenticated active Admin

Create/update:

- `super-admin`
- `admin`
- `editor`

Permanent delete:

- `super-admin`
- `admin`

Admin management supports search, type, visibility, featured, and active/expired filtering.

Optional Education and Experience relations are selectors only; they do not transfer domain ownership or create dual-write behavior.

### Evidence Media

`mediaUrl` supports Media Picker selection and compatible manual external URLs.

Admin and public rendering support:

- image/SVG preview
- PDF/document evidence link
- safe external evidence link
- broken-image fallback

Media reference protection includes `CertificationAchievement.mediaUrl`, so referenced Media is blocked from normal permanent deletion.

### Publication Controls

The `achievements` registry item has independent controls for:

- homepage visibility
- Navbar visibility
- dedicated public-page visibility
- homepage order
- navigation order
- label

Disabling the dedicated public page removes broken Navbar/Footer/CTA destinations while allowing homepage visibility to remain independently controlled.


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
| Service Packages / Pricing | `ServicePackage` / `service_packages` | `/api/service-packages` | `/api/admin/service-packages` | Integrated into `/services` | `/admin/service-packages`, `/admin/service-packages/new`, `/admin/service-packages/:id/edit`; Service-owned development/management pricing packages with comparison features and transactional parent guards |
| Package Designs | `PackageDesign` / `package_designs` | `/api/package-designs` | `/api/admin/package-designs` | Integrated into `/services` | `/admin/package-designs`, `/admin/package-designs/new`, `/admin/package-designs/:id/edit`; default/featured/visible designs, Media screenshots, live demos, transactional parent guards |
| Service Orders | `ServiceOrder` / `service_orders` | `POST /api/service-orders` | `/api/admin/service-orders` | Website order flow in `/services` | `/admin/service-orders`, `/admin/service-orders/:id`; server-derived historical snapshots, statuses, private Admin notes, rate-limited public create |
| Statistics | `Statistic` / `statistics` | `/api/statistics` | `/api/admin/statistics` | `/statistics` | Admin list/create/edit routes |
| Projects | `Project` / `projects` | `/api/projects` | `/api/admin/projects` | `/projects`, `/projects/:slug` | Admin list/create/edit; Media Picker integrated |
| Companies | `Company` / `companies` | `/api/companies` | `/api/admin/companies` | `/companies`, `/companies/:slug` | Admin list/create/edit; Media Picker integrated |
| Contact Messages | `ContactMessage` / `contact_messages` | `POST /api/contact-messages` | `/api/admin/contact-messages` | Homepage contact workflow | `/admin/contact-messages`; rate-limited public inquiry |
| Leads / CRM | `Lead` / `leads` | None | `/api/admin/leads` | None | `/admin/leads`, `/admin/leads/new`, `/admin/leads/:id/edit`; manual Contact Message conversion, pipeline/follow-up, assignment, Service snapshots, private CRM notes |
| Team | `TeamMember` / `teamMembers` | `/api/team` | `/api/admin/team` | `/team`, `/team/:slug` | `/admin/team`, `/admin/team/new`, `/admin/team/:id/edit`; relations to Projects, Companies, Services; Media Picker integrated |
| Skills | `Skill` / `skills` | `/api/skills` | `/api/admin/skills` | `/skills` | `/admin/skills`, `/admin/skills/new`, `/admin/skills/:id/edit`; private `nameKey` |
| Education | `Education` / `education` | `/api/education` | `/api/admin/education` | `/education` | `/admin/education`, `/admin/education/new`, `/admin/education/:id/edit`; private `identityKey` |
| Experience | `Experience` / `experiences` | `/api/experience` | `/api/admin/experience` | `/experience` | `/admin/experience`, `/admin/experience/new`, `/admin/experience/:id/edit`; private `identityKey` |
| Certifications & Achievements | `CertificationAchievement` / `certification_achievements` | `/api/achievements` | `/api/admin/achievements` | `/achievements` | `/admin/achievements`, `/admin/achievements/new`, `/admin/achievements/:id/edit`; locked types, optional Education/Experience relations, evidence Media, private `identityKey` |
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
- transactional parent-guard pattern for relation create/reassignment versus parent deletion
- server-derived immutable commercial snapshot pattern for Service Orders
- public Services query-state selection pattern

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
- Education retains formal learning records, Experience retains role-context achievement bullets, and CertificationAchievement owns independently publishable certifications/licenses/awards/achievements.
- Do not auto-sync or dual-write CertificationAchievement records with Education or Experience.
- Avoid duplicate models where an existing module substantially owns the domain.
- Commit only verified work.
- Never run `npm audit fix --force` without review.

- Service remains the master Service definition; ServicePackage extends Service pricing/package choices rather than duplicating Service.
- PackageDesign belongs only to ServicePackage; do not duplicate Service ownership on PackageDesign.
- ServicePackage and PackageDesign parent-deletion races must continue using their shared transactional guard protocols.
- ServiceOrder is separate from ContactMessage and Lead.
- Public ServiceOrder creation must derive Service/package/design commercial snapshots server-side rather than trusting client-supplied names/prices.
- Customer/order historical snapshots remain immutable through normal Admin order maintenance.
- Website Order and WhatsApp Order remain separate flows.
- Production proxy trust must use the narrowly configured `TRUST_PROXY_HOPS` value; do not switch to unconditional `trust proxy: true`.
- Preserve the current simple three-phase public flow: Compare Package -> Choose Design -> Order.
- Public Services query changes should not force unwanted scroll-to-top behavior.
- The current user-tuned mobile Services sidebar/menu should be preserved from the repository during future changes.

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
- `TRUST_PROXY_HOPS` is deployment-topology-specific; default `0` is correct for direct/local traffic but production must set the real trusted hop count.

Temporary build/audit/test warnings belong in `SESSION_HANDOFF.md`.

## Remaining Roadmap

Approved order:

1. FAQ
2. Clients / Partners
3. Case Studies
4. Appointment / Consultation Booking
5. Newsletter / Subscribers Management
6. Admin Analytics Dashboard
7. Admin Activity / Audit Log
8. Menu / Navigation Management

Overlap rules:

- Clients/Partners overlaps Companies, Projects, and Testimonials.
- Case Studies substantially overlaps Projects; prefer extension unless review justifies a separate module.
- Appointment/Consultation Booking is distinct from Contact Message inquiry capture and ServiceOrder package ordering even though all may feed future lead intake.
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
