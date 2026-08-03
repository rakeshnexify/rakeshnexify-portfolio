# Project Overview

Last updated: 2026-08-03

## Project Name

RakeshNexify MERN Portfolio and Admin CMS.

## Repository

Local desktop path:

`D:\rakeshnexify-portfolio`

Main Git branch:

`main`

Remote repository:

`origin/main`

## Project Purpose

This project is a professional personal and business portfolio platform for RakeshNexify.

It is designed to present:

- Professional identity
- MERN development services
- WordPress development services
- Completed projects
- Companies owned or managed
- Team members
- Development experience
- Skills and tools
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
- Meet the team
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
- Projects
- Companies
- Contact messages
- Admin users
- Future Team members
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
- Projects management
- Companies management
- Contact messages management
- Dynamic homepage section registry
- Dynamic Navbar controls
- Independent public-page visibility
- Dynamic Footer
- Dynamic SEO metadata
- Dynamic XML sitemap
- Public Not Found page
- Production server configuration

## Current Homepage Sections

Currently implemented homepage sections include:

1. Hero
2. About
3. Statistics
4. Services
5. Projects
6. Companies
7. Contact

The long-term homepage order should support:

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

## Existing Public Routes

The project currently supports public routes for:

- Homepage
- Statistics
- Services
- Projects
- Project details
- Companies
- Company details
- Public Not Found page

Additional public routes will be added for future modules.

## Existing Admin Areas

The Admin Panel currently includes management areas for:

- Site Settings
- Services
- Statistics
- Projects
- Companies
- Contact messages

Future Admin areas should include:

- Team
- Skills
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

## Current Major Warning

Vite currently reports a JavaScript bundle larger than 500 kB after minification.

This warning is not blocking current development.

A later performance phase should evaluate route-based code splitting.

The client dependency audit has also reported one high-severity vulnerability. It must be inspected before applying any forced dependency update.

## Next Major Feature

The next major feature after the documentation phase is:

`Dynamic Team Management System`

This feature will include Admin CRUD, public APIs, homepage integration, public listing and details pages, SEO, visibility controls, sitemap integration and responsive layouts.

## Source of Truth

The source of truth for this project is:

1. Repository files
2. Git history
3. Repository documentation
4. Verified database and runtime behavior

Long chat history should not be treated as the only project memory.
