# Project Memory

Last updated: 2026-08-11

## Purpose

Long-term architecture memory for the RakeshNexify MERN Portfolio. Keep permanent contracts/decisions here; runtime logs and temporary issues belong in `docs/SESSION_HANDOFF.md`.

Active memory files:

- `docs/PROJECT_MEMORY.md`
- `docs/SESSION_HANDOFF.md`

## Source of Truth

Priority:

1. verified runtime/database
2. current repository
3. Git status/diff/history
4. `PROJECT_MEMORY.md`
5. `SESSION_HANDOFF.md`
6. archived docs
7. old chat history

Runtime/repository wins when docs disagree.

## Project Identity

Project: `RakeshNexify MERN Portfolio and Admin CMS`
Repository: `D:\rakeshnexify-portfolio`
Branch: `main`

Purpose: production-oriented portfolio + Admin CMS with dynamic content, publication controls, SEO, reusable Media Management, and business-management modules.

## Stack

Frontend: React, Vite, React Router, Tailwind CSS, JavaScript.
Backend: Node.js, Express, MongoDB Atlas, Mongoose, REST APIs.
Security: JWT, bcrypt, RBAC, Helmet, CORS, rate limiting, env validation.
Media: Cloudinary, Multer, `file-type`, `@file-type/xml`, `sanitize-html`.

## Repository Conventions

Client:

- keep `client/src/App.jsx` minimal
- use dedicated `pages`, `components`, `services`, `hooks`, `utils`, `context`, `routes`, `config`

Server:

- use `models`, `controllers`, `routes`, `services`, `middleware`, `config`
- `server/src/app.js`: Express/security/middleware/routes/client delivery/errors
- `server/src/server.js`: startup validation, MongoDB, HTTP startup, graceful shutdown

## Authentication / RBAC / Security

Admin bearer JWT is required for protected APIs.

Roles:

- `super-admin`
- `admin`
- `editor`

Default RBAC:

- read: authenticated active Admin
- create/update: all three roles
- delete: `super-admin`, `admin`

Preserve JWT validation, active Admin lookup, password-change invalidation, bcrypt cost 12, account locking, Helmet, CORS, rate limiting, env validation, and resource-specific public throttles. Secrets stay outside committed source.

## API Conventions

Public content APIs are mainly `GET`; intentional public `POST` exceptions include Contact Messages and Service Orders. Admin APIs live under `/api/admin/*`.

Success shape:

```json
{"success":true,"data":{},"message":"Optional","count":0,"pagination":{}}
```

Error shape:

```json
{"success":false,"message":"Error message","fieldErrors":{}}
```

Newer modules should use editable-field allowlists, strict query/body validation, controlled ObjectId checks, structured field errors, and controlled duplicate/reference conflicts. Do not silently coerce malformed request data.

## Database Conventions

Default intended DB: `rakeshnexify_portfolio` on MongoDB Atlas.

General patterns:

- explicit collection names where useful
- timestamps, `versionKey: false`
- server-controlled audit fields (`createdBy`, `updatedBy`)
- visibility/featured/order controls
- unique slugs for detail routes
- private normalized identity keys where useful
- relation validation and indexes for uniqueness/filtering/publication/search

Private identity examples: Skill `nameKey`; Education/Experience/CertificationAchievement `identityKey`; FAQ `questionKey` and `categoryKey`.

## Site Settings / Publication

`SiteSettings` is the shared DB-backed website configuration system.

Registry keys include:

`hero`, `about`, `statistics`, `skills`, `services`, `projects`, `case-studies`, `education`, `experience`, `achievements`, `team`, `companies`, `clients-partners`, `posts`, `testimonials`, `faq`, `contact`, `blog`, `news`.

Registry controls:

- `isVisible`
- `isNavigationVisible`
- `isPageVisible`
- `order`
- `navigationOrder`
- `label`

`PublicPageVisibilityRoute` blocks disabled dedicated pages. It also supports an OR-style `sectionKeys` contract for intentionally shared canonical detail routes. Existing single-section guards retain their normal behavior.

Navbar, PublicPageHeader, Footer, homepage registry, route guards, and sitemap must stay aligned.

Special cases:

- `posts`: combined homepage Articles & News
- `blog` / `news`: dedicated experiences
- `faq`: independent homepage/Navbar/public-page publication
- `clients-partners`: presentation layer over Company; independent collection publication while reusing canonical Company details
- `case-studies`: publication/presentation layer over Project; independent collection publication while reusing canonical Project details
- Hero/About/Contact: anchor-oriented
- Media/Contact Messages: Admin-only

