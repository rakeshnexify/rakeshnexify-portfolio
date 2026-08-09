import { useState } from "react";
import { Link } from "react-router";

import MediaField from "../media/MediaField";

import {
  createCompanyPayload,
  createCompanySlug,
  createEmptyCompanyStatistic,
  defaultCompanyFormValues,
} from "../../../utils/companyForm";

const inputClasses =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100";

const textareaClasses =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100";

function validateCompanyForm(formValues) {
  const errors = {};

  if (String(formValues.name || "").trim().length < 2) {
    errors.name = "Company name must contain at least 2 characters.";
  }

  const finalSlug =
    createCompanySlug(formValues.slug) || createCompanySlug(formValues.name);

  if (finalSlug.length < 2) {
    errors.slug = "Company slug must contain at least 2 characters.";
  }

  if (String(formValues.shortDescription || "").trim().length < 10) {
    errors.shortDescription =
      "Short description must contain at least 10 characters.";
  }

  const numericOrder = Number(formValues.order);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    errors.order = "Display order must be a non-negative number.";
  }

  const foundedYear = String(formValues.foundedYear || "").trim();

  if (foundedYear) {
    const numericFoundedYear = Number(foundedYear);

    if (
      !Number.isInteger(numericFoundedYear) ||
      numericFoundedYear < 1800 ||
      numericFoundedYear > 2200
    ) {
      errors.foundedYear = "Founded year must be between 1800 and 2200.";
    }
  }

  const statistics = Array.isArray(formValues.statistics)
    ? formValues.statistics
    : [];

  statistics.forEach((statistic, index) => {
    const label = String(statistic?.label || "").trim();

    const value = String(statistic?.value || "").trim();

    const hasStatisticData = Boolean(label || value);

    if (hasStatisticData && !label) {
      errors[`statistics.${index}.label`] = "Statistic label is required.";
    }

    if (hasStatisticData && !value) {
      errors[`statistics.${index}.value`] = "Statistic value is required.";
    }
  });

  return errors;
}

function CompanyFieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm font-medium text-red-600">{message}</p>;
}

