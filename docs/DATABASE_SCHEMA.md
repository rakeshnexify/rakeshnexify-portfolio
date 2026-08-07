# Database Schema

Last updated: 2026-08-07

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
5. `Skill`
6. `Education`
7. `Experience`
8. `Project`
9. `Company`
10. `TeamMember`
11. `Testimonial`
12. `ContactMessage`

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

### skillsSection

Uses the reusable listing-section schema.

### servicesSection

Uses the reusable listing-section schema.

### projectsSection

Uses the reusable listing-section schema.

### educationSection

Uses the reusable listing-section schema.

### experienceSection

Uses the reusable listing-section schema.

It stores the dynamic heading, description and CTA content used by the homepage Experience section and public `/experience` page.

### teamSection

Uses the reusable listing-section schema.

### testimonialsSection

Uses the reusable listing-section schema.

It stores the dynamic eyebrow, heading, description and CTA content used by the homepage Testimonials section and public `/testimonials` page.

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

# Skill

Model file:

`server/src/models/Skill.js`

Mongoose model:

`Skill`

MongoDB collection:

`skills`

This collection stores fully dynamic professional Skills.

## Main Fields

- `name`
- `nameKey`
- `slug`
- `shortName`
- `description`
- `category`
- `proficiencyLevel`
- `yearsOfExperience`
- `icon`
- `iconUrl`
- `order`
- `isFeatured`
- `isVisible`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

## Proficiency-Level Values

- `familiar`
- `proficient`
- `advanced`
- `expert`

## Duplicate Protection

### nameKey

- Private normalized Skill-name identity
- Required internally
- Unique database index
- Excluded from normal queries using `select: false`
- Removed by JSON and object transforms
- Duplicate database errors map to the public `name` field

### slug

- Required
- Lowercase
- Unique
- Uses the project slug format

## Years of Experience

- Optional number
- Minimum: `0`
- Maximum: `60`
- Empty input becomes `null`
- Decimal values are allowed

## URL Validation

`iconUrl` is optional.

When present:

- Must be a valid URL
- Must use HTTP or HTTPS
- Non-web protocols are rejected

## Publication Fields

### order

- Type: Number
- Minimum: `0`
- Default: `0`

### isFeatured

- Type: Boolean
- Default: `false`

### isVisible

- Type: Boolean
- Default: `true`

## Relations

- `createdBy` references `AdminUser`
- `updatedBy` references `AdminUser`

## Schema Configuration

- Automatic `createdAt`
- Automatic `updatedAt`
- `versionKey: false`
- Explicit collection name: `skills`
- Private-field output transforms

## Important Indexes

- Unique slug index
- Unique normalized `nameKey` index
- Publication and display-order index
- Admin filter index
- Text-search index for current searchable Skill content

---

# Education

Model file:

`server/src/models/Education.js`

Mongoose model:

`Education`

MongoDB collection:

`education`

This collection stores fully dynamic academic qualifications, courses, training and certifications.

## Main Fields

- `institutionName`
- `identityKey`
- `slug`
- `degree`
- `fieldOfStudy`
- `educationType`
- `startDate`
- `endDate`
- `isCurrentlyStudying`
- `grade`
- `location`
- `shortDescription`
- `description`
- `institutionUrl`
- `certificateUrl`
- `logoUrl`
- `order`
- `isFeatured`
- `isVisible`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

## Education-Type Values

- `school`
- `college`
- `university`
- `course`
- `training`
- `certification`
- `other`

## Timeline Rules

- `startDate` is required.
- Admin input uses strict `YYYY-MM-DD` calendar validation.
- `endDate` cannot be earlier than `startDate`.
- `isCurrentlyStudying: true` forces `endDate` to `null`.
- Public date formatting is timezone-safe.

## Duplicate Protection

### identityKey

Private normalized identity based on:

- Institution name
- Degree
- Field of study
- Education type
- Start date

Behavior:

- Required internally
- Unique database index
- Excluded from normal queries using `select: false`
- Removed by JSON and object transforms
- Duplicate database errors map to `institutionName`

### slug

- Required
- Lowercase
- Unique
- Uses the project slug format

## URL Fields

Optional credential-free HTTP or HTTPS URLs:

- `institutionUrl`
- `certificateUrl`
- `logoUrl`

## Publication Fields

### order

- Type: Number
- Minimum: `0`
- Default: `0`

### isFeatured

- Type: Boolean
- Default: `false`

### isVisible

- Type: Boolean
- Default: `true`

## Relations

- `createdBy` references `AdminUser`
- `updatedBy` references `AdminUser`

## Schema Configuration

- Automatic `createdAt`
- Automatic `updatedAt`
- `versionKey: false`
- Explicit collection name: `education`
- Private-field output transforms

