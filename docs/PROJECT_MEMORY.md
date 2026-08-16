# Project Memory

Last updated: 2026-08-16

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

Public content APIs are mainly `GET`; intentional public `POST` exceptions include Contact Messages, Service Orders, Appointments, and Newsletter Subscribers. Admin APIs live under `/api/admin/*`.

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

`hero`, `about`, `statistics`, `skills`, `services`, `projects`, `case-studies`, `education`, `experience`, `achievements`, `team`, `companies`, `clients-partners`, `posts`, `testimonials`, `faq`, `contact`, `blog`, `news`, `consultation`.

Registry controls:

- `isVisible`
- `isNavigationVisible`
- `isFooterNavigationVisible`
- `isPageVisible`
- `order`
- `navigationOrder`
- `footerNavigationOrder`
- `label`

`PublicPageVisibilityRoute` blocks disabled dedicated pages. It also supports an OR-style `sectionKeys` contract for intentionally shared canonical detail routes. Existing single-section guards retain their normal behavior.

Navbar, PublicPageHeader, Footer, homepage registry, route guards, and sitemap must stay aligned. Public navigation resolution is centralized client-side through `client/src/utils/publicNavigation.js`; canonical registered destinations remain code-owned while placement/labels/orders remain Admin-controlled.

Special cases:

- `posts`: combined homepage Articles & News; homepage-only and has no normal Navbar/Footer/dedicated-page destination
- `blog` / `news`: dedicated experiences
- `faq`: independent homepage/Navbar/public-page publication
- `clients-partners`: presentation layer over Company; independent collection publication while reusing canonical Company details
- `case-studies`: publication/presentation layer over Project; independent collection publication while reusing canonical Project details
- `consultation`: dedicated transactional page only; no homepage section; Navbar/Footer placement is optional and defaults hidden; page visibility remains Admin-controlled
- Hero/About/Contact: anchor-oriented
- Media/Contact Messages: Admin-only

## Menu / Navigation Management

Module 27 uses the existing `SiteSettings.sections` registry as the single navigation/publication source of truth. There is no separate `Menu`, `MenuItem`, `MenuGroup`, or menu-tree collection/API.

Registered section contract:

- `key`
- `label`
- `isVisible`
- `isNavigationVisible`
- `isFooterNavigationVisible`
- `isPageVisible`
- `order`
- `navigationOrder`
- `footerNavigationOrder`

Permanent rules:

- homepage, Navbar, Footer, and dedicated-page controls are independent
- canonical internal destinations are code-owned and are not freely editable Admin paths
- old Site Settings records remain compatible through canonical registry merging; no migration is required
- unknown registry keys and unsupported section properties are rejected by Admin validation
- section visibility fields require actual Booleans
- section order fields require bounded non-negative safe integers
- meaningful navigation changes are included in the existing transaction-coupled Site Settings Audit event using safe changed-field names only
- Audit never stores the full sections array, request body, URLs, or private Site Settings data
- sitemap remains publication/route-driven, not menu-driven

Shared client resolver:

`client/src/utils/publicNavigation.js`

It is the single client authority used by:

- `Navbar.jsx`
- `Footer.jsx`
- `PublicPageHeader.jsx`

The resolver owns:

- canonical destination/type
- safe public label fallback
- destination publication availability
- Navbar placement/order
- Footer placement/order
- active-route behavior

Publication rules:

- Hero/Home remains a valid homepage destination
- About/Contact anchors require their homepage section to be visible
- dedicated destinations require `isPageVisible !== false`
- Navbar additionally requires `isNavigationVisible !== false`
- Footer additionally requires `isFooterNavigationVisible !== false`

Canonical destination examples:

- `statistics` -> `/statistics`
- `skills` -> `/skills`
- `services` -> `/services`
- `projects` -> `/projects`
- `case-studies` -> `/case-studies`
- `companies` -> `/companies`
- `clients-partners` -> `/clients-partners`
- `blog` -> `/blog`
- `news` -> `/news`
- `consultation` -> `/consultation`

Shared canonical detail ownership remains unchanged:

- Project details -> `/projects/:slug`
- Company details -> `/companies/:slug`

Case Studies does not own `/case-studies/:slug`; Clients / Partners does not own `/clients-partners/:slug`.

Special capabilities:

- `posts`: homepage-only; no Navbar, Footer, or dedicated-page destination
- `statistics`: homepage + Navbar + Footer + dedicated page; Footer defaults hidden
- `consultation`: dedicated page + optional Navbar/Footer; both placements default hidden
- `blog` / `news`: Navbar + Footer + dedicated pages; no standalone homepage section
- `hero` / `about` / `contact`: homepage-oriented destinations

Footer safety:

- Quick Links use `isFooterNavigationVisible` + `footerNavigationOrder`
- Footer Services content availability is not coupled to the Services Quick Link placement
- Contact-targeting project CTA, legal links, and generated Contact fallback are suppressed when the Contact destination is unavailable
- non-Contact legal/platform links preserve existing URL safety

Accessibility preserved:

- semantic navigation
- skip-to-content
- mobile/desktop menu `aria-expanded` / `aria-controls`
- Escape close
- focus restoration
- outside-click cleanup
- mobile body-scroll cleanup
- visible keyboard focus

