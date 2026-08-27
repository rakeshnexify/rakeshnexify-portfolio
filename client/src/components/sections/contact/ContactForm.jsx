import { useRef, useState } from "react";

import { submitContactMessage } from "../../../services/contactMessageApi";
import styles from "./ContactForm.module.css";

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
const fieldOrder = ["name", "email", "phone", "subject", "message"];

function cleanString(value) {
  return String(value || "").trim();
}

function validateMessageData(messageData) {
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

  if (!messageData.subject) {
    errors.subject = "Subject is required.";
  } else if (messageData.subject.length < validationRules.subject.minLength) {
    errors.subject = "Subject must contain at least 3 characters.";
  } else if (messageData.subject.length > validationRules.subject.maxLength) {
    errors.subject = "Subject cannot exceed 150 characters.";
  }

  if (!messageData.message) {
    errors.message = "Message is required.";
  } else if (messageData.message.length < validationRules.message.minLength) {
    errors.message = "Message must contain at least 20 characters.";
  } else if (messageData.message.length > validationRules.message.maxLength) {
    errors.message = "Message cannot exceed 5000 characters.";
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

function FieldError({ id, message }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className={styles.error} role="alert">
      {message}
    </p>
  );
}

function ContactForm({ submitLabel = "Send Message" }) {
  const formRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState(initialStatus);
  const [fieldErrors, setFieldErrors] = useState({});

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

      const updatedErrors = { ...currentErrors };
      delete updatedErrors[fieldName];
      return updatedErrors;
    });

    clearFormStatus();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const messageData = {
      name: cleanString(formData.get("name")),
      email: cleanString(formData.get("email")).toLowerCase(),
      phone: cleanString(formData.get("phone")),
      subject: cleanString(formData.get("subject")),
      message: cleanString(formData.get("message")),
    };

    const validationErrors = validateMessageData(messageData);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setFormStatus({
        type: "error",
        message: "Please correct the highlighted fields before submitting.",
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
      setFormStatus({
        type: "success",
        message:
          response.message || "Your message has been submitted successfully.",
      });
    } catch (error) {
      const responseFieldErrors =
        error?.fieldErrors && typeof error.fieldErrors === "object"
          ? error.fieldErrors
          : {};

      setFieldErrors(responseFieldErrors);
      setFormStatus({
        type: "error",
        message: error?.message || "Your message could not be submitted.",
      });

      requestAnimationFrame(() => {
        focusFirstInvalidField(form, responseFieldErrors);
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className={styles.form}>

      <div className={styles.grid}>
        <fieldset className={styles.fieldWrap}>
          <legend htmlFor="contact-name" className={styles.floatingLabel}>
            Name
          </legend>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            minLength={validationRules.name.minLength}
            maxLength={validationRules.name.maxLength}
            autoComplete="name"
            disabled={isSubmitting}
            onChange={() => clearFieldError("name")}
            aria-invalid={Boolean(getFieldError("name"))}
            aria-describedby={
              getFieldError("name") ? "contact-name-error" : undefined
            }
            className={styles.control}
           aria-label="Name"/>
          <FieldError id="contact-name-error" message={getFieldError("name")} />
        </fieldset>

        <fieldset className={styles.fieldWrap}>
          <legend htmlFor="contact-email" className={styles.floatingLabel}>
            Email
          </legend>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={validationRules.email.maxLength}
            autoComplete="email"
            inputMode="email"
            disabled={isSubmitting}
            onChange={() => clearFieldError("email")}
            aria-invalid={Boolean(getFieldError("email"))}
            aria-describedby={
              getFieldError("email") ? "contact-email-error" : undefined
            }
            className={styles.control}
           aria-label="Email"/>
          <FieldError id="contact-email-error" message={getFieldError("email")} />
        </fieldset>

        <fieldset className={styles.fieldWrap}>
          <legend htmlFor="contact-phone" className={styles.floatingLabel}>
            Phone
          </legend>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            maxLength={validationRules.phone.maxLength}
            autoComplete="tel"
            inputMode="tel"
            disabled={isSubmitting}
            onChange={() => clearFieldError("phone")}
            aria-invalid={Boolean(getFieldError("phone"))}
            aria-describedby={
              getFieldError("phone") ? "contact-phone-error" : undefined
            }
            className={styles.control}
           aria-label="Phone"/>
          <FieldError id="contact-phone-error" message={getFieldError("phone")} />
        </fieldset>

        <fieldset className={styles.fieldWrap}>
          <legend htmlFor="contact-subject" className={styles.floatingLabel}>
            Subject
          </legend>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            required
            minLength={validationRules.subject.minLength}
            maxLength={validationRules.subject.maxLength}
            disabled={isSubmitting}
            onChange={() => clearFieldError("subject")}
            aria-invalid={Boolean(getFieldError("subject"))}
            aria-describedby={
              getFieldError("subject") ? "contact-subject-error" : undefined
            }
            className={styles.control}
           aria-label="Subject"/>
          <FieldError
            id="contact-subject-error"
            message={getFieldError("subject")}
          />
        </fieldset>

        <fieldset className={`${styles.fieldWrap} ${styles.messageField}`}>
          <legend htmlFor="contact-message" className={styles.floatingLabel}>
            Message
          </legend>
          <textarea
            id="contact-message"
            name="message"
            required
            minLength={validationRules.message.minLength}
            maxLength={validationRules.message.maxLength}
            disabled={isSubmitting}
            onChange={() => clearFieldError("message")}
            aria-invalid={Boolean(getFieldError("message"))}
            aria-describedby={
              getFieldError("message") ? "contact-message-error" : undefined
            }
            className={`${styles.control} ${styles.textarea}`}
           aria-label="Message"/>
          <FieldError
            id="contact-message-error"
            message={getFieldError("message")}
          />
        </fieldset>
      </div>

      {formStatus.message && (
        <p
          className={styles.status}
          data-type={formStatus.type}
          role={formStatus.type === "error" ? "alert" : "status"}
        >
          {formStatus.message}
        </p>
      )}

      <button type="submit" className={styles.submit} disabled={isSubmitting}>
        <span>{isSubmitting ? "Sending..." : submitLabel}</span>
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}

export default ContactForm;