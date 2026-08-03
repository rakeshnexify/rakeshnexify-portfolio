# Database Schema

Last updated: 2026-08-03

## Database

MongoDB database name:

`rakeshnexify_portfolio`

Database provider:

MongoDB Atlas.

ODM:

Mongoose.

## General Schema Rules

Most collections use:

- Automatic `createdAt`
- Automatic `updatedAt`
- `versionKey: false`
- Mongoose field validation
- Trimmed string values
- Dedicated MongoDB collection names

Admin-managed records commonly contain:

- `createdBy`
- `updatedBy`

These fields reference the `AdminUser` model where applicable.

## Current Collections

The project currently contains these Mongoose models:

1. `AdminUser`
2. `SiteSettings`
3. `Service`
4. `Statistic`
5. `Project`
6. `Company`
7. `ContactMessage`

The planned `TeamMember` model does not exist yet.

---

# AdminUser

Model file:

`server/src/models/AdminUser.js`

MongoDB collection:

`admin_users`

## Fields

### name

- Type: String
- Required
- Minimum length: 2
- Maximum length: 100

### email

- Type: String
- Required
- Unique
- Lowercase
- Indexed
- Maximum length: 150
- Email format validation

### password

- Type: String
- Required
- Minimum length: 8
- Maximum length: 128
- Excluded from normal queries using `select: false`
- Hashed using bcrypt with 12 rounds

### role

Allowed values:

- `super-admin`
- `admin`
- `editor`

Default:

`admin`

### isActive

- Type: Boolean
- Default: `true`

### lastLoginAt

- Type: Date
- Default: `null`

### failedLoginAttempts

- Type: Number
- Default: `0`

### lockUntil

- Type: Date
- Default: `null`

After five failed login attempts, the account can be locked for 15 minutes.

### passwordChangedAt

- Type: Date
- Default: `null`

### createdBy

- ObjectId
- References `AdminUser`

### updatedBy

- ObjectId
- References `AdminUser`

## Methods

- `comparePassword`
- `isAccountLocked`
- `registerFailedLogin`
- `registerSuccessfulLogin`

## Indexes

- Unique email index
- Combined email and active-status index

---

# SiteSettings

Model file:

`server/src/models/SiteSettings.js`

MongoDB collection:

`site_settings`

This collection stores global website settings.

## Root Fields

### siteKey

- Type: String
- Required
- Unique
- Immutable
- Lowercase
- Default: `main`

### brand

Fields:

- `name`
- `shortName`
- `tagline`
- `logoUrl`
- `faviconUrl`

### owner

Fields:

- `name`
- `professionalTitle`
- `location`
- `profileImageUrl`
- `resumeUrl`

### hero

Fields:

- `eyebrow`
- `heading`
- `description`
- `primaryButton`
- `secondaryButton`

Button fields:

- `label`
- `url`

### about

Fields:

- `heading`
- `description`
- `highlights`

### statisticsSection

Uses the reusable listing-section schema:

- `eyebrow`
- `heading`
- `description`
- `ctaButton`

### servicesSection

Uses the reusable listing-section schema.

### projectsSection

Uses the reusable listing-section schema.

### companiesSection

Uses the reusable listing-section schema.

### contactSection

Fields:

- `eyebrow`
- `heading`
- `description`
- `enquiryEyebrow`
- `enquiryHeading`
- `enquiryDescription`

### contact

Fields:

- `email`
- `phone`
- `whatsapp`
- `location`
- `availability`

### seo

Fields:

- `title`
- `description`
- `keywords`
- `ogImageUrl`

### footer

Fields:

- `introduction`
- `quickLinksHeading`
- `servicesHeading`
- `platformsHeading`
- `platformNote`
- `projectButton`
- `legalLinks`
- `copyrightText`

Legal-link fields:

- `label`
- `url`
- `isVisible`
- `order`

### socialPlatforms

Array of platform records.

Default platform names:

- YouTube
- LinkedIn
- Instagram
- Facebook
- Threads
- TikTok

### developerPlatforms

Default platform names:

- GitHub
- GitLab
- StackBlitz
- CodePen

### freelancerPlatforms

Default platform names:

- Upwork
- Fiverr
- Freelancer
- PeoplePerHour
- Contra

Platform fields:

- `name`
- `username`
- `url`
- `isVisible`
- `order`

### sections

Stores homepage and navigation registry records.

Section fields:

- `key`
- `label`
- `isVisible`
- `isNavigationVisible`
- `isPageVisible`
- `order`
- `navigationOrder`

Visibility meanings:

- `isVisible`: Homepage section visibility
- `isNavigationVisible`: Navbar visibility
- `isPageVisible`: Dedicated public-page availability

### isPublished

- Type: Boolean
- Default: `true`

### updatedBy

- ObjectId
- References `AdminUser`

---

# Service

Model file:

`server/src/models/Service.js`

MongoDB collection:

`services`

## Fields

- `title`
- `slug`
- `shortDescription`
- `description`
- `icon`
- `iconUrl`
- `features`
- `technologies`
- `order`
- `isFeatured`
- `isVisible`
- `seo`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

## Unique Field

`slug`

Slug accepts lowercase letters, numbers and hyphens.

## SEO Fields

- `title`
- `description`
- `keywords`

## Relations

- `createdBy` references `AdminUser`
- `updatedBy` references `AdminUser`

## Indexes

Combined index:

- `isVisible`
- `order`
- `createdAt`

---

# Statistic

Model file:

`server/src/models/Statistic.js`

MongoDB collection:

`statistics`

## Fields

- `key`
- `label`
- `value`
- `prefix`
- `suffix`
- `description`
- `icon`
- `iconUrl`
- `order`
- `isFeatured`
- `isVisible`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

## Unique Field

`key`

