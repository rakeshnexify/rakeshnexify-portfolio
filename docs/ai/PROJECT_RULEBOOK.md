# RakeshNexify AI Development Rulebook

Version: 1.1
Project: RakeshNexify MERN Portfolio and Admin CMS
Repository: `D:\rakeshnexify-portfolio`
Recommended location: `docs/ai/PROJECT_RULEBOOK.md`

---

## 1. Purpose

This file contains permanent development rules for ChatGPT, Codex and future developers.

It should contain stable architecture and workflow rules only. Do not use it for current status, commit hashes, temporary issues or session-specific tasks.

The active development-memory files are:

- `docs/PROJECT_MEMORY.md` — permanent architecture, completed module contracts, reusable systems, durable decisions, permanent limitations and remaining roadmap
- `docs/SESSION_HANDOFF.md` — current branch/checkpoint, current module, Git state, recent verification, temporary issues and exact next action

Current implementation and session state must still be verified against:

- Verified runtime and database behavior
- Actual repository files
- Current Git state

---

## 2. Source-of-Truth Priority

When sources disagree, use this order:

1. Verified runtime and database behavior
2. Current repository files
3. Current Git status, diff and history
4. Current repository documentation
5. Previous AI output or chat history

Never rely on a long chat as the only project memory.

Never trust an old commit hash, status statement or file list without checking the current repository.

---

## 3. Required Session Startup

Before planning or changing code:

1. Open the correct repository:
   `D:\rakeshnexify-portfolio`
2. Read the normal permanent instructions and active memory:
   - `AGENTS.md`
   - `docs/ai/PROJECT_RULEBOOK.md`
   - `docs/PROJECT_MEMORY.md`
   - `docs/SESSION_HANDOFF.md`
3. Read other `docs/ai/` workflow or prompt files only when relevant to the requested workflow.
4. Consult legacy technical or historical documents only when their detailed information is specifically useful. They are not mandatory normal-session reads and must be verified against current code.
5. Verify Git:

   ```powershell
   git status --short
   git branch --show-current
   git log --oneline -10 --decorate
   ```

6. Inspect the existing implementation before suggesting new architecture.
7. Search for existing references to the requested module.
8. Confirm whether the working tree is clean before beginning a new module.

If ChatGPT does not have repository access, it must say which current files are required and ask only for those files. It must not pretend that it inspected local files.

---

## 4. Project Architecture

### Frontend

- React
- Vite
- JavaScript
- React Router
- Tailwind CSS
- Reusable components
- Custom hooks
- API service modules
- Utility modules
- Context providers

Frontend root:

`client/`

Frontend source:

`client/src/`

### Backend

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- REST APIs
- JWT Admin authentication
- Role-based authorization

Backend root:

`server/`

Backend source:

`server/src/`

### Database

Database name:

`rakeshnexify_portfolio`

Provider:

MongoDB Atlas

### Separation Rules

- Frontend code must not contain database logic.
- Backend code must not contain React rendering logic.
- `client/src/App.jsx` must remain minimal.
- `client/src/routes/AppRoutes.jsx` owns route definitions.
- `server/src/app.js` owns Express setup and route mounting.
- `server/src/server.js` owns database connection, server startup and graceful shutdown.
- Feature logic belongs in dedicated components, pages, hooks, services, utilities, models, controllers and routes.

---

## 5. Definition of a Fully Dynamic Module

An end-to-end fully dynamic management module normally includes the parts that are actually required from this list:

### Database

- Mongoose model
- Explicit collection naming where the project uses it
- Validation
- Normalization
- Indexes
- Relations
- Audit fields
- Timestamps

### Backend

- Public controller
- Admin controller
- Public routes
- Protected Admin routes
- Search and practical filters
- Validation and duplicate errors
- Record-level visibility protection
- Role-based permissions

### Admin Frontend

- Dashboard entry
- Listing
- Loading, error and empty states
- Create workflow
- Edit workflow
- Delete workflow when approved
- Search and useful filters
- Visibility and featured actions when required
- Display-order controls
- Form utility
- Admin API service
- Field-level server error handling

### Public Frontend

- Public API service
- Reusable hook
- Reusable card or item component
- Homepage section when required
- Dedicated listing page when required
- Details page only when justified and approved
- Loading, error, empty and not-found states
- Responsive and accessible UI

### Shared Integration

- Homepage section registry
- Site Settings section content
- Independent publication controls
- Navbar
- Public page header
- Footer
- Visibility-aware routing
- SEO
- Sitemap
- JSON-LD only when useful and accurate
- Root validation script
- Documentation

Do not create files or features merely to match a template. Create only what the approved module requires.

---

## 6. Existing Module References