## SEO / Sitemap

`PageSeo.jsx` handles title, description, keywords, canonical, robots, Open Graph, Twitter metadata, social image, and JSON-LD. Managed JSON-LD must update/clean on route changes.

Sitemap must respect publication state, record visibility, supported detail routes, and shared canonical-detail publication rules.

## Media Management

Media is Admin-only.

Model/collection: `Media` / `media`
Admin API/page: `/api/admin/media`, `/admin/media`
No public Media API/page.

Cloudinary stores binaries; MongoDB stores metadata/provider references.

Supported: JPG/JPEG, PNG, WebP, AVIF, sanitized SVG, PDF, MP3, WAV, OGG, M4A, MP4, WebM.

Default limits:

- image 10 MB
- SVG 5 MB
- document 20 MB
- audio 50 MB
- video 100 MB

Preserve authenticated/RBAC multipart handling, random temp files, signature inspection, MIME/extension checks, dangerous-extension rejection, filename/size safety, SVG sanitization, temp/provider cleanup, HTTPS URLs, and overwrite protection.

Reusable Media Picker:

- `MediaField`
- `MediaPicker`
- `MediaPickerModal`
- `useMediaPicker`

Contract:

- `mediaType` = one type
- `mediaTypes` = many types
- mutually exclusive
- invalid/blank multi-type filters -> structured `400`
- result/count filtering must match
- manual URLs remain supported where appropriate
- selected Media alt text only fills blank companion alt fields
- project video URLs remain hybrid uploaded/external

Referenced Media is blocked from normal deletion. Coverage includes Site Settings, Services, Statistics, Skills, Education, Experience, Achievements, Testimonials, Posts, Projects, Companies, Team, and Package Designs.

## Service Packages / Pricing / Designs / Orders

Ownership:

`Service -> ServicePackage -> PackageDesign`

`ServiceOrder` is separate.

### ServicePackage

Collection: `service_packages`
Public/Admin APIs: `/api/service-packages`, `/api/admin/service-packages`

Groups: `development`, `management`
Pricing: `fixed`, `starting-from`, `custom`
Billing: `one-time`, `monthly`, `yearly`, `custom`

Permanent rules:

- Service is master owner
- slug unique within Service + group
- public package requires visible package + visible Service
- create/reassignment vs parent delete uses transactional guard
- delete permission: Admin+

### PackageDesign

Collection: `package_designs`
Public/Admin APIs: `/api/package-designs`, `/api/admin/package-designs`

Permanent rules:

- belongs only to ServicePackage; Service ownership is derived
- exactly one default design per package is transaction/DB protected
- public design requires visible design + package + Service
- create/reassignment vs parent delete uses transactional guard
- Media references include thumbnail/screenshots

### Public Services Flow

Accepted functional flow:

`Compare Package -> Choose Design -> Order`

Shareable query: `service`, `group`, `package`, `design`.

Preserve package comparison before selection, selected package + Change Package, compact design cards, responsive screenshot previews, long screenshot scroll, Live Demo, Order after design selection, separate website/WhatsApp order, no unwanted query-navigation scroll reset, sticky desktop sidebar, and current user-tuned mobile Services navigation.

Professional UI redesign is deferred until advanced modules finish.

### ServiceOrder

Collection: `service_orders`
Public: `POST /api/service-orders`
Admin: `/api/admin/service-orders`
No public order list/detail.

Domain split:

- ContactMessage = raw inquiry
- Lead = CRM opportunity
- ServiceOrder = package order

Permanent rules:

- server resolves visible Service/package/design
- server derives immutable commercial snapshots
- never trust client-supplied commercial identity/price data
- order number uses unique index + bounded retries
- Admin PATCH only status/private notes
- customer/snapshot data immutable through normal Admin maintenance
- public submission rate-limited

Statuses: `new`, `reviewing`, `confirmed`, `in-progress`, `completed`, `cancelled`, `rejected`.

Proxy trust uses validated `TRUST_PROXY_HOPS`: default `0`, integer `0..10`, invalid startup failure, never unconditional `trust proxy: true`.

Order modal accessibility must preserve dialog semantics, labelled title/close, focus entry/trap/restore, safe Escape close, body-scroll lock, and success-state focus.

## Certifications & Achievements

Model/collection: `CertificationAchievement` / `certification_achievements`
Public/Admin APIs: `/api/achievements`, `/api/admin/achievements`
Public page: `/achievements`

Types: `certification`, `license`, `award`, `achievement`.

Ownership:

- Education = formal learning
- Experience = role-context achievements
- CertificationAchievement = independently publishable certification/license/award/achievement
- no automatic migration/sync/dual-write

