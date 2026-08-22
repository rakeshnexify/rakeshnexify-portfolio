import { useMemo, useState } from "react";
import { Link } from "react-router";

const inputClasses =
  "mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950/50";

function containsControlCharacters(value) {
  const text = String(value ?? "");

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);

    if (code <= 31 || code === 127) {
      return true;
    }
  }

  return false;
}

function isSafeHttpUrl(value) {
  const url = String(value || "").trim();

  if (!url || containsControlCharacters(url)) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    return (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname) &&
      !parsedUrl.username &&
      !parsedUrl.password
    );
  } catch {
    return false;
  }
}

function createSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

function createFormValues(source = {}) {
  return {
    name: String(source?.name || ""),
    websiteUrl: String(source?.websiteUrl || ""),
    order: Number.isFinite(Number(source?.order)) ? String(Number(source.order)) : "0",
    isFeatured: source?.isFeatured !== false,
  };
}

function CompanyFieldError({ message }) {
  return message ? <p className="mt-2 text-sm font-medium text-red-600">{message}</p> : null;
}

function CompanyForm({ initialValues, onSubmit, submitLabel = "Save Company Link", mode = "edit" }) {
  const initialFormValues = useMemo(() => createFormValues(initialValues), [initialValues]);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleInputChange(event) {
    const { name, type, checked, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    setSubmitError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const name = String(formValues.name || "").trim();
    const websiteUrl = String(formValues.websiteUrl || "").trim();
    const order = Number(formValues.order);
    const errors = {};

    if (name.length < 2) errors.name = "Company name must contain at least 2 characters.";
    if (!isSafeHttpUrl(websiteUrl)) errors.websiteUrl = "Enter a valid http:// or https:// company website URL.";
    if (!Number.isFinite(order) || order < 0) errors.order = "Menu order must be a non-negative number.";

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    const payload = { name, websiteUrl, order, isFeatured: Boolean(formValues.isFeatured) };

    if (mode === "create") {
      const slug = createSlug(name);
      if (slug.length < 2) {
        setFieldErrors({ name: "Company name must contain letters or numbers." });
        return;
      }
      Object.assign(payload, {
        slug,
        shortDescription: `Official website navigation link for ${name}.`,
        relationship: "owned",
        status: "active",
        isVisible: true,
      });
    } else if (formValues.isFeatured) {
      Object.assign(payload, { status: "active", isVisible: true });
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setSubmitError("");
      await onSubmit(payload);
    } catch (error) {
      if (error?.fieldErrors && typeof error.fieldErrors === "object") setFieldErrors(error.fieldErrors);
      setSubmitError(error instanceof Error ? error.message : "Company submenu item could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">{submitError}</div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Submenu Link</p>
        <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">Company menu details</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Only fields used by the public Companies dropdown are shown here. Old company-profile, media, SEO, business-area and statistics controls are removed from this Admin screen.
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div>
            <label htmlFor="company-menu-name" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Company name *</label>
            <input id="company-menu-name" name="name" value={formValues.name} onChange={handleInputChange} disabled={isSubmitting} placeholder="Idomere" maxLength={150} className={inputClasses} />
            <CompanyFieldError message={fieldErrors.name} />
          </div>

          <div>
            <label htmlFor="company-menu-order" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Menu order *</label>
            <input id="company-menu-order" name="order" type="number" min="0" step="1" value={formValues.order} onChange={handleInputChange} disabled={isSubmitting} className={inputClasses} />
            <CompanyFieldError message={fieldErrors.order} />
          </div>

          <div className="lg:col-span-2">
            <label htmlFor="company-menu-website" className="text-sm font-semibold text-slate-700 dark:text-slate-200">Company website URL *</label>
            <input id="company-menu-website" name="websiteUrl" type="url" value={formValues.websiteUrl} onChange={handleInputChange} disabled={isSubmitting} placeholder="https://idomere.com" maxLength={500} className={inputClasses} />
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Clicking this submenu item opens the company website in a secure new tab.</p>
            <CompanyFieldError message={fieldErrors.websiteUrl} />
          </div>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
          <input name="isFeatured" type="checkbox" checked={formValues.isFeatured} onChange={handleInputChange} disabled={isSubmitting} className="mt-1 size-4 accent-brand-600" />
          <span>
            <span className="block text-sm font-bold text-slate-900 dark:text-white">Show in Companies submenu</span>
            <span className="mt-1 block text-sm leading-6 text-slate-500 dark:text-slate-400">Turn this off to remove the link from the public menu without deleting Company data used by Team or other relationships.</span>
          </span>
        </label>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <Link to="/admin/companies" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Cancel</Link>
        <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Saving..." : submitLabel}</button>
      </div>
    </form>
  );
}

export default CompanyForm;
