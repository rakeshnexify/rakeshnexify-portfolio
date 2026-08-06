# Bugs and Known Issues

Last updated: 2026-08-06

## Purpose

This file tracks:

- Confirmed bugs
- Known warnings
- Pending investigations
- Resolved problems
- Temporary limitations

Do not mark an issue as resolved until the fix has been verified.

---

# Current Summary

## Blocking Application Bugs

None currently known.

## Open Non-Blocking Issues

1. Client bundle-size warning
2. Client dependency audit vulnerability
3. Site Settings default tagline encoding issue
4. Limited automated test coverage
5. Git line-ending warnings

## Resolved Recent Issues

- Root validation script typo
- Homepage trailing whitespace
- Site Settings listing card runtime error
- Independent page visibility behavior
- Dynamic sitemap visibility behavior
- Modular Site Settings editor navigation
- Team Admin frontend workflow validation

---

# BUG-001 — Large Client JavaScript Bundle

Status: Open

Priority: Medium

Type: Performance warning

## Current Warning

Vite reports:

`Some chunks are larger than 500 kB after minification.`

Latest verified main JavaScript bundle:

`997.38 kB`

Latest verified gzip size:

`212.96 kB`

Latest verified build details:

- Vite: `8.1.5`
- Modules transformed: `154`
- Build result: successful

## Current Impact

- Production build succeeds.
- Application remains functional.
- Initial page loading may become slower as more modules are added.
- Admin and public application code may currently load together.

## Planned Investigation

- Inspect the generated bundle.
- Add React route-based lazy loading.
- Use dynamic imports where appropriate.
- Separate Admin and public route bundles.
- Review large dependencies.
- Review reusable icons or libraries.
- Test loading behavior after code splitting.

## Temporary Decision

This warning is non-blocking.

Do not mix performance optimization into an unrelated feature step.

---

# BUG-002 — Client Dependency Audit Warning

Status: Open

Priority: High

Type: Dependency security investigation

## Current Observation

A previous client dependency installation reported:

`1 high severity vulnerability`

The server dependency audit reported no vulnerabilities during the same installation session.

## Current Impact

Unknown until the affected package is identified.

It may affect:

- Development-only tooling
- Build tooling
- Production runtime

## Required Investigation

1. Run a non-destructive client audit.
2. Record the affected package.
3. Identify whether it is a direct or transitive dependency.
4. Identify whether it affects development or production.
5. Review safe package versions.
6. Review breaking changes.
7. Update on a controlled step.
8. Run build and browser validation.

## Important Restriction

Do not run:

`npm audit fix --force`

without reviewing the breaking changes.

---

# BUG-003 — Site Settings Tagline Encoding

Status: Open

Priority: Low

Type: Text encoding

## Location

`server/src/models/SiteSettings.js`

## Current Default Text

The model output was previously observed as:

`Developer · Creator · Entrepreneur`

## Expected Text

The intended separator must be confirmed directly in the source file and browser output.

The earlier documentation contained corrupted replacement characters, so it must not be treated as proof of the intended value.

## Possible Cause

The file or terminal content may have been saved or interpreted using incompatible character encoding.

Possible causes include:

- UTF-8 content read as another encoding
- Previous copy-and-paste conversion
- Terminal encoding behavior

## Current Impact

Incorrect characters may appear when the database uses the model default.

Existing MongoDB content may already contain either the correct or incorrect value.

## Required Investigation

1. Check the actual file in VS Code.
2. Confirm the file encoding is UTF-8.
3. Check the current MongoDB `brand.tagline` value.
4. Check public website rendering.
5. Fix the model default only after confirming the issue.
6. Update existing database content separately when required.
7. Verify Admin and public rendering.

Do not silently modify database content during documentation work.

---

# BUG-004 — Limited Automated Test Coverage

Status: Open

Priority: Medium

Type: Quality assurance

## Current State

The project currently relies mainly on:

- Vite production build
- Node syntax checks
- Manual browser testing
- Manual API runtime testing
- Git whitespace validation

## Missing Coverage

Automated tests are still needed for:

- Admin authentication
- Admin authorization
- Public API visibility
- CRUD validation
- Disabled public-page routes
- Dynamic sitemap filtering
- Contact-message rate limiting
- Form utilities
- Site Settings merging
- Team backend APIs
- Team Admin form utilities
- Team Admin authorization
- Skills backend, Admin and public workflows
- Education backend, Admin and public workflows
- Experience backend, Admin, public page, publication and sitemap workflows

## Current Impact

Manual testing is required after important changes.

Regression problems may not be detected automatically.

## Planned Work

Add a dedicated testing phase after the major content modules are stable.

---

# BUG-005 — Development Shutdown Prompt Confusion

Status: Documentation Note

Priority: Low

