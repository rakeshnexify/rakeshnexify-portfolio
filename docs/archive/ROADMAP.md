# Project Roadmap

Last updated: 2026-08-09

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
- Skills management
- Education management
- Experience management
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
- Skills listing metadata and JSON-LD
- Education listing metadata and safe JSON-LD
- Experience listing metadata and JSON-LD
- Open Graph image support
- Dynamic sitemap
- Visibility-aware sitemap filtering
- Project details routes
- Company details routes
- Reusable JSON-LD support in `PageSeo`
- Team listing `CollectionPage` and `ItemList` structured data
- Team member `ProfilePage` and `Person` structured data
- Invalid-member `noindex, nofollow` protection

Future improvements:

- Organization schema
- Service schema
- Project schema
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

Status: COMPLETE — IMPLEMENTED, VALIDATED, COMMITTED AND PUSHED

The Team backend, protected Admin management interface and public Team website integration are complete.

Final implementation checkpoint:

`7ca4f6c Add public team website integration`

Previous Team checkpoints:

- `504705d Synchronize team phase documentation`
- `95578b5 Add dynamic team admin management`
- `90cb41b Add dynamic team backend APIs`

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

Status: COMPLETE

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

Final phase-close validation completed:

- Modified Team server files passed syntax validation
- Root `npm run check` passed
- Client production build passed
- Vite transformed `124` modules
- Main JavaScript bundle: `802.82 kB`
- Gzip size: `178.23 kB`
- `git diff --check` passed
- `git diff --cached --check` passed
- Complete staged file list was reviewed
- Commit `7ca4f6c Add public team website integration` was created
- `git push origin main` completed successfully
- `HEAD`, `origin/main` and `origin/HEAD` synchronized at `7ca4f6c`
- Working tree was clean immediately after the implementation push

### Team Data Policy

- Do not add fake or hard-coded Team members.
- Team records must be created dynamically through the protected Admin interface.
- Temporary validation records must be deleted after testing.

## Phase 14 — Dynamic Skills Management

Status: COMPLETE — IMPLEMENTED, VALIDATED, COMMITTED AND PUSHED

Verified checkpoints:

- `6aa985c Add dynamic skills backend APIs`
- `5311e2d Add dynamic skills admin interface`
- `1bb7e5f Add public Skills section and page`
- `92966df Fix Skills CTA visibility`

Completed:

- `Skill` model and `skills` collection
- Private normalized Skill-name key
- Unique slug
- Category and proficiency level
- Optional years of experience
- Icon and image URL support
- Public Skills API
- Protected Admin Skills CRUD API
- Search and practical filters
- RBAC
- Admin listing, create and edit pages
- Visibility and featured quick actions
- Role-restricted permanent delete
- Homepage Skills section
- Public `/skills` page
- Category grouping
- Dynamic Site Settings content
- Independent homepage, Navbar and public-page visibility
- Navbar, public-header and Footer integration
- Dynamic SEO and JSON-LD
- Visibility-aware sitemap
- Loading, error and empty states
- Runtime, browser and Codex validation
- Skills CTA visibility correction
- Temporary validation data cleanup

Deferred:

- `/skills/:slug`
- Record-specific Skill SEO
- Dynamic Skill Category model
- Complex Team and Project relations
- Endorsements
- Drag-and-drop
- Bulk import or export

## Phase 15 — Dynamic Education Management

Status: COMPLETE — IMPLEMENTED, VALIDATED, COMMITTED AND PUSHED

Verified checkpoints:

- `8fd4cd6 Add dynamic education backend APIs`
- `2604555 Add dynamic Education admin interface`
- `6c0e2a1 Add public Education section and page`

Completed:

- `Education` model and `education` collection
- Education-type enum
- Strict calendar dates
- End-date range validation
- Current-study end-date clearing
- Private normalized duplicate identity
- Institution, certificate and logo URL validation
- Public Education API
- Protected Admin Education CRUD API
- Search and practical filters
- RBAC
- Admin listing, create and edit pages
- Visibility and featured quick actions
- Role-restricted permanent delete
- Homepage Education timeline
- Public `/education` page
- Four-record preview
- Institution logo or initials fallback
- Current and featured badges
- Dynamic Site Settings content
- Independent homepage, Navbar and public-page visibility
- Navbar, public-header and Footer integration
- Dynamic SEO and safe JSON-LD
- Visibility-aware sitemap
- Loading, error and empty states
- Mongoose 9 middleware correction
- Runtime, browser and Codex validation
- Temporary validation data cleanup

Deferred:

- `/education/:slug`
- Record-specific Education SEO
- Institution model
- Cross-module relations
- Transcript or certificate file upload
- Drag-and-drop
- Bulk import or export

## Phase 16 — Dynamic Experience Management

Status: COMPLETE — IMPLEMENTED, VALIDATED, COMMITTED AND PUSHED

Verified checkpoints:

- `b117e22 Add dynamic Experience backend APIs`
- `5dbcb7a Add Experience frontend services and form utilities`
- `8e235fb Add dynamic Experience admin interface`
- `91263aa Add public Experience section and page`

Completed backend:

- `Experience` model and `experiences` collection
- Organization and job-title identity
- Employment-type enum
- Start and end dates
- Current-position end-date clearing
- Location and location type
- Short and full descriptions
- Responsibilities and achievements
- Skills and tools arrays
- Organization logo and website URLs
- Private duplicate identity
- Unique slug
- Public Experience API
- Protected Admin CRUD API
- Search and practical filters
- RBAC
- Structured validation errors
- Root validation-script integration

Completed Admin frontend:

- Dashboard Experience module
- `/admin/experience`
- `/admin/experience/new`
- `/admin/experience/:id/edit`
- Reusable Experience form
- Search and filters
- Visibility and featured quick actions
- Current/completed state handling
- Role-restricted permanent delete
- Browser workflow validation

Completed public website:

- Reusable Experience timeline card
- Homepage Experience timeline
- Four-record preview
- Public `/experience` page
- Organization logo or initials fallback
- Current and featured badges
- Responsibilities, achievements, skills and tools
- Dynamic Site Settings content
- Independent homepage, Navbar and public-page visibility
- Navbar, public-header and Footer integration
- Dynamic SEO and JSON-LD
- Visibility-aware sitemap
- Loading, error and empty states
- Runtime visibility validation
- Temporary test-data cleanup

MVP exclusions preserved:

- No `/experience/:slug`
- No record-specific Experience SEO
- No cross-module relations
- No pagination
- No separate status enum
- No fake or automatically seeded records

Deferred improvements:

- Optional relations after real use cases are defined
- Pagination if record volume requires it
- Drag-and-drop ordering
- Bulk import or export

## Phase 17 — Testimonials

Status: COMPLETE

Completed backend:

- `Testimonial` Mongoose model
- `testimonials` MongoDB collection
- Public `/api/testimonials` API
- Protected `/api/admin/testimonials` CRUD API
- Strict 1–5 integer rating validation
- Public search, rating and featured filters
- Admin search, rating, visibility, featured and related-Project filters
- Optional Project relation
- Hidden related-Project protection
- Safe HTTP/HTTPS profile and company URLs
- Visibility, featured and display order
- Admin audit fields and timestamps
- JWT authentication and RBAC

Completed frontend foundation:

- Public Testimonials API service
- Admin Testimonials API service
- `useTestimonials` hook
- Request race and abort handling
- Strict rating normalization
- Testimonial form utility and validation

Completed Admin Panel:

- Testimonials dashboard module
- `/admin/testimonials`
- `/admin/testimonials/new`
- `/admin/testimonials/:id/edit`
- Search and practical filters
- Create and edit workflows
- Related Project selector
- Visibility and featured quick actions
- Role-restricted permanent deletion
- Authoritative post-mutation reload behavior

Completed public website:

- Reusable `TestimonialCard`
- Homepage `TestimonialsSection`
- Dedicated `/testimonials` page
- Search and rating filters
- Rating stars and average rating
- Related Project link when publicly available
- Safe company website link
- Loading, error and empty states
- No public detail route

Completed Site Settings and publication:

- `testimonialsSection` content
- Independent homepage visibility
- Independent Navbar visibility
- Independent public-page visibility
- Homepage and Navbar order
- Dynamic navigation label
- Navbar, public header and Footer integration
- Visibility-protected `/testimonials` route
- CTA suppression when the Testimonials public page is disabled

Completed SEO and sitemap:

- Canonical `/testimonials`
- CollectionPage structured data
- Valid Review ItemList for the unfiltered listing
- Strict rating protection for JSON-LD
- Visibility-aware `/testimonials` sitemap entry
- No Testimonial detail URLs

Verified checkpoints:

- `d625157 Add dynamic Testimonials backend APIs`
- `c9d0dfe Fix Testimonials backend validation`
- `92f2dbd Complete strict Testimonials backend validation`
- `b340cee Add Testimonials frontend foundation`
- `5c825e1 Add dynamic Testimonials admin interface`
- `12a2e67 Add public Testimonials section and page`

Current checkpoint:

`Testimonials documentation synchronization`

Future optional improvements:

- Additional testimonial grouping or presentation modes when real content volume requires them
- Richer Project/Testimonial cross-linking from Project pages
- Automated API and UI tests
- Media-library integration for profile images
- Optional moderation or approval workflow if multiple content editors require it

## Phase 18 — Blog / News

Status: COMPLETE — IMPLEMENTED, VALIDATED, COMMITTED AND PUSHED

The Blog and News system is implemented as one shared Post module.

### Architecture

- Mongoose model: `Post`
- MongoDB collection: `posts`
- Post types:
  - `blog`
  - `news`
- Public API base: `/api/posts`
- Admin API base: `/api/admin/posts`

### Completed Backend

- Shared Post model
- Global unique slug
- Required title, excerpt, content and author
- Featured image and alt text
- Category and normalized tags
- Publication timestamp
- Reading time
- Optional related Projects
- Visibility, featured and display order
- Per-Post SEO
- Admin audit fields and timestamps
- Public visible-only listing API
- Public visible-only detail API
- Search, type, category, tag and featured filters
- Strict scalar query validation
- Hidden related-Project protection
- Protected Admin CRUD
- Admin search/type/category/tag/visibility/featured filters
- Related Project validation
- Partial nested SEO PATCH preservation
- JWT authentication and RBAC

### Completed Frontend Foundation

- `postsApi.js`
- `adminPostsApi.js`
- `usePosts.js`
- `usePost.js`
- `postForm.js`
- Strict response-shape handling
- Structured errors
- AbortSignal support
- Race protection
- Form normalization and validation

### Completed Admin Panel

- `/admin/posts`
- `/admin/posts/new`
- `/admin/posts/:id/edit`
- Blog/News dashboard module
- Search and filters
- Create/edit form
- Related Projects multi-select
- Visibility and featured quick actions
- Role-restricted delete
- Mutation cancellation and stale-navigation guards

### Completed Public Website

- `/blog`
- `/news`
- `/blog/:slug`
- `/news/:slug`
- Blog listing
- News listing
- Type-protected detail page
- Search, category, tag and featured filters
- Reusable Post card
- Plain-text content rendering
- Featured-image fallback
- Related visible Projects
- Loading, retry, error, empty and not-found states
- Cross-type route protection

### Completed Homepage / Site Settings

Shared registry keys:

- `posts` — homepage-only combined `Latest Articles & News`
- `blog` — Blog page/navigation publication
- `news` — News page/navigation publication

Completed:

- `postsSection` Site Settings content
- Combined homepage section visibility/order
- Independent Blog page visibility
- Independent News page visibility
- Independent Blog navigation label/order/visibility
- Independent News navigation label/order/visibility
- Navbar, PublicPageHeader and Footer integration
- Responsive desktop `More` overflow menu
- Visibility-aware homepage Post detail links
- Up to four homepage Posts
- Chronological homepage ordering by `publishedAt`

