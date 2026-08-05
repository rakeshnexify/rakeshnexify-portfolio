EXECUTION MODE:

This is not a prompt review, rewriting, cleaning or conversion request.

Treat this complete prompt as my direct project instruction and execute it.

Do not return an improved version of this prompt.

Start by giving only the requested planning response from the
FIRST RESPONSE FORMAT section.

==================================================

Main apne existing RakeshNexify MERN Portfolio and Admin CMS me ek naya
end-to-end fully dynamic management module add karna chahta hoon.

CURRENT MODULE:

FULLY DYNAMIC EDUCATION MANAGEMENT MODULE

Repository path:

D:\rakeshnexify-portfolio

IMPORTANT:

Abhi turant code dena start mat karo.

Pehle project rules, current repository state, existing architecture aur
Education module requirement samjho. Uske baad minimum recommended fast
development plan do.

==================================================
1. PERMANENT RULES AND CURRENT SOURCES
==================================================

Follow these files:

- AGENTS.md
- docs/ai/PROJECT_RULEBOOK.md
- docs/ai/CHATGPT_WORKFLOW.md
- docs/SESSION_HANDOFF.md
- docs/CURRENT_STATUS.md
- docs/ROADMAP.md

Read these when relevant:

- docs/PROJECT_OVERVIEW.md
- docs/PROJECT_STRUCTURE.md
- docs/API_ROUTES.md
- docs/DATABASE_SCHEMA.md
- docs/DECISIONS.md
- docs/BUGS.md

Repository files, Git state and verified runtime behavior are the source
of truth.

Do not rely only on old chat history or stale documentation.

If you do not have direct repository access, clearly say so.
Ask only for the exact current files required for the next decision.
Do not pretend to inspect local repository files.

Before implementation, verify or ask me to verify:

git status --short
git branch --show-current
git log --oneline -10 --decorate

Existing architecture samjhe bina files create, replace, delete ya rename
mat karo.

==================================================
2. PROJECT DIRECTION
==================================================

This is a professional MERN portfolio and Admin CMS.

Manageable content must be database-backed and Admin-controlled instead
of unnecessarily hard-coded.

Existing working functionality must not break.

Use the existing architecture, naming conventions, API response format
and error format.

Primary full-module reference:

- Dynamic Team module

Secondary references:

- Services
- Statistics
- Projects
- Companies
- Skills, if the Skills module is already complete

Do not blindly copy a complex module when Education can use a simpler
production-ready architecture.

Keep:

- App.jsx minimal
- app.js route-registration and Express-setup focused
- server.js startup focused
- API calls in services
- reusable loading logic in hooks
- form conversion and payload normalization in utilities
- UI in dedicated components and pages
- database behavior in models and controllers
- HTTP mounting in route files

==================================================
3. MODULE-SPECIFIC INPUT
==================================================

Module name:

Fully Dynamic Education Management Module

Singular entity:

Education Record

Plural entity:

Education Records

Purpose:

Admin Panel se meri real academic education, professional courses,
bootcamps, technical training aur useful learning records manage karna.

Approved visible Education records ko homepage Education timeline section
and dedicated /education page par dynamically display karna.

Education records source code me hard-coded nahi honi chahiye.

Proposed fields:

Identity:

- institutionName
- slug
- qualificationName
- fieldOfStudy
- educationType

Timeline:

- startDate
- endDate
- isCurrentlyStudying

Academic information:

- grade
- location
- shortDescription
- description

Visual and evidence:

- institutionLogoUrl
- certificateUrl
- credentialUrl

Relationships:

- relatedSkills
- relatedProjects only when genuinely useful

Publication:

- order
- isFeatured
- isVisible
- status

SEO:

- seo.title
- seo.description
- seo.keywords
- seo.ogImageUrl

Audit:

- createdBy
- updatedBy
- createdAt
- updatedAt

Possible relationships:

- Skills, if the Skills module and relation pattern already exist
- Projects only when an Education record directly produced or supported a Project
- Do not add Company, Team Member or Service relations unless repository
  inspection proves they add real value

Required Admin capabilities:

