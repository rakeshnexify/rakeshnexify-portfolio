import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router";

import useAdminAuth from "../../../hooks/useAdminAuth";
import useAdminNotifications from "../../../hooks/useAdminNotifications";
import { AdminIcon } from "./adminIcons";

const NOTIFICATION_ICON_BY_TYPE = {
  "contact-message": "messages",
  lead: "leads",
  "service-order": "orders",
  appointment: "appointments",
};

function getNotificationIcon(type) {
  return (
    NOTIFICATION_ICON_BY_TYPE[type] ||
    "bell"
  );
}

function getSafeTargetPath(value) {
  const targetPath = String(value || "").trim();

  return targetPath.startsWith("/admin/")
    ? targetPath
    : "/admin";
}

function formatNotificationTime(value) {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return "Just now";
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor(
      (Date.now() - timestamp.getTime()) /
        1000,
    ),
  );

  if (elapsedSeconds < 60) {
    return "Just now";
  }

  const elapsedMinutes = Math.floor(
    elapsedSeconds / 60,
  );

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(
    elapsedMinutes / 60,
  );

  if (elapsedHours < 24) {
    return `${elapsedHours}h ago`;
  }

  const elapsedDays = Math.floor(
    elapsedHours / 24,
  );

  if (elapsedDays < 7) {
    return `${elapsedDays}d ago`;
  }

  return timestamp.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
    },
  );
}

function getNotificationDateTitle(value) {
  const timestamp = new Date(value);

  return Number.isNaN(timestamp.getTime())
    ? ""
    : timestamp.toLocaleString();
}

