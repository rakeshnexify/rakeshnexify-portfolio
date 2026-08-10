import { useState } from "react";

import {
  createFaqPayload,
  validateFaqForm,
} from "../../../utils/faqForm";

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-1.5 text-sm font-semibold text-red-600" role="alert">
      {message}
    </p>
  );
}

function FaqForm({
  initialValues,
  onSubmit,
  submitLabel = "Save FAQ",
}) {
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, type, checked, value } = event.target;

    setValues((currentValues) => ({
      ...currentValues,
      [name]: type === "checkbox" ? checked : value,
    }));

    setFieldErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];

      return nextErrors;
    });

    setSubmitError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateFaqForm(values);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setSubmitError("");

      await onSubmit(createFaqPayload(values));
    } catch (error) {
      setFieldErrors(error?.fieldErrors || {});
      setSubmitError(
        error instanceof Error ? error.message : "FAQ could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {submitError && (
        <div
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
          role="alert"
        >
          {submitError}
        </div>
      )}

      <div>
        <label
          htmlFor="faq-question"
          className="text-sm font-bold text-slate-800"
        >
          Question *
        </label>

        <input
          id="faq-question"
          name="question"
          type="text"
          value={values.question}
          onChange={handleChange}
          disabled={isSubmitting}
          maxLength={300}
          autoFocus
          className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
          placeholder="e.g. How long does a MERN website take to develop?"
        />

        <FieldError message={fieldErrors.question} />
      </div>

      <div className="mt-6">
        <label
          htmlFor="faq-answer"
          className="text-sm font-bold text-slate-800"
        >
          Answer *
        </label>

        <textarea
          id="faq-answer"
          name="answer"
          value={values.answer}
          onChange={handleChange}
          disabled={isSubmitting}
          rows={9}
          maxLength={5000}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 leading-7 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
          placeholder="Write a clear customer-facing answer."
        />

        <div className="mt-1.5 flex items-start justify-between gap-4">
          <FieldError message={fieldErrors.answer} />
          <span className="ml-auto text-xs font-semibold text-slate-400">
            {values.answer.length}/5000
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="faq-category"
            className="text-sm font-bold text-slate-800"
          >
            Category *
          </label>

          <input
            id="faq-category"
            name="category"
            type="text"
            value={values.category}
            onChange={handleChange}
            disabled={isSubmitting}
            maxLength={80}
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
            placeholder="General, Pricing, Development..."
          />

          <FieldError message={fieldErrors.category} />
        </div>

        <div>
          <label
            htmlFor="faq-order"
            className="text-sm font-bold text-slate-800"
          >
            Display Order
          </label>

          <input
            id="faq-order"
            name="order"
            type="number"
            min="0"
            max="1000000"
            step="1"
            value={values.order}
            onChange={handleChange}
            disabled={isSubmitting}
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100"
          />

          <FieldError message={fieldErrors.order} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex min-h-20 cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            name="isFeatured"
            type="checkbox"
            checked={values.isFeatured}
            onChange={handleChange}
            disabled={isSubmitting}
            className="mt-1 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />

          <span>
            <span className="block font-bold text-slate-800">Featured FAQ</span>
            <span className="mt-1 block text-sm leading-6 text-slate-500">
              Featured FAQs can be prioritized in public previews.
            </span>
          </span>
        </label>

        <label className="flex min-h-20 cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            name="isVisible"
            type="checkbox"
            checked={values.isVisible}
            onChange={handleChange}
            disabled={isSubmitting}
            className="mt-1 size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />

          <span>
            <span className="block font-bold text-slate-800">Publicly Visible</span>
            <span className="mt-1 block text-sm leading-6 text-slate-500">
              Hidden FAQs remain available to Admin but are excluded publicly.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default FaqForm;
