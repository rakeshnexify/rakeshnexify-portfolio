import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import { createServiceOrder } from "../../../services/serviceOrdersApi";
import { formatPackagePrice } from "./PackageCard";

const PRODUCTION_SITE_ORIGIN = "https://rakeshnexify.com";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  requirements: "",
  preferredStartDate: "",
  notes: "",
};

function normalizeWhatsAppNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

function getShareUrl() {
  if (typeof window === "undefined") {
    return `${PRODUCTION_SITE_ORIGIN}/services`;
  }

  const local = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const origin = local ? PRODUCTION_SITE_ORIGIN : window.location.origin;

  return `${origin}${window.location.pathname}${window.location.search}`;
}

function PackageOrderActions({
  brandName = "RakeshNexify",
  service,
  servicePackage,
  design,
  whatsapp = "",
  consultationEnabled = true,
}) {
  const [open, setOpen] = useState(false);
  const [formValues, setFormValues] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [showOptional, setShowOptional] = useState(false);

  const orderButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const firstFieldRef = useRef(null);
  const successButtonRef = useRef(null);

  const whatsappNumber = normalizeWhatsAppNumber(whatsapp);
  const canWhatsApp =
    Boolean(whatsappNumber) && servicePackage?.whatsappEnabled !== false;

  const serviceSlug = String(service?.slug || "").trim();
  const packageSlug = String(servicePackage?.slug || "").trim();
  const canRequestConsultation = Boolean(
    consultationEnabled && serviceSlug && packageSlug,
  );

  const consultationUrl = canRequestConsultation
    ? `/consultation?service=${encodeURIComponent(
        serviceSlug,
      )}&package=${encodeURIComponent(packageSlug)}`
    : "";

  const summary = useMemo(
    () => ({
      service: service?.title || "—",
      packageName: servicePackage?.name || "—",
      price: formatPackagePrice(servicePackage),
      design: design?.name || "—",
    }),
    [design, service, servicePackage],
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      if (submittedOrder) {
        successButtonRef.current?.focus();
        return;
      }

      firstFieldRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;

      window.setTimeout(() => {
        orderButtonRef.current?.focus();
      }, 0);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !submittedOrder) {
      return;
    }

    successButtonRef.current?.focus();
  }, [open, submittedOrder]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleDialogKeyDown(event) {
      if (event.key === "Escape") {
        if (!isSubmitting) {
          setOpen(false);
        }

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) || [],
      ).filter(
        (element) =>
          element instanceof HTMLElement &&
          !element.hasAttribute("hidden") &&
          element.getAttribute("aria-hidden") !== "true",
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement =
        focusableElements[focusableElements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleDialogKeyDown);

    return () => {
      document.removeEventListener(
        "keydown",
        handleDialogKeyDown,
      );
    };
  }, [isSubmitting, open]);

  function openWhatsApp() {
    if (!canWhatsApp) {
      return;
    }

    const message = [
      `Hello ${brandName},`,
      "",
      `Service: ${summary.service}`,
      `Package: ${summary.packageName}`,
      `Price: ${summary.price}`,
      `Design: ${summary.design}`,
      "",
      getShareUrl(),
    ].join("\n");

    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openOrderForm() {
    setFieldErrors({});
    setSubmitError("");
    setSubmittedOrder(null);
    setOpen(true);
  }

  function closeOrderForm() {
    if (isSubmitting) {
      return;
    }

    setOpen(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const next = { ...current };
      delete next[name];
      return next;
    });

    setSubmitError("");
  }

  function validateForm() {
    const errors = {};

    if (formValues.name.trim().length < 2) {
      errors.name = "Enter your name.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email.trim())) {
      errors.email = "Enter a valid email.";
    }

    if (formValues.phone.trim().length < 7) {
      errors.phone = "Enter a valid phone / WhatsApp number.";
    }

    if (formValues.requirements.trim().length < 10) {
      errors.requirements = "Write at least 10 characters.";
    }

    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const localErrors = validateForm();

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setSubmitError("");

      const response = await createServiceOrder({
        servicePackage: servicePackage?._id,
        packageDesign: design?._id || "",
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        company: formValues.company.trim(),
        requirements: formValues.requirements.trim(),
        preferredStartDate: formValues.preferredStartDate,
        notes: formValues.notes.trim(),
      });

      setSubmittedOrder(response.order);
      setFormValues(emptyForm);
      setShowOptional(false);
    } catch (error) {
      setFieldErrors(error?.fieldErrors || {});
      setSubmitError(
        error instanceof Error ? error.message : "Order could not be submitted.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section
        className={`grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${
          canRequestConsultation
            ? "sm:grid-cols-2 lg:grid-cols-3"
            : "sm:grid-cols-2"
        }`}
      >
        <button
          ref={orderButtonRef}
          type="button"
          onClick={openOrderForm}
          className="flex min-h-14 items-center justify-center gap-3 rounded-xl bg-brand-600 px-5 text-base font-black text-white transition hover:bg-brand-700"
        >
          <span className="text-xl" aria-hidden="true">🛒</span>
          Order Now
        </button>

        <button
          type="button"
          onClick={openWhatsApp}
          disabled={!canWhatsApp}
          className="flex min-h-14 items-center justify-center gap-3 rounded-xl bg-emerald-600 px-5 text-base font-black text-white transition hover:bg-emerald-700 disabled:bg-slate-300"
        >
          <span className="text-xl" aria-hidden="true">💬</span>
          Order on WhatsApp
        </button>

        {canRequestConsultation && (
          <Link
            to={consultationUrl}
            className="flex min-h-14 items-center justify-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-5 text-center text-base font-black text-brand-700 transition hover:border-brand-300 hover:bg-brand-100 sm:col-span-2 lg:col-span-1"
          >
            <span className="text-xl" aria-hidden="true">📅</span>
            Request a Consultation
          </Link>
        )}
      </section>

      {open && (
        <div className="fixed inset-0 z-[110] grid place-items-center p-3 sm:p-4">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close order dialog"
            onClick={closeOrderForm}
            className="absolute inset-0 bg-slate-950/60"
          />

          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-order-dialog-title"
            tabIndex={-1}
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
          >
            {submittedOrder ? (
              <div className="text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-3xl font-black text-emerald-700">
                  ✓
                </div>

                <h2
                  id="service-order-dialog-title"
                  className="mt-5 text-2xl font-black text-slate-950"
                >
                  Order Submitted
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Order Number
                </p>

                <p className="mt-1 break-all text-lg font-black text-brand-600">
                  {submittedOrder.orderNumber}
                </p>

                <button
                  ref={successButtonRef}
                  type="button"
                  onClick={closeOrderForm}
                  className="mt-6 min-h-12 w-full rounded-xl bg-slate-950 px-5 font-black text-white"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2
                      id="service-order-dialog-title"
                      className="text-xl font-black text-slate-950"
                    >
                      Place Order
                    </h2>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {summary.packageName} · {summary.design}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeOrderForm}
                    disabled={isSubmitting}
                    aria-label="Close order dialog"
                    className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 disabled:opacity-50"
                  >
                    ✕
                  </button>
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700"
                  >
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700">
                        Name *
                      </label>
                      <input
                        ref={firstFieldRef}
                        name="name"
                        value={formValues.name}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        autoComplete="name"
                        className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-brand-500"
                      />
                      {fieldErrors.name && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700">
                        Email *
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={formValues.email}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        autoComplete="email"
                        className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-brand-500"
                      />
                      {fieldErrors.email && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Phone / WhatsApp *
                    </label>
                    <input
                      name="phone"
                      value={formValues.phone}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      autoComplete="tel"
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 px-3 outline-none focus:border-brand-500"
                    />
                    {fieldErrors.phone && (
                      <p className="mt-1 text-xs font-semibold text-red-600">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">
                      Project Requirement *
                    </label>
                    <textarea
                      name="requirements"
                      value={formValues.requirements}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      rows={4}
                      placeholder="What do you want to build?"
                      className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-brand-500"
                    />
                    {fieldErrors.requirements && (
                      <p className="mt-1 text-xs font-semibold text-red-600">
                        {fieldErrors.requirements}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowOptional((current) => !current)}
                    className="text-xs font-bold text-brand-600"
                  >
                    {showOptional ? "Hide optional details" : "+ Optional details"}
                  </button>

                  {showOptional && (
                    <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700">
                          Company
                        </label>
                        <input
                          name="company"
                          value={formValues.company}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-brand-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700">
                          Preferred Start Date
                        </label>
                        <input
                          name="preferredStartDate"
                          type="date"
                          value={formValues.preferredStartDate}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-brand-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700">
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          value={formValues.notes}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          rows={3}
                          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-12 w-full rounded-xl bg-brand-600 px-5 font-black text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Placing Order..." : "Place Order"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default PackageOrderActions;
