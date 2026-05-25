// Service worker para Web Push de PorraBros.
//
// Sólo escucha dos eventos:
//   - "push": cuando llega una notificación del servidor, la muestra.
//   - "notificationclick": al hacer click, abre la URL del payload (o /).
//
// El SW se registra desde el cliente con `navigator.serviceWorker.register("/sw.js")`
// y se inscribe en pushManager. El payload viene como JSON serializado por
// lib/push.ts → { title, body, url, tag, icon, badge }.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // payload no JSON: caemos a texto plano
    data = { title: "PorraBros", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "PorraBros";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag || undefined,
    data: { url: data.url || "/" },
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Si ya hay una ventana abierta en la app, le hacemos focus y navegamos.
      for (const c of all) {
        if (c.url.includes(self.location.origin)) {
          c.focus();
          if ("navigate" in c) c.navigate(url);
          return;
        }
      }
      // Si no, abrimos pestaña nueva.
      await self.clients.openWindow(url);
    })()
  );
});
