import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

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
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-800 bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden bg-gradient-to-br from-brand-700 via-brand-600 to-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex size-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xl font-extrabold backdrop-blur">
              RN
            </div>

            <p className="mt-5 text-xl font-extrabold">RakeshNexify</p>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-100">
              Secure Administration
            </p>

            <h1 className="mt-5 max-w-lg text-4xl font-bold leading-tight">
              Manage your complete portfolio from one dashboard.
            </h1>

            <p className="mt-5 max-w-lg leading-7 text-brand-100">
              Update website sections, services, projects, companies, platform
              links, contact enquiries and SEO settings without editing source
              code.
            </p>
          </div>

          <p className="text-sm text-brand-100">
            Protected by secure authentication and role-based access.
          </p>
        </section>

        <section className="flex items-center bg-slate-50 p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
            >
              <span aria-hidden="true">←</span>
              Back to portfolio
            </Link>

            <div className="mt-10">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
                Admin Portal
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                Welcome back
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Enter your authorised administrator credentials to access the
                dashboard.
              </p>
            </div>

            {displayedError && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
              >
                {displayedError}
              </div>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
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
                  placeholder="admin@example.com"
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "admin-email-error" : undefined
                  }
                  className={`mt-2 min-h-12 w-full rounded-xl border bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
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
                    className={`min-h-12 w-full rounded-xl border bg-white px-4 pr-20 text-slate-950 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 ${
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
                    className="absolute inset-y-0 right-0 px-4 text-xs font-bold text-slate-500 transition hover:text-brand-600 disabled:cursor-not-allowed"
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
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-200 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting
                  ? "Signing in..."
                  : isCheckingSession
                    ? "Checking session..."
                    : "Sign in to dashboard"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              Only authorised RakeshNexify administrators can access this
              system.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AdminLoginPage;
