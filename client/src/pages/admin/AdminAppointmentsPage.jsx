import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import AppointmentStatusBadge from "../../components/admin/appointments/AppointmentStatusBadge";
import useAdminAppointments from "../../hooks/useAdminAppointments";
import useAdminAuth from "../../hooks/useAdminAuth";
import { fetchAdminServices } from "../../services/adminServicesApi";

const APPOINTMENT_STATUSES = [
  {
    value: "",
    label: "All statuses",
  },
  {
    value: "requested",
    label: "Requested",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
  {
    value: "declined",
    label: "Declined",
  },
  {
    value: "no-show",
    label: "No-show",
  },
];

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  service: "",
  preferredDateFrom: "",
  preferredDateTo: "",
};

const PAGE_LIMIT = 10;

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.08em] text-slate-500";

function normalizeText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPreferredDate(value) {
  if (!value) {
    return "—";
  }

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (!match) {
    return String(value);
  }

  const [, year, month, day] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  );

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function formatMeetingType(value) {
  if (value === "phone-call") {
    return "Phone call";
  }

  if (value === "video-call") {
    return "Video call";
  }

  return value || "—";
}

function getServiceTitle(appointment) {
  return (
    normalizeText(
      appointment?.serviceTitle,
    ) ||
    normalizeText(
      appointment?.service?.title,
    ) ||
    "Service not specified"
  );
}

function getPackageName(appointment) {
  return (
    normalizeText(
      appointment?.servicePackageName,
    ) ||
    normalizeText(
      appointment?.servicePackage?.name,
    ) ||
    "No package selected"
  );
}

function getAssignedAdminLabel(appointment) {
  const assignedTo =
    appointment?.assignedTo;

  if (
    !assignedTo ||
    typeof assignedTo !== "object"
  ) {
    return "Unassigned";
  }

  return (
    normalizeText(assignedTo.name) ||
    normalizeText(assignedTo.email) ||
    "Assigned Admin"
  );
}

