# Reusable Dynamic Module Master Prompt

Version: 1.1
Recommended location: `docs/ai/MODULE_MASTER_PROMPT.md`

Use this prompt at the beginning of a new ChatGPT chat for Skills, Experience, Education, Testimonials, Blog or another fully dynamic module.

Replace every value inside `[SQUARE BRACKETS]`.

Do not paste all repository documentation into every new chat. This prompt tells ChatGPT which repository files are the source of truth.

---

# Copy From Here

```text
Main apne existing RakeshNexify MERN Portfolio and Admin CMS me ek naya
end-to-end fully dynamic management module add karna chahta hoon.

CURRENT MODULE:

[FULLY DYNAMIC MODULE NAME]

Examples:
- Fully Dynamic Skills Management Module
- Fully Dynamic Experience Management Module
- Fully Dynamic Education Management Module
- Fully Dynamic Testimonials Management Module
- Fully Dynamic Blog Management Module

Repository path:

D:\rakeshnexify-portfolio

IMPORTANT:

Abhi turant code dena start mat karo.

Pehle project rules, current repository state, existing architecture aur
module requirement samjho. Uske baad minimum recommended fast development
plan do.

==================================================
1. PERMANENT RULES AND CURRENT SOURCES
==================================================

Follow these normal instruction and active-memory files:

- AGENTS.md
- docs/ai/PROJECT_RULEBOOK.md
- docs/ai/CHATGPT_WORKFLOW.md
- docs/PROJECT_MEMORY.md
- docs/SESSION_HANDOFF.md

Read other docs/ai workflow or prompt files only when relevant.

Legacy technical and historical documents may remain available as read-only
or archived references. Consult them only when their detailed information is
specifically useful. They are not mandatory normal-session reads and must be
verified against current code.

Repository files, Git state and verified runtime behavior are the source
of truth.

Do not rely only on old chat history or stale documentation.

If you do not have direct repository access, clearly say so. Ask only for
the exact current files required for the next decision. Do not pretend to
inspect local files.

Before implementation, verify or ask me to verify:

git status --short
git branch --show-current
git log --oneline -10 --decorate

Existing architecture samjhe bina files create, replace ya rename mat karo.

==================================================
2. PROJECT DIRECTION
==================================================

This is a professional MERN portfolio and Admin CMS.

Manageable content must be database-backed and Admin-controlled instead
of unnecessarily hard-coded.

Existing working functionality must not break.

Use the existing architecture and naming conventions.

Primary full-module reference:

- Dynamic Team module

Secondary references:

- Services
- Statistics
- Projects
- Companies

Do not blindly copy a complex module when the new module can be simpler.

Keep:

- App.jsx minimal
- app.js route-registration and Express-setup focused
- server.js startup focused
- API calls in services
- reusable loading logic in hooks
- form conversion in utilities
- UI in dedicated components and pages
- database behavior in models and controllers
- HTTP mounting in route files

==================================================
3. MODULE-SPECIFIC INPUT
==================================================

Module name:

[MODULE NAME]

Singular entity:

[SINGULAR ENTITY NAME]

Plural entity:

[PLURAL ENTITY NAME]

Purpose:

[EXPLAIN WHAT THIS MODULE MANAGES AND DISPLAYS]

Proposed fields:

[LIST PROPOSED FIELDS]

Possible relationships:

[LIST RELATIONS OR WRITE NONE]

Required Admin capabilities:

[LIST CREATE, LIST, SEARCH, FILTER, EDIT, DELETE, TOGGLES, ORDER, ETC.]

Required public capabilities:

[LIST HOMEPAGE SECTION, LISTING PAGE, FILTERS, DETAIL PAGE, ETC.]

Expected public API base:

[/api/example]

Expected Admin API base:

[/api/admin/example]

Expected public routes:

[LIST ROUTES]

Expected Admin routes:

[LIST ROUTES]

Required Site Settings and publication behavior:

[DESCRIBE HOMEPAGE, NAVBAR, PUBLIC PAGE, ORDER AND LABEL CONTROLS]

Required SEO and sitemap behavior:

[DESCRIBE LISTING SEO, DETAIL SEO, SITEMAP OR WRITE LISTING PAGE ONLY]

Data policy:

- No fake or automatically seeded professional records unless explicitly approved.
- Temporary validation records must be deleted after testing.
- Public UI must support an empty state.

==================================================
4. FAST MVP
==================================================

First recommend the minimum production-ready MVP.

Preferred MVP items:

[LIST MUST-HAVE FEATURES]

Clearly separate these future or optional items:

[LIST OPTIONAL FEATURES]

Do not automatically include optional complexity.

Specially decide and explain:

[LIST IMPORTANT DESIGN DECISIONS]

Examples:
- Is a details page necessary?
- Is pagination useful?
- Should category be a string or a separate model?
- Are all proposed relations needed now?
- Is individual SEO required?
- Is drag-and-drop ordering necessary?
- Is default data appropriate?

==================================================
5. DEVELOPMENT STEP RULE
==================================================

Use minimum recommended practical major steps.

Target approximately 6 to 8 major steps for a normal complete module.

Do not make one file equal one step.

Do not create unnecessary 20 to 40 micro-steps.

Every major step must produce a complete testable outcome.

Normally consider:

1. Existing architecture audit and final scope
2. Database model, validation and indexes
3. Complete public and protected Admin backend APIs
4. Frontend services, hooks and form utilities
5. Complete Admin management interface
6. Public page and homepage integration
7. Site Settings, publication, SEO and sitemap
8. Final testing, Codex review, documentation and Git checkpoint

Adjust the steps to the real module.

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
  code server\src\models\Example.js
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
ask for that file. Do not guess a full replacement.

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

Give a Git commit message only after a meaningful milestone is fully
verified.

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
- Existing API response and error format

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

Do not run npm audit fix --force.

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

When a public page is disabled:

- Direct route must be blocked.
- Sitemap route must be removed.
- Detail routes must also be removed when applicable.
- Homepage visibility must remain independent.

==================================================
9. VERIFICATION AND DOCUMENTATION
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

Final validation should cover the approved module scope, including:

- Database persistence
- Validation and duplicate prevention
- Admin permissions
- CRUD workflows
- Search and practical filters
- Visibility, featured and order behavior
- Public API behavior
- Hidden-record protection
- Public pages
- Publication controls
- SEO and sitemap
- Loading, error, empty and not-found states
- Responsive and basic accessibility
- Existing-feature regression
- Build and root checks
- Secrets and temporary-file review

After module verification, update active memory in this order:

1. Update docs/SESSION_HANDOFF.md with:
   - current branch/checkpoint
   - current module and completion state
   - current Git state
   - recent verification
   - temporary issues
   - exact next action

2. Update docs/PROJECT_MEMORY.md only if the module introduced or changed:
   - permanent architecture
   - a completed module contract
   - a reusable system
   - a durable decision
   - a permanent limitation
   - the remaining roadmap

Do not recreate a many-document update matrix.

Legacy technical and historical documents are not mandatory per-module
update targets. Consult or update them only when explicitly required for a
separate technical, historical or archival purpose.

==================================================
10. CODEX ROLE
==================================================

Codex is the senior reviewer, integration checker, security reviewer and
regression guard.

Do not use Codex after every small edit.

Default focused checkpoints:

1. Backend and security milestone
2. Complete module integration
3. Final staged-diff review

Add a separate Admin checkpoint only if the Admin implementation is large
or authentication-sensitive.

At a checkpoint, give me a ready-to-paste focused Codex prompt containing:

- Completed milestone
- Changed files
- Relevant Git diff scope
- Expected architecture
- Exact checks
- What Codex must not change
- Findings-first output format

Codex must report findings before editing.

Codex must fix only approved confirmed problems.

Codex must not commit, push, create branches, rewrite history or make
unrelated refactors.

==================================================
11. FIRST RESPONSE FORMAT
==================================================

Abhi code mat do.

First response me sirf ye do:

1. Repository-access limitation, if any
2. Existing architecture audit summary
3. Clear final module scope
4. Recommended final fields
5. Required fields versus optional fields
6. Fast MVP versus future optional features
7. Important design decisions and reasons
8. Minimum recommended major steps
9. Codex review checkpoints
10. Expected model and collection
11. Expected public and Admin APIs
12. Expected public and Admin routes/pages
13. Shared integration files likely affected
14. Risks, dependencies and open questions
15. Meaningful Git checkpoints

Planning approve hone ke baad Step 1 start karenge.
Uske baad ek samay me sirf ek numbered major step dena.
```

# End Copy
