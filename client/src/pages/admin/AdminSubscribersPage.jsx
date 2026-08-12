import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

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

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function formatRole(role = "") {
  return String(role)
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function SubscriberStatusBadge({
  status,
}) {
  const normalizedStatus =
    normalizeText(status).toLowerCase();

  const isActive =
    normalizedStatus === "active";

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-3 py-1 text-xs font-bold ${
        isActive
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-200 text-slate-700"
      }`}
    >
      {isActive
        ? "Active"
        : "Unsubscribed"}
    </span>
  );
}

function AdminSubscribersPage() {
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

  const [page, setPage] =
    useState(1);

  const [
    pendingActionId,
    setPendingActionId,
  ] = useState("");

  const [
    actionMessage,
    setActionMessage,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

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
    subscribers,
    total,
    pages,
    isLoading,
    error,
    refresh,
  } = useAdminSubscribers({
    accessToken,
    filters: listFilters,
    onUnauthorized:
      handleUnauthorized,
    enabled: Boolean(accessToken),
  });

  const canDelete =
    ["super-admin", "admin"].includes(
      admin?.role,
    );

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
    });

    setPage(1);
  }

  function handleClearFilters() {
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  async function handleUnsubscribe(
    subscriber,
  ) {
    if (
      !subscriber?._id ||
      subscriber.status !== "active" ||
      pendingActionId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Unsubscribe ${subscriber.email}? This keeps the Subscriber record but stops the active subscription.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setPendingActionId(
        subscriber._id,
      );
      setActionMessage("");
      setActionError("");

      const result =
        await unsubscribeAdminSubscriber(
          accessToken,
          subscriber._id,
        );

      setActionMessage(
        result.message,
      );

      refresh();
    } catch (requestError) {
      if (
        requestError?.status === 401
      ) {
        handleUnauthorized();
        return;
      }

      if (
        requestError?.status === 409
      ) {
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

  async function handleDelete(
    subscriber,
  ) {
    if (
      !canDelete ||
      !subscriber?._id ||
      pendingActionId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Permanently delete ${subscriber.email}? This removes the Subscriber record and should be used only when deletion is genuinely intended.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setPendingActionId(
        subscriber._id,
      );
      setActionMessage("");
      setActionError("");

      const result =
        await deleteAdminSubscriber(
          accessToken,
          subscriber._id,
        );

      setActionMessage(
        result.message,
      );

      refresh();
    } catch (requestError) {
      if (
        requestError?.status === 401
      ) {
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

  const hasActiveFilters =
    Object.values(
      appliedFilters,
    ).some(Boolean);

  const safePages = Math.max(
    1,
    Number(pages) || 1,
  );

  const safePage = Math.min(
    Math.max(
      1,
      Number(page) || 1,
    ),
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
              Newsletter management
            </p>

            <h1 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Newsletter / Subscribers
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Review email Subscribers,
              search and filter subscription
              state, unsubscribe active
              Subscribers and perform restricted
              permanent deletion when needed.
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={
              isLoading ||
              Boolean(pendingActionId)
            }
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        <section
          aria-labelledby="subscriber-filters-heading"
          className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="subscriber-filters-heading"
                className="text-lg font-black text-slate-950"
              >
                Filter Subscribers
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search by normalized email or
                narrow results by subscription
                status.
              </p>
            </div>

            {hasActiveFilters ? (
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
                Filters applied
              </p>
            ) : null}
          </div>

          <form
            onSubmit={
              handleApplyFilters
            }
            className="mt-6 grid gap-4 md:grid-cols-[1fr_220px_auto]"
          >
            <div>
              <label
                htmlFor="subscriber-search"
                className={labelClassName}
              >
                Search email
              </label>

              <input
                id="subscriber-search"
                name="search"
                type="search"
                value={
                  draftFilters.search
                }
                onChange={
                  handleFilterChange
                }
                placeholder="name@example.com"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="subscriber-status"
                className={labelClassName}
              >
                Status
              </label>

              <select
                id="subscriber-status"
                name="status"
                value={
                  draftFilters.status
                }
                onChange={
                  handleFilterChange
                }
                className={inputClassName}
              >
                {SUBSCRIBER_STATUSES.map(
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

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
              >
                Apply
              </button>

              <button
                type="button"
                onClick={
                  handleClearFilters
                }
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section
          aria-labelledby="subscriber-results-heading"
          className="mt-8"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="subscriber-results-heading"
                className="text-xl font-black text-slate-950"
              >
                Subscribers
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isLoading
                  ? "Loading Subscribers..."
                  : `${total} Subscriber${
                      total === 1 ? "" : "s"
                    } found`}
              </p>
            </div>

            <p className="text-sm font-semibold text-slate-500">
              Signed in as{" "}
              {admin?.name ||
                admin?.email ||
                "Admin"}{" "}
              · {formatRole(admin?.role)}
            </p>
          </div>

          <div
            aria-live="polite"
            className="mt-4"
          >
            {actionMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                {actionMessage}
              </div>
            ) : null}

            {actionError ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
              >
                {actionError}
              </div>
            ) : null}
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700"
            >
              <p className="font-bold">
                Unable to load Subscribers.
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
          subscribers.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="text-lg font-black text-slate-900">
                No Subscribers found
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {hasActiveFilters
                  ? "Try clearing or changing the current filters."
                  : "New public newsletter subscriptions will appear here."}
              </p>
            </div>
          ) : null}

          {isLoading &&
          subscribers.length === 0 ? (
            <div
              role="status"
              className="mt-5 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500"
            >
              Loading Subscribers...
            </div>
          ) : null}

          {subscribers.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                        Email
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                        Subscribed
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                        Consent
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                        Unsubscribed
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {subscribers.map(
                      (subscriber) => {
                        const isPending =
                          pendingActionId ===
                          subscriber._id;

                        return (
                          <tr
                            key={
                              subscriber._id
                            }
                          >
                            <td className="px-5 py-4">
                              <a
                                href={`mailto:${subscriber.email}`}
                                className="break-all text-sm font-bold text-brand-700 hover:text-brand-800"
                              >
                                {
                                  subscriber.email
                                }
                              </a>
                            </td>

                            <td className="px-5 py-4">
                              <SubscriberStatusBadge
                                status={
                                  subscriber.status
                                }
                              />
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {formatDateTime(
                                subscriber.subscribedAt,
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {formatDateTime(
                                subscriber.consentedAt,
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {formatDateTime(
                                subscriber.unsubscribedAt,
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                {subscriber.status ===
                                "active" ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUnsubscribe(
                                        subscriber,
                                      )
                                    }
                                    disabled={
                                      Boolean(
                                        pendingActionId,
                                      )
                                    }
                                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isPending
                                      ? "Working..."
                                      : "Unsubscribe"}
                                  </button>
                                ) : null}

                                {canDelete ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDelete(
                                        subscriber,
                                      )
                                    }
                                    disabled={
                                      Boolean(
                                        pendingActionId,
                                      )
                                    }
                                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isPending
                                      ? "Working..."
                                      : "Delete"}
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 lg:hidden">
                {subscribers.map(
                  (subscriber) => {
                    const isPending =
                      pendingActionId ===
                      subscriber._id;

                    return (
                      <article
                        key={subscriber._id}
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <a
                              href={`mailto:${subscriber.email}`}
                              className="break-all text-sm font-black text-brand-700 hover:text-brand-800"
                            >
                              {
                                subscriber.email
                              }
                            </a>

                            <div className="mt-2">
                              <SubscriberStatusBadge
                                status={
                                  subscriber.status
                                }
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {subscriber.status ===
                            "active" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleUnsubscribe(
                                    subscriber,
                                  )
                                }
                                disabled={
                                  Boolean(
                                    pendingActionId,
                                  )
                                }
                                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 disabled:opacity-50"
                              >
                                {isPending
                                  ? "Working..."
                                  : "Unsubscribe"}
                              </button>
                            ) : null}

                            {canDelete ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    subscriber,
                                  )
                                }
                                disabled={
                                  Boolean(
                                    pendingActionId,
                                  )
                                }
                                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
                              >
                                {isPending
                                  ? "Working..."
                                  : "Delete"}
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div>
                            <dt className={labelClassName}>
                              Subscribed
                            </dt>
                            <dd className="mt-1 text-sm text-slate-700">
                              {formatDateTime(
                                subscriber.subscribedAt,
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt className={labelClassName}>
                              Consent
                            </dt>
                            <dd className="mt-1 text-sm text-slate-700">
                              {formatDateTime(
                                subscriber.consentedAt,
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt className={labelClassName}>
                              Unsubscribed
                            </dt>
                            <dd className="mt-1 text-sm text-slate-700">
                              {formatDateTime(
                                subscriber.unsubscribedAt,
                              )}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    );
                  },
                )}
              </div>
            </div>
          ) : null}

          {!error &&
          safePages > 1 ? (
            <nav
              aria-label="Subscriber pagination"
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

export default AdminSubscribersPage;