function AdminNotificationsMenu() {
  const navigate = useNavigate();
  const { accessToken } = useAdminAuth();

  const [isOpen, setIsOpen] = useState(false);

  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    actionError,
    pendingNotificationId,
    isMarkingAll,
    refreshNotifications,
    clearActionError,
    markAsRead,
    markAllAsRead,
  } = useAdminNotifications(
    accessToken,
    {
      enabled: Boolean(accessToken),
      limit: 12,
    },
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        !wrapperRef.current?.contains(
          event.target,
        )
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
      true,
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
        true,
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen]);

  function handleToggle() {
    const nextOpen = !isOpen;

    clearActionError();
    setIsOpen(nextOpen);

    if (nextOpen) {
      refreshNotifications();
    }
  }

  function handleRetry() {
    clearActionError();
    refreshNotifications();
  }

  function handleOpenNotification(
    notification,
  ) {
    const targetPath = getSafeTargetPath(
      notification?.targetPath,
    );

    setIsOpen(false);
    navigate(targetPath);

    if (!notification?.isRead) {
      void markAsRead(
        notification?._id,
      ).catch(() => {});
    }
  }

  function handleMarkRead(
    event,
    notificationId,
  ) {
    event.stopPropagation();

    void markAsRead(notificationId).catch(
      () => {},
    );
  }

  function handleMarkAllRead() {
    void markAllAsRead().catch(() => {});
  }

  const badgeText =
    unreadCount > 99
      ? "99+"
      : String(unreadCount);

  return (
    <div
      className="admin-notification-menu relative"
      ref={wrapperRef}
    >
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className="admin-reference-icon-button relative inline-flex size-10 shrink-0 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        onClick={handleToggle}
        ref={triggerRef}
        title="Notifications"
        type="button"
      >
        <AdminIcon name="bell" size={18} />

        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="admin-notification-badge absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black leading-5"
          >
            {badgeText}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <section
          aria-label="Admin notifications"
          className="admin-notification-panel fixed inset-x-3 top-[70px] z-[70] overflow-hidden rounded-2xl border sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.65rem)] sm:w-[390px]"
          role="dialog"
        >
          <div className="admin-notification-header flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-black">
                Notifications
              </p>

              <p className="mt-0.5 text-[10px]">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You are all caught up"}
              </p>
            </div>

            <button
              className="admin-notification-mark-all shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={
                unreadCount === 0 ||
                isMarkingAll
              }
              onClick={handleMarkAllRead}
              type="button"
            >
              {isMarkingAll
                ? "Marking..."
                : "Mark all read"}
            </button>
          </div>

          {actionError ? (
            <div
              className="admin-notification-error border-b px-4 py-2.5 text-[11px] font-semibold"
              role="alert"
            >
              {actionError.message}
            </div>
          ) : null}

          {error ? (
            <div
              className="admin-notification-state px-5 py-8 text-center"
              role="alert"
            >
              <span className="mx-auto flex size-10 items-center justify-center rounded-xl">
                <AdminIcon
                  name="bell"
                  size={18}
                />
              </span>

              <p className="mt-3 text-xs font-bold">
                Notifications unavailable
              </p>

              <p className="mt-1 text-[10px]">
                {error.message}
              </p>

              <button
                className="admin-notification-retry mt-3 rounded-lg px-3 py-2 text-[10px] font-bold"
                onClick={handleRetry}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : null}

          {!error &&
          isLoading &&
          notifications.length === 0 ? (
            <div
              aria-label="Loading notifications"
              className="space-y-1.5 p-2"
              role="status"
            >
              {[1, 2, 3, 4].map(
                (placeholder) => (
                  <div
                    className="admin-notification-skeleton h-[74px] animate-pulse rounded-xl motion-reduce:animate-none"
                    key={placeholder}
                  />
                ),
              )}
            </div>
          ) : null}

          {!error &&
          !isLoading &&
          notifications.length === 0 ? (
            <div className="admin-notification-state px-5 py-10 text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-xl">
                <AdminIcon
                  name="bell"
                  size={18}
                />
              </span>

              <p className="mt-3 text-xs font-bold">
                No notifications yet
              </p>

              <p className="mt-1 text-[10px]">
                New messages, leads, orders and
                consultations will appear here.
              </p>
            </div>
          ) : null}

          {!error &&
          notifications.length > 0 ? (
            <div className="admin-notification-list max-h-[min(62vh,430px)] overflow-y-auto p-1.5">
              {notifications.map(
                (notification) => {
                  const notificationId =
                    String(
                      notification?._id || "",
                    );

                  const isPending =
                    pendingNotificationId ===
                    notificationId;

                  return (
                    <article
                      className={`admin-notification-item relative rounded-xl ${
                        notification?.isRead
                          ? ""
                          : "admin-notification-item-unread"
                      }`}
                      key={notificationId}
                    >
                      <button
                        className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        onClick={() =>
                          handleOpenNotification(
                            notification,
                          )
                        }
                        type="button"
                      >
                        <span
                          aria-hidden="true"
                          className="admin-notification-type-icon mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl"
                        >
                          <AdminIcon
                            name={getNotificationIcon(
                              notification?.type,
                            )}
                            size={16}
                          />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-[11px] font-black">
                              {notification?.title ||
                                "Notification"}
                            </span>

                            {!notification?.isRead ? (
                              <span
                                aria-label="Unread"
                                className="admin-notification-unread-dot size-1.5 shrink-0 rounded-full"
                              />
                            ) : null}
                          </span>

                          <span className="mt-0.5 block text-[10px] leading-4">
                            {notification?.message ||
                              "New Admin activity."}
                          </span>

                          <time
                            className="mt-1 block text-[9px] font-semibold"
                            dateTime={
                              notification?.createdAt ||
                              undefined
                            }
                            title={getNotificationDateTitle(
                              notification?.createdAt,
                            )}
                          >
                            {formatNotificationTime(
                              notification?.createdAt,
                            )}
                          </time>
                        </span>
                      </button>

                      {!notification?.isRead ? (
                        <button
                          className="admin-notification-mark-one absolute bottom-2.5 right-2.5 rounded-md px-2 py-1 text-[9px] font-bold disabled:opacity-50"
                          disabled={isPending}
                          onClick={(event) =>
                            handleMarkRead(
                              event,
                              notificationId,
                            )
                          }
                          type="button"
                        >
                          {isPending
                            ? "..."
                            : "Mark read"}
                        </button>
                      ) : null}
                    </article>
                  );
                },
              )}
            </div>
          ) : null}

          {!error &&
          notifications.length > 0 &&
          isLoading ? (
            <div className="admin-notification-refreshing border-t px-4 py-1.5 text-center text-[9px] font-semibold">
              Refreshing...
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

export default AdminNotificationsMenu;