Type: Development workflow

## Observed Behavior

After stopping `npm run dev` with `Ctrl + C`, PowerShell displayed child-process shutdown messages.

A standalone `y` was then entered after the PowerShell prompt had already returned.

PowerShell treated `y` as a command and displayed:

`The term 'y' is not recognized`

## Actual Impact

No project bug.

The frontend and backend were already stopped.

## Correct Behavior

Use:

`Ctrl + C`

Wait for the PowerShell prompt to return.

Do not enter `y` after the normal prompt has already returned.

---

# BUG-006 — Git Line-Ending Warning

Status: Open

Priority: Low

Type: Development workflow

## Current Observation

Git may report:

`CRLF will be replaced by LF the next time Git touches it`

The warning has been observed for several edited Experience integration files, including:

- `client/src/components/admin/site-settings/SiteSettingsForm.jsx`
- `client/src/components/layout/Footer.jsx`
- `client/src/components/layout/Navbar.jsx`
- `client/src/components/layout/PublicPageHeader.jsx`
- `client/src/config/homepageSections.js`
- `client/src/routes/AppRoutes.jsx`
- `server/src/config/homepageSections.js`
- `server/src/utils/createSitemapXml.js`

## Current Impact

- No current application failure
- No whitespace error reported by `git diff --check`
- The warning may create noisy Git output

## Planned Investigation

- Review `.gitattributes`
- Confirm intended repository line-ending policy
- Confirm VS Code end-of-line settings
- Avoid unnecessary mass line-ending changes inside a feature commit

## Temporary Decision

Treat this warning as non-blocking unless Git shows a real whitespace error or an unexpected full-file rewrite.

---

# RESOLVED-001 — Invalid Root Syntax-Check Command

Status: Resolved

## Previous Problem

The root `package.json` validation script contained:

`node --checkserver/src/server.js`

## Fix

Changed to:

`node --check server/src/server.js`

## Verification

`npm run check` completed successfully.

---

# RESOLVED-002 — Homepage Trailing Whitespace

Status: Resolved

## Location

`client/src/pages/HomePage.jsx`

## Previous Problem

The section registry closing line had trailing spaces.

## Fix

Removed the extra spaces after:

`};`

## Verification

`git diff --check` completed without whitespace errors.

---

# RESOLVED-003 — Site Settings Listing Card Runtime Error

Status: Resolved

## Previous Error

`isVisible is not defined`

## Location

`client/src/components/admin/site-settings/SiteSettingsForm.jsx`

## Cause

`ListingSectionSettingsCard` used `isVisible` without receiving a default prop value.

## Fix

Added the required prop with a safe default:

`isVisible = true`

## Verification

- Site Settings category page opened.
- Navigation settings loaded.
- Save worked successfully.

---

# RESOLVED-004 — Long Site Settings Page

Status: Resolved

## Previous Problem

The Site Settings interface was too long and difficult to navigate.

## Fix

Divided the settings system into 11 category pages:

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

## Verification

- Settings overview opened.
- Category pages opened.
- Navigation page saved successfully.
- Public website reflected saved changes.

---

# RESOLVED-005 — Visibility Controls Were Not Independent

Status: Resolved

## Previous Limitation

One visibility setting could not correctly control:

- Homepage section
- Navbar item
- Dedicated public page

## Fix

Added independent fields:

- `isVisible`
- `isNavigationVisible`
- `isPageVisible`
- `order`
- `navigationOrder`

## Verification

Tested with Statistics:

- Navbar-only hiding worked.
- Homepage-only hiding worked.
- Dedicated page disabling worked.
- Settings could be restored.

---

# RESOLVED-006 — Disabled Pages and Sitemap

Status: Resolved

## Previous Risk

A page hidden from navigation could still remain accessible or appear in the sitemap.

## Fix

Added:

- `PublicPageVisibilityRoute`
- Visibility-aware dynamic sitemap filtering

## Verification

- Disabled page showed Not Found.
- Disabled page was removed from sitemap.
- Re-enabled page became accessible again.

---

# RESOLVED-007 — Team Admin Frontend Workflow Validation

Status: Resolved and Verified

## Previous Risk

The newly added Team Admin frontend had not yet been verified through complete browser workflows.

## Files Involved

- `client/src/components/admin/team/TeamMemberForm.jsx`
- `client/src/pages/admin/AdminTeamMembersPage.jsx`
- `client/src/pages/admin/AdminTeamMemberEditorPage.jsx`
- `client/src/services/adminTeamMembersApi.js`
- `client/src/utils/teamMemberForm.js`
- `client/src/pages/admin/AdminDashboardPage.jsx`
- `client/src/routes/AppRoutes.jsx`

## Verification

The following workflows passed:

