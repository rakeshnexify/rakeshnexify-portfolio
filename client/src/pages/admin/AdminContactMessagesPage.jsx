import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";

import {
  convertAdminContactMessageToLead,
  deleteAdminContactMessage,
  fetchAdminContactMessages,
  updateAdminContactMessage,
} from "../../services/adminContactMessagesApi";

const initialFilters = {
  search: "",
  status: "",
  service: "",
  source: "",
  sort: "newest",
  limit: "20",
  page: 1,
};

const statusLabels = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

const statusClasses = {
  new: "border-blue-200 bg-blue-50 text-blue-700",
  read: "border-amber-200 bg-amber-50 text-amber-700",
  replied: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-slate-300 bg-slate-100 text-slate-600",
};

const statusCardClasses = {
  new: "border-blue-200 bg-blue-50 text-blue-800",
  read: "border-amber-200 bg-amber-50 text-amber-800",
  replied: "border-emerald-200 bg-emerald-50 text-emerald-800",
  archived: "border-slate-300 bg-slate-100 text-slate-700",
};

const labelClassName =
  "text-xs font-bold uppercase tracking-[0.14em] text-slate-500";

const inputClassName =
  "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 motion-reduce:transition-none";

function createApiFilters(filters) {
  return {
    search: filters.search.trim(),
    status: filters.status,
    service: filters.service.trim(),
    source: filters.source.trim(),
    sort: filters.sort,
    limit: Number(filters.limit) || 20,
    page: Number(filters.page) || 1,
  };
}

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function createInitials(name) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "CM";
}

function createNoteDrafts(messages) {
  return Object.fromEntries(
    messages.map((message) => [message._id, message.adminNote || ""]),
  );
}