### Completed SEO / Sitemap

- Blog collection canonical metadata
- News collection canonical metadata
- Canonical unfiltered `CollectionPage` + `ItemList`
- Filter/loading/error states omit canonical listing JSON-LD
- Blog detail `BlogPosting`
- News detail `NewsArticle`
- Detail `BreadcrumbList`
- Valid publication/modified dates only
- `/blog` and `/news` sitemap entries
- Visible Blog/News detail sitemap URLs
- Hidden Posts excluded
- Disabled collection removes its detail URLs
- No `/posts` sitemap route

### Runtime Validation

Verified:

- Empty states
- Admin creation and listing
- Public Blog listing
- Public News listing
- Blog detail
- News detail
- Filters
- Cross-type detail protection
- Homepage publication chronology
- Independent page visibility
- Navbar visibility
- Footer visibility
- Homepage section visibility
- Disabled collection homepage-card behavior
- Collection JSON-LD
- BlogPosting / NewsArticle JSON-LD
- Breadcrumb JSON-LD
- Sitemap behavior
- Temporary test Post cleanup

### Final Review

Final comprehensive Codex review reported:

- No blocking findings
- No important non-blocking findings
- No minor findings

Final verdict:

`BLOG / NEWS MODULE READY FOR DOCUMENTATION SYNC`

### Verified Checkpoints

- `57127e2 Add dynamic Blog and News backend APIs`
- `9aeb0b6 Add Blog and News frontend foundation`
- `10e662c Add dynamic Blog and News admin interface`
- `4ae0312 Add public Blog and News pages`
- `3b3ed37 Integrate Blog and News with site settings`
- `e22eb2e Add Blog and News SEO and sitemap integration`

### Current Checkpoint

`Blog / News documentation synchronization`

### Future Optional Improvements

- Rich-text authoring/editor after a safe rendering strategy is approved
- Scheduled publishing if a real workflow requires it
- Dynamic Blog/News Category model if content volume justifies it
- Pagination when Post volume requires it
- Media-library integration
- Author profile relations
- Additional related-content recommendations
- Automated API/UI/SEO tests

## Phase 19 — Media Management

Status: COMPLETE — IMPLEMENTED, VALIDATED AND DOCUMENTED

Completed architecture:

- `Media` metadata model
- Cloudinary-backed binary storage
- Storage-provider abstraction
- Protected Admin API at `/api/admin/media`
- Admin Media Library at `/admin/media`
- No public Media page or public Media API

Supported Media:

- JPG/JPEG
- PNG
- WebP
- AVIF
- Sanitized SVG
- PDF
- MP3
- WAV
- OGG
- M4A
- MP4
- WebM

Completed backend:

- Cloudinary environment validation
- Multer temporary upload handling
- Actual file-signature validation
- MIME and extension cross-checking
- Dangerous intermediate-extension rejection
- Per-type file-size limits
- SVG active-content rejection and sanitization
- Temporary-file cleanup
- Provider cleanup on failed database persistence
- Metadata-only MongoDB persistence
- Search/filter/sort/pagination
- Logical folder metadata and folder browser support
- Usage/reference inspection
- Reference-aware permanent deletion
- Existing Admin authentication and RBAC preservation

Completed Admin Media Library:

- Upload
- Drag/drop
- Progress
- Cancel
- Preview
- Search
- Type filtering
- Folder browsing
- Tags
- Metadata editing
- Copy URL
- Open Asset
- Download
- Usage display
- Safe permanent deletion

Completed reusable Media Picker:

- `MediaField`
- `MediaPicker`
- `MediaPickerModal`
- `useMediaPicker`
- Authenticated browsing
- Search/folder/type filtering
- Manual URL compatibility
- Keyboard focus trap and restoration
- Safe HTTP/HTTPS current-link handling

