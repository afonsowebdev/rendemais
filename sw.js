/* Rende+ service worker — instalável + offline.
   Estratégia: network-first para pedidos GET do próprio domínio (online = sempre fresco,
   respeitando os deploys com ?v=). Em falha de rede, devolve a versão em cache.
   Não toca em pedidos cross-origin (fontes, BoxIcons CDN) nem na API (POST/PUT/DELETE). */
const CACHE = "rende-cache-v1";
const SHELL = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;                       // POST/PUT/DELETE (ex.: API) -> rede normal
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // CDN/fontes/API externa -> rede normal

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) =>
          cached || (req.mode === "navigate" ? caches.match("/") : Response.error())
        )
      )
  );
});
