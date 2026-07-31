import { useMemo, useRef, useState } from "react";

import useServices from "../../../hooks/useServices";
import { submitContactMessage } from "../../../services/contactMessageApi";

const initialStatus = {
  type: "",
  message: "",
};

const validationRules = {
  name: {
    minLength: 2,
    maxLength: 80,
  },

  email: {
    maxLength: 120,
  },

  phone: {
    maxLength: 30,
  },

  subject: {
    minLength: 3,
    maxLength: 150,
  },

  message: {
    minLength: 20,
    maxLength: 5000,
  },
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldOrder = ["name", "email", "phone", "service", "subject", "message"];

function cleanString(value) {
  return String(value || "").trim();
}

function validateMessageData(messageData, serviceOptions) {
  const errors = {};

  if (!messageData.name) {
    errors.name = "Full name is required.";
  } else if (messageData.name.length < validationRules.name.minLength) {
    errors.name = "Full name must contain at least 2 characters.";
  } else if (messageData.name.length > validationRules.name.maxLength) {
    errors.name = "Full name cannot exceed 80 characters.";
  }

  if (!messageData.email) {
    errors.email = "Email address is required.";
  } else if (messageData.email.length > validationRules.email.maxLength) {
    errors.email = "Email address cannot exceed 120 characters.";
  } else if (!emailPattern.test(messageData.email)) {
    errors.email = "Please provide a valid email address.";
  }

  if (messageData.phone.length > validationRules.phone.maxLength) {
    errors.phone = "Phone number cannot exceed 30 characters.";
  }

  if (!messageData.service) {
    errors.service = "Please select a service.";
  } else {
    const serviceIsAvailable = serviceOptions.some(
      (service) => service.slug === messageData.service,
    );

    if (!serviceIsAvailable) {
      errors.service =
        "The selected service is unavailable. Please choose another service.";
    }
  }

  if (!messageData.subject) {
    errors.subject = "Project subject is required.";
  } else if (messageData.subject.length < validationRules.subject.minLength) {
    errors.subject = "Project subject must contain at least 3 characters.";
  } else if (messageData.subject.length > validationRules.subject.maxLength) {
    errors.subject = "Project subject cannot exceed 150 characters.";
  }

  if (!messageData.message) {
    errors.message = "Project details are required.";
  } else if (messageData.message.length < validationRules.message.minLength) {
    errors.message = "Project details must contain at least 20 characters.";
  } else if (messageData.message.length > validationRules.message.maxLength) {
    errors.message = "Project details cannot exceed 5000 characters.";
  }

  return errors;
}

function focusFirstInvalidField(form, errors) {
  const firstInvalidFieldName = fieldOrder.find(
    (fieldName) => errors[fieldName],
  );

  if (!firstInvalidFieldName) {
    return;
  }

  const field = form.elements.namedItem(firstInvalidFieldName);

  if (field && typeof field.focus === "function") {
    field.focus();
  }
}

function ContactForm() {
  const formRef = useRef(null);

  const {
    services,
    isLoading: isServicesLoading,
    error: servicesError,
    refreshServices,
  } = useServices();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formStatus, setFormStatus] = useState(initialStatus);

  const [fieldErrors, setFieldErrors] = useState({});

  const [messageLength, setMessageLength] = useState(0);

  const serviceOptions = useMemo(() => {
    const sourceServices = Array.isArray(services) ? services : [];

    return sourceServices
      .map((service, index) => {
        const slug = cleanString(service.slug || service.id);

        const title = cleanString(service.title) || "Service";

        return {
          id: service._id || service.id || slug || `service-${index + 1}`,

          slug,
          title,
        };
      })
      .filter((service) => service.slug && service.title);
  }, [services]);

  function getFieldError(fieldName) {
    return fieldErrors[fieldName] || "";
  }

  function clearFormStatus() {
    setFormStatus((currentStatus) => {
      if (!currentStatus.message) {
        return currentStatus;
      }

      return initialStatus;
    });
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

    clearFormStatus();
  }

  function handleMessageChange(event) {
    setMessageLength(event.currentTarget.value.length);

    clearFieldError("message");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting || isServicesLoading || serviceOptions.length === 0) {
      return;
    }

    const form = event.currentTarget;

    const formData = new FormData(form);

    const messageData = {
      name: cleanString(formData.get("name")),

      email: cleanString(formData.get("email")).toLowerCase(),

      phone: cleanString(formData.get("phone")),

      service: cleanString(formData.get("service")),

      subject: cleanString(formData.get("subject")),

      message: cleanString(formData.get("message")),

      website: cleanString(formData.get("website")),
    };

    const validationErrors = validateMessageData(messageData, serviceOptions);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);

      setFormStatus({
        type: "error",

        message:
          "Please correct the highlighted fields before submitting your enquiry.",
      });

      requestAnimationFrame(() => {
        focusFirstInvalidField(form, validationErrors);
      });

      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setFormStatus(initialStatus);

      const response = await submitContactMessage(messageData);

      form.reset();
      setMessageLength(0);

      setFormStatus({
        type: "success",

        message:
          response.message ||
          "Your project enquiry has been submitted successfully.",
      });
    } catch (error) {
      const responseFieldErrors =
        error?.fieldErrors && typeof error.fieldErrors === "object"
          ? error.fieldErrors
          : {};

      setFieldErrors(responseFieldErrors);

      setFormStatus({
        type: "error",

        message:
          error?.message || "Your project enquiry could not be submitted.",
      });

      requestAnimationFrame(() => {
        focusFirstInvalidField(form, responseFieldErrors);
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasNoServices = !isServicesLoading && serviceOptions.length === 0;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="relative min-w-0 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8"
    >
      <div
        aria-hidden="true"
        className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="contact-website">Leave this field empty</label>

        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          inputMode="none"
        />
      </div>

      <div className="grid min-w-0 gap-5 sm:grid-cols-2">
        <div className="min-w-0">
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
            minLength={validationRules.name.minLength}
            maxLength={validationRules.name.maxLength}
            autoComplete="name"
            placeholder="Your full name"
            disabled={isSubmitting}
            onChange={() => clearFieldError("name")}
            aria-invalid={Boolean(getFieldError("name"))}
            aria-describedby={
              getFieldError("name") ? "contact-name-error" : undefined
            }
            className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          {getFieldError("name") && (
            <p
              id="contact-name-error"
              className="mt-2 break-words text-sm text-red-600"
            >
              {getFieldError("name")}
            </p>
          )}
        </div>

        <div className="min-w-0">
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
            maxLength={validationRules.email.maxLength}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            disabled={isSubmitting}
            onChange={() => clearFieldError("email")}
            aria-invalid={Boolean(getFieldError("email"))}
            aria-describedby={
              getFieldError("email") ? "contact-email-error" : undefined
            }
            className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          {getFieldError("email") && (
            <p
              id="contact-email-error"
              className="mt-2 break-words text-sm text-red-600"
            >
              {getFieldError("email")}
            </p>
          )}
        </div>

        <div className="min-w-0">
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
            maxLength={validationRules.phone.maxLength}
            autoComplete="tel"
            inputMode="tel"
            placeholder="Optional contact number"
            disabled={isSubmitting}
            onChange={() => clearFieldError("phone")}
            aria-invalid={Boolean(getFieldError("phone"))}
            aria-describedby={
              getFieldError("phone") ? "contact-phone-error" : undefined
            }
            className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          {getFieldError("phone") && (
            <p
              id="contact-phone-error"
              className="mt-2 break-words text-sm text-red-600"
            >
              {getFieldError("phone")}
            </p>
          )}
        </div>

        <div className="min-w-0">
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
            className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
            <p
              id="contact-service-error"
              className="mt-2 break-words text-sm text-red-600"
            >
              {getFieldError("service")}
            </p>
          )}

          {servicesError && !getFieldError("service") && (
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-3">
              <p className="min-w-0 break-words text-sm leading-6 text-amber-700">
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
            <p className="mt-2 break-words text-sm leading-6 text-red-600">
              No public services are currently available. Please try again
              later.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 min-w-0">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <label
            htmlFor="contact-subject"
            className="text-sm font-semibold text-slate-800"
          >
            Project subject
          </label>

          <span className="shrink-0 text-xs text-slate-400">Max 150</span>
        </div>

        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          minLength={validationRules.subject.minLength}
          maxLength={validationRules.subject.maxLength}
          placeholder="Example: E-commerce website development"
          disabled={isSubmitting}
          onChange={() => clearFieldError("subject")}
          aria-invalid={Boolean(getFieldError("subject"))}
          aria-describedby={
            getFieldError("subject") ? "contact-subject-error" : undefined
          }
          className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
        />

        {getFieldError("subject") && (
          <p
            id="contact-subject-error"
            className="mt-2 break-words text-sm text-red-600"
          >
            {getFieldError("subject")}
          </p>
        )}
      </div>

      <div className="mt-5 min-w-0">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <label
            htmlFor="contact-message"
            className="text-sm font-semibold text-slate-800"
          >
            Project details
          </label>

          <span
            id="contact-message-count"
            className="shrink-0 text-xs text-slate-400"
          >
            {messageLength}/{validationRules.message.maxLength}
          </span>
        </div>

        <textarea
          id="contact-message"
          name="message"
          required
          rows="6"
          minLength={validationRules.message.minLength}
          maxLength={validationRules.message.maxLength}
          placeholder="Describe your project, required features, timeline and other important information."
          disabled={isSubmitting}
          onChange={handleMessageChange}
          aria-invalid={Boolean(getFieldError("message"))}
          aria-describedby={
            getFieldError("message")
              ? "contact-message-error contact-message-count"
              : "contact-message-count"
          }
          className="mt-2 w-full min-w-0 resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
        />

        <div className="mt-2 flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">Minimum 20 characters</p>

          {messageLength > 0 && messageLength < 20 && (
            <p className="text-xs font-medium text-amber-700">
              {20 - messageLength} more characters required
            </p>
          )}
        </div>

        {getFieldError("message") && (
          <p
            id="contact-message-error"
            className="mt-2 break-words text-sm text-red-600"
          >
            {getFieldError("message")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={
          isSubmitting || isServicesLoading || serviceOptions.length === 0
        }
        className="mt-6 inline-flex min-h-12 w-full max-w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Sending Enquiry..."
          : isServicesLoading
            ? "Loading Services..."
            : "Send Project Enquiry"}
      </button>

      {formStatus.message && (
        <p
          role={formStatus.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`mt-4 break-words rounded-xl border p-4 text-sm leading-6 ${
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