Permanent rules:

- private `identityKey`
- optional Education/Experience relations are selectors only
- date-only behavior; active/expired uses intended UTC+05:45 business-date boundary
- visible-only public output
- collection-only initial public page
- publication-aware sitemap
- evidence supports image/SVG/PDF/external
- referenced evidence Media is protected

## Leads / CRM

Model/collection: `Lead` / `leads`
Admin API: `/api/admin/leads`
No public Lead API/page.

ContactMessage remains raw enquiry; Lead is CRM opportunity.

Conversion:

`POST /api/admin/contact-messages/:id/convert-to-lead`

Permanent rules:

- conversion is manual/Admin-driven
- ContactMessage remains unchanged
- `Lead.sourceContactMessage` is source-of-truth
- partial unique index prevents duplicate conversion
- manual Leads may share email
- private CRM notes are server-authored with Admin identity/time

Statuses: `new`, `qualified`, `contacted`, `proposal`, `negotiation`, `won`, `lost`, `archived`.
Priorities: `low`, `medium`, `high`, `urgent`.

Historical Service snapshots:

- same relation -> preserve snapshot
- changed relation -> refresh from new Service
- cleared relation -> relation null, previous snapshot remains

## FAQ Management

FAQ is collection-only.

Model/collection: `Faq` / `faqs`
Public API: `GET /api/faqs`
Admin API: `/api/admin/faqs`
Public page: `/faq`
Admin routes: `/admin/faqs`, `/admin/faqs/new`, `/admin/faqs/:id/edit`

There is intentionally no `/faq/:slug`.

Core fields: question, private `questionKey`, answer, dynamic category, private `categoryKey`, order, featured/visible state, audit fields, timestamps.

Permanent rules:

- category remains dynamic text
- duplicate normalized question protected by unique DB index
- private keys never leak
- sync Mongoose normalization hook must not use callback-style `next()`
- public/Admin query values are strict single values
- Admin question/answer/category must be actual strings
- malformed arrays/objects/repeated values return structured errors

Public filters: search, category, featured. Only visible FAQs are public.

Default homepage placement:

`Testimonials -> FAQ -> Contact`

`/faq` supports search, dynamic category filtering, native accessible accordion, loading/error/empty states, and collection-level SEO.

RBAC:

- read: authenticated active Admin
- create/update: all Admin roles
- delete: `super-admin`, `admin`

FAQ Site Settings content: eyebrow, heading, description, CTA label, CTA URL.

Independent publication controls: homepage, Navbar, dedicated page, homepage order, navigation order, label.

If `/faq` public page is disabled:

- route blocked
- Navbar/Footer page links removed
- sitemap entry removed
- homepage FAQ may remain
- homepage CTA to `/faq` hides

SEO: canonical `/faq`, collection-level `FAQPage` JSON-LD from visible public FAQ data only. Sitemap contains `/faq` only; no per-record FAQ URLs.

## Clients / Partners

Clients / Partners is intentionally a presentation/publication layer over the existing `Company` domain.

There is no separate Client, Partner, or ClientPartner model/collection/API/Admin CRUD.

Canonical organization source:

`Company`

Relationship mapping:

- client: `Company.relationship === "client"`
- partner: `Company.relationship === "partner"`

Public collection page:

`/clients-partners`

There is intentionally no:

`/clients-partners/:slug`

Canonical detail identity remains:

`/companies/:slug`

Admin management remains:

`/admin/companies`

Permanent rules:

- only visible Companies with relationship `client` or `partner` appear in the Clients / Partners homepage section and collection page
- compact Clients / Partners cards must link to canonical Company detail URLs
- homepage preview sorts featured first, then order, then name
- dedicated page supports All / Clients / Partners filters
- registry key is `clients-partners`
- Site Settings content field is `clientsPartnersSection`
- homepage, Navbar, and dedicated-page publication controls remain independent
- disabling Clients / Partners public page does not globally hide Company records from the Companies module
- homepage CTA to `/clients-partners` must hide if that page is publication-disabled

Shared canonical-detail publication rule:

- Companies ON -> all visible Company detail profiles may remain public/indexable
- Companies OFF + Clients & Partners ON -> only visible `client`/`partner` Company details may remain public/indexable
- Companies OFF + Clients & Partners OFF -> no Company detail route/sitemap publication through these modules
- `/companies` collection remains controlled only by Companies
- `/clients-partners` collection remains controlled only by Clients & Partners

SEO:

- canonical `/clients-partners`
- collection-level `CollectionPage`
- `mainEntity` uses `ItemList`
- ItemList entries point to canonical `/companies/:slug`
- sitemap contains `/clients-partners` when enabled
- no duplicate `/clients-partners/:slug` sitemap URLs

Known deliberate limitation:

`Company.relationship` is single-valued, so one Company cannot simultaneously be both client and partner. Migrate to a multi-value relationship model only if a real requirement emerges.

## Case Studies

Case Studies is intentionally a publication/presentation layer over the existing `Project` domain.

There is no separate CaseStudy model, MongoDB collection, API, Admin CRUD, or detail route.

Canonical content source:

`Project`

Embedded Project publication metadata:

```js
caseStudy: {
  isPublished: false,
  isFeatured: false,
  order: 0
}
```

Legacy Projects missing `caseStudy` metadata are treated as unpublished and unfeatured.

`Project.isFeatured` and `Project.caseStudy.isFeatured` are intentionally independent.

Existing `links.caseStudyUrl` remains an external-link field only.

Public collection page:

`/case-studies`

There is intentionally no:

`/case-studies/:slug`

Canonical detail identity remains:

`/projects/:slug`

Admin management remains:

- `/admin/projects`
- `/admin/projects/new`
- `/admin/projects/:id/edit`

Public Case Study query:

`GET /api/projects?caseStudy=true`

Public Case Study filtering:

- Project must be `isVisible: true`
- `caseStudy.isPublished` must be explicitly `true`

Sort priority:

1. `caseStudy.isFeatured` descending
2. `caseStudy.order` ascending
3. Project `order` ascending
4. `createdAt` ascending

Admin rules:

- Case Study publish/featured/order live in existing Project forms/listing
- Admin listing supports publication/featured filters and quick actions
- unpublishing clears Case Study featured state in the UI
- partial nested Case Study PATCH uses dotted paths so omitted sibling metadata is preserved
- normal Project featured state remains independent

Registry key:

`case-studies`

Site Settings content field:

`caseStudiesSection`

Default homepage placement:

`Projects -> Case Studies -> Education`

Homepage, Navbar, and dedicated-page publication controls remain independent.

Homepage CTA behavior is target-aware:

- disabling `/case-studies` hides a CTA only when its resolved destination is the disabled Case Studies route
- valid external/contact/other destinations may remain visible

Shared canonical-detail publication rule:

- Projects ON -> all visible Project details may remain public/indexable
- Projects OFF + Case Studies ON -> only visible Projects with `caseStudy.isPublished === true` may remain available at `/projects/:slug`
- Projects OFF + Case Studies OFF -> Project details are blocked through these publication paths
- `/projects` collection remains controlled only by Projects
- `/case-studies` collection remains controlled only by Case Studies

SEO:

- canonical `/case-studies`
- collection-level `CollectionPage`
- nested `ItemList`
- ItemList entries use absolute canonical `/projects/:slug` URLs
- successful empty collections may emit zero-item structured data
- loading/terminal error states do not emit Case Studies collection JSON-LD
- no duplicate `/case-studies/:slug`

Sitemap follows the same four-state Projects/Case Studies publication matrix as routing.

Accessibility:

- Case Study category filters expose group semantics and `aria-pressed` state

Known deliberate limitation:

Project `clientName` remains plain text; Case Studies does not introduce a new Project-to-Company relation. Add a formal relation only when a real requirement justifies it.

## Completed Module Inventory

| Module | Public | Admin | Public Route / Notes |
| --- | --- | --- | --- |
| Site Settings | `/api/site-settings` | `/api/admin/site-settings` | Shared settings/publication |
| Services | `/api/services` | `/api/admin/services` | `/services` |
| Service Packages | `/api/service-packages` | `/api/admin/service-packages` | Services pricing layer |
| Package Designs | `/api/package-designs` | `/api/admin/package-designs` | Services design layer |
| Service Orders | public POST | `/api/admin/service-orders` | Services order flow |
| Statistics | `/api/statistics` | `/api/admin/statistics` | `/statistics` |
| Projects | `/api/projects` | `/api/admin/projects` | `/projects`, slug detail |
| Case Studies | reuses `/api/projects?caseStudy=true` | reuses `/admin/projects` | `/case-studies`, Project-backed publication layer |
| Companies | `/api/companies` | `/api/admin/companies` | `/companies`, canonical slug detail |
| Clients / Partners | reuses `/api/companies` | reuses `/admin/companies` | `/clients-partners`, Company-backed presentation layer |
| Contact Messages | public POST | `/api/admin/contact-messages` | Contact workflow |
| Leads / CRM | None | `/api/admin/leads` | Admin-only |
| Team | `/api/team` | `/api/admin/team` | `/team`, slug detail |
| Skills | `/api/skills` | `/api/admin/skills` | `/skills` |
| Education | `/api/education` | `/api/admin/education` | `/education` |
| Experience | `/api/experience` | `/api/admin/experience` | `/experience` |
| Achievements | `/api/achievements` | `/api/admin/achievements` | `/achievements` |
| Testimonials | `/api/testimonials` | `/api/admin/testimonials` | `/testimonials` |
| FAQ | `GET /api/faqs` | `/api/admin/faqs` | `/faq`, collection-only |
| Blog / News | `/api/posts` | `/api/admin/posts` | listing + slug detail |
| Media | None | `/api/admin/media` | Admin-only |
| Admin Auth | None | `/api/admin/auth` | `/admin/login` |

