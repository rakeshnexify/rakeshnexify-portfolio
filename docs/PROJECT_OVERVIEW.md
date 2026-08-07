# Project Overview

Last updated: 2026-08-07

## Project Name

RakeshNexify MERN Portfolio and Admin CMS.

## Repository

Local desktop path:

`D:\rakeshnexify-portfolio`

Main branch:

`main`

Remote branch:

`origin/main`

Latest pushed development commit:

`12a2e67 Add public Testimonials section and page`

Recent Experience checkpoints:

- `91263aa Add public Experience section and page`
- `8e235fb Add dynamic Experience admin interface`
- `5dbcb7a Add Experience frontend services and form utilities`
- `b117e22 Add dynamic Experience backend APIs`


Recent Testimonials checkpoints:

- `12a2e67 Add public Testimonials section and page`
- `5c825e1 Add dynamic Testimonials admin interface`
- `b340cee Add Testimonials frontend foundation`
- `92f2dbd Complete strict Testimonials backend validation`
- `c9d0dfe Fix Testimonials backend validation`
- `d625157 Add dynamic Testimonials backend APIs`

Skills and Education documentation checkpoint:

- `f3b4bdd Synchronize Skills and Education documentation`

## Project Purpose

This project is a professional personal and business portfolio platform for RakeshNexify.

It presents:

- Professional identity
- MERN and WordPress development services
- Statistics and achievements
- Skills and tools
- Education
- Professional Experience
- Testimonials and client reviews
- Projects
- Team members
- Companies and brands
- Contact information
- Social, developer and freelance platforms

The project includes a protected Admin Panel so manageable content can be updated without editing source code.

## Primary Development Goal

Build a production-ready, secure, responsive and fully dynamic MERN portfolio.

Every reasonable content item should be Admin-controlled rather than unnecessarily hard-coded. Current dynamic controls include:

- Brand and owner information
- Hero and About content
- Listing-section headings and CTAs
- Homepage visibility and order
- Navbar visibility, label and order
- Dedicated public-page visibility
- Services, Statistics, Skills, Education, Experience and Testimonials
- Projects, Team members and Companies
- Testimonials and client-review publication
- Contact information and messages
- Platform links and Footer content
- SEO metadata, JSON-LD and sitemap behavior
- Record-level visibility, featured state and order where supported

## Technology Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- JavaScript
- Reusable components
- Custom hooks
- API services
- Form utilities

### Backend

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- REST APIs
- JWT authentication
- Role-based authorization

### Security and Production

- Helmet
- CORS configuration
- Rate limiting
- Environment validation
- Password hashing
- Protected Admin routes and APIs
- Production Express delivery
- Dynamic SEO and JSON-LD
- Visibility-aware XML sitemap
- Public route publication guards

## Current Architecture

The repository uses separate `client/` and `server/` applications.

### Client Responsibilities

- Public and Admin pages
- Navigation and route protection
- API requests
- Form interfaces and validation
- Loading, error and empty states
- Responsive layouts
- SEO and JSON-LD rendering
- Public visibility behavior

### Server Responsibilities

- Database connection
- Mongoose models
- Public and Admin APIs
- Authentication and authorization
- Payload validation and normalization
- Security middleware
- Sitemap generation
- Production client delivery

### Database Responsibilities

MongoDB stores dynamic data for:

- Admin users
- Site Settings
- Services
- Statistics
- Skills
- Education
- Experience
- Testimonials
- Projects
- Companies
- Team members
- Contact messages

Blog or News remains a future module.

## Completed Core Modules

- Admin authentication and RBAC
- Admin dashboard
- Modular Dynamic Site Settings
- Services management
- Statistics management
- Skills management
- Education management
- Experience management
- Testimonials management
- Projects management
- Team management
- Companies management
- Contact messages management
- Dynamic homepage registry
- Independent publication controls
- Dynamic Navbar and Footer
- Public Not Found behavior
- Dynamic SEO and reusable JSON-LD
- Visibility-aware XML sitemap
- Production server foundation
- Repository-memory documentation system