- Education record listing
- Create
- Edit
- Role-restricted permanent delete
- Search
- Education-type filter
- Current-study filter
- Status filter
- Visibility filter
- Featured filter
- Visibility quick action
- Featured quick action
- Display-order control
- Automatic slug generation with validation
- Start-date and end-date validation
- isCurrentlyStudying behavior
- Duplicate prevention
- Local form validation
- Field-level server validation errors
- Loading state
- Error state
- Empty state
- Responsive Admin UI

Required public capabilities:

- Homepage Education timeline or preview section
- Dedicated /education listing page
- Visible Education records only
- Featured records support
- Admin-defined order
- Chronological information
- Current-study badge
- Institution logo or initials fallback
- Certificate or credential links only when valid URLs exist
- Loading state
- Error state
- Empty state
- Responsive design
- Keyboard accessibility
- Screen-reader-friendly labels
- Semantic timeline or list markup

Expected public API base:

/api/education

Expected Admin API base:

/api/admin/education

Expected public routes:

- /education

Do not add /education/:slug in the fast MVP unless repository inspection
and planning prove that individual Education detail pages provide real
user or SEO value.

Expected Admin routes:

- /admin/education
- /admin/education/new
- /admin/education/:id/edit

Required Site Settings and publication behavior:

- Dynamic Education section eyebrow
- Dynamic Education section heading
- Dynamic Education section description
- Optional dynamic CTA
- Independent homepage visibility
- Independent Navbar visibility
- Independent /education public-page visibility
- Homepage display order
- Navbar display order
- Dynamic public navigation label

Required SEO and sitemap behavior:

- Dynamic /education page title
- Dynamic /education page description
- Dynamic keywords
- Canonical URL
- Open Graph metadata
- Twitter metadata
- Social-sharing image fallback
- /education sitemap entry only when the public page is enabled
- No individual Education sitemap URLs unless a detail page is approved
- Disabled /education page must not remain accessible or indexable

Data policy:

- No fake or automatically seeded Education records unless explicitly approved.
- Real records must be created through the protected Admin interface.
- Temporary validation records must be deleted after testing.
- Public UI must support a proper empty state.
- Do not expose private transcripts, identity numbers or private documents.

==================================================
4. FAST MVP
==================================================

First recommend the minimum production-ready MVP.

Preferred MVP items:

- One Education model and one Education collection
- Admin CRUD
- Search and practical filters only
- Education type
- Institution name
- Qualification, degree or course title
- Field of study
- Start date
- End date
- Currently studying control
- Short and full descriptions
- Optional grade
- Optional location
- Optional institution logo
- Optional certificate or credential link
- Visibility control
- Featured control
- Display-order control
- Homepage Education timeline or preview
- Dedicated /education page
- Site Settings content
- Independent publication controls
- Dynamic listing-page SEO
- Sitemap integration
- Loading, error and empty states
- Responsive and accessible UI
- Runtime verification
- Documentation synchronization

Clearly separate these future or optional items:

- /education/:slug details page
- Individual Education SEO pages
- Separate Institution model
- Separate Education Category model
- Transcript upload
- Certificate file upload
- Separate Certification Management module
- Complex Skills relations
- Complex Projects relations
- Drag-and-drop ordering
- Bulk import or export
- Advanced timeline animation
- Academic achievement badges
- Endorsements
- Public comments

Do not automatically include optional complexity.

Specially decide and explain:

1. Should the Mongoose model be Education or EducationRecord?
2. Should the MongoDB collection be education or educationRecords?
3. Which educationType enum values are actually useful?
4. Should qualificationName be used instead of separate degree and courseTitle fields?
5. Should status exist in addition to isCurrentlyStudying?
6. Should endDate become null when isCurrentlyStudying is true?
7. Should grade remain optional?
8. Should certificateUrl and credentialUrl both exist or use one verificationUrl?
9. Should relatedSkills be included now or after Skills is stable?
10. Should relatedProjects be part of the MVP?
11. Should sorting use manual order, chronological order or both?
12. Is pagination unnecessary for a naturally limited Education history?
13. Is an individual detail page actually useful?
14. Should Certifications remain a separate module?
15. Should Education later appear inside a combined Experience timeline?
16. Is default or seeded Education data inappropriate for real content?

