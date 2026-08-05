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

FULLY DYNAMIC SKILLS MANAGEMENT MODULE

Repository path:

D:\rakeshnexify-portfolio

IMPORTANT:

Abhi turant code dena start mat karo.

Pehle project rules, current repository state, existing architecture aur
Skills module requirement samjho. Uske baad minimum recommended fast
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

Do not blindly copy a complex module when Skills can use a simpler
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

Fully Dynamic Skills Management Module

Singular entity:

Skill

Plural entity:

Skills

Purpose:

Admin Panel se meri real professional, technical aur development Skills
manage karna.

Approved visible Skills ko homepage Skills section aur dedicated /skills
page par dynamically display karna.

Skills source code me hard-coded nahi honi chahiye.

Proposed fields:

Identity:

- name
- slug
- shortName
- description
- category

Proficiency:

- proficiencyLevel
- proficiencyPercentage
- yearsOfExperience

Visual:

- iconName
- iconUrl
- color

Relationships:

- relatedServices
- relatedProjects
- relatedTeamMembers only when genuinely useful

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

- Services
- Projects
- Team Members only when repository inspection proves they add real value
- Do not add unnecessary relations in the fast MVP

Required Admin capabilities:

- Skill listing
- Create
- Edit
- Role-restricted permanent delete
- Search
- Category filter
- Proficiency-level filter only when useful
- Status filter
- Visibility filter
- Featured filter
- Visibility quick action
- Featured quick action
- Display-order control
- Automatic slug generation with validation
- Duplicate prevention
- Percentage and experience validation
- Local form validation
- Field-level server validation errors
- Loading state
- Error state
- Empty state
- Responsive Admin UI

Required public capabilities:

- Homepage Skills section
- Dedicated /skills listing page
- Visible Skills only
- Featured Skills support
- Admin-defined order
- Category grouping or filtering
- Skill icon or initials fallback
- Proficiency display only when approved
- Loading state
- Error state
- Empty state
- Responsive design
- Keyboard accessibility
- Screen-reader-friendly labels
- Semantic list or grid markup

Expected public API base:

/api/skills

Expected Admin API base:

/api/admin/skills

Expected public routes:

- /skills

Do not add /skills/:slug in the fast MVP unless repository inspection
and planning prove that individual Skill detail pages provide real user
or SEO value.

Expected Admin routes:

- /admin/skills
- /admin/skills/new
- /admin/skills/:id/edit

Required Site Settings and publication behavior:

- Dynamic Skills section eyebrow
- Dynamic Skills section heading
- Dynamic Skills section description
- Optional dynamic CTA
- Independent homepage visibility
- Independent Navbar visibility
- Independent /skills public-page visibility
- Homepage display order
- Navbar display order
- Dynamic public navigation label

Required SEO and sitemap behavior:

- Dynamic /skills page title
- Dynamic /skills page description
- Dynamic keywords
- Canonical URL
- Open Graph metadata
- Twitter metadata
- Social-sharing image fallback
- /skills sitemap entry only when the Skills public page is enabled
- No individual Skill sitemap URLs unless a detail page is approved
- Disabled /skills page must not remain accessible or indexable

Data policy:

- No fake or automatically seeded Skills unless explicitly approved.
- Real Skills must be created through the protected Admin interface.
- Temporary validation records must be deleted after testing.
- Public UI must support a proper empty state.

==================================================
4. FAST MVP
==================================================

First recommend the minimum production-ready MVP.

Preferred MVP items:

- One Skill model and one Skills collection
- Admin CRUD
- Search and practical filters only
- Skill name
- Slug
- Description
- Category
- One approved proficiency representation
- Optional years of experience only when useful
- Icon or image support
- Optional color
- Visibility control
- Featured control
- Display-order control
- Homepage Skills section
- Dedicated /skills page
- Category grouping or filtering
- Site Settings content
- Independent publication controls
- Dynamic listing-page SEO
- Sitemap integration
- Loading, error and empty states
- Responsive and accessible UI
- Runtime verification
- Documentation synchronization

Clearly separate these future or optional items:

- /skills/:slug details page
- Individual Skill SEO pages
- Separate Skill Category model
- Complex proficiency charts
- Endorsements
- Certification relations
- Complex Team-skill mapping
- Complex Project-skill mapping
- Drag-and-drop ordering
- Bulk import or export
- Advanced animations
- Public ratings or comments

Do not automatically include optional complexity.

Specially decide and explain:

1. Should the Mongoose model be Skill?
2. Should the MongoDB collection be skills?
3. Should category remain a normalized string or become a separate model?
4. Should proficiencyLevel and proficiencyPercentage both exist?
5. If only one proficiency field is needed, which one is better for this portfolio?
6. Should yearsOfExperience remain optional?
7. Should iconName and iconUrl both exist or should one be used?
8. Should color be a validated hex value or omitted?
9. Should status exist in addition to isVisible?
10. Should relatedServices be included in the MVP?
11. Should relatedProjects be included in the MVP?
12. Should relatedTeamMembers be deferred?
13. Should sorting use manual order, featured priority or a defined combination?
14. Is pagination unnecessary for a naturally limited Skills list?
15. Is an individual detail page actually useful?
16. Is default or seeded Skills data inappropriate for real content?

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

1. Existing architecture audit and final Skills scope
2. Skill model, validation and indexes
3. Complete public and protected Admin backend APIs
4. Frontend services, hooks and form utilities
5. Complete Admin Skills management interface
6. Public /skills page and homepage Skills section integration
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
  code server\src\models\Skill.js
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

Do not expose passwords, access tokens, private environment values or
database credentials.

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

When the Skills public page is disabled:

- Direct /skills route must be blocked.
- /skills must be removed from the sitemap.
- Navbar behavior must follow the Skills navigation setting.
- Footer behavior must follow the existing architecture.
- Homepage Skills visibility must remain independently controlled.
- Skill records and Admin management must remain unaffected.

==================================================
9. DATABASE AND API EXPECTATIONS
==================================================

Planning must inspect the current project before finalizing names.

Preferred initial naming:

Mongoose model:

Skill

MongoDB collection:

skills

Public API base:

/api/skills

Admin API base:

/api/admin/skills

Public route:

/skills

Admin routes:

- /admin/skills
- /admin/skills/new
- /admin/skills/:id/edit

These names are preferred, not blindly mandatory.
Existing repository conventions are the final authority.

Model planning must consider:

- Required name
- Lowercase unique slug
- Optional shortName
- Description length limits
- Category normalization
- Proficiency enum or percentage validation
- Years-of-experience range
- Icon-name validation when used
- URL validation
- Hex-color validation when used
- ObjectId relation validation
- Display-order minimum
- Visibility and featured defaults
- Status enum only when useful
- Audit fields
- Automatic timestamps
- Text-search index
- Publication and order index
- Category index only when actual queries need it

Public API must:

- Return visible Skills only
- Use stable sorting
- Avoid private Admin audit fields
- Support only useful filters
- Respect the approved featured and order strategy

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

Do not force pagination if Skills records are naturally limited.

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

Final Skills validation should cover:

Backend:

- Skill creation
- MongoDB persistence
- Duplicate prevention
- Required-field validation
- Proficiency validation
- Experience validation
- Edit and update
- Delete permission
- Search and filters
- Hidden-Skill exclusion from public API

Admin:

- Dashboard navigation
- Listing
- Create form
- Edit form
- Saved-data persistence
- Category field
- Proficiency field
- Visibility toggle
- Featured toggle
- Display order
- Delete restriction
- Loading, error and empty states
- Responsive Admin behavior

Public:

- Homepage Skills section
- /skills page
- Visible Skills only
- Featured behavior
- Approved sorting behavior
- Category grouping or filtering
- Icon or initials fallback
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
- No fake Skills remain
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

1. Skills backend and security milestone
2. Complete Skills module integration
3. Final staged-diff review

Add a separate Admin checkpoint only if the Admin implementation becomes
large, risky or authentication-sensitive.

At every checkpoint, give me a ready-to-paste focused Codex prompt containing:

- Completed Skills milestone
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
3. Clear final Skills module scope
4. Recommended final Skill fields
5. Required fields versus optional fields
6. Recommended category and proficiency design
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