The key accepts lowercase letters, numbers and hyphens.

## Relations

- `createdBy` references `AdminUser`
- `updatedBy` references `AdminUser`

## Indexes

Publication and order index:

- `isVisible`
- `isFeatured`
- `order`
- `createdAt`

Text-search fields:

- `label`
- `description`

---

# Project

Model file:

`server/src/models/Project.js`

MongoDB collection:

`projects`

## Main Fields

- `title`
- `slug`
- `shortDescription`
- `description`
- `category`
- `projectType`
- `clientName`
- `role`
- `status`
- `startedAt`
- `completedAt`
- `coverImageUrl`
- `images`
- `technologies`
- `features`
- `challenges`
- `solutions`
- `results`
- `links`
- `order`
- `isFeatured`
- `isVisible`
- `seo`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

## Unique Field

`slug`

## Project Type Values

- `personal`
- `client`
- `company`
- `open-source`
- `practice`

Default:

`personal`

## Status Values

- `planning`
- `in-progress`
- `completed`
- `maintained`
- `archived`

Default:

`completed`

## Project Images

Each image contains:

- `url`
- `alt`
- `caption`
- `order`

## Project Results

Each result contains:

- `label`
- `value`

## Project Links

Fields:

- `liveUrl`
- `sourceCodeUrl`
- `caseStudyUrl`
- `videoUrl`

## SEO Fields

- `title`
- `description`
- `keywords`
- `ogImageUrl`

## Relations

- `createdBy` references `AdminUser`
- `updatedBy` references `AdminUser`

## Indexes

Publication index:

- `isVisible`
- `isFeatured`
- `order`
- `createdAt`

Text-search fields:

- `title`
- `shortDescription`
- `description`
- `category`
- `technologies`

---

# Company

Model file:

`server/src/models/Company.js`

MongoDB collection:

`companies`

## Main Fields

- `name`
- `slug`
- `legalName`
- `tagline`
- `shortDescription`
- `description`
- `industry`
- `relationship`
- `status`
- `foundedYear`
- `role`
- `websiteUrl`
- `logoUrl`
- `coverImageUrl`
- `businessAreas`
- `services`
- `highlights`
- `statistics`
- `contact`
- `socialLinks`
- `order`
- `isFeatured`
- `isVisible`
- `seo`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

## Unique Field

`slug`

## Relationship Values

- `owned`
- `managed`
- `partner`
- `client`
- `other`

Default:

`owned`

## Status Values

- `planned`
- `active`
- `inactive`
- `archived`

Default:

`active`

## Company Statistics

Each record contains:

- `label`
- `value`

## Contact Fields

- `email`
- `phone`
- `address`
- `city`
- `country`

## Social-Link Fields

- `facebook`
- `instagram`
- `linkedin`
- `youtube`
- `x`

## SEO Fields

- `title`
- `description`
- `keywords`
- `ogImageUrl`

## Relations

- `createdBy` references `AdminUser`
- `updatedBy` references `AdminUser`

## Indexes

Publication index:

- `isVisible`
- `isFeatured`
- `order`
- `createdAt`

Text-search fields:

- `name`
- `legalName`
- `tagline`
- `shortDescription`
- `description`
- `industry`
- `businessAreas`
- `services`

---

# ContactMessage

Model file:

`server/src/models/ContactMessage.js`

MongoDB collection:

`contact_messages`

## Fields

- `name`
- `email`
- `phone`
- `service`
- `serviceTitle`
- `subject`
- `message`
- `status`
- `source`
- `adminNote`
- `readAt`
- `repliedAt`
- `archivedAt`
- `statusUpdatedAt`
- `statusUpdatedBy`
- `createdAt`
- `updatedAt`

## Status Values

- `new`
- `read`
- `replied`
- `archived`

Default:

`new`

## Relation

`statusUpdatedBy` references `AdminUser`.

## Indexes

Status index:

- `status`
- `createdAt`

Service index:

- `service`
- `createdAt`

Email index:

- `email`
- `createdAt`

Text-search fields:

- `name`
- `email`
- `phone`
- `subject`
- `message`
- `serviceTitle`

---

# Current Model Relationships

## AdminUser Relations

The following fields reference `AdminUser`:

- Service `createdBy`
- Service `updatedBy`
- Statistic `createdBy`
- Statistic `updatedBy`
- Project `createdBy`
- Project `updatedBy`
- Company `createdBy`
- Company `updatedBy`
- ContactMessage `statusUpdatedBy`
- SiteSettings `updatedBy`
- AdminUser `createdBy`
- AdminUser `updatedBy`

## Current Missing Cross-Module Relations

Projects, Companies and Services currently store most related information directly.

The future Team module is planned to introduce explicit relations between:

- Team members and Projects
- Team members and Companies
- Team members and Services

These relations must be designed before implementing `TeamMember`.

---

# Planned TeamMember Collection

Status:

Not implemented.

Suggested future collection:

`team_members`

Planned fields include:

- `name`
- `slug`
- `professionalRole`
- `jobTitle`
- `position`
- `shortIntro`
- `bio`
- `responsibilities`
- `profileImageUrl`
- `coverImageUrl`
- `skills`
- `tools`
- `availabilityStatus`
- `websiteUrl`
- `portfolioUrl`
- `socialLinks`
- `relatedProjects`
- `relatedCompanies`
- `relatedServices`
- `order`
- `isFeatured`
- `isVisible`
- `seo`
- `createdBy`
- `updatedBy`

This planned schema must be reviewed against existing Project, Company and Service models before implementation.

## Database Documentation Rule

Whenever a model is created or modified:

1. Update this file.
2. Document collection name.
3. Document important fields.
4. Document enum values.
5. Document indexes.
6. Document relations.
7. Update `docs/SESSION_HANDOFF.md`.