Initial module integration:

- Project cover image
- Project screenshots
- Project video
- Project SEO/social sharing image

Reference mapping includes:

- Site Settings
- Services
- Statistics
- Skills
- Education
- Experience
- Testimonials
- Blog / News
- Projects
- Companies
- Team

Validation:

- Real SVG Cloudinary upload verified
- Malicious/unsupported uploads rejected
- Folder browser verified
- Copy/Open/Download verified
- Metadata editing verified
- Unreferenced deletion verified
- Referenced Project Media deletion protection verified
- Media Picker Project integration verified
- Keyboard accessibility verified
- `npm audit --prefix server`: 0 vulnerabilities
- `npm run check`: passed
- `git diff --cached --check`: passed
- Final staged Codex review: `READY TO COMMIT`

Known low-risk limitations:

- Reference-detail display may be truncated when a resource type has many exact references.
- A narrow deletion TOCTOU window remains between reference check and provider deletion.
- Client bundle-size optimization remains deferred.

Future Media improvements:

- Integrate Media Picker into additional URL-based Admin modules as those forms are revisited
- Optional hierarchical folder presentation
- Optional bulk actions
- Optional crop/transform workflow
- Optional asset variants
- Optional richer usage-count/truncation reporting

## Phase 20 — Leads / CRM Management

Status: PLANNED

Planned:

- Lead database model
- Admin lead listing and detail workflow
- Lead source
- Lead status/stage
- Priority
- Contact information
- Notes
- Follow-up dates
- Service interest
- Project/inquiry relationships where useful
- Search, filters and pagination
- Role-aware management
- Conversion/lost tracking
- Safe audit fields

## Phase 21 — Certifications and Achievements

Status: PLANNED

Planned:

- Certifications
- Awards
- Achievements
- Issuer
- Issue/expiry dates
- Credential ID/URL
- Media/certificate relation
- Visibility, featured and order controls
- Public presentation where approved
- SEO/sitemap integration where appropriate

## Phase 22 — Service Packages / Pricing

Status: PLANNED

Planned:

- Dynamic service packages
- Pricing
- Billing/unit labels
- Feature lists
- Recommended package
- CTA
- Visibility/order
- Service relationship
- Admin management
- Public responsive pricing presentation

## Phase 23 — FAQ

Status: PLANNED

Planned:

- FAQ categories
- Questions and answers
- Search
- Visibility/order
- Optional service relationships
- Admin CRUD
- Public FAQ presentation
- FAQ structured data when valid

## Phase 24 — Clients / Partners

Status: PLANNED

Planned:

- Client/partner records
- Logo/media
- Website
- Relationship type
- Description
- Featured/visibility/order
- Related projects/services where useful
- Public presentation

## Phase 25 — Case Studies

Status: PLANNED

Planned:

- Dynamic case-study records or approved extension of existing Project architecture
- Problem
- Approach
- Solution
- Results
- Media
- Related Project/client/service/team
- SEO
- Public detail presentation
- Sitemap integration

## Phase 26 — Appointment / Consultation Booking

Status: PLANNED

Planned:

- Consultation requests
- Availability rules
- Requested date/time
- Timezone handling
- Contact information
- Service/topic selection
- Admin status workflow
- Notes
- Validation and abuse protection
- Future notification integration

## Phase 27 — Newsletter / Subscribers Management

Status: PLANNED

Scope:

Subscriber management only during this phase.

Planned:

- Subscriber model
- Subscribe/unsubscribe state
- Source
- Consent timestamp
- Admin listing/search/filter
- Duplicate protection
- Export-ready architecture
- No bulk email sending until Email/Notifications phase

## Phase 28 — Admin Analytics

Status: PLANNED

Planned:

- Admin dashboard summaries
- Content counts
- Lead/contact metrics
- Publication metrics
- Recent activity summaries
- Safe aggregate endpoints
- No invasive visitor tracking without an approved analytics strategy

