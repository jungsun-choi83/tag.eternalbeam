/* eslint-disable no-undef */
self.addEventListener("push", function (event) {
  let payload = { title: "Eternal Beam", body: "", url: "/" };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Eternal Beam", {
      body: payload.body || "",
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});
