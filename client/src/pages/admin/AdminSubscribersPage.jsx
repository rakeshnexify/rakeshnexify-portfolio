import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";
import useAdminSubscribers from "../../hooks/useAdminSubscribers";
import {
  deleteAdminSubscriber,
  unsubscribeAdminSubscriber,
} from "../../services/adminSubscribersApi";

const SUBSCRIBER_STATUSES = [
  {
    value: "",
    label: "All statuses",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "unsubscribed",
    label: "Unsubscribed",
  },
];

const DEFAULT_FILTERS = {
  search: "",
  status: "",
};

const PAGE_LIMIT = 10;

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors duration-150 motion-reduce:transition-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";

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

function SubscriberStatusBadge({ status }) {
  const normalizedStatus = normalizeText(status).toLowerCase();

  const isActive = normalizedStatus === "active";

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
        isActive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {isActive ? "Active" : "Unsubscribed"}
    </span>
  );
}

function AdminSubscribersPage() {
  const { admin, accessToken, logout } = useAdminAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);

  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  const [page, setPage] = useState(1);

  const [pendingActionId, setPendingActionId] = useState("");

  const [actionMessage, setActionMessage] = useState("");

  const [actionError, setActionError] = useState("");

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

  const {
    subscribers,
    total,
    pages,
    isLoading,
    error,
    refresh,
  } = useAdminSubscribers({
    accessToken,
    filters: listFilters,
    onUnauthorized: handleUnauthorized,
    enabled: Boolean(accessToken),
  });

  const canDelete = ["super-admin", "admin"].includes(admin?.role);

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
    });

    setPage(1);
  }

  function handleClearFilters() {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  async function handleUnsubscribe(subscriber) {
    if (
      !subscriber?._id ||
      subscriber.status !== "active" ||
      pendingActionId
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Unsubscribe ${subscriber.email}? This keeps the Subscriber record but stops the active subscription.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setPendingActionId(subscriber._id);
      setActionMessage("");
      setActionError("");

      const result = await unsubscribeAdminSubscriber(
        accessToken,
        subscriber._id,
      );

      setActionMessage(result.message);

      refresh();
    } catch (requestError) {
      if (requestError?.status === 401) {
        handleUnauthorized();
        return;
      }

      if (requestError?.status === 409) {
        refresh();
      }

      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to unsubscribe this Subscriber.",
      );
    } finally {
      setPendingActionId("");
    }
  }

  async function handleDelete(subscriber) {
    if (!canDelete || !subscriber?._id || pendingActionId) {
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete ${subscriber.email}? This removes the Subscriber record and should be used only when deletion is genuinely intended.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setPendingActionId(subscriber._id);
      setActionMessage("");
      setActionError("");

      const result = await deleteAdminSubscriber(
        accessToken,
        subscriber._id,
      );

      setActionMessage(result.message);

      refresh();
    } catch (requestError) {
      if (requestError?.status === 401) {
        handleUnauthorized();
        return;
      }

      setActionError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete this Subscriber.",
      );
    } finally {
      setPendingActionId("");
    }
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
                CRM
              </span>

              <span aria-hidden="true" className="text-slate-300">
                /
              </span>

              <span className="text-slate-500">Newsletter management</span>
            </div>

            <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Newsletter / Subscribers
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review newsletter Subscribers, filter subscription state,
              unsubscribe active records and perform restricted permanent
              deletion when required.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={isLoading || Boolean(pendingActionId)}
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section
          aria-labelledby="subscriber-filters-heading"
          className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="subscriber-filters-heading"
                className="text-base font-black text-slate-950"
              >
                Filters
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search by normalized email or narrow the list by subscription
                status.
              </p>
            </div>

            {hasActiveFilters ? (
              <span className="inline-flex w-fit rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                Filters applied
              </span>
            ) : null}
          </div>

          <form
            onSubmit={handleApplyFilters}
            className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end"
          >
            <div>
              <label htmlFor="subscriber-search" className={labelClassName}>
                Search email
              </label>

              <input
                id="subscriber-search"
                name="search"
                type="search"
                value={draftFilters.search}
                onChange={handleFilterChange}
                placeholder="name@example.com"
                className={`${inputClassName} px-4 placeholder:text-slate-400`}
              />
            </div>

            <div>
              <label htmlFor="subscriber-status" className={labelClassName}>
                Status
              </label>

              <select
                id="subscriber-status"
                name="status"
                value={draftFilters.status}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                {SUBSCRIBER_STATUSES.map((status) => (
                  <option
                    key={status.value || "all"}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition-colors duration-150 motion-reduce:transition-none hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 md:flex-none"
              >
                Apply
              </button>

              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition-colors duration-150 motion-reduce:transition-none hover:border-slate-400 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section
          aria-labelledby="subscriber-results-heading"
          className="mt-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="subscriber-results-heading"
                className="text-base font-black text-slate-950"
              >
                Subscribers
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isLoading
                  ? "Loading Subscribers..."
                  : `${total} Subscriber${total === 1 ? "" : "s"} found`}
              </p>
            </div>

            {!isLoading && safePages > 1 ? (
              <p className="text-xs font-semibold text-slate-500">
                Page {safePage} of {safePages}
              </p>
            ) : null}
          </div>

          <div aria-live="polite" className="mt-4">
            {actionMessage ? (
              <div
                role="status"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800"
              >
                {actionMessage}
              </div>
            ) : null}

            {actionError ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700"
              >
                {actionError}
              </div>
            ) : null}
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
            >
              <p className="font-bold">Unable to load Subscribers.</p>

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

          {!error && !isLoading && subscribers.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="text-base font-black text-slate-950">
                No Subscribers found
              </h3>

              <p className="mx-auto mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
                {hasActiveFilters
                  ? "Try changing or clearing the current filters."
                  : "New public newsletter subscriptions will appear here."}
              </p>
            </div>
          ) : null}

          {isLoading && subscribers.length === 0 ? (
            <div
              role="status"
              className="mt-4 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500"
            >
              Loading Subscribers...
            </div>
          ) : null}

          {subscribers.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th
                        scope="col"
                        className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-500"
                      >
                        Email
                      </th>

                      <th
                        scope="col"
                        className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-500"
                      >
                        Status
                      </th>

                      <th
                        scope="col"
                        className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-500"
                      >
                        Subscribed
                      </th>

                      <th
                        scope="col"
                        className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-500"
                      >
                        Consent
                      </th>

                      <th
                        scope="col"
                        className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-500"
                      >
                        Unsubscribed
                      </th>

                      <th
                        scope="col"
                        className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-[0.08em] text-slate-500"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {subscribers.map((subscriber) => {
                      const isPending =
                        pendingActionId === subscriber._id;

                      return (
                        <tr
                          key={subscriber._id}
                          className="transition-colors duration-150 motion-reduce:transition-none hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4 align-middle">
                            <a
                              href={`mailto:${subscriber.email}`}
                              className="break-all text-sm font-bold text-brand-700 transition-colors duration-150 motion-reduce:transition-none hover:text-brand-800"
                            >
                              {subscriber.email}
                            </a>
                          </td>

                          <td className="px-5 py-4 align-middle">
                            <SubscriberStatusBadge
                              status={subscriber.status}
                            />
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 align-middle text-sm text-slate-600">
                            {formatDateTime(subscriber.subscribedAt)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 align-middle text-sm text-slate-600">
                            {formatDateTime(subscriber.consentedAt)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 align-middle text-sm text-slate-600">
                            {formatDateTime(subscriber.unsubscribedAt)}
                          </td>

                          <td className="px-5 py-4 align-middle">
                            <div className="flex justify-end gap-2">
                              {subscriber.status === "active" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUnsubscribe(subscriber)
                                  }
                                  disabled={Boolean(pendingActionId)}
                                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-800 transition-colors duration-150 motion-reduce:transition-none hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isPending ? "Working..." : "Unsubscribe"}
                                </button>
                              ) : null}

                              {canDelete ? (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(subscriber)}
                                  disabled={Boolean(pendingActionId)}
                                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-700 transition-colors duration-150 motion-reduce:transition-none hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isPending ? "Working..." : "Delete"}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-3 sm:p-4 lg:hidden">
                {subscribers.map((subscriber) => {
                  const isPending =
                    pendingActionId === subscriber._id;

                  return (
                    <article
                      key={subscriber._id}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <a
                            href={`mailto:${subscriber.email}`}
                            className="break-all text-sm font-black text-brand-700 transition-colors duration-150 motion-reduce:transition-none hover:text-brand-800"
                          >
                            {subscriber.email}
                          </a>

                          <div className="mt-2">
                            <SubscriberStatusBadge
                              status={subscriber.status}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {subscriber.status === "active" ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleUnsubscribe(subscriber)
                              }
                              disabled={Boolean(pendingActionId)}
                              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-800 transition-colors duration-150 motion-reduce:transition-none hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isPending ? "Working..." : "Unsubscribe"}
                            </button>
                          ) : null}

                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(subscriber)}
                              disabled={Boolean(pendingActionId)}
                              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-700 transition-colors duration-150 motion-reduce:transition-none hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isPending ? "Working..." : "Delete"}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <dl className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                        <div>
                          <dt className={labelClassName}>Subscribed</dt>

                          <dd className="mt-1.5 text-sm leading-6 text-slate-700">
                            {formatDateTime(subscriber.subscribedAt)}
                          </dd>
                        </div>

                        <div>
                          <dt className={labelClassName}>Consent</dt>

                          <dd className="mt-1.5 text-sm leading-6 text-slate-700">
                            {formatDateTime(subscriber.consentedAt)}
                          </dd>
                        </div>

                        <div>
                          <dt className={labelClassName}>Unsubscribed</dt>

                          <dd className="mt-1.5 text-sm leading-6 text-slate-700">
                            {formatDateTime(subscriber.unsubscribedAt)}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}

          {!error && safePages > 1 ? (
            <nav
              aria-label="Subscriber pagination"
              className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-center text-sm font-semibold text-slate-600 sm:text-left">
                Page {safePage} of {safePages}
              </p>

              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  type="button"
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.max(1, currentPage - 1),
                    )
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

export default AdminSubscribersPage;