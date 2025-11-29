self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};

    const title = data.title || "Nós Dois";
    const options = {
        body: data.body || "Nova notificação",
        icon: "/icon.png", // Certifique-se de ter um ícone ou use um placeholder
        badge: "/icon.png",
        data: {
            url: data.url || "/"
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            // Tenta focar em uma janela já aberta
            for (const client of clientList) {
                if (client.url === event.notification.data.url && "focus" in client) {
                    return client.focus();
                }
            }
            // Se não houver janela aberta, abre uma nova
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