## Phase 29 — Admin Activity / Audit Log

Status: PLANNED

Planned:

- Important Admin action logging
- Actor
- Action
- Resource type
- Resource ID
- Timestamp
- Safe metadata
- Search/filter
- Restricted read access
- Retention strategy

## Phase 30 — Dynamic Menu / Navigation

Status: PLANNED

Planned:

- Database-backed menu items
- Internal/external destinations
- Labels
- Ordering
- Visibility
- Parent/child structure where justified
- Safe URL handling
- Preserve existing publication controls
- Responsive Navbar/Footer integration

## Phase 31 — Professional UI / UX Redesign

Status: PLANNED

Planned after the remaining functional modules:

- Public visual-system refinement
- Admin usability refinement
- Responsive consistency
- Typography
- Spacing
- Color hierarchy
- Card/form/table consistency
- Loading/error/empty-state consistency
- Accessibility refinement
- Viewer-friendly information architecture

## Phase 32 — Email and Notifications

Status: PLANNED

Planned:

- Contact-form notification
- Booking/lead notifications where approved
- Auto-response email
- Admin notification settings
- SMTP or transactional-email configuration
- Template management
- Delivery failure handling
- Safe environment variables

## Phase 33 — Final SEO, Testing and Quality Assurance

Status: PLANNED

Planned:

- Final SEO audit
- Social preview validation
- API tests
- Authentication tests
- Authorization tests
- Form validation tests
- Route visibility tests
- Sitemap tests
- Responsive browser testing
- Keyboard testing
- Accessibility review
- Empty/loading/error-state testing
- Cross-browser testing

## Phase 34 — Performance Optimization

Status: REVIEW

Known current warning:

- Main client JavaScript chunk is larger than 500 kB after minification.

Latest Media build:

- Vite: `8.1.5`
- Modules transformed: `189`
- Main JavaScript bundle: `1,225.99 kB`
- Gzip size: `257.66 kB`

Planned review:

- Route-based lazy loading
- Dynamic imports
- Bundle analysis
- Admin/public bundle separation
- Image/media optimization
- Font optimization
- API request caching
- Database query indexes
- Pagination
- Compression
- Production caching headers

## Phase 35 — Dependency Security Review

Status: REVIEW

Known client warning:

- A previous client dependency audit reported one high-severity vulnerability.

Current server Media audit:

- `npm audit --prefix server`: 0 vulnerabilities

Required process:

1. Run a non-destructive client audit.
2. Identify the affected package.
3. Determine development vs production exposure.
4. Review safe versions and breaking changes.
5. Test controlled updates.
6. Never use `npm audit fix --force` without review.

## Phase 36 — Final Production Deployment

Status: PLANNED

Planned:

- Select frontend and backend hosting
- Configure final production domain
- Configure production MongoDB access
- Configure Cloudinary production credentials
- Configure secure environment variables
- Configure final CORS origin
- Configure HTTPS
- Configure redirects
- Configure domain DNS
- Validate sitemap and robots behavior
- Validate social previews
- Validate contact/notification delivery
- Validate Admin login
- Create deployment documentation
- Create backup strategy
- Add monitoring and logs

## Phase 37 — Post-Launch Maintenance

Status: PLANNED

Planned:

- Error monitoring
- Uptime monitoring
- Database backups
- Cloudinary usage monitoring
- Dependency update schedule
- Content workflow
- SEO performance review
- Analytics review
- Security review
- Performance review
- Documentation updates

## Current Immediate Next Step

Close the Media Management checkpoint:

1. Synchronize Media completion in repository-memory documentation.
2. Stage the approved documentation updates.
3. Run `git diff --cached --check`.
4. Confirm no real secrets are staged.
5. Commit the completed Media Management module.
6. Push `main` to `origin`.
7. Confirm a clean synchronized working tree.
8. Start `Leads / CRM Management`.

Recommended Media closeout commit:

```text
Complete dynamic Media Management
```

## Next Major Feature

`Leads / CRM Management`