Prefer the simplest production-ready answers.

==================================================
5. DEVELOPMENT STEP RULE
==================================================

Use minimum recommended practical major steps.

Target approximately 6 to 8 major steps.

Do not make one file equal one step.
Do not create unnecessary 20 to 40 micro-steps.
Every major step must produce a complete testable outcome.

Normally consider:

1. Existing architecture audit and final Education scope
2. Education model, validation and indexes
3. Complete public and protected Admin backend APIs
4. Frontend services, hooks and form utilities
5. Complete Admin Education management interface
6. Public /education page and homepage timeline integration
7. Site Settings, publication, SEO and sitemap integration
8. Final testing, Codex review, documentation and Git checkpoint

Adjust the steps to the actual repository and approved scope.

After planning approval, give only one numbered major step at a time.
I will reply “done” before the next major step.

A major step may contain multiple related files when that is faster and
still manageable.

==================================================
6. CHATGPT DELIVERY RULES
==================================================

For every file:

- Give the exact repository path.
- Give the exact VS Code command, for example:
  code server\src\models\Education.js
- Clearly say:
  - Create new file
  - Fully replace file
  - Add code at an exact location
  - Delete file
- Provide complete working code for full replacements.
- Do not use:
  - ...
  - rest unchanged
  - existing code same
  - placeholder-only code
  - incomplete TODO implementation

I manually open and replace file content.

Do not give PowerShell copy or replace commands.

If the current content of an existing file is required and unavailable,
ask for that exact file. Do not guess a full replacement.

Use standard npm commands on my desktop.

Every step must include:

1. Step number and title
2. Goal
3. Files affected
4. Exact VS Code open commands
5. Complete code or precise edits
6. Relevant commands
7. Expected result
8. Manual browser or API checks
9. Whether a Codex review is needed
10. Stop and wait for “done”

Give a Git commit message only after a meaningful milestone is fully verified.

==================================================
7. SECURITY AND AUTHORIZATION
==================================================

Preserve existing:

- JWT Admin authentication
- Active Admin validation
- Role-based authorization
- Helmet
- CORS
- Rate limiting
- Environment validation
- Existing API response format
- Existing API error format

Default roles:

Read:

- Any authenticated active Admin

Create and update:

- super-admin
- admin
- editor

Delete:

- super-admin
- admin

Do not expose passwords, access tokens, private environment values,
database credentials or private academic documents.

Do not weaken security to make a test pass.

Do not run:

npm audit fix --force

==================================================
8. PUBLICATION AND SHARED INTEGRATION
==================================================

When applicable, inspect and integrate:

- Client homepage section registry
- Server homepage section registry
- HomePage rendering
- SiteSettings schema
- Admin Site Settings controller whitelist
- Site Settings form utility
- Listing-section settings UI
- Navbar
- Public page header
- Footer
- PublicPageVisibilityRoute
- AppRoutes
- PageSeo
- Sitemap controller
- Sitemap XML utility
- Root validation script
- Admin dashboard
- Production deep-route support

Preserve independent controls:

- Homepage visibility
- Navbar visibility
- Dedicated public-page visibility
- Homepage order
- Navbar order
- Public label

When the Education public page is disabled:

- Direct /education route must be blocked.
- /education must be removed from the sitemap.
- Navbar behavior must follow the Education navigation setting.
- Footer behavior must follow the existing architecture.
- Homepage Education visibility must remain independently controlled.
- Education records and Admin management must remain unaffected.

==================================================
9. DATABASE AND API EXPECTATIONS
==================================================

Planning must inspect the current project before finalizing names.

Preferred initial naming:

Mongoose model:

Education

MongoDB collection:

education

Public API base:

/api/education

Admin API base:

/api/admin/education

Public route:

/education

Admin routes:

- /admin/education
- /admin/education/new
- /admin/education/:id/edit

These names are preferred, not blindly mandatory.
Existing repository conventions are the final authority.

Model planning must consider:

- Required institutionName
- Required qualificationName
- Optional fieldOfStudy
- Lowercase unique slug
- Education type enum
- Valid date ranges
- End date not earlier than start date
- Current-study behavior
- Optional grade
- Optional location
- Description length limits
- URL validation
- ObjectId relation validation
- Display-order minimum
- Visibility and featured defaults
- Audit fields
- Automatic timestamps
- Text-search index
- Publication and order index
- Timeline or date index only when actual queries need it

Public API must:

- Return visible Education records only
- Use stable sorting
- Avoid private Admin audit fields
- Support only useful filters
- Respect the approved order strategy

Admin API must support:

- List
- Search
- Practical filters
- Create
- Read by ID
- Update
- Role-restricted delete
- Duplicate errors
- Validation errors
- Invalid ObjectId errors
- Relation validation if relations are approved

Do not force pagination if Education records are naturally limited.

==================================================
10. VERIFICATION AND DOCUMENTATION
==================================================

Use only relevant commands:

npm run dev
npm run build
npm run check
node --check <file>
git status --short
git diff --name-only
git diff --stat
git diff --check
git diff --cached --name-only
git diff --cached --stat
git diff --cached --check

Final Education validation should cover:

Backend:

- Education record creation
- MongoDB persistence
- Duplicate prevention
- Required-field validation
- Invalid date rejection
- Current-study behavior
- Edit and update
- Delete permission
- Search and filters
- Hidden-record exclusion from public API

Admin:

- Dashboard navigation
- Listing
- Create form
- Edit form
- Saved-data persistence
- Date fields
- Current-study control
- Visibility toggle
- Featured toggle
- Display order
- Delete restriction
- Loading, error and empty states
- Responsive Admin behavior

Public:

- Homepage Education section
- /education page
- Visible records only
- Featured behavior
- Approved sorting behavior
- Current-study badge
- Certificate or credential links
- Public-page visibility
- Navbar behavior
- Footer behavior
- SEO metadata
- Sitemap behavior
- Responsive layout
- Keyboard accessibility
- Empty state

Project:

- Existing modules remain working
- Production build succeeds
- npm run check succeeds
- git diff --check succeeds
- No secrets
- No temporary files
- No fake Education records remain
- Documentation matches implementation

Update relevant documentation:

- docs/DATABASE_SCHEMA.md
- docs/API_ROUTES.md
- docs/PROJECT_STRUCTURE.md
- docs/CURRENT_STATUS.md
- docs/SESSION_HANDOFF.md
- docs/ROADMAP.md
- docs/DECISIONS.md
- docs/BUGS.md only for verified issues

==================================================
11. CODEX ROLE
==================================================

Codex is the senior reviewer, integration checker, security reviewer and
regression guard.

Do not use Codex after every small edit.

Default focused checkpoints:

1. Education backend and security milestone
2. Complete Education module integration
3. Final staged-diff review

Add a separate Admin checkpoint only if the Admin implementation becomes
large, risky or authentication-sensitive.

At every checkpoint, give me a ready-to-paste focused Codex prompt containing:

- Completed Education milestone
- Exact changed files
- Relevant Git diff scope
- Expected architecture
- Exact checks
- What Codex must not change
- Findings-first output format

Codex must report findings before editing.
Codex must fix only approved confirmed problems.

Codex must not:

- Commit
- Push
- Create branches
- Rewrite history
- Make unrelated refactors
- Add dependencies without approval
- Change working architecture without evidence

==================================================
12. FIRST RESPONSE FORMAT
==================================================

Abhi code mat do.

First response me sirf ye do:

1. Repository-access limitation, if any
2. Existing architecture audit summary
3. Clear final Education module scope
4. Recommended final Education fields
5. Required fields versus optional fields
6. Recommended Education type values
7. Fast MVP versus future optional features
8. Important design decisions and reasons
9. Minimum recommended major steps
10. Codex review checkpoints
11. Expected Mongoose model and MongoDB collection
12. Expected public and Admin APIs
13. Expected public and Admin routes/pages
14. Shared integration files likely affected
15. Risks, dependencies and open questions
16. Meaningful Git checkpoints

Planning approve hone ke baad Step 1 start karenge.
Uske baad ek samay me sirf ek numbered major step dena.