Primary end-to-end reference:

- Dynamic Team Management System

Secondary references:

- Services
- Statistics
- Projects
- Companies

Inspect the actual current files before copying any pattern.

Do not blindly copy Team fields, routes or detail-page behavior into every new module.

Use Team as a reference for:

- Full backend and Admin CRUD
- Public listing and optional details integration
- Relationships
- Visibility controls
- Site Settings
- Navigation
- SEO
- Sitemap
- Structured data
- Runtime validation
- Documentation synchronization

Use smaller modules when a simpler architecture is sufficient.

---

## 7. Dynamic-Content Rule

Every reasonable manageable website item should be Admin-controlled instead of unnecessarily hard-coded.

Evaluate every new public module for:

- Database model
- Public API
- Admin API
- Admin CRUD
- Visibility
- Featured state
- Display order
- Homepage integration
- Dedicated public page
- SEO
- Sitemap
- Site Settings content

Do not add fake, demo or automatically seeded professional content unless the user explicitly approves it.

Temporary test records may be created for validation, but they must be removed after testing.

Public interfaces must support a proper empty state.

---

## 8. Development-Step Rule

Use the minimum number of practical major steps.

Default target:

6 to 8 major steps for a complete module.

A major step must produce a complete testable outcome.

Do not make one file equal one step.

Do not create 20 to 40 micro-steps for a normal module.

Typical major steps:

1. Architecture audit and final scope
2. Model, validation and indexes
3. Complete backend public and Admin APIs
4. Frontend services, hooks and form utilities
5. Complete Admin management interface
6. Public website and homepage integration
7. Site Settings, visibility, SEO and sitemap
8. Final validation, documentation and Git checkpoint

Adjust the count when the module is simpler or more complex.

Only one numbered major step should be active at a time.

Continue after the user confirms the current step is complete.

---

## 9. File-Delivery Rules

For every file-related instruction:

- Give the exact repository path.
- Give the exact VS Code command:
  ```powershell
  code path\to\file.js
  ```
- State one of:
  - Create new file
  - Fully replace existing file
  - Add code at a precise location
  - Delete file
- Provide complete working code when full replacement is required.
- Do not use:
  - `...`
  - “rest unchanged”
  - “existing code same”
  - placeholder-only code
  - incomplete TODO implementation

The user manually opens and replaces file content.

Do not provide PowerShell copy, move or replacement commands unless explicitly requested.

If an existing file must be changed and its current content is unknown, inspect it or ask for it. Do not guess a full replacement.

---

## 10. Code-Organization Rules

### Client

Prefer:

- `components/`
- `components/admin/`
- `components/sections/`
- `hooks/`
- `services/`
- `utils/`
- `pages/`
- `pages/admin/`
- `config/`
- `routes/`

Keep page components focused on composition and page behavior.

Keep API calls in services.

Keep reusable loading logic in hooks.

Keep form defaults, conversion and payload normalization in utilities.

Keep reusable UI in dedicated components.

### Server

Prefer:

- `models/`
- `controllers/`
- `routes/`
- `middleware/`
- `config/`
- `utils/`
- `data/` only when approved default data is actually required

Controllers should not own route mounting.

Routes should not contain large business logic.

Models should not contain HTTP response behavior.

---

## 11. Naming Rules

Inspect existing naming before finalizing names.

Use consistent names across:

- Mongoose model
- MongoDB collection
- Public API
- Admin API
- Public route
- Admin route
- Controller files
- Route files
- Services
- Hooks
- Pages
- Components
- Documentation

Do not introduce alternate aliases for the same module without an intentional migration.

Prefer the existing Admin create route convention:

`/admin/<module>/new`

Prefer the existing Admin edit route convention:

`/admin/<module>/:id/edit`

Do not create a public details route unless the module benefits from individual public profiles and individual SEO pages.

---

## 12. API Rules

Use the existing REST pattern.

Typical public operations:

- `GET`

Typical Admin operations:

- `GET`
- `POST`
- `PATCH`
- `DELETE`

Preserve the actual existing API response and error format.

Do not invent query parameters without implementing and documenting them.

Public endpoints must:

- Return public-safe data only
- Respect record visibility
- Use stable sorting
- Avoid exposing Admin audit data
- Filter hidden related records where relations are populated

Admin endpoints must:

- Require active Admin authentication
- Validate IDs and relationships
- Return consistent validation and duplicate errors
- Preserve existing permission behavior

---

## 13. Admin Authentication and Authorization

Authentication:

`Authorization: Bearer <admin-access-token>`

Current roles:

- `super-admin`
- `admin`
- `editor`

Default permission pattern:

| Action | Allowed roles |
|---|---|
| Read Admin resources | Any authenticated active Admin |
| Create | `super-admin`, `admin`, `editor` |
| Update | `super-admin`, `admin`, `editor` |
| Delete | `super-admin`, `admin` |

Do not weaken authentication or authorization to make development easier.

Do not expose access tokens, passwords or private environment values.

---

## 14. Database Rules

Every new model must define and document:

- Model name
- Collection name
- Required fields
- Optional fields
- Defaults
- String trimming and normalization
- Enum values
- Numeric ranges
- URL validation where applicable
- Slug or key validation
- Duplicate prevention
- Relations
- Indexes
- Audit fields when applicable
- Timestamps
- `versionKey` behavior

Use indexes for real query patterns, not speculative complexity.

Use pagination only when expected record volume or current project patterns justify it.

Validate ObjectId relations before saving.

Do not silently delete or rewrite existing database data.

---

## 15. Publication and Visibility Rules

Supported modules may independently control:

- `isVisible`: Homepage section visibility
- `isNavigationVisible`: Navbar visibility
- `isPageVisible`: Dedicated public-page availability
- `order`: Homepage order
- `navigationOrder`: Navbar order
- `label`: Public label

Record-level visibility and module-level publication are separate concerns.

When a public page is disabled:

- Direct access must be blocked by the existing visibility route.
- The listing page must be removed from the sitemap.
- Its detail routes must also be removed when applicable.
- Navbar and Footer behavior must follow current architecture.
- Homepage visibility must remain independent.

New modules must be registered in the required client and server section registries.

---

## 16. Site Settings Rules

Use the existing modular Site Settings system.

Current categories include:

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

Place new settings in the correct existing category unless a new category is clearly justified.

When adding a listing module, inspect and update the actual required parts:

- Site Settings model
- Admin controller whitelist
- Site Settings form utility
- Listing-section settings UI
- Client merge/default behavior
- Homepage and navigation registries

Do not duplicate settings in multiple unrelated locations.

---

## 17. SEO, Sitemap and Structured-Data Rules

Public modules should use the existing `PageSeo` architecture.

Evaluate:

- Title
- Description
- Keywords
- Canonical URL
- Open Graph metadata
- Twitter metadata
- Sharing image fallback
- Robots directives
- Sitemap inclusion
- JSON-LD

SEO must respect public visibility.

Hidden records must not appear in public detail URLs or sitemap entries.

Disabled module pages must not remain indexable.

Use JSON-LD only when the schema accurately represents the page.

Ensure stale structured-data scripts are removed during route changes.

---

## 18. UI, Responsive and Accessibility Rules

Every Admin and public workflow must support relevant states:

- Loading
- Error
- Empty
- Success
- Not found when applicable
- Disabled or unavailable when applicable

Public and Admin UI must be:

- Responsive
- Keyboard accessible
- Semantically structured
- Screen-reader friendly
- Consistent with current design
- Clear on desktop, tablet and mobile

Use real buttons for actions and real links for navigation.

Provide useful labels for icon-only controls and external links.

Do not add advanced visual complexity that is outside the approved MVP.

---

## 19. Security Rules

Preserve:

- Helmet
- CORS
- Rate limiting
- JWT authentication
- Role authorization
- Environment validation
- Contact-form rate limiting
- Password hashing
- Token invalidation behavior

Never:

- Store secrets in Git or documentation
- Print private environment values
- Disable security globally to make a test pass
- Add unsafe HTML handling without sanitization review
- Trust client-provided roles or audit fields
- Allow editors to delete restricted resources
- Commit temporary access tokens

---

## 20. Dependency Rules

Do not add a dependency unless the existing stack cannot safely and reasonably satisfy the requirement.

Before adding a dependency:

1. Explain why it is required.
2. Check whether the repository already contains an equivalent utility.
3. Consider bundle size and security.
4. Verify compatibility with current React, Vite, Node and Express versions.
5. Run installation and build checks.

Never run:

```powershell
npm audit fix --force
```

without reviewing affected packages and breaking changes.

---

## 21. Verification Rules

Use only the commands relevant to the current milestone.

Common commands:

```powershell
npm run dev
npm run build
npm run check
node --check path\to\server-file.js
git status --short
git diff --name-only
git diff --stat
git diff
git diff --check
git diff --cached --name-only
git diff --cached --stat
git diff --cached --check
```

Desktop npm command:

`npm`

Do not use `npm.cmd` on the main desktop unless a real execution-policy issue requires it.

### Backend verification

Verify as relevant:

- Create
- Read
- Update
- Delete
- Search
- Filters
- Duplicate prevention
- Invalid values
- Invalid ObjectIds
- Authentication
- Role restrictions
- Record visibility
- Hidden related records
- API response consistency