function AdminContactMessagesPage() {
  const navigate = useNavigate();
  const { accessToken, admin, logout } = useAdminAuth();

  const [formFilters, setFormFilters] = useState({
    ...initialFilters,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    ...initialFilters,
  });

  const [messages, setMessages] = useState([]);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [resultCount, setResultCount] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [statusCounts, setStatusCounts] = useState({
    new: 0,
    read: 0,
    replied: 0,
    archived: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionKey, setActionKey] = useState("");
  const [expandedMessageId, setExpandedMessageId] = useState("");

  const apiFilters = useMemo(
    () => createApiFilters(appliedFilters),
    [appliedFilters],
  );

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadContactMessages() {
      try {
        const response = await fetchAdminContactMessages(
          accessToken,
          apiFilters,
          {
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) {
          return;
        }

        setMessages(response.messages);
        setNoteDrafts(createNoteDrafts(response.messages));
        setResultCount(response.count);
        setTotalMessages(response.total);
        setTotalPages(response.totalPages);
        setStatusCounts(response.statusCounts);
        setError("");
      } catch (requestError) {
        if (controller.signal.aborted || requestError?.name === "AbortError") {
          return;
        }

        if (requestError?.status === 401) {
          logout();

          navigate("/admin/login", {
            replace: true,
            state: {
              from: {
                pathname: "/admin/contact-messages",
              },
            },
          });

          return;
        }

        console.error("Admin contact messages loading failed:", requestError);

        setMessages([]);
        setNoteDrafts({});
        setResultCount(0);
        setTotalMessages(0);
        setTotalPages(1);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Contact messages could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadContactMessages();

    return () => {
      controller.abort();
    };
  }, [accessToken, apiFilters, logout, navigate, refreshKey]);

  function handleAuthenticationError(requestError) {
    if (requestError?.status !== 401) {
      return false;
    }

    logout();

    navigate("/admin/login", {
      replace: true,
      state: {
        from: {
          pathname: "/admin/contact-messages",
        },
      },
    });

    return true;
  }

  function handleActionError(requestError) {
    if (handleAuthenticationError(requestError)) {
      return;
    }

    console.error("Admin contact message action failed:", requestError);

    setError(
      requestError instanceof Error
        ? requestError.message
        : "Contact message action could not be completed.",
    );
  }

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  }

  function handleFilterSubmit(event) {
    event.preventDefault();

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    setAppliedFilters({
      ...formFilters,
      page: 1,
    });

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      page: 1,
    }));
  }

  function handleClearFilters() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setExpandedMessageId("");

    setFormFilters({
      ...initialFilters,
    });

    setAppliedFilters({
      ...initialFilters,
    });
  }

  function handleRefresh() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    setRefreshKey((currentKey) => currentKey + 1);
  }

  function handleStatusCardClick(status) {
    const nextStatus = appliedFilters.status === status ? "" : status;

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      status: nextStatus,
      page: 1,
    }));

    setAppliedFilters((currentFilters) => ({
      ...currentFilters,
      status: nextStatus,
      page: 1,
    }));
  }

  function handlePageChange(nextPage) {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === appliedFilters.page
    ) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    setExpandedMessageId("");

    setAppliedFilters((currentFilters) => ({
      ...currentFilters,
      page: nextPage,
    }));

    setFormFilters((currentFilters) => ({
      ...currentFilters,
      page: nextPage,
    }));

    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  function handleNoteChange(messageId, value) {
    setNoteDrafts((currentDrafts) => ({
      ...currentDrafts,
      [messageId]: value,
    }));
  }

  async function handleStatusChange(message, nextStatus) {
    if (!message?._id || !nextStatus || actionKey) {
      return;
    }

    const currentActionKey = `status-${message._id}`;

    try {
      setActionKey(currentActionKey);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminContactMessage(
        accessToken,
        message._id,
        {
          status: nextStatus,
        },
      );

      setSuccessMessage(
        `"${response.contactMessage.subject}" status changed to ${
          statusLabels[response.contactMessage.status] ||
          response.contactMessage.status
        }.`,
      );

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionKey("");
    }
  }

  async function handleSaveNote(message) {
    if (!message?._id || actionKey) {
      return;
    }

    const currentActionKey = `note-${message._id}`;

    try {
      setActionKey(currentActionKey);
      setError("");
      setSuccessMessage("");

      const response = await updateAdminContactMessage(
        accessToken,
        message._id,
        {
          adminNote: noteDrafts[message._id] || "",
        },
      );

      setSuccessMessage(
        `Admin note for "${response.contactMessage.subject}" was saved.`,
      );

      setMessages((currentMessages) =>
        currentMessages.map((currentMessage) =>
          currentMessage._id === message._id
            ? response.contactMessage
            : currentMessage,
        ),
      );

      setNoteDrafts((currentDrafts) => ({
        ...currentDrafts,
        [message._id]: response.contactMessage.adminNote || "",
      }));
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionKey("");
    }
  }

  async function handleConvertToLead(message) {
    if (!message?._id || actionKey) {
      return;
    }

    const isConfirmed = window.confirm(
      `Convert the enquiry from "${message.name}" into a CRM Lead?\n\nSubject: ${message.subject}\n\nThe original Contact Message will remain unchanged.`,
    );

    if (!isConfirmed) {
      return;
    }

    const currentActionKey = `convert-${message._id}`;

    try {
      setActionKey(currentActionKey);
      setError("");
      setSuccessMessage("");

      const response = await convertAdminContactMessageToLead(
        accessToken,
        message._id,
      );

      const createdLead = response.lead;

      if (!createdLead?._id) {
        throw new Error(
          "The Lead was created, but its ID was not returned by the server.",
        );
      }

      navigate(`/admin/leads/${createdLead._id}/edit`, {
        state: {
          successMessage:
            response.message ||
            `The enquiry from "${message.name}" was converted to a Lead.`,
        },
      });
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionKey("");
    }
  }

  async function handleDeleteMessage(message) {
    if (!message?._id || actionKey) {
      return;
    }

    const isConfirmed = window.confirm(
      `Permanently delete the enquiry from "${message.name}"?\n\nSubject: ${message.subject}\n\nThis action cannot be undone.`,
    );

    if (!isConfirmed) {
      return;
    }

    const currentActionKey = `delete-${message._id}`;

    try {
      setActionKey(currentActionKey);
      setError("");
      setSuccessMessage("");

      const response = await deleteAdminContactMessage(
        accessToken,
        message._id,
      );

      setSuccessMessage(
        `The enquiry from "${response.deletedContactMessage.name}" was permanently deleted.`,
      );

      if (expandedMessageId === message._id) {
        setExpandedMessageId("");
      }

      setRefreshKey((currentKey) => currentKey + 1);
    } catch (requestError) {
      handleActionError(requestError);
    } finally {
      setActionKey("");
    }
  }

  const canConvertMessages = ["super-admin", "admin", "editor"].includes(
    admin?.role,
  );

  const canDeleteMessages = ["super-admin", "admin"].includes(admin?.role);

  const currentPage = Number(appliedFilters.page) || 1;

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">
            Enquiry Management
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Contact Messages
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Review incoming enquiries, manage their progress, keep private
            follow-up notes and convert qualified conversations into CRM Leads.
          </p>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Object.keys(statusLabels).map((status) => {
            const isActive = appliedFilters.status === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusCardClick(status)}
                aria-pressed={isActive}
                className={`rounded-2xl border p-4 text-left transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none ${
                  statusCardClasses[status]
                } ${isActive ? "ring-2 ring-brand-500 ring-offset-2" : ""}`}
              >
                <span className="text-xs font-bold uppercase tracking-[0.12em]">
                  {statusLabels[status]}
                </span>

                <span className="mt-2 block text-2xl font-bold">
                  {statusCounts[status] || 0}
                </span>
              </button>
            );
          })}
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label
                htmlFor="contact-message-search"
                className={labelClassName}
              >
                Search
              </label>

              <input
                id="contact-message-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Name, email, phone, subject or message"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="contact-status-filter"
                className={labelClassName}
              >
                Status
              </label>

              <select
                id="contact-status-filter"
                name="status"
                value={formFilters.status}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="">All statuses</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="contact-service-filter"
                className={labelClassName}
              >
                Service
              </label>

              <input
                id="contact-service-filter"
                name="service"
                type="text"
                value={formFilters.service}
                onChange={handleFilterChange}
                placeholder="Frontend Development"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="contact-source-filter"
                className={labelClassName}
              >
                Source
              </label>

              <input
                id="contact-source-filter"
                name="source"
                type="text"
                value={formFilters.source}
                onChange={handleFilterChange}
                placeholder="portfolio-website"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="contact-sort-filter" className={labelClassName}>
                Sort order
              </label>

              <select
                id="contact-sort-filter"
                name="sort"
                value={formFilters.sort}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>

            <div>
              <label htmlFor="contact-limit-filter" className={labelClassName}>
                Per page
              </label>

              <select
                id="contact-limit-filter"
                name="limit"
                value={formFilters.limit}
                onChange={handleFilterChange}
                className={inputClassName}
              >
                <option value="10">10 messages</option>
                <option value="20">20 messages</option>
                <option value="50">50 messages</option>
                <option value="100">100 messages</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              Clear
            </button>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {isLoading
                ? "Loading contact messages..."
                : `${resultCount} message${resultCount === 1 ? "" : "s"} shown`}
            </p>

            {!isLoading && (
              <p className="mt-1 text-xs text-slate-500">
                {totalMessages} matching result
                {totalMessages === 1 ? "" : "s"} · Page {currentPage} of{" "}
                {totalPages}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            Refresh
          </button>
        </div>

        <div aria-live="polite">
          {successMessage && (
            <div
              role="status"
              className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700"
            >
              {successMessage}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <p className="font-medium leading-6">{error}</p>

              <button
                type="button"
                onClick={handleRefresh}
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="mt-5 space-y-4"
          >
            <span className="sr-only">Loading contact messages...</span>

            {[1, 2, 3, 4].map((placeholder) => (
              <div
                key={placeholder}
                className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-base font-bold text-slate-950">
              No contact messages found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Change or clear the current filters to look for other enquiries.
            </p>
          </div>
        )}

        {!isLoading && messages.length > 0 && (
          <div className="mt-5 space-y-4">
            {messages.map((message) => {
              const isExpanded = expandedMessageId === message._id;

              const statusLabel =
                statusLabels[message.status] || message.status || "Message";

              const isStatusAction = actionKey === `status-${message._id}`;
              const isNoteAction = actionKey === `note-${message._id}`;
              const isConvertAction = actionKey === `convert-${message._id}`;
              const isDeleteAction = actionKey === `delete-${message._id}`;

              const messagePanelId = `contact-message-panel-${message._id}`;

              return (
                <article
                  key={message._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
                          {createInitials(message.name)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="break-words text-base font-bold text-slate-950 sm:text-lg">
                              {message.name}
                            </h2>

                            <span
                              className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                                statusClasses[message.status] ||
                                "border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <p className="mt-1 break-words text-sm font-semibold text-brand-700">
                            {message.subject}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {message.serviceTitle ||
                              message.service ||
                              "Service not specified"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-sm lg:text-right">
                        <p className="font-semibold text-slate-700">
                          {formatDateTime(message.createdAt)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {message.source || "portfolio-website"}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="min-w-0 bg-slate-50 p-3.5">
                        <dt className={labelClassName}>Email</dt>

                        <dd className="mt-1.5 min-w-0">
                          <a
                            href={`mailto:${message.email}`}
                            className="break-all text-sm font-semibold text-slate-700 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                          >
                            {message.email}
                          </a>
                        </dd>
                      </div>

                      <div className="min-w-0 bg-slate-50 p-3.5">
                        <dt className={labelClassName}>Phone</dt>

                        <dd className="mt-1.5 min-w-0">
                          {message.phone ? (
                            <a
                              href={`tel:${message.phone}`}
                              className="break-all text-sm font-semibold text-slate-700 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                            >
                              {message.phone}
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-slate-500">
                              Not provided
                            </span>
                          )}
                        </dd>
                      </div>

                      <div className="min-w-0 bg-slate-50 p-3.5 sm:col-span-2 lg:col-span-1">
                        <dt className={labelClassName}>Service slug</dt>

                        <dd className="mt-1.5 break-all text-sm font-semibold text-slate-700">
                          {message.service || "Not specified"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p
                        className={`whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 ${
                          isExpanded ? "" : "line-clamp-3"
                        }`}
                      >
                        {message.message}
                      </p>

                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={messagePanelId}
                        onClick={() =>
                          setExpandedMessageId(isExpanded ? "" : message._id)
                        }
                        className="mt-3 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                      >
                        {isExpanded ? "Show Less" : "View Full Message"}
                      </button>
                    </div>

                    {isExpanded && (
                      <div
                        id={messagePanelId}
                        className="mt-4 grid gap-4 xl:grid-cols-2"
                      >
                        <section className="rounded-xl border border-slate-200 p-4">
                          <div>
                            <label
                              htmlFor={`message-status-${message._id}`}
                              className={labelClassName}
                            >
                              Message status
                            </label>

                            <select
                              id={`message-status-${message._id}`}
                              value={message.status}
                              onChange={(event) =>
                                handleStatusChange(message, event.target.value)
                              }
                              disabled={Boolean(actionKey)}
                              className={inputClassName}
                            >
                              <option value="new">New</option>
                              <option value="read">Read</option>
                              <option value="replied">Replied</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>

                          {isStatusAction && (
                            <p
                              role="status"
                              className="mt-3 text-sm font-semibold text-brand-700"
                            >
                              Updating status...
                            </p>
                          )}

                          <dl className="mt-4 divide-y divide-slate-100 border-y border-slate-100 text-sm">
                            <div className="flex items-center justify-between gap-4 py-2.5">
                              <dt className="text-slate-500">Read</dt>
                              <dd className="text-right font-semibold text-slate-700">
                                {formatDateTime(message.readAt)}
                              </dd>
                            </div>

                            <div className="flex items-center justify-between gap-4 py-2.5">
                              <dt className="text-slate-500">Replied</dt>
                              <dd className="text-right font-semibold text-slate-700">
                                {formatDateTime(message.repliedAt)}
                              </dd>
                            </div>

                            <div className="flex items-center justify-between gap-4 py-2.5">
                              <dt className="text-slate-500">Archived</dt>
                              <dd className="text-right font-semibold text-slate-700">
                                {formatDateTime(message.archivedAt)}
                              </dd>
                            </div>

                            <div className="flex items-center justify-between gap-4 py-2.5">
                              <dt className="text-slate-500">
                                Last status update
                              </dt>
                              <dd className="text-right font-semibold text-slate-700">
                                {formatDateTime(message.statusUpdatedAt)}
                              </dd>
                            </div>
                          </dl>
                        </section>

                        <section className="rounded-xl border border-slate-200 p-4">
                          <label
                            htmlFor={`message-note-${message._id}`}
                            className={labelClassName}
                          >
                            Private admin note
                          </label>

                          <textarea
                            id={`message-note-${message._id}`}
                            value={noteDrafts[message._id] || ""}
                            onChange={(event) =>
                              handleNoteChange(message._id, event.target.value)
                            }
                            rows="6"
                            maxLength={3000}
                            placeholder="Add private follow-up details, pricing notes or other important information."
                            className="mt-2 min-h-36 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 motion-reduce:transition-none"
                          />

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs text-slate-500">
                              {(noteDrafts[message._id] || "").length}/3000
                            </span>

                            <button
                              type="button"
                              onClick={() => handleSaveNote(message)}
                              disabled={Boolean(actionKey)}
                              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-800 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                            >
                              {isNoteAction ? "Saving..." : "Save Admin Note"}
                            </button>
                          </div>
                        </section>

                        <section className="flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between xl:col-span-2">
                          <div>
                            <h3 className="font-bold text-brand-900">
                              CRM Lead conversion
                            </h3>

                            <p className="mt-1 max-w-3xl text-sm leading-6 text-brand-700">
                              Create a CRM Lead from this enquiry while keeping
                              the original Contact Message unchanged.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleConvertToLead(message)}
                            disabled={Boolean(actionKey) || !canConvertMessages}
                            title={
                              canConvertMessages
                                ? "Convert this Contact Message to a CRM Lead"
                                : "Your role cannot convert Contact Messages to Leads"
                            }
                            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                          >
                            {isConvertAction
                              ? "Converting..."
                              : "Convert to Lead"}
                          </button>
                        </section>

                        <section className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between xl:col-span-2">
                          <div>
                            <h3 className="font-bold text-red-800">
                              Permanent deletion
                            </h3>

                            <p className="mt-1 max-w-3xl text-sm leading-6 text-red-700">
                              Permanently deleting this enquiry cannot be
                              undone.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(message)}
                            disabled={Boolean(actionKey) || !canDeleteMessages}
                            title={
                              canDeleteMessages
                                ? "Permanently delete contact message"
                                : "Your role cannot permanently delete contact messages"
                            }
                            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-white px-5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                          >
                            {isDeleteAction ? "Deleting..." : "Delete Message"}
                          </button>
                        </section>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && !error && totalPages > 1 && (
          <nav
            aria-label="Contact messages pagination"
            className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"
          >
            <p className="text-sm font-semibold text-slate-600">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}

export default AdminContactMessagesPage;