- Dashboard Team navigation
- Empty listing
- Team member creation
- Team member editing
- Saved-data persistence
- Project relationship selection
- Company relationship selection
- Service relationship selection
- Search and filters
- Hide and Show
- Feature and Unfeature
- Permanent deletion
- Final empty state

The temporary Team test member was deleted after verification.

No blocking Team Admin frontend problem is currently known.

---



# RESOLVED-008 — Education Create Failed Under Mongoose 9

Status: Resolved and Verified

## Previous Error

`next is not a function`

## Location

`server/src/models/Education.js`

## Cause

The synchronous Education `pre("validate")` middleware used the callback-style `next` argument.

The project was running Mongoose `9.8.0`, where this callback pattern is not supported for the middleware implementation used.

## Fix

Changed the middleware to a synchronous function without:

- A `next` parameter
- A `next()` call

The existing behavior was preserved:

- Current-study records clear `endDate`
- Education duplicate identity is regenerated when identity fields change

## Verification

- Education creation succeeded.
- The record appeared in the Admin listing.
- `npm run check` passed.
- Codex verified the Mongoose 9 middleware fix.

---

# RESOLVED-009 — Social Titles Received Serialized JSON-LD

Status: Resolved and Verified

## Previous Problem

`og:title` and `twitter:title` were assigned serialized structured-data JSON instead of the page title.

## Location

`client/src/components/seo/PageSeo.jsx`

## Impact

Pages supplying JSON-LD could produce broken social-sharing titles.

## Fix

Both metadata values now use:

`safeTitle`

Structured data remains only in the `application/ld+json` script.

## Verification

- Production build passed.
- `git diff --check` passed.
- Focused Codex re-review reported no blocking or important non-blocking findings.

---

# RESOLVED-010 — Education Disabled-Page CTA Variants

Status: Resolved and Verified

## Previous Risk

The homepage CTA was hidden only for exact `/education` and `/education/` values.

Query, fragment and same-site absolute variants could remain visible after the public page was disabled.

## Location

`client/src/components/sections/EducationSection.jsx`

## Fix

The CTA destination is parsed against the canonical site origin.

Same-site destinations whose normalized pathname is `/education` are suppressed when the public Education page is disabled.

Unrelated internal and external CTA destinations remain available.

## Verification

Focused Codex review verified:

- Trailing slash
- Query
- Fragment
- Same-site absolute URL
- Unrelated destinations



# RESOLVED-011 — Experience Public-Page and Sitemap Visibility

Status: Resolved and Verified

## Previous Risk

The new public `/experience` route, navigation links, homepage CTA and sitemap entry needed to respect the independent `isPageVisible` publication setting.

## Files Involved

- `client/src/components/sections/ExperienceSection.jsx`
- `client/src/components/layout/Navbar.jsx`
- `client/src/components/layout/PublicPageHeader.jsx`
- `client/src/components/layout/Footer.jsx`
- `client/src/routes/AppRoutes.jsx`
- `client/src/config/homepageSections.js`
- `server/src/config/homepageSections.js`
- `server/src/utils/createSitemapXml.js`

## Verification

The following states were verified through the Admin Site Settings interface and runtime requests:

- Enabled Experience page appears in navigation and the sitemap.
- Disabled Experience page is blocked by the public visibility route.
- Disabled Experience page is removed from Navbar, public header and Footer.
- Homepage Experience CTA is suppressed when it targets the disabled `/experience` page.
- Disabled Experience page is removed from `sitemap.xml`.
- Re-enabling the page restores navigation, direct access and the sitemap entry.

The backend development process required a restart once so the newly edited sitemap utility was loaded. No remaining application defect was found.

---

# Issue Reporting Template

Use this structure when adding a new issue:

## BUG-XXX — Issue Title

Status:

- Open
- Investigating
- Fixed
- Verified
- Deferred

Priority:

- Critical
- High
- Medium
- Low

Type:

- Runtime
- API
- Database
- Security
- UI
- Responsive
- Accessibility
- Performance
- Dependency
- Documentation

### Problem

Describe the visible or technical issue.

### Steps to Reproduce

1. First action
2. Second action
3. Result

### Expected Behavior

Describe what should happen.

### Actual Behavior

Describe what currently happens.

### Suspected Cause

Record only verified evidence or clearly label assumptions.

### Files Involved

List relevant repository paths.

### Fix

Document the implemented change.

### Verification

Record the exact validation performed.

---

# Bug Documentation Rule

Whenever a bug is discovered:

1. Add it to this file.
2. Record reproduction steps.
3. Record affected files.
4. Record priority and status.
5. Do not guess the cause without evidence.
6. Update the issue after implementing a fix.
7. Mark it verified only after testing.
8. Update `docs/SESSION_HANDOFF.md` when it affects session continuation.