Intentionally deferred:

- arbitrary custom internal destinations
- custom/external navigation items
- nested menus/dropdowns
- drag-and-drop ordering
- separate desktop/mobile placement
- configurable featured/CTA menu styling
- menu-driven sitemap generation
- cross-runtime generation of shared server/client registry defaults

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


## Appointment / Consultation Booking

Model/collection: `Appointment` / `appointments`

Public terminology: `Consultation`

Public API:

`POST /api/appointments`

Admin API:

`/api/admin/appointments`

Public page:

`/consultation`

Admin pages:

- `/admin/appointments`
- `/admin/appointments/:id`

This module is request-based scheduling only. Public date/time values are preferences, not guaranteed or reserved slots.

Public timing:

- `preferredDate`: strict `YYYY-MM-DD`
- `preferredTime`: strict `HH:mm`
- `timezone`: IANA timezone string

Admin confirmed timing:

- `scheduledAt`: MongoDB Date

Statuses:

- `requested`
- `confirmed`
- `completed`
- `cancelled`
- `declined`
- `no-show`

Meeting types:

- `video-call`
- `phone-call`

Public fields:

- name
- email
- phone
- companyName
- service
- servicePackage
- preferredDate
- preferredTime
- timezone
- meetingType
- projectSummary
- message

Required public fields:

- name
- email
- preferredDate
- preferredTime
- timezone
- meetingType
- projectSummary

Phone is additionally required for `phone-call`.

Service/package rules:

- Service is optional
- ServicePackage is optional
- a submitted package requires a valid visible Service
- package must belong to the submitted Service
- both Service and ServicePackage must be public/visible
- server derives historical snapshots:
  - `serviceTitle`
  - `serviceSlug`
  - `servicePackageName`
  - `servicePackageSlug`

Public security/integrity:

- strict allowed-field validation
- unknown-field rejection
- real string-type checks
- normalization
- honeypot
- public rate limit: 5 requests per 15 minutes
- strict date/time/timezone validation
- preferred date cannot be in the past in the submitted timezone
- controlled ObjectId validation
- safe Mongoose validation errors with `fieldErrors`
- no Admin workflow fields leak publicly

Admin endpoints:

- `GET /api/admin/appointments`
- `GET /api/admin/appointments/:id`
- `PATCH /api/admin/appointments/:id`
- `DELETE /api/admin/appointments/:id`
- `POST /api/admin/appointments/:id/convert-to-lead`

Admin list filters include:

- page
- limit
- search
- status
- service
- assignedTo
- preferredDateFrom / preferredDateTo
- scheduledFrom / scheduledTo

RBAC:

- read: authenticated active Admin
- update/convert: `super-admin`, `admin`, `editor`
- delete: `super-admin`, `admin`

Lead conversion:

`Appointment -> Lead`

Source of truth:

`Lead.sourceAppointment`

There is intentionally no `Appointment.relatedLead`.

Permanent conversion rules:

- conversion is explicit/manual Admin action only
- `Lead.sourceAppointment` has a partial unique ObjectId index
- duplicate conversion returns conflict
- conversion preserves Appointment project summary and additional message within Lead limits
- priority, currency, estimated value, assignment, and follow-up fields are strictly validated
- conversion and Appointment transaction-touching protect delete-vs-convert races
- converted Appointment deletion is blocked with `409`
- ServiceOrder, ContactMessage, Appointment, and Lead remain separate domains

Publication / sitemap:

- registry key: `consultation`
- page-only publication key
- default `isVisible: false`
- default `isNavigationVisible: false`
- default `isPageVisible: true`
- no homepage Consultation section
- no required Navbar Consultation item
- Admin Site Settings controls dedicated-page visibility
- `/consultation` is included in sitemap only while page-visible
- no Appointment detail URLs are public or indexed
- existing SiteSettings records remain backward compatible through registry merge; no migration required

Services integration:

After package + design selection, existing order actions remain:

- `Order Now`
- `Order on WhatsApp`

An additive, visually secondary:

`Request a Consultation`

links to:

`/consultation?service=<service-slug>&package=<package-slug>`

The Consultation CTA is hidden when the Consultation page is publication-disabled.

Explicitly deferred from this module:

- realtime availability / slot locking
- business-hours / blackout / buffer engines
- Google Calendar
- email notifications
- meeting links
- public cancellation/rescheduling/tracking
- payments
- automatic Lead conversion
- Admin-user directory
- soft delete / generic workflow engine


## Newsletter / Subscribers Management

Model/collection: `Subscriber` / `subscribers`

Public API:

`POST /api/subscribers`

Admin API:

`/api/admin/subscribers`

Admin page:

`/admin/subscribers`

Subscriber is a separate domain from:

- ContactMessage
- Lead
- Appointment
- ServiceOrder
- AdminUser

The same email may independently exist in those other domains.

Statuses exactly:

- `active`
- `unsubscribed`

Core fields:

- `email`
- `status`
- `consentAccepted`
- `consentedAt`
- `subscribedAt`
- `unsubscribedAt`
- `createdAt`
- `updatedAt`

Email identity rules:

- required string
- trim
- lowercase
- maximum 254 characters
- validated email format
- one explicit unique DB index
- one normalized email = one Subscriber record
- the unique index remains the final duplicate/concurrency authority

