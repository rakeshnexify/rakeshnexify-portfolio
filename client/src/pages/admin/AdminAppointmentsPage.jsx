import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

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
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-150 motion-reduce:transition-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.08em] text-slate-500";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
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

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return String(value);
  }

  const [, year, month, day] = match;

  const date = new Date(Number(year), Number(month) - 1, Number(day));

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
    normalizeText(appointment?.serviceTitle) ||
    normalizeText(appointment?.service?.title) ||
    "Service not specified"
  );
}

function getPackageName(appointment) {
  return (
    normalizeText(appointment?.servicePackageName) ||
    normalizeText(appointment?.servicePackage?.name) ||
    "No package selected"
  );
}

function getAssignedAdminLabel(appointment) {
  const assignedTo = appointment?.assignedTo;

  if (!assignedTo || typeof assignedTo !== "object") {
    return "Unassigned";
  }

  return (
    normalizeText(assignedTo.name) ||
    normalizeText(assignedTo.email) ||
    "Assigned Admin"
  );
}

function AdminAppointmentsPage() {
  const { accessToken, logout } = useAdminAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);

  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);

  const [services, setServices] = useState([]);

  const [servicesLoading, setServicesLoading] = useState(false);

  const [servicesError, setServicesError] = useState("");

  const [servicesRefreshKey, setServicesRefreshKey] = useState(0);

  const handleUnauthorized = useCallback(() => {
    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: location.pathname,
        },
      },
    });
  }, [location.pathname, logout, navigate]);

  const listFilters = useMemo(
    () => ({
      ...appliedFilters,
      page,
      limit: PAGE_LIMIT,
    }),
    [appliedFilters, page],
  );

  const { appointments, total, pages, isLoading, error, refresh } =
    useAdminAppointments({
      accessToken,
      filters: listFilters,
      onUnauthorized: handleUnauthorized,
      enabled: Boolean(accessToken),
    });

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadServices() {
      try {
        setServicesLoading(true);
        setServicesError("");

        const result = await fetchAdminServices(
          accessToken,
          {
            page: 1,
            limit: 100,
          },
          {
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) {
          return;
        }

        setServices(Array.isArray(result?.services) ? result.services : []);
      } catch (requestError) {
        if (controller.signal.aborted || requestError?.name === "AbortError") {
          return;
        }

        if (requestError?.status === 401) {
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
  }, [accessToken, handleUnauthorized, servicesRefreshKey]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function handleApplyFilters(event) {
    event.preventDefault();

    setAppliedFilters({
      search: normalizeText(draftFilters.search),
      status: normalizeText(draftFilters.status),
      service: normalizeText(draftFilters.service),
      preferredDateFrom: normalizeText(draftFilters.preferredDateFrom),
      preferredDateTo: normalizeText(draftFilters.preferredDateTo),
    });

    setPage(1);
  }

  function handleClearFilters() {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  const hasActiveFilters = Object.values(appliedFilters).some(Boolean);

  const safePages = Math.max(1, Number(pages) || 1);

  const safePage = Math.min(Math.max(1, Number(page) || 1), safePages);

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="uppercase tracking-[0.14em] text-brand-700">
                Scheduling
              </span>

              <span aria-hidden="true" className="text-slate-300">
                /
              </span>

              <span className="text-slate-500">Consultation management</span>
            </div>

            <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Appointments / Consultations
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review consultation requests, preferred schedules, Services,
              assignment and Appointment lifecycle status.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section
          aria-labelledby="appointment-filters-heading"
          className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="appointment-filters-heading"
                className="text-base font-black text-slate-950"
              >
                Filters
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search by requester details or narrow requests by status,
                Service and preferred date.
              </p>
            </div>

            {hasActiveFilters ? (
              <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                Filters applied
              </span>
            ) : null}
          </div>

          <form
            onSubmit={handleApplyFilters}
            className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
          >
            <div className="md:col-span-2 xl:col-span-1">
              <label htmlFor="appointment-search" className={labelClassName}>
                Search
              </label>

              <input
                id="appointment-search"
                name="search"
                type="search"
                value={draftFilters.search}
                onChange={handleFilterChange}
                placeholder="Name, email..."
                className={`${inputClassName} placeholder:text-slate-400`}
              />
            </div>

            <div>
              <label htmlFor="appointment-status" className={labelClassName}>
                Status
              </label>

              <select
                id="appointment-status"
                name="status"
                value={draftFilters.status}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                {APPOINTMENT_STATUSES.map((status) => (
                  <option key={status.value || "all"} value={status.value}>
                    {status.label}
                  </option>
                ))}
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
                onChange={handleFilterChange}
                disabled={servicesLoading}
                className={inputClassName}
              >
                <option value="">
                  {servicesLoading ? "Loading Services..." : "All Services"}
                </option>

                {services.map((service) => {
                  const serviceId =
                    typeof service?._id === "string" ? service._id : "";

                  if (!serviceId) {
                    return null;
                  }

                  return (
                    <option key={serviceId} value={serviceId}>
                      {service.title || service.slug || serviceId}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label htmlFor="appointment-date-from" className={labelClassName}>
                Preferred from
              </label>

              <input
                id="appointment-date-from"
                name="preferredDateFrom"
                type="date"
                value={draftFilters.preferredDateFrom}
                onChange={handleFilterChange}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="appointment-date-to" className={labelClassName}>
                Preferred to
              </label>

              <input
                id="appointment-date-to"
                name="preferredDateTo"
                type="date"
                value={draftFilters.preferredDateTo}
                onChange={handleFilterChange}
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2 md:flex-row md:justify-end xl:col-span-5">
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-slate-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Clear
              </button>

              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Apply Filters
              </button>
            </div>
          </form>

          {servicesError ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
            >
              <p>
                Service filter is temporarily unavailable. Consultation requests
                can still be viewed.
              </p>

              <button
                type="button"
                onClick={() =>
                  setServicesRefreshKey((currentKey) => currentKey + 1)
                }
                disabled={servicesLoading}
                className="mt-2 min-h-9 font-bold underline decoration-amber-400 underline-offset-4 disabled:opacity-60"
              >
                {servicesLoading ? "Retrying..." : "Retry Service filter"}
              </button>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="appointment-results-heading" className="mt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="appointment-results-heading"
                className="text-base font-black text-slate-950"
              >
                Consultation requests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isLoading
                  ? "Loading requests..."
                  : `${total} request${total === 1 ? "" : "s"} found`}
              </p>
            </div>

            {!isLoading && safePages > 1 ? (
              <p className="text-xs font-semibold text-slate-500">
                Page {safePage} of {safePages}
              </p>
            ) : null}
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
            >
              <p className="font-bold">Unable to load consultation requests.</p>

              <p className="mt-1">{error.message}</p>

              <button
                type="button"
                onClick={refresh}
                className="mt-3 min-h-10 font-bold underline underline-offset-4"
              >
                Try again
              </button>
            </div>
          ) : null}

          {!error && !isLoading && appointments.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="text-base font-black text-slate-900">
                No consultation requests found
              </h3>

              <p className="mx-auto mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
                {hasActiveFilters
                  ? "Try clearing or changing the current filters."
                  : "New public consultation requests will appear here."}
              </p>
            </div>
          ) : null}

          {isLoading && appointments.length === 0 ? (
            <div role="status" aria-live="polite" className="mt-4 grid gap-3">
              <span className="sr-only">Loading consultation requests...</span>
              {[1, 2, 3].map((placeholder) => (
                <div
                  key={placeholder}
                  className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : null}

          {appointments.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {appointments.map((appointment) => (
                <article
                  key={appointment._id}
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AppointmentStatusBadge status={appointment.status} />

                        <span className="inline-flex min-h-7 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                          {formatMeetingType(appointment.meetingType)}
                        </span>
                      </div>

                      <h3 className="mt-3 break-words text-lg font-black tracking-tight text-slate-950">
                        {appointment.name || "Unnamed requester"}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        {appointment.email ? (
                          <a
                            href={`mailto:${appointment.email}`}
                            className="break-all font-semibold text-brand-700 transition-colors duration-150 motion-reduce:transition-none hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                          >
                            {appointment.email}
                          </a>
                        ) : null}

                        {appointment.phone ? (
                          <a
                            href={`tel:${appointment.phone}`}
                            className="font-semibold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                          >
                            {appointment.phone}
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <Link
                      to={`/admin/appointments/${appointment._id}`}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                    >
                      Open Appointment
                    </Link>
                  </div>

                  <dl className="mt-5 grid gap-x-5 gap-y-4 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="min-w-0">
                      <dt className={labelClassName}>Service / package</dt>

                      <dd className="mt-1.5 break-words text-sm font-bold text-slate-900">
                        {getServiceTitle(appointment)}
                      </dd>

                      <dd className="mt-1 break-words text-xs leading-5 text-slate-500">
                        {getPackageName(appointment)}
                      </dd>
                    </div>

                    <div className="min-w-0">
                      <dt className={labelClassName}>Preferred schedule</dt>

                      <dd className="mt-1.5 text-sm font-bold text-slate-900">
                        {formatPreferredDate(appointment.preferredDate)}
                      </dd>

                      <dd className="mt-1 break-words text-xs leading-5 text-slate-500">
                        {appointment.preferredTime || "—"} ·{" "}
                        {appointment.timezone || "Timezone not specified"}
                      </dd>
                    </div>

                    <div className="min-w-0">
                      <dt className={labelClassName}>Assigned Admin</dt>

                      <dd className="mt-1.5 break-words text-sm font-bold text-slate-900">
                        {getAssignedAdminLabel(appointment)}
                      </dd>
                    </div>

                    <div className="min-w-0">
                      <dt className={labelClassName}>Submitted</dt>

                      <dd className="mt-1.5 break-words text-sm font-bold text-slate-900">
                        {formatDateTime(appointment.createdAt)}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : null}

          {!error && safePages > 1 ? (
            <nav
              aria-label="Appointment pagination"
              className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-bold text-slate-700">
                  Page {safePage} of {safePages}
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  {total} consultation request
                  {total === 1 ? "" : "s"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() =>
                    setPage((currentPage) => Math.max(1, currentPage - 1))
                  }
                  disabled={isLoading || safePage <= 1}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.min(safePages, currentPage + 1),
                    )
                  }
                  disabled={isLoading || safePage >= safePages}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </nav>
          ) : null}
        </section>
      </section>
    </main>
  );
}

export default AdminAppointmentsPage;
