function getSafeTargetPath(value) {
  const targetPath =
    typeof value === "string"
      ? value.trim()
      : "";

  return targetPath.startsWith("/admin/")
    ? targetPath
    : "/admin";
}

function readPushPayload(event) {
  if (!event.data) {
    return {};
  }

  try {
    return event.data.json();
  } catch {
    return {
      body: event.data.text(),
    };
  }
}

self.addEventListener(
  "push",
  (event) => {
    const payload =
      readPushPayload(event);

    const title =
      String(
        payload?.title || "RakeshNexify",
      ).trim() || "RakeshNexify";

    const body =
      String(
        payload?.body ||
          "New Admin activity.",
      ).trim() ||
      "New Admin activity.";

    const tag =
      String(
        payload?.tag ||
          "rnx-admin-notification",
      ).trim() ||
      "rnx-admin-notification";

    const targetPath =
      getSafeTargetPath(
        payload?.data?.targetPath,
      );

    const notificationOptions = {
      body,
      tag,
      renotify: true,
      silent: false,
      vibrate: [
        180,
        80,
        180,
      ],
      data: {
        ...(payload?.data || {}),
        targetPath,
      },
    };

    event.waitUntil(
      self.registration.showNotification(
        title,
        notificationOptions,
      ),
    );
  },
);

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const targetPath =
      getSafeTargetPath(
        event.notification?.data?.targetPath,
      );

    const targetUrl =
      new URL(
        targetPath,
        self.location.origin,
      ).href;

    event.waitUntil(
      (async () => {
        const windowClients =
          await self.clients.matchAll({
            type: "window",
            includeUncontrolled: true,
          });

        for (
          const windowClient of
          windowClients
        ) {
          if (
            new URL(
              windowClient.url,
            ).origin !==
            self.location.origin
          ) {
            continue;
          }

          if (
            "navigate" in windowClient
          ) {
            await windowClient.navigate(
              targetUrl,
            );
          }

          await windowClient.focus();
          return;
        }

        if (self.clients.openWindow) {
          await self.clients.openWindow(
            targetUrl,
          );
        }
      })(),
    );
  },
);
