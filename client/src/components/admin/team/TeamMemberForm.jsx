import { useState } from "react";
import { Link } from "react-router";

import {
  createTeamMemberPayload,
  createTeamMemberSlug,
  defaultTeamMemberFormValues,
} from "../../../utils/teamMemberForm";

const inputClasses =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const textareaClasses =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100";

function validateTeamMemberForm(formValues) {
  const errors = {};

  const name = String(formValues.name || "").trim();

  const professionalRole = String(formValues.professionalRole || "").trim();

  const shortIntroduction = String(formValues.shortIntroduction || "").trim();

  const finalSlug =
    createTeamMemberSlug(formValues.slug) || createTeamMemberSlug(name);

  if (name.length < 2) {
    errors.name = "Team member name must contain at least 2 characters.";
  }

  if (finalSlug.length < 2) {
    errors.slug = "Team member slug must contain at least 2 characters.";
  }

  if (professionalRole.length < 2) {
    errors.professionalRole =
      "Professional role must contain at least 2 characters.";
  }

  if (shortIntroduction.length < 10) {
    errors.shortIntroduction =
      "Short introduction must contain at least 10 characters.";
  }

  const numericOrder = Number(formValues.order);

  if (!Number.isFinite(numericOrder) || numericOrder < 0) {
    errors.order = "Display order must be a non-negative number.";
  }

  return errors;
}

function TeamMemberFieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm font-medium text-red-600">{message}</p>;
}