Public body allowlist:

- `email`
- `consentAccepted`
- `website`

`website` is a honeypot field.

Public consent rules:

- consent must be present
- consent must be an actual Boolean
- consent must equal `true`
- string `"true"` and numeric `1` are invalid
- no unsafe string/Boolean coercion

Public rate limit:

- 5 requests per 15 minutes per IP

Valid public outcomes intentionally return the same anti-enumeration response:

```json
{
  "success": true,
  "message": "Your newsletter subscription request has been received."
}
```

The same HTTP `200` generic response is used for:

- new subscription
- already-active duplicate
- previously-unsubscribed reactivation
- honeypot submission

Public responses must not reveal Subscriber ID, status, timestamps, prior existence, or Admin metadata.

Subscription lifecycle:

New:

- status `active`
- `consentAccepted: true`
- fresh `consentedAt`
- fresh `subscribedAt`
- `unsubscribedAt: null`

Active duplicate:

- no duplicate record
- `consentedAt` unchanged
- `subscribedAt` unchanged
- `unsubscribedAt` unchanged
- harmless `updatedAt` touch is acceptable

Public resubscription after Admin unsubscribe:

- same Subscriber record
- status returns to `active`
- fresh public consent required
- fresh `consentedAt`
- fresh `subscribedAt`
- `unsubscribedAt: null`

Only fresh public consent may reactivate an unsubscribed Subscriber. Admin has no reactivation action.

Concurrency/integrity:

- public subscription resolution uses MongoDB/Mongoose transactions
- bounded retry covers duplicate/stale/transient transaction conditions
- transactional create, active same-document touch, and conditional reactivation are used
- concurrent creates converge to one record
- concurrent reactivations converge to one active record
- public success is not based only on a stale pre-delete read
- Admin delete also uses a transaction so delete-vs-public-subscribe ordering remains serializable

Admin endpoints:

- `GET /api/admin/subscribers`
- `PATCH /api/admin/subscribers/:id`
- `DELETE /api/admin/subscribers/:id`

There is intentionally no Admin create or separate Admin detail endpoint.

Admin list filters:

- `page`
- `limit`
- `search`
- `status`

Search targets normalized email only.

Admin update allowlist:

- `status`

Allowed Admin transition only:

`active -> unsubscribed`

Server owns `unsubscribedAt`.

RBAC:

- list/read: authenticated active Admin
- unsubscribe: `super-admin`, `admin`, `editor`
- delete: `super-admin`, `admin`

Concurrent Admin unsubscribe attempts resolve as one success and one `409`.

Public UI placement is intentionally compact and does not create a separate Newsletter content page/section:

- reusable `NewsletterSignupForm`
- compact form inside the Hero
- compact form in the Footer
- Hero layout uses one connected email-input + Subscribe control with consent directly below
- unique per-instance DOM IDs are required because Hero and Footer render the same form component

Newsletter intentionally has no:

- standalone homepage Newsletter registry item
- Navbar item
- `/newsletter` public page
- sitemap entry
- Newsletter Site Settings publication key

Future outbound marketing email is outside this module. Before outbound marketing is enabled, token-based public unsubscribe must be added in the later Email and Notifications phase.

Explicitly deferred:

- campaign model
- SMTP/provider integration
- email sending
- email verification/pending status
- public unsubscribe token
- raw-email public unsubscribe
- templates
- queues/workers
- scheduled campaigns
- open/click analytics
- segments/tags
- drip automation
- A/B testing


## Admin CMS Shell / Navigation

Professional UI/UX uses one shared authenticated Admin shell with centralized operational navigation, an analytics-first Dashboard, and progressively normalized module internals.

Verified UI checkpoint history:

- `351c425 Refine admin shell and analytics dashboard`
- `1051ec8 Document admin UI refinement milestone`
- `84334b8 Polish admin module interfaces`
- `23f54a1 Polish admin services and sales interfaces`
- `3116818 Document admin services and sales UI milestone`
- `80b412c Polish admin career content interfaces`
- `c7a479e Document admin career content UI milestone`
- `9e801a7 Polish admin supporting content interfaces`
- `f35e2f7 Document admin supporting content UI milestone`
- `5e48e33 Polish admin companies and posts interfaces`
- `5695156 Document admin companies and posts UI milestone`
- `89bd245 Polish admin contact messages interface`
- `0da2474 Document admin contact messages UI milestone`
- `5455e35 Polish admin detail interfaces`

The shared shell milestone is complete. Individual Admin module internal polish is active and is being completed in small verified batches without changing backend/API/business behavior.

Frontend architecture:

`client/src/components/admin/layout/AdminLayout.jsx`
`client/src/components/admin/layout/AdminSidebar.jsx`
`client/src/components/admin/layout/AdminMobileDrawer.jsx`
`client/src/components/admin/layout/AdminNavigation.jsx`
`client/src/components/admin/layout/AdminTopbar.jsx`
`client/src/components/admin/layout/adminIcons.jsx`
`client/src/config/adminNavigation.js`
`client/src/hooks/useAdminSidebarState.js`

Routing contract:

`ProtectedAdminRoute -> AdminLayout -> Outlet -> protected Admin page`

`/admin/login` remains outside the authenticated visual shell.

