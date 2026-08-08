# Codex Focused Review Prompts

Version: 1.1
Recommended location: `docs/ai/CODEX_REVIEW_PROMPTS.md`

Paste these prompts into the Codex panel, not the general Chat panel.

Replace every value inside `[SQUARE BRACKETS]`.

Keep Codex in approval mode.

---

## 1. Usage Rules

Use Codex as:

- Senior reviewer
- Integration checker
- Security reviewer
- Regression guard
- Focused bug fixer

Do not use Codex after every small file change.

Default checkpoints:

1. Backend/security milestone
2. Complete module integration
3. Final staged-diff review

Use the Admin checkpoint only when the Admin phase is large, risky or authentication-sensitive.

Every review should:

- Start with `git status`
- Inspect the relevant diff
- Read only the required architecture and module files
- Report findings first
- Avoid optional refactoring
- Avoid unrelated changes
- Avoid commit and push

---

## 2. Read-Only Baseline Check

Use before starting a new module or when Codex context is uncertain.

```text
Read the current repository in read-only mode.

First read:

- AGENTS.md
- docs/ai/PROJECT_RULEBOOK.md
- docs/PROJECT_MEMORY.md
- docs/SESSION_HANDOFF.md

Consult legacy technical or historical documentation only if its detailed
information is specifically needed.

Run only:

- git status --short
- git branch --show-current
- git log --oneline -10 --decorate

Do not modify files.
Do not create files.
Do not run a build.
Do not commit or push.

Report:

1. Current branch
2. Working-tree state
3. Latest completed milestone
4. Current documented next task
5. Any conflict between Git state, active memory and repository files
6. Whether it is safe to start the next module
```

---

## 3. Backend and Security Milestone Review

Use after the model, public controller, Admin controller, routes and route mounting are complete.

```text
Act as a senior MERN backend and security reviewer.

Completed milestone:

[MODULE NAME] backend foundation and APIs

Expected API bases:

- Public: [PUBLIC API BASE]
- Admin: [ADMIN API BASE]

Expected changed files:

[PASTE EXACT FILE LIST]

First read:

- AGENTS.md
- docs/ai/PROJECT_RULEBOOK.md
- docs/PROJECT_MEMORY.md
- docs/SESSION_HANDOFF.md
- Relevant current model, controller, route and reference-module files

Consult `docs/DATABASE_SCHEMA.md` or `docs/API_ROUTES.md` only when their
detailed legacy reference information is specifically useful. Verify all
such information against current code.

Then run:

- git status --short
- git diff --name-only
- git diff --stat
- git diff -- [PASTE BACKEND AND DIRECT INTEGRATION PATHS]
- git diff --check

Review only the current module backend and direct integration points.

Do not perform a full repository audit.
Do not modify files yet.
Do not commit or push.
Do not add dependencies.
Do not make optional refactors.
Do not redesign the API.
Do not weaken authentication or authorization.

Check:

1. Model name and collection consistency
2. Required fields, defaults and normalization
3. Enum and range validation
4. Slug or unique-key validation
5. Duplicate prevention
6. URL, color and ObjectId validation where applicable
7. Relation validation
8. Indexes matching actual query patterns
9. Public-safe response fields
10. Record-level visibility protection
11. Hidden related-record filtering
12. Admin JWT authentication
13. Active Admin validation
14. Role-based create, update and delete permissions
15. Editor delete restriction
16. Consistent API success and error format
17. Search, filters and stable sorting
18. Missing route mounting
19. Syntax or import errors
20. Secrets, credentials or unsafe logging
21. Regression risk to existing modules
22. Required root validation-script changes
23. Required active-memory changes, distinguishing current handoff state from permanent architecture

Output exactly:

1. Blocking issues
2. Confirmed bugs
3. Security or authorization concerns
4. Integration mismatches
5. Documentation gaps
6. Regression risks
7. Optional suggestions
8. Recommended focused validation commands

For every finding include:

- Severity
- File path
- Evidence
- Why it matters
- Minimal recommended fix

If no concrete issue exists, say so clearly.

Do not modify files until I approve specific findings.
```

---

## 4. Admin Frontend Milestone Review

Use only when the Admin phase is large or risky.

