import { useState } from "react";

import { submitContactMessage } from "../../../services/contactMessageApi";
import siteData from "../../../data/siteData";

const initialStatus = {
  type: "",
  message: "",
};

function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState(initialStatus);
  const [fieldErrors, setFieldErrors] = useState({});

  function getFieldError(fieldName) {
    return fieldErrors[fieldName] || "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
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
          error.message ||
          "Your project enquiry could not be submitted.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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
            aria-invalid={Boolean(getFieldError("name"))}
            aria-describedby={
              getFieldError("name") ? "contact-name-error" : undefined
            }
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
          />

          {getFieldError("name") && (
            <p
              id="contact-name-error"
              className="mt-2 text-sm text-red-600"
            >
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
            aria-invalid={Boolean(getFieldError("email"))}
            aria-describedby={
              getFieldError("email")
                ? "contact-email-error"
                : undefined
            }
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
          />

          {getFieldError("email") && (
            <p
              id="contact-email-error"
              className="mt-2 text-sm text-red-600"
            >
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
            aria-invalid={Boolean(getFieldError("phone"))}
            aria-describedby={
              getFieldError("phone")
                ? "contact-phone-error"
                : undefined
            }
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
          />

          {getFieldError("phone") && (
            <p
              id="contact-phone-error"
              className="mt-2 text-sm text-red-600"
            >
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
            aria-invalid={Boolean(getFieldError("service"))}
            aria-describedby={
              getFieldError("service")
                ? "contact-service-error"
                : undefined
            }
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
          >
            <option value="" disabled>
              Select a service
            </option>

            {siteData.services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title}
              </option>
            ))}
          </select>

          {getFieldError("service") && (
            <p
              id="contact-service-error"
              className="mt-2 text-sm text-red-600"
            >
              {getFieldError("service")}
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
          aria-invalid={Boolean(getFieldError("subject"))}
          aria-describedby={
            getFieldError("subject")
              ? "contact-subject-error"
              : undefined
          }
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
        />

        {getFieldError("subject") && (
          <p
            id="contact-subject-error"
            className="mt-2 text-sm text-red-600"
          >
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
          placeholder="Describe your project, required features, timeline and other important information."
          aria-invalid={Boolean(getFieldError("message"))}
          aria-describedby={
            getFieldError("message")
              ? "contact-message-error"
              : undefined
          }
          className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
        />

        {getFieldError("message") && (
          <p
            id="contact-message-error"
            className="mt-2 text-sm text-red-600"
          >
            {getFieldError("message")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Sending Enquiry..."
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