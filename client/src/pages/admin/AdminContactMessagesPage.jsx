import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router";

import useAdminAuth from "../../hooks/useAdminAuth";

import {
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

        setMessages(response.messages);

        setNoteDrafts(createNoteDrafts(response.messages));

        setResultCount(response.count);

        setTotalMessages(response.total);

        setTotalPages(response.totalPages);

        setStatusCounts(response.statusCounts);

        setError("");
      } catch (requestError) {
        if (requestError?.name === "AbortError") {
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
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

  function handleLogout() {
    logout();

    navigate("/admin/login", {
      replace: true,
    });
  }

  const canDeleteMessages = ["super-admin", "admin"].includes(admin?.role);

  const currentPage = Number(appliedFilters.page) || 1;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
          <Link
            to="/admin/dashboard"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-600 font-extrabold text-white">
              RN
            </div>

            <div className="min-w-0">
              <p className="truncate font-extrabold text-slate-950">
                RakeshNexify
              </p>

              <p className="truncate text-xs font-medium text-slate-500">
                Contact Messages
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-slate-500 md:inline">
              {admin?.name}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
          >
            <span aria-hidden="true">←</span>
            Dashboard
          </Link>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
            Enquiry Management
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Contact Messages
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            Review project enquiries, update their progress, save private admin
            notes and archive completed conversations.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Object.keys(statusLabels).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusCardClick(status)}
              className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                statusCardClasses[status]
              } ${
                appliedFilters.status === status
                  ? "ring-2 ring-brand-500 ring-offset-2"
                  : ""
              }`}
            >
              <p className="text-sm font-bold">{statusLabels[status]}</p>

              <p className="mt-3 text-3xl font-black">
                {statusCounts[status] || 0}
              </p>
            </button>
          ))}
        </div>

        <form
          onSubmit={handleFilterSubmit}
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="md:col-span-2 xl:col-span-1">
              <label
                htmlFor="contact-message-search"
                className="text-sm font-semibold text-slate-700"
              >
                Search messages
              </label>

              <input
                id="contact-message-search"
                name="search"
                type="search"
                value={formFilters.search}
                onChange={handleFilterChange}
                placeholder="Name, email, phone, subject or message"
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="contact-status-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Status
              </label>

              <select
                id="contact-status-filter"
                name="status"
                value={formFilters.status}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
                className="text-sm font-semibold text-slate-700"
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
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="contact-source-filter"
                className="text-sm font-semibold text-slate-700"
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
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </div>

            <div>
              <label
                htmlFor="contact-sort-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Sort order
              </label>

              <select
                id="contact-sort-filter"
                name="sort"
                value={formFilters.sort}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="contact-limit-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Messages per page
              </label>

              <select
                id="contact-limit-filter"
                name="limit"
                value={formFilters.limit}
                onChange={handleFilterChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              >
                <option value="10">10 messages</option>
                <option value="20">20 messages</option>
                <option value="50">50 messages</option>
                <option value="100">100 messages</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
            >
              Clear Filters
            </button>

            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Apply Filters
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-600">
              {isLoading
                ? "Loading contact messages..."
                : `${resultCount} message(s) shown`}
            </p>

            {!isLoading && (
              <p className="mt-1 text-xs text-slate-400">
                {totalMessages} matching result(s) · Page {currentPage} of{" "}
                {totalPages}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Refresh
          </button>
        </div>

        {successMessage && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
          >
            <p className="text-sm font-semibold leading-6 text-emerald-700">
              {successMessage}
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5"
          >
            <p className="text-sm font-semibold text-red-700">{error}</p>

            <button
              type="button"
              onClick={handleRefresh}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Try Again
            </button>
          </div>
        )}

        {isLoading && (
          <div className="mt-6 space-y-5">
            {[1, 2, 3, 4].map((placeholder) => (
              <div
                key={placeholder}
                className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-lg font-bold text-slate-950">
              No contact messages found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Try changing or clearing the current filters.
            </p>
          </div>
        )}

        {!isLoading && messages.length > 0 && (
          <div className="mt-6 space-y-5">
            {messages.map((message) => {
              const isExpanded = expandedMessageId === message._id;

              const statusLabel =
                statusLabels[message.status] || message.status || "Message";

              const isStatusAction = actionKey === `status-${message._id}`;

              const isNoteAction = actionKey === `note-${message._id}`;

              const isDeleteAction = actionKey === `delete-${message._id}`;

              return (
                <article
                  key={message._id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 font-black text-brand-700">
                          {createInitials(message.name)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-950">
                              {message.name}
                            </h2>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                                statusClasses[message.status] ||
                                "border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <p className="mt-2 break-words text-sm font-semibold text-brand-600">
                            {message.subject}
                          </p>

                          <p className="mt-2 text-sm text-slate-500">
                            {message.serviceTitle ||
                              message.service ||
                              "Service not specified"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-left lg:text-right">
                        <p className="text-sm font-semibold text-slate-600">
                          {formatDateTime(message.createdAt)}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {message.source || "portfolio-website"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <a
                        href={`mailto:${message.email}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-brand-300 hover:bg-brand-50"
                      >
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                          Email
                        </span>

                        <span className="mt-2 block break-all text-sm font-semibold text-slate-700">
                          {message.email}
                        </span>
                      </a>

                      {message.phone ? (
                        <a
                          href={`tel:${message.phone}`}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-brand-300 hover:bg-brand-50"
                        >
                          <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                            Phone
                          </span>

                          <span className="mt-2 block break-all text-sm font-semibold text-slate-700">
                            {message.phone}
                          </span>
                        </a>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                            Phone
                          </span>

                          <span className="mt-2 block text-sm font-semibold text-slate-400">
                            Not provided
                          </span>
                        </div>
                      )}

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2 lg:col-span-1">
                        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                          Service slug
                        </span>

                        <span className="mt-2 block break-all text-sm font-semibold text-slate-700">
                          {message.service}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p
                        className={`whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 ${
                          isExpanded ? "" : "line-clamp-3"
                        }`}
                      >
                        {message.message}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedMessageId(isExpanded ? "" : message._id)
                        }
                        className="mt-3 text-sm font-bold text-brand-600 transition hover:text-brand-700"
                      >
                        {isExpanded ? "Show Less" : "View Full Message"}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-5 grid gap-5 xl:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 p-5">
                          <label
                            htmlFor={`message-status-${message._id}`}
                            className="text-sm font-bold text-slate-800"
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
                            className="mt-3 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="new">New</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                            <option value="archived">Archived</option>
                          </select>

                          {isStatusAction && (
                            <p className="mt-3 text-sm font-semibold text-brand-600">
                              Updating status...
                            </p>
                          )}

                          <div className="mt-5 space-y-2 text-xs text-slate-500">
                            <p>Read: {formatDateTime(message.readAt)}</p>

                            <p>Replied: {formatDateTime(message.repliedAt)}</p>

                            <p>
                              Archived: {formatDateTime(message.archivedAt)}
                            </p>

                            <p>
                              Last status update:{" "}
                              {formatDateTime(message.statusUpdatedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-5">
                          <label
                            htmlFor={`message-note-${message._id}`}
                            className="text-sm font-bold text-slate-800"
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
                            className="mt-3 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                          />

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs text-slate-400">
                              {(noteDrafts[message._id] || "").length}
                              /3000
                            </span>

                            <button
                              type="button"
                              onClick={() => handleSaveNote(message)}
                              disabled={Boolean(actionKey)}
                              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isNoteAction ? "Saving..." : "Save Admin Note"}
                            </button>
                          </div>
                        </div>

                        <div className="xl:col-span-2 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-bold text-red-800">
                              Permanent deletion
                            </p>

                            <p className="mt-1 text-sm leading-6 text-red-700">
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
                            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-red-300 bg-white px-5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleteAction ? "Deleting..." : "Delete Message"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && !error && totalPages > 1 && (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row">
            <p className="text-sm font-semibold text-slate-600">
              Page {currentPage} of {totalPages}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminContactMessagesPage;