function AdminAppointmentsPage() {
  const {
    admin,
    accessToken,
    logout,
  } = useAdminAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [draftFilters, setDraftFilters] =
    useState(DEFAULT_FILTERS);

  const [appliedFilters, setAppliedFilters] =
    useState(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);

  const [services, setServices] = useState(
    [],
  );

  const [
    servicesLoading,
    setServicesLoading,
  ] = useState(false);

  const [servicesError, setServicesError] =
    useState("");

  const [
    servicesRefreshKey,
    setServicesRefreshKey,
  ] = useState(0);

  const handleUnauthorized = useCallback(
    () => {
      logout();

      navigate("/admin/login", {
        replace: true,
        state: {
          from: {
            pathname:
              location.pathname,
          },
        },
      });
    },
    [
      location.pathname,
      logout,
      navigate,
    ],
  );

  const listFilters = useMemo(
    () => ({
      ...appliedFilters,
      page,
      limit: PAGE_LIMIT,
    }),
    [appliedFilters, page],
  );

  const {
    appointments,
    total,
    pages,
    isLoading,
    error,
    refresh,
  } = useAdminAppointments({
    accessToken,
    filters: listFilters,
    onUnauthorized:
      handleUnauthorized,
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller =
      new AbortController();

    async function loadServices() {
      try {
        setServicesLoading(true);
        setServicesError("");

        const result =
          await fetchAdminServices(
            accessToken,
            {
              page: 1,
              limit: 100,
            },
            {
              signal:
                controller.signal,
            },
          );

        if (controller.signal.aborted) {
          return;
        }

        setServices(
          Array.isArray(result?.services)
            ? result.services
            : [],
        );
      } catch (requestError) {
        if (
          controller.signal.aborted ||
          requestError?.name ===
            "AbortError"
        ) {
          return;
        }

        if (
          requestError?.status === 401
        ) {
          handleUnauthorized();

          return;
        }

        setServices([]);
        setServicesError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load Services.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setServicesLoading(false);
        }
      }
    }

    loadServices();

    return () => {
      controller.abort();
    };
  }, [
    accessToken,
    handleUnauthorized,
    servicesRefreshKey,
  ]);

  function handleFilterChange(event) {
    const {
      name,
      value,
    } = event.target;

    setDraftFilters(
      (currentFilters) => ({
        ...currentFilters,
        [name]: value,
      }),
    );
  }

  function handleApplyFilters(event) {
    event.preventDefault();

    setAppliedFilters({
      search: normalizeText(
        draftFilters.search,
      ),
      status: normalizeText(
        draftFilters.status,
      ),
      service: normalizeText(
        draftFilters.service,
      ),
      preferredDateFrom:
        normalizeText(
          draftFilters.preferredDateFrom,
        ),
      preferredDateTo:
        normalizeText(
          draftFilters.preferredDateTo,
        ),
    });

    setPage(1);
  }

  function handleClearFilters() {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  const hasActiveFilters =
    Object.values(appliedFilters).some(
      Boolean,
    );

  const safePages = Math.max(
    1,
    Number(pages) || 1,
  );

  const safePage = Math.min(
    Math.max(1, Number(page) || 1),
    safePages,
  );

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              to="/admin"
              className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              ← Admin Dashboard
            </Link>

            <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
              Consultation management
            </p>

            <h1 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Appointments / Consultations
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Review consultation requests,
              preferred schedules, Services,
              assignment and Appointment
              lifecycle status.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        <section
          aria-labelledby="appointment-filters-heading"
          className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="appointment-filters-heading"
                className="text-lg font-black text-slate-950"
              >
                Filter requests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search by requester details or
                narrow requests by workflow
                status and preferred date.
              </p>
            </div>

            {hasActiveFilters ? (
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
                Filters applied
              </p>
            ) : null}
          </div>

          <form
            onSubmit={handleApplyFilters}
            className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
          >
            <div className="md:col-span-2 xl:col-span-1">
              <label
                htmlFor="appointment-search"
                className={labelClassName}
              >
                Search
              </label>

              <input
                id="appointment-search"
                name="search"
                type="search"
                value={draftFilters.search}
                onChange={
                  handleFilterChange
                }
                placeholder="Name, email..."
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="appointment-status"
                className={labelClassName}
              >
                Status
              </label>

              <select
                id="appointment-status"
                name="status"
                value={draftFilters.status}
                onChange={
                  handleFilterChange
                }
                className={inputClassName}
              >
                {APPOINTMENT_STATUSES.map(
                  (status) => (
                    <option
                      key={
                        status.value ||
                        "all"
                      }
                      value={status.value}
                    >
                      {status.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="appointment-service-filter"
                className={labelClassName}
              >
                Service
              </label>

              <select
                id="appointment-service-filter"
                name="service"
                value={draftFilters.service}
                onChange={
                  handleFilterChange
                }
                disabled={servicesLoading}
                className={inputClassName}
              >
                <option value="">
                  {servicesLoading
                    ? "Loading Services..."
                    : "All Services"}
                </option>

                {services.map((service) => {
                  const serviceId =
                    typeof service?._id ===
                    "string"
                      ? service._id
                      : "";

                  if (!serviceId) {
                    return null;
                  }

                  return (
                    <option
                      key={serviceId}
                      value={serviceId}
                    >
                      {service.title ||
                        service.slug ||
                        serviceId}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label
                htmlFor="appointment-date-from"
                className={labelClassName}
              >
                Preferred from
              </label>

              <input
                id="appointment-date-from"
                name="preferredDateFrom"
                type="date"
                value={
                  draftFilters.preferredDateFrom
                }
                onChange={
                  handleFilterChange
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="appointment-date-to"
                className={labelClassName}
              >
                Preferred to
              </label>

              <input
                id="appointment-date-to"
                name="preferredDateTo"
                type="date"
                value={
                  draftFilters.preferredDateTo
                }
                onChange={
                  handleFilterChange
                }
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col gap-3 md:col-span-2 md:flex-row xl:col-span-5">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
              >
                Apply filters
              </button>

              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
              >
                Clear
              </button>
            </div>
          </form>

          {servicesError ? (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"
            >
              <p>
                Service filter is temporarily
                unavailable. Consultation
                requests can still be viewed.
              </p>

              <button
                type="button"
                onClick={() =>
                  setServicesRefreshKey(
                    (currentKey) =>
                      currentKey + 1,
                  )
                }
                disabled={servicesLoading}
                className="mt-2 font-bold underline decoration-amber-400 underline-offset-4 disabled:opacity-60"
              >
                {servicesLoading
                  ? "Retrying..."
                  : "Retry Service filter"}
              </button>
            </div>
          ) : null}
        </section>

        <section
          aria-labelledby="appointment-results-heading"
          className="mt-8"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="appointment-results-heading"
                className="text-xl font-black text-slate-950"
              >
                Consultation requests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isLoading
                  ? "Loading requests..."
                  : `${total} request${
                      total === 1 ? "" : "s"
                    } found`}
              </p>
            </div>

            <p className="text-sm font-semibold text-slate-500">
              Signed in as{" "}
              {admin?.name ||
                admin?.email ||
                "Admin"}
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700"
            >
              <p className="font-bold">
                Unable to load consultation
                requests.
              </p>

              <p className="mt-1">
                {error.message}
              </p>

              <button
                type="button"
                onClick={refresh}
                className="mt-3 min-h-10 font-bold underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          ) : null}

          {!error &&
          !isLoading &&
          appointments.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="text-lg font-black text-slate-900">
                No consultation requests
                found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {hasActiveFilters
                  ? "Try clearing or changing the current filters."
                  : "New public consultation requests will appear here."}
              </p>
            </div>
          ) : null}

          {isLoading &&
          appointments.length === 0 ? (
            <div
              role="status"
              className="mt-5 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500"
            >
              Loading consultation requests...
            </div>
          ) : null}

          {appointments.length > 0 ? (
            <div className="mt-5 grid gap-4">
              {appointments.map(
                (appointment) => (
                  <article
                    key={appointment._id}
                    className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <AppointmentStatusBadge
                            status={
                              appointment.status
                            }
                          />

                          <span className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                            {formatMeetingType(
                              appointment.meetingType,
                            )}
                          </span>
                        </div>

                        <h3 className="mt-3 break-words text-xl font-black text-slate-950">
                          {appointment.name ||
                            "Unnamed requester"}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                          {appointment.email ? (
                            <a
                              href={`mailto:${appointment.email}`}
                              className="break-all font-semibold text-brand-700 hover:text-brand-800"
                            >
                              {
                                appointment.email
                              }
                            </a>
                          ) : null}

                          {appointment.phone ? (
                            <a
                              href={`tel:${appointment.phone}`}
                              className="font-semibold text-slate-700 hover:text-brand-700"
                            >
                              {
                                appointment.phone
                              }
                            </a>
                          ) : null}
                        </div>
                      </div>

                      <Link
                        to={`/admin/appointments/${appointment._id}`}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
                      >
                        Open Appointment
                      </Link>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className={labelClassName}>
                          Service / package
                        </p>

                        <p className="mt-2 break-words text-sm font-bold text-slate-900">
                          {getServiceTitle(
                            appointment,
                          )}
                        </p>

                        <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                          {getPackageName(
                            appointment,
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className={labelClassName}>
                          Preferred schedule
                        </p>

                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {formatPreferredDate(
                            appointment.preferredDate,
                          )}
                        </p>

                        <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                          {appointment.preferredTime ||
                            "—"}{" "}
                          ·{" "}
                          {appointment.timezone ||
                            "Timezone not specified"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className={labelClassName}>
                          Assigned Admin
                        </p>

                        <p className="mt-2 break-words text-sm font-bold text-slate-900">
                          {getAssignedAdminLabel(
                            appointment,
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className={labelClassName}>
                          Submitted
                        </p>

                        <p className="mt-2 break-words text-sm font-bold text-slate-900">
                          {formatDateTime(
                            appointment.createdAt,
                          )}
                        </p>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          ) : null}

          {!error && safePages > 1 ? (
            <nav
              aria-label="Appointment pagination"
              className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-center text-sm font-semibold text-slate-600 sm:text-left">
                Page {safePage} of{" "}
                {safePages}
              </p>

              <div className="grid grid-cols-2 gap-3 sm:flex">
                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (currentPage) =>
                        Math.max(
                          1,
                          currentPage - 1,
                        ),
                    )
                  }
                  disabled={
                    isLoading ||
                    safePage <= 1
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      (currentPage) =>
                        Math.min(
                          safePages,
                          currentPage + 1,
                        ),
                    )
                  }
                  disabled={
                    isLoading ||
                    safePage >= safePages
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default AdminAppointmentsPage;