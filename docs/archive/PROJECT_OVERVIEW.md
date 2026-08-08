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

`e22eb2e Add Blog and News SEO and sitemap integration`

Recent Experience checkpoints:

- `91263aa Add public Experience section and page`
- `8e235fb Add dynamic Experience admin interface`
- `5dbcb7a Add Experience frontend services and form utilities`
- `b117e22 Add dynamic Experience backend APIs`


Recent Blog / News checkpoints:

- `e22eb2e Add Blog and News SEO and sitemap integration`
- `3b3ed37 Integrate Blog and News with site settings`
- `4ae0312 Add public Blog and News pages`
- `10e662c Add dynamic Blog and News admin interface`
- `9aeb0b6 Add Blog and News frontend foundation`
- `57127e2 Add dynamic Blog and News backend APIs`

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
- Blog articles and News updates
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
- Services, Statistics, Skills, Education, Experience, Testimonials and Blog/News Posts
- Projects, Team members and Companies
- Testimonials and client-review publication
- Blog and News publishing, visibility and SEO
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
- Blog/News Posts
- Projects
- Companies
- Team members
- Media metadata
- Contact messages

Blog and News are now implemented through one shared `Post` model and `posts` collection.

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
- Blog and News management
- Projects management
- Team management
- Media Management and reusable Media Picker
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



## Dynamic Blog / News Management Status

Overall status:

`COMPLETE, VALIDATED, COMMITTED AND PUSHED`

### Shared Architecture

- One `Post` model
- One `posts` MongoDB collection
- `type: blog | news`
- Globally unique slug across both types
- Shared public and Admin API resources
- Distinct Blog and News public collection/detail routes

### Backend

- Public `GET /api/posts`
- Public `GET /api/posts/:slug`
- Protected Admin CRUD at `/api/admin/posts`
- Strict search/type/category/tag/featured filters
- Admin visibility and featured filters
- Credential-free HTTP/HTTPS image validation
- Related Project validation and public hidden-record protection
- Partial nested SEO PATCH preservation
- Server-controlled Admin audit fields
- JWT authentication and RBAC

### Admin Frontend

- `/admin/posts`
- `/admin/posts/new`
- `/admin/posts/:id/edit`
- Dashboard Blog & News card
- Search and practical filters
- Reusable Post form
- Blog/News type selection
- Tags and category
- Publication timestamp and reading time
- Related Projects multi-select
- SEO fields
- Visibility and featured quick actions
- Role-restricted permanent deletion
- Mutation AbortSignal and stale-navigation protection

### Public Website

- `/blog`
- `/news`
- `/blog/:slug`
- `/news/:slug`
- Search, category, tag and featured filters
- Shared reusable `PostCard`
- Type-protected detail rendering
- Plain-text article content
- Publication metadata
- Related visible Projects
- Homepage `Latest Articles & News`
- Up to four chronologically latest preview records
- No fake Posts

### Site Settings and Publication

- `posts` registry key for the homepage-only combined section
- `blog` registry key for Blog navigation/public-page visibility
- `news` registry key for News navigation/public-page visibility
- `postsSection` dynamic heading, description and CTA
- Independent Blog and News public-page controls
- Independent Blog and News Navbar visibility/order/labels
- Combined homepage visibility/order
- Navbar `More` overflow menu for wide navigation sets
- Footer and public-header integration
- Visibility-protected listing and detail routes

### SEO and Sitemap

- `/blog` and `/news` canonical metadata
- Unfiltered settled listing `CollectionPage` + `ItemList`
- Blog detail `BlogPosting` + `BreadcrumbList`
- News detail `NewsArticle` + `BreadcrumbList`
- No stale collection JSON-LD during filters/loading/errors
- Visibility-aware Blog and News collection/detail sitemap URLs
- Hidden Posts excluded from sitemap

### Runtime Validation

- Backend and MongoDB startup
- Admin create/list workflows
- Public Blog/News listing and detail
- Filters
- Cross-type protection
- Homepage publication chronology
- Independent page/navigation/Footer visibility
- Disabled-page homepage-card behavior
- JSON-LD
- Sitemap
- Temporary Post cleanup

Final comprehensive Codex review reported no blocking, important or minor findings.

Verified checkpoints:

- `57127e2 Add dynamic Blog and News backend APIs`
- `9aeb0b6 Add Blog and News frontend foundation`
- `10e662c Add dynamic Blog and News admin interface`
- `4ae0312 Add public Blog and News pages`
- `3b3ed37 Integrate Blog and News with site settings`
- `e22eb2e Add Blog and News SEO and sitemap integration`

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
11. Articles & News
12. Testimonials
13. Contact

The final visible order remains Admin-controlled through Site Settings.

Articles & News and Testimonials are part of the completed shared registry. Blog and News also have page-only publication/navigation registry entries.

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
- `/blog`
- `/blog/:slug`
- `/news`
- `/news/:slug`
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
- Blog & News Posts

Blog/News Admin routes:

- `/admin/posts`
- `/admin/posts/new`
- `/admin/posts/:id/edit`

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
- Modules transformed: `177`
- Main JavaScript bundle: `1,157.35 kB`
- Gzip size: `242.70 kB`
- Build result: successful

The warning is non-blocking and belongs to the later performance phase.

### Client Dependency Audit

A previous client audit reported one high-severity vulnerability.

Do not run `npm audit fix --force` without identifying the package and reviewing breaking changes.

### Line Endings

Git may report CRLF-to-LF conversion warnings. No Experience whitespace error was found by `git diff --check` or `git diff --cached --check`.

## Current Development Position

Active checkpoint:

`Blog / News documentation synchronization`

Implementation status:

- Blog/News backend: complete and pushed
- Blog/News frontend foundation: complete and pushed
- Blog/News Admin interface: complete and pushed
- Blog/News public pages: complete and pushed
- Blog/News Site Settings/homepage integration: complete and pushed
- Blog/News SEO/sitemap integration: complete and pushed
- Blog/News runtime verification: complete
- Blog/News final Codex review: complete
- Blog/News documentation: current checkpoint

## Current Immediate Step

1. Synchronize the nine repository-memory documents with the completed Blog/News module.
2. Run documentation whitespace and scope checks.
3. Run a focused Codex documentation review before staging.
4. Stage only the intended documentation files after approval.
5. Commit and push the documentation-only checkpoint.
6. Confirm `main` and `origin/main` are synchronized.
7. Begin the next approved major module from `docs/ROADMAP.md`.

Recommended next major module:

`Media Management`

## Source of Truth

1. Repository files
2. Git history
3. Repository documentation
4. Verified database and runtime behavior

Long chat history is not the primary project memory.
