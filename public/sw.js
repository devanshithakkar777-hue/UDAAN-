/* UDAAN service worker: caches the shell and the offline emergency toolkit. API responses and personal data are never cached. */
const CACHE = "udaan-shell-v1";
const SHELL = ["/safe", "/logo.png", "/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });

self.addEventListener("fetch", (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { if (url.pathname === "/safe") caches.open(CACHE).then((c) => c.put(req, r.clone())); return r; }).catch(() => caches.match("/safe")));
    return;
  }
  if (/\.(png|webmanifest|css|js|woff2?)$/.test(url.pathname) || url.pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return r; })));
  }
});

self.addEventListener("push", (e) => {
  let d = { title: "UDAAN", body: "", url: "/" };
  try { d = { ...d, ...e.data.json() }; } catch {}
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: "/icon-192.png", badge: "/icon-192.png", data: { url: d.url }, tag: "udaan" }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then((cs) => { const c = cs[0]; if (c) { c.focus(); return c.navigate(e.notification.data.url || "/"); } return self.clients.openWindow(e.notification.data.url || "/"); }));
});
