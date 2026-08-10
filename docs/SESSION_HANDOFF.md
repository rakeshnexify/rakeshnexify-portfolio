# Session Handoff

Last updated: 2026-08-10

## Current Project State

Project: `RakeshNexify MERN Portfolio and Admin CMS`

Repository: `D:\rakeshnexify-portfolio`

Branch: `main`

Latest verified pushed checkpoint before the current module:

`b6e9efe Add certifications and achievements management module`

Current completed-but-not-yet-committed module:

`Service Packages / Pricing / Package Designs / Service Orders`

The module is implemented end-to-end, manually runtime-tested, reviewed by Codex in read-only mode, and the two recommended final-review findings have been fixed and re-reviewed.

Latest user-run validation after the final Codex fixes:

- `npm run check` — passed
- Vite production build — passed
- 230 modules transformed
- all ServicePackage, PackageDesign, and ServiceOrder backend syntax checks — passed
- existing project syntax checks — passed
- `git diff --check` — no actual whitespace errors

Known non-blocking output:

- client production bundle remains above Vite's recommended 500 kB chunk threshold
- CRLF-to-LF Git messages are informational line-ending warnings

Current Codex verdict:

`VERDICT: READY`

No blocking or recommended review issue remains.

The active closeout state is:

`documentation update -> final Git validation/staging -> commit/push`

Do not reopen implementation unless a new concrete failure is discovered.

## Domain Architecture

The completed ownership chain is:

`Service -> ServicePackage -> PackageDesign`

Service remains the master Service definition.

ServicePackage extends Service with pricing/package choices.

PackageDesign belongs only to ServicePackage; Service is derived through the package and is not duplicated as PackageDesign ownership.

Website package orders are stored in the separate:

`ServiceOrder`

ContactMessage remains the raw enquiry domain.

Lead remains the CRM/sales-opportunity domain.

ServiceOrder is the actual website package-order domain.

## ServicePackage

Model:

`ServicePackage`

Collection:

`service_packages`

Groups:

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

Public API:

- `GET /api/service-packages`
- `GET /api/service-packages/:serviceSlug/:group/:packageSlug`

Admin API:

- `/api/admin/service-packages`

Admin routes:

- `/admin/service-packages`
- `/admin/service-packages/new`
- `/admin/service-packages/:id/edit`

Core behavior includes:

- required Service parent
- Service/group-scoped package slug uniqueness
- structured package comparison features
- price/currency/price labels
- billing labels
- best-for/delivery/support/revision labels
- badges and CTA labels
- `whatsappEnabled`
- order/featured/visible state
- strict Admin validation
- deterministic public sorting
- visible Package + visible parent Service requirement

A shared transactional ServicePackage parent-guard protocol protects:

- package create/reassignment
- Service deletion
- relevant create/delete races

A Service cannot be deleted while packages reference it.

RBAC:

- read: authenticated active Admin
- create/update: `super-admin`, `admin`, `editor`
- delete: `super-admin`, `admin`

## PackageDesign

Model:

`PackageDesign`

Collection:

`package_designs`

Public API:

- `GET /api/package-designs`
- `GET /api/package-designs/:serviceSlug/:group/:packageSlug/:designSlug`

Admin API:

- `/api/admin/package-designs`

Admin routes:

- `/admin/package-designs`
- `/admin/package-designs/new`
- `/admin/package-designs/:id/edit`

Core behavior includes:

- required ServicePackage parent
- no duplicated Service ownership
- scoped slug/name identity protection
- thumbnail Media URL
- responsive screenshots
- supported devices: desktop/tablet/mobile
- live-demo URL/label
- order/default/featured/visible state

Exactly one default design per package is protected through transaction-safe switching plus a database uniqueness rule.

A shared transactional PackageDesign parent-guard protocol protects:

- design create/reassignment
- ServicePackage deletion
- relevant create/move/delete races

Public visibility requires:

- visible PackageDesign
- visible ServicePackage
- visible Service

Media reference protection includes:

- `PackageDesign.thumbnailUrl`
- `PackageDesign.screenshots.url`

RBAC:

- read: authenticated active Admin
- create/update: `super-admin`, `admin`, `editor`
- delete: `super-admin`, `admin`

## Public Services / Pricing Flow

Public route:

`/services`

The current functional flow is intentionally simple:

`All Services -> Service -> Development/Management -> Compare Packages -> Choose Package -> Choose Design -> Responsive Preview -> Order`

Before package selection:

- package comparison is visible
- Development/Management package groups are available
- mobile comparison supports horizontal viewing

After package selection:

- package comparison disappears
- selected package remains visible with a checkmark
- Change Package is available
- the next visible phase is Choose Design

Design phase:

- compact design cards
- user explicitly chooses a design
- Desktop/Tablet/Mobile preview controls
- long screenshots scroll vertically in the preview
- Live Demo when configured
- Order actions appear only after design selection

Shareable query state:

- `service`
- `group`
- `package`
- `design`

Query-only navigation does not intentionally reset the page to the top.

Desktop:

- sticky Services sidebar

Mobile:

- narrow sliding Services drawer
- Service -> Package Type submenu
- drawer remains open while navigating its Service/Package Type submenu
- closes only by intentional outside/close action
- sticky Services Menu remains available during page scrolling

Important:

The user manually tuned the current mobile `ServicePricingSidebar.jsx` typography/spacing after generated iterations.

Future work must use the current repository file as source of truth and must not replace it from an older generated artifact.

The overall all-module Professional UI/UX redesign is intentionally deferred until the advanced module roadmap is complete. This Services package flow is functionally accepted and should not be redesigned during normal module development.

## WhatsApp Ordering

Website Order and WhatsApp Order are separate.

WhatsApp:

- uses dynamic Site Settings `contact.whatsapp`
- respects `ServicePackage.whatsappEnabled`
- includes Service
- includes Package
- includes Price
- includes Design
- includes selected public Services URL
- opens WhatsApp with a prefilled message
- user manually sends the message

No private WhatsApp number is hard-coded in the ordering component.

## ServiceOrder

Model:

`ServiceOrder`

Collection:

`service_orders`

Public API:

`POST /api/service-orders`

There is intentionally no public order list or detail API.

Admin API:

- `GET /api/admin/service-orders`
- `GET /api/admin/service-orders/:id`
- `PATCH /api/admin/service-orders/:id`
- `DELETE /api/admin/service-orders/:id`

Admin routes:

- `/admin/service-orders`
- `/admin/service-orders/:id`

### Public Order Contract

Customer-submitted fields:

- ServicePackage ID
- optional PackageDesign ID
- name
- email
- phone / WhatsApp
- optional company
- project requirements
- optional preferred start date
- optional notes

The backend must not trust public claims for:

- Service name
- Package name
- Package price
- currency
- billing details
- Design name
- selected Services path

The server resolves current visible records and derives historical snapshots for:

- Service title/slug
- Package name/slug/group
- pricing mode
- price/currency/price label
- billing cycle/label
- Design name/slug/thumbnail
- selected Services path

Public creation validates:

- strict body allowlist
- non-object bodies
- ObjectIds
- name/email/phone
- requirements
- optional company/start date/notes
- visible ServicePackage
- visible parent Service
- selected PackageDesign ownership and visibility

Order number behavior:

- `RN-YYYYMMDD-######`
- unique database index
- bounded collision retries

Statuses:

- `new`
- `reviewing`
- `confirmed`
- `in-progress`
- `completed`
- `cancelled`
- `rejected`

### ServiceOrder Admin Contract

Read:

- authenticated active Admin

Update:

- `super-admin`
- `admin`
- `editor`

Delete:

- `super-admin`
- `admin`

Normal Admin PATCH intentionally allows only:

- status
- private `adminNotes`

Customer data and historical snapshots are immutable through the Admin update API.

Admin UI supports:

- list
- search
- status filter
- group filter
- Service filter
- pagination
- detail view
- status update
- private Admin notes
- role-restricted delete

## Rate Limiting and Proxy Trust

Public ServiceOrder submission is rate-limited.

Final Codex review identified deployment-aware proxy trust as a recommended pre-commit fix.

That fix is complete.

`server/src/app.js` now uses:

`TRUST_PROXY_HOPS`

Behavior:

- missing value -> `0`
- accepted whole-number values -> `0` through `10`
- invalid value -> startup failure
- no unconditional `trust proxy: true`
- validated value passed to `app.set("trust proxy", trustProxyHops)`

`server/.env.example` documents:

`TRUST_PROXY_HOPS=0`

Local/direct traffic therefore uses the safe default `0`.

Production deployment must set the real trusted proxy hop count for the actual hosting topology.

## Public Order Dialog Accessibility

The final Codex review also identified the Order modal's focus behavior as a recommended pre-commit fix.

That fix is complete.

Current modal behavior includes:

- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby`
- labelled close control
- initial focus
- Tab and Shift+Tab focus containment
- Escape close when safe
- body-scroll lock while open
- focus restoration to the Order Now opener
- success-state focus

Real ServiceOrder submission and separate WhatsApp ordering remain unchanged.

## Runtime Verification

### ServicePackage

Verified:

- Admin create/read/update/delete
- public visibility
- duplicate/conflict handling
- Service reference deletion protection
- create/reassignment versus Service-delete concurrency behavior
- Admin UI
- package comparison data

Result:

`FULL PASS`

### PackageDesign

Verified:

- Admin create/read/update/delete
- public list/detail
- default switching
- duplicate/default rollback behavior
- visibility
- ServicePackage deletion protection
- create versus package-delete race
- reassignment versus destination-package-delete race
- Media reference protection
- Admin UI + Media Picker

Result:

`FULL PASS`

### Public Services / Pricing

Verified through iterative browser testing:

- desktop package flow
- mobile package flow
- query-state navigation
- scroll-reset correction
- sticky desktop Services navigation
- sticky mobile Services Menu
- mobile drawer behavior
- package comparison
- selected-package phase
- compact design cards
- responsive screenshot previews
- long screenshot scrolling
- Live Demo
- separate Order and WhatsApp actions

The current clean three-phase flow was accepted by the user.

### ServiceOrder Backend

Real public runtime create returned:

- `success: true`
- generated RN order number
- `status: new`
- correct MERN Stack Development Service snapshot
- correct Professional Package snapshot
- correct NPR 30000 price
- correct Modern Store Design snapshot
- correct selected Services path

Temporary backend test order:

`RN-20260810-266474`

Admin runtime verification passed:

- GET by ID
- status `new -> reviewing`
- Admin Notes save
- search by order number
- delete
- post-delete count `0`

The temporary backend test order was deleted.

### ServiceOrder Frontend

Real website Order Now submission passed.

Frontend-created test order:

`RN-20260810-145160`

Verified:

- real modal form
- real POST `/api/service-orders`
- MongoDB persistence
- success state
- real Order Number
- no WhatsApp redirect from website submission

### Admin Service Orders UI

The frontend-created order `RN-20260810-145160` was used for the final Admin UI test.

Verified:

- Dashboard Service Orders card
- order listing
- order-number search
- status/group/Service filters
- Open Order
- customer data
- package/design snapshots
- project requirement
- status update
- private Admin Notes
- refresh persistence
- delete
- post-delete absence

Result:

`FULL PASS`

The frontend-created test order was deleted during Admin UI cleanup.

## Codex Review Status

Codex is review-only unless the user explicitly changes that role.

### Previous PackageDesign backend checkpoint

A findings:

None.

B findings:

None.

Verdict:

`PACKAGEDESIGN BACKEND READY`

### Final complete module review

A MUST FIX:

None.

B RECOMMENDED:

1. deployment-aware proxy handling for ServiceOrder rate limiting
2. public Order modal dialog/focus accessibility

C OPTIONAL:

- automated API tests
- automated browser coverage
- route-level code splitting later

The two B findings were fixed by ChatGPT.

### Focused re-review of both B fixes

1. Proxy/rate-limit finding:

`CLOSED`

2. Order modal accessibility finding:

`CLOSED`

Codex explicitly reported:

`NO BLOCKING OR RECOMMENDED ISSUES REMAIN FROM THE PREVIOUS REVIEW.`

Final verdict:

`VERDICT: READY`

Do not repeat a broad Codex review for this completed module unless a new concrete issue appears.

## Validation State

Latest validation after the final B fixes:

`npm run check`

Result:

`PASS`

Vite:

- 230 modules transformed
- production build passed

`git diff --check`

Result:

- no actual whitespace error
- line-ending warnings only

Known non-blocking project-wide warning:

- production client bundle remains above Vite's recommended 500 kB chunk threshold

## Current Working Tree Scope

The current module has not yet received its final commit.

Expected current working tree includes ServicePackage, PackageDesign, ServiceOrder, Admin UI, public pricing UI, routing, and supporting modifications.

Important modified/shared files include:

- `client/src/pages/ServicesPage.jsx`
- `client/src/pages/admin/AdminDashboardPage.jsx`
- `client/src/routes/AppRoutes.jsx`
- `package.json`
- `server/src/app.js`
- `server/src/controllers/adminService.controller.js`
- `server/src/models/Service.js`
- `server/src/services/mediaReference.service.js`
- `server/.env.example`

Important new client areas include:

- `client/src/components/admin/service-packages/`
- `client/src/components/admin/package-designs/`
- `client/src/components/services/pricing/`
- `client/src/hooks/useServicePackages.js`
- `client/src/hooks/usePackageDesigns.js`
- `client/src/pages/admin/AdminServicePackagesPage.jsx`
- `client/src/pages/admin/AdminServicePackageEditorPage.jsx`
- `client/src/pages/admin/AdminPackageDesignsPage.jsx`
- `client/src/pages/admin/AdminPackageDesignEditorPage.jsx`
- `client/src/pages/admin/AdminServiceOrdersPage.jsx`
- `client/src/pages/admin/AdminServiceOrderDetailPage.jsx`
- `client/src/services/adminServicePackagesApi.js`
- `client/src/services/adminPackageDesignsApi.js`
- `client/src/services/adminServiceOrdersApi.js`
- `client/src/services/servicePackagesApi.js`
- `client/src/services/packageDesignsApi.js`
- `client/src/services/serviceOrdersApi.js`
- `client/src/utils/servicePackageForm.js`
- `client/src/utils/packageDesignForm.js`

Important new server areas include:

- `server/src/models/ServicePackage.js`
- `server/src/models/PackageDesign.js`
- `server/src/models/ServiceOrder.js`
- `server/src/controllers/servicePackage.controller.js`
- `server/src/controllers/adminServicePackage.controller.js`
- `server/src/controllers/packageDesign.controller.js`
- `server/src/controllers/adminPackageDesign.controller.js`
- `server/src/controllers/serviceOrder.controller.js`
- `server/src/controllers/adminServiceOrder.controller.js`
- `server/src/routes/servicePackage.routes.js`
- `server/src/routes/adminServicePackage.routes.js`
- `server/src/routes/packageDesign.routes.js`
- `server/src/routes/adminPackageDesign.routes.js`
- `server/src/routes/serviceOrder.routes.js`
- `server/src/routes/adminServiceOrder.routes.js`
- `server/src/services/servicePackageParentGuard.service.js`
- `server/src/services/packageDesignParentGuard.service.js`
- `server/src/middleware/serviceOrderRateLimiter.js`

Use live Git commands as the source of truth for exact path count and diff totals.

Do not copy a hard-coded staged-path count from an older module handoff.

## Runtime Data Notes

The original low-level backend PackageDesign runtime test data was explicitly cleaned.

The two ServiceOrder runtime test orders were also explicitly deleted:

- `RN-20260810-266474`
- `RN-20260810-145160`

Public UI testing created package/design content such as:

- Starter
- Professional
- Premium
- Monthly Care
- Modern Store
- Classic Store

Those records were used to exercise the real public flow and were not explicitly removed in the recorded session.

Treat current MongoDB contents as runtime source of truth.

Do not blindly delete those package/design records during Git closeout. Review them separately as content if production content cleanup is desired.

## Documentation State

Active development-memory files:

- `docs/PROJECT_MEMORY.md`
- `docs/SESSION_HANDOFF.md`

For this closeout:

- `PROJECT_MEMORY.md` must record the completed ServicePackage/PackageDesign/ServiceOrder architecture and roadmap advancement.
- `SESSION_HANDOFF.md` must record the current READY closeout state.
- no large legacy documentation matrix needs updating

These two updated files are the intended documentation scope for this module closeout.

## Open Issues

No confirmed implementation blocker remains.

No Codex A or B finding remains.

Known non-blocking project-wide items:

- Media reference-detail display is capped at 25 records
- Media deletion has a narrow reference-check/provider-delete TOCTOU window
- client production bundle remains above Vite's recommended chunk-size threshold
- current client dependency audit previously reported two high-severity dependency-chain findings and requires a separate controlled review
- automated test coverage remains limited
- source code contains the intended Site Settings tagline, but the deployed MongoDB value remains unverified
- `README.md` remains materially stale and should receive a separate focused refresh later
- production `TRUST_PROXY_HOPS` must match the actual deployment topology

Do not run:

`npm audit fix --force`

## Next Action

Current checkpoint:

`Module implementation approved; documentation closeout in progress`

After replacing the two updated documentation files:

1. Run:
   - `npm run check`
   - `git diff --check`
   - `git status --short`
2. Review the final intended working-tree scope.
3. Stage the complete Service Packages / Pricing / Package Designs / Service Orders module plus:
   - `docs/PROJECT_MEMORY.md`
   - `docs/SESSION_HANDOFF.md`
4. Run:
   - `git diff --cached --check`
   - `git diff --cached --stat`
   - `git status --short`
5. Commit the complete module.
6. Push `main` to `origin`.
7. Verify:
   - `git status -sb`
   - latest Git log
   - `main` and `origin/main` synchronized
   - working tree clean

Do not reopen already-approved implementation work unless a new concrete issue is discovered.

## Next Development Module

After this module is committed and pushed:

`FAQ`

Before implementation:

- audit the existing Site Settings/publication/page patterns
- decide whether FAQ is collection-only or also needs detail/category structure
- preserve existing publication, SEO, sitemap, Media, API, Admin, and RBAC conventions
- avoid overlap with Services content where FAQ belongs inside a specific Service/package experience

## Upcoming Modules

After FAQ:

1. Clients / Partners
2. Case Studies
3. Appointment / Consultation Booking
4. Newsletter / Subscribers Management
5. Admin Analytics Dashboard
6. Admin Activity / Audit Log
7. Menu / Navigation Management

## Future Separate Phases

After the remaining advanced modules:

- Professional UI/UX redesign
- Email and Notifications
- Final SEO, testing, performance, and security
- Production deployment
