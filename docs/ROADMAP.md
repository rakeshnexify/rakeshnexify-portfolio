# Project Roadmap

Last updated: 2026-08-04

## Project

RakeshNexify MERN Portfolio and Admin CMS.

This roadmap records completed phases, current work and future development order.

Status labels:

- COMPLETE — Implemented and verified
- IN PROGRESS — Currently being completed
- PLANNED — Approved future work
- REVIEW — Requires investigation before implementation
- OPTIONAL — Useful but not required for the first production release

## Phase 1 — Project Foundation

Status: COMPLETE

Completed:

- MERN project structure
- React and Vite client
- Express and Node.js server
- MongoDB Atlas connection
- Root npm scripts
- Environment configuration
- Development workflow
- Git repository
- GitHub remote
- Production client build
- Production Express server foundation

## Phase 2 — Security Foundation

Status: COMPLETE

Completed:

- Admin authentication
- JWT support
- Password hashing
- Protected Admin routes
- Role-based permissions
- Helmet configuration
- CORS configuration
- Rate limiting
- Production environment validation
- Secure public URL handling

Future security review:

- Review dependency audit findings
- Review authentication token expiry behavior
- Review production cookie strategy when final deployment is selected
- Add automated authorization tests
- Add security logging where useful

## Phase 3 — Public Website Foundation

Status: COMPLETE

Completed:

- Dynamic Navbar
- Mobile navigation
- Dynamic Footer
- Hero section
- About section
- Services section
- Statistics section
- Projects section
- Companies section
- Contact section
- Public page header
- Public Not Found page
- Route scroll recovery
- Responsive foundation

## Phase 4 — Admin Panel Foundation

Status: COMPLETE

Completed:

- Admin login
- Admin dashboard
- Admin route protection
- Site Settings management
- Services management
- Statistics management
- Projects management
- Team Members management
- Companies management
- Contact messages management

Future Admin improvements:

- Dashboard analytics
- Recent activity
- Better global search
- Reusable confirmation dialog
- Reusable notification system
- Media selection tools
- Bulk actions
- Import and export tools

## Phase 5 — Dynamic Site Settings

Status: COMPLETE

Completed categories:

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

Completed behavior:

- Modular settings overview
- Separate category editor pages
- Database-backed settings
- Dynamic public refresh
- Independent homepage visibility
- Independent Navbar visibility
- Independent dedicated-page visibility
- Homepage display order
- Navbar display order
- Dynamic public labels

Future settings improvements:

- Theme colors
- Font controls
- Button style controls
- Section background controls
- Global spacing controls
- Maintenance mode
- Announcement bar
- Additional publication settings

## Phase 6 — Services Module

Status: COMPLETE

Completed:

- Service database model
- Public Services API
- Admin Services API
- Admin create and edit
- Visibility controls
- Featured controls
- Display order
- Homepage integration
- Dedicated Services page

Future improvements:

- Service details pages
- Service-specific SEO
- Related Projects
- Related Team members
- Inquiry CTA per service
- Service category filters

## Phase 7 — Statistics Module

Status: COMPLETE

Completed:

- Statistic database model
- Default data
- Public Statistics API
- Admin CRUD API
- Admin listing
- Admin create and edit form
- Homepage Statistics section
- Dedicated Statistics page
- Responsive cards
- Visibility controls
- Featured controls
- Display order
- Navbar integration
- Sitemap integration
- Site Settings content
- CTA controls

Verified record:

`Projects Completed: 4+`

## Phase 8 — Projects Module

Status: COMPLETE

Completed:

- Project database model
- Public Projects API
- Admin Projects API
- Admin project management
- Homepage integration
- Projects listing page
- Project details page
- Slug routing
- Visibility controls
- Featured controls
- SEO support
- Sitemap support

Future improvements:

- Advanced filters
- Project categories
- Technology filters
- Image gallery
- Case-study sections
- Project timeline
- Client review relation
- Related Team members
- Related Services
- Live-site and repository validation

## Phase 9 — Companies Module

Status: COMPLETE

Completed:

- Company database model
- Public Companies API
- Admin Companies API
- Admin company management
- Homepage integration
- Companies listing page
- Company details page
- Slug routing
- Visibility controls
- Featured controls
- SEO support
- Sitemap support