```text
Act as a senior React Admin workflow reviewer.

Completed milestone:

[MODULE NAME] Admin management interface

Expected Admin routes:

[PASTE ADMIN ROUTES]

Expected changed files:

[PASTE EXACT FILE LIST]

First read:

- AGENTS.md
- docs/ai/PROJECT_RULEBOOK.md
- Relevant Admin reference-module files
- Current module backend API contract

Then run:

- git status --short
- git diff --name-only
- git diff --stat
- git diff -- [PASTE ADMIN AND DIRECT INTEGRATION PATHS]
- git diff --check

Review only the module Admin UI and direct integration points.

Do not modify files yet.
Do not commit or push.
Do not redesign the UI.
Do not make optional style changes.
Do not change unrelated shared components.
Do not add dependencies.

Check:

1. Admin dashboard entry
2. Route registration and protection
3. API service methods and HTTP methods
4. Backend/frontend field-name consistency
5. Form defaults
6. API-to-form conversion
7. Payload normalization
8. Slug generation and manual override behavior
9. Local validation
10. Server field-error rendering
11. Create workflow
12. Edit workflow
13. Saved-data persistence
14. Search and filters
15. Visibility and featured quick actions
16. Display-order handling
17. Delete role restriction
18. Loading, error and empty states
19. Disabled-button and duplicate-submit behavior
20. Responsive layout
21. Keyboard and label accessibility
22. Missing imports or runtime errors
23. Existing Admin regression risk
24. Required documentation updates

Output exactly:

1. Blocking issues
2. Confirmed bugs
3. Authorization concerns
4. API and form mismatches
5. UI state or accessibility problems
6. Regression risks
7. Optional suggestions
8. Recommended browser test checklist

For every finding include file path and evidence.

Do not modify files until I approve specific findings.
```

---

## 5. Complete Public and Shared Integration Review

Use after the Admin, public page, homepage, Site Settings, navigation, SEO and sitemap work are integrated.

```text
Act as a senior full-stack MERN integration reviewer.

Completed milestone:

Complete [MODULE NAME] integration

Expected public routes:

[PASTE PUBLIC ROUTES]

Expected Admin routes:

[PASTE ADMIN ROUTES]

Expected API bases:

- Public: [PUBLIC API BASE]
- Admin: [ADMIN API BASE]

Expected changed files:

[PASTE EXACT FILE LIST]

First read:

- AGENTS.md
- docs/ai/PROJECT_RULEBOOK.md
- docs/PROJECT_MEMORY.md
- docs/SESSION_HANDOFF.md
- Relevant current module and reference-module integration files

Consult legacy technical or historical documentation only when its detailed
information is specifically useful. Do not treat it as authoritative without
verification against current code.

Then run:

- git status --short
- git diff --name-only
- git diff --stat
- git diff -- [PASTE MODULE AND DIRECT SHARED INTEGRATION PATHS]
- git diff --check

Review only this module and its direct integration points.

Do not perform an unrelated full-repository audit.
Do not modify files yet.
Do not commit or push.
Do not make optional refactors.
Do not redesign working UI.
Do not change dependencies.

Check:

Backend and API:
1. Public and Admin route registration
2. Backend/frontend field consistency
3. Public-safe data
4. Hidden-record behavior
5. Authentication and role authorization
6. Search, filters and sorting

Admin:
7. Dashboard, listing, create and edit routes
8. Form and payload consistency
9. Quick actions and delete restriction
10. Loading, error and empty states

Public:
11. Public API service and hook
12. Homepage section
13. Dedicated listing page
14. Details page only if approved
15. Loading, error, empty and not-found states
16. Responsive behavior
17. Keyboard and semantic accessibility

Publication:
18. Client homepage-section registry
19. Server homepage-section registry
20. Site Settings schema
21. Admin Site Settings whitelist
22. Site Settings form conversion
23. Independent homepage visibility
24. Independent Navbar visibility
25. Independent dedicated-page visibility
26. Homepage and Navbar order
27. Navbar, public-header and Footer behavior
28. Visibility-aware route protection

SEO and sitemap:
29. Title, description and canonical
30. Open Graph and Twitter metadata
31. Robots behavior
32. JSON-LD only when accurate
33. Stale JSON-LD cleanup
34. Listing sitemap entry
35. Detail sitemap entries when applicable
36. Hidden-record filtering
37. Public-page visibility filtering

Project safety:
38. Root validation-script coverage
39. Missing imports and syntax errors
40. Existing-feature regression
41. Accidental deletion
42. Unrelated file changes
43. Secrets or temporary files
44. Active-memory synchronization:
    - `docs/SESSION_HANDOFF.md` for current state
    - `docs/PROJECT_MEMORY.md` only for permanent changes

Output exactly:

1. Blocking issues
2. Confirmed bugs
3. Security or authorization concerns
4. Integration mismatches
5. Publication, SEO or sitemap problems
6. Accessibility or responsive problems
7. Documentation gaps
8. Regression risks
9. Optional suggestions
10. Recommended final validation plan

Include file path and evidence for every finding.

Do not modify files until I approve specific findings.
```

