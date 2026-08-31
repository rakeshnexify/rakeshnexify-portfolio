import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router";

import useServicePackages from "../../hooks/useServicePackages";
import { submitAppointment } from "../../services/appointmentsApi";
import { fetchPublicServices } from "../../services/servicesApi";
import {
  createAppointmentInitialValues,
  createAppointmentPayload,
  getFirstAppointmentErrorField,
  getLocalToday,
  normalizeAppointmentFieldErrors,
  validateAppointmentValues,
} from "../../utils/appointmentForm";

const inputClassName =
  "mt-2 min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";

const selectClassName = `${inputClassName} disabled:text-slate-500`;

const labelClassName =
  "text-sm font-semibold text-slate-800";

const errorClassName =
  "mt-2 break-words text-sm text-red-600";

const helperClassName =
  "mt-2 text-sm leading-6 text-slate-500";

function getErrorId(fieldName) {
  return `appointment-${fieldName}-error`;
}

function getHelperId(fieldName) {
  return `appointment-${fieldName}-help`;
}

function getDescribedBy(
  fieldName,
  {
    hasError = false,
    hasHelper = false,
  } = {},
) {
  const ids = [];

  if (hasHelper) {
    ids.push(getHelperId(fieldName));
  }

  if (hasError) {
    ids.push(getErrorId(fieldName));
  }

  return ids.length > 0
    ? ids.join(" ")
    : undefined;
}

function getServiceId(service) {
  return typeof service?._id === "string"
    ? service._id.trim()
    : "";
}

function getPackageId(servicePackage) {
  return typeof servicePackage?._id ===
    "string"
    ? servicePackage._id.trim()
    : "";
}

