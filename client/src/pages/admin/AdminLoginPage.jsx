import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import AdminThemeToggle from "../../components/admin/layout/AdminThemeToggle";
import useAdminAuth from "../../hooks/useAdminAuth";

const initialFormData = {
  email: "",
  password: "",
};

function validateLoginForm(formData) {
  const fieldErrors = {};

  const email = formData.email.trim();

  if (!email) {
    fieldErrors.email = "Admin email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Please enter a valid email address.";
  }

  if (!formData.password) {
    fieldErrors.password = "Admin password is required.";
  }

  return fieldErrors;
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    isAuthenticated,
    isCheckingSession,
    authError,
    clearAuthError,
  } = useAdminAuth();

  const [formData, setFormData] = useState(initialFormData);

  const [fieldErrors, setFieldErrors] = useState({});

  const [submitError, setSubmitError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const redirectPath = location.state?.from?.pathname || "/admin/dashboard";

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  useEffect(() => {
    if (!isCheckingSession && isAuthenticated) {
      navigate(redirectPath, {
        replace: true,
      });
    }
  }, [isAuthenticated, isCheckingSession, navigate, redirectPath]);

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));

    setSubmitError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validationErrors = validateLoginForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setSubmitError("");
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors({});
      setSubmitError("");

      await login({
        email: formData.email,
        password: formData.password,
      });

      navigate(redirectPath, {
        replace: true,
      });
    } catch (error) {
      setFieldErrors(error?.fieldErrors || {});

      if (error?.status === 429) {
        const retryAfterSeconds = error.retryAfterSeconds || 0;

        const retryAfterMinutes = Math.max(
          1,
          Math.ceil(retryAfterSeconds / 60),
        );

        setSubmitError(
          `Too many failed login attempts. Try again in approximately ${retryAfterMinutes} minute(s).`,
        );

        return;
      }

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Admin login failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayedError = submitError || authError;

  return (
    <main className="relative min-h-screen bg-slate-950">
      <AdminThemeToggle className="fixed right-4 top-4 z-30 sm:right-6 sm:top-6" />
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.95fr)]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-slate-950 px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-white/10 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 right-0 size-96 rounded-full bg-brand-300/20 blur-3xl"
          />

          <div className="relative">
            <Link
              to="/"
              className="inline-flex min-h-10 items-center gap-3 rounded-xl text-sm font-semibold text-white/90 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700 motion-reduce:transition-none"
            >
              <span
                aria-hidden="true"
                className="grid size-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-sm font-black backdrop-blur"
              >
                RN
              </span>

              <span>
                <span className="block text-base font-extrabold">
                  RakeshNexify
                </span>

                <span className="block text-xs font-medium text-brand-100">
                  Portfolio Administration
                </span>
              </span>
            </Link>
          </div>

          <div className="relative max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-100">
              Secure Administration
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Manage your portfolio from one protected workspace.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-brand-100">
              Maintain website content, business sections, enquiries and SEO
              settings through the role-protected Admin CMS.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                "Secure login",
                "Role-based access",
                "Dynamic CMS",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-sm leading-6 text-brand-100">
            Authorised administration only.
          </p>
        </section>

        <section className="flex min-h-screen items-center bg-slate-50 px-4 py-8 sm:px-6 sm:py-10 lg:px-10 xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-center justify-between gap-4 lg:hidden">
              <Link
                to="/"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-xl bg-brand-600 text-xs font-black text-white"
                >
                  RN
                </span>

                RakeshNexify
              </Link>

              <span className="rounded-lg bg-slate-200 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
                Admin
              </span>
            </div>

            <Link
              to="/"
              className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none lg:mt-0"
            >
              <span aria-hidden="true">
                &larr;
              </span>

              Back to portfolio
            </Link>

            <header className="mt-7 sm:mt-9">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
                Admin Portal
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Welcome back
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                Enter your authorised administrator credentials to continue to
                the dashboard.
              </p>
            </header>

            {displayedError && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium leading-6 text-red-700"
              >
                {displayedError}
              </div>
            )}

            <form
              className="mt-7 space-y-5"
              onSubmit={handleSubmit}
              noValidate
            >
              <div>
                <label
                  htmlFor="admin-email"
                  className="text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck="false"
                  placeholder="admin@example.com"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "admin-email-error" : undefined
                  }
                  className={`mt-2 min-h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none ${
                    fieldErrors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                      : "border-slate-300 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  }`}
                />

                {fieldErrors.email && (
                  <p
                    id="admin-email-error"
                    className="mt-2 text-sm font-medium text-red-600"
                  >
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label
                    htmlFor="admin-password"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <span className="text-xs font-medium text-slate-400">
                    Secure access
                  </span>
                </div>

                <div className="relative mt-2">
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={
                      fieldErrors.password ? "admin-password-error" : undefined
                    }
                    className={`min-h-12 w-full rounded-xl border bg-white px-4 pr-20 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none ${
                      fieldErrors.password
                        ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                        : "border-slate-300 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setShowPassword((currentValue) => !currentValue);
                    }}
                    disabled={isSubmitting}
                    aria-pressed={showPassword}
                    aria-label={
                      showPassword
                        ? "Hide admin password"
                        : "Show admin password"
                    }
                    className="absolute inset-y-0 right-0 inline-flex min-w-16 items-center justify-center rounded-r-xl px-4 text-xs font-bold text-slate-500 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {fieldErrors.password && (
                  <p
                    id="admin-password-error"
                    className="mt-2 text-sm font-medium text-red-600"
                  >
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isCheckingSession}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slate-400 motion-reduce:transition-none"
              >
                {isSubmitting
                  ? "Signing in..."
                  : isCheckingSession
                    ? "Checking session..."
                    : "Sign in to dashboard"}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center">
              <p className="text-xs leading-5 text-slate-500">
                Only authorised RakeshNexify administrators can access this
                system.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminLoginPage;
