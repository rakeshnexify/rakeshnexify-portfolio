import { useState } from "react";

import { Link } from "react-router";

import MediaField from "../media/MediaField";

import {
  createSiteSettingsFormValues,
  createSiteSettingsPayload,
} from "../../../utils/siteSettingsForm";
import AboutIdentityRolesEditor from "./AboutIdentityRolesEditor";
import AboutWorkItemsEditor from "./AboutWorkItemsEditor";
import HeroQuickLinksEditor from "./HeroQuickLinksEditor";
import LegalLinksEditor from "./LegalLinksEditor";
import PlatformSettingsEditor from "./PlatformSettingsEditor";

const inputClasses =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const textareaClasses =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const defaultFormValues = createSiteSettingsFormValues({});

const MAX_PLATFORMS_PER_GROUP = 25;

const MAX_ABOUT_IDENTITY_ROLES = 30;

const MAX_ABOUT_WORK_ITEMS = 100;

const MAX_HERO_QUICK_LINKS = 30;

const MAX_LEGAL_LINKS = 20;

const MAX_SECTION_ORDER = 10000;

const platformGroupFields = [
  "socialPlatforms",
  "developerPlatforms",
  "freelancerPlatforms",
];

/*
 * Sirf in sections ke dedicated
 * public listing pages available hain.
 */
const dedicatedPageSectionKeys = new Set([
  "statistics",
  "skills",
  "services",
  "projects",
  "case-studies",
  "education",
  "experience",
  "achievements",
  "team",
  "companies",
  "clients-partners",
  "testimonials",
  "faq",
  "blog",
  "news",
  "consultation",
]);

const homepageSectionKeys = new Set([
  "hero",
  "about",
  "statistics",
  "skills",
  "services",
  "projects",
  "case-studies",
  "education",
  "experience",
  "achievements",
  "team",
  "companies",
  "clients-partners",
  "posts",
  "testimonials",
  "faq",
  "contact",
]);

const navigationSectionKeys = new Set([
  "hero",
  "about",
  "statistics",
  "skills",
  "services",
  "projects",
  "case-studies",
  "education",
  "experience",
  "achievements",
  "team",
  "companies",
  "clients-partners",
  "testimonials",
  "faq",
  "contact",
  "blog",
  "news",
]);

const footerNavigationSectionKeys = new Set(
  defaultFormValues.sections
    .filter((section) => section.key !== "posts")
    .map((section) => section.key),
);

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const characterCode = text.charCodeAt(index);

    if (characterCode <= 31 || characterCode === 127) {
      return true;
    }
  }

  return false;
}

function isSafePublicUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return true;
  }

  if (containsControlCharacters(url)) {
    return false;
  }

  if (/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(url)) {
    return true;
  }

  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);

    return (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    );
  } catch {
    return false;
  }
}

function isSafeHttpUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);

    return (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    );
  } catch {
    return false;
  }
}

function normalizeAboutWorkUrlForValidation(value) {
  const url = String(value || "").trim();

  if (
    !url ||
    url.startsWith("/") ||
    url.startsWith("#") ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(url)
  ) {
    return url;
  }

  if (
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?:[/?#].*)?$/i.test(
      url,
    )
  ) {
    return `https://${url}`;
  }

  return url;
}

function validateAboutWorkItems(formValues, errors) {
  const items = formValues?.about?.workItems;

  if (!Array.isArray(items)) {
    errors["about.workItems"] =
      "Work items must be provided as a list.";
    return;
  }

  if (items.length > MAX_ABOUT_WORK_ITEMS) {
    errors["about.workItems"] =
      `A maximum of ${MAX_ABOUT_WORK_ITEMS} work items is allowed.`;
  }

  items.forEach((item, index) => {
    const fieldPrefix = `about.workItems.${index}`;
    const type = String(item?.type || "").trim();
    const title = String(item?.title || "").trim();
    const rawUrl = String(item?.url || "").trim();
    const url = normalizeAboutWorkUrlForValidation(rawUrl);

    if (!type) {
      errors[`${fieldPrefix}.type`] = "Type / label is required.";
    } else if (type.length > 50) {
      errors[`${fieldPrefix}.type`] =
        "Type / label cannot exceed 50 characters.";
    }

    if (!title) {
      errors[`${fieldPrefix}.title`] = "Title is required.";
    } else if (title.length > 120) {
      errors[`${fieldPrefix}.title`] =
        "Title cannot exceed 120 characters.";
    }

    if (!url) {
      errors[`${fieldPrefix}.url`] = "Link is required.";
    } else if (url.length > 1000) {
      errors[`${fieldPrefix}.url`] =
        "Link cannot exceed 1000 characters.";
    } else if (!isSafePublicUrl(url)) {
      errors[`${fieldPrefix}.url`] =
        "Use a domain, #section, /relative-path or http/https URL.";
    }
  });
}

function normalizeHeroQuickLinkUrlForValidation(value) {
  const url = String(value || "").trim();

  if (
    !url ||
    url.startsWith("/") ||
    url.startsWith("#") ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(url)
  ) {
    return url;
  }

  if (
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?:[/?#].*)?$/i.test(
      url,
    )
  ) {
    return `https://${url}`;
  }

  return url;
}

function validateHeroQuickLinks(formValues, errors) {
  const items = formValues?.hero?.quickLinks;

  if (!Array.isArray(items)) {
    errors["hero.quickLinks"] =
      "Hero quick links must be provided as a list.";
    return;
  }

  if (items.length > MAX_HERO_QUICK_LINKS) {
    errors["hero.quickLinks"] =
      `A maximum of ${MAX_HERO_QUICK_LINKS} Hero quick links is allowed.`;
  }

  const usedLabels = new Set();

  items.forEach((item, index) => {
    const fieldPrefix = `hero.quickLinks.${index}`;
    const label = String(item?.label || "").trim();
    const rawUrl = String(item?.url || "").trim();
    const url = normalizeHeroQuickLinkUrlForValidation(rawUrl);

    if (!label) {
      errors[`${fieldPrefix}.label`] = "Link title is required.";
    } else if (label.length > 80) {
      errors[`${fieldPrefix}.label`] =
        "Link title cannot exceed 80 characters.";
    } else {
      const normalizedLabel = label.toLowerCase();

      if (usedLabels.has(normalizedLabel)) {
        errors[`${fieldPrefix}.label`] =
          `The quick link "${label}" is already added.`;
      } else {
        usedLabels.add(normalizedLabel);
      }
    }

    if (!url) {
      errors[`${fieldPrefix}.url`] = "Link URL is required.";
    } else if (url.length > 1000) {
      errors[`${fieldPrefix}.url`] =
        "Link URL cannot exceed 1000 characters.";
    } else if (!isSafePublicUrl(url)) {
      errors[`${fieldPrefix}.url`] =
        "Use a domain, #section, /relative-path or http/https URL.";
    }

    if (!isSafeHttpUrl(item?.iconUrl)) {
      errors[`${fieldPrefix}.iconUrl`] =
        "Enter a complete http:// or https:// icon URL.";
    }
  });
}

function validateAboutIdentityRoles(formValues, errors) {
  const roles = formValues?.about?.identityRoles;

  if (!Array.isArray(roles)) {
    errors["about.identityRoles"] =
      "Identity roles must be provided as a list.";
    return;
  }

  if (roles.length > MAX_ABOUT_IDENTITY_ROLES) {
    errors["about.identityRoles"] =
      `A maximum of ${MAX_ABOUT_IDENTITY_ROLES} identity roles is allowed.`;
  }

  const usedLabels = new Set();

  roles.forEach((role, index) => {
    const fieldName = `about.identityRoles.${index}.label`;
    const label = String(role?.label || "").trim();

    if (!label) {
      errors[fieldName] = "Identity role is required.";
      return;
    }

    if (label.length > 80) {
      errors[fieldName] = "Identity role cannot exceed 80 characters.";
    }

    const normalizedLabel = label.toLowerCase();

    if (usedLabels.has(normalizedLabel)) {
      errors[fieldName] = `The identity role "${label}" is already added.`;
      return;
    }

    usedLabels.add(normalizedLabel);
  });
}

