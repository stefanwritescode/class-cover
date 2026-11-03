// Class Cover service worker: keeps the app's code and fonts on the phone so it opens fast,
// and shows a simple offline page. Signed-in pages are never cached (they hold personal data).
const CACHE = "cc-static-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Versioned build files and icons never change at the same URL: cache first.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/app-icon/")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(
        () =>
          new Response(
            '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title>' +
              '<body style="font-family:system-ui;background:#120A33;color:#F4F0FF;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">' +
              "<div><h1 style=\"margin:0 0 8px\">You're offline</h1><p>Class Cover needs a connection. Check your signal and try again.</p>" +
              '<button onclick="location.reload()" style="margin-top:12px;padding:12px 20px;border-radius:999px;border:0;background:#FF3EA5;color:#fff;font-weight:600">Try again</button></div>',
            { headers: { "Content-Type": "text/html; charset=utf-8" } },
          ),
      ),
    );
  }
});