Future improvements:

- Related Team members
- Related Projects
- Related Services
- Company milestones
- Company gallery
- Business-category filters

## Phase 10 — Contact System

Status: COMPLETE

Completed:

- Public contact form
- MongoDB message storage
- Admin contact-message listing
- Message status management
- Dynamic contact information
- Dynamic platform links

Future improvements:

- Email notifications
- Auto-response email
- Spam protection
- Message notes
- Assignment to Team members
- Contact source tracking
- Message export

## Phase 11 — SEO and Sitemap

Status: COMPLETE FOR CURRENT MODULES

Completed:

- Dynamic page titles
- Dynamic descriptions
- Dynamic keywords
- Canonical URLs
- Open Graph image support
- Dynamic sitemap
- Visibility-aware sitemap filtering
- Project details routes
- Company details routes

Future improvements:

- Structured data
- Person schema
- Organization schema
- Service schema
- Project schema
- Team member schema
- Breadcrumb schema
- Robots management
- SEO preview in Admin
- Social sharing preview
- Search-engine verification settings

## Phase 12 — Repository Memory and AI Continuation

Status: COMPLETE

Purpose:

Make the repository, documentation and Git history the permanent project memory.

Completed:

- Existing documentation audit
- Root `AGENTS.md`
- `docs/SESSION_HANDOFF.md`
- `docs/PROJECT_OVERVIEW.md`
- `docs/CURRENT_STATUS.md`
- `docs/ROADMAP.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/API_ROUTES.md`
- `docs/PROJECT_STRUCTURE.md`
- `docs/DECISIONS.md`
- `docs/BUGS.md`
- Actual database-model audit
- Actual backend-route audit
- Actual client and server structure audit
- Stale documentation audit and synchronization
- Final documentation-content validation
- Markdown-fence validation
- Secret audit
- Whitespace validation

The documentation set is ready to serve as permanent repository memory.

## Phase 13 — Dynamic Team Management System

Status: IMPLEMENTATION COMPLETE — FINAL DOCUMENTATION, VALIDATION, COMMIT AND PUSH PENDING

The Team backend, protected Admin management interface and public Team website integration are complete and validated.

The current remaining work is final documentation synchronization, repository-wide validation, commit and push.

### Backend

Status: COMPLETE

Completed:

- `TeamMember` MongoDB model
- Explicit `teamMembers` collection
- Required-field validation
- Unique lowercase slug validation
- Member status and availability enums
- Skills and tools normalization
- Contact, portfolio and social-link fields
- Related Project ObjectId references
- Related Company ObjectId references
- Related Service ObjectId references
- Visibility, featured and display-order controls
- Member-specific SEO fields
- Admin audit fields
- Publication, status and text-search indexes
- Public Team listing API
- Public Team member-details API
- Hidden-member protection on public endpoints
- Visible-related-record filtering on public details
- Protected Admin Team CRUD API
- Admin search and filtering
- Role-based create and update permissions
- Role-based permanent deletion
- Validation, duplicate and invalid-reference error responses
- Root validation-script integration
- Authenticated API runtime testing
- Backend Git checkpoint pushed in commit `90cb41b`

Deferred backend improvement:

- Add pagination when Team record volume requires it

### Admin Panel

Status: COMPLETE

Git checkpoint:

`95578b5 Add dynamic team admin management`

Completed:

- Team Members dashboard module
- Team members listing page
- Search filter
- Professional-role filter
- Member-status filter
- Availability-status filter
- Visibility filter
- Featured-status filter
- Responsive Team member cards
- Create Team member page
- Edit Team member page
- Reusable Team member form
- Automatic slug generation
- Local form validation
- Server field-error display
- Profile and cover image fields
- Skills and tools editors
- Contact and portfolio fields
- Social-profile fields
- Related Project selector
- Related Company selector
- Related Service selector
- SEO fields
- Member status control
- Availability control
- Visibility control
- Featured control
- Display order
- Quick visibility action
- Quick featured action
- Role-restricted permanent deletion
- Admin Team listing route
- Admin Team create route
- Admin Team edit route
- Dashboard navigation integration

Current Admin routes:

- `/admin/team`
- `/admin/team/new`
- `/admin/team/:id/edit`

### Implemented Team Member Fields

Identity and profile:

- `name`
- `slug`
- `professionalRole`
- `teamPosition`
- `shortIntroduction`
- `biography`
- `profileImageUrl`
- `profileImageAlt`
- `coverImageUrl`

Expertise:

- `skills`
- `tools`

Status and availability:

- `status`
- `availabilityStatus`

Contact and links:

- `email`
- `phone`
- `websiteUrl`
- `portfolioUrl`

Social links:

- `github`
- `linkedin`
- `facebook`
- `instagram`
- `youtube`
- `x`

Cross-module relations:

- `relatedProjects`
- `relatedCompanies`
- `relatedServices`

Publication:

- `order`
- `isFeatured`
- `isVisible`

SEO:

- `seo.title`
- `seo.description`
- `seo.keywords`
- `seo.ogImageUrl`

Audit and timestamps:

- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

### Admin Validation Completed

Verified browser workflows:

- Empty Team listing
- Team member creation
- Team member editing
- Saved-data persistence
- Project relationship selection
- Company relationship selection
- Service relationship selection
- Search filtering
- Role filtering
- Status filtering
- Availability filtering
- Visibility filtering
- Featured filtering
- Hide and show actions
- Feature and unfeature actions
- Permanent deletion
- Temporary test-record cleanup
- Dashboard-to-Team navigation

Verified project checks:

- Client production build
- Root `npm run check`
- Team backend syntax checks
- `git diff --check`
- No known blocking Team Admin issue

### Public Website

Status: IMPLEMENTATION COMPLETE

Completed:

- Public Team API service
- Public Team list hook
- Public Team member-detail hook
- Reusable Team member card
- Homepage Team preview section
- `/team` listing page
- `/team/:slug` details page
- Related Projects display
- Related Companies display
- Related Services display
- Loading state
- Error state
- Empty state
- Not-found state
- Responsive public layouts
- Semantic buttons and links
- Screen-reader helper text for external links
- Homepage-section registry integration
- Team placement after Projects and before Companies
- Team Site Settings content
- Module-level homepage visibility
- Module-level Navbar visibility
- Module-level public-page visibility
- Homepage display order
- Navbar display order
- Dynamic public label
- Navbar integration
- Public-page-header integration
- Footer integration
- Visibility-aware public routing
- `/team` sitemap integration
- Visible-member detail sitemap URLs
- Hidden-member sitemap filtering
- Public-page visibility sitemap filtering
- Member-specific page metadata
- Canonical URL support
- Open Graph metadata
- Twitter metadata
- Open Graph image fallback support
- Reusable JSON-LD support in `PageSeo`
- `/team` `CollectionPage` structured data
- `/team` `ItemList` structured data
- `/team/:slug` `ProfilePage` structured data
- `/team/:slug` `Person` structured data
- Invalid-member `noindex, nofollow` protection
- Stale structured-data cleanup during route changes

Runtime validation completed:

- Public listing displays visible members only
- Public details return visible members only
- Hidden members return `404`
- Related hidden records are excluded
- Quick Hide action works
- Quick Show action works
- Team homepage section renders API data
- Team Navbar link respects publication settings
- Team Footer link respects publication settings
- Disabling the public Team page blocks Team public routes
- Disabling the public Team page removes Team sitemap URLs
- Restoring the public Team page restores Team sitemap URLs
- Team listing SEO metadata was browser-tested
- Team member SEO metadata was browser-tested
- Team listing JSON-LD was browser-tested
- Team member JSON-LD was browser-tested
- Invalid-member SEO protection was browser-tested
- Temporary `Public Team Test` record was permanently deleted

Current valid public Team record:

- Name: `Rakesh Pandit`
- Slug: `rakesh-pandit`
- Visibility: enabled

Current valid Team sitemap URLs:

- `https://rakeshnexify.com/team`
- `https://rakeshnexify.com/team/rakesh-pandit`

Final phase-close validation still required:

- Run complete server syntax and configured project checks
- Run the final production build
- Review the complete implementation diff
- Complete documentation synchronization
- Commit and push the verified phase

### Team Data Policy

- Do not add fake or hard-coded Team members.
- Team records must be created dynamically through the protected Admin interface.
- Temporary validation records must be deleted after testing.

## Phase 14 — Skills Management

Status: PLANNED