## Indexes

Unique slug:

- `slug`

Unique identity:

- `identityKey`

Public listing:

- `isVisible`
- `isFeatured`
- `order`
- `startDate`
- `_id`

Admin filters:

- `educationType`
- `isVisible`
- `isFeatured`
- `order`
- `startDate`
- `_id`

## Mongoose 9 Middleware

The verified final implementation uses synchronous `pre("validate")` middleware without a callback-style `next` argument.

The middleware:

- Clears `endDate` for current-study records
- Regenerates `identityKey` when identity fields change

---


# Experience

Model file:

`server/src/models/Experience.js`

Mongoose model:

`Experience`

MongoDB collection:

`experiences`

This collection stores fully dynamic professional work, freelance, contract, internship, self-employed, founder and other relevant Experience records.

## Main Fields

- `organizationName`
- `identityKey`
- `slug`
- `jobTitle`
- `employmentType`
- `startDate`
- `endDate`
- `isCurrent`
- `location`
- `locationType`
- `shortDescription`
- `description`
- `responsibilities`
- `achievements`
- `skills`
- `tools`
- `organizationLogoUrl`
- `organizationWebsiteUrl`
- `order`
- `isFeatured`
- `isVisible`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

## Required Identity and Content Fields

### organizationName

- Required
- Trimmed
- Minimum length: 2
- Maximum length: 180

### slug

- Required
- Lowercase
- Unique
- Minimum length: 2
- Maximum length: 220
- Accepts lowercase letters, numbers and single hyphen separators

### jobTitle

UI label:

`Job title / professional role`

Rules:

- Required
- Trimmed
- Minimum length: 2
- Maximum length: 180

### employmentType

- Required enum
- Lowercase

Supported values:

- `full-time`
- `part-time`
- `freelance`
- `contract`
- `internship`
- `self-employed`
- `founder`
- `volunteer`
- `other`

### startDate

- Required Date
- Admin input uses strict `YYYY-MM-DD` calendar validation

### shortDescription

- Required
- Minimum length: 10
- Maximum length: 600

## Timeline Rules

- `endDate` is required when `isCurrent` is false.
- `endDate` cannot be earlier than `startDate`.
- `isCurrent: true` forces `endDate` to `null`.
- Public date formatting is timezone-safe.
- The model uses Mongoose 9-compatible synchronous `pre("validate")` middleware without a callback-style `next` argument.

## Location Fields

### location

- Optional String
- Maximum length: 180

### locationType

Optional enum values:

- `onsite`
- `remote`
- `hybrid`

An empty value is allowed.

## Descriptions and Text Arrays

### description

- Optional
- Maximum length: 5000

### responsibilities

- String array
- Maximum items: 30
- Maximum length per item: 300

### achievements

- String array
- Maximum items: 30
- Maximum length per item: 300

### skills

- String array
- Maximum items: 50
- Maximum length per item: 100

### tools

- String array
- Maximum items: 50
- Maximum length per item: 100

Array behavior:

- Non-array values are rejected by the Admin API.
- Non-string array items are rejected.
- Values are trimmed.
- Repeated internal whitespace is normalized.
- Blank items are removed.
- Case-insensitive duplicate values are removed while preserving the first display value.

## Duplicate Protection

### identityKey

Private normalized identity based on:

- Organization name
- Job title
- Employment type
- Start date

Behavior:

- Required internally
- Unique database index
- Excluded from normal queries using `select: false`
- Removed by JSON and object transforms
- Duplicate database errors map to the public `organizationName` field
- Regenerated when any identity field changes

### slug

- Uses a separate unique database index
- Can be generated from organization name, job title and start date

## Organization URL Fields

Optional credential-free HTTP or HTTPS URLs:

- `organizationLogoUrl`
- `organizationWebsiteUrl`

Rules:

- Maximum length: 500
- Must contain a valid hostname
- Username or password credentials are rejected
- Empty values are allowed

## Publication Fields

### order

- Type: Number
- Minimum: `0`
- Default: `0`

### isFeatured

- Type: Boolean
- Default: `false`

### isVisible

- Type: Boolean
- Default: `true`

## Audit Relations

### createdBy

- Required ObjectId
- References `AdminUser`

### updatedBy

- Required ObjectId
- References `AdminUser`

The public Experience API does not expose these Admin audit fields.

## Schema Configuration

- Automatic `createdAt`
- Automatic `updatedAt`
- `versionKey: false`
- Explicit collection name: `experiences`
- Private-field output transforms
- No separate status field
- No record-specific SEO object
- No cross-module relations in the MVP

## Indexes

Unique slug:

- `slug`

Unique normalized identity:

- `identityKey`

Public listing:

- `isVisible`
- `isFeatured`
- `order`
- `startDate`
- `_id`

Admin filters:

- `employmentType`
- `isCurrent`
- `isVisible`
- `isFeatured`
- `order`
- `startDate`
- `_id`

## Public Sorting

Public Experience records use:

1. Featured records first
2. `order` ascending
3. `startDate` descending
4. `createdAt` ascending
5. `_id` ascending

Admin Experience records use:

1. `order` ascending
2. `startDate` descending
3. `createdAt` ascending
4. `_id` ascending

---


# Testimonial

Model file:

`server/src/models/Testimonial.js`

Mongoose model:

`Testimonial`

MongoDB collection:

`testimonials`

This collection stores fully dynamic client Testimonials and review content.

## Main Fields

- `clientName`
- `clientRole`
- `companyName`
- `reviewText`
- `rating`
- `profileImageUrl`
- `profileImageAlt`
- `companyWebsiteUrl`
- `relatedProject`
- `order`
- `isFeatured`
- `isVisible`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

## Required Fields

### clientName

- Type: String
- Required
- Trimmed
- Minimum length: 2
- Maximum length: 150

### reviewText

- Type: String
- Required
- Trimmed
- Minimum length: 10
- Maximum length: 3000

### rating

- Type: Number
- Required
- Whole number only
- Minimum: `1`
- Maximum: `5`

The Admin and public filter layers also use strict rating validation so malformed numeric-like values are not silently coerced into valid ratings.

## Optional Client and Company Fields

### clientRole

- Type: String
- Maximum length: 150
- Default: empty string

### companyName

- Type: String
- Maximum length: 180
- Default: empty string

### profileImageUrl

- Type: String
- Maximum length: 500
- Default: empty string
- Must be a credential-free HTTP or HTTPS URL when present

### profileImageAlt

- Type: String
- Maximum length: 200
- Default: empty string

### companyWebsiteUrl

- Type: String
- Maximum length: 500
- Default: empty string
- Must be a credential-free HTTP or HTTPS URL when present

## Project Relation

### relatedProject

- Type: ObjectId
- References `Project`
- Default: `null`
- Optional

Public API population must not expose a hidden related Project. Hidden related Projects are returned as `null`, not as a raw private identifier.

## Publication and Display Fields

### order

- Type: Number
- Minimum: `0`
- Default: `0`

### isFeatured

- Type: Boolean
- Default: `false`

### isVisible

- Type: Boolean
- Default: `true`

## Admin Audit Relations

### createdBy

- Type: ObjectId
- References `AdminUser`
- Required

### updatedBy

- Type: ObjectId
- References `AdminUser`
- Required

These fields are controlled by authenticated Admin actions and are not accepted as editable body fields.

## Schema Configuration

- Automatic `createdAt`
- Automatic `updatedAt`
- `versionKey: false`
- Explicit collection name: `testimonials`

## Indexes

Public listing index:

- `isVisible`
- `isFeatured` descending
- `order`
- `createdAt`
- `_id`

Admin filter index:

- `rating`
- `isVisible`
- `isFeatured`
- `order`
- `createdAt`
- `_id`

Text-search index:

- Name: `testimonial_text_search`
- Fields:
  - `clientName`
  - `clientRole`
  - `companyName`
  - `reviewText`

## Search Behavior

The current Testimonials API performs search with case-insensitive regular-expression queries across:

- `clientName`
- `clientRole`
- `companyName`
- `reviewText`

`Testimonial.js` also declares the MongoDB text index `testimonial_text_search` across these same four fields. The current API search implementation uses regex queries rather than MongoDB `$text` queries.

## Public Route Design

Testimonials use a dedicated listing page only.

There is no `/testimonials/:slug` route and no record-specific Testimonial SEO schema in the MVP.

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

# TeamMember

Model file:

`server/src/models/TeamMember.js`

Mongoose model:

`TeamMember`

MongoDB collection:

`teamMembers`

This collection stores fully dynamic Team member profiles.

## Main Fields

- `name`
- `slug`
- `professionalRole`
- `teamPosition`
- `shortIntroduction`
- `biography`
- `profileImageUrl`
- `profileImageAlt`
- `coverImageUrl`
- `skills`
- `tools`
- `status`
- `availabilityStatus`
- `email`
- `phone`
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
- `createdAt`
- `updatedAt`

## Required Fields

### name

- Type: String
- Required
- Minimum length: 2
- Maximum length: 150
- Trimmed

### slug

- Type: String
- Required
- Unique
- Lowercase
- Trimmed
- Minimum length: 2
- Maximum length: 180
- Accepts lowercase letters, numbers and single hyphen separators

### professionalRole

- Type: String
- Required
- Minimum length: 2
- Maximum length: 150
- Indexed

