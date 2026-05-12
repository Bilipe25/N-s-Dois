const CACHE_NAME = "nos-dois-v3";
const ASSETS_CACHE = "nos-dois-assets-v3";
const IMAGES_CACHE = "nos-dois-images-v3";

const STATIC_ASSETS = [
    "/manifest.json",
    "/favicon.ico",
    "/icon.svg"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (![CACHE_NAME, ASSETS_CACHE, IMAGES_CACHE].includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Ignorar requisições não-GET e APIs (exceto imagens)
    if (event.request.method !== "GET" || url.pathname.startsWith("/api/")) {
        return;
    }

    // Estratégia Cache-First para Imagens e Fontes
    if (event.request.destination === "image" || event.request.destination === "font") {
        event.respondWith(
            caches.open(IMAGES_CACHE).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    return fetch(event.request).then((networkResponse) => {
                        if (networkResponse.ok || networkResponse.type === "opaque") {
                            cache.put(event.request, networkResponse.clone()).catch(() => undefined);
                        }
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    const copy = networkResponse.clone();
                    caches.open(ASSETS_CACHE).then((cache) => cache.put(event.request, copy));
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Estratégia Stale-While-Revalidate para CSS e JS versionados pelo build.
    if (event.request.destination === "style" || event.request.destination === "script") {
        event.respondWith(
            caches.open(ASSETS_CACHE).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }
});

self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};

    const title = data.title || "Nós Dois";
    const options = {
        body: data.body || "Nova notificação",
        icon: data.icon || "/favicon.ico",
        badge: data.icon || "/favicon.ico",
        image: data.image,
        tag: "nos-dois-notification",
        renotify: true,
        vibrate: [100, 50, 100],
        requireInteraction: true,
        data: {
            url: data.url || "/"
        },
        actions: [
            { action: "open", title: "Ver Detalhes" },
            { action: "close", title: "Fechar" }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    if (event.action === "close") return;

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ("focus" in client) {
                    if (new URL(client.url).pathname === event.notification.data.url) {
                        return client.focus();
                    }
                    return client.navigate(event.notification.data.url).then(c => c.focus());
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
