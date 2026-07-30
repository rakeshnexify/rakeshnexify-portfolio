import { useState } from "react";

import { Link } from "react-router";

import {
  createSiteSettingsFormValues,
  createSiteSettingsPayload,
} from "../../../utils/siteSettingsForm";

const inputClasses =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const textareaClasses =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const defaultFormValues = createSiteSettingsFormValues({});

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

    seo: {
      ...normalizedValues.seo,

      keywordsText:
        typeof initialValues.seo?.keywordsText === "string"
          ? initialValues.seo.keywordsText
          : normalizedValues.seo.keywordsText,
    },

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
        "Section order must be a non-negative number.";
    }
  });

  return errors;
}

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm font-medium text-red-600">{message}</p>;
}

function SettingsCard({ title, description, children }) {
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

function SiteSettingsForm({
  initialValues = defaultFormValues,
  onSubmit,
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

      <SettingsCard
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

      <SettingsCard
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
        title="Homepage Sections"
        description="Show, hide and reorder the main public website sections."
      >
        <FieldError message={getFieldError("sections")} />

        <div className="space-y-4">
          {formValues.sections.map((section, index) => (
            <div
              key={section.key}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
                <div className="grid flex-1 gap-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_9rem]">
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
                      Section label
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
                      Display order
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
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4">
                    <input
                      type="checkbox"
                      checked={section.isVisible}
                      onChange={(event) =>
                        handleSectionChange(
                          index,
                          "isVisible",
                          event.target.checked,
                        )
                      }
                      disabled={isSubmitting}
                      className="size-4 accent-brand-600"
                    />

                    <span className="text-sm font-semibold text-slate-700">
                      Visible
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleMoveSection(index, -1)}
                    disabled={isSubmitting || index === 0}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Move Up
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMoveSection(index, 1)}
                    disabled={
                      isSubmitting || index === formValues.sections.length - 1
                    }
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Move Down
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
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
          to="/admin/dashboard"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          Cancel
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