function TeamMemberForm({
  initialValues = defaultTeamMemberFormValues,
  onSubmit,
  projectOptions = [],
  companyOptions = [],
  serviceOptions = [],
  submitLabel = "Save Team Member",
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
        updatedValues.slug = createTeamMemberSlug(value);
      }

      return updatedValues;
    });

    if (name === "slug") {
      setIsSlugManuallyEdited(Boolean(value.trim()));
    }

    clearFieldErrors(name);

    const socialFieldMap = {
      githubUrl: "socialLinks.github",
      linkedinUrl: "socialLinks.linkedin",
      facebookUrl: "socialLinks.facebook",
      instagramUrl: "socialLinks.instagram",
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

  function handleRelationshipChange(event) {
    const { name, options } = event.target;

    const selectedValues = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => option.value);

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: selectedValues,
    }));

    clearFieldErrors(name);
    setSubmitError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateTeamMemberForm(formValues);

    setLocalErrors(validationErrors);
    setServerErrors({});
    setSubmitError("");

    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0];

      document.querySelector(`[name="${firstErrorField}"]`)?.focus();

      return;
    }

    try {
      setIsSubmitting(true);

      const teamMemberPayload = createTeamMemberPayload(formValues);

      await onSubmit(teamMemberPayload);
    } catch (error) {
      const fieldErrors =
        error?.fieldErrors && typeof error.fieldErrors === "object"
          ? error.fieldErrors
          : {};

      setServerErrors(fieldErrors);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Team member could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {submitError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700"
        >
          {submitError}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
            Identity
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Basic Team Member Information
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Add the member name, professional role, Team position and public
            introduction.
          </p>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="team-member-name"
              className="text-sm font-semibold text-slate-700"
            >
              Full Name <span className="text-red-600">*</span>
            </label>

            <input
              id="team-member-name"
              name="name"
              type="text"
              value={formValues.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={150}
              autoComplete="name"
              placeholder="Rakesh Pandit"
              aria-invalid={Boolean(getFieldError("name"))}
              className={inputClasses}
            />

            <TeamMemberFieldError message={getFieldError("name")} />
          </div>

          <div>
            <label
              htmlFor="team-member-slug"
              className="text-sm font-semibold text-slate-700"
            >
              URL Slug <span className="text-red-600">*</span>
            </label>

            <input
              id="team-member-slug"
              name="slug"
              type="text"
              value={formValues.slug}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={180}
              placeholder="rakesh-pandit"
              aria-invalid={Boolean(getFieldError("slug"))}
              className={inputClasses}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Automatically generated from the name until manually edited.
            </p>

            <TeamMemberFieldError message={getFieldError("slug")} />
          </div>

          <div>
            <label
              htmlFor="team-member-professional-role"
              className="text-sm font-semibold text-slate-700"
            >
              Professional Role <span className="text-red-600">*</span>
            </label>

            <input
              id="team-member-professional-role"
              name="professionalRole"
              type="text"
              value={formValues.professionalRole}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={150}
              placeholder="MERN Stack Developer"
              aria-invalid={Boolean(getFieldError("professionalRole"))}
              className={inputClasses}
            />

            <TeamMemberFieldError message={getFieldError("professionalRole")} />
          </div>

          <div>
            <label
              htmlFor="team-member-position"
              className="text-sm font-semibold text-slate-700"
            >
              Team Position
            </label>

            <input
              id="team-member-position"
              name="teamPosition"
              type="text"
              value={formValues.teamPosition}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={150}
              placeholder="Lead Developer"
              aria-invalid={Boolean(getFieldError("teamPosition"))}
              className={inputClasses}
            />

            <TeamMemberFieldError message={getFieldError("teamPosition")} />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="team-member-short-introduction"
              className="text-sm font-semibold text-slate-700"
            >
              Short Introduction <span className="text-red-600">*</span>
            </label>

            <textarea
              id="team-member-short-introduction"
              name="shortIntroduction"
              value={formValues.shortIntroduction}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={400}
              rows={4}
              placeholder="Write a concise introduction for Team cards and listing pages."
              aria-invalid={Boolean(getFieldError("shortIntroduction"))}
              className={textareaClasses}
            />

            <div className="mt-2 flex justify-between gap-4 text-xs text-slate-500">
              <span>Minimum 10 characters</span>

              <span>
                {String(formValues.shortIntroduction || "").length}/400
              </span>
            </div>

            <TeamMemberFieldError
              message={getFieldError("shortIntroduction")}
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="team-member-biography"
              className="text-sm font-semibold text-slate-700"
            >
              Full Biography
            </label>

            <textarea
              id="team-member-biography"
              name="biography"
              value={formValues.biography}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={10000}
              rows={10}
              placeholder="Add experience, responsibilities, expertise and professional background."
              aria-invalid={Boolean(getFieldError("biography"))}
              className={textareaClasses}
            />

            <div className="mt-2 text-right text-xs text-slate-500">
              {String(formValues.biography || "").length}/10000
            </div>

            <TeamMemberFieldError message={getFieldError("biography")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
            Profile Media
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Profile and Cover Images
          </h2>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="team-member-profile-image-url"
              className="text-sm font-semibold text-slate-700"
            >
              Profile Image URL
            </label>

            <input
              id="team-member-profile-image-url"
              name="profileImageUrl"
              type="url"
              value={formValues.profileImageUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://example.com/profile.jpg"
              aria-invalid={Boolean(getFieldError("profileImageUrl"))}
              className={inputClasses}
            />

            <TeamMemberFieldError message={getFieldError("profileImageUrl")} />
          </div>

          <div>
            <label
              htmlFor="team-member-profile-image-alt"
              className="text-sm font-semibold text-slate-700"
            >
              Profile Image Alt Text
            </label>

            <input
              id="team-member-profile-image-alt"
              name="profileImageAlt"
              type="text"
              value={formValues.profileImageAlt}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={200}
              placeholder="Rakesh Pandit profile photo"
              aria-invalid={Boolean(getFieldError("profileImageAlt"))}
              className={inputClasses}
            />

            <TeamMemberFieldError message={getFieldError("profileImageAlt")} />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="team-member-cover-image-url"
              className="text-sm font-semibold text-slate-700"
            >
              Cover Image URL
            </label>

            <input
              id="team-member-cover-image-url"
              name="coverImageUrl"
              type="url"
              value={formValues.coverImageUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://example.com/team-cover.jpg"
              aria-invalid={Boolean(getFieldError("coverImageUrl"))}
              className={inputClasses}
            />

            <TeamMemberFieldError message={getFieldError("coverImageUrl")} />
          </div>

          {formValues.profileImageUrl && (
            <div className="md:col-span-2">
              <p className="text-sm font-semibold text-slate-700">
                Profile Preview
              </p>

              <div className="mt-3 flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                <div className="size-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
                  <img
                    src={formValues.profileImageUrl}
                    alt={
                      formValues.profileImageAlt ||
                      `${formValues.name || "Team member"} preview`
                    }
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-950">
                    {formValues.name || "Team Member"}
                  </p>

                  <p className="mt-1 truncate text-sm text-brand-600">
                    {formValues.professionalRole || "Professional role"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
            Expertise
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Skills and Development Tools
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter one skill or tool per line. Comma-separated values are also
            supported.
          </p>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="team-member-skills"
              className="text-sm font-semibold text-slate-700"
            >
              Main Skills
            </label>

            <textarea
              id="team-member-skills"
              name="skills"
              value={formValues.skills}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={8}
              placeholder={`JavaScript
React
Node.js
MongoDB`}
              aria-invalid={Boolean(getFieldError("skills"))}
              className={textareaClasses}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              These skills can appear on Team cards and member detail pages.
            </p>

            <TeamMemberFieldError message={getFieldError("skills")} />
          </div>

          <div>
            <label
              htmlFor="team-member-tools"
              className="text-sm font-semibold text-slate-700"
            >
              Tools and Technologies
            </label>

            <textarea
              id="team-member-tools"
              name="tools"
              value={formValues.tools}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={8}
              placeholder={`VS Code
Git
GitHub
Postman
Figma`}
              aria-invalid={Boolean(getFieldError("tools"))}
              className={textareaClasses}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Add software, frameworks, platforms and professional tools.
            </p>

            <TeamMemberFieldError message={getFieldError("tools")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
            Contact Information
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Contact and Portfolio Links
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Add only the contact details that may be used for this Team member.
          </p>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="team-member-email"
              className="text-sm font-semibold text-slate-700"
            >
              Email Address
            </label>

            <input
              id="team-member-email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={254}
              autoComplete="email"
              placeholder="member@example.com"
              aria-invalid={Boolean(getFieldError("email"))}
              className={inputClasses}
            />

            <TeamMemberFieldError message={getFieldError("email")} />
          </div>

          <div>
            <label
              htmlFor="team-member-phone"
              className="text-sm font-semibold text-slate-700"
            >
              Phone Number
            </label>

            <input
              id="team-member-phone"
              name="phone"
              type="tel"
              value={formValues.phone}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={50}
              autoComplete="tel"
              placeholder="+977 98XXXXXXXX"
              aria-invalid={Boolean(getFieldError("phone"))}
              className={inputClasses}
            />

            <TeamMemberFieldError message={getFieldError("phone")} />
          </div>

          <div>
            <label
              htmlFor="team-member-website-url"
              className="text-sm font-semibold text-slate-700"
            >
              Personal Website URL
            </label>

            <input
              id="team-member-website-url"
              name="websiteUrl"
              type="url"
              value={formValues.websiteUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://example.com"
              aria-invalid={Boolean(getFieldError("websiteUrl"))}
              className={inputClasses}
            />

            <TeamMemberFieldError message={getFieldError("websiteUrl")} />
          </div>

          <div>
            <label
              htmlFor="team-member-portfolio-url"
              className="text-sm font-semibold text-slate-700"
            >
              Portfolio URL
            </label>

            <input
              id="team-member-portfolio-url"
              name="portfolioUrl"
              type="url"
              value={formValues.portfolioUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://portfolio.example.com"
              aria-invalid={Boolean(getFieldError("portfolioUrl"))}
              className={inputClasses}
            />

            <TeamMemberFieldError message={getFieldError("portfolioUrl")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
            Social Profiles
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Professional and Social Links
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use complete profile URLs beginning with https://.
          </p>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="team-member-github-url"
              className="text-sm font-semibold text-slate-700"
            >
              GitHub URL
            </label>

            <input
              id="team-member-github-url"
              name="githubUrl"
              type="url"
              value={formValues.githubUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://github.com/username"
              aria-invalid={Boolean(
                getFieldError("githubUrl", "socialLinks.github"),
              )}
              className={inputClasses}
            />

            <TeamMemberFieldError
              message={getFieldError("githubUrl", "socialLinks.github")}
            />
          </div>

          <div>
            <label
              htmlFor="team-member-linkedin-url"
              className="text-sm font-semibold text-slate-700"
            >
              LinkedIn URL
            </label>

            <input
              id="team-member-linkedin-url"
              name="linkedinUrl"
              type="url"
              value={formValues.linkedinUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://linkedin.com/in/username"
              aria-invalid={Boolean(
                getFieldError("linkedinUrl", "socialLinks.linkedin"),
              )}
              className={inputClasses}
            />

            <TeamMemberFieldError
              message={getFieldError("linkedinUrl", "socialLinks.linkedin")}
            />
          </div>

          <div>
            <label
              htmlFor="team-member-facebook-url"
              className="text-sm font-semibold text-slate-700"
            >
              Facebook URL
            </label>

            <input
              id="team-member-facebook-url"
              name="facebookUrl"
              type="url"
              value={formValues.facebookUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://facebook.com/username"
              aria-invalid={Boolean(
                getFieldError("facebookUrl", "socialLinks.facebook"),
              )}
              className={inputClasses}
            />

            <TeamMemberFieldError
              message={getFieldError("facebookUrl", "socialLinks.facebook")}
            />
          </div>

          <div>
            <label
              htmlFor="team-member-instagram-url"
              className="text-sm font-semibold text-slate-700"
            >
              Instagram URL
            </label>

            <input
              id="team-member-instagram-url"
              name="instagramUrl"
              type="url"
              value={formValues.instagramUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://instagram.com/username"
              aria-invalid={Boolean(
                getFieldError("instagramUrl", "socialLinks.instagram"),
              )}
              className={inputClasses}
            />

            <TeamMemberFieldError
              message={getFieldError("instagramUrl", "socialLinks.instagram")}
            />
          </div>

          <div>
            <label
              htmlFor="team-member-youtube-url"
              className="text-sm font-semibold text-slate-700"
            >
              YouTube URL
            </label>

            <input
              id="team-member-youtube-url"
              name="youtubeUrl"
              type="url"
              value={formValues.youtubeUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://youtube.com/@username"
              aria-invalid={Boolean(
                getFieldError("youtubeUrl", "socialLinks.youtube"),
              )}
              className={inputClasses}
            />

            <TeamMemberFieldError
              message={getFieldError("youtubeUrl", "socialLinks.youtube")}
            />
          </div>

          <div>
            <label
              htmlFor="team-member-x-url"
              className="text-sm font-semibold text-slate-700"
            >
              X Profile URL
            </label>

            <input
              id="team-member-x-url"
              name="xUrl"
              type="url"
              value={formValues.xUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://x.com/username"
              aria-invalid={Boolean(getFieldError("xUrl", "socialLinks.x"))}
              className={inputClasses}
            />

            <TeamMemberFieldError
              message={getFieldError("xUrl", "socialLinks.x")}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
            Portfolio Relationships
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Related Projects, Companies and Services
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Connect this Team member with the portfolio content they contribute
            to. Hold Ctrl on Windows to select multiple items.
          </p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-3">
          <div>
            <label
              htmlFor="team-member-related-projects"
              className="text-sm font-semibold text-slate-700"
            >
              Related Projects
            </label>

            <select
              id="team-member-related-projects"
              name="relatedProjects"
              multiple
              size={7}
              value={formValues.relatedProjects}
              onChange={handleRelationshipChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("relatedProjects"))}
              className={`${inputClasses} py-3`}
            >
              {projectOptions.map((project) => {
                const projectId = project?._id || project?.id;

                if (!projectId) {
                  return null;
                }

                return (
                  <option key={projectId} value={projectId}>
                    {project.title || project.name || project.slug || projectId}
                  </option>
                );
              })}
            </select>

            {projectOptions.length === 0 && (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                No project options are currently available.
              </p>
            )}

            <TeamMemberFieldError message={getFieldError("relatedProjects")} />
          </div>

          <div>
            <label
              htmlFor="team-member-related-companies"
              className="text-sm font-semibold text-slate-700"
            >
              Related Companies
            </label>

            <select
              id="team-member-related-companies"
              name="relatedCompanies"
              multiple
              size={7}
              value={formValues.relatedCompanies}
              onChange={handleRelationshipChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("relatedCompanies"))}
              className={`${inputClasses} py-3`}
            >
              {companyOptions.map((company) => {
                const companyId = company?._id || company?.id;

                if (!companyId) {
                  return null;
                }

                return (
                  <option key={companyId} value={companyId}>
                    {company.name || company.slug || companyId}
                  </option>
                );
              })}
            </select>

            {companyOptions.length === 0 && (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                No company options are currently available.
              </p>
            )}

            <TeamMemberFieldError message={getFieldError("relatedCompanies")} />
          </div>

          <div>
            <label
              htmlFor="team-member-related-services"
              className="text-sm font-semibold text-slate-700"
            >
              Related Services
            </label>

            <select
              id="team-member-related-services"
              name="relatedServices"
              multiple
              size={7}
              value={formValues.relatedServices}
              onChange={handleRelationshipChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("relatedServices"))}
              className={`${inputClasses} py-3`}
            >
              {serviceOptions.map((service) => {
                const serviceId = service?._id || service?.id;

                if (!serviceId) {
                  return null;
                }

                return (
                  <option key={serviceId} value={serviceId}>
                    {service.title || service.name || service.slug || serviceId}
                  </option>
                );
              })}
            </select>

            {serviceOptions.length === 0 && (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                No service options are currently available.
              </p>
            )}

            <TeamMemberFieldError message={getFieldError("relatedServices")} />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
            Search Engine Optimisation
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Team Member SEO
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Configure metadata for the public Team member detail page.
          </p>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="team-member-seo-title"
              className="text-sm font-semibold text-slate-700"
            >
              SEO Title
            </label>

            <input
              id="team-member-seo-title"
              name="seoTitle"
              type="text"
              value={formValues.seoTitle}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={70}
              placeholder="Member Name — Professional Role | RakeshNexify"
              aria-invalid={Boolean(getFieldError("seoTitle", "seo.title"))}
              className={inputClasses}
            />

            <div className="mt-2 flex justify-between gap-4 text-xs text-slate-500">
              <span>Recommended maximum: 60–70 characters</span>

              <span>{String(formValues.seoTitle || "").length}/70</span>
            </div>

            <TeamMemberFieldError
              message={getFieldError("seoTitle", "seo.title")}
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="team-member-seo-description"
              className="text-sm font-semibold text-slate-700"
            >
              SEO Description
            </label>

            <textarea
              id="team-member-seo-description"
              name="seoDescription"
              value={formValues.seoDescription}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={180}
              rows={4}
              placeholder="Write a concise description of this Team member and their expertise."
              aria-invalid={Boolean(
                getFieldError("seoDescription", "seo.description"),
              )}
              className={textareaClasses}
            />

            <div className="mt-2 flex justify-between gap-4 text-xs text-slate-500">
              <span>Recommended maximum: 150–180 characters</span>

              <span>{String(formValues.seoDescription || "").length}/180</span>
            </div>

            <TeamMemberFieldError
              message={getFieldError("seoDescription", "seo.description")}
            />
          </div>

          <div>
            <label
              htmlFor="team-member-seo-keywords"
              className="text-sm font-semibold text-slate-700"
            >
              SEO Keywords
            </label>

            <textarea
              id="team-member-seo-keywords"
              name="seoKeywords"
              value={formValues.seoKeywords}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={6}
              placeholder={`mern developer
react developer
node.js developer`}
              aria-invalid={Boolean(
                getFieldError("seoKeywords", "seo.keywords"),
              )}
              className={textareaClasses}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Enter one keyword per line or separate keywords with commas.
            </p>

            <TeamMemberFieldError
              message={getFieldError("seoKeywords", "seo.keywords")}
            />
          </div>

          <div>
            <label
              htmlFor="team-member-seo-og-image"
              className="text-sm font-semibold text-slate-700"
            >
              Social Sharing Image URL
            </label>

            <input
              id="team-member-seo-og-image"
              name="seoOgImageUrl"
              type="url"
              value={formValues.seoOgImageUrl}
              onChange={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
              placeholder="https://example.com/member-og-image.jpg"
              aria-invalid={Boolean(
                getFieldError("seoOgImageUrl", "seo.ogImageUrl"),
              )}
              className={inputClasses}
            />

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Used when the member detail page is shared on social platforms.
            </p>

            <TeamMemberFieldError
              message={getFieldError("seoOgImageUrl", "seo.ogImageUrl")}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
            Publishing Controls
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Status, Availability and Visibility
          </h2>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="team-member-status"
              className="text-sm font-semibold text-slate-700"
            >
              Member Status
            </label>

            <select
              id="team-member-status"
              name="status"
              value={formValues.status}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={inputClasses}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="former">Former Member</option>
              <option value="archived">Archived</option>
            </select>

            <TeamMemberFieldError message={getFieldError("status")} />
          </div>

          <div>
            <label
              htmlFor="team-member-availability-status"
              className="text-sm font-semibold text-slate-700"
            >
              Availability Status
            </label>

            <select
              id="team-member-availability-status"
              name="availabilityStatus"
              value={formValues.availabilityStatus}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={inputClasses}
            >
              <option value="available">Available</option>
              <option value="limited">Limited Availability</option>
              <option value="unavailable">Unavailable</option>
              <option value="on-leave">On Leave</option>
            </select>

            <TeamMemberFieldError
              message={getFieldError("availabilityStatus")}
            />
          </div>

          <div>
            <label
              htmlFor="team-member-order"
              className="text-sm font-semibold text-slate-700"
            >
              Display Order
            </label>

            <input
              id="team-member-order"
              name="order"
              type="number"
              min="0"
              step="1"
              value={formValues.order}
              onChange={handleInputChange}
              disabled={isSubmitting}
              aria-invalid={Boolean(getFieldError("order"))}
              className={inputClasses}
            />

            <TeamMemberFieldError message={getFieldError("order")} />
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                name="isVisible"
                type="checkbox"
                checked={formValues.isVisible}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="mt-1 size-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />

              <span>
                <span className="block font-semibold text-slate-800">
                  Publicly Visible
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Display this member on public Team pages and sections.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                name="isFeatured"
                type="checkbox"
                checked={formValues.isFeatured}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="mt-1 size-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />

              <span>
                <span className="block font-semibold text-slate-800">
                  Featured Team Member
                </span>

                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Prioritise this profile in featured Team displays.
                </span>
              </span>
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        <Link
          to="/admin/team"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-7 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving Team Member..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default TeamMemberForm;