function validatePlatformGroup(formValues, fieldName, errors) {
  const platforms = formValues?.[fieldName];

  if (!Array.isArray(platforms)) {
    errors[fieldName] = "Platforms must be provided as a list.";
    return;
  }

  if (platforms.length > MAX_PLATFORMS_PER_GROUP) {
    errors[fieldName] =
      `A maximum of ${MAX_PLATFORMS_PER_GROUP} platforms is allowed.`;
  }

  const usedNames = new Set();

  platforms.forEach((platform, index) => {
    const fieldPrefix = `${fieldName}.${index}`;

    const name = String(platform?.name || "").trim();

    if (!name) {
      errors[`${fieldPrefix}.name`] = "Platform name is required.";
    } else {
      const normalizedName = name.toLowerCase();

      if (usedNames.has(normalizedName)) {
        errors[`${fieldPrefix}.name`] =
          `The platform "${name}" is already added to this group.`;
      } else {
        usedNames.add(normalizedName);
      }
    }

    if (!isSafeHttpUrl(platform?.url)) {
      errors[`${fieldPrefix}.url`] =
        "Enter a complete http:// or https:// URL without login credentials.";
    }

    if (!isSafeHttpUrl(platform?.iconUrl)) {
      errors[`${fieldPrefix}.iconUrl`] =
        "Enter a complete http:// or https:// icon URL without login credentials.";
    }
  });
}

function validateLegalLinks(formValues, errors) {
  const legalLinks = formValues?.footer?.legalLinks;

  if (!Array.isArray(legalLinks)) {
    errors["footer.legalLinks"] =
      "Footer legal links must be provided as a list.";

    return;
  }

  if (legalLinks.length > MAX_LEGAL_LINKS) {
    errors["footer.legalLinks"] =
      `A maximum of ${MAX_LEGAL_LINKS} legal links is allowed.`;
  }

  const usedLabels = new Set();

  legalLinks.forEach((link, index) => {
    const fieldPrefix = `footer.legalLinks.${index}`;

    const label = String(link?.label || "").trim();

    if (!label) {
      errors[`${fieldPrefix}.label`] = "Legal link label is required.";
    } else {
      const normalizedLabel = label.toLowerCase();

      if (usedLabels.has(normalizedLabel)) {
        errors[`${fieldPrefix}.label`] =
          `The legal link "${label}" is already added.`;
      } else {
        usedLabels.add(normalizedLabel);
      }
    }

    if (!isSafePublicUrl(link?.url)) {
      errors[`${fieldPrefix}.url`] =
        "Use a #section, /relative-path or complete http:// or https:// URL.";
    }
  });
}

function validateDynamicContentUrls(formValues, errors) {
  const urlFields = [
    {
      fieldName: "skillsSection.ctaButton.url",
      value: formValues?.skillsSection?.ctaButton?.url,
    },
    {
      fieldName: "servicesSection.ctaButton.url",
      value: formValues?.servicesSection?.ctaButton?.url,
    },
    {
      fieldName: "projectsSection.ctaButton.url",
      value: formValues?.projectsSection?.ctaButton?.url,
    },
    {
      fieldName: "caseStudiesSection.ctaButton.url",
      value: formValues?.caseStudiesSection?.ctaButton?.url,
    },
    {
      fieldName: "educationSection.ctaButton.url",
      value: formValues?.educationSection?.ctaButton?.url,
    },
    {
      fieldName: "experienceSection.ctaButton.url",
      value: formValues?.experienceSection?.ctaButton?.url,
    },
    {
      fieldName: "achievementsSection.ctaButton.url",
      value: formValues?.achievementsSection?.ctaButton?.url,
    },
    {
      fieldName: "teamSection.ctaButton.url",
      value: formValues?.teamSection?.ctaButton?.url,
    },
    {
      fieldName: "companiesSection.ctaButton.url",
      value: formValues?.companiesSection?.ctaButton?.url,
    },
    {
      fieldName: "clientsPartnersSection.ctaButton.url",
      value: formValues?.clientsPartnersSection?.ctaButton?.url,
    },
    {
      fieldName: "testimonialsSection.ctaButton.url",
      value: formValues?.testimonialsSection?.ctaButton?.url,
    },
    {
      fieldName: "faqSection.ctaButton.url",
      value: formValues?.faqSection?.ctaButton?.url,
    },
    {
      fieldName: "postsSection.ctaButton.url",
      value: formValues?.postsSection?.ctaButton?.url,
    },
    {
      fieldName: "footer.projectButton.url",
      value: formValues?.footer?.projectButton?.url,
    },
  ];

  urlFields.forEach(({ fieldName, value }) => {
    if (!isSafePublicUrl(value)) {
      errors[fieldName] =
        "Use a #section, /relative-path or complete http:// or https:// URL.";
    }
  });
}

function prepareInitialValues(initialValues = {}) {
  const normalizedValues = createSiteSettingsFormValues(initialValues);

  return {
    ...normalizedValues,

    hero: {
      ...normalizedValues.hero,

      primaryButton: {
        ...normalizedValues.hero.primaryButton,
      },

      secondaryButton: {
        ...normalizedValues.hero.secondaryButton,
      },

      quickLinks: normalizedValues.hero.quickLinks.map((item) => ({
        ...item,
      })),
    },

    about: {
      ...normalizedValues.about,

      identityRoles: normalizedValues.about.identityRoles.map((role) => ({
        ...role,
      })),

      workItems: normalizedValues.about.workItems.map((item) => ({
        ...item,
      })),
    },

    statisticsSection: {
      ...normalizedValues.statisticsSection,

      ctaButton: {
        ...normalizedValues.statisticsSection.ctaButton,
      },
    },

    seo: {
      ...normalizedValues.seo,

      keywordsText:
        typeof initialValues.seo?.keywordsText === "string"
          ? initialValues.seo.keywordsText
          : normalizedValues.seo.keywordsText,
    },

    skillsSection: {
      ...normalizedValues.skillsSection,

      ctaButton: {
        ...normalizedValues.skillsSection.ctaButton,
      },
    },

    servicesSection: {
      ...normalizedValues.servicesSection,

      ctaButton: {
        ...normalizedValues.servicesSection.ctaButton,
      },
    },

    projectsSection: {
      ...normalizedValues.projectsSection,

      ctaButton: {
        ...normalizedValues.projectsSection.ctaButton,
      },
    },

    caseStudiesSection: {
      ...normalizedValues.caseStudiesSection,

      ctaButton: {
        ...normalizedValues.caseStudiesSection.ctaButton,
      },
    },

    educationSection: {
      ...normalizedValues.educationSection,

      ctaButton: {
        ...normalizedValues.educationSection.ctaButton,
      },
    },

    experienceSection: {
      ...normalizedValues.experienceSection,

      ctaButton: {
        ...normalizedValues.experienceSection.ctaButton,
      },
    },

    achievementsSection: {
      ...normalizedValues.achievementsSection,

      ctaButton: {
        ...normalizedValues.achievementsSection.ctaButton,
      },
    },

    teamSection: {
      ...normalizedValues.teamSection,

      ctaButton: {
        ...normalizedValues.teamSection.ctaButton,
      },
    },

    companiesSection: {
      ...normalizedValues.companiesSection,

      ctaButton: {
        ...normalizedValues.companiesSection.ctaButton,
      },
    },

    clientsPartnersSection: {
      ...normalizedValues.clientsPartnersSection,

      ctaButton: {
        ...normalizedValues.clientsPartnersSection.ctaButton,
      },
    },

    testimonialsSection: {
      ...normalizedValues.testimonialsSection,

      ctaButton: {
        ...normalizedValues.testimonialsSection.ctaButton,
      },
    },

    faqSection: {
      ...normalizedValues.faqSection,

      ctaButton: {
        ...normalizedValues.faqSection.ctaButton,
      },
    },

    postsSection: {
      ...normalizedValues.postsSection,

      ctaButton: {
        ...normalizedValues.postsSection.ctaButton,
      },
    },

    contactSection: {
      ...normalizedValues.contactSection,
    },

    footer: {
      ...normalizedValues.footer,

      projectButton: {
        ...normalizedValues.footer.projectButton,
      },

      legalLinks: normalizedValues.footer.legalLinks.map((link) => ({
        ...link,
      })),
    },

    socialPlatforms: normalizedValues.socialPlatforms.map((platform) => ({
      ...platform,
    })),

    developerPlatforms: normalizedValues.developerPlatforms.map((platform) => ({
      ...platform,
    })),

    freelancerPlatforms: normalizedValues.freelancerPlatforms.map(
      (platform) => ({
        ...platform,
      }),
    ),

    sections: normalizedValues.sections.map((section) => ({
      ...section,
    })),
  };
}

