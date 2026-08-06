# Project Overview

Last updated: 2026-08-06

## Project Name

RakeshNexify MERN Portfolio and Admin CMS.

## Repository

Local desktop path:

`D:\rakeshnexify-portfolio`

Main Git branch:

`main`

Remote repository:

`origin/main`

Latest pushed development commit:

`6c0e2a1 Add public Education section and page`

Recent Education checkpoints:

- `2604555 Add dynamic Education admin interface`
- `8fd4cd6 Add dynamic education backend APIs`

Recent Skills checkpoints:

- `92966df Fix Skills CTA visibility`
- `1bb7e5f Add public Skills section and page`
- `5311e2d Add dynamic skills admin interface`
- `6aa985c Add dynamic skills backend APIs`

Skills, Education and the previously completed Team implementation are committed and pushed to `origin/main`.

## Project Purpose

This project is a professional personal and business portfolio platform for RakeshNexify.

It is designed to present:

- Professional identity
- MERN development services
- WordPress development services
- Completed projects
- Companies owned or managed
- Team members
- Skills and tools
- Education
- Development experience
- Client testimonials
- Contact information
- Social and professional platforms

The project also includes a protected Admin Panel so manageable website content can be updated without directly editing source code.

## Primary Development Goal

Build a production-ready, secure, responsive and fully dynamic MERN portfolio.

Every reasonable content item should be controlled through the Admin Panel rather than being unnecessarily hard-coded.

This includes:

- Brand name and logo
- Owner information
- Hero content
- About content
- Homepage sections
- Section visibility
- Section order
- Navbar labels
- Navbar visibility
- Navbar order
- Dedicated public-page visibility
- Services
- Statistics
- Skills
- Education
- Projects
- Companies
- Team members
- Contact information
- Platform links
- Footer content
- SEO metadata
- Sitemap behavior
- Publication controls

## Target Users

### Public Visitors

Public visitors should be able to:

- Understand the RakeshNexify brand
- Review available development services
- See project work
- View company information
- Meet the Team
- Review statistics and achievements
- Contact the owner
- Open related social and professional profiles
- Browse the website on desktop, tablet and mobile

### Website Owner and Admin Users

Authorized Admin users should be able to:

- Log in securely
- Manage public content
- Create, edit and delete supported records
- Control visibility and featured status
- Control display order
- Manage public-page publication
- Review contact messages
- Update SEO and site-wide settings
- Create and manage Team member profiles
- Connect Team members with Projects, Companies and Services

## Technology Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- JavaScript
- Reusable components
- Custom hooks
- API service modules

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- REST APIs
- JWT authentication
- Role-based authorization

### Security and Production

- Helmet
- CORS configuration
- Rate limiting
- Environment-based configuration
- Password hashing
- Protected Admin routes
- Production Express server
- Dynamic sitemap
- SEO metadata
- JSON-LD structured data
- Visibility-aware public routing

### Development Tools

- VS Code
- Git
- GitHub
- MongoDB Atlas
- npm
- ChatGPT Project
- Codex or another repository-aware coding agent

## Current Architecture

The project follows a separated frontend and backend structure.

### Client Responsibilities

The client handles:

- Public pages
- Admin pages
- Navigation
- Route protection
- API requests
- Form interfaces
- Loading states
- Error states
- Responsive layouts
- SEO rendering
- JSON-LD rendering
- Public visibility behavior

### Server Responsibilities

The server handles:

- Database connection
- Data models
- Public APIs
- Admin APIs
- Authentication
- Authorization
- Validation
- Security middleware
- Sitemap generation
- Production delivery

### Database Responsibilities

MongoDB stores dynamic data for:

- Site Settings
- Services
- Statistics
- Skills
- Education
- Projects
- Companies
- Team members
- Contact messages
- Admin users
- Future Testimonials
- Future Experience records
- Other future dynamic modules

## Completed Core Modules

The project currently includes:

- Admin authentication
- Admin dashboard
- Dynamic Site Settings
- Modular Site Settings pages
- Services management
- Statistics management
- Skills management
- Education management
- Projects management
- Companies management
- Team backend APIs
- Team Admin management
- Public Team website
- Contact messages management
- Dynamic homepage section registry
- Dynamic Navbar controls
- Independent public-page visibility
- Dynamic Footer
- Dynamic SEO metadata
- Reusable JSON-LD support
- Dynamic visibility-aware XML sitemap
- Public Not Found page
- Production server configuration
- Repository-memory documentation system

## Dynamic Skills Management Status

Overall status:

`COMPLETE, VALIDATED AND PUSHED`

Verified checkpoints:

- `6aa985c Add dynamic skills backend APIs`
- `5311e2d Add dynamic skills admin interface`
- `1bb7e5f Add public Skills section and page`
- `92966df Fix Skills CTA visibility`

Completed scope:

- `Skill` model and `skills` collection
- Public and protected Admin APIs
- Admin listing, create and edit workflows
- Search and practical filters
- Visibility, featured and display-order controls
- Homepage Skills section
- Public `/skills` page
- Dynamic Site Settings content
- Independent publication controls
- Navbar, public-header and Footer integration
- SEO, JSON-LD and sitemap
- Loading, error and empty states
- No fake or automatically seeded Skill records

## Dynamic Education Management Status

Overall status:

`COMPLETE, VALIDATED AND PUSHED`

Verified checkpoints:

- `8fd4cd6 Add dynamic education backend APIs`
- `2604555 Add dynamic Education admin interface`
- `6c0e2a1 Add public Education section and page`

Completed scope:

- `Education` model and `education` collection
- Public and protected Admin APIs
- Strict date validation and current-study behavior
- Private duplicate identity
- Admin listing, create and edit workflows
- Search and practical filters
- Visibility, featured and display-order controls
- Homepage Education timeline
- Public `/education` page
- Dynamic Site Settings content
- Independent publication controls
- Navbar, public-header and Footer integration
- SEO, safe JSON-LD and sitemap
- Loading, error and empty states
- Verified Mongoose 9 middleware correction
- No fake or automatically seeded Education records

## Dynamic Team Management Status

Overall status:

`COMPLETE, VALIDATED AND PUSHED`

### Completed Backend

- `TeamMember` MongoDB model
- Explicit `teamMembers` collection
- Public Team listing API
- Public Team slug-details API
- Protected Admin Team CRUD API
- Search and filters
- Role-based permissions
- Profile, biography, contact and social fields
- Project, Company and Service relationships
- Visibility, featured and order controls
- Member-specific SEO fields
- Hidden-member protection on public endpoints
- Hidden related-record protection on public details
- Runtime API validation
- Backend Git checkpoint pushed in commit `90cb41b`

### Completed Admin Frontend

- Admin dashboard Team module
- Team members listing page
- Search and filters
- Create Team member page
- Edit Team member page
- Reusable Team form
- Relationship selectors
- Visibility and featured quick actions
- Role-restricted deletion
- Browser-tested create, update, filter and delete workflows
- Admin frontend Git checkpoint pushed in commit `95578b5`

### Completed Public Team Website

- Public Team API service
- Public Team listing hook
- Public Team member-detail hook
- Reusable public Team member card
- `/team` listing page
- `/team/:slug` member-details page
- Loading, error, empty and not-found states
- Homepage Team section
- Team placement after Projects and before Companies
- Related Projects display
- Related Companies display
- Related Services display
- Full-width responsive related-record grids
- Profile-image fallback initials
- Portfolio, website and social-profile links
- Team Site Settings content
- Independent homepage visibility
- Independent Navbar visibility
- Independent public-page visibility
- Navbar integration
- Public-page-header integration
- Footer integration
- Visibility-aware public routes
- XML sitemap integration
- Visible-member sitemap filtering
- Hidden-member sitemap filtering
- Team public-page sitemap filtering
- Member-specific public SEO
- Canonical URLs
- Open Graph and Twitter metadata
- Team listing `CollectionPage` and `ItemList` JSON-LD
- Team member `ProfilePage` and `Person` JSON-LD
- Invalid-member `noindex, nofollow` protection
- Stale structured-data cleanup during route changes
- API and browser runtime validation
- Temporary Team test-record deletion

Current valid public Team member:

- Name: `Rakesh Pandit`
- Slug: `rakesh-pandit`
- Visibility: enabled

Current valid Team sitemap URLs:

- `https://rakeshnexify.com/team`
- `https://rakeshnexify.com/team/rakesh-pandit`

## Current Homepage Sections

Currently implemented homepage sections include:

1. Hero
2. About
3. Statistics
4. Skills
5. Services
6. Projects
7. Education
8. Team
9. Companies
10. Contact

The approved long-term homepage order is:

1. Hero
2. Statistics
3. About
4. Skills
5. Services
6. Projects
7. Experience
8. Team
9. Companies
10. Testimonials
11. Contact

The final order remains Admin-controlled.

The current Team section is placed after Projects and before Companies.

## Existing Public Routes

The project currently supports public frontend routes for:

- Homepage: `/`
- Statistics: `/statistics`
- Skills: `/skills`
- Services: `/services`
- Projects: `/projects`
- Project details: `/projects/:slug`
- Education: `/education`
- Team: `/team`
- Team member details: `/team/:slug`
- Companies: `/companies`
- Company details: `/companies/:slug`
- Public Not Found page

Public Team API routes:

- `GET /api/team`
- `GET /api/team/:slug`

## Existing Admin Areas

The Admin Panel currently includes management areas for:

- Site Settings
- Services
- Statistics
- Skills
- Education
- Projects
- Team Members
- Companies
- Contact messages

Current Team Admin routes:

- `/admin/team`
- `/admin/team/new`
- `/admin/team/:id/edit`

Future Admin areas should include:

- Experience
- Testimonials
- Blog or News
- Additional SEO tools
- Media management

## Dynamic Visibility Design

Supported sections can independently control:

- Homepage visibility
- Navbar visibility
- Dedicated public-page visibility
- Homepage display order
- Navbar display order
- Public label

This prevents one visibility option from incorrectly controlling every part of the website.

For example, a module may be:

- Visible on the homepage
- Hidden from the Navbar
- Available through its dedicated public URL

Or it may be completely disabled.

Disabled pages should not remain accessible through direct routes or the sitemap.

Team member records support member-level:

- `isVisible`
- `isFeatured`
- `order`
- `status`
- `availabilityStatus`

The Team module also supports independent:

- Homepage section visibility
- Navbar visibility
- Dedicated public-page visibility
- Homepage display order
- Navbar display order
- Dynamic public navigation label

Validated Team visibility behavior:

- Hidden Team members are excluded from public APIs and sitemap URLs.
- Disabling the Team public page blocks `/team` and `/team/:slug`.
- Disabling the Team public page removes all Team URLs from the sitemap.
- Homepage visibility remains independent from dedicated-page visibility.
- Navbar and Footer links respect Team publication settings.
- Restoring the Team public page restores the Team routes and sitemap URLs.

## Design Direction

The visual system should remain:

- Modern
- Professional
- Clean
- Responsive
- Consistent
- Accessible
- Suitable for real clients
- Suitable for all MERN and WordPress development services

The website should not appear limited to only e-commerce work.

## Code Organization Direction

The project should continue using:

- Small dedicated components
- Small pages
- Hooks
- Service files
- Utility files
- Separate models
- Separate controllers
- Separate routes
- Configuration files
- Minimal route and root application files

Large files should be divided when separation improves readability, maintenance and debugging.

## Development Workflow

Every development session should:

1. Read `AGENTS.md`.
2. Read `docs/SESSION_HANDOFF.md`.
3. Read `docs/CURRENT_STATUS.md`.
4. Read `docs/ROADMAP.md`.
5. Check Git status.
6. Check recent Git commits.
7. Inspect existing code.
8. Work on one small numbered step.
9. Test the change.
10. Update documentation.
11. Commit and push only verified work.

## Current Major Warnings

### Client Bundle Size

Vite currently reports a JavaScript bundle larger than 500 kB after minification.

Latest verified main JavaScript bundle:

`926.41 kB`

Latest verified gzip size:

`201.15 kB`

This warning is not blocking current development.

A later performance phase should evaluate route-based code splitting and Admin/public bundle separation.

### Client Dependency Audit

The client dependency audit previously reported one high-severity vulnerability.

It must be inspected before applying any forced dependency update.

Do not run `npm audit fix --force` without reviewing the affected package and breaking changes.

## Current Development Position

Active checkpoint:

`Skills and Education documentation synchronization`

Implementation status:

- Skills: complete, validated and pushed
- Education: complete, validated and pushed
- Team and earlier modules: complete

Latest pushed development commit:

`6c0e2a1 Add public Education section and page`

## Current Immediate Step

1. Validate the nine updated repository-memory documents.
2. Commit and push the documentation-only checkpoint.
3. Confirm the working tree is clean.
4. Start Experience Step 1 repository audit and final contract verification.

Approved next module:

`Fully Dynamic Experience Management Module`

The Experience MVP will use:

- Mongoose model `Experience`
- MongoDB collection `experiences`
- Public `/experience`
- Protected Admin CRUD
- Homepage Experience timeline
- No public detail page in the MVP
- No fake or automatically seeded records

## Source of Truth

The source of truth for this project is:

1. Repository files
2. Git history
3. Repository documentation
4. Verified database and runtime behavior

Long chat history should not be treated as the only project memory.