### Admin verification

Verify as relevant:

- Dashboard entry
- Listing
- Create
- Edit
- Persistence
- Quick actions
- Delete restriction
- Field errors
- Loading, error and empty states
- Responsive behavior

### Public verification

Verify as relevant:

- Homepage section
- Dedicated page
- Detail page
- Sorting
- Filtering
- Hidden records
- Publication controls
- Navbar
- Footer
- SEO
- Sitemap
- Responsive behavior
- Keyboard access
- Empty and not-found states

---

## 22. Codex Role

Codex is primarily:

- Senior reviewer
- Integration checker
- Security reviewer
- Regression guard
- Focused bug fixer

Codex is not an uncontrolled full-repository rewriter.

Default focused checkpoints:

1. Backend/security milestone
2. Complete module integration
3. Final staged-diff review

Use a separate Admin checkpoint only when the Admin change is large, risky or authentication-sensitive.

Codex must:

- Start with Git status and relevant diff
- Inspect only module-related files and direct integration points
- Report findings before editing
- Separate blocking, confirmed and optional findings
- Fix only approved confirmed issues
- Avoid optional refactoring
- Avoid unrelated changes
- Never commit or push without explicit instruction

---


## 23. Documentation Rules

The two active development-memory files are:

- `docs/PROJECT_MEMORY.md`
- `docs/SESSION_HANDOFF.md`

At normal module completion:

1. Update `docs/SESSION_HANDOFF.md` with the current checkpoint, Git state, recent verification, temporary issues and exact next action.
2. Update `docs/PROJECT_MEMORY.md` only when the work introduces or changes:
   - permanent architecture
   - a completed module contract
   - a reusable system
   - a durable architectural decision
   - a permanent limitation
   - the remaining roadmap

Do not recreate a many-document update matrix.

Legacy documents such as `API_ROUTES.md`, `BUGS.md`, `CURRENT_STATUS.md`, `DATABASE_SCHEMA.md`, `DECISIONS.md`, `PROJECT_OVERVIEW.md`, `PROJECT_STRUCTURE.md` and `ROADMAP.md` are not mandatory per-module update targets. Consult or update them only when explicitly required for a separate technical, historical or archival purpose.

Do not claim a feature is complete before appropriate verification.

Keep active memory concise and synchronized with actual code and Git state.

---

## 24. Git Rules

Git checkpoints are permanent project memory.

Before implementation:

```powershell
git status --short
git log --oneline -10 --decorate
```

Before a meaningful commit:

```powershell
git status --short
git diff --check
git diff --name-only
git diff --stat
```

After staging:

```powershell
git diff --cached --name-only
git diff --cached --stat
git diff --cached --check
```

Rules:

- Do not commit incomplete or unverified work.
- Do not provide a final commit message until the milestone passes verification.
- Do not commit or push automatically.
- Do not create a branch automatically.
- Do not rewrite history.
- Do not run destructive reset or clean commands without explicit approval.
- Do not mix unrelated fixes into a feature commit.
- Do not include secrets, temporary files or test records.

The user manually performs Git commit and push.

---

## 25. Known Non-Blocking Work

Do not store a changing list of temporary issues in this rulebook.

Record current warnings, investigations and non-blocking session issues in `docs/SESSION_HANDOFF.md`.

Record only durable architectural limitations in `docs/PROJECT_MEMORY.md`.

Before acting on an old issue, verify that it still exists in the current repository or runtime. Do not mix unrelated non-blocking work into an active feature module.

---

## 26. Prohibited Behavior

Do not:

- Pretend to inspect files that are unavailable
- Guess existing file contents
- Rewrite completed modules without evidence
- Rename existing routes unnecessarily
- Change API response format unnecessarily
- Weaken authentication or permissions
- Add fake professional content
- Add speculative indexes, filters or relations
- Force pagination when unnecessary
- Add an individual details page automatically
- Add a dependency without justification
- Run forced dependency fixes
- Expose secrets
- Commit or push automatically
- Mark untested work complete
- Combine unrelated refactors with a module
- Continue to the next major step before the current step is verified

---

## 27. Maintenance of This Rulebook

Update this file only when a stable workflow or development rule changes.

Do not add temporary status, current commit hashes or short-lived task details here.

Use:

- `docs/SESSION_HANDOFF.md` for current work and session state
- `docs/PROJECT_MEMORY.md` for permanent architecture and durable decisions

When a rule is replaced:

1. Record any durable architectural consequence in `docs/PROJECT_MEMORY.md`.
2. Update this file.
3. Update affected workflow and prompt files.
4. Verify that ChatGPT and Codex workflows remain consistent.