function getReadableError(error, fallbackMessage) {
  if (
    error instanceof Error &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  if (
    typeof error === "string" &&
    error.trim()
  ) {
    return error.trim();
  }

  return fallbackMessage;
}

function formatMeetingType(value) {
  if (value === "phone-call") {
    return "Phone call";
  }

  return "Video call";
}

function formatPackageGroup(value) {
  if (value === "development") {
    return "Development";
  }

  if (value === "management") {
    return "Management";
  }

  return "";
}

function focusFirstInvalidField(
  form,
  fieldErrors,
) {
  const firstInvalidFieldName =
    getFirstAppointmentErrorField(
      fieldErrors,
    );

  if (!firstInvalidFieldName) {
    return;
  }

  const field = form?.elements?.namedItem(
    firstInvalidFieldName,
  );

  if (
    field &&
    typeof field.focus === "function"
  ) {
    field.focus();
  }
}

function AppointmentForm() {
  const [searchParams] = useSearchParams();

  const [values, setValues] = useState(() =>
    createAppointmentInitialValues(),
  );

  const [fieldErrors, setFieldErrors] =
    useState({});

  const [formStatus, setFormStatus] =
    useState(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [
    submittedAppointment,
    setSubmittedAppointment,
  ] = useState(null);

  const [services, setServices] = useState(
    [],
  );

  const [
    isServicesLoading,
    setIsServicesLoading,
  ] = useState(true);

  const [servicesError, setServicesError] =
    useState("");

  const [
    servicesRefreshKey,
    setServicesRefreshKey,
  ] = useState(0);

  const formRef = useRef(null);
  const successHeadingRef = useRef(null);
  const submitControllerRef = useRef(null);
  const mountedRef = useRef(true);

  const [
    hasServiceSelectionOverride,
    setHasServiceSelectionOverride,
  ] = useState(false);

  const [
    hasPackageSelectionOverride,
    setHasPackageSelectionOverride,
  ] = useState(false);

  const requestedServiceSlug = String(
    searchParams.get("service") || "",
  ).trim();

  const requestedPackageSlug = String(
    searchParams.get("package") || "",
  ).trim();

  const today = getLocalToday();

  const serviceOptions = useMemo(
    () =>
      services.filter(
        (service) =>
          typeof service?._id ===
            "string" &&
          service._id.trim() &&
          typeof service?.title ===
            "string" &&
          service.title.trim() &&
          typeof service?.slug ===
            "string" &&
          service.slug.trim(),
      ),
    [services],
  );

  const queryService = useMemo(
    () =>
      serviceOptions.find(
        (service) =>
          String(service?.slug || "") ===
          requestedServiceSlug,
      ) || null,
    [
      requestedServiceSlug,
      serviceOptions,
    ],
  );

  const canUseQueryService =
    !hasServiceSelectionOverride &&
    !isServicesLoading &&
    !servicesError &&
    Boolean(
      requestedServiceSlug &&
        queryService?._id,
    );

  const effectiveServiceId =
    canUseQueryService
      ? String(queryService._id)
      : values.service;

  const selectedService = useMemo(
    () =>
      serviceOptions.find(
        (service) =>
          getServiceId(service) ===
          effectiveServiceId,
      ) || null,
    [
      effectiveServiceId,
      serviceOptions,
    ],
  );

  const {
    servicePackages,
    isLoading: packagesLoading,
    error: packagesError,
    refreshServicePackages,
  } = useServicePackages({
    service: selectedService?.slug || "",
    enabled: Boolean(selectedService),
  });

  const queryPackage = useMemo(
    () =>
      servicePackages.find(
        (servicePackage) =>
          String(
            servicePackage?.slug || "",
          ) === requestedPackageSlug &&
          String(
            servicePackage?.service?._id ||
              "",
          ) ===
            String(
              selectedService?._id || "",
            ),
      ) || null,
    [
      requestedPackageSlug,
      selectedService,
      servicePackages,
    ],
  );

  const canUseQueryPackage =
    !hasPackageSelectionOverride &&
    Boolean(requestedPackageSlug) &&
    Boolean(requestedServiceSlug) &&
    !packagesLoading &&
    !packagesError &&
    selectedService?.slug ===
      requestedServiceSlug &&
    Boolean(queryPackage?._id);

  const effectivePackageId =
    canUseQueryPackage
      ? String(queryPackage._id)
      : values.servicePackage;

  const selectedPackage = useMemo(
    () =>
      servicePackages.find(
        (servicePackage) =>
          getPackageId(servicePackage) ===
          effectivePackageId,
      ) || null,
    [
      effectivePackageId,
      servicePackages,
    ],
  );

  const effectiveValues = useMemo(
    () => ({
      ...values,
      service: effectiveServiceId,
      servicePackage: effectivePackageId,
    }),
    [
      effectivePackageId,
      effectiveServiceId,
      values,
    ],
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (submitControllerRef.current) {
        submitControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadServices() {
      try {
        setIsServicesLoading(true);
        setServicesError("");

        const records =
          await fetchPublicServices({
            signal: controller.signal,
          });

        if (!controller.signal.aborted) {
          setServices(
            Array.isArray(records)
              ? records
              : [],
          );
        }
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        if (!controller.signal.aborted) {
          setServices([]);
          setServicesError(
            getReadableError(
              error,
              "Services could not be loaded.",
            ),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsServicesLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      controller.abort();
    };
  }, [servicesRefreshKey]);

  useEffect(() => {
    if (!submittedAppointment) {
      return;
    }

    requestAnimationFrame(() => {
      successHeadingRef.current?.focus();
    });
  }, [submittedAppointment]);

  function clearFieldErrors(...fieldNames) {
    setFieldErrors((currentErrors) => {
      const nextErrors = {
        ...currentErrors,
      };

      fieldNames.forEach((fieldName) => {
        delete nextErrors[fieldName];
      });

      return nextErrors;
    });
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    if (name === "service") {
      setHasServiceSelectionOverride(true);
      setHasPackageSelectionOverride(true);

      setValues((currentValues) => ({
        ...currentValues,
        service: value,
        servicePackage: "",
      }));

      clearFieldErrors(
        "service",
        "servicePackage",
      );

      return;
    }

    if (name === "servicePackage") {
      setHasPackageSelectionOverride(true);

      setValues((currentValues) => ({
        ...currentValues,
        servicePackage: value,
      }));

      clearFieldErrors("servicePackage");

      return;
    }

    if (name === "meetingType") {
      setValues((currentValues) => ({
        ...currentValues,
        meetingType: value,
      }));

      clearFieldErrors(
        "meetingType",
        "phone",
      );

      return;
    }

    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));

    clearFieldErrors(name);
  }

  function retryServices() {
    setServicesRefreshKey(
      (currentKey) => currentKey + 1,
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;

    setFormStatus(null);

    const validation =
      validateAppointmentValues(
        effectiveValues,
        {
          services: serviceOptions,
          servicePackages,
        },
      );

    if (!validation.isValid) {
      setFieldErrors(
        validation.fieldErrors,
      );

      requestAnimationFrame(() => {
        focusFirstInvalidField(
          form,
          validation.fieldErrors,
        );
      });

      return;
    }

    setValues(validation.values);
    setFieldErrors({});
    setIsSubmitting(true);

    const controller =
      new AbortController();

    submitControllerRef.current =
      controller;

    try {
      const result =
        await submitAppointment(
          createAppointmentPayload(
            validation.values,
          ),
          {
            signal: controller.signal,
          },
        );

      if (!mountedRef.current) {
        return;
      }

      setSubmittedAppointment(
        result.appointment,
      );

      setFormStatus({
        type: "success",
        message:
          result.message ||
          "Your consultation request has been received.",
      });
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      if (error?.code === "ABORTED") {
        return;
      }

      const backendFieldErrors =
        normalizeAppointmentFieldErrors(
          error?.fieldErrors,
        );

      setFieldErrors(
        backendFieldErrors,
      );

      let message =
        getReadableError(
          error,
          "Unable to submit your consultation request. Please try again.",
        );

      if (
        error?.status === 429 &&
        Number.isFinite(
          error?.retryAfterSeconds,
        ) &&
        error.retryAfterSeconds > 0
      ) {
        const minutes = Math.max(
          1,
          Math.ceil(
            error.retryAfterSeconds / 60,
          ),
        );

        message = `${message} Try again in about ${minutes} minute${
          minutes === 1 ? "" : "s"
        }.`;
      }

      setFormStatus({
        type: "error",
        message,
      });

      if (
        Object.keys(
          backendFieldErrors,
        ).length > 0
      ) {
        requestAnimationFrame(() => {
          focusFirstInvalidField(
            form,
            backendFieldErrors,
          );
        });
      }
    } finally {
      if (
        submitControllerRef.current ===
        controller
      ) {
        submitControllerRef.current =
          null;
      }

      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }

  function handleRequestAnother() {
    setHasServiceSelectionOverride(true);
    setHasPackageSelectionOverride(true);

    setValues(
      createAppointmentInitialValues(),
    );

    setFieldErrors({});
    setFormStatus(null);
    setSubmittedAppointment(null);

    requestAnimationFrame(() => {
      formRef.current?.elements
        ?.namedItem("name")
        ?.focus?.();
    });
  }

  if (submittedAppointment) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm sm:p-8"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-emerald-700">
          ✓
        </div>

        <h2
          ref={successHeadingRef}
          tabIndex={-1}
          className="mt-5 text-2xl font-bold tracking-tight text-slate-950 outline-none"
        >
          Consultation request received
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">
          Your preferred schedule will be
          reviewed before it is confirmed.
          Submitting this request does not
          guarantee the selected date or time.
        </p>

        <dl className="mt-6 grid gap-4 rounded-2xl border border-emerald-200 bg-white p-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              Requested
            </dd>
          </div>

          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Meeting type
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {formatMeetingType(
                submittedAppointment.meetingType,
              )}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Preferred date
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {submittedAppointment.preferredDate ||
                "—"}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Preferred time
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {submittedAppointment.preferredTime ||
                "—"}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Timezone
            </dt>
            <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
              {submittedAppointment.timezone ||
                "—"}
            </dd>
          </div>

          {submittedAppointment.serviceTitle ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Service
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {
                  submittedAppointment.serviceTitle
                }
              </dd>
            </div>
          ) : null}

          {submittedAppointment.servicePackageName ? (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Package
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {
                  submittedAppointment.servicePackageName
                }
              </dd>
            </div>
          ) : null}
        </dl>

        <button
          type="button"
          onClick={handleRequestAnother}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
        >
          Request another consultation
        </button>
      </section>
    );
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
          Consultation request
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          Tell me about your project
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-600">
          Choose your preferred date and
          time. Your request will be reviewed
          before the consultation schedule is
          confirmed.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="appointment-name"
            className={labelClassName}
          >
            Name{" "}
            <span
              className="text-red-600"
              aria-hidden="true"
            >
              *
            </span>
          </label>

          <input
            id="appointment-name"
            name="name"
            type="text"
            value={values.name}
            onChange={handleChange}
            required
            autoComplete="name"
            disabled={isSubmitting}
            aria-invalid={Boolean(
              fieldErrors.name,
            )}
            aria-describedby={
              fieldErrors.name
                ? getErrorId("name")
                : undefined
            }
            className={inputClassName}
          />

          {fieldErrors.name ? (
            <p
              id={getErrorId("name")}
              className={errorClassName}
            >
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="appointment-email"
            className={labelClassName}
          >
            Email{" "}
            <span
              className="text-red-600"
              aria-hidden="true"
            >
              *
            </span>
          </label>

          <input
            id="appointment-email"
            name="email"
            type="email"
            inputMode="email"
            value={values.email}
            onChange={handleChange}
            required
            autoComplete="email"
            disabled={isSubmitting}
            aria-invalid={Boolean(
              fieldErrors.email,
            )}
            aria-describedby={
              fieldErrors.email
                ? getErrorId("email")
                : undefined
            }
            className={inputClassName}
          />

          {fieldErrors.email ? (
            <p
              id={getErrorId("email")}
              className={errorClassName}
            >
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="appointment-phone"
            className={labelClassName}
          >
            Phone
            {values.meetingType ===
            "phone-call" ? (
              <>
                {" "}
                <span
                  className="text-red-600"
                  aria-hidden="true"
                >
                  *
                </span>
              </>
            ) : (
              <span className="font-normal text-slate-500">
                {" "}
                (optional)
              </span>
            )}
          </label>

          <input
            id="appointment-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            value={values.phone}
            onChange={handleChange}
            required={
              values.meetingType ===
              "phone-call"
            }
            autoComplete="tel"
            disabled={isSubmitting}
            aria-invalid={Boolean(
              fieldErrors.phone,
            )}
            aria-describedby={
              fieldErrors.phone
                ? getErrorId("phone")
                : undefined
            }
            className={inputClassName}
          />

          {fieldErrors.phone ? (
            <p
              id={getErrorId("phone")}
              className={errorClassName}
            >
              {fieldErrors.phone}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="appointment-companyName"
            className={labelClassName}
          >
            Company
            <span className="font-normal text-slate-500">
              {" "}
              (optional)
            </span>
          </label>

          <input
            id="appointment-companyName"
            name="companyName"
            type="text"
            value={values.companyName}
            onChange={handleChange}
            autoComplete="organization"
            disabled={isSubmitting}
            aria-invalid={Boolean(
              fieldErrors.companyName,
            )}
            aria-describedby={
              fieldErrors.companyName
                ? getErrorId("companyName")
                : undefined
            }
            className={inputClassName}
          />

          {fieldErrors.companyName ? (
            <p
              id={getErrorId(
                "companyName",
              )}
              className={errorClassName}
            >
              {fieldErrors.companyName}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="appointment-meetingType"
            className={labelClassName}
          >
            Meeting type{" "}
            <span
              className="text-red-600"
              aria-hidden="true"
            >
              *
            </span>
          </label>

          <select
            id="appointment-meetingType"
            name="meetingType"
            value={values.meetingType}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            aria-invalid={Boolean(
              fieldErrors.meetingType,
            )}
            aria-describedby={
              fieldErrors.meetingType
                ? getErrorId("meetingType")
                : undefined
            }
            className={selectClassName}
          >
            <option value="video-call">
              Video call
            </option>
            <option value="phone-call">
              Phone call
            </option>
          </select>

          {fieldErrors.meetingType ? (
            <p
              id={getErrorId(
                "meetingType",
              )}
              className={errorClassName}
            >
              {fieldErrors.meetingType}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="appointment-timezone"
            className={labelClassName}
          >
            Timezone{" "}
            <span
              className="text-red-600"
              aria-hidden="true"
            >
              *
            </span>
          </label>

          <input
            id="appointment-timezone"
            name="timezone"
            type="text"
            value={values.timezone}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            spellCheck="false"
            aria-invalid={Boolean(
              fieldErrors.timezone,
            )}
            aria-describedby={getDescribedBy(
              "timezone",
              {
                hasHelper: true,
                hasError: Boolean(
                  fieldErrors.timezone,
                ),
              },
            )}
            className={inputClassName}
          />

          <p
            id={getHelperId("timezone")}
            className={helperClassName}
          >
            Use an IANA timezone, for
            example Asia/Kathmandu.
          </p>

          {fieldErrors.timezone ? (
            <p
              id={getErrorId("timezone")}
              className={errorClassName}
            >
              {fieldErrors.timezone}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="appointment-preferredDate"
            className={labelClassName}
          >
            Preferred date{" "}
            <span
              className="text-red-600"
              aria-hidden="true"
            >
              *
            </span>
          </label>

          <input
            id="appointment-preferredDate"
            name="preferredDate"
            type="date"
            min={today}
            value={values.preferredDate}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            aria-invalid={Boolean(
              fieldErrors.preferredDate,
            )}
            aria-describedby={getDescribedBy(
              "preferredDate",
              {
                hasHelper: true,
                hasError: Boolean(
                  fieldErrors.preferredDate,
                ),
              },
            )}
            className={inputClassName}
          />

          <p
            id={getHelperId(
              "preferredDate",
            )}
            className={helperClassName}
          >
            This is a preferred date, not a
            confirmed booking.
          </p>

          {fieldErrors.preferredDate ? (
            <p
              id={getErrorId(
                "preferredDate",
              )}
              className={errorClassName}
            >
              {fieldErrors.preferredDate}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="appointment-preferredTime"
            className={labelClassName}
          >
            Preferred time{" "}
            <span
              className="text-red-600"
              aria-hidden="true"
            >
              *
            </span>
          </label>

          <input
            id="appointment-preferredTime"
            name="preferredTime"
            type="time"
            value={values.preferredTime}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            aria-invalid={Boolean(
              fieldErrors.preferredTime,
            )}
            aria-describedby={getDescribedBy(
              "preferredTime",
              {
                hasHelper: true,
                hasError: Boolean(
                  fieldErrors.preferredTime,
                ),
              },
            )}
            className={inputClassName}
          />

          <p
            id={getHelperId(
              "preferredTime",
            )}
            className={helperClassName}
          >
            The final schedule is confirmed
            only after review.
          </p>

          {fieldErrors.preferredTime ? (
            <p
              id={getErrorId(
                "preferredTime",
              )}
              className={errorClassName}
            >
              {fieldErrors.preferredTime}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="appointment-service"
            className={labelClassName}
          >
            Service
            <span className="font-normal text-slate-500">
              {" "}
              (optional)
            </span>
          </label>

          <select
            id="appointment-service"
            name="service"
            value={effectiveServiceId}
            onChange={handleChange}
            disabled={
              isSubmitting ||
              isServicesLoading ||
              Boolean(servicesError)
            }
            aria-invalid={Boolean(
              fieldErrors.service,
            )}
            aria-describedby={getDescribedBy(
              "service",
              {
                hasHelper: Boolean(
                  servicesError,
                ),
                hasError: Boolean(
                  fieldErrors.service,
                ),
              },
            )}
            className={selectClassName}
          >
            <option value="">
              {isServicesLoading
                ? "Loading Services..."
                : "No specific Service"}
            </option>

            {serviceOptions.map(
              (service) => (
                <option
                  key={service._id}
                  value={service._id}
                >
                  {service.title}
                </option>
              ),
            )}
          </select>

          {servicesError ? (
            <div
              id={getHelperId("service")}
              className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800"
            >
              <p>
                Services could not be loaded.
                You can still submit the
                consultation without choosing
                one.
              </p>

              <button
                type="button"
                onClick={retryServices}
                disabled={
                  isServicesLoading ||
                  isSubmitting
                }
                className="mt-2 font-semibold text-amber-900 underline decoration-amber-400 underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isServicesLoading
                  ? "Retrying..."
                  : "Retry Services"}
              </button>
            </div>
          ) : null}

          {fieldErrors.service ? (
            <p
              id={getErrorId("service")}
              className={errorClassName}
            >
              {fieldErrors.service}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="appointment-servicePackage"
            className={labelClassName}
          >
            Service package
            <span className="font-normal text-slate-500">
              {" "}
              (optional)
            </span>
          </label>

          <select
            id="appointment-servicePackage"
            name="servicePackage"
            value={effectivePackageId}
            onChange={handleChange}
            disabled={
              isSubmitting ||
              !selectedService ||
              packagesLoading ||
              Boolean(packagesError)
            }
            aria-invalid={Boolean(
              fieldErrors.servicePackage,
            )}
            aria-describedby={getDescribedBy(
              "servicePackage",
              {
                hasHelper: Boolean(
                  packagesError,
                ),
                hasError: Boolean(
                  fieldErrors.servicePackage,
                ),
              },
            )}
            className={selectClassName}
          >
            <option value="">
              {!selectedService
                ? "Select a Service first"
                : packagesLoading
                  ? "Loading packages..."
                  : "No specific package"}
            </option>

            {servicePackages.map(
              (servicePackage) => {
                const group =
                  formatPackageGroup(
                    servicePackage.group,
                  );

                return (
                  <option
                    key={servicePackage._id}
                    value={servicePackage._id}
                  >
                    {servicePackage.name}
                    {group
                      ? ` — ${group}`
                      : ""}
                  </option>
                );
              },
            )}
          </select>

          {packagesError ? (
            <div
              id={getHelperId(
                "servicePackage",
              )}
              className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800"
            >
              <p>
                Service packages could not be
                loaded. You can continue
                without selecting a package.
              </p>

              <button
                type="button"
                onClick={
                  refreshServicePackages
                }
                disabled={
                  packagesLoading ||
                  isSubmitting
                }
                className="mt-2 font-semibold text-amber-900 underline decoration-amber-400 underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {packagesLoading
                  ? "Retrying..."
                  : "Retry packages"}
              </button>
            </div>
          ) : null}

          {fieldErrors.servicePackage ? (
            <p
              id={getErrorId(
                "servicePackage",
              )}
              className={errorClassName}
            >
              {fieldErrors.servicePackage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="appointment-projectSummary"
          className={labelClassName}
        >
          Project summary{" "}
          <span
            className="text-red-600"
            aria-hidden="true"
          >
            *
          </span>
        </label>

        <textarea
          id="appointment-projectSummary"
          name="projectSummary"
          rows={6}
          value={values.projectSummary}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          placeholder="Tell me what you want to build, improve, or discuss."
          aria-invalid={Boolean(
            fieldErrors.projectSummary,
          )}
          aria-describedby={
            fieldErrors.projectSummary
              ? getErrorId(
                  "projectSummary",
                )
              : undefined
          }
          className={`${inputClassName} min-h-36 resize-y`}
        />

        {fieldErrors.projectSummary ? (
          <p
            id={getErrorId(
              "projectSummary",
            )}
            className={errorClassName}
          >
            {fieldErrors.projectSummary}
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <label
          htmlFor="appointment-message"
          className={labelClassName}
        >
          Additional message
          <span className="font-normal text-slate-500">
            {" "}
            (optional)
          </span>
        </label>

        <textarea
          id="appointment-message"
          name="message"
          rows={4}
          value={values.message}
          onChange={handleChange}
          disabled={isSubmitting}
          placeholder="Add any extra details that may help with the consultation."
          aria-invalid={Boolean(
            fieldErrors.message,
          )}
          aria-describedby={
            fieldErrors.message
              ? getErrorId("message")
              : undefined
          }
          className={`${inputClassName} min-h-28 resize-y`}
        />

        {fieldErrors.message ? (
          <p
            id={getErrorId("message")}
            className={errorClassName}
          >
            {fieldErrors.message}
          </p>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="appointment-website">
          Website
        </label>

        <input
          id="appointment-website"
          name="website"
          type="text"
          value={values.website}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {selectedService ||
      selectedPackage ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Selected context
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-900">
            {selectedService?.title}
            {selectedPackage?.name
              ? ` · ${selectedPackage.name}`
              : ""}
          </p>
        </div>
      ) : null}

      {formStatus?.message ? (
        <p
          role={
            formStatus.type === "error"
              ? "alert"
              : "status"
          }
          aria-live={
            formStatus.type === "error"
              ? "assertive"
              : "polite"
          }
          className={`mt-6 break-words rounded-xl border p-4 text-sm leading-6 ${
            formStatus.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {formStatus.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex min-h-12 w-full max-w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? "Sending Request..."
          : "Send Consultation Request"}
      </button>

      <p className="mt-4 text-center text-xs leading-5 text-slate-500">
        Your preferred schedule is a request.
        It is confirmed only after Admin
        review.
      </p>
    </form>
  );
}

export default AppointmentForm;