Planned:

- Skills database model
- Skill categories
- Skill level
- Icon or image
- Visibility
- Featured status
- Display order
- Admin CRUD
- Homepage section
- Dedicated Skills page
- Team relation
- Project relation

## Phase 15 — Experience and Timeline

Status: PLANNED

Planned:

- Experience database model
- Work experience
- Freelance experience
- Education timeline
- Certification timeline
- Start and end dates
- Current-position flag
- Organization relation
- Visibility
- Display order
- Admin CRUD
- Homepage timeline
- Dedicated Experience page
- SEO support

## Phase 16 — Testimonials

Status: PLANNED

Planned:

- Testimonial database model
- Client name
- Client role
- Company
- Profile image
- Review content
- Rating
- Project relation
- Featured status
- Visibility
- Display order
- Admin CRUD
- Homepage section
- Dedicated Testimonials page
- Structured data review

## Phase 17 — Blog or News

Status: PLANNED

Planned:

- Post model
- Categories
- Tags
- Author
- Slug
- Featured image
- Rich content
- Draft and publication status
- Scheduled publishing
- SEO fields
- Admin CRUD
- Public listing
- Post details page
- Sitemap integration
- Search and filters

## Phase 18 — Media Management

Status: PLANNED

Planned:

- Reusable media library
- Image upload
- Image selection
- Image metadata
- Alternative text
- File validation
- File-size validation
- Image deletion protection
- Cloud storage integration
- Reuse across Projects, Companies, Team and Blog

## Phase 19 — Email and Notifications

Status: PLANNED

Planned:

- Contact-form notification
- Auto-response email
- Admin notification settings
- SMTP or email-service configuration
- Template management
- Delivery failure handling
- Safe environment variables

## Phase 20 — Testing and Quality Assurance

Status: PLANNED

Planned:

- API tests
- Authentication tests
- Authorization tests
- Form validation tests
- Route visibility tests
- Sitemap tests
- Responsive browser testing
- Keyboard testing
- Accessibility review
- Empty-state testing
- Loading-state testing
- Error-state testing
- Cross-browser testing

## Phase 21 — Performance Optimization

Status: REVIEW

Known current warning:

- Main client JavaScript chunk is larger than 500 kB after minification.

Planned review:

- Route-based lazy loading
- Dynamic imports
- Bundle analysis
- Admin and public bundle separation
- Image optimization
- Font optimization
- API request caching
- Database query indexes
- Pagination
- Compression
- Production caching headers

## Phase 22 — Dependency Security Review

Status: REVIEW

Known current warning:

- Client dependency audit reported one high-severity vulnerability.

Required process:

1. Run a non-destructive audit.
2. Identify the affected package.
3. Review whether it is a development or production dependency.
4. Review available safe versions.
5. Test updates on a separate branch when appropriate.
6. Never apply `npm audit fix --force` without reviewing breaking changes.

## Phase 23 — Final Production Deployment

Status: PLANNED

Planned:

- Select frontend and backend hosting
- Configure final production domain
- Configure production MongoDB access
- Configure secure environment variables
- Configure final CORS origin
- Configure HTTPS
- Configure redirects
- Configure domain DNS
- Validate sitemap URL
- Validate robots behavior
- Validate social preview
- Validate contact delivery
- Validate Admin login
- Create deployment documentation
- Create backup strategy
- Add monitoring and logs

## Phase 24 — Post-Launch Maintenance

Status: PLANNED

Planned:

- Error monitoring
- Uptime monitoring
- Database backups
- Dependency update schedule
- Content update workflow
- SEO performance review
- Analytics review
- Security review
- Performance review
- Regular documentation updates

## Current Immediate Next Step

Complete the final Phase 13 documentation synchronization.

Required order:

1. Update `docs/PROJECT_OVERVIEW.md`.
2. Update `docs/PROJECT_STRUCTURE.md`.
3. Update `docs/DECISIONS.md`.
4. Search all project documentation for stale Team planning references.
5. Run server syntax checks.
6. Run `npm run check`.
7. Run `npm run build`.
8. Run `git diff --check`.
9. Review `git status --short`.
10. Review the complete diff.
11. Stage only verified implementation and documentation files.
12. Run staged-diff validation.
13. Commit with:

```text
Add public team website integration