`/admin` redirects to `/admin/dashboard`.

The Admin operational navigation is code-owned and must remain separate from public `SiteSettings.sections` navigation/publication management.

Desktop sidebar contract:

Default desktop state is a compact approximately 72px icon rail.

Unpinned hover temporarily expands the rail without permanently consuming content width.

Keyboard focus inside the rail also expands it so navigation does not depend on hover.

Pinned mode keeps the rail expanded and shifts the shared content area appropriately.

Pinned preference remains stored in the versioned localStorage key:

`rakeshnexify_admin_sidebar_pinned_v1`

Sidebar width/label/color transitions must respect reduced-motion preferences.

Collapsed navigation items retain usable accessible names, visible focus treatment, and supplemental visual tooltips.

Controls with visible textual labels should normally derive their accessible name from that visible text. Explicit `aria-label` remains appropriate for genuinely icon-only controls.

Mobile/tablet contract:

Mobile uses an off-canvas drawer rather than desktop hover behavior.

The drawer preserves backdrop close, explicit close control, Escape handling, focus entry, focus trapping, focus restoration, route-click close, body-scroll lock, and cleanup.

If the viewport crosses into the desktop breakpoint while the drawer is open, the drawer must deactivate and release its scroll-lock/keyboard behavior.

Focus restoration must not force focus onto a trigger that is no longer visible or focusable after a breakpoint change.

Desktop and mobile reuse the same centralized Admin navigation configuration.

Each mounted `AdminNavigation` instance must generate unique DOM IDs for group labels and nested `aria-controls` targets so simultaneous desktop/mobile navigation instances never create duplicate IDs.

Admin navigation hierarchy remains centralized and role-aware.

Primary groups remain:

Dashboard
Content
Services & Sales
CRM
Team
Site
System

`Service Packages -> Package Designs` is the current intentional nested Admin navigation relationship.

Admin Activity / Audit Log navigation is visible only to `super-admin`; backend RBAC remains authoritative.

Admin page normalization contract:

The shared shell owns Admin branding, account identity, logout, global navigation, responsive layout, and sidebar spacing.

Individual Admin pages must not recreate global Admin shell chrome or compensate for the sidebar with manual layout margins.

Contextual back-to-module/list navigation on editors/details remains valid.

Page-specific loading/error states and module logic remain local to each page.

Presentation-only Admin module refinements should follow the established visual system:

- practical workspace width around `max-w-[1440px]`
- compact eyebrow/context line plus `2xl`/`3xl` page title rather than oversized hero treatment
- concise descriptions and right-aligned primary actions where appropriate
- filter surfaces generally use `rounded-2xl`, compact `p-4`/`p-5`, and consistent approximately 44px controls
- results toolbars keep counts/context compact and place refresh/actions predictably
- status badges use restrained semantic colors and compact radii
- content cards generally use `rounded-xl`/`rounded-2xl`; avoid unnecessary nested card-inside-card layouts
- destructive actions remain visually secondary to normal edit/open actions
- loading/error/empty/success states remain compact and accessible
- transitions and skeleton animation must respect reduced-motion preferences
- page-level horizontal overflow must not be introduced
- desktop/mobile layouts must remain practical with collapsed, hover-expanded, and pinned Admin sidebar states

Presentation polish must preserve existing API calls, query semantics, authentication, RBAC, routes, business logic, mutation behavior, and backend-authoritative permissions unless a concrete product requirement explicitly changes them.

Query-driven Admin pages must preserve URL/state synchronization. In particular, Package Designs supports `?servicePackage=<id>` and must react correctly to same-route query changes, Back/Forward navigation, and Clear behavior. The current implementation uses a `location.search`-keyed workspace remount so URL changes reinitialize filter state without a synchronous set-state effect.

Accessible loading semantics remain required even when visual skeletons are used; skeleton-only loading states should retain an appropriate programmatic status announcement when the prior experience exposed one.

Dashboard contract:

`/admin/dashboard` remains analytics-first.

Do not introduce a duplicate Management Modules navigation-card grid.

Module discovery belongs in the Admin sidebar.

Existing Analytics API/hook/business logic remains Dashboard-owned.

Supported Analytics ranges remain:

`7d`, `30d`, `90d`, `all`

The existing range transition, refresh, retry, stale-data protection, and unauthorized-session behavior must remain intact.

Dashboard visual treatment should remain professional and information-dense rather than using oversized hero headings/cards.

Analytics sections may be visually refined, but calculations, privacy rules, API contracts, status semantics, conversion semantics, and accessible trend data must not be changed merely for presentation.

The trend chart remains native SVG and must preserve an accessible title/description, visible legend, and tabular representation.

Theme contract:

There is currently no established full application dark-mode provider in the active architecture.

Do not introduce a global theme rewrite merely for the Admin shell.

The dark Admin navigation rail and light Admin content surfaces are intentional and may coexist until a later explicit theme-system milestone.

Completed Admin internal UI batches:

Batch 1 — commit `84334b8 Polish admin module interfaces`

- Services
- Subscribers
- Projects
- Leads / CRM

Batch 2 — commit `23f54a1 Polish admin services and sales interfaces`

- Service Packages
- Package Designs
- Service Orders
- Appointments / Consultations