### shortIntroduction

- Type: String
- Required
- Minimum length: 10
- Maximum length: 400

## Profile Content

### teamPosition

- Type: String
- Maximum length: 150
- Default: empty string

### biography

- Type: String
- Maximum length: 10000
- Default: empty string

### profileImageUrl

- Type: String
- Maximum length: 500
- Default: empty string

### profileImageAlt

- Type: String
- Maximum length: 200
- Default: empty string

### coverImageUrl

- Type: String
- Maximum length: 500
- Default: empty string

## Expertise Arrays

### skills

- Type: String array
- Default: empty array
- Empty values are removed
- Duplicate values are removed

### tools

- Type: String array
- Default: empty array
- Empty values are removed
- Duplicate values are removed

## Member Status Values

Allowed `status` values:

- `active`
- `inactive`
- `former`
- `archived`

Default:

`active`

The field is indexed.

## Availability Status Values

Allowed `availabilityStatus` values:

- `available`
- `limited`
- `unavailable`
- `on-leave`

Default:

`available`

The field is indexed.

## Contact and Portfolio Fields

### email

- Type: String
- Lowercase
- Maximum length: 254
- Default: empty string

### phone

- Type: String
- Maximum length: 50
- Default: empty string

### websiteUrl

- Type: String
- Maximum length: 500
- Default: empty string

### portfolioUrl

- Type: String
- Maximum length: 500
- Default: empty string

## Social-Link Fields

The `socialLinks` object contains:

- `github`
- `linkedin`
- `facebook`
- `instagram`
- `youtube`
- `x`

Each social URL:

- Is trimmed
- Has a maximum length of 500
- Defaults to an empty string

The nested social-link schema does not create its own `_id`.

## SEO Fields

The `seo` object contains:

- `title`
- `description`
- `keywords`
- `ogImageUrl`

SEO rules:

- `title` maximum length: 70
- `description` maximum length: 180
- `ogImageUrl` maximum length: 500
- `keywords` is a String array
- SEO keywords are cleaned, deduplicated and converted to lowercase

The nested SEO schema does not create its own `_id`.

## Cross-Module Relations

### relatedProjects

- Type: ObjectId array
- References `Project`
- Default: empty array

### relatedCompanies

- Type: ObjectId array
- References `Company`
- Default: empty array

### relatedServices

- Type: ObjectId array
- References `Service`
- Default: empty array

### createdBy

- Type: ObjectId
- References `AdminUser`
- Default: `null`

### updatedBy

- Type: ObjectId
- References `AdminUser`
- Default: `null`

## Publication and Display Fields

### order

- Type: Number
- Minimum: 0
- Default: `0`
- Indexed

### isFeatured

- Type: Boolean
- Default: `false`
- Indexed

### isVisible

- Type: Boolean
- Default: `true`
- Indexed

## Schema Configuration

- Automatic `createdAt`
- Automatic `updatedAt`
- `versionKey: false`
- Explicit collection name: `teamMembers`

## Indexes

Publication and display index:

- `isVisible`
- `isFeatured`
- `order`
- `createdAt`

Status and availability index:

- `status`
- `availabilityStatus`
- `order`

Text-search fields:

- `name`
- `professionalRole`
- `teamPosition`
- `shortIntroduction`
- `biography`
- `skills`
- `tools`

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
- Skill `createdBy`
- Skill `updatedBy`
- Education `createdBy`
- Education `updatedBy`
- Experience `createdBy`
- Experience `updatedBy`
- Testimonial `createdBy`
- Testimonial `updatedBy`
- Project `createdBy`
- Project `updatedBy`
- Company `createdBy`
- Company `updatedBy`
- TeamMember `createdBy`
- TeamMember `updatedBy`
- ContactMessage `statusUpdatedBy`
- SiteSettings `updatedBy`
- AdminUser `createdBy`
- AdminUser `updatedBy`

## Current Testimonials Cross-Module Relation

The `Testimonial` model contains one optional ObjectId relation:

- `Project` through `relatedProject`

The public Testimonials API must populate only public-safe Project data. A hidden related Project must not be exposed.

---

## Current Team Cross-Module Relations

The `TeamMember` model contains explicit ObjectId-array relations to:

- `Project` through `relatedProjects`
- `Company` through `relatedCompanies`
- `Service` through `relatedServices`

These relations allow a Team member details page to display related portfolio work, Companies and Services.

The public Team details API filters populated relations so that hidden related records are not exposed.

---

## Database Documentation Rule

Whenever a model is created or modified:

1. Update this file.
2. Document collection name.
3. Document important fields.
4. Document enum values.
5. Document indexes.
6. Document relations.
7. Update `docs/SESSION_HANDOFF.md`.
