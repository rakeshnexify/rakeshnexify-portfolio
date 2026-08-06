import { useState } from "react";

import { Link } from "react-router";

import {
  createSiteSettingsFormValues,
  createSiteSettingsPayload,
} from "../../../utils/siteSettingsForm";
import LegalLinksEditor from "./LegalLinksEditor";
import PlatformSettingsEditor from "./PlatformSettingsEditor";

const inputClasses =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const textareaClasses =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const defaultFormValues = createSiteSettingsFormValues({});

const MAX_PLATFORMS_PER_GROUP = 25;

const MAX_LEGAL_LINKS = 20;

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
  "education",
  "team",
  "companies",
]);

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
      fieldName: "statisticsSection.ctaButton.url",
      value: formValues?.statisticsSection?.ctaButton?.url,
    },
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
      fieldName: "educationSection.ctaButton.url",
      value: formValues?.educationSection?.ctaButton?.url,
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

    about: {
      ...normalizedValues.about,

      highlightsText:
        typeof initialValues.about?.highlightsText === "string"
          ? initialValues.about.highlightsText
          : normalizedValues.about.highlightsText,
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

    educationSection: {
      ...normalizedValues.educationSection,

      ctaButton: {
        ...normalizedValues.educationSection.ctaButton,
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

    const order = Number(section?.order);

    const navigationOrder = Number(section?.navigationOrder);

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
    }

    if (!Number.isFinite(order) || order < 0) {
      errors[`sections.${index}.order`] =
        "Homepage order must be a non-negative number.";
    }

    if (!Number.isFinite(navigationOrder) || navigationOrder < 0) {
      errors[`sections.${index}.navigationOrder`] =
        "Navbar order must be a non-negative number.";
    }
  });

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
}) {
  return (
    <div>
      <TextInput
        id={id}
        name={name}
        label={label}
        value={value}
        onChange={onChange}
        error={error}
        disabled={disabled}
        type="url"
        placeholder={placeholder}
        maxLength={500}
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
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= formValues.sections.length) {
      return;
    }

    setFormValues((currentValues) => {
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

          <TextInput
            id="settings-owner-resume"
            name="owner.resumeUrl"
            label="Resume URL"
            value={formValues.owner.resumeUrl}
            onChange={handleFieldChange}
            error={getFieldError("owner.resumeUrl", "owner")}
            disabled={isSubmitting}
            type="url"
            placeholder="https://..."
            maxLength={500}
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
              previewAlt="Portfolio owner profile preview"
              previewClassName="mx-auto size-40 rounded-2xl object-cover"
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        isVisible={isPanelActive("hero")}
        title="Hero Section"
        description="Control the main heading, introduction and call-to-action buttons."
      >
        <div className="grid gap-5">
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
        description="Manage the About heading, description and skill or business highlights."
      >
        <div className="grid gap-5">
          <TextInput
            id="settings-about-heading"
            name="about.heading"
            label="About heading"
            value={formValues.about.heading}
            onChange={handleFieldChange}
            error={getFieldError("about.heading", "about")}
            disabled={isSubmitting}
            placeholder="About Me"
            maxLength={150}
            required
          />

          <TextareaInput
            id="settings-about-description"
            name="about.description"
            label="About description"
            value={formValues.about.description}
            onChange={handleFieldChange}
            error={getFieldError("about.description", "about")}
            disabled={isSubmitting}
            rows={10}
            maxLength={3000}
            placeholder="Write the complete About section content."
            helpText="Use a blank line to separate multiple paragraphs."
          />

          <TextareaInput
            id="settings-about-highlights"
            name="about.highlightsText"
            label="About highlights"
            value={formValues.about.highlightsText}
            onChange={handleFieldChange}
            error={getFieldError(
              "about.highlights",
              "about.highlightsText",
              "about",
            )}
            disabled={isSubmitting}
            rows={6}
            placeholder={"MERN Stack\nWordPress\nDigital Brands"}
            helpText="Enter one highlight per line."
          />
        </div>
      </SettingsCard>

      <ListingSectionSettingsCard
        isVisible={isPanelActive("listing-sections")}
        title="Statistics Section Content"
        description="Manage the heading, description and call-to-action displayed with your public portfolio statistics."
        fieldName="statisticsSection"
        values={formValues.statisticsSection}
        disabled={isSubmitting}
        onChange={handleFieldChange}
        getFieldError={getFieldError}
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
            previewAlt="Social sharing preview"
            previewClassName="max-h-72 w-full object-contain"
          />
        </div>
      </SettingsCard>

      <SettingsCard
        isVisible={isPanelActive("navigation")}
        title="Sections, Navbar & Public Pages"
        description="Control homepage sections, navbar menu items and dedicated public pages independently."
      >
        <FieldError message={getFieldError("sections")} />

        <div className="space-y-5">
          {formValues.sections.map((section, index) => {
            const hasDedicatedPage = dedicatedPageSectionKeys.has(section.key);

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
                    {hasDedicatedPage ? "Section + Page" : "Homepage Section"}
                  </span>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_9rem_9rem]">
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
                      Navbar menu label
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
                      step="1"
                      value={section.order}
                      onChange={(event) =>
                        handleSectionChange(index, "order", event.target.value)
                      }
                      disabled={isSubmitting}
                      className={inputClasses}
                    />

                    <FieldError
                      message={getFieldError(`sections.${index}.order`)}
                    />
                  </div>

                  <div>
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
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                        Display this menu item in desktop and mobile navigation.
                      </span>
                    </span>
                  </label>

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
                          Allow visitors to open the dedicated public page.
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
                          This item is available as a homepage section only.
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-500">
                    Move buttons change only the homepage section order. Navbar
                    order is controlled separately above.
                  </p>

                  <div className="flex shrink-0 gap-3">
                    <button
                      type="button"
                      onClick={() => handleMoveSection(index, -1)}
                      disabled={isSubmitting || index === 0}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Move Up
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveSection(index, 1)}
                      disabled={
                        isSubmitting || index === formValues.sections.length - 1
                      }
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Move Down
                    </button>
                  </div>
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
