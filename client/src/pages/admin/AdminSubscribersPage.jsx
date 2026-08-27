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


const inputClassName =
  "min-h-8 w-full rounded-lg border border-[#223147] bg-[#091522] px-2.5 text-[10px] text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none sm:min-h-9 sm:px-3";

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
      className={`inline-flex min-h-5 items-center rounded-md border px-1.5 text-[8px] font-bold ${
        isActive
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
          : "border-slate-600 bg-slate-800 text-slate-400"
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

  const [pageLimit, setPageLimit] = useState(20);

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
      limit: pageLimit,
    }),
    [appliedFilters, page, pageLimit],
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
    <main className="min-h-screen bg-[#08111e] text-slate-200">
      <section className="mx-auto w-full max-w-[1560px] px-3 py-4 sm:px-5 lg:px-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-400">
              Newsletter
            </p>

            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">
              Newsletter / Subscribers
            </h1>

            <p className="mt-0.5 hidden max-w-2xl text-[10px] leading-4 text-slate-500 sm:block">
              Manage active subscriptions, consent history and unsubscribes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-[#1d2b3d] bg-[#0c1624] px-2.5 py-1.5 text-[9px] font-semibold text-slate-400">
              {total} total
            </span>

            <button
              className="inline-flex min-h-8 items-center justify-center rounded-md border border-[#27384e] bg-[#101c2c] px-2.5 text-[9px] font-semibold text-slate-300 transition hover:border-[#38506d] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading || Boolean(pendingActionId)}
              onClick={refresh}
              type="button"
            >
              {isLoading ? "..." : "Refresh"}
            </button>
          </div>
        </header>

        <form
          className="mt-2.5 rounded-lg border border-[#1d2b3d] bg-[#0c1624] p-2 sm:mt-3 sm:p-2.5"
          onSubmit={handleApplyFilters}
        >
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_120px_auto] sm:items-center">
            <div>
              <label className="sr-only" htmlFor="subscriber-search">
                Search email
              </label>

              <input
                className={inputClassName}
                id="subscriber-search"
                name="search"
                onChange={handleFilterChange}
                placeholder="Search subscriber email..."
                type="search"
                value={draftFilters.search}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:contents">
              <div>
                <label className="sr-only" htmlFor="subscriber-status">
                  Status
                </label>

                <select
                  className={inputClassName}
                  id="subscriber-status"
                  name="status"
                  onChange={handleFilterChange}
                  value={draftFilters.status}
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

              <div>
                <label className="sr-only" htmlFor="subscriber-limit">
                  Subscribers per page
                </label>

                <select
                  className={inputClassName}
                  id="subscriber-limit"
                  onChange={(event) => {
                    setPageLimit(Number(event.target.value) || 20);
                    setPage(1);
                  }}
                  value={pageLimit}
                >
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                  <option value="100">100 / page</option>
                </select>
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-3 text-[9px] font-bold text-white transition hover:bg-blue-500 sm:flex-none"
                type="submit"
              >
                Apply
              </button>

              <button
                className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border border-[#27384e] bg-[#101c2c] px-3 text-[9px] font-semibold text-slate-300 transition hover:border-[#38506d] hover:text-white sm:flex-none"
                onClick={handleClearFilters}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        </form>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[9px] font-semibold text-slate-500">
            {isLoading
              ? "Loading Subscribers..."
              : `${subscribers.length} shown · ${total} matching · ${safePage}/${safePages}`}
          </p>

          {hasActiveFilters ? (
            <span className="text-[9px] font-semibold text-blue-300">
              Filters active
            </span>
          ) : null}
        </div>

        <div aria-live="polite">
          {actionMessage ? (
            <div
              className="mt-2 rounded-md border border-emerald-500/20 bg-emerald-950/20 px-2.5 py-2 text-[9px] font-semibold text-emerald-300"
              role="status"
            >
              {actionMessage}
            </div>
          ) : null}

          {actionError ? (
            <div
              className="mt-2 rounded-md border border-rose-500/20 bg-rose-950/20 px-2.5 py-2 text-[9px] font-semibold text-rose-300"
              role="alert"
            >
              {actionError}
            </div>
          ) : null}
        </div>

        {error ? (
          <div
            className="mt-2 rounded-md border border-rose-500/20 bg-rose-950/20 px-2.5 py-2 text-[9px] text-rose-300"
            role="alert"
          >
            Unable to load Subscribers. {error.message}

            <button
              className="ml-2 font-bold underline underline-offset-2"
              onClick={refresh}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!error && !isLoading && subscribers.length === 0 ? (
          <div className="mt-2 rounded-lg border border-dashed border-[#26384f] bg-[#0a1422] px-4 py-7 text-center">
            <p className="text-sm font-bold text-slate-100">
              No Subscribers found
            </p>

            <p className="mt-1 text-[9px] text-slate-500">
              {hasActiveFilters
                ? "Change or clear the current filters."
                : "New newsletter subscriptions will appear here."}
            </p>
          </div>
        ) : null}

        {isLoading && subscribers.length === 0 ? (
          <div
            aria-live="polite"
            className="mt-2 space-y-1"
            role="status"
          >
            <span className="sr-only">Loading Subscribers...</span>

            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                className="h-[54px] animate-pulse rounded-lg border border-[#1d2b3d] bg-[#0c1624] motion-reduce:animate-none"
                key={placeholder}
              />
            ))}
          </div>
        ) : null}

        {subscribers.length > 0 ? (
          <div className="mt-2 grid grid-cols-1 gap-1.5 xl:grid-cols-2">
            {subscribers.map((subscriber) => {
              const isPending = pendingActionId === subscriber._id;

              return (
                <article
                  className="h-full min-w-0 rounded-lg border border-[#1d2b3d] bg-[#0c1624] transition hover:border-[#2c405b]"
                  key={subscriber._id}
                >
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 px-2 py-1.5 sm:gap-2 sm:px-2.5 sm:py-2 xl:min-h-[58px]">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <SubscriberStatusBadge status={subscriber.status} />

                        <a
                          className="max-w-full truncate text-[10px] font-bold text-blue-200 transition hover:text-blue-100 sm:max-w-[30rem] xl:max-w-[20rem]"
                          href={`mailto:${subscriber.email}`}
                        >
                          {subscriber.email}
                        </a>
                      </div>

                      <div className="mt-0.5 flex min-w-0 items-center gap-x-2 overflow-x-auto whitespace-nowrap text-[8px] text-slate-500 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <span className="shrink-0">
                          Subscribed {formatDateTime(subscriber.subscribedAt)}
                        </span>

                        <span className="shrink-0">
                          Consent {formatDateTime(subscriber.consentedAt)}
                        </span>

                        {subscriber.unsubscribedAt ? (
                          <span className="shrink-0">
                            Unsubscribed{" "}
                            {formatDateTime(subscriber.unsubscribedAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-1.5">
                      {subscriber.status === "active" ? (
                        <button
                          className="inline-flex min-h-7 items-center justify-center rounded-md border border-amber-500/25 bg-amber-500/10 px-2 text-[8px] font-bold text-amber-300 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-8 sm:px-2.5 sm:text-[9px]"
                          disabled={Boolean(pendingActionId)}
                          onClick={() => handleUnsubscribe(subscriber)}
                          type="button"
                        >
                          {isPending ? (
                            "..."
                          ) : (
                            <>
                              <span className="sm:hidden">Unsub</span>
                              <span className="hidden sm:inline">Unsubscribe</span>
                            </>
                          )}
                        </button>
                      ) : null}

                      {canDelete ? (
                        <details className="relative">
                          <summary
                            aria-label={`More actions for ${subscriber.email}`}
                            className="inline-flex size-7 cursor-pointer list-none items-center justify-center rounded-md border border-[#27384e] bg-[#101c2c] text-xs font-bold text-slate-300 transition hover:border-[#38506d] hover:text-white sm:size-8 sm:text-sm"
                            title="More actions"
                          >
                            …
                          </summary>

                          <div className="absolute right-0 top-[calc(100%+0.35rem)] z-30 w-40 rounded-lg border border-[#27384e] bg-[#0d1725] p-1.5 shadow-2xl">
                            <button
                              className="rnx-admin-delete-action flex min-h-8 w-full items-center rounded-md px-2 text-left text-[9px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={Boolean(pendingActionId)}
                              onClick={() => handleDelete(subscriber)}
                              type="button"
                            >
                              {isPending ? "Working..." : "Delete Subscriber"}
                            </button>
                          </div>
                        </details>
                      ) : null}
                    </div>
                  </div>

                </article>
              );
            })}
          </div>
        ) : null}

        {!error && safePages > 1 ? (
          <nav
            aria-label="Subscriber pagination"
            className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-[#1d2b3d] bg-[#0c1624] p-2"
          >
            <button
              className="inline-flex min-h-8 items-center justify-center rounded-md border border-[#27384e] bg-[#101c2c] px-2.5 text-[9px] font-semibold text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isLoading || safePage <= 1}
              onClick={() =>
                setPage((currentPage) =>
                  Math.max(1, currentPage - 1),
                )
              }
              type="button"
            >
              Previous
            </button>

            <span className="text-[9px] font-semibold text-slate-500">
              {safePage} / {safePages} · {total} matching
            </span>

            <button
              className="inline-flex min-h-8 items-center justify-center rounded-md border border-blue-500 bg-blue-600 px-2.5 text-[9px] font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
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

export default AdminSubscribersPage;