Batch 3 — commit `80b412c Polish admin career content interfaces`

- Statistics
- Skills
- Education
- Experience

Batch 4 — commit `9e801a7 Polish admin supporting content interfaces`

- Certifications / Achievements
- Testimonials
- FAQs
- Team Members

Batch 5 — commit `5e48e33 Polish admin companies and posts interfaces`

- Companies
- Posts / Blog & News

Batch 6 — commit `89bd245 Polish admin contact messages interface`

- Contact Messages

Batch 7 — commit `5455e35 Polish admin detail interfaces`

- Appointment Detail
- Service Order Detail

All completed batches were manually browser-verified, targeted ESLint-clean, production-build verified, whitespace-checked, Codex-reviewed, committed, and pushed to `main`.

Batch 3 preserves the established list-page behavior, including filtered local collection updates for Skills, Education, and Experience, UTC month/year timeline formatting for Education/Experience, existing delete RBAC, and accessible reduced-motion-safe loading states.

Batch 4 preserves domain-specific list behavior rather than forcing one mutation pattern across modules: Certifications / Achievements and FAQs retain filtered local collection updates, while Testimonials and Team Members retain backend refresh after mutations. Achievement date-only rendering remains UTC-safe, Testimonial Project options remain independently loaded, FAQ pagination remains limit 20 with filter reset to page 1, and Team route-state/session-expiry handling remains intact.

Batch 5 preserves server-refresh mutation behavior for both Companies and Posts. Companies retain search/industry/relationship/status/visibility/featured filters, `owned`/`managed`/`partner`/`client`/`other` relationship semantics, `planned`/`active`/`inactive`/`archived` statuses, Admin+ delete RBAC, and Company-backed Clients / Partners meaning. Posts retain shared Blog/News ownership, strict `blog`/`news` type filtering, trimmed search/category/tag queries, explicit 403 action handling, Admin+ delete RBAC, and backend refresh after visibility/featured/delete mutations. Presentation fallbacks for Company logo/cover images and Post featured images remain UI-only.

Batch 6 preserves the operational Contact Messages workflow without forcing a single mutation strategy. Status changes and deletes retain backend refresh through `refreshKey`; private Admin-note saves retain local message/note-draft replacement without a list reload; and Contact Message -> Lead conversion remains explicit/manual, preserves the original Contact Message, and navigates to the created Lead editor. Conversion remains available to `super-admin`, `admin`, and `editor`, while permanent deletion remains restricted to `super-admin` and `admin`. Filters/pagination/status-card behavior and `/admin/contact-messages` session-expiry redirect semantics remain unchanged.

Batch 7 preserves behavior-sensitive detail workflows. Appointment Detail retains local merge after updates, explicit Appointment -> Lead conversion for all three Admin roles, linked-Lead rendering, current-path 401 redirect state, Admin+ deletion, and `409` backend-truth reconciliation for duplicate conversion or converted-Appointment delete conflicts. Preferred `YYYY-MM-DD` dates remain rendered without UTC date shifting. Service Order Detail retains immutable customer/project/commercial snapshots and the exact normal Admin update boundary of `status` + private `adminNotes`; snapshot price/billing/design values remain read-only and submission-derived, while permanent deletion remains Admin+ only.

Current UI/UX scope:

The shared Admin Shell + Sidebar + Analytics Dashboard refinement is complete.

Twenty-one Admin module pages have completed internal visual normalization across the first seven verified batches.

Individual Admin module internal polish remains active for the remaining Admin pages. Continue in safe batches and preserve the established shell and visual contract.

Backend APIs, authentication, RBAC, Analytics business logic, public navigation, and public-site behavior remain outside presentation-only Admin UI refinements.


## Admin Analytics Dashboard

Admin Analytics extends the existing protected Admin Dashboard.

Frontend location:

`/admin/dashboard`

There is intentionally no separate:

- `/admin/analytics` page
- frontend Analytics route
- public Analytics page

Admin API:

`GET /api/admin/analytics`

Authentication:

`requireAdminAuth`

All authenticated active Admin roles may read Analytics.

Allowed query exactly:

- `range`

Supported values exactly:

- `7d`
- `30d`
- `90d`
- `all`

Default:

`30d`

UTC range/bucket rules:

- `7d`: current UTC day + previous 6 UTC days; daily buckets
- `30d`: current UTC day + previous 29 UTC days; daily buckets
- `90d`: current UTC day + previous 89 UTC days; weekly buckets starting Monday
- `all`: no lower bound; current UTC upper bound; monthly buckets

Source timestamps:

- Service Orders: `createdAt`
- Appointments: `createdAt`
- Leads: `createdAt`
- Contact Messages: `createdAt`
- Subscriber activity: `subscribedAt`

Selected-range overview metrics:

- Orders
- Appointments
- Leads
- Contact Messages / Enquiries
- Subscriber activity

Current Subscriber snapshot is intentionally global and separate from the selected range:

- total
- active
- unsubscribed

Status breakdowns are zero-filled for known statuses:

- Service Orders
- Appointments
- Leads
- Contact Messages
- Subscriber activity

Trend rows are aggregate-only and contain:

- bucket start
- Orders
- Appointments
- Leads
- Contact Messages
- Subscriber activity

Conversion semantics:

Contact Message -> Lead:

- denominator = Contact Messages created in selected range
- numerator = those currently referenced by a surviving Lead through `sourceContactMessage`
- this is current conversion coverage, not immutable lifetime history

Appointment -> Lead:

- denominator = Appointments created in selected range
- numerator = those currently referenced by a surviving Lead through `sourceAppointment`
- this is current conversion coverage, not immutable lifetime history

Lead won rate:

`won / (won + lost)`

Only Leads created in the selected range are considered.

Lead source breakdown:

- selected-range Leads only
- normalized before grouping
- blank/missing/whitespace values converge to `unknown`
- bounded output

Estimated Pipeline Value:

- open Lead statuses only: `new`, `qualified`, `contacted`, `proposal`, `negotiation`
- only non-negative numeric `estimatedValue`
- grouped independently by currency
- currencies are never merged or converted
- this is explicitly estimated open pipeline value, not revenue/income/profit

Top Ordered Services:

- selected-range Service Orders only
- uses immutable Service snapshots
- canonical grouping identity is Service slug
- historical title changes do not create duplicate Service rows
- maximum five Services

Privacy/data-minimization:

Analytics responses are aggregate-only and must not expose customer/admin/subscriber identity or private text such as names, emails, phones, messages, project summaries, Lead requirement summaries, private/Admin notes, consent timestamps, or Admin identities.

Frontend architecture:

- `adminAnalyticsApi.js`
- `useAdminAnalytics.js`
- `AdminAnalyticsOverview.jsx`
- `AnalyticsTrendChart.jsx`
- integrated into existing `AdminDashboardPage.jsx`

The trend chart uses native SVG; no chart library is required. It includes an accessible title/description, visible legend, and tabular data representation.

Range-transition integrity:

- rendered Analytics data must match the currently selected range through `data.range.key`
- stale prior-range data must not render under a newly selected range
- stale requests remain abort-safe

Analytics indexes added for range performance:

- ServiceOrder: `{ createdAt: -1 }`
- Appointment: `{ createdAt: -1 }`
- Lead: `{ createdAt: -1 }`
- ContactMessage: `{ createdAt: -1 }`
- Subscriber: `{ subscribedAt: -1 }`

Intentionally deferred from this module:

- visitor/page-view analytics
- Google Analytics
- realtime analytics/WebSockets
- custom ranges
- comparison periods
- CSV/PDF export
- Content Overview
- payment/revenue analytics
- caching
- chart-library dependency
- Audit Log (implemented later as Module 26)
- Menu / Navigation Management (implemented later as Module 27)


## Admin Activity / Audit Log

Admin Activity / Audit Log is a dedicated internal, append-only audit domain. It is distinct from normal per-model fields such as `createdBy` / `updatedBy` and distinct from Admin Analytics.

Model/collection:

`AuditLog` / `audit_logs`

Admin read API:

- `GET /api/admin/audit-logs`
- `GET /api/admin/audit-logs/:id`

Admin pages:

- `/admin/audit-logs`
- `/admin/audit-logs/:id`

There is intentionally no public Audit API/page and no Admin Audit create/update/delete API.

RBAC:

- authentication: `requireAdminAuth`
- viewing: `super-admin` only
- frontend additionally hides/disables Audit UI for non-super-admin roles
- backend RBAC remains authoritative

Actor types:

- `admin`
- `system`
- `anonymous`

Admin actor role snapshots:

- `super-admin`
- `admin`
- `editor`

Categories:

- `authentication`
- `security`
- `content`
- `workflow`
- `configuration`
- `media`
- `subscriber`

Actions:

- `create`
- `update`
- `delete`
- `status-change`
- `assignment-change`
- `publish`
- `unpublish`
- `convert`
- `note-added`
- `upload`
- `unsubscribe`
- `login-success`
- `login-failed`
- `account-lock`

Outcomes:

- `success`
- `failure`
- `denied`

Controlled resource types:

- `admin-auth`
- `admin-user`
- `site-settings`
- `service`
- `service-package`
- `package-design`
- `service-order`
- `appointment`
- `contact-message`
- `lead`
- `subscriber`
- `media`
- `project`
- `statistic`
- `company`
- `team-member`
- `skill`
- `education`
- `experience`
- `certification-achievement`
- `testimonial`
- `faq`
- `post`

Privacy / minimization rules:

Audit records must never persist raw request bodies, passwords/password hashes, JWTs/tokens, Authorization headers, cookies, secrets, raw errors/stacks, unrestricted metadata, or private source-record content.

Examples that must not enter Audit payloads include:

- Contact Message name/email/phone/subject/message/Admin notes
- Appointment name/email/phone/project summary/message/Admin notes/cancellation text
- Lead name/email/phone/requirement summary/notes/lost-reason text
- Service Order customer information/requirements/Admin notes
- Subscriber email/consent details
- raw Media/provider payloads/credentials
- full Site Settings objects or secret-like values

Changes are restricted to approved safe field names and bounded safe `from` / `to` values. Metadata is allowlisted and bounded.

Request context is optional and sanitized:

- HTTP method
- route path without query string
- IP, respecting validated `TRUST_PROXY_HOPS`
- bounded User-Agent

Actor integrity:

- authenticated Admin identity comes from `req.admin`
- immutable name/email/role snapshots may be stored for Admin actors
- `req.adminAccessToken` is never logged
- unknown-login attempts use an anonymous actor and do not persist the supplied unknown email
- system/anonymous events do not invent Admin identity

Append-only contract:

- collection: `audit_logs`
- `createdAt` only; no normal `updatedAt`
- `versionKey: false`
- strict schema
- normal Mongoose update/replace/delete mutation paths are blocked
- direct MongoDB collection access / `bulkWrite` remains a documented low-level limitation

Transaction policy:

- database-only Admin mutations use the same Mongoose transaction/session for the primary mutation and required Audit insert
- required Audit failure aborts that database transaction
- no success event is emitted before primary success

External/auth side-effect policy:

- completed login success and externally irreversible Cloudinary upload/delete operations use best-effort Audit writes
- Audit outage must not falsely fail a successful primary auth/external side effect
- database metadata-only Media mutations remain transaction-coupled

Authentication events:

- successful login -> `login-success`
- known-account failed login -> `login-failed`
- threshold request that actually creates the lock -> `account-lock`
- threshold failure may intentionally emit both `login-failed` and `account-lock`

Noise policy:

Do not audit every GET, every 401/403, routine validation error, or routine not-found response. Audit meaningful Admin/security mutations and security events only.

Current covered Admin domains:

- Authentication / Admin security
- Service Orders
- Appointments
- Contact Messages
- Leads
- Subscribers
- Media
- Services
- Service Packages
- Package Designs
- Projects
- Site Settings
- Statistics
- Companies / Clients / Partners
- Team
- Skills
- Education
- Experience
- Certifications / Achievements
- Testimonials
- FAQ
- Posts / News

Admin list filters:

- `page`
- `limit`
- `search`
- `actorAdminId`
- `actorRole`
- `category`
- `action`
- `resourceType`
- `resourceId`
- `outcome`
- `dateFrom`
- `dateTo`

List behavior:

- newest-first
- max limit 100
- bounded search
- strict enum/ObjectId/date validation
- list excludes detail-only `changes`, metadata, and request context

Detail behavior:

- exposes only the sanitized Audit record
- may include safe changed fields/changes
- allowlisted metadata
- sanitized request context
- never enriches from the source resource

Frontend architecture:

- `adminAuditLogsApi.js`
- `useAdminAuditLogs.js`
- `useAdminAuditLog.js`
- `AdminAuditLogsPage.jsx`
- `AdminAuditLogDetailPage.jsx`
- routes under protected Admin routing
- Dashboard card visible only to `super-admin`
- desktop table + mobile cards
- read-only detail UI
- 401 logs out/redirects; 403 does not log out
- no Audit mutation controls

Current deliberate/deferred limitations:

- no TTL/retention policy yet
- no SIEM/export pipeline
- no cryptographic hash chain
- no request-ID correlation
- no public-form Audit
- public Subscriber create/reactivation Audit deferred
- direct collection/`bulkWrite` bypass remains possible at low level
- frontend/backend Audit enums are duplicated and must be coordinated if changed

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

Independent publication controls: homepage, Navbar, Footer, dedicated page, homepage order, Navbar order, Footer order, label.

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
- homepage, Navbar, Footer, and dedicated-page publication controls remain independent
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

Homepage, Navbar, Footer, and dedicated-page publication controls remain independent.

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

Major functional roadmap status: **27/27 planned modules complete**.


| Module | Public | Admin | Public Route / Notes |
| --- | --- | --- | --- |
| Site Settings | `/api/site-settings` | `/api/admin/site-settings` | Shared settings/publication |
| Menu / Navigation Management | reuses `/api/site-settings` | reuses `/api/admin/site-settings` | Registry-based Navbar/Footer/publication management; no separate Menu API |
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
| Appointment / Consultation Booking | `POST /api/appointments` | `/api/admin/appointments` | `/consultation`, `/admin/appointments`, `/admin/appointments/:id` |
| Newsletter / Subscribers | `POST /api/subscribers` | `/api/admin/subscribers` | Compact Hero + Footer signup; `/admin/subscribers`; no public Newsletter page |
| Admin Analytics Dashboard | None | `GET /api/admin/analytics` | Integrated into existing `/admin/dashboard`; private aggregate-only operational analytics |
| Admin Activity / Audit Log | None | `GET /api/admin/audit-logs`, `GET /api/admin/audit-logs/:id` | Super-admin-only, append-only internal Audit; `/admin/audit-logs`, `/admin/audit-logs/:id` |
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
- shared `publicNavigation.js` resolver for canonical public navigation destinations, placement, ordering, publication, and active state
- `PublicPageVisibilityRoute`, including explicit shared-route `sectionKeys`
- `PageSeo`
- dynamic sitemap
- slug/private identity patterns
- strict request validation
- API services + abort/stale-safe hooks
- Admin list/editor/form patterns
- loading/error/empty states
- Contact Message -> Lead conversion
- Appointment -> Lead manual conversion with `Lead.sourceAppointment`
- CRM notes/follow-up patterns
- Media Picker/reference protection
- transactional parent guards
- immutable server-derived snapshots
- Services query-state pattern
- collection-level structured data
- canonical shared-detail publication pattern for overlapping public collections
- aggregate-only Admin analytics with UTC range contracts, bounded response normalization, abort-safe hooks, and range-key stale-data gating
- append-only privacy-safe Admin Audit logging with transaction-coupled DB mutations, best-effort external/auth events, strict RBAC, and read-only UI

