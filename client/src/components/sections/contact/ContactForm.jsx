import { useMemo, useState } from "react";

import useServices from "../../../hooks/useServices";
import { submitContactMessage } from "../../../services/contactMessageApi";

const initialStatus = {
  type: "",
  message: "",
};

function ContactForm() {
  const {
    services,
    isLoading: isServicesLoading,
    error: servicesError,
    refreshServices,
  } = useServices();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formStatus, setFormStatus] = useState(initialStatus);

  const [fieldErrors, setFieldErrors] = useState({});

  const serviceOptions = useMemo(
    () =>
      services
        .map((service, index) => {
          const slug = String(service.slug || service.id || "").trim();

          const title = String(service.title || "Service").trim();

          return {
            id: service._id || service.id || slug || `service-${index + 1}`,

            slug,
            title,
          };
        })
        .filter((service) => service.slug && service.title),
    [services],
  );

  function getFieldError(fieldName) {
    return fieldErrors[fieldName] || "";
  }

  function clearFieldError(fieldName) {
    setFieldErrors((currentErrors) => {
      if (!currentErrors[fieldName]) {
        return currentErrors;
      }

      const updatedErrors = {
        ...currentErrors,
      };

      delete updatedErrors[fieldName];

      return updatedErrors;
    });

    if (formStatus.type === "error") {
      setFormStatus(initialStatus);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting || isServicesLoading || serviceOptions.length === 0) {
      return;
    }

    const form = event.currentTarget;

    const formData = new FormData(form);

    const messageData = {
      name: formData.get("name")?.trim() || "",

      email: formData.get("email")?.trim() || "",

      phone: formData.get("phone")?.trim() || "",

      service: formData.get("service") || "",

      subject: formData.get("subject")?.trim() || "",

      message: formData.get("message")?.trim() || "",
    };

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setFormStatus(initialStatus);

      const response = await submitContactMessage(messageData);

      form.reset();

      setFormStatus({
        type: "success",

        message:
          response.message ||
          "Your project enquiry has been submitted successfully.",
      });
    } catch (error) {
      setFieldErrors(error.fieldErrors || {});

      setFormStatus({
        type: "error",

        message:
          error.message || "Your project enquiry could not be submitted.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasNoServices = !isServicesLoading && serviceOptions.length === 0;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="contact-name"
            className="text-sm font-semibold text-slate-800"
          >
            Full name
          </label>

          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your full name"
            onChange={() => clearFieldError("name")}
            aria-invalid={Boolean(getFieldError("name"))}
            aria-describedby={
              getFieldError("name") ? "contact-name-error" : undefined
            }
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
          />

          {getFieldError("name") && (
            <p id="contact-name-error" className="mt-2 text-sm text-red-600">
              {getFieldError("name")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="text-sm font-semibold text-slate-800"
          >
            Email address
          </label>

          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            onChange={() => clearFieldError("email")}
            aria-invalid={Boolean(getFieldError("email"))}
            aria-describedby={
              getFieldError("email") ? "contact-email-error" : undefined
            }
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
          />

          {getFieldError("email") && (
            <p id="contact-email-error" className="mt-2 text-sm text-red-600">
              {getFieldError("email")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-phone"
            className="text-sm font-semibold text-slate-800"
          >
            Phone or WhatsApp
          </label>

          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Optional contact number"
            onChange={() => clearFieldError("phone")}
            aria-invalid={Boolean(getFieldError("phone"))}
            aria-describedby={
              getFieldError("phone") ? "contact-phone-error" : undefined
            }
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
          />

          {getFieldError("phone") && (
            <p id="contact-phone-error" className="mt-2 text-sm text-red-600">
              {getFieldError("phone")}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-service"
            className="text-sm font-semibold text-slate-800"
          >
            Required service
          </label>

          <select
            id="contact-service"
            name="service"
            defaultValue=""
            required
            disabled={isServicesLoading || hasNoServices || isSubmitting}
            onChange={() => clearFieldError("service")}
            aria-invalid={Boolean(getFieldError("service"))}
            aria-describedby={
              getFieldError("service") ? "contact-service-error" : undefined
            }
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="" disabled>
              {isServicesLoading
                ? "Loading services..."
                : hasNoServices
                  ? "No services available"
                  : "Select a service"}
            </option>

            {serviceOptions.map((service) => (
              <option key={service.id} value={service.slug}>
                {service.title}
              </option>
            ))}
          </select>

          {getFieldError("service") && (
            <p id="contact-service-error" className="mt-2 text-sm text-red-600">
              {getFieldError("service")}
            </p>
          )}

          {servicesError && !getFieldError("service") && (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="text-sm leading-6 text-amber-700">
                Live services could not be refreshed. Saved options are being
                displayed.
              </p>

              <button
                type="button"
                onClick={refreshServices}
                disabled={isServicesLoading}
                className="text-sm font-semibold text-brand-600 transition hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Retry
              </button>
            </div>
          )}

          {hasNoServices && (
            <p className="mt-2 text-sm leading-6 text-red-600">
              No public services are currently available. Please try again
              later.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="contact-subject"
          className="text-sm font-semibold text-slate-800"
        >
          Project subject
        </label>

        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          placeholder="Example: E-commerce website development"
          onChange={() => clearFieldError("subject")}
          aria-invalid={Boolean(getFieldError("subject"))}
          aria-describedby={
            getFieldError("subject") ? "contact-subject-error" : undefined
          }
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
        />

        {getFieldError("subject") && (
          <p id="contact-subject-error" className="mt-2 text-sm text-red-600">
            {getFieldError("subject")}
          </p>
        )}
      </div>

      <div className="mt-5">
        <label
          htmlFor="contact-message"
          className="text-sm font-semibold text-slate-800"
        >
          Project details
        </label>

        <textarea
          id="contact-message"
          name="message"
          required
          rows="6"
          minLength={20}
          placeholder="Describe your project, required features, timeline and other important information."
          onChange={() => clearFieldError("message")}
          aria-invalid={Boolean(getFieldError("message"))}
          aria-describedby={
            getFieldError("message") ? "contact-message-error" : undefined
          }
          className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
        />

        {getFieldError("message") && (
          <p id="contact-message-error" className="mt-2 text-sm text-red-600">
            {getFieldError("message")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={
          isSubmitting || isServicesLoading || serviceOptions.length === 0
        }
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Sending Enquiry..."
          : isServicesLoading
            ? "Loading Services..."
            : "Send Project Enquiry"}
      </button>

      {formStatus.message && (
        <p
          role="status"
          aria-live="polite"
          className={`mt-4 rounded-xl border p-4 text-sm leading-6 ${
            formStatus.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {formStatus.message}
        </p>
      )}
    </form>
  );
}

export default ContactForm;