function CompanyForm({
  initialValues = defaultCompanyFormValues,

  onSubmit,

  submitLabel = "Save Company",

  accessToken = "",

  onMediaUnauthorized,
}) {
  const [formValues, setFormValues] = useState(initialValues);

  const [localErrors, setLocalErrors] = useState({});

  const [serverErrors, setServerErrors] = useState({});

  const [submitError, setSubmitError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(
    Boolean(initialValues.slug),
  );

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

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target;

    const nextValue = type === "checkbox" ? checked : value;

    setFormValues((currentValues) => {
      const updatedValues = {
        ...currentValues,
        [name]: nextValue,
      };

      if (name === "name" && !isSlugManuallyEdited) {
        updatedValues.slug = createCompanySlug(value);
      }

      return updatedValues;
    });

    if (name === "slug") {
      setIsSlugManuallyEdited(Boolean(value.trim()));
    }

    clearFieldErrors(name);

    const contactFieldMap = {
      contactEmail: "contact.email",

      contactPhone: "contact.phone",

      contactAddress: "contact.address",

      contactCity: "contact.city",

      contactCountry: "contact.country",
    };

    if (contactFieldMap[name]) {
      clearFieldErrors("contact", contactFieldMap[name]);
    }

    const socialFieldMap = {
      facebookUrl: "socialLinks.facebook",

      instagramUrl: "socialLinks.instagram",

      linkedinUrl: "socialLinks.linkedin",

      youtubeUrl: "socialLinks.youtube",

      xUrl: "socialLinks.x",
    };

    if (socialFieldMap[name]) {
      clearFieldErrors("socialLinks", socialFieldMap[name]);
    }

    const seoFieldMap = {
      seoTitle: "seo.title",

      seoDescription: "seo.description",

      seoKeywords: "seo.keywords",

      seoOgImageUrl: "seo.ogImageUrl",
    };

    if (seoFieldMap[name]) {
      clearFieldErrors("seo", seoFieldMap[name]);
    }

    setSubmitError("");
  }

  function handleSlugBlur() {
    setFormValues((currentValues) => ({
      ...currentValues,

      slug:
        createCompanySlug(currentValues.slug) ||
        createCompanySlug(currentValues.name),
    }));
  }

  function handleStatisticChange(index, fieldName, value) {
    setFormValues((currentValues) => ({
      ...currentValues,

      statistics: currentValues.statistics.map((statistic, statisticIndex) =>
        statisticIndex === index
          ? {
              ...statistic,
              [fieldName]: value,
            }
          : statistic,
      ),
    }));

    clearFieldErrors("statistics", `statistics.${index}.${fieldName}`);

    setSubmitError("");
  }

  function handleAddStatistic() {
    setFormValues((currentValues) => ({
      ...currentValues,

      statistics: [...currentValues.statistics, createEmptyCompanyStatistic()],
    }));
  }

  function handleRemoveStatistic(index) {
    setFormValues((currentValues) => ({
      ...currentValues,

      statistics: currentValues.statistics.filter(
        (_statistic, statisticIndex) => statisticIndex !== index,
      ),
    }));

    setLocalErrors({});
    setServerErrors({});
    setSubmitError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateCompanyForm(formValues);

    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);

      setServerErrors({});

      setSubmitError("Please correct the highlighted company fields.");

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

      await onSubmit(createCompanyPayload(formValues));
    } catch (error) {
      setServerErrors(error?.fieldErrors || {});

      setSubmitError(
        error instanceof Error ? error.message : "Company could not be saved.",
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

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Basic Information</h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Add the company name, public URL and complete company description.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div>
            <label
              htmlFor="company-name"
              className="text-sm font-semibold text-slate-700"
            >
              Company name *
            </label>

            <input
              id="company-name"
              name="name"
              type="text"
              value={formValues.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="UniQuick Mart"
              className={inputClasses}
            />

            <CompanyFieldError message={getFieldError("name")} />
          </div>

          <div>
            <label
              htmlFor="company-slug"
              className="text-sm font-semibold text-slate-700"
            >
              URL slug *
            </label>

            <input
              id="company-slug"
              name="slug"
              type="text"
              value={formValues.slug}
              onChange={handleInputChange}
              onBlur={handleSlugBlur}
              disabled={isSubmitting}
              placeholder="uniquick-mart"
              className={inputClasses}
            />

            <CompanyFieldError message={getFieldError("slug")} />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="company-legal-name"
              className="text-sm font-semibold text-slate-700"
            >
              Legal company name
            </label>

            <input
              id="company-legal-name"
              name="legalName"
              type="text"
              value={formValues.legalName}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="UniQuick Mart Pvt. Ltd."
              className={inputClasses}
            />

            <CompanyFieldError message={getFieldError("legalName")} />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="company-tagline"
              className="text-sm font-semibold text-slate-700"
            >
              Company tagline
            </label>

            <input
              id="company-tagline"
              name="tagline"
              type="text"
              value={formValues.tagline}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Simple and convenient online shopping."
              className={inputClasses}
            />

            <CompanyFieldError message={getFieldError("tagline")} />
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="company-short-description"
            className="text-sm font-semibold text-slate-700"
          >
            Short description *
          </label>

          <textarea
            id="company-short-description"
            name="shortDescription"
            value={formValues.shortDescription}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={3}
            maxLength={350}
            placeholder="Write a short description for company cards."
            className={textareaClasses}
          />

          <div className="mt-2 flex items-start justify-between gap-4">
            <CompanyFieldError message={getFieldError("shortDescription")} />

            <span className="ml-auto text-xs text-slate-400">
              {formValues.shortDescription.length}
              /350
            </span>
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="company-description"
            className="text-sm font-semibold text-slate-700"
          >
            Full description
          </label>

          <textarea
            id="company-description"
            name="description"
            value={formValues.description}
            onChange={handleInputChange}
            disabled={isSubmitting}
            rows={8}
            maxLength={10000}
            placeholder="Explain the company, its purpose, business model and long-term goals."
            className={textareaClasses}
          />

          <CompanyFieldError message={getFieldError("description")} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Company Details</h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="company-industry"
              className="text-sm font-semibold text-slate-700"
            >
              Industry
            </label>

            <input
              id="company-industry"
              name="industry"
              type="text"
              value={formValues.industry}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="E-commerce and Online Retail"
              className={inputClasses}
            />

            <CompanyFieldError message={getFieldError("industry")} />
          </div>

          <div>
            <label
              htmlFor="company-relationship"
              className="text-sm font-semibold text-slate-700"
            >
              Relationship
            </label>

            <select
              id="company-relationship"
              name="relationship"
              value={formValues.relationship}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={inputClasses}
            >
              <option value="owned">Owned Company</option>

              <option value="managed">Managed Company</option>

              <option value="partner">Business Partner</option>

              <option value="client">Client Company</option>

              <option value="other">Associated Company</option>
            </select>

            <CompanyFieldError message={getFieldError("relationship")} />
          </div>

          <div>
            <label
              htmlFor="company-status"
              className="text-sm font-semibold text-slate-700"
            >
              Company status
            </label>

            <select
              id="company-status"
              name="status"
              value={formValues.status}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={inputClasses}
            >
              <option value="planned">Planned</option>

              <option value="active">Active</option>

              <option value="inactive">Inactive</option>

              <option value="archived">Archived</option>
            </select>

            <CompanyFieldError
              message={getFieldError("status", "company status")}
            />
          </div>

          <div>
            <label
              htmlFor="company-founded-year"
              className="text-sm font-semibold text-slate-700"
            >
              Founded year
            </label>

            <input
              id="company-founded-year"
              name="foundedYear"
              type="number"
              min="1800"
              max="2200"
              step="1"
              value={formValues.foundedYear}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="2026"
              className={inputClasses}
            />

            <CompanyFieldError message={getFieldError("foundedYear")} />
          </div>

          <div>
            <label
              htmlFor="company-role"
              className="text-sm font-semibold text-slate-700"
            >
              Your role
            </label>

            <input
              id="company-role"
              name="role"
              type="text"
              value={formValues.role}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Founder and Website Developer"
              className={inputClasses}
            />

            <CompanyFieldError message={getFieldError("role")} />
          </div>

          <div>
            <label
              htmlFor="company-order"
              className="text-sm font-semibold text-slate-700"
            >
              Display order
            </label>

            <input
              id="company-order"
              name="order"
              type="number"
              min="0"
              step="1"
              value={formValues.order}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={inputClasses}
            />

            <CompanyFieldError message={getFieldError("order")} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <input
              name="isVisible"
              type="checkbox"
              checked={formValues.isVisible}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-1 size-4 accent-brand-600"
            />

            <span>
              <span className="block text-sm font-bold text-slate-900">
                Visible on portfolio
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Visitors can view the company card and company profile page.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <input
              name="isFeatured"
              type="checkbox"
              checked={formValues.isFeatured}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="mt-1 size-4 accent-brand-600"
            />

            <span>
              <span className="block text-sm font-bold text-slate-900">
                Featured company
              </span>

              <span className="mt-1 block text-sm leading-6 text-slate-500">
                Display this company before standard companies.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Website and Media</h2>

        <div className="mt-6 grid gap-5">
          <div>
            <label
              htmlFor="company-website"
              className="text-sm font-semibold text-slate-700"
            >
              Official website URL
            </label>

            <input
              id="company-website"
              name="websiteUrl"
              type="url"
              value={formValues.websiteUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://uniquickmart.com"
              className={inputClasses}
            />

            <CompanyFieldError message={getFieldError("websiteUrl")} />
          </div>

          <MediaField
            id="company-logo"
            name="logoUrl"
            label="Company logo URL"
            value={formValues.logoUrl}
            onChange={handleInputChange}
            accessToken={accessToken}
            allowedTypes={["image", "svg"]}
            pickerTitle="Choose Company Logo"
            placeholder="https://..."
            helpText="Paste an external logo URL or choose an image/SVG from the Media Library."
            error={getFieldError("logoUrl")}
            disabled={isSubmitting}
            onUnauthorized={onMediaUnauthorized}
          />

          <MediaField
            id="company-cover-image"
            name="coverImageUrl"
            label="Cover image URL"
            value={formValues.coverImageUrl}
            onChange={handleInputChange}
            accessToken={accessToken}
            allowedTypes={["image", "svg"]}
            pickerTitle="Choose Company Cover Image"
            placeholder="https://..."
            helpText="Paste an external cover image URL or choose an image/SVG from the Media Library."
            error={getFieldError("coverImageUrl")}
            disabled={isSubmitting}
            onUnauthorized={onMediaUnauthorized}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Business Content</h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter one item per line or separate multiple items using commas.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div>
            <label
              htmlFor="company-business-areas"
              className="text-sm font-semibold text-slate-700"
            >
              Business areas
            </label>

            <textarea
              id="company-business-areas"
              name="businessAreas"
              value={formValues.businessAreas}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={7}
              placeholder={"E-commerce\nOnline Retail\nDigital Commerce"}
              className={textareaClasses}
            />

            <CompanyFieldError message={getFieldError("businessAreas")} />
          </div>

          <div>
            <label
              htmlFor="company-services"
              className="text-sm font-semibold text-slate-700"
            >
              Products and services
            </label>

            <textarea
              id="company-services"
              name="services"
              value={formValues.services}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={7}
              placeholder={
                "Online product catalogue\nProduct category management\nCustomer ordering"
              }
              className={textareaClasses}
            />

            <CompanyFieldError message={getFieldError("services")} />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="company-highlights"
              className="text-sm font-semibold text-slate-700"
            >
              Company highlights
            </label>

            <textarea
              id="company-highlights"
              name="highlights"
              value={formValues.highlights}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={6}
              placeholder={
                "Registered private company\nResponsive e-commerce website\nDynamic product management"
              }
              className={textareaClasses}
            />

            <CompanyFieldError message={getFieldError("highlights")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Company Statistics
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add verified business numbers or important company achievements.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddStatistic}
            disabled={isSubmitting}
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            + Add Statistic
          </button>
        </div>

        {formValues.statistics.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No company statistics added.
          </div>
        )}

        <div className="mt-5 space-y-4">
          {formValues.statistics.map((statistic, index) => (
            <div
              key={`company-statistic-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-bold text-slate-900">
                  Statistic {index + 1}
                </h3>

                <button
                  type="button"
                  onClick={() => handleRemoveStatistic(index)}
                  disabled={isSubmitting}
                  className="text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Label
                  </label>

                  <input
                    type="text"
                    value={statistic.label}
                    onChange={(event) =>
                      handleStatisticChange(index, "label", event.target.value)
                    }
                    disabled={isSubmitting}
                    placeholder="Products"
                    className={inputClasses}
                  />

                  <CompanyFieldError
                    message={getFieldError(
                      `statistics.${index}.label`,
                      "statistics",
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Value
                  </label>

                  <input
                    type="text"
                    value={statistic.value}
                    onChange={(event) =>
                      handleStatisticChange(index, "value", event.target.value)
                    }
                    disabled={isSubmitting}
                    placeholder="100+"
                    className={inputClasses}
                  />

                  <CompanyFieldError
                    message={getFieldError(`statistics.${index}.value`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">
          Contact Information
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="company-contact-email"
              className="text-sm font-semibold text-slate-700"
            >
              Business email
            </label>

            <input
              id="company-contact-email"
              name="contactEmail"
              type="email"
              value={formValues.contactEmail}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="contact@example.com"
              className={inputClasses}
            />

            <CompanyFieldError
              message={getFieldError(
                "contact.email",
                "contactEmail",
                "contact",
              )}
            />
          </div>

          <div>
            <label
              htmlFor="company-contact-phone"
              className="text-sm font-semibold text-slate-700"
            >
              Business phone
            </label>

            <input
              id="company-contact-phone"
              name="contactPhone"
              type="text"
              value={formValues.contactPhone}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="+977..."
              className={inputClasses}
            />

            <CompanyFieldError
              message={getFieldError(
                "contact.phone",
                "contactPhone",
                "contact",
              )}
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="company-contact-address"
              className="text-sm font-semibold text-slate-700"
            >
              Business address
            </label>

            <input
              id="company-contact-address"
              name="contactAddress"
              type="text"
              value={formValues.contactAddress}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Street or business address"
              className={inputClasses}
            />

            <CompanyFieldError
              message={getFieldError(
                "contact.address",
                "contactAddress",
                "contact",
              )}
            />
          </div>

          <div>
            <label
              htmlFor="company-contact-city"
              className="text-sm font-semibold text-slate-700"
            >
              City
            </label>

            <input
              id="company-contact-city"
              name="contactCity"
              type="text"
              value={formValues.contactCity}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Kathmandu"
              className={inputClasses}
            />

            <CompanyFieldError
              message={getFieldError("contact.city", "contactCity", "contact")}
            />
          </div>

          <div>
            <label
              htmlFor="company-contact-country"
              className="text-sm font-semibold text-slate-700"
            >
              Country
            </label>

            <input
              id="company-contact-country"
              name="contactCountry"
              type="text"
              value={formValues.contactCountry}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Nepal"
              className={inputClasses}
            />

            <CompanyFieldError
              message={getFieldError(
                "contact.country",
                "contactCountry",
                "contact",
              )}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">Social Links</h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="company-facebook"
              className="text-sm font-semibold text-slate-700"
            >
              Facebook URL
            </label>

            <input
              id="company-facebook"
              name="facebookUrl"
              type="url"
              value={formValues.facebookUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://facebook.com/..."
              className={inputClasses}
            />

            <CompanyFieldError
              message={getFieldError(
                "socialLinks.facebook",
                "facebookUrl",
                "socialLinks",
              )}
            />
          </div>

          <div>
            <label
              htmlFor="company-instagram"
              className="text-sm font-semibold text-slate-700"
            >
              Instagram URL
            </label>

            <input
              id="company-instagram"
              name="instagramUrl"
              type="url"
              value={formValues.instagramUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://instagram.com/..."
              className={inputClasses}
            />

            <CompanyFieldError
              message={getFieldError(
                "socialLinks.instagram",
                "instagramUrl",
                "socialLinks",
              )}
            />
          </div>

          <div>
            <label
              htmlFor="company-linkedin"
              className="text-sm font-semibold text-slate-700"
            >
              LinkedIn URL
            </label>

            <input
              id="company-linkedin"
              name="linkedinUrl"
              type="url"
              value={formValues.linkedinUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://linkedin.com/company/..."
              className={inputClasses}
            />

            <CompanyFieldError
              message={getFieldError(
                "socialLinks.linkedin",
                "linkedinUrl",
                "socialLinks",
              )}
            />
          </div>

          <div>
            <label
              htmlFor="company-youtube"
              className="text-sm font-semibold text-slate-700"
            >
              YouTube URL
            </label>

            <input
              id="company-youtube"
              name="youtubeUrl"
              type="url"
              value={formValues.youtubeUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://youtube.com/@..."
              className={inputClasses}
            />

            <CompanyFieldError
              message={getFieldError(
                "socialLinks.youtube",
                "youtubeUrl",
                "socialLinks",
              )}
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="company-x"
              className="text-sm font-semibold text-slate-700"
            >
              X URL
            </label>

            <input
              id="company-x"
              name="xUrl"
              type="url"
              value={formValues.xUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="https://x.com/..."
              className={inputClasses}
            />

            <CompanyFieldError
              message={getFieldError("socialLinks.x", "xUrl", "socialLinks")}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">SEO Settings</h2>

        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="company-seo-title"
              className="text-sm font-semibold text-slate-700"
            >
              SEO title
            </label>

            <input
              id="company-seo-title"
              name="seoTitle"
              type="text"
              value={formValues.seoTitle}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={70}
              className={inputClasses}
            />

            <CompanyFieldError
              message={getFieldError("seo.title", "seoTitle", "seo")}
            />
          </div>

          <div>
            <label
              htmlFor="company-seo-description"
              className="text-sm font-semibold text-slate-700"
            >
              SEO description
            </label>

            <textarea
              id="company-seo-description"
              name="seoDescription"
              value={formValues.seoDescription}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={3}
              maxLength={180}
              className={textareaClasses}
            />

            <CompanyFieldError
              message={getFieldError(
                "seo.description",
                "seoDescription",
                "seo",
              )}
            />
          </div>

          <div>
            <label
              htmlFor="company-seo-keywords"
              className="text-sm font-semibold text-slate-700"
            >
              SEO keywords
            </label>

            <textarea
              id="company-seo-keywords"
              name="seoKeywords"
              value={formValues.seoKeywords}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={3}
              placeholder="company name, ecommerce company, online retail"
              className={textareaClasses}
            />

            <CompanyFieldError
              message={getFieldError("seo.keywords", "seoKeywords", "seo")}
            />
          </div>

          <MediaField
            id="company-seo-image"
            name="seoOgImageUrl"
            label="Social sharing image URL"
            value={formValues.seoOgImageUrl}
            onChange={handleInputChange}
            accessToken={accessToken}
            allowedTypes={["image", "svg"]}
            pickerTitle="Choose Company Social Image"
            placeholder="https://..."
            helpText="Paste an external social sharing image URL or choose an image/SVG from the Media Library."
            error={getFieldError("seo.ogImageUrl", "seoOgImageUrl", "seo")}
            disabled={isSubmitting}
            onUnauthorized={onMediaUnauthorized}
          />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/companies"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Saving company..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default CompanyForm;