## Long-Term Decisions

- runtime/repository outranks docs
- keep client/server separation and minimal `App.jsx`
- keep Express app separate from startup
- manage reasonable content dynamically through Admin
- preserve JWT/RBAC/security middleware
- keep homepage/Navbar/Footer/public-page controls independent
- keep `SiteSettings.sections` as the navigation/publication source of truth; do not introduce a second Menu domain without a concrete requirement
- keep canonical registered internal destinations code-owned; Admin controls labels, placement, ordering, and publication rather than arbitrary route strings
- keep Navbar and Footer placement/order independent
- keep public navigation resolution centralized through `publicNavigation.js`
- keep routing/SEO/sitemap aligned with publication state
- Blog and News share one `Post`
- Media binaries stay outside MongoDB
- SVG needs dedicated validation/sanitization
- Media Picker supplements manual URLs
- referenced Media remains deletion-protected
- ContactMessage and Lead remain separate
- ContactMessage -> Lead stays explicit/manual
- Appointment remains separate from ContactMessage, ServiceOrder, and Lead
- Appointment scheduling remains request-based; preferred public date/time is not a guaranteed slot
- Appointment -> Lead stays explicit/manual through `Lead.sourceAppointment`
- Newsletter Subscriber remains separate from ContactMessage, Lead, Appointment, ServiceOrder, and AdminUser
- Subscriber email identity is normalized and uniquely indexed; public duplicate/resubscribe outcomes remain anti-enumeration safe
- Subscriber reactivation requires fresh public Boolean consent; Admin cannot reactivate
- Subscriber create/reactivation and Admin delete concurrency remains transaction-protected
- Newsletter public UX stays compact in Hero + Footer without a separate Newsletter route/registry/sitemap entry
- Admin Analytics extends the existing `/admin/dashboard`; do not create a duplicate Analytics management page without a concrete future requirement
- Admin Analytics remains aggregate-only and PII-minimized; operational estimates must not be labelled as revenue
- Analytics date ranges remain server-defined UTC contracts: 7d/30d/90d/all
- Admin Audit remains a separate append-only domain from normal model audit fields and Admin Analytics
- Audit viewing remains super-admin-only; frontend hiding is defense-in-depth and backend RBAC is authoritative
- DB-only audited mutations must couple the primary mutation and Audit insert in the same transaction/session
- completed auth/external side effects use best-effort Audit so Audit failure does not falsely fail primary success
- Audit payloads remain allowlisted, bounded, and privacy-minimized; never store raw request bodies/tokens/private source content
- converted Appointment deletion remains protected
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
- keep the shared authenticated Admin shell centralized through `AdminLayout`; protected pages should not recreate global Admin chrome
- keep Admin operational navigation code-owned in `adminNavigation.js` and separate from public Site Settings navigation/publication
- keep `/admin/dashboard` analytics-first; module discovery/navigation belongs in the Admin sidebar rather than a duplicate Dashboard management grid
- preserve desktop collapsed/hover/pinned and mobile off-canvas behavior when extending the Admin shell
- commit only verified work
- never run `npm audit fix --force` without controlled review

## Permanent Architectural Limitations

- Media reference details cap at 25 displayed records
- Media deletion has a narrow reference-check/provider-delete TOCTOU window
- older controllers are not uniformly as strict as newer modules
- navigation is registry-based, not arbitrary hierarchical navigation
- server/client canonical registry defaults are duplicated and must remain coordinated until a cross-runtime generation strategy is justified
- `Company.relationship` is single-valued
- Project `clientName` is plain text; no formal Project-to-Company relation exists
- `TRUST_PROXY_HOPS` depends on deployment topology
- Audit append-only protection does not prevent privileged direct MongoDB collection access / `bulkWrite`

Temporary warnings belong in `SESSION_HANDOFF.md`.

## Documentation Policy

`PROJECT_MEMORY.md`: permanent architecture, reusable systems, decisions, limitations, completed inventory, roadmap.

`SESSION_HANDOFF.md`: current implementation/review/validation, working tree, temporary warnings/data, immediate next actions.

Do not recreate a large historical documentation matrix after every module.

## Remaining Roadmap

All 27 planned major functional modules are complete.

No additional major functional module remains in the current functional roadmap. Continue with the separate finishing phases below.

## Current / Future Separate Phases

- Professional UI/UX — active
- Professional UI/UX — completed: shared Admin shell/sidebar + analytics Dashboard refinement
- Professional UI/UX — completed Admin internal batches: Services, Subscribers, Projects, Leads / CRM, Service Packages, Package Designs, Service Orders, Appointments / Consultations, Statistics, Skills, Education, Experience, Certifications / Achievements, Testimonials, FAQs, Team Members, Companies, Posts / Blog & News, Contact Messages, Appointment Detail, Service Order Detail
- Professional UI/UX — remaining: remaining individual Admin module internal polish, then public-site visual polish
- Email and Notifications
- Final SEO/testing/performance/security
- Production deployment
