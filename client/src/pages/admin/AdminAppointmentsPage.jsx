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
    <main className="min-h-screen bg-[#08111e] text-slate-200">
      <section className="mx-auto w-full max-w-[1560px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">
              Scheduling
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-50">
              Appointments / Consultations
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
              Review consultation requests, preferred schedules and assignment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-[#1d2b3d] bg-[#0c1624] px-3 py-2 text-[11px] font-semibold text-slate-300">
              {isLoading
                ? "Loading..."
                : `${total} Request${total === 1 ? "" : "s"}`}
            </span>

            <button
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#27384e] bg-[#101c2c] px-3 text-xs font-semibold text-slate-300 transition hover:border-[#38506d] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              onClick={refresh}
              type="button"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        <form
          className="mt-4 rounded-xl border border-[#1d2b3d] bg-[#0c1624] p-3"
          onSubmit={handleApplyFilters}
        >
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_170px_220px_auto]">
            <div>
              <label className="sr-only" htmlFor="appointment-search">
                Search
              </label>

              <input
                className={`${inputClassName} !mt-0 !min-h-10 !rounded-lg`}
                id="appointment-search"
                name="search"
                onChange={handleFilterChange}
                placeholder="Name, email or phone..."
                type="search"
                value={draftFilters.search}
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="appointment-status">
                Status
              </label>

              <select
                className={`${inputClassName} !mt-0 !min-h-10 !rounded-lg`}
                id="appointment-status"
                name="status"
                onChange={handleFilterChange}
                value={draftFilters.status}
              >
                {APPOINTMENT_STATUSES.map((status) => (
                  <option key={status.value || "all"} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="sr-only" htmlFor="appointment-service-filter">
                Service
              </label>

              <select
                className={`${inputClassName} !mt-0 !min-h-10 !rounded-lg`}
                disabled={servicesLoading}
                id="appointment-service-filter"
                name="service"
                onChange={handleFilterChange}
                value={draftFilters.service}
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

            <div className="flex gap-2">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-500"
                type="submit"
              >
                Apply
              </button>

              <button
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#27384e] bg-[#101c2c] px-3 text-xs font-semibold text-slate-300 transition hover:border-[#38506d] hover:text-white"
                onClick={handleClearFilters}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          <details className="mt-2 rounded-lg border border-[#1d2b3d] bg-[#0a1422]">
            <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold text-slate-400">
              More Filters
            </summary>

            <div className="grid gap-3 border-t border-[#1d2b3d] px-3 py-3 md:grid-cols-2">
              <div>
                <label
                  className={`${labelClassName} !text-[10px]`}
                  htmlFor="appointment-date-from"
                >
                  Preferred from
                </label>

                <input
                  className={`${inputClassName} !mt-1.5 !min-h-10 !rounded-lg`}
                  id="appointment-date-from"
                  name="preferredDateFrom"
                  onChange={handleFilterChange}
                  type="date"
                  value={draftFilters.preferredDateFrom}
                />
              </div>

              <div>
                <label
                  className={`${labelClassName} !text-[10px]`}
                  htmlFor="appointment-date-to"
                >
                  Preferred to
                </label>

                <input
                  className={`${inputClassName} !mt-1.5 !min-h-10 !rounded-lg`}
                  id="appointment-date-to"
                  name="preferredDateTo"
                  onChange={handleFilterChange}
                  type="date"
                  value={draftFilters.preferredDateTo}
                />
              </div>
            </div>
          </details>

          {servicesError ? (
            <div
              className="mt-2 rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-[11px] font-semibold text-amber-300"
              role="alert"
            >
              Service filter unavailable. Requests can still be viewed.

              <button
                className="ml-2 font-bold underline underline-offset-2 disabled:opacity-50"
                disabled={servicesLoading}
                onClick={() =>
                  setServicesRefreshKey((currentKey) => currentKey + 1)
                }
                type="button"
              >
                {servicesLoading ? "Retrying..." : "Retry"}
              </button>
            </div>
          ) : null}
        </form>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-slate-400">
            {isLoading
              ? "Loading consultation requests..."
              : `${total} result${total === 1 ? "" : "s"} · Page ${safePage}/${safePages}`}
          </p>

          {hasActiveFilters ? (
            <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[9px] font-bold text-blue-300">
              Filters applied
            </span>
          ) : null}
        </div>

        {error ? (
          <div
            className="mt-3 rounded-lg border border-rose-500/20 bg-rose-950/20 px-3 py-2 text-xs font-semibold text-rose-300"
            role="alert"
          >
            Unable to load consultation requests. {error.message}

            <button
              className="ml-2 font-bold underline underline-offset-2"
              onClick={refresh}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!error && !isLoading && appointments.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-[#26384f] bg-[#0a1422] px-5 py-9 text-center">
            <h2 className="text-base font-bold text-slate-50">
              No consultation requests found
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {hasActiveFilters
                ? "Change or clear the current filters."
                : "New consultation requests will appear here."}
            </p>
          </div>
        ) : null}

        {isLoading && appointments.length === 0 ? (
          <div
            aria-live="polite"
            className="mt-3 space-y-2"
            role="status"
          >
            <span className="sr-only">Loading consultation requests...</span>

            {[1, 2, 3, 4, 5].map((placeholder) => (
              <div
                className="h-[86px] animate-pulse rounded-xl border border-[#1d2b3d] bg-[#0c1624] motion-reduce:animate-none"
                key={placeholder}
              />
            ))}
          </div>
        ) : null}

        {appointments.length > 0 ? (
          <div className="mt-3 space-y-2">
            {appointments.map((appointment) => (
              <article
                className="min-w-0 rounded-xl border border-[#1d2b3d] bg-[#0c1624] shadow-sm transition hover:border-[#2c405b]"
                key={appointment._id}
              >
                <div className="grid min-w-0 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <AppointmentStatusBadge
                        className="!min-h-5 !rounded-md !px-2 !py-0.5 !text-[9px]"
                        status={appointment.status}
                      />

                      <span className="rounded-md border border-[#26364b] bg-[#111d2e] px-2 py-1 text-[9px] font-bold text-slate-400">
                        {formatMeetingType(appointment.meetingType)}
                      </span>

                      <span className="text-[9px] text-slate-500">
                        Submitted {formatDateTime(appointment.createdAt)}
                      </span>
                    </div>

                    <div className="mt-1.5 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                      <h2 className="truncate text-sm font-bold text-slate-50">
                        {appointment.name || "Unnamed requester"}
                      </h2>

                      {appointment.email ? (
                        <a
                          className="max-w-64 truncate text-[10px] font-semibold text-blue-300 hover:text-blue-200"
                          href={`mailto:${appointment.email}`}
                        >
                          {appointment.email}
                        </a>
                      ) : null}

                      {appointment.phone ? (
                        <a
                          className="max-w-48 truncate text-[10px] font-semibold text-slate-400 hover:text-slate-200"
                          href={`tel:${appointment.phone}`}
                        >
                          {appointment.phone}
                        </a>
                      ) : null}
                    </div>

                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400">
                      <span className="max-w-52 truncate font-semibold text-slate-300">
                        {getServiceTitle(appointment)}
                      </span>

                      <span aria-hidden="true">→</span>

                      <span className="max-w-48 truncate">
                        {getPackageName(appointment)}
                      </span>

                      <span aria-hidden="true">•</span>

                      <span>
                        {formatPreferredDate(appointment.preferredDate)}
                      </span>

                      <span>
                        {appointment.preferredTime || "Time not specified"}
                      </span>

                      {appointment.timezone ? (
                        <span>{appointment.timezone}</span>
                      ) : null}

                      <span aria-hidden="true">•</span>

                      <span>
                        {getAssignedAdminLabel(appointment)}
                      </span>
                    </div>
                  </div>

                  <Link
                    className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-500"
                    to={`/admin/appointments/${appointment._id}`}
                  >
                    Open Appointment
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!error && safePages > 1 ? (
          <nav
            aria-label="Appointment pagination"
            className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#1d2b3d] bg-[#0c1624] p-2.5"
          >
            <button
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#27384e] bg-[#101c2c] px-3 text-xs font-semibold text-slate-300 transition hover:border-[#38506d] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isLoading || safePage <= 1}
              onClick={() =>
                setPage((currentPage) => Math.max(1, currentPage - 1))
              }
              type="button"
            >
              Previous
            </button>

            <span className="text-[11px] font-semibold text-slate-400">
              {safePage} / {safePages} · {total} total
            </span>

            <button
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isLoading || safePage >= safePages}
              onClick={() =>
                setPage((currentPage) =>
                  Math.min(safePages, currentPage + 1),
                )
              }
              type="button"
            >
              Next
            </button>
          </nav>
        ) : null}
      </section>
    </main>
  );
}

export default AdminAppointmentsPage;