## Reusable Systems

Prefer extending:

- Admin auth/RBAC
- Site Settings/publication registry
- `PublicPageVisibilityRoute`, including explicit shared-route `sectionKeys`
- `PageSeo`
- dynamic sitemap
- slug/private identity patterns
- strict request validation
- API services + abort/stale-safe hooks
- Admin list/editor/form patterns
- loading/error/empty states
- Contact Message -> Lead conversion
- CRM notes/follow-up patterns
- Media Picker/reference protection
- transactional parent guards
- immutable server-derived snapshots
- Services query-state pattern
- collection-level structured data
- canonical shared-detail publication pattern for overlapping public collections

## Long-Term Decisions

- runtime/repository outranks docs
- keep client/server separation and minimal `App.jsx`
- keep Express app separate from startup
- manage reasonable content dynamically through Admin
- preserve JWT/RBAC/security middleware
- keep homepage/Navbar/public-page controls independent
- keep routing/SEO/sitemap aligned with publication state
- Blog and News share one `Post`
- Media binaries stay outside MongoDB
- SVG needs dedicated validation/sanitization
- Media Picker supplements manual URLs
- referenced Media remains deletion-protected
- ContactMessage and Lead remain separate
- ContactMessage -> Lead stays explicit/manual
- Lead Service snapshots follow locked preservation rules
- Education/Experience/Achievement ownership stays distinct
- Service remains master Service; PackageDesign belongs only to ServicePackage
- parent races use transactional guards
- ServiceOrder remains distinct from ContactMessage/Lead
- ServiceOrder commercial snapshots are server-derived/immutable
- website and WhatsApp orders remain separate
- proxy trust remains deployment-aware
- preserve accepted Services flow and user-tuned mobile navigation
- FAQ remains collection-only with dynamic categories
- FAQ request validation must not reintroduce silent string coercion
- FAQ publication flags remain independent
- Clients / Partners reuses Company and must not duplicate organization identity
- Company detail routes may be shared across public collections only with relationship-aware publication and matching sitemap behavior
- Case Studies reuses Project and must not duplicate Project identity/content ownership
- Project detail routes may be shared across Projects and Case Studies only with record-aware publication and matching sitemap behavior
- Project Case Study featured state remains independent from normal Project featured state
- commit only verified work
- never run `npm audit fix --force` without controlled review

## Permanent Architectural Limitations

- Media reference details cap at 25 displayed records
- Media deletion has a narrow reference-check/provider-delete TOCTOU window
- older controllers are not uniformly as strict as newer modules
- navigation is registry-based, not arbitrary hierarchical navigation
- `Company.relationship` is single-valued
- Project `clientName` is plain text; no formal Project-to-Company relation exists
- `TRUST_PROXY_HOPS` depends on deployment topology

Temporary warnings belong in `SESSION_HANDOFF.md`.

## Documentation Policy

`PROJECT_MEMORY.md`: permanent architecture, reusable systems, decisions, limitations, completed inventory, roadmap.

`SESSION_HANDOFF.md`: current implementation/review/validation, working tree, temporary warnings/data, immediate next actions.

Do not recreate a large historical documentation matrix after every module.

## Remaining Roadmap

1. Appointment / Consultation Booking
2. Newsletter / Subscribers Management
3. Admin Analytics Dashboard
4. Admin Activity / Audit Log
5. Menu / Navigation Management

Overlap rules:

- Appointment/Consultation is distinct from Contact Messages and Service Orders
- Admin Analytics extends dashboard
- Audit Log is distinct from audit fields
- Menu/Navigation must account for Site Settings registry
- Newsletter scope is subscriber management only

## Future Separate Phases

- Professional UI/UX
- Email and Notifications
- Final SEO/testing/performance/security
- Production deployment
