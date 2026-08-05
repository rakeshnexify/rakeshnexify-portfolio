# ChatGPT Development Workflow

Version: 1.0  
Recommended location: `docs/ai/CHATGPT_WORKFLOW.md`

This file defines how ChatGPT should plan, deliver and close work for the RakeshNexify MERN Portfolio.

---

## 1. Role Division

### ChatGPT

ChatGPT is the primary:

- Planner
- Scope designer
- Step divider
- Code generator
- File-instruction writer
- Test-instruction writer
- Documentation planner
- Codex-prompt writer
- Git commit-message writer after verification

### Codex

Codex is the focused:

- Senior reviewer
- Integration checker
- Security reviewer
- Regression guard
- Approved-issue fixer
- Final staged-diff reviewer

### User

The user:

- Opens files
- Manually replaces or adds code
- Runs commands
- Performs browser checks
- Approves Codex findings
- Creates commits
- Pushes to GitHub

---

## 2. New-Chat Startup

At the beginning of a new module chat, the user should paste the filled prompt from:

`docs/ai/MODULE_MASTER_PROMPT.md`

ChatGPT must first:

1. Confirm whether repository access is available.
2. Read available project documents.
3. Identify missing current files only when required.
4. Verify current Git information supplied by the user.
5. Inspect the existing module pattern before planning.
6. Return planning only.
7. Avoid code until planning is approved.

The first response must not become an implementation step.

---

## 3. Planning Phase

ChatGPT should provide:

1. Audit summary
2. Final scope
3. Required fields
4. Optional fields
5. MVP versus future features
6. Important design decisions
7. Minimum major steps
8. Codex checkpoints
9. Expected model and collection
10. Expected APIs
11. Expected public and Admin routes
12. Likely shared integration files
13. Risks and dependencies
14. Git checkpoint plan

Planning should prefer the simplest production-ready design.

Avoid adding:

- Unnecessary details pages
- Unnecessary category models
- Unnecessary pagination
- Unnecessary relations
- Drag-and-drop ordering
- Bulk import/export
- Advanced charts
- New dependencies

unless the user approves them.

---

## 4. Major-Step Design

Default module size:

6 to 8 major steps.

One major step may include several related files.

Each step must produce a testable outcome.

Do not make one file one step.

Do not continue until the user confirms the current step.

Recommended major-step structure:

1. Audit and final design
2. Model and validation
3. Backend API
4. Frontend data layer
5. Admin UI
6. Public UI
7. Shared visibility, SEO and sitemap
8. Final validation and documentation

Simpler modules may use fewer steps.

Complex modules may use more, but the reason must be explained.

---

## 5. Required Step Response Format

Every implementation response must use this structure:

```text
STEP [NUMBER] — [TITLE]

Goal:
[One clear testable outcome]

Files:
1. [PATH] — Create / Replace / Edit / Delete
2. [PATH] — Create / Replace / Edit / Delete

Open commands:
code [PATH]
code [PATH]

Instructions:
[Precise order of work]

Code:
[Complete code for each full replacement or precise insertion]

Commands:
[Only relevant commands]

Expected result:
[What should happen]

Manual verification:
[Browser or API checks]

Codex:
[Not needed / Required after this milestone, with prompt]

Git:
[No commit yet / Commit checkpoint only after verification]

Stop:
Reply “done” after the expected result is verified.
```

Do not hide multiple unrelated outcomes inside one step.

---

## 6. File Instructions

For every file, ChatGPT must say:

- Exact path
- Exact VS Code command
- Create, replace, edit or delete
- Whether the code is the full file

Use:

```powershell
code client\src\path\File.jsx
```

Do not provide PowerShell copy or replacement commands.

The user manually opens the downloaded or displayed file and replaces content.

If the current file is needed:

- Ask for the current file, or
- Inspect it through available repository/file access.

Do not guess.

For a full replacement, provide the complete file.

Never use:

- `...`
- “same as before”
- “rest unchanged”
- “existing imports”
- partial placeholders
- hidden omitted sections

For a precise insertion, identify:

- Exact file
- Existing anchor line
- Insert before or after
- Complete inserted block

---

## 7. Code Quality Rules

ChatGPT must:

- Preserve existing architecture
- Preserve API contracts
- Preserve auth and RBAC
- Keep `App.jsx` minimal
- Keep `app.js` focused
- Use small dedicated files
- Reuse existing shared components and utilities when appropriate
- Avoid unnecessary duplication
- Avoid unrelated refactoring
- Avoid new dependencies when existing code is enough
- Keep frontend and backend field names synchronized
- Include loading, error and empty states
- Include not-found behavior when applicable
- Include responsive and accessibility behavior
- Avoid fake professional content

Do not claim code is production-ready until it is tested.

---

## 8. Command Rules

Main desktop uses standard npm:

```powershell
npm
```

Use only commands relevant to the current step.

Common commands:

```powershell
npm run dev
npm run build
npm run check
node --check path\to\file.js
git status --short
git diff --name-only
git diff --stat
git diff --check
```

Do not run the full production build after every tiny edit.

Recommended validation levels:

### File-level

- Syntax check
- Focused API or browser check

### Milestone-level

- Relevant runtime workflow
- `git diff --check`
- Focused Codex review when required

### Module-level

- Complete browser and API checklist
- `npm run build`
- `npm run check`
- Documentation synchronization
- Final staged-diff review

---

## 9. Manual Testing Instructions

Testing instructions must be exact and observable.

Bad:

“Check if it works.”

Good:

1. Open `/admin/skills/new`.
2. Submit an empty form.
3. Confirm required-field messages appear.
4. Create a visible featured Skill.
5. Confirm it appears in the Admin list.
6. Refresh and confirm persistence.
7. Hide it.
8. Confirm it disappears from the public API and public page.
9. Restore visibility.
10. Delete the temporary test record if it is not real content.