function setNestedValue(source, path, value) {
  const [currentKey, ...remainingKeys] = path.split(".");

  if (remainingKeys.length === 0) {
    return {
      ...source,
      [currentKey]: value,
    };
  }

  return {
    ...source,

    [currentKey]: setNestedValue(
      source?.[currentKey] || {},
      remainingKeys.join("."),
      value,
    ),
  };
}

function removeErrorGroup(errors, fieldPrefix) {
  return Object.fromEntries(
    Object.entries(errors).filter(([fieldName]) => {
      return (
        fieldName !== fieldPrefix && !fieldName.startsWith(`${fieldPrefix}.`)
      );
    }),
  );
}

function isValidSectionOrder(value) {
  if (typeof value === "string" && !value.trim()) {
    return false;
  }

  const numericValue = Number(value);

  return (
    Number.isSafeInteger(numericValue) &&
    numericValue >= 0 &&
    numericValue <= MAX_SECTION_ORDER
  );
}

function validateSiteSettingsForm(formValues) {
  const errors = {};

  if (!String(formValues.brand?.name || "").trim()) {
    errors["brand.name"] = "Brand name is required.";
  }

  if (!String(formValues.brand?.shortName || "").trim()) {
    errors["brand.shortName"] = "Brand short name is required.";
  }

  if (!String(formValues.owner?.name || "").trim()) {
    errors["owner.name"] = "Owner name is required.";
  }

  if (!String(formValues.hero?.heading || "").trim()) {
    errors["hero.heading"] = "Hero heading is required.";
  }

  if (!String(formValues.about?.heading || "").trim()) {
    errors["about.heading"] = "About heading is required.";
  }

  const email = String(formValues.contact?.email || "")
    .trim()
    .toLowerCase();

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors["contact.email"] = "Please provide a valid email address.";
  }

  const sections = Array.isArray(formValues.sections)
    ? formValues.sections
    : [];

  if (sections.length === 0) {
    errors.sections = "At least one homepage section is required.";
  }

  const usedKeys = new Set();

  sections.forEach((section, index) => {
    const key = String(section?.key || "")
      .trim()
      .toLowerCase();

    const label = String(section?.label || "").trim();

    const order = section?.order;

    const navigationOrder = section?.navigationOrder;

    const footerNavigationOrder = section?.footerNavigationOrder;

    if (!key) {
      errors[`sections.${index}.key`] = "Section key is required.";
    }

    if (key && usedKeys.has(key)) {
      errors[`sections.${index}.key`] = "Section keys must be unique.";
    }

    if (key) {
      usedKeys.add(key);
    }

    if (!label) {
      errors[`sections.${index}.label`] = "Section label is required.";
    } else if (containsControlCharacters(label)) {
      errors[`sections.${index}.label`] =
        "Section label cannot contain line breaks or control characters.";
    }

    if (!isValidSectionOrder(order)) {
      errors[`sections.${index}.order`] =
        `Homepage order must be a whole number from 0 to ${MAX_SECTION_ORDER}.`;
    }

    if (!isValidSectionOrder(navigationOrder)) {
      errors[`sections.${index}.navigationOrder`] =
        `Navbar order must be a whole number from 0 to ${MAX_SECTION_ORDER}.`;
    }

    if (!isValidSectionOrder(footerNavigationOrder)) {
      errors[`sections.${index}.footerNavigationOrder`] =
        `Footer order must be a whole number from 0 to ${MAX_SECTION_ORDER}.`;
    }
  });

  validateHeroQuickLinks(formValues, errors);
  validateAboutIdentityRoles(formValues, errors);
  validateAboutWorkItems(formValues, errors);

  platformGroupFields.forEach((fieldName) => {
    validatePlatformGroup(formValues, fieldName, errors);
  });

  validateLegalLinks(formValues, errors);

  validateDynamicContentUrls(formValues, errors);

  return errors;
}

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm font-medium text-red-600">{message}</p>;
}

function SettingsCard({ title, description, children, isVisible = true }) {
  if (!isVisible) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>

      {description && (
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      )}

      <div className="mt-6">{children}</div>
    </section>
  );
}

function TextInput({
  id,
  name,
  label,
  value,
  onChange,
  error,
  disabled,
  type = "text",
  placeholder = "",
  maxLength,
  required = false,
  readOnly = false,
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
        {required ? " *" : ""}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`${inputClasses} ${
          readOnly ? "cursor-not-allowed bg-slate-100 text-slate-500" : ""
        }`}
      />

      <FieldError message={error} />
    </div>
  );
}

