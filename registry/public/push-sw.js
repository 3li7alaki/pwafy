// Loaded into the generated service worker with importScripts (vite-plugin-pwa: `workbox.importScripts: ["push-sw.js"]`), so vite-plugin-pwa keeps
// writing the rest of it. A push must always show a notification: Safari revokes the subscription of a site
// that receives pushes and shows nothing, and Chrome shows its own "updated in the background" one instead.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(self.registration.showNotification(data.title || "New in your app", {
    body: data.body || "",
    icon: "/pwa-192x192.png",
    // Same tag replaces the last notification about the same thing instead of stacking a second one.
    tag: data.tag,
    data: { url: data.url || "/" },
  }));
});

// Opens the notification's page in the app if a window is open, else starts the app there.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (open) {
      try {
        await open.focus();
        await open.navigate(url);
        return;
      } catch {
        // navigate refuses a window this worker does not control yet; a fresh one does.
      }
    }
    await self.clients.openWindow(url);
  })());
});
