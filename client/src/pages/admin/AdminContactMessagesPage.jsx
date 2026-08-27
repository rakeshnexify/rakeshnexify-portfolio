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
  new: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  read: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  replied: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  archived: "border-slate-600 bg-slate-800 text-slate-400",
};


const labelClassName =
  "text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400";

const inputClassName =
  "mt-1.5 min-h-10 w-full rounded-lg border border-[#223147] bg-[#0a1422] px-3 text-xs text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

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

  useEffect(() => {
    function refreshWhenTabBecomesVisible() {
      if (document.visibilityState !== "visible") {
        return;
      }

      setRefreshKey((currentKey) => currentKey + 1);
    }

    document.addEventListener(
      "visibilitychange",
      refreshWhenTabBecomesVisible,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        refreshWhenTabBecomesVisible,
      );
    };
  }, []);

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
    <main className="min-h-screen bg-[#08111e] text-slate-200">
      <section className="mx-auto w-full max-w-[1640px] px-3 py-4 sm:px-5 lg:px-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-400">
              Enquiries
            </p>

            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">
              Contact Messages
            </h1>

            <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
              High-volume inbox for enquiries, follow-ups and Lead conversion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-[#1d2b3d] bg-[#0c1624] px-2.5 py-1.5 text-[10px] font-semibold text-slate-400">
              {totalMessages} total
            </span>

            <button
              className="inline-flex min-h-8 items-center justify-center rounded-md border border-[#27384e] bg-[#101c2c] px-2.5 text-[10px] font-semibold text-slate-300 transition hover:border-[#38506d] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              onClick={handleRefresh}
              type="button"
            >
              {isLoading ? "..." : "Refresh"}
            </button>
          </div>
        </header>

        <div
          aria-label="Contact message status filters"
          className="mt-3 flex flex-wrap gap-1.5"
        >
          {Object.keys(statusLabels).map((status) => {
            const isActive = appliedFilters.status === status;

            return (
              <button
                aria-pressed={isActive}
                className={`inline-flex min-h-7 items-center gap-1.5 rounded-md border px-2 text-[9px] font-bold transition ${
                  isActive
                    ? "border-blue-500/50 bg-blue-500/15 text-blue-200"
                    : "border-[#26364b] bg-[#0c1624] text-slate-400 hover:border-[#38506d] hover:text-slate-200"
                }`}
                key={status}
                onClick={() => handleStatusCardClick(status)}
                type="button"
              >
                <span>{statusLabels[status]}</span>

                <span className="rnx-admin-status-count rounded px-1.5 py-0.5 tabular-nums">
                  {statusCounts[status] || 0}
                </span>
              </button>
            );
          })}
        </div>

        <form
          className="mt-3 rounded-lg border border-[#1d2b3d] bg-[#0c1624] p-2.5"
          onSubmit={handleFilterSubmit}
        >
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(300px,1.7fr)_150px_135px_auto]">
            <div>
              <label className="sr-only" htmlFor="contact-message-search">
                Search
              </label>

              <input
                className={`${inputClassName} !mt-0`}
                id="contact-message-search"
                name="search"
                onChange={handleFilterChange}
                placeholder="Search name, email, phone, subject or message..."
                type="search"
                value={formFilters.search}
              />
            </div>

            <div>
              <label className="sr-only" htmlFor="contact-status-filter">
                Status
              </label>

              <select
                className={`${inputClassName} !mt-0`}
                id="contact-status-filter"
                name="status"
                onChange={handleFilterChange}
                value={formFilters.status}
              >
                <option value="">All statuses</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="sr-only" htmlFor="contact-limit-filter">
                Per page
              </label>

              <select
                className={`${inputClassName} !mt-0`}
                id="contact-limit-filter"
                name="limit"
                onChange={handleFilterChange}
                value={formFilters.limit}
              >
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
            </div>

            <div className="flex gap-1.5">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-500 bg-blue-600 px-3.5 text-[10px] font-bold text-white transition hover:bg-blue-500"
                type="submit"
              >
                Apply
              </button>

              <button
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#27384e] bg-[#101c2c] px-3 text-[10px] font-semibold text-slate-300 transition hover:border-[#38506d] hover:text-white"
                onClick={handleClearFilters}
                type="button"
              >
                Clear
              </button>
            </div>
          </div>

          <details className="mt-1.5 rounded-md border border-[#1d2b3d] bg-[#0a1422]">
            <summary className="cursor-pointer list-none px-2.5 py-1.5 text-[9px] font-semibold text-slate-500">
              More Filters
            </summary>

            <div className="grid gap-2 border-t border-[#1d2b3d] px-2.5 py-2.5 md:grid-cols-3">
              <div>
                <label
                  className={labelClassName}
                  htmlFor="contact-service-filter"
                >
                  Service
                </label>

                <input
                  className={inputClassName}
                  id="contact-service-filter"
                  name="service"
                  onChange={handleFilterChange}
                  placeholder="Service"
                  type="text"
                  value={formFilters.service}
                />
              </div>

              <div>
                <label
                  className={labelClassName}
                  htmlFor="contact-source-filter"
                >
                  Source
                </label>

                <input
                  className={inputClassName}
                  id="contact-source-filter"
                  name="source"
                  onChange={handleFilterChange}
                  placeholder="portfolio-website"
                  type="text"
                  value={formFilters.source}
                />
              </div>

              <div>
                <label
                  className={labelClassName}
                  htmlFor="contact-sort-filter"
                >
                  Sort
                </label>

                <select
                  className={inputClassName}
                  id="contact-sort-filter"
                  name="sort"
                  onChange={handleFilterChange}
                  value={formFilters.sort}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>
          </details>
        </form>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[9px] font-semibold text-slate-500">
            {isLoading
              ? "Loading messages..."
              : `${resultCount} shown · ${totalMessages} matching · ${currentPage}/${totalPages}`}
          </p>

          {appliedFilters.status ? (
            <span className="text-[9px] font-semibold text-blue-300">
              {statusLabels[appliedFilters.status] || appliedFilters.status}
            </span>
          ) : null}
        </div>

        <div aria-live="polite">
          {successMessage ? (
            <div
              className="mt-2 rounded-md border border-emerald-500/20 bg-emerald-950/20 px-2.5 py-2 text-[10px] font-semibold text-emerald-300"
              role="status"
            >
              {successMessage}
            </div>
          ) : null}

          {error ? (
            <div
              className="mt-2 rounded-md border border-rose-500/20 bg-rose-950/20 px-2.5 py-2 text-[10px] text-rose-300"
              role="alert"
            >
              {error}

              <button
                className="ml-2 font-bold underline underline-offset-2"
                onClick={handleRefresh}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div
            aria-live="polite"
            className="mt-2 space-y-1"
            role="status"
          >
            <span className="sr-only">Loading contact messages...</span>

            {[1, 2, 3, 4, 5, 6].map((placeholder) => (
              <div
                className="h-[62px] animate-pulse rounded-lg border border-[#1d2b3d] bg-[#0c1624] motion-reduce:animate-none"
                key={placeholder}
              />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && messages.length === 0 ? (
          <div className="mt-2 rounded-lg border border-dashed border-[#26384f] bg-[#0a1422] px-4 py-7 text-center">
            <p className="text-sm font-bold text-slate-100">
              No contact messages found
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Change or clear the current filters.
            </p>
          </div>
        ) : null}

        {!isLoading && messages.length > 0 ? (
          <div className="mt-2 grid grid-cols-1 gap-1.5 lg:grid-cols-2">
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
                  className={`min-w-0 rounded-lg border border-[#1d2b3d] bg-[#0c1624] transition hover:border-[#2c405b] ${
                    isExpanded ? "lg:col-span-2" : ""
                  }`}
                  key={message._id}
                >
                  <div className="grid min-w-0 grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-2 px-2.5 py-2">
                    <div className="grid size-8 shrink-0 place-items-center rounded-md border border-[#26384f] bg-[#132238] text-[9px] font-bold text-blue-200">
                      {createInitials(message.name)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[8px] font-bold ${
                            statusClasses[message.status] ||
                            "border-slate-600 bg-slate-800 text-slate-400"
                          }`}
                        >
                          {statusLabel}
                        </span>

                        <h2 className="max-w-[22rem] truncate text-[11px] font-bold text-slate-100">
                          {message.subject}
                        </h2>

                        <span className="max-w-32 truncate text-[9px] font-semibold text-slate-400">
                          {message.name}
                        </span>

                        <span className="ml-auto hidden shrink-0 text-[8px] text-slate-600 xl:inline">
                          {formatDateTime(message.createdAt)}
                        </span>
                      </div>

                      <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[8px] text-slate-500">
                        <a
                          className="max-w-36 truncate hover:text-blue-300"
                          href={`mailto:${message.email}`}
                        >
                          {message.email}
                        </a>

                        {message.phone ? (
                          <a
                            className="max-w-32 truncate hover:text-slate-300"
                            href={`tel:${message.phone}`}
                          >
                            {message.phone}
                          </a>
                        ) : null}

                        <span className="max-w-32 truncate">
                          {message.serviceTitle ||
                            message.service ||
                            "No service"}
                        </span>

                        <span className="max-w-32 truncate">
                          {message.source || "portfolio-website"}
                        </span>

                        <span className="xl:hidden">
                          {formatDateTime(message.createdAt)}
                        </span>
                      </div>

                      <p className="mt-0.5 line-clamp-1 text-[9px] leading-3.5 text-slate-400">
                        {message.message}
                      </p>
                    </div>

                    <button
                      aria-controls={messagePanelId}
                      aria-expanded={isExpanded}
                      className="inline-flex min-h-7 shrink-0 items-center justify-center rounded-md border border-[#27384e] bg-[#101c2c] px-2 text-[9px] font-bold text-slate-300 transition hover:border-blue-500/50 hover:text-white"
                      onClick={() =>
                        setExpandedMessageId(isExpanded ? "" : message._id)
                      }
                      type="button"
                    >
                      {isExpanded ? "Close" : "Open"}
                    </button>
                  </div>

                  {isExpanded ? (
                    <div
                      className="border-t border-[#1d2b3d] px-2.5 pb-2.5 pt-2"
                      id={messagePanelId}
                    >
                      <div className="grid gap-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
                        <section className="min-w-0 rounded-lg border border-[#1d2b3d] bg-[#09131f] p-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                              Full Message
                            </p>

                            <span className="text-[8px] text-slate-600">
                              {formatDateTime(message.createdAt)}
                            </span>
                          </div>

                          <p className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-300">
                            {message.message}
                          </p>

                          <div className="mt-2 grid gap-1.5 text-[9px] text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                            <span>
                              Read: {formatDateTime(message.readAt)}
                            </span>

                            <span>
                              Replied: {formatDateTime(message.repliedAt)}
                            </span>

                            <span>
                              Archived: {formatDateTime(message.archivedAt)}
                            </span>

                            <span>
                              Updated: {formatDateTime(message.statusUpdatedAt)}
                            </span>
                          </div>
                        </section>

                        <section className="rounded-lg border border-[#1d2b3d] bg-[#09131f] p-2.5">
                          <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] xl:grid-cols-1">
                            <div>
                              <label
                                className={labelClassName}
                                htmlFor={`message-status-${message._id}`}
                              >
                                Status
                              </label>

                              <select
                                className={inputClassName}
                                disabled={Boolean(actionKey)}
                                id={`message-status-${message._id}`}
                                onChange={(event) =>
                                  handleStatusChange(
                                    message,
                                    event.target.value,
                                  )
                                }
                                value={message.status}
                              >
                                <option value="new">New</option>
                                <option value="read">Read</option>
                                <option value="replied">Replied</option>
                                <option value="archived">Archived</option>
                              </select>

                              {isStatusAction ? (
                                <p
                                  className="mt-1 text-[9px] font-semibold text-blue-300"
                                  role="status"
                                >
                                  Updating...
                                </p>
                              ) : null}
                            </div>

                            <div>
                              <label
                                className={labelClassName}
                                htmlFor={`message-note-${message._id}`}
                              >
                                Private Note
                              </label>

                              <textarea
                                className={`${inputClassName} min-h-20 resize-y py-2 leading-4`}
                                id={`message-note-${message._id}`}
                                maxLength={3000}
                                onChange={(event) =>
                                  handleNoteChange(
                                    message._id,
                                    event.target.value,
                                  )
                                }
                                placeholder="Private follow-up note..."
                                rows="3"
                                value={noteDrafts[message._id] || ""}
                              />

                              <div className="mt-1 flex items-center justify-between gap-2">
                                <span className="text-[8px] text-slate-600">
                                  {(noteDrafts[message._id] || "").length}/3000
                                </span>

                                <button
                                  className="inline-flex min-h-7 items-center justify-center rounded-md border border-[#27384e] bg-[#101c2c] px-2 text-[9px] font-bold text-slate-300 hover:text-white disabled:opacity-50"
                                  disabled={Boolean(actionKey)}
                                  onClick={() => handleSaveNote(message)}
                                  type="button"
                                >
                                  {isNoteAction ? "Saving..." : "Save Note"}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap justify-end gap-1.5 border-t border-[#1d2b3d] pt-2">
                            <button
                              className="inline-flex min-h-7 items-center justify-center rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 text-[9px] font-bold text-blue-200 transition hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={
                                Boolean(actionKey) || !canConvertMessages
                              }
                              onClick={() => handleConvertToLead(message)}
                              title={
                                canConvertMessages
                                  ? "Convert this Contact Message to a CRM Lead"
                                  : "Your role cannot convert Contact Messages to Leads"
                              }
                              type="button"
                            >
                              {isConvertAction
                                ? "Converting..."
                                : "Convert to Lead"}
                            </button>

                            <button
                              className="rnx-admin-delete-action inline-flex min-h-7 items-center justify-center rounded-md border px-2.5 text-[9px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40"
                              disabled={
                                Boolean(actionKey) || !canDeleteMessages
                              }
                              onClick={() => handleDeleteMessage(message)}
                              title={
                                canDeleteMessages
                                  ? "Permanently delete contact message"
                                  : "Your role cannot permanently delete contact messages"
                              }
                              type="button"
                            >
                              {isDeleteAction ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </section>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}

        {!isLoading && !error && totalPages > 1 ? (
          <nav
            aria-label="Contact messages pagination"
            className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-[#1d2b3d] bg-[#0c1624] p-2"
          >
            <button
              className="inline-flex min-h-8 items-center justify-center rounded-md border border-[#27384e] bg-[#101c2c] px-2.5 text-[9px] font-semibold text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              type="button"
            >
              Previous
            </button>

            <span className="text-[9px] font-semibold text-slate-500">
              {currentPage} / {totalPages} · {totalMessages} results
            </span>

            <button
              className="inline-flex min-h-8 items-center justify-center rounded-md border border-blue-500 bg-blue-600 px-2.5 text-[9px] font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
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

export default AdminContactMessagesPage;
