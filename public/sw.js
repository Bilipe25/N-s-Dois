self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};

    const title = data.title || "Nós Dois";
    const options = {
        body: data.body || "Nova notificação",
        icon: data.icon || "/favicon.ico",
        badge: data.icon || "/favicon.ico",
        image: data.image,
        tag: "nos-dois-notification", // Agrupa notificações para não spammar
        renotify: true, // Vibra/toca som mesmo se substituir uma antiga
        vibrate: [100, 50, 100], // Padrão de vibração
        requireInteraction: true, // Mantém na tela
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
            // Tenta focar em uma janela já aberta
            for (const client of clientList) {
                if ("focus" in client) {
                    // Se a URL bater, foca nela. Se não, navega.
                    if (client.url === event.notification.data.url) {
                        return client.focus();
                    }
                    return client.navigate(event.notification.data.url).then(c => c.focus());
                }
            }
            // Se não houver janela aberta, abre uma nova
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