State expected HTTP status or UI result when useful.

---

## 10. Codex Checkpoint Workflow

ChatGPT should not use Codex after every file.

Default checkpoints:

### Checkpoint A — Backend/security

After:

- Model
- Controllers
- Routes
- Route mounting
- Backend documentation draft

### Checkpoint B — Complete integration

After:

- Admin
- Public UI
- Site Settings
- Visibility
- SEO
- Sitemap
- Documentation draft

### Checkpoint C — Final staged diff

After:

- Runtime tests pass
- Build/check pass
- Intended files are staged

Add a separate Admin checkpoint only when necessary.

At every checkpoint, ChatGPT must provide a ready-to-paste prompt from the pattern in:

`docs/ai/CODEX_REVIEW_PROMPTS.md`

The prompt must include:

- Current module
- Completed milestone
- Exact changed files
- Exact diff scope
- Expected behavior
- Findings-first rule
- No-commit/no-push rule

---

## 11. Handling Codex Findings

When the user pastes Codex findings, ChatGPT must:

1. Separate confirmed evidence from optional suggestions.
2. Reject unrelated refactors.
3. Explain which issues must be fixed now.
4. Explain which suggestions can wait.
5. Provide the smallest safe fix.
6. Update the current step only.
7. Re-run focused validation.
8. Request a second Codex review only when the fix materially changed risk.

Do not accept every Codex suggestion automatically.

Codex is a reviewer, not the project owner.

---

## 12. Error Workflow

When an error occurs, ask for:

- Exact command
- Full error text
- Current relevant file
- Browser console output when relevant
- Network response when relevant
- Reproduction steps

Then:

1. Identify the smallest likely scope.
2. Avoid rewriting the entire module.
3. Give one focused fix.
4. State why the fix is needed.
5. Give a focused verification.
6. Update `docs/BUGS.md` only for a confirmed issue worth tracking.

Do not repeatedly ask the user to rebuild the whole project when a focused check is enough.

---

## 13. Documentation Workflow

Documentation is part of implementation, not optional cleanup.

At the appropriate milestone, update:

- `docs/DATABASE_SCHEMA.md`
- `docs/API_ROUTES.md`
- `docs/PROJECT_STRUCTURE.md`
- `docs/CURRENT_STATUS.md`
- `docs/SESSION_HANDOFF.md`
- `docs/ROADMAP.md`
- `docs/DECISIONS.md`
- `docs/BUGS.md` only when required

Do not duplicate the same status paragraph across every file without purpose.

Use each document for its intended role:

- `CURRENT_STATUS`: current verified state
- `SESSION_HANDOFF`: continuation instructions
- `ROADMAP`: completed and planned phases
- `DATABASE_SCHEMA`: model contract
- `API_ROUTES`: API contract
- `PROJECT_STRUCTURE`: file structure
- `DECISIONS`: stable decisions
- `BUGS`: confirmed issues

---

## 14. Git Checkpoint Workflow

A commit message is given only after a meaningful verified milestone.

Possible module checkpoints:

1. Backend
2. Admin management
3. Public and shared integration
4. Final documentation synchronization

Not every module requires four commits.

Before suggesting a commit:

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

The user performs:

```powershell
git add .
git commit -m "..."
git push origin main
```

ChatGPT must not automatically commit or push.

Commit messages should be concise and describe one coherent milestone.

---

## 15. Session Handoff

Before ending a session:

1. Confirm current completed step.
2. Record remaining incomplete work.
3. Record changed files.
4. Record validation completed.
5. Record unresolved issues.
6. Update `docs/SESSION_HANDOFF.md`.
7. Update `docs/CURRENT_STATUS.md`.
8. Confirm Git state.
9. Provide the next exact step title.

A new chat should continue from repository documentation, not from manually retelling hundreds of messages.

---

## 16. Chat-Length Control

To avoid slow 200 to 300 message chats:

- Use one chat per module.
- Split only when a module becomes genuinely large:
  - Backend
  - Admin
  - Public integration
- Close the chat after the module or major phase is committed.
- Update handoff documents before starting a new chat.
- Do not re-paste every repository document.
- Use `MODULE_MASTER_PROMPT.md` plus current handoff documents.
- Keep Codex reviews focused on diffs.
- Do not repeat old code unless the current fix requires it.

Start a new chat when:

- A module is complete
- The current chat becomes slow
- A new unrelated phase begins
- Documentation and Git provide a clean checkpoint

---

## 17. Fast Workflow Summary

```text
New Chat
  ↓
Module Master Prompt
  ↓
Planning Only
  ↓
User Approves
  ↓
One Major Step
  ↓
Focused Verification
  ↓
Next Major Step
  ↓
Backend Codex Review
  ↓
Admin + Public Integration
  ↓
Complete Integration Codex Review
  ↓
Build + npm run check
  ↓
Documentation
  ↓
Stage Intended Files
  ↓
Final Codex Staged-Diff Review
  ↓
Commit + Push by User
  ↓
New Module Chat
```

---

## 18. Ready-to-Use Continuation Message

Use this when reopening a module chat after an interruption:

```text
Continue the current module from the repository state.

Read:

- AGENTS.md
- docs/ai/PROJECT_RULEBOOK.md
- docs/ai/CHATGPT_WORKFLOW.md
- docs/SESSION_HANDOFF.md
- docs/CURRENT_STATUS.md
- docs/ROADMAP.md

Verify:

- git status --short
- git log --oneline -10 --decorate

Do not repeat completed work.
Do not rewrite working files.
Identify the next incomplete major step and give only that step.
If direct repository access is unavailable, ask only for the current files
required for that step.
```