function TextareaInput({
  id,
  name,
  label,
  value,
  onChange,
  error,
  disabled,
  placeholder = "",
  rows = 5,
  maxLength,
  required = false,
  helpText = "",
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
        {required ? " *" : ""}
      </label>

      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={textareaClasses}
      />

      <div className="mt-2 flex items-start justify-between gap-4">
        <div>
          {helpText && !error && (
            <p className="text-xs leading-5 text-slate-400">{helpText}</p>
          )}

          <FieldError message={error} />
        </div>

        {maxLength && (
          <span className="ml-auto shrink-0 text-xs text-slate-400">
            {String(value || "").length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

function ImageUrlField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  disabled,
  placeholder = "https://...",
  previewAlt,
  previewClassName = "h-32 w-full object-contain",
  accessToken = "",
  allowedTypes = ["image", "svg"],
  pickerTitle = "Choose Image",
  helpText = "",
  onUnauthorized,
}) {
  return (
    <div>
      <MediaField
        id={id}
        name={name}
        label={label}
        value={value}
        onChange={onChange}
        accessToken={accessToken}
        allowedTypes={allowedTypes}
        pickerTitle={pickerTitle}
        placeholder={placeholder}
        helpText={helpText}
        error={error}
        disabled={disabled}
        onUnauthorized={onUnauthorized}
      />

      {value && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <img src={value} alt={previewAlt} className={previewClassName} />
        </div>
      )}
    </div>
  );
}

function ListingSectionSettingsCard({
  title,
  description,
  fieldName,
  values,
  disabled,
  onChange,
  getFieldError,
  isVisible = true,
  showCta = true,
}) {
  return (
    <SettingsCard title={title} description={description} isVisible={isVisible}>
      <div className="grid gap-5">
        <TextInput
          id={`settings-${fieldName}-eyebrow`}
          name={`${fieldName}.eyebrow`}
          label="Section eyebrow"
          value={values.eyebrow}
          onChange={onChange}
          error={getFieldError(`${fieldName}.eyebrow`, fieldName)}
          disabled={disabled}
          placeholder="Selected Work"
          maxLength={100}
        />

        <TextInput
          id={`settings-${fieldName}-heading`}
          name={`${fieldName}.heading`}
          label="Section heading"
          value={values.heading}
          onChange={onChange}
          error={getFieldError(`${fieldName}.heading`, fieldName)}
          disabled={disabled}
          placeholder="A clear section heading"
          maxLength={200}
        />

        <TextareaInput
          id={`settings-${fieldName}-description`}
          name={`${fieldName}.description`}
          label="Section description"
          value={values.description}
          onChange={onChange}
          error={getFieldError(`${fieldName}.description`, fieldName)}
          disabled={disabled}
          rows={5}
          maxLength={1200}
          placeholder="Explain the content shown in this section."
        />

        {showCta && (
          <div className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-2">
            <TextInput
              id={`settings-${fieldName}-cta-label`}
              name={`${fieldName}.ctaButton.label`}
              label="CTA button label"
              value={values.ctaButton.label}
              onChange={onChange}
              error={getFieldError(
                `${fieldName}.ctaButton.label`,
                `${fieldName}.ctaButton`,
                fieldName,
              )}
              disabled={disabled}
              placeholder="View All"
              maxLength={50}
            />

            <TextInput
              id={`settings-${fieldName}-cta-url`}
              name={`${fieldName}.ctaButton.url`}
              label="CTA button URL"
              value={values.ctaButton.url}
              onChange={onChange}
              error={getFieldError(
                `${fieldName}.ctaButton.url`,
                `${fieldName}.ctaButton`,
                fieldName,
              )}
              disabled={disabled}
              placeholder="#contact or /projects"
              maxLength={500}
            />
          </div>
        )}
      </div>
    </SettingsCard>
  );
}

function SiteSettingsForm({
  initialValues = defaultFormValues,
  onSubmit,
  activePageKey = "all",
  cancelPath = "/admin/dashboard",
  cancelLabel = "Cancel",
  submitLabel = "Save Site Settings",
  accessToken = "",
  onMediaUnauthorized,
}) {
  const [formValues, setFormValues] = useState(() =>
    prepareInitialValues(initialValues),
  );

  const [localErrors, setLocalErrors] = useState({});

  const [serverErrors, setServerErrors] = useState({});

  const [submitError, setSubmitError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  function getFieldError(...fieldNames) {
    for (const fieldName of fieldNames) {
      if (localErrors[fieldName]) {
        return localErrors[fieldName];
      }

      if (serverErrors[fieldName]) {
        return serverErrors[fieldName];
      }
    }

    return "";
  }

  function clearFieldErrors(...fieldNames) {
    setLocalErrors((currentErrors) => {
      const updatedErrors = {
        ...currentErrors,
      };

      fieldNames.forEach((fieldName) => {
        delete updatedErrors[fieldName];
      });

      return updatedErrors;
    });

    setServerErrors((currentErrors) => {
      const updatedErrors = {
        ...currentErrors,
      };

      fieldNames.forEach((fieldName) => {
        delete updatedErrors[fieldName];
      });

      return updatedErrors;
    });
  }

  function clearFieldErrorGroup(fieldPrefix) {
    setLocalErrors((currentErrors) =>
      removeErrorGroup(currentErrors, fieldPrefix),
    );

    setServerErrors((currentErrors) =>
      removeErrorGroup(currentErrors, fieldPrefix),
    );
  }

  function handleHeroQuickLinksChange(nextItems) {
    const items = Array.isArray(nextItems) ? nextItems : [];

    setFormValues((currentValues) => ({
      ...currentValues,

      hero: {
        ...currentValues.hero,

        quickLinks: items.map((item, index) => ({
          ...item,
          order: index + 1,
        })),
      },
    }));

    clearFieldErrorGroup("hero.quickLinks");
    setSubmitError("");
  }

  function handleAboutWorkItemsChange(nextItems) {
    const items = Array.isArray(nextItems) ? nextItems : [];

    setFormValues((currentValues) => ({
      ...currentValues,

      about: {
        ...currentValues.about,

        workItems: items.map((item, index) => ({
          ...item,
          order: index + 1,
        })),
      },
    }));

    clearFieldErrorGroup("about.workItems");
    setSubmitError("");
  }

  function handleAboutIdentityRolesChange(nextRoles) {
    const roles = Array.isArray(nextRoles) ? nextRoles : [];

    setFormValues((currentValues) => ({
      ...currentValues,

      about: {
        ...currentValues.about,

        identityRoles: roles.map((role, index) => ({
          ...role,
          order: index + 1,
        })),
      },
    }));

    clearFieldErrorGroup("about.identityRoles");
    setSubmitError("");
  }

  function handlePlatformChange(fieldName, nextPlatforms) {
    const platforms = Array.isArray(nextPlatforms) ? nextPlatforms : [];

    setFormValues((currentValues) => ({
      ...currentValues,

      [fieldName]: platforms.map((platform, index) => ({
        ...platform,
        order: index + 1,
      })),
    }));

    clearFieldErrorGroup(fieldName);
    setSubmitError("");
  }

  function handleLegalLinksChange(nextLegalLinks) {
    const legalLinks = Array.isArray(nextLegalLinks) ? nextLegalLinks : [];

    setFormValues((currentValues) => ({
      ...currentValues,

      footer: {
        ...currentValues.footer,

        legalLinks: legalLinks.map((link, index) => ({
          ...link,
          order: index + 1,
        })),
      },
    }));

    clearFieldErrorGroup("footer.legalLinks");

    setSubmitError("");
  }

  function handleFieldChange(event) {
    const { name, value, type, checked } = event.target;

    const nextValue = type === "checkbox" ? checked : value;

    setFormValues((currentValues) =>
      setNestedValue(currentValues, name, nextValue),
    );

    const rootField = name.split(".")[0];

    clearFieldErrors(name, rootField);

    setSubmitError("");
  }

  function handleSectionChange(index, fieldName, value) {
    setFormValues((currentValues) => ({
      ...currentValues,

      sections: currentValues.sections.map((section, sectionIndex) =>
        sectionIndex === index
          ? {
              ...section,
              [fieldName]: value,
            }
          : section,
      ),
    }));

    clearFieldErrors("sections", `sections.${index}.${fieldName}`);

    setSubmitError("");
  }

  function handleMoveSection(index, direction) {
    setFormValues((currentValues) => {
      const homepageIndexes = currentValues.sections
        .map((section, sectionIndex) =>
          homepageSectionKeys.has(section.key) ? sectionIndex : -1,
        )
        .filter((sectionIndex) => sectionIndex >= 0);

      const currentHomepagePosition = homepageIndexes.indexOf(index);
      const targetHomepagePosition = currentHomepagePosition + direction;

      if (
        currentHomepagePosition < 0 ||
        targetHomepagePosition < 0 ||
        targetHomepagePosition >= homepageIndexes.length
      ) {
        return currentValues;
      }

      const targetIndex = homepageIndexes[targetHomepagePosition];
      const updatedSections = [...currentValues.sections];

      [updatedSections[index], updatedSections[targetIndex]] = [
        updatedSections[targetIndex],
        updatedSections[index],
      ];

      return {
        ...currentValues,

        sections: updatedSections.map((section, sectionIndex) => ({
          ...section,
          order: sectionIndex + 1,
        })),
      };
    });

    clearFieldErrors("sections");
    setSubmitError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateSiteSettingsForm(formValues);

    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      setServerErrors({});

      setSubmitError("Please correct the highlighted site settings fields.");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setIsSubmitting(true);
      setLocalErrors({});
      setServerErrors({});
      setSubmitError("");

      await onSubmit(createSiteSettingsPayload(formValues));
    } catch (error) {
      setServerErrors(error?.fieldErrors || {});

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Site settings could not be saved.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const combinedFieldErrors = {
    ...serverErrors,
    ...localErrors,
  };

  function isPanelActive(panelKey) {
    return activePageKey === "all" || activePageKey === panelKey;
  }

  const homepageSectionIndexes = formValues.sections
    .map((section, index) =>
      homepageSectionKeys.has(section.key) ? index : -1,
    )
    .filter((index) => index >= 0);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {submitError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium leading-6 text-red-700"
        >
          {submitError}
        </div>
      )}

      <SettingsCard
        isVisible={isPanelActive("brand")}
        title="Brand Identity"
        description="Manage the main website name, short logo text, tagline and brand images."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <TextInput
            id="settings-brand-name"
            name="brand.name"
            label="Brand name"
            value={formValues.brand.name}
            onChange={handleFieldChange}
            error={getFieldError("brand.name", "brand")}
            disabled={isSubmitting}
            placeholder="RakeshNexify"
            maxLength={100}
            required
          />

          <TextInput
            id="settings-brand-short-name"
            name="brand.shortName"
            label="Brand short name"
            value={formValues.brand.shortName}
            onChange={handleFieldChange}
            error={getFieldError("brand.shortName", "brand")}
            disabled={isSubmitting}
            placeholder="RN"
            maxLength={10}
            required
          />

          <div className="lg:col-span-2">
            <TextInput
              id="settings-brand-tagline"
              name="brand.tagline"
              label="Brand tagline"
              value={formValues.brand.tagline}
              onChange={handleFieldChange}
              error={getFieldError("brand.tagline", "brand")}
              disabled={isSubmitting}
              placeholder="Developer · Creator · Entrepreneur"
              maxLength={150}
            />
          </div>

          <ImageUrlField
            id="settings-brand-logo"
            name="brand.logoUrl"
            label="Logo URL"
            value={formValues.brand.logoUrl}
            onChange={handleFieldChange}
            error={getFieldError("brand.logoUrl", "brand")}
            disabled={isSubmitting}
            accessToken={accessToken}
            allowedTypes={["image", "svg"]}
            pickerTitle="Choose Brand Logo"
            helpText="Paste an external URL or choose an image/SVG from the Media Library."
            onUnauthorized={onMediaUnauthorized}
            previewAlt="Website brand logo preview"
          />

          <ImageUrlField
            id="settings-brand-favicon"
            name="brand.faviconUrl"
            label="Favicon URL"
            value={formValues.brand.faviconUrl}
            onChange={handleFieldChange}
            error={getFieldError("brand.faviconUrl", "brand")}
            disabled={isSubmitting}
            accessToken={accessToken}
            allowedTypes={["image", "svg"]}
            pickerTitle="Choose Favicon"
            helpText="Choose an image/SVG from Media or keep using a manual external URL. Manual .ico URLs remain supported."
            onUnauthorized={onMediaUnauthorized}
            previewAlt="Website favicon preview"
            previewClassName="mx-auto size-20 object-contain"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        isVisible={isPanelActive("owner")}
        title="Owner Profile"
        description="Manage the portfolio owner information shown in the Hero and About sections."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <TextInput
            id="settings-owner-name"
            name="owner.name"
            label="Owner name"
            value={formValues.owner.name}
            onChange={handleFieldChange}
            error={getFieldError("owner.name", "owner")}
            disabled={isSubmitting}
            placeholder="Rakesh Pandit"
            maxLength={100}
            required
          />

          <TextInput
            id="settings-owner-title"
            name="owner.professionalTitle"
            label="Professional title"
            value={formValues.owner.professionalTitle}
            onChange={handleFieldChange}
            error={getFieldError("owner.professionalTitle", "owner")}
            disabled={isSubmitting}
            placeholder="MERN Stack Developer"
            maxLength={150}
          />

          <TextInput
            id="settings-owner-location"
            name="owner.location"
            label="Owner location"
            value={formValues.owner.location}
            onChange={handleFieldChange}
            error={getFieldError("owner.location", "owner")}
            disabled={isSubmitting}
            placeholder="Kathmandu, Nepal"
            maxLength={150}
          />

          <MediaField
            id="settings-owner-resume"
            name="owner.resumeUrl"
            label="Resume URL"
            value={formValues.owner.resumeUrl}
            onChange={handleFieldChange}
            accessToken={accessToken}
            allowedTypes={["document"]}
            pickerTitle="Choose Resume PDF"
            placeholder="https://..."
            helpText="Paste an external resume URL or choose an uploaded PDF from the Media Library."
            error={getFieldError("owner.resumeUrl", "owner")}
            disabled={isSubmitting}
            onUnauthorized={onMediaUnauthorized}
          />

          <div className="lg:col-span-2">
            <ImageUrlField
              id="settings-owner-image"
              name="owner.profileImageUrl"
              label="Profile image URL"
              value={formValues.owner.profileImageUrl}
              onChange={handleFieldChange}
              error={getFieldError("owner.profileImageUrl", "owner")}
              disabled={isSubmitting}
              accessToken={accessToken}
              allowedTypes={["image", "svg"]}
              pickerTitle="Choose Owner Profile Image"
              helpText="Paste an external URL or choose an image/SVG from the Media Library."
              onUnauthorized={onMediaUnauthorized}
              previewAlt="Portfolio owner profile preview"
              previewClassName="mx-auto size-40 rounded-2xl object-cover"
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        isVisible={isPanelActive("hero")}
        title="Hero Section"
        description="Control the technical cover image, main heading, introduction, dynamic quick links and call-to-action settings."
      >
        <div className="grid gap-5">
          <ImageUrlField
            id="settings-hero-cover-image"
            name="hero.coverImageUrl"
            label="Hero Cover Image"
            value={formValues.hero.coverImageUrl}
            onChange={handleFieldChange}
            error={getFieldError("hero.coverImageUrl", "hero")}
            disabled={isSubmitting}
            accessToken={accessToken}
            allowedTypes={["image", "svg"]}
            pickerTitle="Choose Hero Cover Image"
            helpText="Optional technical cover/background image. Choose from the existing Media Library or paste an external URL. When empty, the Hero uses its built-in professional technical background."
            onUnauthorized={onMediaUnauthorized}
            previewAlt="Hero cover image preview"
            previewClassName="h-44 w-full rounded-xl object-cover sm:h-56"
          />

          <TextInput
            id="settings-hero-eyebrow"
            name="hero.eyebrow"
            label="Hero eyebrow"
            value={formValues.hero.eyebrow}
            onChange={handleFieldChange}
            error={getFieldError("hero.eyebrow", "hero")}
            disabled={isSubmitting}
            placeholder="MERN Stack Developer"
            maxLength={100}
          />

          <TextInput
            id="settings-hero-heading"
            name="hero.heading"
            label="Hero heading"
            value={formValues.hero.heading}
            onChange={handleFieldChange}
            error={getFieldError("hero.heading", "hero")}
            disabled={isSubmitting}
            placeholder="I build modern digital experiences..."
            maxLength={250}
            required
          />

          <TextareaInput
            id="settings-hero-description"
            name="hero.description"
            label="Hero description"
            value={formValues.hero.description}
            onChange={handleFieldChange}
            error={getFieldError("hero.description", "hero")}
            disabled={isSubmitting}
            rows={5}
            maxLength={1000}
            placeholder="Explain your professional services and value."
          />

          <HeroQuickLinksEditor
            items={formValues.hero.quickLinks}
            fieldErrors={combinedFieldErrors}
            disabled={isSubmitting}
            accessToken={accessToken}
            onMediaUnauthorized={onMediaUnauthorized}
            onChange={handleHeroQuickLinksChange}
          />

          <div className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-2">
            <TextInput
              id="settings-primary-label"
              name="hero.primaryButton.label"
              label="Primary button label"
              value={formValues.hero.primaryButton.label}
              onChange={handleFieldChange}
              error={getFieldError(
                "hero.primaryButton.label",
                "hero.primaryButton",
                "hero",
              )}
              disabled={isSubmitting}
              placeholder="View Projects"
              maxLength={50}
            />

            <TextInput
              id="settings-primary-url"
              name="hero.primaryButton.url"
              label="Primary button URL"
              value={formValues.hero.primaryButton.url}
              onChange={handleFieldChange}
              error={getFieldError(
                "hero.primaryButton.url",
                "hero.primaryButton",
                "hero",
              )}
              disabled={isSubmitting}
              placeholder="#projects"
              maxLength={500}
            />

            <TextInput
              id="settings-secondary-label"
              name="hero.secondaryButton.label"
              label="Secondary button label"
              value={formValues.hero.secondaryButton.label}
              onChange={handleFieldChange}
              error={getFieldError(
                "hero.secondaryButton.label",
                "hero.secondaryButton",
                "hero",
              )}
              disabled={isSubmitting}
              placeholder="Contact Me"
              maxLength={50}
            />

            <TextInput
              id="settings-secondary-url"
              name="hero.secondaryButton.url"
              label="Secondary button URL"
              value={formValues.hero.secondaryButton.url}
              onChange={handleFieldChange}
              error={getFieldError(
                "hero.secondaryButton.url",
                "hero.secondaryButton",
                "hero",
              )}
              disabled={isSubmitting}
              placeholder="#contact"
              maxLength={500}
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        isVisible={isPanelActive("about")}
        title="About Section"
        description="Manage the public About content, animated identity roles and manually linked rotating work items."
      >
        <div className="grid gap-5">
          <TextInput
            id="settings-about-eyebrow"
            name="about.eyebrow"
            label="About eyebrow"
            value={formValues.about.eyebrow}
            onChange={handleFieldChange}
            error={getFieldError("about.eyebrow", "about")}
            disabled={isSubmitting}
            placeholder="About Me"
            maxLength={100}
          />

          <TextInput
            id="settings-about-heading"
            name="about.heading"
            label="About heading"
            value={formValues.about.heading}
            onChange={handleFieldChange}
            error={getFieldError("about.heading", "about")}
            disabled={isSubmitting}
            placeholder="RakeshNexify"
            maxLength={150}
            required
          />

          <AboutIdentityRolesEditor
            roles={formValues.about.identityRoles}
            fieldErrors={combinedFieldErrors}
            disabled={isSubmitting}
            onChange={handleAboutIdentityRolesChange}
          />

          <TextareaInput
            id="settings-about-description"
            name="about.description"
            label="About description"
            value={formValues.about.description}
            onChange={handleFieldChange}
            error={getFieldError("about.description", "about")}
            disabled={isSubmitting}
            rows={8}
            maxLength={3000}
            placeholder="Write the complete About section content."
            helpText="Use a blank line to separate multiple paragraphs."
          />

          <AboutWorkItemsEditor
            items={formValues.about.workItems}
            fieldErrors={combinedFieldErrors}
            disabled={isSubmitting}
            onChange={handleAboutWorkItemsChange}
          />

          <div className="grid gap-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                About Platform Grids
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Manage the Social Media and Freelancing icon grids shown
                directly below the rotating Work Links card.
              </p>
            </div>

            <PlatformSettingsEditor
              title="Social Media Profiles"
              description="Add, edit, remove, hide and reorder the social profiles shown in the public About Social Media grid."
              fieldName="socialPlatforms"
              platforms={formValues.socialPlatforms}
              fieldErrors={combinedFieldErrors}
              disabled={isSubmitting}
              accessToken={accessToken}
              onMediaUnauthorized={onMediaUnauthorized}
              onChange={(nextPlatforms) =>
                handlePlatformChange("socialPlatforms", nextPlatforms)
              }
            />

            <PlatformSettingsEditor
              title="Freelancing Profiles"
              description="Add, edit, remove, hide and reorder the freelancing profiles shown in the public About Freelancing grid."
              fieldName="freelancerPlatforms"
              platforms={formValues.freelancerPlatforms}
              fieldErrors={combinedFieldErrors}
              disabled={isSubmitting}
              accessToken={accessToken}
              onMediaUnauthorized={onMediaUnauthorized}
              onChange={(nextPlatforms) =>
                handlePlatformChange("freelancerPlatforms", nextPlatforms)
              }
            />
          </div>
        </div>
      </SettingsCard>

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Statistics Section Content"
        description="Manage the eyebrow, heading and description shown above the Home Statistics section."
        fieldName="statisticsSection"
        values={formValues.statisticsSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
        showCta={false}
      />

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Skills Section Content"
        description="Manage the heading, description and call-to-action displayed above your public Skills."
        fieldName="skillsSection"
        values={formValues.skillsSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
      />

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Services Section Content"
        description="Manage the heading, description and call-to-action displayed above your public services."
        fieldName="servicesSection"
        values={formValues.servicesSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
      />

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Projects Section Content"
        description="Manage the heading, description and call-to-action displayed above your public projects."
        fieldName="projectsSection"
        values={formValues.projectsSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
      />

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Case Studies Section Content"
        description="Manage the heading, description and call-to-action displayed above your published Project Case Studies."
        fieldName="caseStudiesSection"
        values={formValues.caseStudiesSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
      />

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Education Section Content"
        description="Manage the heading, description and call-to-action displayed above your public Education timeline."
        fieldName="educationSection"
        values={formValues.educationSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
      />

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Experience Section Content"
        description="Manage the heading, description and call-to-action displayed above your public Experience timeline."
        fieldName="experienceSection"
        values={formValues.experienceSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
      />

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Certifications & Achievements Section Content"
        description="Manage the heading, description and call-to-action displayed above your public certifications, licenses, awards and achievements."
        fieldName="achievementsSection"
        values={formValues.achievementsSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
      />

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Team Section Content"
        description="Manage the heading, description and call-to-action displayed above your public Team members."
        fieldName="teamSection"
        values={formValues.teamSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
      />

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Companies Section Content"
        description="Manage the heading, description and call-to-action displayed above your companies and brands."
        fieldName="companiesSection"
        values={formValues.companiesSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
      />

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Clients & Partners Section Content"
        description="Manage the heading, description and call-to-action displayed above your public Clients & Partners."
        fieldName="clientsPartnersSection"
        values={formValues.clientsPartnersSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
      />

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Testimonials Section Content"
        description="Manage the heading, description and call-to-action displayed above your public client Testimonials."
        fieldName="testimonialsSection"
        values={formValues.testimonialsSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
      />

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="FAQ Section Content"
        description="Manage the heading, description and call-to-action displayed above your public FAQ accordion."
        fieldName="faqSection"
        values={formValues.faqSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
      />

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Latest Articles & News Section Content"
        description="Manage the heading, description and primary call-to-action for the combined Blog and News homepage preview."
        fieldName="postsSection"
        values={formValues.postsSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
      />

      <SettingsCard
        isVisible={isPanelActive("contact")}
        title="Contact Section Content"
        description="Manage the public Contact section heading and project-enquiry card content."
      >
        <div className="grid gap-5">
          <TextInput
            id="settings-contact-section-eyebrow"
            name="contactSection.eyebrow"
            label="Section eyebrow"
            value={formValues.contactSection.eyebrow}
            onChange={handleFieldChange}
            error={getFieldError("contactSection.eyebrow", "contactSection")}
            disabled={isSubmitting}
            placeholder="Contact Me"
            maxLength={100}
          />

          <TextInput
            id="settings-contact-section-heading"
            name="contactSection.heading"
            label="Section heading"
            value={formValues.contactSection.heading}
            onChange={handleFieldChange}
            error={getFieldError("contactSection.heading", "contactSection")}
            disabled={isSubmitting}
            placeholder="Let us discuss your next digital project"
            maxLength={200}
          />

          <TextareaInput
            id="settings-contact-section-description"
            name="contactSection.description"
            label="Section description"
            value={formValues.contactSection.description}
            onChange={handleFieldChange}
            error={getFieldError(
              "contactSection.description",
              "contactSection",
            )}
            disabled={isSubmitting}
            rows={5}
            maxLength={1200}
            placeholder="Explain which types of projects and enquiries are welcome."
          />

          <div className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <TextInput
              id="settings-contact-enquiry-eyebrow"
              name="contactSection.enquiryEyebrow"
              label="Enquiry-card eyebrow"
              value={formValues.contactSection.enquiryEyebrow}
              onChange={handleFieldChange}
              error={getFieldError(
                "contactSection.enquiryEyebrow",
                "contactSection",
              )}
              disabled={isSubmitting}
              placeholder="Project Enquiries"
              maxLength={100}
            />

            <TextInput
              id="settings-contact-enquiry-heading"
              name="contactSection.enquiryHeading"
              label="Enquiry-card heading"
              value={formValues.contactSection.enquiryHeading}
              onChange={handleFieldChange}
              error={getFieldError(
                "contactSection.enquiryHeading",
                "contactSection",
              )}
              disabled={isSubmitting}
              placeholder="Ready to build something useful?"
              maxLength={200}
            />

            <TextareaInput
              id="settings-contact-enquiry-description"
              name="contactSection.enquiryDescription"
              label="Enquiry-card description"
              value={formValues.contactSection.enquiryDescription}
              onChange={handleFieldChange}
              error={getFieldError(
                "contactSection.enquiryDescription",
                "contactSection",
              )}
              disabled={isSubmitting}
              rows={6}
              maxLength={1500}
              placeholder="Explain which project details the client should provide."
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        isVisible={isPanelActive("contact")}
        title="Contact Information"
        description="Manage the public email, phone, WhatsApp, location and availability message."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <TextInput
            id="settings-contact-email"
            name="contact.email"
            label="Email address"
            value={formValues.contact.email}
            onChange={handleFieldChange}
            error={getFieldError("contact.email", "contact")}
            disabled={isSubmitting}
            type="email"
            placeholder="you@example.com"
            maxLength={150}
          />

          <TextInput
            id="settings-contact-phone"
            name="contact.phone"
            label="Phone number"
            value={formValues.contact.phone}
            onChange={handleFieldChange}
            error={getFieldError("contact.phone", "contact")}
            disabled={isSubmitting}
            type="tel"
            placeholder="+977..."
            maxLength={30}
          />

          <TextInput
            id="settings-contact-whatsapp"
            name="contact.whatsapp"
            label="WhatsApp number"
            value={formValues.contact.whatsapp}
            onChange={handleFieldChange}
            error={getFieldError("contact.whatsapp", "contact")}
            disabled={isSubmitting}
            type="tel"
            placeholder="+977..."
            maxLength={30}
          />

          <TextInput
            id="settings-contact-location"
            name="contact.location"
            label="Public location"
            value={formValues.contact.location}
            onChange={handleFieldChange}
            error={getFieldError("contact.location", "contact")}
            disabled={isSubmitting}
            placeholder="Kathmandu, Nepal"
            maxLength={150}
          />

          <div className="lg:col-span-2">
            <TextInput
              id="settings-contact-availability"
              name="contact.availability"
              label="Availability message"
              value={formValues.contact.availability}
              onChange={handleFieldChange}
              error={getFieldError("contact.availability", "contact")}
              disabled={isSubmitting}
              placeholder="Available for freelance and business projects"
              maxLength={250}
            />
          </div>
        </div>
      </SettingsCard>

      {isPanelActive("platforms") && (
        <>
          <PlatformSettingsEditor
            title="Social Platforms"
            description="Manage social media profiles displayed in the Contact section and website Footer."
            fieldName="socialPlatforms"
            platforms={formValues.socialPlatforms}
            fieldErrors={combinedFieldErrors}
            disabled={isSubmitting}
            accessToken={accessToken}
            onMediaUnauthorized={onMediaUnauthorized}
            onChange={(nextPlatforms) =>
              handlePlatformChange("socialPlatforms", nextPlatforms)
            }
          />

          <PlatformSettingsEditor
            title="Developer Platforms"
            description="Manage coding and developer profile links such as GitHub, GitLab, StackBlitz and CodePen."
            fieldName="developerPlatforms"
            platforms={formValues.developerPlatforms}
            fieldErrors={combinedFieldErrors}
            disabled={isSubmitting}
            accessToken={accessToken}
            onMediaUnauthorized={onMediaUnauthorized}
            onChange={(nextPlatforms) =>
              handlePlatformChange("developerPlatforms", nextPlatforms)
            }
          />

          <PlatformSettingsEditor
            title="Freelancer Platforms"
            description="Manage public freelancing profiles such as Upwork, Fiverr, Freelancer, PeoplePerHour and Contra."
            fieldName="freelancerPlatforms"
            platforms={formValues.freelancerPlatforms}
            fieldErrors={combinedFieldErrors}
            disabled={isSubmitting}
            accessToken={accessToken}
            onMediaUnauthorized={onMediaUnauthorized}
            onChange={(nextPlatforms) =>
              handlePlatformChange("freelancerPlatforms", nextPlatforms)
            }
          />
        </>
      )}

      <SettingsCard
        isVisible={isPanelActive("footer")}
        title="Footer Content"
        description="Manage the Footer introduction, column headings, project button, legal links and copyright text."
      >
        <div className="grid gap-6">
          <TextareaInput
            id="settings-footer-introduction"
            name="footer.introduction"
            label="Footer introduction"
            value={formValues.footer.introduction}
            onChange={handleFieldChange}
            error={getFieldError("footer.introduction", "footer")}
            disabled={isSubmitting}
            rows={5}
            maxLength={1000}
            placeholder="Write a short professional introduction for the Footer."
          />

          <div className="grid gap-5 lg:grid-cols-3">
            <TextInput
              id="settings-footer-quick-links-heading"
              name="footer.quickLinksHeading"
              label="Quick-links heading"
              value={formValues.footer.quickLinksHeading}
              onChange={handleFieldChange}
              error={getFieldError("footer.quickLinksHeading", "footer")}
              disabled={isSubmitting}
              placeholder="Quick Links"
              maxLength={100}
            />

            <TextInput
              id="settings-footer-services-heading"
              name="footer.servicesHeading"
              label="Services heading"
              value={formValues.footer.servicesHeading}
              onChange={handleFieldChange}
              error={getFieldError("footer.servicesHeading", "footer")}
              disabled={isSubmitting}
              placeholder="Services"
              maxLength={100}
            />

            <TextInput
              id="settings-footer-platforms-heading"
              name="footer.platformsHeading"
              label="Platforms heading"
              value={formValues.footer.platformsHeading}
              onChange={handleFieldChange}
              error={getFieldError("footer.platformsHeading", "footer")}
              disabled={isSubmitting}
              placeholder="Platforms"
              maxLength={100}
            />
          </div>

          <TextareaInput
            id="settings-footer-platform-note"
            name="footer.platformNote"
            label="Platform note"
            value={formValues.footer.platformNote}
            onChange={handleFieldChange}
            error={getFieldError("footer.platformNote", "footer")}
            disabled={isSubmitting}
            rows={3}
            maxLength={300}
            placeholder="Profiles without official URLs remain disabled."
          />

          <div className="grid gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:grid-cols-2">
            <TextInput
              id="settings-footer-project-button-label"
              name="footer.projectButton.label"
              label="Project button label"
              value={formValues.footer.projectButton.label}
              onChange={handleFieldChange}
              error={getFieldError(
                "footer.projectButton.label",
                "footer.projectButton",
                "footer",
              )}
              disabled={isSubmitting}
              placeholder="Start a project with me"
              maxLength={50}
            />

            <TextInput
              id="settings-footer-project-button-url"
              name="footer.projectButton.url"
              label="Project button URL"
              value={formValues.footer.projectButton.url}
              onChange={handleFieldChange}
              error={getFieldError(
                "footer.projectButton.url",
                "footer.projectButton",
                "footer",
              )}
              disabled={isSubmitting}
              placeholder="#contact"
              maxLength={500}
            />
          </div>

          <LegalLinksEditor
            legalLinks={formValues.footer.legalLinks}
            fieldErrors={combinedFieldErrors}
            disabled={isSubmitting}
            onChange={handleLegalLinksChange}
          />

          <TextInput
            id="settings-footer-copyright"
            name="footer.copyrightText"
            label="Copyright text"
            value={formValues.footer.copyrightText}
            onChange={handleFieldChange}
            error={getFieldError("footer.copyrightText", "footer")}
            disabled={isSubmitting}
            placeholder="All rights reserved."
            maxLength={250}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        isVisible={isPanelActive("seo")}
        title="SEO Settings"
        description="Control search-engine metadata and the social-sharing preview image."
      >
        <div className="grid gap-5">
          <TextInput
            id="settings-seo-title"
            name="seo.title"
            label="SEO title"
            value={formValues.seo.title}
            onChange={handleFieldChange}
            error={getFieldError("seo.title", "seo")}
            disabled={isSubmitting}
            maxLength={70}
            placeholder="RakeshNexify | MERN Stack Developer"
          />

          <TextareaInput
            id="settings-seo-description"
            name="seo.description"
            label="SEO description"
            value={formValues.seo.description}
            onChange={handleFieldChange}
            error={getFieldError("seo.description", "seo")}
            disabled={isSubmitting}
            rows={4}
            maxLength={180}
            placeholder="Write a clear website description for search engines."
          />

          <TextareaInput
            id="settings-seo-keywords"
            name="seo.keywordsText"
            label="SEO keywords"
            value={formValues.seo.keywordsText}
            onChange={handleFieldChange}
            error={getFieldError("seo.keywords", "seo.keywordsText", "seo")}
            disabled={isSubmitting}
            rows={4}
            placeholder="mern developer, wordpress developer, ecommerce development"
            helpText="Separate keywords using commas or new lines."
          />

          <ImageUrlField
            id="settings-seo-image"
            name="seo.ogImageUrl"
            label="Social sharing image URL"
            value={formValues.seo.ogImageUrl}
            onChange={handleFieldChange}
            error={getFieldError("seo.ogImageUrl", "seo")}
            disabled={isSubmitting}
            accessToken={accessToken}
            allowedTypes={["image", "svg"]}
            pickerTitle="Choose Social Sharing Image"
            helpText="Paste an external URL or choose an image/SVG from the Media Library. JPG or PNG is generally safest for social sharing."
            onUnauthorized={onMediaUnauthorized}
            previewAlt="Social sharing preview"
            previewClassName="max-h-72 w-full object-contain"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        isVisible={isPanelActive("navigation")}
        title="Sections, Navbar, Footer & Public Pages"
        description="Control homepage sections, Navbar items, Footer Quick Links and dedicated public pages independently."
      >
        <FieldError message={getFieldError("sections")} />

        <div className="space-y-5">
          {formValues.sections.map((section, index) => {
            const hasHomepageSection = homepageSectionKeys.has(section.key);
            const hasNavigationItem = navigationSectionKeys.has(section.key);
            const hasFooterNavigationItem = footerNavigationSectionKeys.has(
              section.key,
            );
            const hasDedicatedPage = dedicatedPageSectionKeys.has(section.key);
            const homepagePosition = homepageSectionIndexes.indexOf(index);

            const capabilityLabel =
              hasHomepageSection && hasDedicatedPage
                ? "Homepage + Page"
                : hasDedicatedPage
                  ? "Public Page"
                  : hasHomepageSection
                    ? "Homepage Section"
                    : "Registry Item";

            return (
              <div
                key={section.key}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-base font-bold text-slate-950">
                      {section.label || section.key}
                    </p>

                    <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                      Section key:{" "}
                      <span className="font-semibold text-slate-700">
                        {section.key}
                      </span>
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                      hasDedicatedPage
                        ? "bg-brand-100 text-brand-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {capabilityLabel}
                  </span>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_8rem_8rem_8rem]">
                  <TextInput
                    id={`settings-section-key-${index}`}
                    name={`sections.${index}.key`}
                    label="Section key"
                    value={section.key}
                    onChange={() => {}}
                    error={getFieldError(`sections.${index}.key`)}
                    disabled={isSubmitting}
                    readOnly
                  />

                  <div>
                    <label
                      htmlFor={`settings-section-label-${index}`}
                      className="text-sm font-semibold text-slate-700"
                    >
                      Navigation label
                    </label>

                    <input
                      id={`settings-section-label-${index}`}
                      type="text"
                      value={section.label}
                      onChange={(event) =>
                        handleSectionChange(index, "label", event.target.value)
                      }
                      disabled={isSubmitting}
                      maxLength={100}
                      placeholder="Statistics"
                      className={inputClasses}
                    />

                    <FieldError
                      message={getFieldError(`sections.${index}.label`)}
                    />
                  </div>

                  <div>
                    {hasHomepageSection ? (
                      <>
                        <label
                          htmlFor={`settings-section-order-${index}`}
                          className="text-sm font-semibold text-slate-700"
                        >
                          Homepage order
                        </label>

                        <input
                          id={`settings-section-order-${index}`}
                          type="number"
                          min="0"
                          max={MAX_SECTION_ORDER}
                          step="1"
                          value={section.order}
                          onChange={(event) =>
                            handleSectionChange(
                              index,
                              "order",
                              event.target.value,
                            )
                          }
                          disabled={isSubmitting}
                          className={inputClasses}
                        />

                        <FieldError
                          message={getFieldError(`sections.${index}.order`)}
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-700">
                          Homepage order
                        </p>

                        <div
                          className={`${inputClasses} flex items-center text-slate-500`}
                        >
                          Not applicable
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    {hasNavigationItem ? (
                      <>
                        <label
                          htmlFor={`settings-navigation-order-${index}`}
                          className="text-sm font-semibold text-slate-700"
                        >
                          Navbar order
                        </label>

                        <input
                          id={`settings-navigation-order-${index}`}
                          type="number"
                          min="0"
                          max={MAX_SECTION_ORDER}
                          step="1"
                          value={section.navigationOrder}
                          onChange={(event) =>
                            handleSectionChange(
                              index,
                              "navigationOrder",
                              event.target.value,
                            )
                          }
                          disabled={isSubmitting}
                          className={inputClasses}
                        />

                        <FieldError
                          message={getFieldError(
                            `sections.${index}.navigationOrder`,
                          )}
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-700">
                          Navbar order
                        </p>

                        <div
                          className={`${inputClasses} flex items-center text-slate-500`}
                        >
                          Not applicable
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    {hasFooterNavigationItem ? (
                      <>
                        <label
                          htmlFor={`settings-footer-navigation-order-${index}`}
                          className="text-sm font-semibold text-slate-700"
                        >
                          Footer order
                        </label>

                        <input
                          id={`settings-footer-navigation-order-${index}`}
                          type="number"
                          min="0"
                          max={MAX_SECTION_ORDER}
                          step="1"
                          value={section.footerNavigationOrder}
                          onChange={(event) =>
                            handleSectionChange(
                              index,
                              "footerNavigationOrder",
                              event.target.value,
                            )
                          }
                          disabled={isSubmitting}
                          className={inputClasses}
                        />

                        <FieldError
                          message={getFieldError(
                            `sections.${index}.footerNavigationOrder`,
                          )}
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-700">
                          Footer order
                        </p>

                        <div
                          className={`${inputClasses} flex items-center text-slate-500`}
                        >
                          Not applicable
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {hasHomepageSection ? (
                    <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3">
                      <input
                        type="checkbox"
                        checked={section.isVisible !== false}
                        onChange={(event) =>
                          handleSectionChange(
                            index,
                            "isVisible",
                            event.target.checked,
                          )
                        }
                        disabled={isSubmitting}
                        className="size-4 shrink-0 accent-brand-600"
                      />

                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                          Show homepage section
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          Display this section on the homepage.
                        </span>
                      </span>
                    </label>
                  ) : (
                    <div className="flex min-h-16 items-center rounded-xl border border-dashed border-slate-300 bg-slate-100 px-4 py-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-600">
                          No homepage section
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          This registry item does not render its own homepage
                          section.
                        </span>
                      </span>
                    </div>
                  )}

                  {hasNavigationItem ? (
                    <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3">
                      <input
                        type="checkbox"
                        checked={section.isNavigationVisible !== false}
                        onChange={(event) =>
                          handleSectionChange(
                            index,
                            "isNavigationVisible",
                            event.target.checked,
                          )
                        }
                        disabled={isSubmitting}
                        className="size-4 shrink-0 accent-brand-600"
                      />

                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                          Show in navbar
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          Display this menu item in desktop and mobile
                          navigation.
                        </span>
                      </span>
                    </label>
                  ) : (
                    <div className="flex min-h-16 items-center rounded-xl border border-dashed border-slate-300 bg-slate-100 px-4 py-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-600">
                          No navbar item
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          Navigation is provided through the Blog and News page
                          items.
                        </span>
                      </span>
                    </div>
                  )}

                  {hasFooterNavigationItem ? (
                    <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3">
                      <input
                        type="checkbox"
                        checked={section.isFooterNavigationVisible !== false}
                        onChange={(event) =>
                          handleSectionChange(
                            index,
                            "isFooterNavigationVisible",
                            event.target.checked,
                          )
                        }
                        disabled={isSubmitting}
                        className="size-4 shrink-0 accent-brand-600"
                      />

                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                          Show in footer
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          Display this item in Footer Quick Links when its
                          public destination is available.
                        </span>
                      </span>
                    </label>
                  ) : (
                    <div className="flex min-h-16 items-center rounded-xl border border-dashed border-slate-300 bg-slate-100 px-4 py-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-600">
                          No footer item
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          This registry item has no Footer Quick Link
                          destination.
                        </span>
                      </span>
                    </div>
                  )}

                  {hasDedicatedPage ? (
                    <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3">
                      <input
                        type="checkbox"
                        checked={section.isPageVisible !== false}
                        onChange={(event) =>
                          handleSectionChange(
                            index,
                            "isPageVisible",
                            event.target.checked,
                          )
                        }
                        disabled={isSubmitting}
                        className="size-4 shrink-0 accent-brand-600"
                      />

                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-800">
                          Enable public page
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          Allow visitors to open this dedicated public page and
                          its details.
                        </span>
                      </span>
                    </label>
                  ) : (
                    <div className="flex min-h-16 items-center rounded-xl border border-dashed border-slate-300 bg-slate-100 px-4 py-3">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-600">
                          No dedicated page
                        </span>

                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          This item does not own a dedicated public page.
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-500">
                    {hasHomepageSection
                      ? "Move buttons change only real homepage section order. Navbar and Footer orders remain independent."
                      : "This page-only item does not participate in homepage ordering."}
                  </p>

                  {hasHomepageSection && (
                    <div className="flex shrink-0 gap-3">
                      <button
                        type="button"
                        onClick={() => handleMoveSection(index, -1)}
                        disabled={isSubmitting || homepagePosition <= 0}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Move Up
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveSection(index, 1)}
                        disabled={
                          isSubmitting ||
                          homepagePosition < 0 ||
                          homepagePosition === homepageSectionIndexes.length - 1
                        }
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Move Down
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard
        isVisible={isPanelActive("publication")}
        title="Publication Status"
        description="Control whether the main site settings are marked as published."
      >
        <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <input
            name="isPublished"
            type="checkbox"
            checked={formValues.isPublished}
            onChange={handleFieldChange}
            disabled={isSubmitting}
            className="mt-1 size-4 accent-brand-600"
          />

          <span>
            <span className="block text-sm font-bold text-slate-900">
              Site settings published
            </span>

            <span className="mt-1 block text-sm leading-6 text-slate-500">
              Published settings are available to the public portfolio API.
            </span>
          </span>
        </label>

        <FieldError message={getFieldError("isPublished")} />
      </SettingsCard>

      <div className="flex flex-col-reverse gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <Link
          to={cancelPath}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          {cancelLabel}
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Saving site settings..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default SiteSettingsForm;
