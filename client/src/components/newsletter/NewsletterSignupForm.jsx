import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { submitSubscriber } from "../../services/subscribersApi";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createInitialState() {
  return {
    email: "",
    consentAccepted: false,
    website: "",
  };
}

function NewsletterSignupForm({
  variant = "dark",
  className = "",
  consentMode = "checkbox",
  compact = false,
}) {
  const instanceId = useId();

  const websiteId =
    `${instanceId}-newsletter-website`;

  const emailId =
    `${instanceId}-newsletter-email`;

  const emailErrorId =
    `${instanceId}-newsletter-email-error`;

  const consentId =
    `${instanceId}-newsletter-consent`;

  const consentErrorId =
    `${instanceId}-newsletter-consent-error`;

  const [formData, setFormData] =
    useState(createInitialState);

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [submitError, setSubmitError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const requestControllerRef =
    useRef(null);

  const emailInputRef =
    useRef(null);

  const consentInputRef =
    useRef(null);

  const isLight =
    variant === "light";

  const usesImplicitConsent =
    consentMode === "implicit";

  useEffect(
    () => () => {
      requestControllerRef.current?.abort();
    },
    [],
  );

  function handleChange(event) {
    const {
      name,
      type,
      checked,
      value,
    } = event.target;

    const nextValue =
      type === "checkbox"
        ? checked
        : value;

    setFormData(
      (currentData) => ({
        ...currentData,
        [name]: nextValue,
      }),
    );

    setFieldErrors(
      (currentErrors) => {
        if (!currentErrors[name]) {
          return currentErrors;
        }

        const nextErrors = {
          ...currentErrors,
        };

        delete nextErrors[name];

        return nextErrors;
      },
    );

    if (submitError) {
      setSubmitError("");
    }

    if (successMessage) {
      setSuccessMessage("");
    }
  }

  function validateForm() {
    const nextFieldErrors = {};

    const email =
      formData.email.trim().toLowerCase();

    if (!email) {
      nextFieldErrors.email =
        "Email is required.";
    } else if (email.length > 254) {
      nextFieldErrors.email =
        "Email cannot exceed 254 characters.";
    } else if (
      !EMAIL_PATTERN.test(email)
    ) {
      nextFieldErrors.email =
        "Please provide a valid email address.";
    }

    if (
      !usesImplicitConsent &&
      formData.consentAccepted !== true
    ) {
      nextFieldErrors.consentAccepted =
        "Please agree to receive newsletter and marketing updates.";
    }

    return {
      email,
      nextFieldErrors,
    };
  }

  function focusFirstInvalidField(
    errors,
  ) {
    if (errors.email) {
      emailInputRef.current?.focus();
      return;
    }

    if (
      !usesImplicitConsent &&
      errors.consentAccepted
    ) {
      consentInputRef.current?.focus();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const {
      email,
      nextFieldErrors,
    } = validateForm();

    if (
      Object.keys(nextFieldErrors).length >
      0
    ) {
      setFieldErrors(nextFieldErrors);
      setSubmitError("");
      setSuccessMessage("");

      window.requestAnimationFrame(() => {
        focusFirstInvalidField(
          nextFieldErrors,
        );
      });

      return;
    }

    requestControllerRef.current?.abort();

    const controller =
      new AbortController();

    requestControllerRef.current =
      controller;

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setSubmitError("");
      setSuccessMessage("");

      const result =
        await submitSubscriber(
          {
            email,
            consentAccepted: true,
            website:
              formData.website,
          },
          {
            signal:
              controller.signal,
          },
        );

      if (controller.signal.aborted) {
        return;
      }

      setSuccessMessage(
        result.message,
      );

      setFormData(
        createInitialState(),
      );
    } catch (requestError) {
      if (
        controller.signal.aborted ||
        requestError?.code === "ABORTED"
      ) {
        return;
      }

      const backendFieldErrors =
        requestError?.fieldErrors &&
        typeof requestError.fieldErrors ===
          "object" &&
        !Array.isArray(
          requestError.fieldErrors,
        )
          ? requestError.fieldErrors
          : {};

      setFieldErrors(
        backendFieldErrors,
      );

      let message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to subscribe right now. Please try again.";

      if (
        requestError?.status === 429 &&
        Number.isFinite(
          requestError
            .retryAfterSeconds,
        ) &&
        requestError
          .retryAfterSeconds > 0
      ) {
        const minutes = Math.max(
          1,
          Math.ceil(
            requestError
              .retryAfterSeconds / 60,
          ),
        );

        message =
          `Too many subscription requests were sent. Please try again in about ${minutes} minute${
            minutes === 1 ? "" : "s"
          }.`;
      }

      setSubmitError(message);

      if (
        Object.keys(
          backendFieldErrors,
        ).length > 0
      ) {
        window.requestAnimationFrame(
          () => {
            focusFirstInvalidField(
              backendFieldErrors,
            );
          },
        );
      }
    } finally {
      if (
        requestControllerRef.current ===
        controller
      ) {
        requestControllerRef.current =
          null;
      }

      if (!controller.signal.aborted) {
        setIsSubmitting(false);
      }
    }
  }

  const inputClasses = compact
    ? isLight
      ? "min-h-9 min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
      : "min-h-9 min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
    : isLight
      ? "min-h-11 min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
      : "min-h-11 min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60";

  const inputGroupClasses = compact
    ? isLight
      ? `flex min-w-0 overflow-hidden rounded-lg border bg-white/90 transition focus-within:ring-2 ${
          fieldErrors.email
            ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
            : "border-slate-300 focus-within:border-brand-500 focus-within:ring-brand-500/10"
        }`
      : `flex min-w-0 overflow-hidden rounded-lg border bg-slate-950/80 transition focus-within:ring-2 ${
          fieldErrors.email
            ? "border-red-500/70 focus-within:border-red-400 focus-within:ring-red-500/10"
            : "border-slate-700 focus-within:border-brand-500 focus-within:ring-brand-500/10"
        }`
    : isLight
      ? `flex min-w-0 overflow-hidden rounded-xl border bg-white transition focus-within:ring-4 ${
          fieldErrors.email
            ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
            : "border-slate-300 focus-within:border-brand-500 focus-within:ring-brand-500/10"
        }`
      : `flex min-w-0 overflow-hidden rounded-xl border bg-slate-950 transition focus-within:ring-4 ${
          fieldErrors.email
            ? "border-red-500/70 focus-within:border-red-400 focus-within:ring-red-500/10"
            : "border-slate-700 focus-within:border-brand-500 focus-within:ring-brand-500/10"
        }`;

  const consentClasses = isLight
    ? "flex cursor-pointer items-start gap-2 text-left text-xs leading-5 text-slate-500"
    : "flex cursor-pointer items-start gap-2 text-left text-xs leading-5 text-slate-400";

  const successClasses = isLight
    ? "text-xs font-semibold text-emerald-700"
    : "text-xs font-semibold text-emerald-300";

  const errorClasses = isLight
    ? "text-xs font-semibold text-red-600"
    : "text-xs font-semibold text-red-300";

  const submitClasses = compact
    ? isLight
      ? "inline-flex min-h-9 shrink-0 items-center justify-center border-l border-blue-700 bg-blue-600 px-3.5 py-2 text-xs font-extrabold !text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition hover:bg-blue-700 hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300/45 disabled:cursor-not-allowed disabled:opacity-60"
      : "inline-flex min-h-9 shrink-0 items-center justify-center border-l border-brand-700 bg-brand-600 px-3.5 py-2 text-xs font-bold !text-white transition hover:bg-brand-700 hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300/40 disabled:cursor-not-allowed disabled:opacity-60"
    : "inline-flex min-h-11 shrink-0 items-center justify-center border-l border-brand-700 bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-brand-300/40 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Newsletter subscription"
      className={`min-w-0 ${className}`.trim()}
    >
      <div
        aria-hidden="true"
        className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor={websiteId}>
          Website
        </label>

        <input
          id={websiteId}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website}
          onChange={handleChange}
        />
      </div>

      <div className="min-w-0">
        <label
          htmlFor={emailId}
          className="sr-only"
        >
          Email address
        </label>

        <div className={inputGroupClasses}>
          <input
            ref={emailInputRef}
            id={emailId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            value={formData.email}
            onChange={handleChange}
            aria-invalid={
              Boolean(
                fieldErrors.email,
              )
            }
            aria-describedby={
              fieldErrors.email
                ? emailErrorId
                : undefined
            }
            placeholder="you@example.com"
            disabled={isSubmitting}
            className={inputClasses}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className={submitClasses}
          >
            {isSubmitting
              ? "Subscribing..."
              : "Subscribe"}
          </button>
        </div>

        {fieldErrors.email ? (
          <p
            id={emailErrorId}
            className={`${compact ? "mt-0.5" : "mt-1"} ${errorClasses}`}
          >
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      {usesImplicitConsent ? (
        <p
          className={
            compact
              ? "newsletter-implicit-consent mt-1 text-[10px] leading-4"
              : "newsletter-implicit-consent"
          }
        >
          By subscribing, you agree to updates.
        </p>
      ) : (
        <div className="mt-1.5">
          <label
            htmlFor={consentId}
            className={consentClasses}
          >
            <input
              ref={consentInputRef}
              id={consentId}
              name="consentAccepted"
              type="checkbox"
              checked={
                formData.consentAccepted
              }
              onChange={handleChange}
              disabled={isSubmitting}
              aria-invalid={
                Boolean(
                  fieldErrors
                    .consentAccepted,
                )
              }
              aria-describedby={
                fieldErrors
                  .consentAccepted
                  ? consentErrorId
                  : undefined
              }
              className="mt-0.5 size-4 shrink-0 rounded border-slate-400 accent-brand-600 focus:ring-brand-500"
            />

            <span>
              I agree to receive newsletter and marketing updates from RakeshNexify.
            </span>
          </label>

          {fieldErrors.consentAccepted ? (
            <p
              id={consentErrorId}
              className={`mt-1.5 ${errorClasses}`}
            >
              {
                fieldErrors
                  .consentAccepted
              }
            </p>
          ) : null}
        </div>
      )}

      <div
        aria-live="polite"
        className={compact ? "mt-1 min-h-3" : "mt-2 min-h-4"}
      >
        {successMessage ? (
          <p className={successClasses}>
            {successMessage}
          </p>
        ) : null}

        {!successMessage &&
        submitError ? (
          <p
            role="alert"
            className={errorClasses}
          >
            {submitError}
          </p>
        ) : null}
      </div>
    </form>
  );
}

export default NewsletterSignupForm;