## Dynamic Experience Management Status

Overall status:

`COMPLETE, VALIDATED, COMMITTED AND PUSHED`

### Backend

- `Experience` model and `experiences` collection
- Public `GET /api/experience`
- Protected Admin CRUD at `/api/admin/experience`
- Employment and location enums
- Strict calendar-date validation
- Current-position end-date behavior
- Private duplicate identity
- Unique slug
- Separate responsibilities, achievements, skills and tools arrays
- Optional organization logo and website URLs
- Search and practical filters
- Visibility, featured and display order
- JWT authentication and RBAC
- Root validation-script integration

### Admin Frontend

- `/admin/experience`
- `/admin/experience/new`
- `/admin/experience/:id/edit`
- Dashboard Experience card
- Listing search and filters
- Reusable Experience form
- Current/completed timeline controls
- Responsibilities, achievements, skills and tools editors
- Visibility and featured quick actions
- Role-restricted permanent deletion
- Browser-tested create, edit, filter and delete workflows

### Public Website

- Homepage Experience timeline
- Public `/experience` page
- Reusable `ExperienceTimelineCard`
- Up to four homepage preview records
- Organization logo or initials fallback
- Current and featured badges
- Responsibilities, achievements, skills and tools display
- Dynamic Site Settings content
- Independent homepage, Navbar and public-page visibility
- Navbar, public-header and Footer integration
- Dynamic SEO and JSON-LD
- Visibility-aware sitemap entry
- Loading, error and empty states

### Runtime Validation

- Production client build passed
- Root `npm run check` passed
- Public and Admin APIs were runtime-tested
- Temporary Experience validation data was permanently deleted
- Public-page disabled and enabled behavior was tested
- `/experience` sitemap removal and restoration were verified
- Final working tree was clean and synchronized with `origin/main`


## Dynamic Testimonials Management Status

Overall status:

`COMPLETE, VALIDATED, COMMITTED AND PUSHED`

### Backend

- `Testimonial` model and `testimonials` collection
- Public `GET /api/testimonials`
- Protected Admin CRUD at `/api/admin/testimonials`
- Required client name, review text and strict 1–5 rating
- Optional client role, company, profile image and company website
- Optional related Project with hidden-related-record protection
- Search and practical filters
- Visibility, featured and display order
- Strict query and form rating validation
- JWT authentication and RBAC

### Admin Frontend

- `/admin/testimonials`
- `/admin/testimonials/new`
- `/admin/testimonials/:id/edit`
- Dashboard Testimonials card
- Search, rating, visibility, featured and related-Project filters
- Reusable Testimonial form
- Visibility and featured quick actions
- Role-restricted permanent deletion
- Authoritative list reloads after mutations

### Public Website

- Homepage `TestimonialsSection`
- Public `/testimonials` listing page
- Reusable `TestimonialCard`
- Homepage preview of up to three public Testimonials
- Search and rating filters
- Average rating and matching-count presentation
- Dynamic Site Settings content
- Independent homepage, Navbar and public-page visibility
- Navbar, public-header and Footer integration
- Visibility-aware sitemap entry
- Canonical SEO and general Schema.org Review structured data
- No `/testimonials/:slug` public details route

### Verification

- Backend runtime checks covered empty public response, unauthorized Admin access and invalid public filters.
- Production `npm run check` passed after public integration.
- Vite transformed `164` modules.
- `git diff --check` and `git diff --cached --check` passed before commit.
- Final comprehensive Codex review reported no blocking, important or minor findings.
- Sitemap visibility combinations were verified in the final review.
- No fake or automatically seeded Testimonial records were introduced.

## Other Completed Dynamic Modules

### Skills

Checkpoints:

- `6aa985c Add dynamic skills backend APIs`
- `5311e2d Add dynamic skills admin interface`
- `1bb7e5f Add public Skills section and page`
- `92966df Fix Skills CTA visibility`

### Education

Checkpoints:

- `8fd4cd6 Add dynamic education backend APIs`
- `2604555 Add dynamic Education admin interface`
- `6c0e2a1 Add public Education section and page`

### Team

Final public checkpoint:

`7ca4f6c Add public team website integration`

The Team module includes listing and member-details pages, cross-module relations, member-specific SEO and detail sitemap URLs.

## Current Homepage Sections

Default shared registry order:

1. Hero
2. About
3. Statistics
4. Skills
5. Services
6. Projects
7. Education
8. Experience
9. Team
10. Companies
11. Testimonials
12. Contact

The final visible order remains Admin-controlled through Site Settings.

Testimonials is now part of the completed shared registry.

## Current Public Frontend Routes

- `/`
- `/statistics`
- `/skills`
- `/services`
- `/projects`
- `/projects/:slug`
- `/education`
- `/experience`
- `/testimonials`
- `/team`
- `/team/:slug`
- `/companies`
- `/companies/:slug`
- Public Not Found route

## Current Admin Areas

- Site Settings
- Services
- Statistics
- Skills
- Education
- Experience
- Projects
- Team Members
- Companies
- Contact messages

Experience Admin routes:

- `/admin/experience`
- `/admin/experience/new`
- `/admin/experience/:id/edit`

## Dynamic Visibility Design

Supported modules can independently control:

- Homepage visibility
- Navbar visibility
- Dedicated public-page visibility
- Homepage order
- Navbar order
- Public navigation label

A disabled public page:

- Is blocked through `PublicPageVisibilityRoute`
- Is removed from Navbar, public header and Footer
- Is removed from the XML sitemap
- Does not force the homepage section to be disabled

Experience visibility behavior was tested in both disabled and enabled states.

## Development Workflow

Every development session should:

1. Read `AGENTS.md`.
2. Read `docs/SESSION_HANDOFF.md`.
3. Read `docs/CURRENT_STATUS.md`.
4. Read `docs/ROADMAP.md`.
5. Check Git status and recent commits.
6. Inspect existing code before editing.
7. Work on one major numbered step at a time.
8. Validate the change.
9. Update documentation.
10. Commit and push verified work only.

## Current Major Warnings

### Client Bundle Size

Latest verified Experience public build:

- Vite: `8.1.5`
- Modules transformed: `164`
- Main JavaScript bundle: `1,057.06 kB`
- Gzip size: `223.72 kB`
- Build result: successful

The warning is non-blocking and belongs to the later performance phase.

### Client Dependency Audit

A previous client audit reported one high-severity vulnerability.

Do not run `npm audit fix --force` without identifying the package and reviewing breaking changes.

### Line Endings

Git may report CRLF-to-LF conversion warnings. No Experience whitespace error was found by `git diff --check` or `git diff --cached --check`.

## Current Development Position

Active checkpoint:

`Testimonials documentation synchronization`

Implementation status:

- Testimonials backend: complete and pushed
- Testimonials frontend foundation: complete and pushed
- Testimonials Admin interface: complete and pushed
- Testimonials public integration: complete and pushed
- Testimonials documentation: current checkpoint

## Current Immediate Step

1. Synchronize the nine repository-memory documents with the completed Testimonials module.
2. Run documentation whitespace and scope checks.
3. Run a focused Codex documentation review before staging.
4. Stage only the intended documentation files after approval.
5. Commit and push the documentation-only checkpoint.
6. Confirm `main` and `origin/main` are synchronized.
7. Begin the next approved major module from `docs/ROADMAP.md`.

Recommended next major module:

`Fully Dynamic Blog or News Management Module`

## Source of Truth

1. Repository files
2. Git history
3. Repository documentation
4. Verified database and runtime behavior

Long chat history is not the primary project memory.