---

## 6. Approved-Issues Fix Prompt

Use only after reviewing and approving concrete findings.

```text
Fix only these approved confirmed issues:

[PASTE APPROVED FINDINGS]

Rules:

- Modify only files required for the approved fixes.
- Do not implement optional suggestions.
- Do not refactor unrelated code.
- Do not change dependencies.
- Do not alter API contracts unless the approved finding requires it.
- Preserve existing authentication, authorization and publication behavior.
- Do not commit or push.
- Ask before deleting a file or making a large architecture change.

After fixing:

1. List changed files
2. Explain each fix briefly
3. Show the exact validation commands run
4. Report pass or fail for each command
5. Report any remaining risk
6. State whether another review is required
```

---

## 7. Final Pre-Commit Staged-Diff Review

Use only after testing and staging the intended milestone files.

```text
Act as the final pre-commit safety reviewer.

Milestone:

[MODULE OR CHECKPOINT NAME]

Expected staged files:

[PASTE EXPECTED FILE LIST]

Run:

- git status --short
- git diff --cached --name-only
- git diff --cached --stat
- git diff --cached --check
- git diff --cached -- [PASTE MODULE AND DIRECT INTEGRATION PATHS]

Do not modify files.
Do not unstage files.
Do not commit.
Do not push.
Do not create a branch.
Do not review unrelated unstaged work unless it creates a direct risk.

Check:

1. Staged files match the expected milestone
2. No unrelated files are staged
3. No secrets or environment files are staged
4. No temporary audit or test files are staged
5. No generated build output is staged accidentally
6. No accidental deletion
7. No incomplete placeholder or TODO-only implementation
8. No backend/frontend contract mismatch
9. No missing route or registry integration
10. No weakened authentication or authorization
11. No broken publication behavior
12. No obvious SEO or sitemap inconsistency
13. Documentation matches implementation
14. Whitespace validation is clean
15. Commit scope is coherent

Output exactly:

1. Safe to commit: YES or NO
2. Blocking staged issues
3. Staged-file mismatch
4. Security or secret concerns
5. Documentation mismatch
6. Remaining non-blocking risks
7. Recommended commit scope
8. Suggested concise commit message

Do not change anything.
```

---

## 8. Difficult Bug Investigation

Use when a feature fails across multiple files and the cause is not known.

```text
Investigate this confirmed problem as a senior MERN debugger:

Problem:

[PASTE EXACT PROBLEM]

Reproduction steps:

[PASTE STEPS]

Expected behavior:

[PASTE EXPECTED RESULT]

Actual behavior:

[PASTE ACTUAL RESULT]

Relevant error output:

[PASTE ERROR]

Suspected files:

[PASTE PATHS OR WRITE UNKNOWN]

First:

1. Read AGENTS.md and docs/ai/PROJECT_RULEBOOK.md.
2. Inspect git status.
3. Trace the request or UI flow from entry point to data source.
4. Inspect only the most relevant files.
5. Distinguish evidence from assumptions.

Do not modify files yet.
Do not disable security.
Do not make a broad refactor.
Do not add dependencies.
Do not commit or push.

Report:

1. Most likely root cause
2. Evidence
3. Other plausible causes
4. Exact files involved
5. Smallest safe fix
6. Regression risk
7. Validation plan

Wait for approval before modifying files.
```

---

## 9. Focused Authentication and Authorization Review

Use when the module introduces or modifies protected actions.

```text
Perform a focused authentication and role-authorization review for:

[MODULE OR ENDPOINTS]

Relevant files:

[PASTE FILE LIST]

Expected permissions:

- Read: any authenticated active Admin
- Create: super-admin, admin, editor
- Update: super-admin, admin, editor
- Delete: super-admin, admin

Inspect:

- Bearer token middleware use
- Active Admin validation
- Token type and expiry assumptions
- Password-change token invalidation
- Route-level role middleware
- Controller trust boundaries
- Client-side role display versus server enforcement
- Delete restriction
- Audit-field ownership
- Error status consistency
- Public endpoint exposure

Do not modify files.
Do not weaken security.
Do not commit or push.

Report only concrete findings with file paths and evidence.
Separate:

1. Critical security issues
2. Authorization bugs
3. API consistency issues
4. Defense-in-depth recommendations
```

---

## 10. Cost and Context Control

To reduce Codex usage:

- Provide the exact milestone.
- Provide the exact changed-file list.
- Use `git diff` before asking for a broad read.
- Review only direct integration files.
- Do not request repeated full-repository audits.
- Ask for concise findings.
- Approve only concrete fixes.
- Run final staged review once.
- Keep documentation current so Codex does not reconstruct history.
